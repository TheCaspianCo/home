/**
 * THE CASPIAN CO - GLOBAL DATA LAYER
 * Handles all data loading, filtering, and scheduling logic
 * Compatible with GitHub Pages (no ES modules)
 */

const CaspianData = (function () {
  "use strict";

  // Cache for loaded data
  let productsData = [];
  let categoriesData = [];
  let homeData = null;
  let dataLoaded = false;

  /**
   * Get current time in IST (Indian Standard Time)
   * @returns {Date} Current IST datetime
   */
  function getCurrentIST() {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utcTime + istOffset);
    return istTime;
  }

  /**
   * Check if product should be published based on IST time
   * @param {Object} product - Product object
   * @returns {boolean} True if product should be visible
   */
  function isProductPublished(product) {
    // If no publish_at, product is immediately visible
    if (!product.publish_at) {
      return true;
    }

    try {
      const currentIST = getCurrentIST();
      const publishTime = new Date(product.publish_at);
      return currentIST >= publishTime;
    } catch (error) {
      console.warn("Invalid publish_at format:", product.publish_at);
      return true; // Fallback: show product if publish_at is invalid
    }
  }

  /**
   * Load all data files
   * @returns {Promise<boolean>} Success status
   */
  async function loadAllData() {
    if (dataLoaded) return true;

    try {
      // Load all JSON files in parallel
      const [productsRes, categoriesRes, homeRes] = await Promise.all([
        fetch("/home/women/data/womenproducts.json"),
        fetch("/home/women/data/categories.json"),
        fetch("/home/women/data/home.json"),
      ]);

      if (!productsRes.ok || !categoriesRes.ok || !homeRes.ok) {
        throw new Error("Failed to load data files");
      }

      productsData = await productsRes.json();
      categoriesData = await categoriesRes.json();
      homeData = await homeRes.json();

      dataLoaded = true;
      return true;
    } catch (error) {
      console.error("Error loading data:", error);
      return false;
    }
  }

  /**
   * Get all active and published products
   * @returns {Array} Filtered products
   */
  function getAllActiveProducts() {
    return productsData.filter((product) => {
      return product.active === 1 && isProductPublished(product);
    });
  }

  /**
   * Get product by ID
   * @param {string} id - Product ID
   * @returns {Object|null} Product object or null
   */
  function getProductById(id) {
    const product = productsData.find((p) => p.id === id);

    if (!product) return null;

    // Check if product is active and published
    if (product.active !== 1 || !isProductPublished(product)) {
      return null;
    }

    return product;
  }

  /**
   * Get products by category
   * @param {string} category - Category ID
   * @param {number} limit - Optional limit
   * @returns {Array} Filtered products
   */
  function getProductsByCategory(category, limit = null) {
    let products = getAllActiveProducts().filter(
      (p) => p.category === category,
    );

    if (limit) {
      products = products.slice(0, limit);
    }

    return products;
  }

  /**
   * Get recently added products
   * @param {number} limit - Number of products to return
   * @returns {Array} Recently added products
   */
  function getRecentlyAddedProducts(limit = 6) {
    const activeProducts = getAllActiveProducts();

    // Sort by added_date (newest first)
    const sorted = activeProducts.sort((a, b) => {
      const dateA = new Date(a.added_date);
      const dateB = new Date(b.added_date);
      return dateB - dateA;
    });

    return sorted.slice(0, limit);
  }

  /**
   * Get featured products (deals)
   * @returns {Array} Featured products
   */
  function getFeaturedProducts() {
    return getAllActiveProducts().filter((p) => p.featured === 1);
  }

  /**
   * Get category configuration
   * @param {string} categoryId - Category ID
   * @returns {Object|null} Category config or null
   */
  function getCategoryConfig(categoryId) {
    return categoriesData.find((cat) => cat.id === categoryId) || null;
  }

  /**
   * Get all categories (only those with active products)
   * @returns {Array} Categories with products
   */
  function getAllCategories() {
    const activeProducts = getAllActiveProducts();
    const categoriesWithProducts = new Set(
      activeProducts.map((p) => p.category),
    );

    return categoriesData.filter((cat) => categoriesWithProducts.has(cat.id));
  }

  /**
   * Get unique tags from products
   * @param {Array} products - Products array
   * @returns {Array} Unique tags sorted alphabetically
   */
  function getUniqueTags(products) {
    const tagsSet = new Set();

    products.forEach((product) => {
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach((tag) => tagsSet.add(tag));
      }
    });

    return Array.from(tagsSet).sort();
  }

  /**
   * Get unique sub-categories from products
   * @param {Array} products - Products array
   * @returns {Array} Unique sub-categories
   */
  function getUniqueSubCategories(products) {
    const subCatsSet = new Set();

    products.forEach((product) => {
      if (product.sub_category) {
        subCatsSet.add(product.sub_category);
      }
    });

    return Array.from(subCatsSet).sort();
  }

  /**
   * Filter products by tags and sub-categories
   * @param {Array} products - Products to filter
   * @param {Array} selectedTags - Selected tag filters
   * @param {Array} selectedSubCats - Selected sub-category filters
   * @returns {Array} Filtered products
   */
  function filterProducts(products, selectedTags = [], selectedSubCats = []) {
    if (selectedTags.length === 0 && selectedSubCats.length === 0) {
      return products;
    }

    return products.filter((product) => {
      // Check tags
      let matchesTags = true;
      if (selectedTags.length > 0) {
        matchesTags = selectedTags.every(
          (tag) => product.tags && product.tags.includes(tag),
        );
      }

      // Check sub-categories
      let matchesSubCat = true;
      if (selectedSubCats.length > 0) {
        matchesSubCat = selectedSubCats.includes(product.sub_category);
      }

      return matchesTags && matchesSubCat;
    });
  }

  /**
   * Search products by query
   * @param {string} query - Search query
   * @returns {Array} Matching products
   */
  function searchProducts(query) {
    if (!query || query.trim() === "") {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const activeProducts = getAllActiveProducts();

    return activeProducts.filter((product) => {
      return (
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        (product.sub_category &&
          product.sub_category.toLowerCase().includes(searchTerm)) ||
        (product.tags &&
          product.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
      );
    });
  }

  /**
   * Get platform CTA configuration
   * @param {Object} platform - Platform object
   * @returns {Object} CTA configuration
   */
  function getPlatformCTA(platform) {
    const configs = {
      amazon: {
        text: "View on Amazon",
        color: "#FF9900",
        hoverColor: "#E88B00",
      },
      flipkart: {
        text: "View on Flipkart",
        color: "#2874F0",
        hoverColor: "#1E5BC6",
      },
      myntra: {
        text: "View on Myntra",
        color: "#EE3F7D",
        hoverColor: "#D63569",
      },
      ajio: {
        text: "View on Ajio",
        color: "#B88E2F",
        hoverColor: "#9A7728",
      },
      other: {
        text: platform.name ? `Visit ${platform.name}` : "Visit Official Store",
        color: "#1a1a1a",
        hoverColor: "#000000",
      },
    };

    return configs[platform.type] || configs.other;
  }

  /**
   * Get home page data
   * @returns {Object} Home page configuration
   */
  function getHomeData() {
    return homeData;
  }

  /**
   * Format display text from slug
   * @param {string} text - Text with hyphens or underscores
   * @returns {string} Formatted text
   */
  function formatDisplayText(text) {
    if (!text) return "";

    return text
      .replace(/[-_]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Get related products
   * @param {string} productId - Current product ID
   * @param {string} category - Product category
   * @param {number} limit - Number of products to return
   * @returns {Array} Related products
   */
  function getRelatedProducts(productId, category, limit = 4) {
    const categoryProducts = getProductsByCategory(category);

    // Exclude current product
    const relatedProducts = categoryProducts.filter((p) => p.id !== productId);

    // Shuffle and limit
    const shuffled = relatedProducts.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }

  // Public API
  return {
    loadAllData,
    getAllActiveProducts,
    getProductById,
    getProductsByCategory,
    getRecentlyAddedProducts,
    getFeaturedProducts,
    getCategoryConfig,
    getAllCategories,
    getUniqueTags,
    getUniqueSubCategories,
    filterProducts,
    searchProducts,
    getPlatformCTA,
    getHomeData,
    formatDisplayText,
    getRelatedProducts,
    getCurrentIST,
  };
})();


