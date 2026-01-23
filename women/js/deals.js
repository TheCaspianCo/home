/**
 * THE CASPIAN CO - DEALS PAGE
 * Shows only featured products (featured === 1) with filters
 */

(async function () {
  "use strict";

  // State
  let allDeals = [];
  let filteredDeals = [];
  let selectedCategories = [];
  let selectedTags = [];
  let currentSort = "newest";

  // Load data
  const loaded = await CaspianData.loadAllData();
  if (!loaded) {
    showError("Failed to load data. Please refresh the page.");
    return;
  }

  // Initialize page
  allDeals = CaspianData.getFeaturedProducts();
  loadCategoriesDropdown();
  initializeFilters();
  applyFilters();
  initializeSearch();

  /**
   * Initialize filters dynamically from featured products
   */
  function initializeFilters() {
    if (allDeals.length === 0) {
      return;
    }

    // Get unique categories from featured products
    const categoryIds = [...new Set(allDeals.map((p) => p.category))];
    const categories = CaspianData.getAllCategories().filter((cat) =>
      categoryIds.includes(cat.id),
    );

    // Get unique tags from featured products
    const tags = CaspianData.getUniqueTags(allDeals);

    // Render filters
    renderCategoryFilters(categories);
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
   * Apply all filters
   */
  function applyFilters() {
    let products = [...allDeals];

    // Apply category filter
    if (selectedCategories.length > 0) {
      products = products.filter((p) =>
        selectedCategories.includes(p.category),
      );
    }

    // Apply tag filter (product must have ALL selected tags)
    if (selectedTags.length > 0) {
      products = products.filter((p) => {
        return selectedTags.every((tag) => p.tags && p.tags.includes(tag));
      });
    }

    filteredDeals = products;

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

    let sorted = [...filteredDeals];

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

    filteredDeals = sorted;
    renderProducts();
  }

  /**
   * Update active filters display
   */
  function updateActiveFilters() {
    const container = document.getElementById("activeFilters");
    const hasFilters = selectedCategories.length > 0 || selectedTags.length > 0;

    if (!hasFilters) {
      container.style.display = "none";
      return;
    }

    let filtersHTML = '<div class="active-filters">';

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

  /**
   * Remove single filter
   */
  function removeFilter(type, value) {
    if (type === "category") {
      selectedCategories = selectedCategories.filter((c) => c !== value);
      document.getElementById(`cat_${value}`).checked = false;
    } else if (type === "tag") {
      selectedTags = selectedTags.filter((t) => t !== value);
      document.getElementById(`tag_${value}`).checked = false;
    }

    applyFilters();
  }

  /**
   * Clear all filters
   */
  function clearAllFilters() {
    // Clear all selections
    selectedCategories = [];
    selectedTags = [];

    // Uncheck all checkboxes
    document
      .querySelectorAll('.filter-option input[type="checkbox"]')
      .forEach((cb) => {
        cb.checked = false;
      });

    applyFilters();
  }

  /**
   * Update results count
   */
  function updateResultsCount() {
    const count = filteredDeals.length;
    const total = allDeals.length;

    if (total === 0) {
      document.getElementById("resultsCount").innerHTML = `
        No featured deals available at the moment
      `;
      return;
    }

    document.getElementById("resultsCount").innerHTML = `
      Showing <strong>${count}</strong> of <strong>${total}</strong> featured products
    `;
  }

  /**
   * Render products
   */
  function renderProducts() {
    const container = document.getElementById("productsGrid");

    if (allDeals.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3>No Deals Available</h3>
          <p>Check back soon for our featured picks!</p>
          <a href="/home/women/picks/" class="btn btn-primary" style="margin-top: 16px;">
            Browse All Products
          </a>
        </div>
      `;
      return;
    }

    if (filteredDeals.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3>No products found</h3>
          <p>Try adjusting your filters</p>
          <button class="btn btn-primary" onclick="window.clearAllFilters()" style="margin-top: 16px;">
            Clear Filters
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredDeals
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
        : "/assets/placeholder.jpg";
    const displayCategory = CaspianData.formatDisplayText(product.category);

    return `
      <div class="product-card" onclick="window.location.href='/home/women/product/?id=${product.id}'">
        <div class="product-image-wrapper">
          <img src="${firstImage}" alt="${product.name}" class="product-image" loading="lazy">
          <span class="featured-badge-large">Featured</span>
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

        if (query.length >= 2) {
          window.location.href = `/home/women/picks/?search=${encodeURIComponent(query)}`;
        }
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

  // Expose functions to global scope
  window.handleCategoryChange = handleCategoryChange;
  window.handleTagChange = handleTagChange;
  window.applySorting = applySorting;
  window.removeFilter = removeFilter;
  window.clearAllFilters = clearAllFilters;
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
