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

const productDatabase = [
  {
    name: "CeraVe Hydrating Cleanser",
    brand: "CeraVe",
    category: "Cleanser",
    ingredients: [
      "Water",
      "Glycerin",
      "Cetearyl Alcohol",
      "Phenoxyethanol",
      "Ceramides",
      "Hyaluronic Acid"
    ]
  },
  {
    name: "The Ordinary Niacinamide 10% + Zinc 1%",
    brand: "The Ordinary",
    category: "Serum",
    ingredients: ["Water", "Niacinamide", "Zinc PCA", "Pentylene Glycol"]
  },
  {
    name: "Paula's Choice 2% BHA Liquid Exfoliant",
    brand: "Paula's Choice",
    category: "Exfoliant",
    ingredients: [
      "Water",
      "Salicylic Acid",
      "Methylpropanediol",
      "Butylene Glycol"
    ]
  },
  {
    name: "Tretinoin 0.025%",
    brand: "Generic",
    category: "Retinoid",
    ingredients: ["Tretinoin", "Sorbitol", "Water", "Stearyl Alcohol"]
  },
  {
    name: "La Roche-Posay Toleriane Double Repair Moisturizer",
    brand: "La Roche-Posay",
    category: "Moisturizer",
    ingredients: [
      "Water",
      "Glycerin",
      "Niacinamide",
      "Ceramide-3",
      "Prebiotic Thermal Water"
    ]
  },
  {
    name: "EltaMD UV Clear SPF 46",
    brand: "EltaMD",
    category: "Sunscreen",
    ingredients: [
      "Zinc Oxide",
      "Niacinamide",
      "Hyaluronic Acid",
      "Lactic Acid"
    ]
  }
];

const weeklyRoutine = {
  Monday: {
    am: [
      { product: "CeraVe Hydrating Cleanser", category: "Cleanser" },
      { product: "EltaMD UV Clear SPF 46", category: "Sunscreen" }
    ],
    pm: [
      { product: "CeraVe Hydrating Cleanser", category: "Cleanser" },
      {
        product: "Tretinoin 0.025%",
        category: "Retinoid",
        note: "Retinoid night"
      },
      {
        product: "La Roche-Posay Toleriane Double Repair Moisturizer",
        category: "Moisturizer"
      }
    ]
  },
  Tuesday: {
    am: [
      { product: "CeraVe Hydrating Cleanser", category: "Cleanser" },
      { product: "EltaMD UV Clear SPF 46", category: "Sunscreen" }
    ],
    pm: [
      { product: "CeraVe Hydrating Cleanser", category: "Cleanser" },
      {
        product: "La Roche-Posay Toleriane Double Repair Moisturizer",
        category: "Moisturizer",
        note: "Recovery night"
      }
    ]
  },
  Wednesday: {
    am: [
      { product: "CeraVe Hydrating Cleanser", category: "Cleanser" },
      { product: "EltaMD UV Clear SPF 46", category: "Sunscreen" }
    ],
    pm: [
      { product: "CeraVe Hydrating Cleanser", category: "Cleanser" },
      {
        product: "Paula's Choice 2% BHA Liquid Exfoliant",
        category: "Exfoliant",
        note: "Acid night"
      },
      {
        product: "La Roche-Posay Toleriane Double Repair Moisturizer",
        category: "Moisturizer"
      }
    ]
  },
  Thursday: {
    am: [
      { product: "CeraVe Hydrating Cleanser", category: "Cleanser" },
      { product: "EltaMD UV Clear SPF 46", category: "Sunscreen" }
    ],
    pm: [
      { product: "CeraVe Hydrating Cleanser", category: "Cleanser" },
      {
        product: "La Roche-Posay Toleriane Double Repair Moisturizer",
        category: "Moisturizer",
        note: "Recovery night"
      }
    ]
  },
  Friday: {
    am: [
      { product: "CeraVe Hydrating Cleanser", category: "Cleanser" },
      { product: "EltaMD UV Clear SPF 46", category: "Sunscreen" }
    ],
    pm: [
      { product: "CeraVe Hydrating Cleanser", category: "Cleanser" },
      {
        product: "Tretinoin 0.025%",
        category: "Retinoid",
        note: "Retinoid night"
      },
      {
        product: "La Roche-Posay Toleriane Double Repair Moisturizer",
        category: "Moisturizer"
      }
    ]
  },
  Saturday: {
    am: [
      { product: "CeraVe Hydrating Cleanser", category: "Cleanser" },
      { product: "EltaMD UV Clear SPF 46", category: "Sunscreen" }
    ],
    pm: [
      { product: "CeraVe Hydrating Cleanser", category: "Cleanser" },
      {
        product: "La Roche-Posay Toleriane Double Repair Moisturizer",
        category: "Moisturizer",
        note: "Barrier-support night"
      }
    ]
  },
  Sunday: {
    am: [
      { product: "CeraVe Hydrating Cleanser", category: "Cleanser" },
      { product: "EltaMD UV Clear SPF 46", category: "Sunscreen" }
    ],
    pm: [
      { product: "CeraVe Hydrating Cleanser", category: "Cleanser" },
      {
        product: "La Roche-Posay Toleriane Double Repair Moisturizer",
        category: "Moisturizer",
        note: "Reset night"
      }
    ]
  }
};

