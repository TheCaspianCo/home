/**
 * THE CASPIAN CO - PICKS PAGE
 * All products with dynamic filters (categories, sub-categories, tags)
 */

(async function () {
  "use strict";

  // State
  let allProducts = [];
  let filteredProducts = [];
  let selectedCategories = [];
  let selectedSubCategories = [];
  let selectedTags = [];
  let currentSort = "newest";
  let searchQuery = "";

  // Load data
  const loaded = await CaspianData.loadAllData();
  if (!loaded) {
    showError("Failed to load data. Please refresh the page.");
    return;
  }

  // Get search query from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  searchQuery = urlParams.get("search") || "";

  if (searchQuery) {
    document.getElementById("searchInput").value = searchQuery;
  }

  // Initialize page
  allProducts = CaspianData.getAllActiveProducts();
  loadCategoriesDropdown();
  initializeFilters();
  applyFilters();
  initializeSearch();

  /**
   * Initialize filters dynamically from products
   */
  function initializeFilters() {
    // Get unique categories
    const categories = CaspianData.getAllCategories();

    // Get unique tags from all products
    const tags = CaspianData.getUniqueTags(allProducts);

    // Render category filters
    renderCategoryFilters(categories);

    // Render tag filters
    renderTagFilters(tags);
  }

  /**
   * Render category filters
   */
  function renderCategoryFilters(categories) {
    const container = document.getElementById("categoryFilters");

    if (categories.length === 0) {
      container.style.display = "none";
      return;
    }

    const filtersHTML = categories
      .map(
        (cat) => `
      <div class="filter-option">
        <input type="checkbox" 
               id="cat_${cat.id}" 
               value="${cat.id}"
               onchange="handleCategoryChange('${cat.id}')">
        <label for="cat_${cat.id}">${cat.label}</label>
      </div>
    `,
      )
      .join("");

    container.innerHTML = `
      <div class="filter-title">Categories</div>
      ${filtersHTML}
    `;
  }

  /**
   * Render tag filters
   */
  function renderTagFilters(tags) {
    const container = document.getElementById("tagFilters");

    if (tags.length === 0) {
      container.style.display = "none";
      return;
    }

    const filtersHTML = tags
      .map(
        (tag) => `
      <div class="filter-option">
        <input type="checkbox" 
               id="tag_${tag}" 
               value="${tag}"
               onchange="handleTagChange('${tag}')">
        <label for="tag_${tag}">${CaspianData.formatDisplayText(tag)}</label>
      </div>
    `,
      )
      .join("");

    container.innerHTML = `
      <div class="filter-title">Tags</div>
      ${filtersHTML}
    `;
  }

  /**
   * Render sub-category filters based on selected categories
   */
  function renderSubCategoryFilters() {
    const container = document.getElementById("subCategoryFilters");

    // If no categories selected, hide sub-category filters
    if (selectedCategories.length === 0) {
      container.style.display = "none";
      return;
    }

    // Get products from selected categories
    const categoryProducts = allProducts.filter((p) =>
      selectedCategories.includes(p.category),
    );

    // Get unique sub-categories
    const subCategories = CaspianData.getUniqueSubCategories(categoryProducts);

    if (subCategories.length === 0) {
      container.style.display = "none";
      return;
    }

    const filtersHTML = subCategories
      .map(
        (subCat) => `
      <div class="filter-option">
        <input type="checkbox" 
               id="subcat_${subCat}" 
               value="${subCat}"
               onchange="handleSubCategoryChange('${subCat}')"
               ${selectedSubCategories.includes(subCat) ? "checked" : ""}>
        <label for="subcat_${subCat}">${subCat}</label>
      </div>
    `,
      )
      .join("");

    container.style.display = "block";
    container.innerHTML = `
      <div class="filter-title">Sub Categories</div>
      ${filtersHTML}
    `;
  }

  /**
   * Handle category filter change
   */
  function handleCategoryChange(categoryId) {
    const checkbox = document.getElementById(`cat_${categoryId}`);

    if (checkbox.checked) {
      if (!selectedCategories.includes(categoryId)) {
        selectedCategories.push(categoryId);
      }
    } else {
      selectedCategories = selectedCategories.filter((c) => c !== categoryId);
      // Clear sub-category selections for this category
      selectedSubCategories = [];
    }

    // Re-render sub-category filters
    renderSubCategoryFilters();

    applyFilters();
  }

  /**
   * Handle sub-category filter change
   */
  function handleSubCategoryChange(subCategory) {
    const checkbox = document.getElementById(`subcat_${subCategory}`);

    if (checkbox.checked) {
      if (!selectedSubCategories.includes(subCategory)) {
        selectedSubCategories.push(subCategory);
      }
    } else {
      selectedSubCategories = selectedSubCategories.filter(
        (s) => s !== subCategory,
      );
    }

    applyFilters();
  }

  /**
   * Handle tag filter change
   */
  function handleTagChange(tag) {
    const checkbox = document.getElementById(`tag_${tag}`);

    if (checkbox.checked) {
      if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
      }
    } else {
      selectedTags = selectedTags.filter((t) => t !== tag);
    }

    applyFilters();
  }

  /**
   * Remove single filter
   */
  function removeFilter(type, value) {
    if (type === "category") {
      selectedCategories = selectedCategories.filter((c) => c !== value);
      document.getElementById(`cat_${value}`).checked = false;
      selectedSubCategories = []; // Clear sub-categories
      renderSubCategoryFilters();
    } else if (type === "subCategory") {
      selectedSubCategories = selectedSubCategories.filter((s) => s !== value);
      document.getElementById(`subcat_${value}`).checked = false;
    } else if (type === "tag") {
      selectedTags = selectedTags.filter((t) => t !== value);
      document.getElementById(`tag_${value}`).checked = false;
    }

    applyFilters();
  }

  /**
   * Clear search
   */
  function clearSearch() {
    searchQuery = "";
    document.getElementById("searchInput").value = "";

    // Update URL
    const url = new URL(window.location);
    url.searchParams.delete("search");
    window.history.replaceState({}, "", url);

    applyFilters();
  }

  /**
   * Clear all filters
   */
  function clearAllFilters() {
    // Clear all selections
    selectedCategories = [];
    selectedSubCategories = [];
    selectedTags = [];
    searchQuery = "";

    // Uncheck all checkboxes
    document
      .querySelectorAll('.filter-option input[type="checkbox"]')
      .forEach((cb) => {
        cb.checked = false;
      });

    // Clear search input
    document.getElementById("searchInput").value = "";

    // Update URL
    const url = new URL(window.location);
    url.searchParams.delete("search");
    window.history.replaceState({}, "", url);

    // Hide sub-category filters
    document.getElementById("subCategoryFilters").style.display = "none";

    applyFilters();
  }

  // Expose functions to global scope
  window.handleCategoryChange = handleCategoryChange;
  window.handleSubCategoryChange = handleSubCategoryChange;
  window.handleTagChange = handleTagChange;
  window.removeFilter = removeFilter;
  window.clearSearch = clearSearch;
  window.clearAllFilters = clearAllFilters;

  /**
   * Apply all filters
   */
  function applyFilters() {
    let products = [...allProducts];

    // Apply search filter
    if (searchQuery) {
      products = CaspianData.searchProducts(searchQuery);
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      products = products.filter((p) =>
        selectedCategories.includes(p.category),
      );
    }

    // Apply sub-category filter
    if (selectedSubCategories.length > 0) {
      products = products.filter((p) =>
        selectedSubCategories.includes(p.sub_category),
      );
    }

    // Apply tag filter (product must have ALL selected tags)
    if (selectedTags.length > 0) {
      products = products.filter((p) => {
        return selectedTags.every((tag) => p.tags && p.tags.includes(tag));
      });
    }

    filteredProducts = products;

    // Apply sorting
    applySorting();

    // Update active filters display
    updateActiveFilters();

    // Update results count
    updateResultsCount();
  }

  /**
   * Apply sorting
   */
  function applySorting() {
    const sortValue = document.getElementById("sortSelect").value;
    currentSort = sortValue;

    let sorted = [...filteredProducts];

    switch (sortValue) {
      case "newest":
        sorted.sort((a, b) => new Date(b.added_date) - new Date(a.added_date));
        break;

      case "price-low":
        sorted.sort((a, b) => {
          const priceA = parseInt(a.price.replace(/[^\d]/g, ""));
          const priceB = parseInt(b.price.replace(/[^\d]/g, ""));
          return priceA - priceB;
        });
        break;

      case "price-high":
        sorted.sort((a, b) => {
          const priceA = parseInt(a.price.replace(/[^\d]/g, ""));
          const priceB = parseInt(b.price.replace(/[^\d]/g, ""));
          return priceB - priceA;
        });
        break;

      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
    }

    filteredProducts = sorted;
    renderProducts();
  }

  // Expose to global scope
  window.applySorting = applySorting;

  /**
   * Update active filters display
   */
  function updateActiveFilters() {
    const container = document.getElementById("activeFilters");
    const hasFilters =
      selectedCategories.length > 0 ||
      selectedSubCategories.length > 0 ||
      selectedTags.length > 0 ||
      searchQuery !== "";

    if (!hasFilters) {
      container.style.display = "none";
      return;
    }

    let filtersHTML = '<div class="active-filters">';

    // Search query
    if (searchQuery) {
      filtersHTML += `
        <div class="active-filter-tag">
          Search: "${searchQuery}"
          <button onclick="window.clearSearch()">×</button>
        </div>
      `;
    }

    // Categories
    selectedCategories.forEach((catId) => {
      const category = CaspianData.getAllCategories().find(
        (c) => c.id === catId,
      );
      if (category) {
        filtersHTML += `
          <div class="active-filter-tag">
            ${category.label}
            <button onclick="window.removeFilter('category', '${catId}')">×</button>
          </div>
        `;
      }
    });

    // Sub-categories
    selectedSubCategories.forEach((subCat) => {
      filtersHTML += `
        <div class="active-filter-tag">
          ${subCat}
          <button onclick="window.removeFilter('subCategory', '${subCat}')">×</button>
        </div>
      `;
    });

    // Tags
    selectedTags.forEach((tag) => {
      filtersHTML += `
        <div class="active-filter-tag">
          ${CaspianData.formatDisplayText(tag)}
          <button onclick="window.removeFilter('tag', '${tag}')">×</button>
        </div>
      `;
    });

    filtersHTML += `
      <button class="clear-filters-btn" onclick="window.clearAllFilters()">
        Clear All
      </button>
    </div>`;

    container.innerHTML = filtersHTML;
    container.style.display = "block";
  }

  // (removeFilter, clearSearch, and clearAllFilters functions are already exposed above)

  /**
   * Update results count
   */
  function updateResultsCount() {
    const count = filteredProducts.length;
    const total = allProducts.length;

    document.getElementById("resultsCount").innerHTML = `
      Showing <strong>${count}</strong> of <strong>${total}</strong> products
    `;
  }

  /**
   * Render products
   */
  function renderProducts() {
    const container = document.getElementById("productsGrid");

    if (filteredProducts.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3>No products found</h3>
          <p>Try adjusting your filters or search query</p>
          <button class="btn btn-primary" onclick="clearAllFilters()" style="margin-top: 16px;">
            Clear Filters
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredProducts
      .map((product) => renderProductCard(product))
      .join("");
  }

  /**
   * Render product card
   */
  function renderProductCard(product) {
    const firstImage =
      product.images && product.images[0]
        ? product.images[0]
        : "/home/women/assets/placeholder.jpg";
    const displayCategory = CaspianData.formatDisplayText(product.category);

    return `
      <div class="product-card" onclick="window.location.href='/home/women/product/?id=${product.id}'">
        <div class="product-image-wrapper">
          <img src="${firstImage}" alt="${product.name}" class="product-image" loading="lazy">
          ${product.featured === 1 ? '<span class="product-badge">Featured</span>' : ""}
        </div>
        <div class="product-info">
          <div class="product-category">${displayCategory}</div>
          <h3 class="product-name">${product.name}</h3>
          <div class="product-price">${product.price}</div>
          <div class="product-rating">
            <span class="rating-stars">★ ${product.rating}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Load categories dropdown
   */
  function loadCategoriesDropdown() {
    const dropdown = document.getElementById("categoriesDropdown");
    const categories = CaspianData.getAllCategories();

    if (categories.length === 0) {
      dropdown.innerHTML = '<a href="#">No categories</a>';
      return;
    }

    dropdown.innerHTML = categories
      .map(
        (cat) => `
      <a href="/home/women/category/?category=${cat.id}">${cat.label}</a>
    `,
      )
      .join("");
  }

  /**
   * Initialize search
   */
  function initializeSearch() {
    const searchInput = document.getElementById("searchInput");
    let searchTimeout;

    searchInput.addEventListener("input", function (e) {
      clearTimeout(searchTimeout);

      searchTimeout = setTimeout(() => {
        const query = e.target.value.trim();
        searchQuery = query;

        // Update URL
        const url = new URL(window.location);
        if (query) {
          url.searchParams.set("search", query);
        } else {
          url.searchParams.delete("search");
        }
        window.history.replaceState({}, "", url);

        applyFilters();
      }, 500);
    });
  }

  /**
   * Show error
   */
  function showError(message) {
    document.getElementById("productsGrid").innerHTML = `
      <div class="error-message" style="grid-column: 1 / -1;">
        ${message}
      </div>
    `;
  }
})();

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
  document.getElementById("navLinks").classList.toggle("active");
}

/**
 * Toggle categories dropdown
 */
function toggleDropdown() {
  document.getElementById("categoriesDropdown").classList.toggle("active");
}

/**
 * Toggle filters sidebar (mobile)
 */
function toggleFilters() {
  document.getElementById("filtersSidebar").classList.toggle("active");
}

// Close dropdowns when clicking outside
document.addEventListener("click", function (e) {
  if (!e.target.closest(".categories-dropdown")) {
    document.getElementById("categoriesDropdown").classList.remove("active");
  }

  if (
    !e.target.closest(".mobile-menu-toggle") &&
    !e.target.closest(".nav-links")
  ) {
    document.getElementById("navLinks").classList.remove("active");
  }

  if (
    !e.target.closest(".filter-mobile-toggle") &&
    !e.target.closest(".filters-sidebar")
  ) {
    document.getElementById("filtersSidebar").classList.remove("active");
  }
});
