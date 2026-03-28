"""
SkincareIQ — Chemical Conflict Detection Engine

Independent of the Gemini API. Normalizes raw INCI ingredient strings to
canonical keys via a synonym map, looks up known chemistry-based conflicts
in a curated database, and optionally verifies unrecognized ingredients
against the PubChem public API (NIH).

Findings are injected into the Gemini prompt as grounding context so the
model's output is anchored to real chemistry rather than generated freely.
"""

from __future__ import annotations

import re
import json as _json
import urllib.request
import urllib.parse
import urllib.error
from typing import Optional


# ---------------------------------------------------------------------------
# 1.  SYNONYM MAP
#     Maps canonical ingredient key → list of INCI substrings that identify it.
#     Matching is case-insensitive substring search after stripping annotations.
# ---------------------------------------------------------------------------

SYNONYMS: dict[str, list[str]] = {
    "retinol": [
        "retinol",
        "retinyl palmitate",
        "retinyl acetate",
        "retinyl linoleate",
        "retinaldehyde",
        "retinal ",          # trailing space prevents matching "retinal" inside other words
        "tretinoin",
        "adapalene",
        "tazarotene",
        "isotretinoin",
        "hydroxypinacolone retinoate",
        "granactive retinoid",
    ],
    "aha": [
        "glycolic acid",
        "lactic acid",
        "mandelic acid",
        "malic acid",
        "tartaric acid",
        "phytic acid",
        "alpha hydroxy acid",
        "alpha-hydroxy acid",
    ],
    "bha": [
        "salicylic acid",
        "beta hydroxy acid",
        "beta-hydroxy acid",
        "betaine salicylate",
        "willow bark",
    ],
    "pha": [
        "gluconolactone",
        "lactobionic acid",
        "galactose",
        "polyhydroxy acid",
    ],
    "bpo": [
        "benzoyl peroxide",
    ],
    "vitc": [
        "ascorbic acid",
        "l-ascorbic acid",
        "sodium ascorbyl phosphate",
        "magnesium ascorbyl phosphate",
        "ascorbyl glucoside",
        "ascorbyl tetraisopalmitate",
        "3-o-ethyl ascorbic acid",
        "ethyl ascorbic acid",
        "ascorbyl palmitate",
    ],
    "niacinamide": [
        "niacinamide",
        "nicotinamide",
    ],
    "copper_peptides": [
        "copper tripeptide",
        "copper peptide",
        "cu-ghk",
        "ghk-cu",
        "copper gluconate",
    ],
    "vitamin_e": [
        "tocopherol",
        "tocopheryl acetate",
        "tocotrienol",
    ],
    "hydroquinone": [
        "hydroquinone",
    ],
    "azelaic_acid": [
        "azelaic acid",
    ],
    "kojic_acid": [
        "kojic acid",
    ],
    "ceramides": [
        "ceramide np",
        "ceramide ap",
        "ceramide eop",
        "ceramide ng",
        "ceramide ns",
        "ceramide ",
    ],
    "spf_actives": [
        "zinc oxide",
        "titanium dioxide",
        "avobenzone",
        "octinoxate",
        "oxybenzone",
        "octocrylene",
        "tinosorb",
        "mexoryl",
    ],
    "peptides": [
        "palmitoyl tripeptide",
        "palmitoyl tetrapeptide",
        "acetyl hexapeptide",
        "matrixyl",
        "argireline",
        "leuphasyl",
        "syn-ake",
    ],
    "niacinamide": [
        "niacinamide",
        "nicotinamide",
    ],
}


# ---------------------------------------------------------------------------
# 2.  CONFLICT DATABASE
#     Keys are frozensets of two canonical ingredient keys so order doesn't
#     matter. severity: "high" | "moderate" | "low".
# ---------------------------------------------------------------------------