const BACKEND_URL = "https://skincare-iq-api-709197932075.us-central1.run.app/analyze";

const appState = {
  profile: {
    skinType: "",
    concerns: [],
    sensitivities: [],
    goals: []
  },
  products: [],
  geminiResult: null
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

function searchProducts() {
  const query = $("productSearch").value.trim().toLowerCase();
  const resultsWrap = $("searchResultsWrap");
  const searchEmpty = $("searchEmpty");
  const searchResults = $("searchResults");
  const searchMeta = $("searchMeta");

  searchResults.innerHTML = "";
  resultsWrap.classList.add("hidden");
  searchEmpty.classList.add("hidden");

  if (!query) return;

  const results = productDatabase.filter((product) => {
    return (
      product.name.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  if (!results.length) {
    searchEmpty.classList.remove("hidden");
    return;
  }

  searchMeta.textContent = `${results.length} product${results.length !== 1 ? "s" : ""} found`;
  resultsWrap.classList.remove("hidden");

  results.forEach((product) => {
    const row = document.createElement("div");
    row.className = "search-result";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(product.name)}</strong>
        <div class="result-meta">
          <span class="search-meta">${escapeHtml(product.brand)}</span>
          <span class="pill ${product.category.toLowerCase()}">${escapeHtml(product.category)}</span>
        </div>
      </div>
      <button class="add-btn" aria-label="Add product">+</button>
    `;
    row.querySelector(".add-btn").addEventListener("click", () => {
      if (appState.products.length >= 4) {
        alert("You can add up to 4 products.");
        return;
      }
      const exists = appState.products.some((p) => p.name === product.name);
      if (exists) return;

      appState.products.push({
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        ...product
      });

      $("productSearch").value = "";
      $("searchResultsWrap").classList.add("hidden");
      $("searchEmpty").classList.add("hidden");
      renderProductsPage();
    });
    searchResults.appendChild(row);
  });
}

function generateConflicts() {
  const products = appState.products;
  const names = products.map((p) => p.name);

  const hasRetinoid = names.some((n) => /tretinoin|retinol/i.test(n));
  const hasExfoliant = names.some((n) => /bha|aha|exfoliant/i.test(n));
  const hasSunscreen = names.some((n) => /spf|uv/i.test(n));
  const hasNiacinamide = names.some((n) => /niacinamide/i.test(n));

  const conflicts = [];
  const flagged = [];
  const recs = [];

  if (hasRetinoid && hasExfoliant) {
    conflicts.push({
      type: "high",
      title: "Retinoid + Exfoliating Acid",
      products: [
        names.find((n) => /tretinoin|retinol/i.test(n)),
        names.find((n) => /bha|aha|exfoliant/i.test(n))
      ],
      explanation:
        "Using a retinoid and an exfoliating acid in the same routine can increase irritation, dryness, and barrier damage.",
      recommendation:
        "Use them on alternate nights rather than layering them together."
    });
    flagged.push("Retinoids");
    flagged.push("AHAs/BHAs");
    recs.push("Separate retinoids and acids into different nights.");
  }

  if (hasRetinoid && !hasSunscreen) {
    conflicts.push({
      type: "medium",
      title: "Retinoid Without Daily SPF",
      products: [
        names.find((n) => /tretinoin|retinol/i.test(n)),
        "No sunscreen detected"
      ],
      explanation:
        "Retinoids increase photosensitivity, and skipping sunscreen can worsen irritation and post-inflammatory dark spots.",
      recommendation:
        "Add a daily broad-spectrum SPF to your morning routine."
    });
    flagged.push("Sun sensitivity risk");
    recs.push("Use SPF every morning when using actives.");
  }

  if (hasNiacinamide) {
    conflicts.push({
      type: "low",
      title: "Niacinamide Supportive Pairing",
      products: [names.find((n) => /niacinamide/i.test(n)), "Rest of routine"],
      explanation:
        "Niacinamide is generally well-tolerated and can help support barrier function.",
      recommendation:
        "Keep niacinamide in the routine, especially on recovery days."
    });
    flagged.push("Niacinamide");
    recs.push("Use barrier-supporting ingredients between active nights.");
  }

  if (!conflicts.length) {
    conflicts.push({
      type: "low",
      title: "No Major Conflict Detected",
      products: names.slice(0, 2),
      explanation:
        "Your current product set does not show a major high-risk combination in this demo analysis.",
      recommendation:
        "Still patch test and avoid introducing multiple new actives at once."
    });
  }

  appState.conflicts = conflicts;
  appState.flaggedIngredients = [...new Set(flagged)];
  appState.recommendations = [...new Set(recs)];
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

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: appState.products.map((p) => p.name) })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Request failed: ${response.status}`);
    }

    const data = await response.json();
    const result = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
    appState.geminiResult = result;

    $("analysisLoading").classList.add("hidden");

    const conflicts = result.ingredient_conflicts || [];
    const flagged = result.flagged_ingredients || [];

    highPriorityText.textContent =
      conflicts[0]?.explanation ||
      result.overall_summary ||
      "Analysis complete.";

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

    conflicts.forEach((conflict) => {
      const level = String(conflict.severity || "medium").toLowerCase();
      const card = document.createElement("article");
      card.className = `conflict-card ${level}`;
      card.innerHTML = `
        <div class="conflict-head">
          <p class="conflict-title">${escapeHtml((conflict.ingredients || []).join(" + "))}</p>
          <span class="legend-pill ${level}">${escapeHtml(level)}</span>
        </div>
        <div class="conflict-body">
          <p><strong>Why it matters:</strong> ${escapeHtml(conflict.explanation || "")}</p>
          <p><strong>Recommendation:</strong> ${escapeHtml(conflict.recommendation || "")}</p>
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
          <p class="conflict-title">${escapeHtml(item.name || "")}</p>
          <span class="legend-pill ${level}">${escapeHtml(item.concern_type || level)}</span>
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

  } catch (err) {
    $("analysisLoading").classList.add("hidden");
    conflictsList.innerHTML = `<p style="color:var(--danger,#c0392b);padding:1rem">${escapeHtml(err.message || "Could not analyze products. Please try again.")}</p>`;
  }
}

function renderRoutinePage() {
  renderRoutineSteps("morningRoutine", weeklyRoutine.Monday.am, "morning");
  renderRoutineSteps("eveningRoutine", weeklyRoutine.Monday.pm, "evening");
  renderWeeklyRoutine();
}

function renderRoutineSteps(containerId, steps) {
  const wrap = $(containerId);
  wrap.innerHTML = "";

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

function renderWeeklyRoutine() {
  const wrap = $("weeklyRoutineList");
  wrap.innerHTML = "";

  Object.entries(weeklyRoutine).forEach(([day, routine]) => {
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
      alert("Please select your skin type first.");
      return;
    }
    appState.profile.goals = [...appState.profile.concerns];
    navigate("#/products");
  });

  $("searchProductsBtn").addEventListener("click", searchProducts);
  $("productSearch").addEventListener("keydown", (event) => {
    if (event.key === "Enter") searchProducts();
  });

  $("analyzeRoutineBtn").addEventListener("click", () => {
    if (appState.products.length < 2) {
      alert("Please add at least 2 products.");
      return;
    }
    navigate("#/analysis");
  });

  $("toRoutineBtn").addEventListener("click", () => {
    navigate("#/routine");
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

// const BACKEND_URL = "http://127.0.0.1:5000/analyze";
// // Replace with your Cloud Run URL when deployed:
// // const BACKEND_URL = "https://your-cloud-run-service-url.run.app/analyze";

// const analyzeBtn = document.getElementById("analyzeBtn");
// const demoBtn = document.getElementById("demoBtn");
// const mobileMenuBtn = document.getElementById("mobileMenuBtn");
// const mobileMenu = document.getElementById("mobileMenu");

// const inputMode = document.getElementById("inputMode");
// const product1 = document.getElementById("product1");
// const product2 = document.getElementById("product2");
// const product3 = document.getElementById("product3");
// const product4 = document.getElementById("product4");
// const skinType = document.getElementById("skinType");
// const concern = document.getElementById("concern");
// const sensitivity = document.getElementById("sensitivity");

// const loadingState = document.getElementById("loadingState");
// const emptyState = document.getElementById("emptyState");
// const resultsWrap = document.getElementById("resultsWrap");
// const errorState = document.getElementById("errorState");

// const overviewCard = document.getElementById("overviewCard");
// const conflictCards = document.getElementById("conflictCards");
// const ingredientFlags = document.getElementById("ingredientFlags");
// const routineCard = document.getElementById("routineCard");
// const alternativesCard = document.getElementById("alternativesCard");

// mobileMenuBtn?.addEventListener("click", () => {
//   mobileMenu.classList.toggle("open");
// });

// function getProducts() {
//   return [product1.value, product2.value, product3.value, product4.value]
//     .map((value) => value.trim())
//     .filter(Boolean);
// }

// function setLoading(isLoading) {
//   loadingState.classList.toggle("hidden", !isLoading);
//   if (isLoading) {
//     emptyState.classList.add("hidden");
//     resultsWrap.classList.add("hidden");
//     errorState.classList.add("hidden");
//   }
// }

// function showError(message) {
//   loadingState.classList.add("hidden");
//   resultsWrap.classList.add("hidden");
//   emptyState.classList.add("hidden");
//   errorState.classList.remove("hidden");
//   errorState.textContent = message;
// }

// function resetToEmpty() {
//   loadingState.classList.add("hidden");
//   resultsWrap.classList.add("hidden");
//   errorState.classList.add("hidden");
//   emptyState.classList.remove("hidden");
// }

// function severityClass(value) {
//   const normalized = String(value || "").toLowerCase();
//   if (normalized === "high") return "high";
//   if (normalized === "medium") return "medium";
//   return "low";
// }

// function renderOverview(data) {
//   const conflictCount = Array.isArray(data.conflicts) ? data.conflicts.length : 0;
//   const highCount = (data.conflicts || []).filter(
//     (item) => String(item.severity).toLowerCase() === "high"
//   ).length;

//   overviewCard.innerHTML = `
//     <h4>Routine Overview</h4>
//     <p>
//       We analyzed <strong>${data.products?.length || 0}</strong> products and found
//       <strong>${conflictCount}</strong> interaction issue${conflictCount === 1 ? "" : "s"}.
//       ${highCount > 0 ? `There ${highCount === 1 ? "is" : "are"} <strong>${highCount}</strong> high-severity concern${highCount === 1 ? "" : "s"}.` : "No high-severity conflicts were detected in this set."}
//     </p>
//   `;
// }

// function renderConflicts(conflicts = []) {
//   conflictCards.innerHTML = "";

//   if (!conflicts.length) {
//     conflictCards.innerHTML = `
//       <div class="conflict-card low">
//         <div class="conflict-top">
//           <p class="conflict-products">No major conflicts detected</p>
//           <span class="conflict-severity">low</span>
//         </div>
//         <div class="conflict-body">
//           <p>Your selected routine appears broadly compatible based on the current analysis.</p>
//           <p><strong>Recommendation:</strong> Patch test new products and keep sunscreen/barrier support in the routine.</p>
//         </div>
//       </div>
//     `;
//     return;
//   }

//   conflicts.forEach((item) => {
//     const level = severityClass(item.severity);
//     const card = document.createElement("article");
//     card.className = `conflict-card ${level}`;
//     card.innerHTML = `
//       <div class="conflict-top">
//         <p class="conflict-products">${escapeHtml(item.product_a)} + ${escapeHtml(item.product_b)}</p>
//         <span class="conflict-severity">${escapeHtml(level)}</span>
//       </div>
//       <div class="conflict-body">
//         <p><strong>Conflict:</strong> ${escapeHtml(item.conflict)}</p>
//         <p><strong>Recommendation:</strong> ${escapeHtml(item.recommendation)}</p>
//       </div>
//     `;
//     conflictCards.appendChild(card);
//   });
// }

// function renderIngredientFlags(flags = []) {
//   ingredientFlags.innerHTML = "";

//   if (!flags.length) {
//     ingredientFlags.innerHTML = `<span class="tag">No flagged ingredients returned</span>`;
//     return;
//   }

//   flags.forEach((flag) => {
//     const tag = document.createElement("span");
//     tag.className = "tag";
//     tag.textContent = flag;
//     ingredientFlags.appendChild(tag);
//   });
// }

// function renderRoutine(routine = {}) {
//   const am = Array.isArray(routine.am) ? routine.am : [];
//   const pm = Array.isArray(routine.pm) ? routine.pm : [];
//   const notes = Array.isArray(routine.notes) ? routine.notes : [];

//   routineCard.innerHTML = `
//     <div class="routine-split">
//       <div class="routine-block">
//         <h5>AM Routine</h5>
//         <ul>
//           ${am.length ? am.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : "<li>No AM suggestions returned</li>"}
//         </ul>
//       </div>
//       <div class="routine-block">
//         <h5>PM Routine</h5>
//         <ul>
//           ${pm.length ? pm.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : "<li>No PM suggestions returned</li>"}
//         </ul>
//       </div>
//     </div>
//     <div class="notes-wrap">
//       <h5>Routine Notes</h5>
//       <ul class="notes-list">
//         ${notes.length ? notes.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : "<li>No additional notes returned</li>"}
//       </ul>
//     </div>
//   `;
// }

// function renderAlternatives(alternatives = []) {
//   alternativesCard.innerHTML = `
//     <ul class="alt-list">
//       ${
//         alternatives.length
//           ? alternatives.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
//           : "<li>No alternative recommendations returned.</li>"
//       }
//     </ul>
//   `;
// }

// function renderResults(data) {
//   emptyState.classList.add("hidden");
//   loadingState.classList.add("hidden");
//   errorState.classList.add("hidden");
//   resultsWrap.classList.remove("hidden");

//   renderOverview(data);
//   renderConflicts(data.conflicts || []);
//   renderIngredientFlags(data.flagged_ingredients || []);
//   renderRoutine(data.routine || {});
//   renderAlternatives(data.alternatives || []);
// }

// function escapeHtml(value) {
//   return String(value)
//     .replaceAll("&", "&amp;")
//     .replaceAll("<", "&lt;")
//     .replaceAll(">", "&gt;")
//     .replaceAll('"', "&quot;")
//     .replaceAll("'", "&#039;");
// }

// async function analyzeProducts() {
//   const products = getProducts();

//   if (products.length < 2) {
//     showError("Please enter at least 2 products or ingredient lists.");
//     return;
//   }

//   setLoading(true);

//   const payload = {
//     products,
//     profile: {
//       skin_type: skinType.value,
//       concern: concern.value,
//       sensitivity: sensitivity.value,
//       input_mode: inputMode.value
//     }
//   };

//   try {
//     const response = await fetch(BACKEND_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify(payload)
//     });

//     if (!response.ok) {
//       throw new Error(`Request failed with status ${response.status}`);
//     }

//     const data = await response.json();

//     // Supports both:
//     // { result: "[...json string...]" }
//     // and a cleaner direct JSON object
//     if (typeof data.result === "string") {
//       const parsedResult = JSON.parse(data.result);
//       const normalized = normalizeLegacyResult(parsedResult, products);
//       renderResults(normalized);
//     } else {
//       const normalized = normalizeDirectResult(data, products);
//       renderResults(normalized);
//     }
//   } catch (error) {
//     console.error(error);
//     showError("Could not analyze products right now. Load the demo or check your backend connection.");
//   }
// }

// function normalizeLegacyResult(parsedResult, products) {
//   const conflicts = Array.isArray(parsedResult) ? parsedResult : [];
//   return {
//     products,
//     conflicts,
//     flagged_ingredients: [
//       "Retinol — irritation risk when overused",
//       "AHA — exfoliation risk",
//       "Fragrance — caution for sensitive skin"
//     ],
//     routine: {
//       am: ["Gentle cleanser", "Vitamin C or hydrating serum", "Moisturizer", "Sunscreen"],
//       pm: ["Cleanser", "Retinol on alternate nights", "Barrier-support moisturizer"],
//       notes: [
//         "Do not layer strong acids and retinol in the same routine.",
//         "Prioritize barrier support if sensitivity is present."
//       ]
//     },
//     alternatives: [
//       "Swap strong exfoliating toner for a gentler lactic acid or PHA product.",
//       "Use hydrating serum on non-retinol nights.",
//       "Choose fragrance-free moisturizers if sensitivity is a concern."
//     ]
//   };
// }

// function normalizeDirectResult(data, products) {
//   return {
//     products,
//     conflicts: Array.isArray(data.conflicts) ? data.conflicts : [],
//     flagged_ingredients: Array.isArray(data.flagged_ingredients) ? data.flagged_ingredients : [],
//     routine: data.routine || { am: [], pm: [], notes: [] },
//     alternatives: Array.isArray(data.alternatives) ? data.alternatives : []
//   };
// }

// function loadDemo() {
//   const demoData = {
//     products: [
//       "The Ordinary Retinol 0.5% in Squalane",
//       "Paula's Choice Skin Perfecting 8% AHA Gel",
//       "CeraVe PM Facial Moisturizing Lotion",
//       "Vitamin C Brightening Serum"
//     ],
//     conflicts: [
//       {
//         product_a: "The Ordinary Retinol 0.5% in Squalane",
//         product_b: "Paula's Choice Skin Perfecting 8% AHA Gel",
//         severity: "high",
//         conflict:
//           "Retinol and AHA used in the same routine can increase irritation, dryness, and barrier damage.",
//         recommendation:
//           "Use them on alternate nights rather than layering together."
//       },
//       {
//         product_a: "Vitamin C Brightening Serum",
//         product_b: "Paula's Choice Skin Perfecting 8% AHA Gel",
//         severity: "medium",
//         conflict:
//           "Using multiple strong actives in one day may overwhelm sensitive or barrier-impaired skin.",
//         recommendation:
//           "Use vitamin C in the morning and keep exfoliating acids limited to select nights."
//       },
//       {
//         product_a: "The Ordinary Retinol 0.5% in Squalane",
//         product_b: "Vitamin C Brightening Serum",
//         severity: "low",
//         conflict:
//           "This pairing is often workable, but some users may experience irritation if both are strong formulations.",
//         recommendation:
//           "Separate into AM/PM routines if irritation appears."
//       }
//     ],
//     flagged_ingredients: [
//       "Retinol — high irritation potential with acids",
//       "AHA — exfoliation/overuse risk",
//       "Fragrance — caution for sensitive skin",
//       "Essential oils — possible sensitizer",
//       "Denatured alcohol — may be drying for compromised barriers"
//     ],
//     routine: {
//       am: [
//         "Gentle cleanser",
//         "Vitamin C Brightening Serum",
//         "CeraVe PM Facial Moisturizing Lotion",
//         "Broad-spectrum sunscreen"
//       ],
//       pm: [
//         "Gentle cleanser",
//         "Retinol 2–3 nights weekly",
//         "Moisturizer",
//         "AHA on a separate night only"
//       ],
//       notes: [
//         "Do not use retinol and AHA in the same evening routine.",
//         "If redness or stinging occurs, reduce active frequency.",
//         "Keep barrier-supporting moisturizer consistent."
//       ]
//     },
//     alternatives: [
//       "Replace strong AHA with PHA or mandelic acid if sensitivity is high.",
//       "Choose fragrance-free moisturizer for barrier repair.",
//       "Use a hydrating serum on off-nights instead of stacking more actives."
//     ]
//   };

//   product1.value = demoData.products[0];
//   product2.value = demoData.products[1];
//   product3.value = demoData.products[2];
//   product4.value = demoData.products[3];
//   skinType.value = "sensitive";
//   concern.value = "texture";
//   sensitivity.value = "fragrance-sensitive";

//   renderResults(demoData);
// }

// analyzeBtn.addEventListener("click", analyzeProducts);
// demoBtn.addEventListener("click", loadDemo);

// // keep placeholder text in sync with mode
// inputMode.addEventListener("change", () => {
//   if (inputMode.value === "ingredients") {
//     product1.placeholder = "Paste ingredient list (INCI) for product 1";
//     product2.placeholder = "Paste ingredient list (INCI) for product 2";
//     product3.placeholder = "Optional ingredient list";
//     product4.placeholder = "Optional ingredient list";
//   } else {
//     product1.placeholder = "e.g. The Ordinary Retinol 0.5% in Squalane";
//     product2.placeholder = "e.g. Paula's Choice Skin Perfecting 8% AHA";
//     product3.placeholder = "Optional";
//     product4.placeholder = "Optional";
//   }
// });

// resetToEmpty();