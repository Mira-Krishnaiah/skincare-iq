const routes = {
  "#/": "page-home",
  "#/profile": "page-profile",
  "#/products": "page-products",
  "#/analysis": "page-analysis",
  "#/routine": "page-routine"
};

const skinTypes = ["Oily", "Dry", "Combination", "Normal", "Sensitive"];
const concerns = [
  "Acne",
  "Dark Spots",
  "Fine Lines",
  "Wrinkles",
  "Redness",
  "Large Pores",
  "Dullness",
  "Texture"
];
const sensitivities = [
  "Fragrance",
  "Essential Oils",
  "Alcohol",
  "Sulfates",
  "Parabens",
  "Retinoids",
  "AHAs/BHAs",
  "Vitamin C"
];


const BACKEND_URL = "https://skincare-iq-api-709197932075.us-central1.run.app/analyze";

// Mirrors the canonical synonym keys from conflict_engine.py (key terms only)
const CANONICAL_SYNONYMS = {
  retinol:         ["retinol", "retinyl", "tretinoin", "adapalene", "retinoate", "retinal"],
  aha:             ["glycolic", "lactic acid", "mandelic", "alpha hydroxy"],
  bha:             ["salicylic", "beta hydroxy", "betaine salicylate", "willow bark"],
  bpo:             ["benzoyl peroxide"],
  vitc:            ["ascorbic acid", "ascorbyl", "vitamin c"],
  niacinamide:     ["niacinamide", "nicotinamide"],
  copper_peptides: ["copper tripeptide", "copper peptide", "ghk-cu", "cu-ghk"],
  hydroquinone:    ["hydroquinone"],
  kojic_acid:      ["kojic acid"],
  peptides:        ["palmitoyl tripeptide", "palmitoyl tetrapeptide", "matrixyl", "argireline"],
  pha:             ["gluconolactone", "lactobionic"],
};

function ingredientToCanonicalKey(text) {
  const lower = text.toLowerCase();
  for (const [key, synonyms] of Object.entries(CANONICAL_SYNONYMS)) {
    if (synonyms.some((syn) => lower.includes(syn))) return key;
  }
  return null;
}

// Returns {source, mechanism} if conflict was pre-detected by the chemistry engine, else null
function findEngineDetection(geminiConflict, preConflicts) {
  if (!preConflicts || !preConflicts.length) return null;
  const ings = geminiConflict.ingredients || [];
  const keys = ings.map(ingredientToCanonicalKey).filter(Boolean);
  for (const pre of preConflicts) {
    const pair = pre.canonical_pair || [];
    if (pair.length === 2 && keys.includes(pair[0]) && keys.includes(pair[1])) {
      return { source: pre.source || null, mechanism: pre.mechanism || null };
    }
  }
  return null;
}

const appState = {
  profile: {
    skinType: "",
    concerns: [],
    sensitivities: [],
    goals: []
  },
  products: [],
  geminiResult: null,
  preConflicts: []
};

function $(id) {
  return document.getElementById(id);
}

function navigate(route) {
  window.location.hash = route;
}

function currentRoute() {
  return routes[window.location.hash] ? window.location.hash : "#/";
}