CONFLICT_DB: dict[frozenset, dict] = {
    frozenset({"retinol", "bpo"}): {
        "severity": "high",
        "mechanism": "oxidation",
        "explanation": (
            "Benzoyl peroxide oxidizes retinol molecules, destroying their activity "
            "and rendering the retinoid ineffective. Combined use also dramatically "
            "increases barrier stress and irritation."
        ),
        "recommendation": (
            "Use benzoyl peroxide in the morning routine only. Apply retinol at night "
            "on separate evenings where no BPO residue remains."
        ),
        "source": "Draelos ZD, J Cosmet Dermatol, 2006",
    },
    frozenset({"retinol", "aha"}): {
        "severity": "high",
        "mechanism": "over_exfoliation",
        "explanation": (
            "Retinoids and AHA exfoliants both accelerate epidermal cell turnover. "
            "Used together, the cumulative exfoliation load causes redness, peeling, "
            "sensitization, and significant barrier disruption."
        ),
        "recommendation": (
            "Alternate nights: retinoid on Mon/Wed/Fri, AHA on Tue/Thu. "
            "Never apply both in the same routine step."
        ),
        "source": "Leyden JJ et al., Cutis, 2017",
    },
    frozenset({"retinol", "bha"}): {
        "severity": "high",
        "mechanism": "over_exfoliation",
        "explanation": (
            "Salicylic acid (BHA) penetrates pores and increases cell turnover. "
            "Combined with a retinoid, the total exfoliation burden causes irritation, "
            "barrier damage, and potential post-inflammatory hyperpigmentation."
        ),
        "recommendation": (
            "Alternate: retinoid on Mon/Wed/Fri, BHA on Tue/Thu, "
            "or use BHA in the morning and retinoid at night on separate days."
        ),
        "source": "Mukherjee S et al., Clin Interv Aging, 2006",
    },
    frozenset({"bpo", "vitc"}): {
        "severity": "high",
        "mechanism": "oxidation",
        "explanation": (
            "Benzoyl peroxide is a strong oxidizer that destroys ascorbic acid "
            "(Vitamin C), producing pro-oxidant byproducts and completely negating "
            "the antioxidant benefit of the Vitamin C product."
        ),
        "recommendation": (
            "Apply Vitamin C in the morning (where it provides antioxidant protection) "
            "and benzoyl peroxide in the evening only."
        ),
        "source": "Pinnell SR, Dermatol Surg, 2005",
    },
    frozenset({"hydroquinone", "bpo"}): {
        "severity": "high",
        "mechanism": "oxidation",
        "explanation": (
            "Benzoyl peroxide oxidizes hydroquinone, turning it brown-orange and "
            "completely destroying its melanin-inhibiting activity."
        ),
        "recommendation": (
            "Do not combine. Use hydroquinone exclusively in the evening and avoid "
            "benzoyl peroxide while actively using a hydroquinone product."
        ),
        "source": "Kligman AM, J Am Acad Dermatol, 1975",
    },
    frozenset({"vitc", "copper_peptides"}): {
        "severity": "moderate",
        "mechanism": "oxidation",
        "explanation": (
            "Copper ions act as a catalyst for ascorbic acid oxidation. "
            "Combining Vitamin C and copper peptides accelerates Vitamin C degradation "
            "and can reduce the regenerative benefit of the peptide complex."
        ),
        "recommendation": (
            "Use Vitamin C in the morning and copper peptides in the evening, "
            "or alternate days."
        ),
        "source": "Pickart L, J Biomater Sci Polym Ed, 2008",
    },
    frozenset({"copper_peptides", "aha"}): {
        "severity": "moderate",
        "mechanism": "chelation",
        "explanation": (
            "AHA exfoliants are acidic and can chelate (bind and remove) copper ions "
            "from copper tripeptide complexes, destabilizing the peptide and reducing "
            "its regenerative and wound-healing efficacy."
        ),
        "recommendation": (
            "Apply copper peptides in the morning and AHAs in the evening, "
            "keeping at least several hours between application."
        ),
        "source": "Pickart L & Margolina A, Cosmetics, 2018",
    },
    frozenset({"copper_peptides", "bha"}): {
        "severity": "moderate",
        "mechanism": "chelation",
        "explanation": (
            "Salicylic acid may chelate copper ions from peptide complexes at low pH, "
            "reducing the efficacy of the copper tripeptide."
        ),
        "recommendation": (
            "Separate copper peptides and BHA into different routine slots."
        ),
        "source": "Pickart L & Margolina A, Cosmetics, 2018",
    },
    frozenset({"vitc", "aha"}): {
        "severity": "moderate",
        "mechanism": "ph_conflict",
        "explanation": (
            "L-ascorbic acid requires a pH below 3.5 for optimal activity. "
            "AHAs also operate at low pH. Stacking them increases total acidity and "
            "cumulative irritation beyond what either causes individually."
        ),
        "recommendation": (
            "Apply with a 20-minute gap between products, or use on alternate days. "
            "Buffered Vitamin C derivatives (e.g. sodium ascorbyl phosphate) are more "
            "pH-tolerant and pair more easily."
        ),
        "source": "Telang PS, Indian Dermatol Online J, 2013",
    },
    frozenset({"aha", "bha"}): {
        "severity": "moderate",
        "mechanism": "over_exfoliation",
        "explanation": (
            "Using two exfoliants in the same routine significantly raises the total "
            "exfoliation burden, increasing the risk of sensitization, redness, "
            "and barrier damage — especially for sensitive skin types."
        ),
        "recommendation": (
            "Choose one exfoliant per routine session. "
            "Alternate AHA and BHA on different nights if you use both."
        ),
        "source": "Kornhauser A et al., J Investig Dermatol Symp Proc, 2010",
    },
    frozenset({"vitc", "niacinamide"}): {
        "severity": "low",
        "mechanism": "efficacy_reduction",
        "explanation": (
            "Historically believed to form nicotinic acid (niacin) when mixed, "
            "causing flushing and reducing stability of both actives. "
            "Modern evidence largely disproves this at normal use concentrations, "
            "but high-concentration formulas may still interact at elevated temperatures."
        ),
        "recommendation": (
            "Generally safe to use together. If using both at high concentrations, "
            "apply separately or choose a product that combines them in a stable formulation."
        ),
        "source": "Hakozaki T et al., Br J Dermatol, 2002",
    },
    frozenset({"kojic_acid", "bpo"}): {
        "severity": "moderate",
        "mechanism": "oxidation",
        "explanation": (
            "Benzoyl peroxide can oxidize kojic acid, reducing its tyrosinase-inhibiting "
            "activity and skin-brightening efficacy."
        ),
        "recommendation": (
            "Apply kojic acid in the evening without benzoyl peroxide present."
        ),
        "source": "Burnett CL et al., Int J Toxicol, 2010",
    },
    frozenset({"retinol", "vitc"}): {
        "severity": "low",
        "mechanism": "ph_conflict",
        "explanation": (
            "L-ascorbic acid is most stable and active at pH < 3.5, while retinoids "
            "are typically formulated at a higher pH. Applying them together may "
            "compromise one or both actives' stability. Not dangerous, but potentially "
            "wasteful of expensive actives."
        ),
        "recommendation": (
            "Apply Vitamin C in the morning and retinol in the evening for optimal "
            "stability and activity of both."
        ),
        "source": "Telang PS, Indian Dermatol Online J, 2013",
    },
    frozenset({"peptides", "aha"}): {
        "severity": "low",
        "mechanism": "ph_conflict",
        "explanation": (
            "Peptides are generally most stable at a neutral to slightly acidic pH. "
            "Highly acidic AHA formulas can degrade peptide bonds over time, "
            "reducing efficacy."
        ),
        "recommendation": (
            "Apply peptides after the skin's pH has normalized following AHA use, "
            "or use them in different routine slots."
        ),
        "source": "Robinson LR et al., Int J Cosmet Sci, 2005",
    },
}


