/**
 * Hogan's Alley Cart Drawer Component
 * Premium rainwear e-commerce cart drawer UI
 *
 * @author Hogan's Alley
 * @version 1.0.0
 */

/**
 * CartDrawer class for managing the slide-out cart drawer UI
 * Integrates with CartManager (window.cart) for state management
 */
class CartDrawer {
  /**
   * Creates a new CartDrawer instance
   * Automatically renders, binds events, and subscribes to cart changes
   */
  constructor() {
    /** @type {boolean} */
    this.isOpen = false;

    /** @type {HTMLElement|null} */
    this.drawer = null;

    /** @type {HTMLElement|null} */
    this.itemsContainer = null;

    /** @type {HTMLElement|null} */
    this.countElement = null;

    /** @type {HTMLElement|null} */
    this.subtotalElement = null;

    /** @type {HTMLElement|null} */
    this.checkoutButton = null;

    this.render();
    this.bindEvents();

    // Subscribe to cart changes
    if (window.cart && typeof window.cart.subscribe === 'function') {
      window.cart.subscribe(() => this.update());
    }

    // Initial update
    this.update();
  }

  /**
   * Renders the cart drawer HTML structure and injects into body
   * @returns {void}
   */
  render() {
    // Create drawer element
    this.drawer = document.createElement('div');
    this.drawer.id = 'cart-drawer';
    this.drawer.className = 'cart-drawer';

    this.drawer.innerHTML = `
      <div class="cart-drawer__backdrop"></div>
      <div class="cart-drawer__panel">
        <header class="cart-drawer__header">
          <h2 class="cart-drawer__title">Your Cart (<span class="cart-drawer__count">0</span>)</h2>
          <button class="cart-drawer__close" aria-label="Close cart">&times;</button>
        </header>
        <div class="cart-drawer__items"></div>
        <footer class="cart-drawer__footer">
          <div class="cart-drawer__subtotal">
            <span class="cart-drawer__subtotal-label">Subtotal</span>
            <span class="cart-drawer__subtotal-value">$0 CAD</span>
          </div>
          <p class="cart-drawer__shipping-note">Shipping calculated at checkout</p>
          <button class="cart-drawer__checkout">Checkout</button>
          <button class="cart-drawer__continue">Continue Shopping</button>
        </footer>
        <div class="cart-drawer__empty">
          <svg class="cart-drawer__empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 01-8 0"></path>
          </svg>
          <h3 class="cart-drawer__empty-title">Your cart is empty</h3>
          <p class="cart-drawer__empty-text">Looks like you haven't added anything yet.</p>
          <a href="/shop.html" class="cart-drawer__start-shopping">Start Shopping</a>
        </div>
      </div>
    `;

    // Cache DOM references
    this.itemsContainer = this.drawer.querySelector('.cart-drawer__items');
    this.countElement = this.drawer.querySelector('.cart-drawer__count');
    this.subtotalElement = this.drawer.querySelector('.cart-drawer__subtotal-value');
    this.checkoutButton = this.drawer.querySelector('.cart-drawer__checkout');

    // Inject into body
    document.body.appendChild(this.drawer);
  }