function renderRoute() {
  const route = currentRoute();
  const pageId = routes[route];

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  const activePage = document.getElementById(pageId);
  if (activePage) activePage.classList.add("active");

  const startOverLink = $("startOverLink");
  if (route === "#/") {
    startOverLink.style.visibility = "hidden";
  } else {
    startOverLink.style.visibility = "visible";
  }

  if (route === "#/profile") renderProfilePage();
  if (route === "#/products") renderProductsPage();
  if (route === "#/analysis") renderAnalysisPage();
  if (route === "#/routine") renderRoutinePage();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderProfilePage() {
  const skinTypeGrid = $("skinTypeGrid");
  const concernsGrid = $("concernsGrid");
  const sensitivitiesGrid = $("sensitivitiesGrid");

  skinTypeGrid.innerHTML = "";
  concernsGrid.innerHTML = "";
  sensitivitiesGrid.innerHTML = "";

  skinTypes.forEach((type) => {
    const button = document.createElement("button");
    button.className = "skin-type-option";
    if (appState.profile.skinType === type) {
      button.classList.add("selected");
    }
    button.textContent = type;
    button.addEventListener("click", () => {
      appState.profile.skinType = type;
      renderProfilePage();
    });
    skinTypeGrid.appendChild(button);
  });

  concerns.forEach((concern) => {
    concernsGrid.appendChild(
      buildCheckboxItem(
        concern,
        appState.profile.concerns.includes(concern),
        () => toggleArrayValue(appState.profile.concerns, concern)
      )
    );
  });

  sensitivities.forEach((sensitivity) => {
    sensitivitiesGrid.appendChild(
      buildCheckboxItem(
        sensitivity,
        appState.profile.sensitivities.includes(sensitivity),
        () => toggleArrayValue(appState.profile.sensitivities, sensitivity)
      )
    );
  });
}

function buildCheckboxItem(label, checked, onChange) {
  const wrapper = document.createElement("label");
  wrapper.className = "checkbox-item";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", onChange);

  const span = document.createElement("span");
  span.textContent = label;

  wrapper.appendChild(input);
  wrapper.appendChild(span);
  return wrapper;
}

function toggleArrayValue(arr, value) {
  const index = arr.indexOf(value);
  if (index >= 0) {
    arr.splice(index, 1);
  } else {
    arr.push(value);
  }
}

function renderProductsPage() {
  $("productCount").textContent = `(${appState.products.length})`;

  const selectedGrid = $("selectedProductsGrid");
  const emptyShelfCard = $("emptyShelfCard");
  const analyzeBtn = $("analyzeRoutineBtn");

  selectedGrid.innerHTML = "";

  if (appState.products.length === 0) {
    emptyShelfCard.classList.remove("hidden");
    analyzeBtn.classList.add("hidden");
  } else {
    emptyShelfCard.classList.add("hidden");
    analyzeBtn.classList.remove("hidden");

    appState.products.forEach((product) => {
      const card = document.createElement("article");
      card.className = "selected-product-card";
      card.innerHTML = `
        <div class="selected-product-top">
          <div>
            <p class="selected-product-name">${escapeHtml(product.name)}</p>
            <p class="selected-product-brand">${escapeHtml(product.brand)}</p>
            <div class="result-meta">
              <span class="pill ${product.category.toLowerCase()}">${escapeHtml(product.category)}</span>
              <span class="search-meta">${product.ingredients.length} ingredients</span>
            </div>
          </div>
          <button class="remove-btn" aria-label="Remove product">×</button>
        </div>
      `;
      card.querySelector(".remove-btn").addEventListener("click", () => {
        appState.products = appState.products.filter((p) => p.id !== product.id);
        renderProductsPage();
      });
      selectedGrid.appendChild(card);
    });
  }
}

function addProductToShelf(product) {
  if (appState.products.length >= 4) {
    alert("You can add up to 4 products.");
    return;
  }
  if (appState.products.some((p) => p.name === product.name)) return;
  appState.products.push({
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    ...product
  });
  $("productSearch").value = "";
  $("searchResultsWrap").classList.add("hidden");
  $("searchEmpty").classList.add("hidden");
  renderProductsPage();
}

function renderSearchRow(product) {
  const row = document.createElement("div");
  row.className = "search-result";
  const ingredientCount = product.ingredients.length;
  row.innerHTML = `
    <div>
      <strong>${escapeHtml(product.name)}</strong>
      <div class="result-meta">
        <span class="search-meta">${escapeHtml(product.brand)}</span>
        <span class="pill">${escapeHtml(product.category)}</span>
        ${ingredientCount ? `<span class="search-meta">${ingredientCount} ingredients</span>` : ""}
      </div>
    </div>
    <button class="add-btn" aria-label="Add product">+</button>
  `;
  row.querySelector(".add-btn").addEventListener("click", () => addProductToShelf(product));
  return row;
}

async function searchProducts() {
  const rawQuery = $("productSearch").value.trim();
  const query = rawQuery.toLowerCase();
  const resultsWrap = $("searchResultsWrap");
  const searchEmpty = $("searchEmpty");
  const searchResults = $("searchResults");
  const searchMeta = $("searchMeta");

  searchResults.innerHTML = "";
  resultsWrap.classList.add("hidden");
  searchEmpty.classList.add("hidden");

  if (!query) return;

  searchMeta.textContent = "Searching...";
  resultsWrap.classList.remove("hidden");

  let products = [];

  try {
    const url = `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(rawQuery)}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,brands,categories_tags,ingredients_text`;
    const res = await fetch(url);
    const data = await res.json();

    products = (data.products || [])
      .filter((p) => p.product_name)
      .map((p) => {
        const ingredientsList = (p.ingredients_text || "")
          .split(/,|;/)
          .map((s) => s.replace(/\*|\[|\]/g, "").trim())
          .filter(Boolean);
        const categoryTag = (p.categories_tags || [])[0] || "";
        const category = categoryTag.replace(/^en:/, "").replace(/-/g, " ");
        return {
          name: p.product_name.trim(),
          brand: (p.brands || "").split(",")[0].trim(),
          category: category || "Skincare",
          ingredients: ingredientsList
        };
      })
      .filter((p) => p.name);
  } catch (_) {
    // API unavailable — fall through to custom product option
  }

  searchResults.innerHTML = "";

  if (!products.length) {
    const custom = {
      name: rawQuery,
      brand: "",
      category: "Skincare",
      ingredients: []
    };
    const row = renderSearchRow(custom);
    row.querySelector(".result-meta .search-meta").textContent = "Not in database — Gemini will analyze by name (no ingredient-level checks)";
    searchResults.appendChild(row);
    searchMeta.textContent = "No results in Open Beauty Facts — you can still add it by name";
    return;
  }

  searchMeta.textContent = `${products.length} product${products.length !== 1 ? "s" : ""} found`;

  products.forEach((product) => {
    searchResults.appendChild(renderSearchRow(product));
  });

  // Always offer adding the exact typed name too
  const customRow = document.createElement("div");
  customRow.className = "search-result";
  customRow.innerHTML = `
    <div>
      <strong>${escapeHtml(rawQuery)}</strong>
      <div class="result-meta"><span class="search-meta">Add by name — Gemini will analyze, no ingredient-level checks</span></div>
    </div>
    <button class="add-btn" aria-label="Add product">+</button>
  `;
  customRow.querySelector(".add-btn").addEventListener("click", () => addProductToShelf({
    name: rawQuery, brand: "", category: "Skincare", ingredients: []
  }));
  searchResults.appendChild(customRow);

}


async function verifyAlternativeWithOBF(suggestion) {
  const query = [suggestion.brand, suggestion.product_name].filter(Boolean).join(" ").trim();
  try {
    const url = `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5&fields=product_name,brands,ingredients_text`;
    const res = await fetch(url);
    const data = await res.json();
    const products = (data.products || []).filter((p) => p.product_name);
    if (!products.length) return { ...suggestion, ingredients: [], verified: false };
    const best = products[0];
    const ingredients = (best.ingredients_text || "")
      .split(/,|;/)
      .map((s) => s.replace(/\*|\[|\]/g, "").trim())
      .filter(Boolean);
    return {
      ...suggestion,
      verifiedName: best.product_name.trim(),
      ingredients,
      verified: true
    };
  } catch (_) {
    return { ...suggestion, ingredients: [], verified: false };
  }
}

function renderAlternativesSidebar(alternatives) {
  const sidebar = $("alternativesSidebar");
  const body = $("alternativesSidebarBody");
  const mobileToggle = $("mobileSidebarToggleBtn");
  body.innerHTML = "";

  if (!alternatives.length) {
    sidebar.classList.add("hidden");
    if (mobileToggle) mobileToggle.classList.add("hidden");
    sidebar.classList.remove("mobile-open");
    return;
  }

  alternatives.forEach((alt) => {
    const card = document.createElement("article");
    card.className = "alt-product-card";

    const replacesList = alt.covers_both
      ? (alt.covers_products || []).join(" + ")
      : (alt.replaces_product || "");

    const replacesLabel = alt.covers_both
      ? `Replaces both: ${escapeHtml(replacesList)}`
      : `Replaces: ${escapeHtml(replacesList)}`;

    const verificationBadge = alt.verified
      ? `<span class="alt-verified-badge">✓ Ingredients verified via Open Beauty Facts</span>`
      : `<span class="alt-unverified-badge">~ AI-suggested (not yet in OBF database)</span>`;

    const ingredientLine = alt.verified && alt.ingredients.length
      ? `<p class="alt-ingredient-count">${alt.ingredients.length} ingredients confirmed</p>`
      : "";

    card.innerHTML = `
      <span class="alt-replaces-label">${replacesLabel}</span>
      <p class="alt-product-name">${escapeHtml(alt.verifiedName || alt.product_name || "")}</p>
      <p class="alt-product-brand">${escapeHtml(alt.brand || "")}</p>
      <p class="alt-why-safer">${escapeHtml(alt.why_safer || "")}</p>
      ${verificationBadge}
      ${ingredientLine}
      <button class="btn btn-primary btn-sm alt-add-btn">Add to Shelf →</button>
    `;

    card.querySelector(".alt-add-btn").addEventListener("click", () => {
      // Remove the product(s) being replaced
      const toRemove = alt.covers_both
        ? (alt.covers_products || [])
        : [alt.replaces_product].filter(Boolean);

      toRemove.forEach((targetName) => {
        const targetLower = targetName.toLowerCase().slice(0, 20);
        appState.products = appState.products.filter(
          (p) => !p.name.toLowerCase().includes(targetLower)
        );
      });

      // Add the alternative to the shelf
      const product = {
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        name: alt.verifiedName || alt.product_name || "",
        brand: alt.brand || "",
        category: alt.category || "Skincare",
        ingredients: alt.ingredients || []
      };
      if (!appState.products.some((p) => p.name === product.name)) {
        appState.products.push(product);
      }

      navigate("#/products");
    });

    body.appendChild(card);
  });

  // Desktop: remove hidden so the sidebar shows in the flex layout
  sidebar.classList.remove("hidden");
  // Mobile: don't auto-expand — show the toggle button instead
  if (mobileToggle) mobileToggle.classList.remove("hidden");
}

async function renderAnalysisPage() {
  const conflictsList = $("conflictsList");
  const flaggedWrap = $("flaggedIngredients");
  const recsWrap = $("analysisRecommendations");
  const highPriorityText = $("highPriorityText");

  if (!appState.products.length) {
    navigate("#/products");
    return;
  }

  $("analysisLoading").classList.remove("hidden");
  conflictsList.innerHTML = "";
  flaggedWrap.innerHTML = "";
  recsWrap.innerHTML = "";
  const subtitleEl = $("analysisSubtitle");
  if (subtitleEl) subtitleEl.textContent = "Analyzing your routine\u2026";

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products: appState.products.map((p) =>
          p.ingredients.length ? `${p.name} (${p.ingredients.join(", ")})` : p.name
        ),
        profile: {
          skin_type: appState.profile.skinType || null,
          concerns: appState.profile.concerns.length ? appState.profile.concerns : null,
          sensitivities: appState.profile.sensitivities.length ? appState.profile.sensitivities : null
        }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Request failed: ${response.status}`);
    }

    const data = await response.json();
    const result = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
    appState.geminiResult = result;
    appState.preConflicts = data.pre_conflicts || [];

    $("analysisLoading").classList.add("hidden");

    const conflicts = result.ingredient_conflicts || [];
    const flagged = result.flagged_ingredients || [];

    const subtitle = $("analysisSubtitle");
    if (subtitle) {
      const highCount = conflicts.filter((c) => String(c.severity || "").toLowerCase() === "high").length;
      if (!conflicts.length) {
        subtitle.textContent = "No major interactions detected — your routine looks compatible.";
      } else if (highCount > 0) {
        subtitle.textContent = `We found ${highCount} high-severity interaction${highCount > 1 ? "s" : ""} in your routine — review the details below.`;
      } else {
        subtitle.textContent = `We found ${conflicts.length} interaction${conflicts.length > 1 ? "s" : ""} in your routine and tailored the results to your skin profile.`;
      }
    }

    // Populate analysis page summary cards dynamically
    const highConflict = conflicts.find((c) => String(c.severity || "").toLowerCase() === "high");
    const medConflict  = conflicts.find((c) => {
      const s = String(c.severity || "").toLowerCase();
      return s === "moderate" || s === "medium";
    });

    highPriorityText.textContent =
      highConflict?.explanation ||
      conflicts[0]?.explanation ||
      result.overall_summary ||
      "No major high-risk conflicts detected.";

    const analysisSummaryCards = document.querySelectorAll("#page-analysis .analysis-top-grid .summary-card");
    if (analysisSummaryCards.length >= 2) {
      // Card 2: medium conflict or routine tip
      const card2H4 = analysisSummaryCards[1].querySelector("h4");
      const card2P  = analysisSummaryCards[1].querySelector("p");
      if (medConflict) {
        if (card2H4) card2H4.textContent = "Medium-Risk Combination";
        if (card2P)  card2P.textContent  = medConflict.explanation || medConflict.time_separation_advice || "";
      } else {
        const synergy = (result.ingredient_synergies || [])[0];
        if (card2H4) card2H4.textContent = synergy ? "Ingredient Synergy" : "Routine Tip";
        if (card2P)  card2P.textContent  = synergy?.explanation || (result.routine_recommendations || [])[0] || "Morning SPF helps protect actives from UV degradation.";
      }
    }
    if (analysisSummaryCards.length >= 3) {
      // Card 3: barrier or overall summary
      const card3H4 = analysisSummaryCards[2].querySelector("h4");
      const card3P  = analysisSummaryCards[2].querySelector("p");
      if (card3H4) card3H4.textContent = result.barrier_assessment ? "Barrier Assessment" : "Overall Summary";
      if (card3P)  card3P.textContent  = result.barrier_assessment || result.overall_summary || "Your routine has been analyzed for compatibility.";
    }

    // Note any products added by name only (no ingredient list from OBF)
    const nameOnlyProducts = appState.products.filter((p) => !p.ingredients || !p.ingredients.length);
    if (nameOnlyProducts.length) {
      const note = document.createElement("p");
      note.className = "name-only-note";
      note.textContent = `Note: ${nameOnlyProducts.map((p) => p.name).join(", ")} ${nameOnlyProducts.length > 1 ? "were" : "was"} analyzed by product name only — no ingredient list found. Chemistry engine checks are skipped for ${nameOnlyProducts.length > 1 ? "these products" : "this product"}.`;
      conflictsList.appendChild(note);
    }

    if (!conflicts.length && !flagged.length) {
      const card = document.createElement("article");
      card.className = "conflict-card low";
      card.innerHTML = `
        <div class="conflict-head">
          <p class="conflict-title">No Major Conflicts Detected</p>
          <span class="legend-pill low">low</span>
        </div>
        <div class="conflict-body">
          <p><strong>Why it matters:</strong> Your product combination appears broadly compatible.</p>
          <p><strong>Recommendation:</strong> Patch test new products and monitor for sensitivity.</p>
        </div>
      `;
      conflictsList.appendChild(card);
    }

    const riskIcon = { high: "⚠", medium: "☼", low: "✓" };
    const riskLabel = { high: "High Risk", medium: "Medium Risk", low: "Safe" };

    conflicts.forEach((conflict) => {
      const raw = String(conflict.severity || "medium").toLowerCase();
      const level = raw === "moderate" ? "medium" : raw === "mild" ? "low" : raw;
      const engineMatch = findEngineDetection(conflict, appState.preConflicts);
      const engineBadge = engineMatch
        ? `<div class="engine-badge">⚗ Pre-detected by Chemistry Engine${engineMatch.source ? ` · <span class="engine-source">${escapeHtml(engineMatch.source)}</span>` : ""}</div>`
        : "";
      const card = document.createElement("article");
      card.className = `conflict-card ${level}`;
      card.innerHTML = `
        <div class="conflict-head">
          <div class="conflict-head-left">
            <span class="conflict-risk-icon ${level}">${riskIcon[level] || "•"}</span>
            <p class="conflict-title">${escapeHtml((conflict.ingredients || []).join(" + "))}</p>
          </div>
          <span class="legend-pill ${level}">${riskLabel[level] || level}</span>
        </div>
        <div class="conflict-body">
          <p><strong>Why it matters:</strong> ${escapeHtml(conflict.explanation || "")}</p>
          <p><strong>Recommendation:</strong> ${escapeHtml(conflict.recommendation || "")}</p>
          ${engineBadge}
        </div>
      `;
      conflictsList.appendChild(card);
    });

    flagged.forEach((item) => {
      const conf = String(item.confidence || "medium").toLowerCase();
      const level = conf === "high" ? "high" : conf === "low" ? "low" : "medium";
      const card = document.createElement("article");
      card.className = `conflict-card ${level}`;
      card.innerHTML = `
        <div class="conflict-head">
          <div class="conflict-head-left">
            <span class="conflict-risk-icon ${level}">${riskIcon[level] || "•"}</span>
            <p class="conflict-title">${escapeHtml(item.name || "")}</p>
          </div>
          <span class="legend-pill ${level}">${escapeHtml(item.concern_type || riskLabel[level] || level)}</span>
        </div>
        <div class="conflict-body">
          <p><strong>Category:</strong> ${escapeHtml(item.category || "")}</p>
          <p><strong>Why it matters:</strong> ${escapeHtml(item.explanation || "")}</p>
        </div>
      `;
      conflictsList.appendChild(card);

      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = item.name || "";
      flaggedWrap.appendChild(tag);
    });

    const recs = result.routine_recommendations || [];
    if (recs.length) {
      recs.forEach((rec) => {
        const li = document.createElement("li");
        li.textContent = rec;
        recsWrap.appendChild(li);
      });
    } else if (result.overall_summary) {
      const li = document.createElement("li");
      li.textContent = result.overall_summary;
      recsWrap.appendChild(li);
    }

    // Alternatives sidebar — only for high-risk conflicts
    const hasHighRisk = conflicts.some((c) => {
      const raw = String(c.severity || "").toLowerCase();
      return raw === "high";
    });
    const rawAlternatives = result.alternative_suggestions || [];
    if (hasHighRisk && rawAlternatives.length) {
      // Verify each suggestion against Open Beauty Facts
      const verified = await Promise.all(rawAlternatives.map(verifyAlternativeWithOBF));
      renderAlternativesSidebar(verified);
    } else {
      renderAlternativesSidebar([]);
    }

  } catch (err) {
    $("analysisLoading").classList.add("hidden");
    conflictsList.innerHTML = `<p style="color:var(--danger,#c0392b);padding:1rem">${escapeHtml(err.message || "Could not analyze products. Please try again.")}</p>`;
  }
}

function buildRoutine() {
  const products = appState.products || [];
  const result = appState.geminiResult || {};
  if (!products.length) return null;

  const conflicts = result.ingredient_conflicts || [];

  function classifyProduct(p) {
    const text = [p.name, p.category, ...(p.ingredients || [])].join(" ").toLowerCase();
    if (/spf|sunscreen|uv\s*(clear|shield|protect)|sun\s*block/i.test(text))
      return { slot: "am", activeType: null };
    if (/retinol|retinoid|tretinoin|retinal|adapalene|retin[\s-]?a/i.test(text))
      return { slot: "pm-active", activeType: "retinoid" };
    if (/\baha\b|alpha[\s-]?hydroxy|glycolic|lactic|mandelic|\bbha\b|beta[\s-]?hydroxy|salicylic|exfoliant|peeling/i.test(text))
      return { slot: "pm-active", activeType: "acid" };
    if (/vitamin[\s-]?c|ascorbic|l-ascorbic/i.test(text))
      return { slot: "am-active", activeType: "vitaminc" };
    return { slot: "both", activeType: null };
  }

  const classified = products.map((p) => ({ ...p, ...classifyProduct(p) }));
  const amOnly    = classified.filter((p) => p.slot === "am");
  const amActives = classified.filter((p) => p.slot === "am-active");
  const pmActives = classified.filter((p) => p.slot === "pm-active");
  const both      = classified.filter((p) => p.slot === "both");

  // Detect whether any high-severity conflict sits across two of our PM actives
  const hasHighActiveSplit =
    pmActives.length >= 2 &&
    conflicts.some((c) => {
      const raw = String(c.severity || "").toLowerCase();
      if (raw !== "high") return false;
      const cIngs = (c.ingredients || []).map((i) => i.toLowerCase());
      const matchA = pmActives[0];
      const matchB = pmActives[1];
      const textA = [matchA.name, ...(matchA.ingredients || [])].join(" ").toLowerCase();
      const textB = [matchB.name, ...(matchB.ingredients || [])].join(" ").toLowerCase();
      return cIngs.some((ci) => textA.includes(ci)) && cIngs.some((ci) => textB.includes(ci));
    });

  // Split conflicting PM actives across nights
  let activeGroupA = []; // Mon / Wed / Fri
  let activeGroupB = []; // Tue / Thu
  let activeEveryNight = [];

  if (hasHighActiveSplit) {
    const retinoids = pmActives.filter((p) => p.activeType === "retinoid");
    const acids     = pmActives.filter((p) => p.activeType === "acid");
    if (retinoids.length && acids.length) {
      activeGroupA = retinoids;
      activeGroupB = acids;
    } else {
      activeGroupA = [pmActives[0]];
      activeGroupB = pmActives.slice(1);
    }
  } else {
    activeEveryNight = pmActives;
  }

  // Base steps that run every AM or every PM
  const amBase = [...both, ...amOnly, ...amActives];
  const pmBase = [...both];

  // Daily summary view
  const amSteps = amBase.map((p) => ({ product: p.name, category: p.category }));
  const pmSteps = [
    ...pmBase.map((p) => ({ product: p.name, category: p.category })),
    ...(hasHighActiveSplit
      ? [
          ...activeGroupA.map((p) => ({
            product: p.name,
            category: p.category,
            note: "Mon / Wed / Fri"
          })),
          ...activeGroupB.map((p) => ({
            product: p.name,
            category: p.category,
            note: "Tue / Thu"
          }))
        ]
      : activeEveryNight.map((p) => ({ product: p.name, category: p.category })))
  ];

  // Weekly schedule
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const PATTERN_A = ["Monday", "Wednesday", "Friday"];
  const PATTERN_B = ["Tuesday", "Thursday"];

  const weekly = {};
  DAYS.forEach((day) => {
    const am = amBase.map((p) => ({ product: p.name, category: p.category }));
    let pm    = pmBase.map((p) => ({ product: p.name, category: p.category }));

    if (hasHighActiveSplit) {
      if (PATTERN_A.includes(day) && activeGroupA.length) {
        const label = activeGroupA[0].activeType === "retinoid" ? "Retinoid night" : "Active A night";
        pm = [
          ...pm,
          ...activeGroupA.map((p, i) => ({
            product: p.name,
            category: p.category,
            note: i === 0 ? label : undefined
          }))
        ];
      } else if (PATTERN_B.includes(day) && activeGroupB.length) {
        const label = activeGroupB[0].activeType === "acid" ? "Acid night" : "Active B night";
        pm = [
          ...pm,
          ...activeGroupB.map((p, i) => ({
            product: p.name,
            category: p.category,
            note: i === 0 ? label : undefined
          }))
        ];
      } else {
        // Recovery night — just base steps, add note to last item if any
        if (pm.length) pm = [...pm.slice(0, -1), { ...pm[pm.length - 1], note: "Recovery night" }];
      }
    } else {
      pm = [...pm, ...activeEveryNight.map((p) => ({ product: p.name, category: p.category }))];
    }

    weekly[day] = { am, pm };
  });

  // Summary cards for the routine page
  const hasSPF = amOnly.some((p) => /spf|sunscreen/i.test(p.name));

  let card1, card2, card3;

  if (hasHighActiveSplit) {
    const aName = activeGroupA.map((p) => p.name.split(" ").slice(0, 3).join(" ")).join(", ");
    const bName = activeGroupB.map((p) => p.name.split(" ").slice(0, 3).join(" ")).join(", ");
    card1 = {
      tone: "low-tone",
      icon: "✓",
      title: "Active Separation",
      text: `${aName} and ${bName} are scheduled on alternate nights to prevent irritation.`
    };
  } else if (pmActives.length) {
    card1 = {
      tone: "low-tone",
      icon: "✓",
      title: "Compatible Actives",
      text: "Your actives are compatible and can be used together each evening."
    };
  } else {
    card1 = {
      tone: "low-tone",
      icon: "✓",
      title: "Gentle Routine",
      text: "No conflicting actives detected. Focus on cleansing, moisturizing, and SPF."
    };
  }

  card2 = {
    tone: "medium-tone",
    icon: "☼",
    title: hasSPF ? "Daily SPF Included" : "Add Daily SPF",
    text: hasSPF
      ? "Sunscreen is in your morning routine — protecting your skin and your actives from UV damage."
      : "Consider adding a broad-spectrum SPF to your morning routine, especially when using actives."
  };

  card3 = {
    tone: "accent-tone",
    icon: "✨",
    title: "Recovery Balance",
    text: result.barrier_assessment ||
      "Hydration-focused recovery nights between active sessions help maintain your skin barrier."
  };

  return { amSteps, pmSteps, weekly, summaryCards: [card1, card2, card3] };
}

function renderRoutinePage() {
  const routine = buildRoutine();

  // Summary cards
  const summaryCards = document.querySelectorAll("#page-routine .analysis-top-grid .summary-card");
  const cardData = routine ? routine.summaryCards : null;
  if (cardData) {
    summaryCards.forEach((card, i) => {
      const data = cardData[i];
      if (!data) return;
      card.className = `summary-card ${data.tone}`;
      const icon = card.querySelector(".summary-icon");
      const h4   = card.querySelector("h4");
      const p    = card.querySelector("p");
      if (icon) icon.textContent = data.icon;
      if (h4)   h4.textContent   = data.title;
      if (p)    p.textContent    = data.text;
    });
  }

  const amSteps = routine ? routine.amSteps : [];
  const pmSteps = routine ? routine.pmSteps : [];
  const weekly  = routine ? routine.weekly  : {};

  renderRoutineSteps("morningRoutine", amSteps);
  renderRoutineSteps("eveningRoutine", pmSteps);
  renderWeeklyRoutine(weekly);

  // Dynamic pro tips based on the user's actual products
  const tipsList = $("proTipsList");
  if (tipsList && routine) {
    const productText = appState.products.map((p) =>
      [p.name, p.category, ...(p.ingredients || [])].join(" ")
    ).join(" ").toLowerCase();

    const hasRetinoid = /retinol|retinoid|tretinoin|retinal|adapalene/i.test(productText);
    const hasSPF = /spf|sunscreen|uv\s*(clear|shield|protect)|sun\s*block/i.test(productText);
    const hasAcid = /\baha\b|alpha[\s-]?hydroxy|glycolic|lactic|salicylic|\bbha\b/i.test(productText);
    const hasVitC = /vitamin[\s-]?c|ascorbic/i.test(productText);

    const tips = [
      "Apply products from thinnest to thickest consistency.",
      "If irritation occurs, pause actives and focus on hydration for 2–3 days."
    ];
    if (hasRetinoid) tips.unshift("Wait 10 minutes after cleansing before applying retinoids for better tolerance.");
    if (!hasSPF) tips.push("Add a broad-spectrum SPF to your morning routine — actives increase UV sensitivity.");
    if (hasSPF) tips.push("Sunscreen goes on last in your morning routine, after any serums or moisturizer.");
    if (hasAcid && hasRetinoid) tips.push("Don't layer acids and retinoids on the same night — alternate instead.");
    if (hasVitC) tips.push("Vitamin C is most effective in the morning; apply before moisturizer and SPF.");

    tipsList.innerHTML = tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
  }
}

function renderRoutineSteps(containerId, steps) {
  const wrap = $(containerId);
  wrap.innerHTML = "";

  if (!steps || !steps.length) {
    const isAM = containerId === "morningRoutine";
    wrap.innerHTML = `<p class="routine-empty-note">${isAM
      ? "No dedicated AM products detected. Consider adding a moisturizer and SPF to your morning routine."
      : "No products assigned to this slot."
    }</p>`;
    return;
  }

  steps.forEach((step, index) => {
    const row = document.createElement("div");
    row.className = "routine-step";
    row.innerHTML = `
      <div class="routine-number">${index + 1}</div>
      <div>
        <p class="routine-step-title">${escapeHtml(step.product)}</p>
        <p class="routine-step-meta">${escapeHtml(step.category)}</p>
        ${step.note ? `<p class="routine-step-note">💡 ${escapeHtml(step.note)}</p>` : ""}
      </div>
    `;
    wrap.appendChild(row);
  });
}

function renderWeeklyRoutine(routineData) {
  const wrap = $("weeklyRoutineList");
  wrap.innerHTML = "";
  const data = routineData || {};

  Object.entries(data).forEach(([day, routine]) => {
    const card = document.createElement("article");
    card.className = "week-day-card";
    card.innerHTML = `
      <div class="week-day-head">
        <div class="week-dot">🗓</div>
        <h4>${escapeHtml(day)}</h4>
      </div>
      <div class="week-grid">
        <div>
          <h5>Morning</h5>
          <div>${routine.am
            .map(
              (step, index) => `
              <div class="week-step">${index + 1}. ${escapeHtml(step.product)}</div>
            `
            )
            .join("")}</div>
        </div>
        <div>
          <h5>Evening</h5>
          <div>${routine.pm
            .map(
              (step, index) => `
              <div class="week-step">
                ${index + 1}. ${escapeHtml(step.product)}
                ${step.note ? `<span class="routine-step-note">(${escapeHtml(step.note)})</span>` : ""}
              </div>
            `
            )
            .join("")}</div>
        </div>
      </div>
    `;
    wrap.appendChild(card);
  });
}

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));

      btn.classList.add("active");
      const tab = btn.getAttribute("data-tab");
      if (tab === "daily") $("routineDailyTab").classList.add("active");
      if (tab === "weekly") $("routineWeeklyTab").classList.add("active");
    });
  });
}

function setupEvents() {
  $("toProductsBtn").addEventListener("click", () => {
    if (!appState.profile.skinType) {
      const err = $("profileError");
      err.textContent = "Please select your skin type before continuing.";
      err.classList.remove("hidden");
      return;
    }
    $("profileError").classList.add("hidden");
    appState.profile.goals = [...appState.profile.concerns];
    navigate("#/products");
  });

  $("searchProductsBtn").addEventListener("click", searchProducts);
  $("productSearch").addEventListener("keydown", (event) => {
    if (event.key === "Enter") searchProducts();
  });

  $("analyzeRoutineBtn").addEventListener("click", () => {
    if (appState.products.length < 2) {
      const err = $("productsError");
      err.textContent = "Please add at least 2 products to analyze.";
      err.classList.remove("hidden");
      return;
    }
    $("productsError").classList.add("hidden");
    navigate("#/analysis");
  });

  $("toRoutineBtn").addEventListener("click", () => {
    navigate("#/routine");
  });

  $("closeSidebarBtn").addEventListener("click", () => {
    $("alternativesSidebar").classList.add("hidden");
  });

  $("mobileSidebarToggleBtn").addEventListener("click", () => {
    const sidebar = $("alternativesSidebar");
    // On mobile, sidebar is display:none unless mobile-open; toggle it
    sidebar.classList.remove("hidden");
    sidebar.classList.toggle("mobile-open");
  });

  window.addEventListener("hashchange", renderRoute);
}

function init() {
  setupEvents();
  setupTabs();

  if (!window.location.hash) {
    window.location.hash = "#/";
  }
  renderRoute();
}

init();
