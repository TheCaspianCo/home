/**
 * THE CASPIAN CO - HOME PAGE
 * Handles hero slider, recently added, category sections
 */

(async function() {
  'use strict';

  // Load all data
  const loaded = await CaspianData.loadAllData();
  if (!loaded) {
    showError('Failed to load data. Please refresh the page.');
    return;
  }

  // Initialize page
  initializeHero();
  loadCategoriesDropdown();
  loadRecentlyAdded();
  loadCategorySections();
  initializeSearch();

  /**
   * Initialize hero slider
   */
  function initializeHero() {
    const heroSection = document.getElementById('heroSection');
    const homeData = CaspianData.getHomeData();
    
    if (!homeData || !homeData.hero_banner || homeData.hero_banner.enabled !== 1) {
      heroSection.style.display = 'none';
      return;
    }

    const banner = homeData.hero_banner;
    const slides = banner.slides || [];

    if (slides.length === 0) {
      heroSection.style.display = 'none';
      return;
    }

    // Single slide - static banner
    if (slides.length === 1) {
      renderStaticBanner(slides[0]);
      return;
    }

    // Multiple slides - slider
    renderSlider(slides, banner.auto_slide === 1, banner.slide_interval || 4000);
  }

  /**
   * Render static banner
   */
  function renderStaticBanner(slide) {
    const heroSection = document.getElementById('heroSection');
    
    heroSection.innerHTML = `
      <div class="hero-slide active">
        <img src="${slide.image}" alt="${slide.heading}">
        <div class="hero-content">
          <h1>${slide.heading}</h1>
          <p>${slide.subtext}</p>
          ${slide.cta_text ? `<a href="${slide.cta_link}" class="hero-cta">${slide.cta_text}</a>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render slider with multiple slides
   */
  function renderSlider(slides, autoSlide, interval) {
    const heroSection = document.getElementById('heroSection');
    
    const slidesHTML = slides.map((slide, index) => `
      <div class="hero-slide ${index === 0 ? 'active' : ''}">
        <img src="${slide.image}" alt="${slide.heading}">
        <div class="hero-content">
          <h1>${slide.heading}</h1>
          <p>${slide.subtext}</p>
          ${slide.cta_text ? `<a href="${slide.cta_link}" class="hero-cta">${slide.cta_text}</a>` : ''}
        </div>
      </div>
    `).join('');

    const indicatorsHTML = slides.map((_, index) => `
      <span class="slider-indicator ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></span>
    `).join('');

    heroSection.innerHTML = `
      <div class="hero-slider">
        ${slidesHTML}
        <div class="slider-indicators">
          ${indicatorsHTML}
        </div>
      </div>
    `;

    // Initialize slider
    let currentSlide = 0;
    const slideElements = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.slider-indicator');

    window.goToSlide = function(index) {
      slideElements[currentSlide].classList.remove('active');
      indicators[currentSlide].classList.remove('active');
      
      currentSlide = index;
      
      slideElements[currentSlide].classList.add('active');
      indicators[currentSlide].classList.add('active');
    };

    function nextSlide() {
      const nextIndex = (currentSlide + 1) % slides.length;
      window.goToSlide(nextIndex);
    }

    // Auto slide
    if (autoSlide) {
      setInterval(nextSlide, interval);
    }
  }

  /**
   * Load categories dropdown
   */
  function loadCategoriesDropdown() {
    const dropdown = document.getElementById('categoriesDropdown');
    const categories = CaspianData.getAllCategories();

    if (categories.length === 0) {
      dropdown.innerHTML = '<a href="#">No categories</a>';
      return;
    }

    dropdown.innerHTML = categories.map(cat => `
      <a href="/home/women/category/?category=${cat.id}">${cat.label}</a>
    `).join('');
  }

  /**
   * Load recently added products
   */
  function loadRecentlyAdded() {
    const container = document.getElementById('recentlyAdded');
    const products = CaspianData.getRecentlyAddedProducts(6);

    if (products.length === 0) {
      container.innerHTML = '<div class="empty-state">No products available yet.</div>';
      return;
    }

    container.innerHTML = products.map(product => renderProductCard(product)).join('');
  }

  /**
   * Load category sections
   */
  function loadCategorySections() {
    const container = document.getElementById('categorySections');
    const categories = CaspianData.getAllCategories();

    // Show first 4 categories on home page
    const displayCategories = categories.slice(0, 4);

    if (displayCategories.length === 0) {
      return;
    }

    const sectionsHTML = displayCategories.map(category => {
      const products = CaspianData.getProductsByCategory(category.id, 3);
      
      if (products.length === 0) {
        return '';
      }

      return `
        <section class="section">
          <div class="container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
              <h2 class="section-title" style="margin-bottom: 0;">${category.label}</h2>
              <a href="/home/women/category/?category=${category.id}" class="btn btn-secondary">View all</a>
            </div>
            <div class="product-grid">
              ${products.map(product => renderProductCard(product)).join('')}
            </div>
          </div>
        </section>
      `;
    }).join('');

    container.innerHTML = sectionsHTML;
  }

  /**
   * Render product card
   */
  function renderProductCard(product) {
    const firstImage = product.images && product.images[0] ? product.images[0] : '/home/women/assets/placeholder.jpg';
    const displayCategory = CaspianData.formatDisplayText(product.category);
    
    return `
      <div class="product-card" onclick="window.location.href='/home/women/product/?id=${product.id}'">
        <div class="product-image-wrapper">
          <img src="${firstImage}" alt="${product.name}" class="product-image" loading="lazy">
          ${product.featured === 1 ? '<span class="product-badge">Featured</span>' : ''}
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
   * Initialize search
   */
  function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;

    searchInput.addEventListener('input', function(e) {
      clearTimeout(searchTimeout);
      
      searchTimeout = setTimeout(() => {
        const query = e.target.value.trim();
        
        if (query.length >= 2) {
          // Redirect to picks page with search query
          window.location.href = `/home/women/picks/?search=${encodeURIComponent(query)}`;
        }
      }, 500);
    });

    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query.length >= 2) {
          window.location.href = `/home/women/picks/?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }

  /**
   * Show error message
   */
  function showError(message) {
    document.getElementById('recentlyAdded').innerHTML = `
      <div class="error-message">${message}</div>
    `;
  }

})();

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
  const navLinks = document.getElementById('navLinks');
  navLinks.classList.toggle('active');
}

/**
 * Toggle categories dropdown
 */
function toggleDropdown() {
  const dropdown = document.getElementById('categoriesDropdown');
  dropdown.classList.toggle('active');
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.categories-dropdown')) {
    document.getElementById('categoriesDropdown').classList.remove('active');
  }
  
  if (!e.target.closest('.mobile-menu-toggle') && !e.target.closest('.nav-links')) {
    document.getElementById('navLinks').classList.remove('active');
  }
});