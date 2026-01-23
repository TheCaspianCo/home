/**
 * THE CASPIAN CO - PRODUCT DETAILS PAGE
 * Handles product display, image gallery, CTA, share, and related products
 */

(async function () {
  "use strict";

  // Get product ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (!productId) {
    showError("Product not found");
    return;
  }

  // Load data
  const loaded = await CaspianData.loadAllData();
  if (!loaded) {
    showError("Failed to load data");
    return;
  }

  // Get product
  const product = CaspianData.getProductById(productId);

  if (!product) {
    showError("Product not found or not available");
    return;
  }

  // Initialize page
  loadCategoriesDropdown();
  renderProduct(product);
  loadRelatedProducts(product);
  initializeSearch();

  /**
   * Render product details
   */
  function renderProduct(product) {
    const container = document.getElementById("productContainer");
    const ctaConfig = CaspianData.getPlatformCTA(product.platform);

    // Update page title
    document.getElementById("pageTitle").textContent =
      `${product.name} - The Caspian Co`;

    // Render images section
    const imagesHTML = renderImages(product.images);

    // Render highlights
    const highlightsHTML =
      product.highlights && product.highlights.length > 0
        ? `
        <div class="highlights-section">
          <h3>Key Features</h3>
          <ul class="highlights-list">
            ${product.highlights.map((h) => `<li>${h}</li>`).join("")}
          </ul>
        </div>
      `
        : "";

    // Render tags
    const tagsHTML =
      product.tags && product.tags.length > 0
        ? `
        <div class="tags-section">
          ${product.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
        </div>
      `
        : "";

    container.innerHTML = `
      <div class="product-images">
        ${imagesHTML}
      </div>
      
      <div class="product-details">
        <h1>${product.name}</h1>
        
        <div class="product-meta">
          <div class="product-rating-detail">
            <span class="stars">★ ${product.rating}</span>
          </div>
          <span style="color: var(--text-muted);">|</span>
          <span style="font-size: 14px; color: var(--text-secondary);">${CaspianData.formatDisplayText(product.category)}</span>
        </div>
        
        <div class="product-price-detail">${product.price}</div>
        
        ${highlightsHTML}
        
        <div class="description-section">
          <h3>About this product</h3>
          <p>${product.description}</p>
        </div>
        
        <div class="cta-section">
          <a href="${product.platform.link}" 
             target="_blank" 
             rel="noopener noreferrer nofollow"
             class="btn btn-cta"
             style="background: ${ctaConfig.color}; color: white;"
             onmouseover="this.style.background='${ctaConfig.hoverColor}'"
             onmouseout="this.style.background='${ctaConfig.color}'">
            ${ctaConfig.text}
          </a>
          <button class="btn-share" onclick="shareProduct()" title="Share product">
            📤 Share
          </button>
        </div>
        
        ${
          product.platform.type === "other" && product.platform.name
            ? `
          <div style="font-size: 14px; color: var(--text-muted); margin-top: 12px;">
            Available at: ${product.platform.name}
          </div>
        `
            : ""
        }
        
        ${tagsHTML}
      </div>
    `;

    // Initialize image gallery
    if (product.images && product.images.length > 1) {
      initializeImageGallery(product.images);
    }
  }

  /**
   * Render images section
   */
  function renderImages(images) {
    if (!images || images.length === 0) {
      return `
        <div class="main-image-wrapper">
          <img src="/assets/placeholder.jpg" alt="Product" class="main-image" id="mainImage">
        </div>
      `;
    }

    const mainImage = images[0];
    const thumbnailsHTML =
      images.length > 1
        ? `
        <div class="image-thumbnails">
          ${images
            .map(
              (img, index) => `
            <img src="${img}" 
                 alt="Product image ${index + 1}" 
                 class="thumbnail ${index === 0 ? "active" : ""}" 
                 onclick="changeMainImage('${img}', ${index})"
                 loading="lazy">
          `,
            )
            .join("")}
        </div>
      `
        : "";

    return `
      <div class="main-image-wrapper">
        <img src="${mainImage}" alt="Product" class="main-image" id="mainImage">
      </div>
      ${thumbnailsHTML}
    `;
  }

  /**
   * Initialize image gallery
   */
  function initializeImageGallery(images) {
    window.changeMainImage = function (imageSrc, index) {
      const mainImage = document.getElementById("mainImage");
      const thumbnails = document.querySelectorAll(".thumbnail");

      mainImage.src = imageSrc;

      thumbnails.forEach((thumb, i) => {
        if (i === index) {
          thumb.classList.add("active");
        } else {
          thumb.classList.remove("active");
        }
      });
    };
  }

  /**
   * Share product
   */
  window.shareProduct = async function () {
    const url = window.location.href;
    const title = product.name;
    const text = `Check out ${product.name} on The Caspian Co`;

    // Try Web Share API first (mobile support)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url,
        });
        return;
      } catch (err) {
        // User cancelled or share failed
        if (err.name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }

    // Fallback: Show share options
    const shareOptions = [
      {
        name: "WhatsApp",
        url: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      },
      {
        name: "Telegram",
        url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      },
      {
        name: "Copy Link",
        action: "copy",
      },
    ];

    const choice = prompt(
      "Share via:\n1. WhatsApp\n2. Telegram\n3. Copy Link\n\nEnter number (1-3):",
    );

    if (choice === "1") {
      window.open(shareOptions[0].url, "_blank");
    } else if (choice === "2") {
      window.open(shareOptions[1].url, "_blank");
    } else if (choice === "3") {
      // Copy to clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          alert("Link copied to clipboard!");
        });
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        alert("Link copied to clipboard!");
      }
    }
  };

  /**
   * Load related products
   */
  function loadRelatedProducts(product) {
    const container = document.getElementById("relatedProducts");
    const related = CaspianData.getRelatedProducts(
      product.id,
      product.category,
      4,
    );

    if (related.length === 0) {
      container.style.display = "none";
      return;
    }

    container.innerHTML = `
      <h2 class="section-title">You might also like</h2>
      <div class="product-grid">
        ${related.map((p) => renderProductCard(p)).join("")}
      </div>
    `;
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
    document.getElementById("productContainer").innerHTML = `
      <div class="error-message">
        <h2>${message}</h2>
        <p><a href="/home/women" class="btn btn-primary" style="margin-top: 16px;">← Back to Home</a></p>
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
});
