/**
 * Hogan's Alley Cart State Management
 * Premium rainwear e-commerce cart system
 *
 * @author Hogan's Alley
 * @version 1.0.0
 */

/**
 * Valid collections for Hogan's Alley products
 * @type {readonly string[]}
 */
const VALID_COLLECTIONS = Object.freeze(['Libation', 'Money', 'Transport', 'Sanitation']);

/**
 * Valid sizes for all products
 * @type {readonly string[]}
 */
const VALID_SIZES = Object.freeze(['XS', 'S', 'M', 'L', 'XL', 'XXL']);

/**
 * Maximum quantity per item per size
 * @type {number}
 */
const MAX_QUANTITY_PER_ITEM = 3;

/**
 * Minimum quantity per item
 * @type {number}
 */
const MIN_QUANTITY = 1;

/**
 * Cart item structure
 * @typedef {Object} CartItem
 * @property {string} productId - Product slug (e.g., "money-jacket")
 * @property {string} collection - Collection name (e.g., "Money")
 * @property {string} name - Display name (e.g., "Money Rain Parka")
 * @property {string} size - Selected size (XS, S, M, L, XL, XXL)
 * @property {number} quantity - Quantity (1-3)
 * @property {number} price - Price in dollars (not cents)
 * @property {string} currency - Currency code (CAD)
 * @property {string} image - Thumbnail URL
 */

/**
 * localStorage data structure
 * @typedef {Object} CartStorage
 * @property {number} version - Storage version for migrations
 * @property {CartItem[]} items - Array of cart items
 * @property {string} createdAt - ISO timestamp of cart creation
 * @property {string} updatedAt - ISO timestamp of last update
 */

/**
 * CartManager class for managing shopping cart state
 * Handles persistence via localStorage with version control and corruption handling
 */
class CartManager {
  /**
   * localStorage key for cart data
   * @type {string}
   * @readonly
   */
  static CART_KEY = 'hogans-alley-cart';

  /**
   * Current cart storage version for migrations
   * @type {number}
   * @readonly
   */
  static CART_VERSION = 1;

  /**
   * Creates a new CartManager instance
   * Automatically loads existing cart data from localStorage
   */
  constructor() {
    /** @type {CartItem[]} */
    this.items = [];

    /** @type {Function[]} */
    this.listeners = [];

    this.load();
  }

  /**
   * Loads cart data from localStorage
   * Handles version mismatch by clearing old data
   * Handles corruption by initializing empty cart
   * @returns {void}
   */
  load() {
    try {
      const stored = localStorage.getItem(CartManager.CART_KEY);

      if (!stored) {
        this.items = [];
        return;
      }

      const data = JSON.parse(stored);

      // Validate storage structure
      if (!data || typeof data !== 'object') {
        console.warn('[CartManager] Invalid storage structure, initializing empty cart');
        this.items = [];
        this.save();
        return;
      }

      // Handle version mismatch
      if (data.version !== CartManager.CART_VERSION) {
        console.warn(`[CartManager] Version mismatch (stored: ${data.version}, current: ${CartManager.CART_VERSION}), clearing cart`);
        this.items = [];
        this.save();
        return;
      }

      // Validate items array
      if (!Array.isArray(data.items)) {
        console.warn('[CartManager] Invalid items array, initializing empty cart');
        this.items = [];
        this.save();
        return;
      }

      // Filter and validate each item
      this.items = data.items.filter(item => this._validateItem(item));

      // If some items were invalid, save the cleaned data
      if (this.items.length !== data.items.length) {
        console.warn(`[CartManager] Removed ${data.items.length - this.items.length} invalid items`);
        this.save();
      }
    } catch (error) {
      console.error('[CartManager] Failed to load cart:', error);
      this.items = [];
      // Clear corrupted data
      try {
        localStorage.removeItem(CartManager.CART_KEY);
      } catch (e) {
        console.error('[CartManager] Failed to clear corrupted storage:', e);
      }
    }
  }

