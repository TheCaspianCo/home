/**
 * THE CASPIAN CO - CATEGORY PAGE
 * Dynamic category page with optional banner, sub-category and tag filters
 */

(async function () {
  "use strict";

  // Get category from URL
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get("category");

  if (!categoryId) {
    showError("Category not specified");
    return;
  }

  // State
  let allCategoryProducts = [];
  let filteredProducts = [];
  let selectedSubCategories = [];
  let selectedTags = [];
  let currentSort = "newest";
  let categoryConfig = null;

  // Load data
  const loaded = await CaspianData.loadAllData();
  if (!loaded) {
    showError("Failed to load data. Please refresh the page.");
    return;
  }

  // Get category config
  categoryConfig = CaspianData.getCategoryConfig(categoryId);

  if (!categoryConfig) {
    showError("Category not found");
    return;
  }

  // Initialize page
  allCategoryProducts = CaspianData.getProductsByCategory(categoryId);

  if (allCategoryProducts.length === 0) {
    showError("No products available in this category");
    return;
  }

  loadCategoriesDropdown();
  renderHeader();
  initializeFilters();
  applyFilters();
  initializeSearch();

  /**
   * Render header (banner or simple)
   */
  function renderHeader() {
    const categoryLabel = categoryConfig.label;

    // Update page title
    document.getElementById("pageTitle").textContent =
      `${categoryLabel} - The Caspian Co.`;

    console.log("Category config:", categoryConfig);
    console.log("Banner config:", categoryConfig.banner);

    // Check if banner is enabled - must be exactly 1 (number)
    if (categoryConfig.banner && categoryConfig.banner.enabled === 1) {
      console.log("Banner is enabled, attempting to render");
      renderBanner();
    } else {
      console.log(
        "Banner is disabled or not configured, rendering simple header",
      );
      renderSimpleHeader();
    }
  }

  /**
   * Render banner (if enabled)
   */
  function renderBanner() {
    const bannerSection = document.getElementById("categoryBanner");
    const banner = categoryConfig.banner;

    // Check if banner object exists and has images
    if (!banner || !banner.images || banner.images.length === 0) {
      console.log("No banner images found, rendering simple header");
      renderSimpleHeader();
      return;
    }

    const images = banner.images;
    bannerSection.style.display = "block";

    // Single image - static banner
    if (images.length === 1) {
      bannerSection.innerHTML = `
        <div class="category-banner">
          <div class="banner-slide active">
            <img src="${images[0]}" alt="${banner.heading || categoryConfig.label}" onerror="console.error('Failed to load banner image:', this.src)">
            <div class="banner-content">
              <h1>${banner.heading || categoryConfig.label}</h1>
              ${banner.subtext ? `<p>${banner.subtext}</p>` : ""}
            </div>
          </div>
        </div>
      `;
      console.log("Static banner rendered with image:", images[0]);
      return;
    }

    // Multiple images - slider
    const slidesHTML = images
      .map(
        (img, index) => `
      <div class="banner-slide ${index === 0 ? "active" : ""}">
        <img src="${img}" alt="${banner.heading || categoryConfig.label}" onerror="console.error('Failed to load banner image:', this.src)">
        <div class="banner-content">
          <h1>${banner.heading || categoryConfig.label}</h1>
          ${banner.subtext ? `<p>${banner.subtext}</p>` : ""}
        </div>
      </div>
    `,
      )
      .join("");

    const indicatorsHTML = images
      .map(
        (_, index) => `
      <span class="banner-indicator ${index === 0 ? "active" : ""}" onclick="goToBannerSlide(${index})"></span>
    `,
      )
      .join("");

    bannerSection.innerHTML = `
      <div class="category-banner">
        <div class="banner-slider">
          ${slidesHTML}
          ${images.length > 1 ? `<div class="banner-indicators">${indicatorsHTML}</div>` : ""}
        </div>
      </div>
    `;

    console.log("Banner slider rendered with", images.length, "images");

    // Initialize slider if multiple images
    if (images.length > 1) {
      initializeBannerSlider(images.length);
    }
  }

  /**
   * Initialize banner slider
   */
  function initializeBannerSlider(slideCount) {
    let currentSlide = 0;

    window.goToBannerSlide = function (index) {
      const slides = document.querySelectorAll(".banner-slide");
      const indicators = document.querySelectorAll(".banner-indicator");

      slides[currentSlide].classList.remove("active");
      indicators[currentSlide].classList.remove("active");

      currentSlide = index;

      slides[currentSlide].classList.add("active");
      indicators[currentSlide].classList.add("active");
    };

    // Auto-slide every 5 seconds
    setInterval(() => {
      const nextSlide = (currentSlide + 1) % slideCount;
      window.goToBannerSlide(nextSlide);
    }, 5000);
  }

  /**
   * Render simple header (no banner)
   */
  function renderSimpleHeader() {
    const headerSection = document.getElementById("categoryHeaderSimple");
    headerSection.style.display = "block";

    document.getElementById("categoryTitle").textContent = categoryConfig.label;
    document.getElementById("categoryDescription").textContent =
      `Browse our ${categoryConfig.label.toLowerCase()} collection`;
  }

  /**
   * Initialize filters dynamically from category products
   */
  function initializeFilters() {
    // Get unique sub-categories
    const subCategories =
      CaspianData.getUniqueSubCategories(allCategoryProducts);

    // Get unique tags
    const tags = CaspianData.getUniqueTags(allCategoryProducts);

    // Render filters
    renderSubCategoryFilters(subCategories);
    renderTagFilters(tags);
  }

  /**
   * Render sub-category filters
   */
  function renderSubCategoryFilters(subCategories) {
    const container = document.getElementById("subCategoryFilters");

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
               onchange="handleSubCategoryChange('${subCat}')">
        <label for="subcat_${subCat}">${subCat}</label>
      </div>
    `,
      )
      .join("");

    container.innerHTML = `
      <div class="filter-title">Sub Categories</div>
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
   * Apply all filters
   */
  function applyFilters() {
    let products = [...allCategoryProducts];

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

  /**
   * Update active filters display
   */
  function updateActiveFilters() {
    const container = document.getElementById("activeFilters");
    const hasFilters =
      selectedSubCategories.length > 0 || selectedTags.length > 0;

    if (!hasFilters) {
      container.style.display = "none";
      return;
    }

    let filtersHTML = '<div class="active-filters">';

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

  /**
   * Remove single filter
   */
  function removeFilter(type, value) {
    if (type === "subCategory") {
      selectedSubCategories = selectedSubCategories.filter((s) => s !== value);
      document.getElementById(`subcat_${value}`).checked = false;
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
    selectedSubCategories = [];
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
    const count = filteredProducts.length;
    const total = allCategoryProducts.length;

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
          <p>Try adjusting your filters</p>
          <button class="btn btn-primary" onclick="window.clearAllFilters()" style="margin-top: 16px;">
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
        : `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23e9ecef' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E`;

    return `
      <div class="product-card" onclick="window.location.href='/home/product/?id=${product.id}'">
        <div class="product-image-wrapper">
          <img src="${firstImage}" alt="${product.name}" class="product-image" loading="lazy">
          ${product.featured === 1 ? '<span class="product-badge">Featured</span>' : ""}
        </div>
        <div class="product-info">
          <div class="product-category">${product.sub_category || categoryConfig.label}</div>
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
      <a href="/home/category/?category=${cat.id}" ${cat.id === categoryId ? 'style="color: var(--accent-color); font-weight: 600;"' : ""}>
        ${cat.label}
      </a>
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
          window.location.href = `/home/picks/?search=${encodeURIComponent(query)}`;
        }
      }, 500);
    });
  }

  /**
   * Show error
   */
  function showError(message) {
    document.getElementById("categoryHeaderSimple").style.display = "block";
    document.getElementById("categoryTitle").textContent = "Error";
    document.getElementById("categoryDescription").textContent = message;

    document.getElementById("productsGrid").innerHTML = `
      <div class="error-message" style="grid-column: 1 / -1;">
        <h3>${message}</h3>
        <a href="/home" class="btn btn-primary" style="margin-top: 16px;">← Back to Home</a>
      </div>
    `;

    // Hide filters
    document.getElementById("filtersSidebar").style.display = "none";
  }

  // Expose functions to global scope
  window.handleSubCategoryChange = handleSubCategoryChange;
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