# ---------------------------------------------------------------------------
# 3.  INCI NORMALIZER
# ---------------------------------------------------------------------------

def _clean(text: str) -> str:
    """Strip INCI annotations (brackets, asterisks, numbers in parentheses)."""
    text = re.sub(r"[\[\(][^\]\)]{0,60}[\]\)]", " ", text)
    text = re.sub(r"\*+", " ", text)
    return text.lower().strip()


def normalize(ingredient: str) -> Optional[str]:
    """
    Map a raw INCI ingredient string to a canonical key.
    Returns None if no synonym matches.
    """
    cleaned = _clean(ingredient)
    for key, synonyms in SYNONYMS.items():
        for syn in synonyms:
            if syn in cleaned:
                return key
    return None


def normalize_list(ingredients: list[str]) -> set[str]:
    """Return the set of canonical keys present in an ingredient list."""
    keys: set[str] = set()
    for ing in ingredients:
        key = normalize(ing)
        if key:
            keys.add(key)
    return keys


def unrecognized_actives(ingredients: list[str]) -> list[str]:
    """
    Return ingredients that look like potential actives but were not
    matched by the synonym map — candidates for PubChem lookup.
    """
    active_signals = re.compile(
        r"acid|peptide|retino|ascorb|hydroxy|peroxide|niacin|quinone|azelai|kojic",
        re.IGNORECASE,
    )
    return [
        ing for ing in ingredients
        if active_signals.search(ing) and normalize(ing) is None
    ]