  /**
   * Validates a cart item structure
   * @param {any} item - Item to validate
   * @returns {boolean} True if item is valid
   * @private
   */
  _validateItem(item) {
    if (!item || typeof item !== 'object') return false;

    const { productId, collection, name, size, quantity, price, currency, image } = item;

    // Required string fields
    if (typeof productId !== 'string' || !productId.trim()) return false;
    if (typeof collection !== 'string' || !VALID_COLLECTIONS.includes(collection)) return false;
    if (typeof name !== 'string' || !name.trim()) return false;
    if (typeof size !== 'string' || !VALID_SIZES.includes(size)) return false;
    if (typeof currency !== 'string' || !currency.trim()) return false;
    if (typeof image !== 'string') return false;

    // Validate quantity
    if (typeof quantity !== 'number' || !Number.isInteger(quantity)) return false;
    if (quantity < MIN_QUANTITY || quantity > MAX_QUANTITY_PER_ITEM) return false;

    // Validate price
    if (typeof price !== 'number' || price < 0 || !Number.isFinite(price)) return false;

    return true;
  }

  /**
   * Saves cart data to localStorage
   * Updates the updatedAt timestamp
   * Notifies all subscribers of the change
   * @returns {void}
   */
  save() {
    try {
      const now = new Date().toISOString();

      // Get existing data to preserve createdAt
      let createdAt = now;
      try {
        const existing = localStorage.getItem(CartManager.CART_KEY);
        if (existing) {
          const parsed = JSON.parse(existing);
          if (parsed && parsed.createdAt) {
            createdAt = parsed.createdAt;
          }
        }
      } catch (e) {
        // Ignore errors reading existing data
      }

      /** @type {CartStorage} */
      const data = {
        version: CartManager.CART_VERSION,
        items: this.items,
        createdAt,
        updatedAt: now
      };

      localStorage.setItem(CartManager.CART_KEY, JSON.stringify(data));
      this.notify();
    } catch (error) {
      console.error('[CartManager] Failed to save cart:', error);
      // Still notify listeners even if save fails
      this.notify();
    }
  }

  /**
   * Adds a product to the cart or increments quantity if already exists
   * Maximum quantity per item per size is 3
   * @param {Object} product - Product to add
   * @param {string} product.productId - Product slug
   * @param {string} product.collection - Collection name
   * @param {string} product.name - Display name
   * @param {string} product.size - Selected size
   * @param {number} product.price - Price in dollars
   * @param {string} [product.currency='CAD'] - Currency code
   * @param {string} [product.image=''] - Thumbnail URL
   * @returns {{ success: boolean, message: string, item?: CartItem }} Result object
   */
  addItem(product) {
    // Validate required fields
    if (!product || typeof product !== 'object') {
      return { success: false, message: 'Invalid product data' };
    }

    const { productId, collection, name, size, price, currency = 'CAD', image = '' } = product;

    // Validate productId
    if (typeof productId !== 'string' || !productId.trim()) {
      return { success: false, message: 'Product ID is required' };
    }

    // Validate collection
    if (!VALID_COLLECTIONS.includes(collection)) {
      return { success: false, message: `Invalid collection. Must be one of: ${VALID_COLLECTIONS.join(', ')}` };
    }

    // Validate name
    if (typeof name !== 'string' || !name.trim()) {
      return { success: false, message: 'Product name is required' };
    }

    // Validate size
    if (!VALID_SIZES.includes(size)) {
      return { success: false, message: `Invalid size. Must be one of: ${VALID_SIZES.join(', ')}` };
    }

    // Validate price
    if (typeof price !== 'number' || price < 0 || !Number.isFinite(price)) {
      return { success: false, message: 'Valid price is required' };
    }

    // Check if item already exists in cart
    const existingIndex = this.items.findIndex(
      item => item.productId === productId && item.size === size
    );

    if (existingIndex !== -1) {
      const existingItem = this.items[existingIndex];

      // Check quantity limit
      if (existingItem.quantity >= MAX_QUANTITY_PER_ITEM) {
        return {
          success: false,
          message: `Maximum quantity (${MAX_QUANTITY_PER_ITEM}) reached for this item and size`
        };
      }

      // Increment quantity
      existingItem.quantity += 1;
      this.save();

      return {
        success: true,
        message: `Quantity updated to ${existingItem.quantity}`,
        item: { ...existingItem }
      };
    }

    // Create new cart item
    /** @type {CartItem} */
    const newItem = {
      productId: productId.trim(),
      collection,
      name: name.trim(),
      size,
      quantity: 1,
      price,
      currency,
      image
    };

    this.items.push(newItem);
    this.save();

    return {
      success: true,
      message: 'Item added to cart',
      item: { ...newItem }
    };
  }