  /**
   * Binds all event listeners for drawer interactions
   * @returns {void}
   */
  bindEvents() {
    if (!this.drawer) return;

    // Close button click
    const closeButton = this.drawer.querySelector('.cart-drawer__close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.close());
    }

    // Backdrop click
    const backdrop = this.drawer.querySelector('.cart-drawer__backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.close());
    }

    // Continue Shopping click
    const continueButton = this.drawer.querySelector('.cart-drawer__continue');
    if (continueButton) {
      continueButton.addEventListener('click', () => this.close());
    }

    // Checkout button click
    if (this.checkoutButton) {
      this.checkoutButton.addEventListener('click', () => this.checkout());
    }

    // Delegated events on items container
    if (this.itemsContainer) {
      this.itemsContainer.addEventListener('click', (event) => {
        const target = event.target;

        // Find the cart item element
        const cartItem = target.closest('.cart-item');
        if (!cartItem) return;

        const productId = cartItem.dataset.productId;
        const size = cartItem.dataset.size;

        if (!productId || !size) return;

        // Remove button
        if (target.classList.contains('cart-item__remove')) {
          this.handleRemoveItem(productId, size, cartItem);
          return;
        }

        // Quantity minus button
        if (target.classList.contains('cart-item__qty-btn--minus')) {
          this.handleDecrementQuantity(productId, size);
          return;
        }

        // Quantity plus button
        if (target.classList.contains('cart-item__qty-btn--plus')) {
          this.handleIncrementQuantity(productId, size);
          return;
        }
      });
    }

    // Escape key to close
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Handles removing an item from the cart
   * @param {string} productId - Product ID
   * @param {string} size - Size
   * @param {HTMLElement} cartItemElement - The cart item DOM element
   * @returns {void}
   * @private
   */
  handleRemoveItem(productId, size, cartItemElement) {
    // Add removing animation class
    cartItemElement.classList.add('cart-item--removing');

    // Wait for animation then remove
    setTimeout(() => {
      if (window.cart) {
        window.cart.removeItem(productId, size);
      }
    }, 300);
  }

  /**
   * Handles decrementing item quantity
   * @param {string} productId - Product ID
   * @param {string} size - Size
   * @returns {void}
   * @private
   */
  handleDecrementQuantity(productId, size) {
    if (!window.cart) return;

    const item = window.cart.findItem(productId, size);
    if (!item) return;

    if (item.quantity <= 1) {
      // Remove item if quantity would go below 1
      window.cart.removeItem(productId, size);
    } else {
      window.cart.updateQuantity(productId, size, item.quantity - 1);
    }
  }

  /**
   * Handles incrementing item quantity
   * @param {string} productId - Product ID
   * @param {string} size - Size
   * @returns {void}
   * @private
   */
  handleIncrementQuantity(productId, size) {
    if (!window.cart) return;

    const item = window.cart.findItem(productId, size);
    if (!item) return;

    // CartManager.updateQuantity will handle max quantity validation
    window.cart.updateQuantity(productId, size, item.quantity + 1);
  }

  /**
   * Opens the cart drawer
   * @returns {void}
   */
  open() {
    if (!this.drawer) return;

    this.drawer.classList.add('is-open');
    document.body.classList.add('cart-open');
    this.isOpen = true;

    // Track cart view
    if (window.hogansAnalytics && window.cart) {
      const items = window.cart.items || [];
      const total = window.cart.getSubtotal();
      window.hogansAnalytics.trackViewCart(items, total);
    }

    // Focus the close button for accessibility
    const closeButton = this.drawer.querySelector('.cart-drawer__close');
    if (closeButton) {
      closeButton.focus();
    }
  }

  /**
   * Closes the cart drawer
   * @returns {void}
   */
  close() {
    if (!this.drawer) return;

    this.drawer.classList.remove('is-open');
    document.body.classList.remove('cart-open');
    this.isOpen = false;
  }

  /**
   * Updates the drawer UI based on current cart state
   * @returns {void}
   */
  update() {
    if (!window.cart) return;

    const items = window.cart.items || [];
    const count = window.cart.getItemCount();
    const subtotal = window.cart.getFormattedSubtotal();

    // Update count display
    if (this.countElement) {
      this.countElement.textContent = count;
    }

    // Update subtotal display
    if (this.subtotalElement) {
      this.subtotalElement.textContent = subtotal;
    }

    // Render items or show empty state
    if (items.length === 0) {
      this.drawer.classList.add('cart-drawer--empty');
      if (this.itemsContainer) {
        this.itemsContainer.innerHTML = '';
      }
    } else {
      this.drawer.classList.remove('cart-drawer--empty');
      if (this.itemsContainer) {
        this.itemsContainer.innerHTML = items.map(item => this.renderItem(item)).join('');
      }
    }

    // Update navigation badge
    this.updateBadge(count);
  }

  /**
   * Renders a single cart item as HTML string
   * @param {Object} item - Cart item object
   * @param {string} item.productId - Product slug
   * @param {string} item.name - Display name
   * @param {string} item.collection - Collection name
   * @param {string} item.size - Selected size
   * @param {number} item.quantity - Quantity
   * @param {number} item.price - Price in dollars
   * @param {string} item.currency - Currency code
   * @param {string} item.image - Image URL
   * @returns {string} HTML string for the cart item
   */
  renderItem(item) {
    const { productId, name, collection, size, quantity, price, currency, image } = item;
    const formattedPrice = `$${(price * quantity).toLocaleString('en-CA')} ${currency}`;
    const isMinQuantity = quantity <= 1;
    const isMaxQuantity = quantity >= 3;

    return `
      <div class="cart-item" data-product-id="${this.escapeHtml(productId)}" data-size="${this.escapeHtml(size)}">
        <div class="cart-item__image">
          <img src="${this.escapeHtml(image)}" alt="${this.escapeHtml(name)}" loading="lazy">
        </div>
        <div class="cart-item__details">
          <div class="cart-item__header">
            <div class="cart-item__info">
              <p class="cart-item__collection">${this.escapeHtml(collection)} Collection</p>
              <h3 class="cart-item__name">${this.escapeHtml(name)}</h3>
              <p class="cart-item__size">Size: ${this.escapeHtml(size)}</p>
            </div>
            <span class="cart-item__price">${formattedPrice}</span>
          </div>
          <div class="cart-item__footer">
            <div class="cart-item__quantity">
              <button class="cart-item__quantity-btn cart-item__qty-btn--minus" aria-label="Decrease quantity"${isMinQuantity ? ' disabled' : ''}>-</button>
              <span class="cart-item__quantity-value">${quantity}</span>
              <button class="cart-item__quantity-btn cart-item__qty-btn--plus" aria-label="Increase quantity"${isMaxQuantity ? ' disabled' : ''}>+</button>
            </div>
            <button class="cart-item__remove" aria-label="Remove item">Remove</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Escapes HTML special characters to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   * @private
   */
  escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Updates the cart badge in the navigation
   * @param {number} count - Item count to display
   * @returns {void}
   */
  updateBadge(count) {
    // Find existing badge or create one
    let badge = document.querySelector('.cart-badge');

    if (!badge) {
      // Try to find cart icon and add badge
      const cartIcon = document.querySelector('.cart-icon');
      if (cartIcon) {
        badge = document.createElement('span');
        badge.className = 'cart-badge';
        cartIcon.appendChild(badge);
      }
    }

    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? '' : 'none';
    }
  }

  /**
   * Handles the checkout process
   * Posts cart items to checkout API and redirects on success
   * @returns {Promise<void>}
   */
  async checkout() {
    if (!window.cart || window.cart.isEmpty()) {
      return;
    }

    if (!this.checkoutButton) return;

    // Show loading state
    const originalText = this.checkoutButton.textContent;
    this.checkoutButton.textContent = 'Processing...';
    this.checkoutButton.disabled = true;

    try {
      // Build items array for checkout API
      const items = window.cart.items.map(item => ({
        productId: item.productId,
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        currency: item.currency,
        image: item.image
      }));

      // Track begin checkout
      if (window.hogansAnalytics) {
        const total = window.cart.getSubtotal();
        window.hogansAnalytics.trackBeginCheckout(items, total);
      }

      // Build success and cancel URLs with session ID placeholder
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/cancel.html`;

      // POST to checkout API
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items, successUrl, cancelUrl })
      });

      const data = await response.json();

      if (!response.ok) {
        // Parse error from API response
        const errorMessage = data?.error?.message || 'Checkout failed. Please try again.';
        const errorCode = data?.error?.code || 'UNKNOWN_ERROR';

        // Handle specific error types
        if (errorCode === 'INVENTORY_UNAVAILABLE') {
          throw new Error(errorMessage);
        } else if (errorCode === 'PRODUCT_NOT_FOUND') {
          throw new Error('One or more items are no longer available.');
        } else {
          throw new Error(errorMessage);
        }
      }

      if (data?.data?.url) {
        // Redirect to Stripe checkout URL
        window.location.href = data.data.url;
      } else if (data?.url) {
        // Fallback for direct url property
        window.location.href = data.url;
      } else {
        throw new Error('Invalid checkout response');
      }
    } catch (error) {
      console.error('[CartDrawer] Checkout error:', error);

      // Show user-friendly error message
      this.showNotification(error.message || 'There was an error processing your checkout. Please try again.', 'error');

      // Restore button state
      this.checkoutButton.textContent = originalText;
      this.checkoutButton.disabled = false;
    }
  }

  /**
   * Shows a notification toast message
   * @param {string} message - Message to display
   * @param {string} [type='info'] - Type: 'info', 'success', 'error', 'warning'
   * @param {number} [duration=4000] - Duration in ms before auto-dismiss
   * @returns {void}
   */
  showNotification(message, type = 'info', duration = 4000) {
    // Remove any existing notification
    const existingNotification = document.querySelector('.cart-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `cart-notification cart-notification--${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');

    notification.innerHTML = `
      <span class="cart-notification__message">${this.escapeHtml(message)}</span>
      <button class="cart-notification__close" aria-label="Dismiss notification">&times;</button>
    `;

    // Add styles if not already present
    if (!document.getElementById('cart-notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'cart-notification-styles';
      styles.textContent = `
        .cart-notification {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(100px);
          max-width: 400px;
          padding: 16px 48px 16px 20px;
          background: #0A0A0A;
          color: #FAFAF9;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          z-index: 10000;
          opacity: 0;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .cart-notification.is-visible {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
        .cart-notification--error {
          background: #B91C1C;
        }
        .cart-notification--success {
          background: #15803D;
        }
        .cart-notification--warning {
          background: #D97706;
        }
        .cart-notification__close {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: inherit;
          font-size: 24px;
          font-weight: 300;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }
        .cart-notification__close:hover {
          opacity: 1;
        }
        @media (max-width: 480px) {
          .cart-notification {
            left: 16px;
            right: 16px;
            transform: translateX(0) translateY(100px);
            max-width: none;
          }
          .cart-notification.is-visible {
            transform: translateX(0) translateY(0);
          }
        }
      `;
      document.head.appendChild(styles);
    }

    // Add to DOM
    document.body.appendChild(notification);

    // Trigger animation
    requestAnimationFrame(() => {
      notification.classList.add('is-visible');
    });

    // Close button handler
    const closeBtn = notification.querySelector('.cart-notification__close');
    closeBtn.addEventListener('click', () => {
      notification.classList.remove('is-visible');
      setTimeout(() => notification.remove(), 300);
    });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.classList.remove('is-visible');
          setTimeout(() => notification.remove(), 300);
        }
      }, duration);
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.cartDrawer = new CartDrawer();
});

// Export function to open drawer from outside
window.openCart = () => {
  if (window.cartDrawer) {
    window.cartDrawer.open();
  }
};

// Export for module systems (if applicable)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CartDrawer };
}
