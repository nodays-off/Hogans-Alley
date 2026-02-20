/**
 * Hogan's Alley Product Page Module
 * Handles size selection, inventory display, and add-to-cart functionality
 *
 * @author Hogan's Alley
 * @version 1.0.0
 */

(function() {
  'use strict';

  /**
   * Valid sizes for all products
   * @type {string[]}
   */
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  /**
   * Low stock threshold - shows "Only X left" warning
   * @type {number}
   */
  const LOW_STOCK_THRESHOLD = 3;

  /**
   * Duration to show "Added" success state (ms)
   * @type {number}
   */
  const SUCCESS_STATE_DURATION = 1500;

  /**
   * Product page state
   */
  let state = {
    productId: null,
    productName: null,
    productCollection: null,
    productPrice: null,
    productImage: null,
    selectedSize: null,
    selectedQuantity: 1,
    inventory: {},
    isLoading: false,
    error: null
  };

  /**
   * DOM element references
   */
  let elements = {
    productSection: null,
    sizeSelector: null,
    sizeOptions: null,
    quantitySelector: null,
    quantityValue: null,
    quantityMinus: null,
    quantityPlus: null,
    addToCartBtn: null,
    addToCartText: null,
    addToCartError: null,
    priceDisplay: null
  };

  /**
   * Initializes the product page functionality
   * Called when DOM is ready
   */
  function initProductPage() {
    // Find product section with data attributes
    elements.productSection = document.querySelector('[data-product-id]');

    if (!elements.productSection) {
      console.warn('[ProductPage] No product section found with data-product-id attribute');
      return;
    }

    // Extract product data from attributes
    state.productId = elements.productSection.dataset.productId;
    state.productName = elements.productSection.dataset.productName;
    state.productCollection = elements.productSection.dataset.productCollection;
    state.productPrice = parseFloat(elements.productSection.dataset.productPrice) || 300;
    state.productImage = elements.productSection.dataset.productImage || '';

    if (!state.productId) {
      console.error('[ProductPage] Missing data-product-id attribute');
      return;
    }

    // Cache DOM elements
    cacheElements();

    // Render initial UI
    renderSizeSelector();
    renderQuantitySelector();
    renderAddToCart();

    // Bind event handlers
    bindEvents();

    // Track product view
    if (window.hogansAnalytics) {
      window.hogansAnalytics.trackViewItem({
        id: state.productId,
        name: state.productName,
        collection: state.productCollection,
        price: state.productPrice
      });
    }

    // Fetch inventory data
    fetchAndDisplayInventory(state.productId);
  }

  /**
   * Caches DOM element references
   */
  function cacheElements() {
    elements.sizeSelector = document.querySelector('.size-selector');
    elements.sizeOptions = document.querySelector('.size-selector__options');
    elements.quantitySelector = document.querySelector('.quantity-selector');
    elements.quantityValue = document.querySelector('.quantity-selector__value');
    elements.quantityMinus = document.querySelector('.quantity-selector__btn--minus');
    elements.quantityPlus = document.querySelector('.quantity-selector__btn--plus');
    elements.addToCartBtn = document.querySelector('.add-to-cart__btn');
    elements.addToCartText = document.querySelector('.add-to-cart__text');
    elements.addToCartError = document.querySelector('.add-to-cart__error');
    elements.priceDisplay = document.querySelector('.product-purchase__price');
  }

  /**
   * Binds event listeners
   */
  function bindEvents() {
    // Size selection (delegated)
    if (elements.sizeOptions) {
      elements.sizeOptions.addEventListener('click', handleSizeClick);
    }

    // Quantity controls
    if (elements.quantityMinus) {
      elements.quantityMinus.addEventListener('click', handleQuantityMinus);
    }

    if (elements.quantityPlus) {
      elements.quantityPlus.addEventListener('click', handleQuantityPlus);
    }

    // Add to cart
    if (elements.addToCartBtn) {
      elements.addToCartBtn.addEventListener('click', handleAddToCart);
    }
  }

  /**
   * Fetches inventory data and updates the UI
   * @param {string} productId - Product slug
   */
  async function fetchAndDisplayInventory(productId) {
    state.isLoading = true;
    updateLoadingState(true);

    try {
      // Check if inventoryManager is available
      if (typeof window.inventoryManager === 'undefined') {
        // Fallback: assume all sizes in stock if no inventory manager
        console.warn('[ProductPage] InventoryManager not available, using fallback');
        SIZES.forEach(size => {
          state.inventory[size] = { quantity: 10, status: 'in_stock' };
        });
        renderSizeButtons(state.inventory);
        return;
      }

      const data = await window.inventoryManager.fetchInventory(productId);

      if (data && data.inventory) {
        state.inventory = data.inventory;
        renderSizeButtons(state.inventory);

        // Subscribe to real-time updates
        window.inventoryManager.subscribeToUpdates(productId, handleInventoryUpdate);
      }
    } catch (error) {
      console.error('[ProductPage] Failed to fetch inventory:', error);
      state.error = 'Unable to load inventory. Please refresh the page.';
      showError(state.error);

      // Fallback: show all sizes as available
      SIZES.forEach(size => {
        state.inventory[size] = { quantity: 10, status: 'in_stock' };
      });
      renderSizeButtons(state.inventory);
    } finally {
      state.isLoading = false;
      updateLoadingState(false);
    }
  }

  /**
   * Handles real-time inventory updates
   * @param {Object} data - Updated inventory data
   */
  function handleInventoryUpdate(data) {
    if (data && data.inventory) {
      state.inventory = data.inventory;
      renderSizeButtons(state.inventory);

      // If selected size is now sold out, deselect it
      if (state.selectedSize) {
        const sizeData = state.inventory[state.selectedSize];
        if (!sizeData || sizeData.quantity <= 0) {
          state.selectedSize = null;
          updateAddToCartState();
        }
      }
    }
  }

  /**
   * Renders the size selector container
   */
  function renderSizeSelector() {
    const container = elements.productSection.querySelector('.product-purchase') ||
                      createProductPurchaseSection();

    const html = `
      <div class="size-selector">
        <label class="size-selector__label">Select Size</label>
        <div class="size-selector__options"></div>
        <div class="size-selector__loading">
          <span class="size-selector__spinner"></span>
          <span>Loading sizes...</span>
        </div>
        <div class="size-selector__error"></div>
      </div>
    `;

    // Check if size selector already exists
    if (!container.querySelector('.size-selector')) {
      container.insertAdjacentHTML('beforeend', html);
    }

    // Re-cache elements
    elements.sizeSelector = container.querySelector('.size-selector');
    elements.sizeOptions = container.querySelector('.size-selector__options');
  }

  /**
   * Renders individual size buttons based on inventory
   * @param {Object} inventory - Inventory data by size
   */
  function renderSizeButtons(inventory) {
    if (!elements.sizeOptions) return;

    const buttons = SIZES.map(size => {
      const sizeData = inventory[size] || { quantity: 0, status: 'sold_out' };
      const quantity = sizeData.quantity || 0;
      const isSoldOut = quantity <= 0;
      const isLowStock = !isSoldOut && quantity <= LOW_STOCK_THRESHOLD;
      const isSelected = state.selectedSize === size;

      let classes = ['size-btn'];
      if (isSelected) classes.push('size-btn--selected');
      if (isSoldOut) classes.push('size-btn--sold-out');
      if (isLowStock) classes.push('size-btn--low-stock');

      let statusHtml = '';
      if (isLowStock && !isSoldOut) {
        statusHtml = `<span class="size-btn__status">Only ${quantity} left</span>`;
      }

      return `
        <button
          type="button"
          class="${classes.join(' ')}"
          data-size="${size}"
          ${isSoldOut ? 'disabled' : ''}
          aria-label="${size}${isSoldOut ? ' - Sold out' : ''}${isLowStock ? ` - Only ${quantity} left` : ''}"
          aria-pressed="${isSelected}"
        >
          ${size}
          ${statusHtml}
        </button>
      `;
    }).join('');

    elements.sizeOptions.innerHTML = buttons;
  }

  /**
   * Renders the quantity selector
   */
  function renderQuantitySelector() {
    const container = elements.productSection.querySelector('.product-purchase') ||
                      createProductPurchaseSection();

    const html = `
      <div class="quantity-selector">
        <label class="quantity-selector__label">Quantity</label>
        <div class="quantity-selector__controls">
          <button type="button" class="quantity-selector__btn quantity-selector__btn--minus" aria-label="Decrease quantity" disabled>-</button>
          <span class="quantity-selector__value">1</span>
          <button type="button" class="quantity-selector__btn quantity-selector__btn--plus" aria-label="Increase quantity">+</button>
        </div>
      </div>
    `;

    // Check if quantity selector already exists
    if (!container.querySelector('.quantity-selector')) {
      container.insertAdjacentHTML('beforeend', html);
    }

    // Re-cache elements
    elements.quantitySelector = container.querySelector('.quantity-selector');
    elements.quantityValue = container.querySelector('.quantity-selector__value');
    elements.quantityMinus = container.querySelector('.quantity-selector__btn--minus');
    elements.quantityPlus = container.querySelector('.quantity-selector__btn--plus');
  }

  /**
   * Renders the add to cart button
   */
  function renderAddToCart() {
    const container = elements.productSection.querySelector('.product-purchase') ||
                      createProductPurchaseSection();

    const formattedPrice = `$${state.productPrice.toLocaleString('en-CA')} CAD`;

    const html = `
      <div class="add-to-cart">
        <p class="product-purchase__price">${formattedPrice}</p>
        <p class="product-purchase__price-note">Free shipping on orders over $200</p>
        <button type="button" class="add-to-cart__btn" disabled>
          <span class="add-to-cart__text">Select a Size</span>
          <span class="add-to-cart__spinner"></span>
        </button>
        <p class="add-to-cart__error"></p>
      </div>
    `;

    // Check if add to cart already exists
    if (!container.querySelector('.add-to-cart')) {
      container.insertAdjacentHTML('beforeend', html);
    }

    // Re-cache elements
    elements.addToCartBtn = container.querySelector('.add-to-cart__btn');
    elements.addToCartText = container.querySelector('.add-to-cart__text');
    elements.addToCartError = container.querySelector('.add-to-cart__error');
    elements.priceDisplay = container.querySelector('.product-purchase__price');
  }

  /**
   * Creates the product purchase section if it doesn't exist
   * @returns {HTMLElement} The product purchase container
   */
  function createProductPurchaseSection() {
    const section = document.createElement('div');
    section.className = 'product-purchase';

    // Insert after the specs section or at the end of product section
    const specsSection = elements.productSection.querySelector('.specs');
    if (specsSection) {
      specsSection.insertAdjacentElement('afterend', section);
    } else {
      elements.productSection.appendChild(section);
    }

    return section;
  }

  /**
   * Handles click on size buttons
   * @param {Event} event - Click event
   */
  function handleSizeClick(event) {
    const button = event.target.closest('.size-btn');
    if (!button || button.disabled) return;

    const size = button.dataset.size;
    handleSizeSelection(size);
  }

  /**
   * Updates selected size state and UI
   * @param {string} size - Selected size
   */
  function handleSizeSelection(size) {
    // Update state
    state.selectedSize = size;

    // Update button states
    const buttons = elements.sizeOptions.querySelectorAll('.size-btn');
    buttons.forEach(btn => {
      const isSelected = btn.dataset.size === size;
      btn.classList.toggle('size-btn--selected', isSelected);
      btn.setAttribute('aria-pressed', isSelected);
    });

    // Reset quantity to 1 when size changes
    state.selectedQuantity = 1;
    updateQuantityDisplay();

    // Update add to cart button
    updateAddToCartState();
  }

  /**
   * Handles quantity decrease
   */
  function handleQuantityMinus() {
    if (state.selectedQuantity > 1) {
      state.selectedQuantity--;
      updateQuantityDisplay();
    }
  }

  /**
   * Handles quantity increase
   */
  function handleQuantityPlus() {
    const maxQuantity = getMaxQuantity();
    if (state.selectedQuantity < maxQuantity) {
      state.selectedQuantity++;
      updateQuantityDisplay();
    }
  }

  /**
   * Gets maximum quantity allowed for selected size
   * @returns {number} Maximum quantity (1-3, capped by inventory)
   */
  function getMaxQuantity() {
    if (!state.selectedSize) return 3;

    const sizeData = state.inventory[state.selectedSize];
    const available = sizeData ? sizeData.quantity : 0;
    return Math.min(3, available);
  }

  /**
   * Updates the quantity display and button states
   */
  function updateQuantityDisplay() {
    if (elements.quantityValue) {
      elements.quantityValue.textContent = state.selectedQuantity;
    }

    const maxQuantity = getMaxQuantity();

    if (elements.quantityMinus) {
      elements.quantityMinus.disabled = state.selectedQuantity <= 1;
    }

    if (elements.quantityPlus) {
      elements.quantityPlus.disabled = state.selectedQuantity >= maxQuantity;
    }
  }

  /**
   * Updates add to cart button state based on selection
   */
  function updateAddToCartState() {
    if (!elements.addToCartBtn || !elements.addToCartText) return;

    if (!state.selectedSize) {
      elements.addToCartBtn.disabled = true;
      elements.addToCartText.textContent = 'Select a Size';
    } else {
      const sizeData = state.inventory[state.selectedSize];
      const available = sizeData ? sizeData.quantity : 0;

      if (available <= 0) {
        elements.addToCartBtn.disabled = true;
        elements.addToCartText.textContent = 'Sold Out';
      } else {
        elements.addToCartBtn.disabled = false;
        elements.addToCartText.textContent = 'Add to Cart';
      }
    }
  }

  /**
   * Handles add to cart action
   */
  function handleAddToCart() {
    // Validate size is selected
    if (!state.selectedSize) {
      showError('Please select a size');
      return;
    }

    // Validate inventory
    const sizeData = state.inventory[state.selectedSize];
    if (!sizeData || sizeData.quantity <= 0) {
      showError('This size is sold out');
      return;
    }

    // Check if cart is available
    if (typeof window.cart === 'undefined') {
      showError('Cart is not available. Please refresh the page.');
      return;
    }

    // Clear any previous errors
    hideError();

    // Add item to cart
    const result = window.cart.addItem({
      productId: state.productId,
      collection: state.productCollection,
      name: state.productName,
      size: state.selectedSize,
      price: state.productPrice,
      currency: 'CAD',
      image: state.productImage
    });

    if (result.success) {
      // Track add to cart event
      if (window.hogansAnalytics) {
        window.hogansAnalytics.trackAddToCart({
          id: state.productId,
          name: state.productName,
          collection: state.productCollection,
          price: state.productPrice
        }, state.selectedSize, state.selectedQuantity);
      }

      // Show success state
      showAddedState();
    } else {
      showError(result.message);
    }
  }

  /**
   * Shows the "Added" success state and opens cart drawer
   */
  function showAddedState() {
    if (!elements.addToCartBtn || !elements.addToCartText) return;

    // Update button to success state
    elements.addToCartBtn.classList.add('add-to-cart__btn--success');
    elements.addToCartText.textContent = 'Added';

    // After delay, reset and open cart
    setTimeout(() => {
      // Reset button
      elements.addToCartBtn.classList.remove('add-to-cart__btn--success');
      elements.addToCartText.textContent = 'Add to Cart';

      // Open cart drawer
      if (typeof window.openCart === 'function') {
        window.openCart();
      } else if (window.cartDrawer && typeof window.cartDrawer.open === 'function') {
        window.cartDrawer.open();
      }
    }, SUCCESS_STATE_DURATION);
  }

  /**
   * Updates loading state UI
   * @param {boolean} isLoading - Whether loading is in progress
   */
  function updateLoadingState(isLoading) {
    if (elements.sizeSelector) {
      elements.sizeSelector.classList.toggle('size-selector--loading', isLoading);
    }
  }

  /**
   * Shows an error message
   * @param {string} message - Error message to display
   */
  function showError(message) {
    if (elements.addToCartError) {
      elements.addToCartError.textContent = message;
      elements.addToCartError.parentElement.classList.add('add-to-cart--error');
    }

    // Also show in size selector if it's a size-related error
    const sizeError = document.querySelector('.size-selector__error');
    if (sizeError && message.toLowerCase().includes('size')) {
      sizeError.textContent = message;
      elements.sizeSelector.classList.add('size-selector--error');
    }
  }

  /**
   * Hides error messages
   */
  function hideError() {
    if (elements.addToCartError) {
      elements.addToCartError.textContent = '';
      elements.addToCartError.parentElement.classList.remove('add-to-cart--error');
    }

    const sizeError = document.querySelector('.size-selector__error');
    if (sizeError) {
      sizeError.textContent = '';
      if (elements.sizeSelector) {
        elements.sizeSelector.classList.remove('size-selector--error');
      }
    }
  }

  /**
   * Updates cart badge in navigation
   */
  function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge && window.cart) {
      const count = window.cart.getItemCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? '' : 'none';
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductPage);
  } else {
    initProductPage();
  }

  // Subscribe to cart changes for badge updates
  if (typeof window !== 'undefined') {
    // Wait for cart to be available
    const checkCart = setInterval(() => {
      if (window.cart && typeof window.cart.subscribe === 'function') {
        window.cart.subscribe(updateCartBadge);
        updateCartBadge(); // Initial update
        clearInterval(checkCart);
      }
    }, 100);

    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkCart), 5000);
  }

  // Export for module systems (if applicable)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initProductPage };
  }

})();