  /**
   * Removes a specific item from the cart
   * @param {string} productId - Product slug
   * @param {string} size - Size of the item to remove
   * @returns {{ success: boolean, message: string }} Result object
   */
  removeItem(productId, size) {
    if (typeof productId !== 'string' || !productId.trim()) {
      return { success: false, message: 'Product ID is required' };
    }

    if (!VALID_SIZES.includes(size)) {
      return { success: false, message: `Invalid size. Must be one of: ${VALID_SIZES.join(', ')}` };
    }

    const initialLength = this.items.length;

    this.items = this.items.filter(
      item => !(item.productId === productId && item.size === size)
    );

    if (this.items.length === initialLength) {
      return { success: false, message: 'Item not found in cart' };
    }

    this.save();
    return { success: true, message: 'Item removed from cart' };
  }

  /**
   * Updates the quantity of a specific item
   * @param {string} productId - Product slug
   * @param {string} size - Size of the item to update
   * @param {number} quantity - New quantity (1-3)
   * @returns {{ success: boolean, message: string, item?: CartItem }} Result object
   */
  updateQuantity(productId, size, quantity) {
    if (typeof productId !== 'string' || !productId.trim()) {
      return { success: false, message: 'Product ID is required' };
    }

    if (!VALID_SIZES.includes(size)) {
      return { success: false, message: `Invalid size. Must be one of: ${VALID_SIZES.join(', ')}` };
    }

    if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
      return { success: false, message: 'Quantity must be a whole number' };
    }

    if (quantity < MIN_QUANTITY) {
      return { success: false, message: `Minimum quantity is ${MIN_QUANTITY}` };
    }

    if (quantity > MAX_QUANTITY_PER_ITEM) {
      return { success: false, message: `Maximum quantity is ${MAX_QUANTITY_PER_ITEM}` };
    }

    const item = this.items.find(
      item => item.productId === productId && item.size === size
    );

    if (!item) {
      return { success: false, message: 'Item not found in cart' };
    }

    item.quantity = quantity;
    this.save();

    return {
      success: true,
      message: `Quantity updated to ${quantity}`,
      item: { ...item }
    };
  }

  /**
   * Removes all items from the cart
   * @returns {void}
   */
  clear() {
    this.items = [];
    this.save();
  }

  /**
   * Gets the total quantity of all items in the cart
   * @returns {number} Total item count
   */
  getItemCount() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Gets the subtotal price of all items in the cart
   * @returns {number} Subtotal in dollars
   */
  getSubtotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  /**
   * Subscribes to cart changes
   * @param {Function} callback - Function to call when cart changes, receives CartManager instance
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notifies all subscribers of cart changes
   * @returns {void}
   */
  notify() {
    this.listeners.forEach(callback => {
      try {
        callback(this);
      } catch (error) {
        console.error('[CartManager] Subscriber callback error:', error);
      }
    });
  }

  /**
   * Gets a copy of all cart items
   * @returns {CartItem[]} Array of cart items (defensive copy)
   */
  getItems() {
    return this.items.map(item => ({ ...item }));
  }

  /**
   * Checks if the cart is empty
   * @returns {boolean} True if cart has no items
   */
  isEmpty() {
    return this.items.length === 0;
  }

  /**
   * Finds an item in the cart by productId and size
   * @param {string} productId - Product slug
   * @param {string} size - Size
   * @returns {CartItem|undefined} Cart item or undefined if not found
   */
  findItem(productId, size) {
    const item = this.items.find(
      item => item.productId === productId && item.size === size
    );
    return item ? { ...item } : undefined;
  }

  /**
   * Gets formatted subtotal string with currency
   * @returns {string} Formatted price string (e.g., "$395 CAD")
   */
  getFormattedSubtotal() {
    const subtotal = this.getSubtotal();
    return `$${subtotal.toLocaleString('en-CA')} CAD`;
  }

  /**
   * Exports cart data for debugging or analytics
   * @returns {CartStorage} Cart storage object
   */
  toJSON() {
    return {
      version: CartManager.CART_VERSION,
      items: this.getItems(),
      itemCount: this.getItemCount(),
      subtotal: this.getSubtotal(),
      formattedSubtotal: this.getFormattedSubtotal()
    };
  }
}

// Create singleton instance and export globally
const cart = new CartManager();

// Export to window for global access
if (typeof window !== 'undefined') {
  window.cart = cart;
  window.CartManager = CartManager;
}

// Export for module systems (if applicable)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CartManager, cart };
}