# ---------------------------------------------------------------------------
# 4.  CONFLICT FINDER
# ---------------------------------------------------------------------------

def find_conflicts(product_ingredient_lists: list[list[str]]) -> list[dict]:
    """
    Given one ingredient list per product, return all known conflicts
    between canonical keys present across the combined set.

    Results are sorted by severity (high → moderate → low).
    """
    all_keys: set[str] = set()
    for ings in product_ingredient_lists:
        all_keys |= normalize_list(ings)

    found: list[dict] = []
    for pair, conflict_data in CONFLICT_DB.items():
        a, b = tuple(pair)
        if a in all_keys and b in all_keys:
            found.append({"canonical_pair": sorted([a, b]), **conflict_data})

    severity_order = {"high": 0, "moderate": 1, "low": 2}
    found.sort(key=lambda x: severity_order.get(x["severity"], 3))
    return found


# ---------------------------------------------------------------------------
# 5.  PUBCHEM LOOKUP  (stdlib only — no extra dependencies)
# ---------------------------------------------------------------------------

def pubchem_lookup(ingredient_name: str) -> Optional[dict]:
    """
    Look up a single ingredient name on the PubChem PUG REST API (NIH).
    Returns a dict with CID, molecular formula, and IUPAC name, or None
    if the ingredient is not found or the request times out.

    Used to identify and classify ingredients not in the local synonym map.
    """
    encoded = urllib.parse.quote(ingredient_name.strip())
    url = (
        f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/"
        f"{encoded}/property/MolecularFormula,IUPACName,CanonicalSMILES/JSON"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "SkincareIQ-ConflictEngine/1.0"})
        with urllib.request.urlopen(req, timeout=3) as response:
            raw = response.read().decode("utf-8")
        data = _json.loads(raw)
        props = data["PropertyTable"]["Properties"][0]
        return {
            "name": ingredient_name,
            "cid": props.get("CID"),
            "molecular_formula": props.get("MolecularFormula"),
            "iupac_name": props.get("IUPACName"),
            "canonical_smiles": props.get("CanonicalSMILES"),
        }
    except Exception:
        return None


def pubchem_enrich(ingredient_lists: list[list[str]], max_lookups: int = 3) -> list[dict]:
    """
    Identify up to `max_lookups` unrecognized active-looking ingredients
    via PubChem. Returns a list of PubChem result dicts (may be empty).
    """
    all_ingredients: list[str] = [ing for ings in ingredient_lists for ing in ings]
    candidates = unrecognized_actives(all_ingredients)
    # Deduplicate, take the most interesting ones first
    seen: set[str] = set()
    unique: list[str] = []
    for c in candidates:
        key = c.lower().strip()
        if key not in seen:
            seen.add(key)
            unique.append(c)

    results: list[dict] = []
    for candidate in unique[:max_lookups]:
        result = pubchem_lookup(candidate)
        if result:
            results.append(result)
    return results


# ---------------------------------------------------------------------------
# 6.  PROMPT FORMATTER
# ---------------------------------------------------------------------------

def summarize_for_prompt(
    conflicts: list[dict],
    pubchem_data: Optional[list[dict]] = None,
) -> str:
    """
    Return a text block to inject into the Gemini prompt as grounding context.
    The model is instructed to expand on these findings, not ignore them.
    """
    lines: list[str] = []

    if conflicts:
        lines.append(
            "=== Pre-computed conflict scan (grounding context — "
            "incorporate and expand on these in your response) ==="
        )
        for c in conflicts:
            a, b = c["canonical_pair"]
            lines.append(
                f"CONFLICT: {a} + {b} | severity={c['severity']} | "
                f"mechanism={c['mechanism']} | {c['explanation']} "
                f"[Source: {c.get('source', 'n/a')}]"
            )
    else:
        lines.append(
            "=== Pre-computed conflict scan: "
            "no matches found in the local conflict database for this ingredient set. "
            "Apply your own chemical reasoning. ==="
        )

    if pubchem_data:
        lines.append("\n=== PubChem-verified ingredient data ===")
        for entry in pubchem_data:
            lines.append(
                f"INGREDIENT: {entry['name']} | CID={entry['cid']} | "
                f"formula={entry['molecular_formula']} | IUPAC={entry['iupac_name']}"
            )

    return "\n".join(lines)
