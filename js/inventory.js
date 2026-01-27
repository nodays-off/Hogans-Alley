/**
 * Hogan's Alley Inventory Management Module
 * Client-side inventory fetching with caching and real-time updates
 *
 * IMPORTANT: This module requires the Supabase JS SDK to be loaded before use.
 * Add the following script tag to your HTML before loading this file:
 * <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *
 * @author Hogan's Alley
 * @version 1.0.0
 */

/**
 * Supabase configuration
 * Replace these placeholders with your actual Supabase project credentials.
 * The anon key is safe for client-side use as it only provides public access.
 */
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {Object} data - Cached inventory data
 * @property {number} timestamp - Unix timestamp when cached
 */

/**
 * Inventory data structure
 * @typedef {Object} InventoryData
 * @property {string} productId - Product slug
 * @property {string} name - Product display name
 * @property {string} collection - Collection name
 * @property {number} price - Price in cents
 * @property {string} currency - Currency code
 * @property {Object.<string, {quantity: number, status: string}>} inventory - Inventory by size
 * @property {number} totalAvailable - Total available quantity
 * @property {string} updatedAt - ISO timestamp of last update
 */

/**
 * Subscription entry structure
 * @typedef {Object} SubscriptionEntry
 * @property {Object} channel - Supabase realtime channel
 * @property {Set<Function>} callbacks - Set of callback functions
 */

/**
 * InventoryManager class
 * Handles inventory fetching, caching, and real-time updates via Supabase
 */
class InventoryManager {
  /**
   * API endpoint for inventory requests
   * @type {string}
   * @readonly
   */
  static API_ENDPOINT = '/api/inventory';

  /**
   * Default cache timeout in milliseconds (30 seconds)
   * @type {number}
   * @readonly
   */
  static DEFAULT_CACHE_TIMEOUT = 30000;

  /**
   * Creates a new InventoryManager instance
   * @param {Object} [options] - Configuration options
   * @param {number} [options.cacheTimeout=30000] - Cache timeout in milliseconds
   */
  constructor(options = {}) {
    /**
     * Cache for inventory responses
     * @type {Map<string, CacheEntry>}
     */
    this.cache = new Map();

    /**
     * Cache timeout in milliseconds
     * @type {number}
     */
    this.cacheTimeout = options.cacheTimeout || InventoryManager.DEFAULT_CACHE_TIMEOUT;

    /**
     * Active Supabase subscriptions by productId
     * @type {Map<string, SubscriptionEntry>}
     */
    this.subscriptions = new Map();

    /**
     * Supabase client instance (lazy initialized)
     * @type {Object|null}
     * @private
     */
    this._supabase = null;

    /**
     * Product ID to database ID mapping cache
     * @type {Map<string, string>}
     * @private
     */
    this._productIdCache = new Map();
  }

  /**
   * Gets or initializes the Supabase client
   * @returns {Object|null} Supabase client or null if not available
   * @private
   */
  _getSupabase() {
    if (this._supabase) {
      return this._supabase;
    }

    // Check if Supabase SDK is loaded
    if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
      // Check if credentials are configured
      if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('[InventoryManager] Supabase credentials not configured. Real-time updates disabled.');
        return null;
      }

      try {
        this._supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return this._supabase;
      } catch (error) {
        console.error('[InventoryManager] Failed to initialize Supabase client:', error);
        return null;
      }
    }

    console.warn('[InventoryManager] Supabase SDK not loaded. Real-time updates disabled.');
    return null;
  }

  /**
   * Checks if a cache entry is still valid
   * @param {string} productId - Product slug to check
   * @returns {boolean} True if cache entry exists and is not expired
   * @private
   */
  _isCacheValid(productId) {
    const entry = this.cache.get(productId);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    return age < this.cacheTimeout;
  }

  /**
   * Gets cached data if valid
   * @param {string} productId - Product slug
   * @returns {InventoryData|null} Cached data or null if not available/expired
   * @private
   */
  _getCached(productId) {
    if (this._isCacheValid(productId)) {
      return this.cache.get(productId).data;
    }
    return null;
  }

  /**
   * Stores data in cache
   * @param {string} productId - Product slug
   * @param {InventoryData} data - Inventory data to cache
   * @private
   */
  _setCache(productId, data) {
    this.cache.set(productId, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Fetches inventory data for a product
   * Uses cached data if available and not expired
   *
   * @param {string} productId - Product slug (e.g., "money-jacket")
   * @param {Object} [options] - Fetch options
   * @param {boolean} [options.skipCache=false] - Skip cache and force fresh fetch
   * @returns {Promise<InventoryData>} Inventory data
   * @throws {Error} If productId is invalid or request fails
   */
  async fetchInventory(productId, options = {}) {
    // Validate productId
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      throw new Error('Invalid productId: must be a non-empty string');
    }

    const slug = productId.trim();

    // Check cache unless explicitly skipped
    if (!options.skipCache) {
      const cached = this._getCached(slug);
      if (cached) {
        return cached;
      }
    }

    // Fetch from API
    try {
      const url = `${InventoryManager.API_ENDPOINT}?productId=${encodeURIComponent(slug)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const json = await response.json();

      // Handle error responses
      if (!response.ok || !json.success) {
        const error = new Error(json.error?.message || 'Failed to fetch inventory');
        error.code = json.error?.code || 'UNKNOWN_ERROR';
        error.status = response.status;
        throw error;
      }

      // Cache the successful response
      this._setCache(slug, json.data);

      return json.data;

    } catch (error) {
      // Re-throw with additional context if it's a network error
      if (!error.code) {
        error.code = 'NETWORK_ERROR';
        error.message = `Network error fetching inventory: ${error.message}`;
      }
      throw error;
    }
  }

  /**
   * Subscribes to real-time inventory updates for a product
   * Requires Supabase SDK to be loaded and configured
   *
   * @param {string} productId - Product slug to subscribe to
   * @param {Function} callback - Function called when inventory updates
   *   Receives (inventoryData: InventoryData) as argument
   * @returns {Function} Unsubscribe function
   * @throws {Error} If productId or callback is invalid
   */
  subscribeToUpdates(productId, callback) {
    // Validate inputs
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      throw new Error('Invalid productId: must be a non-empty string');
    }

    if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }

    const slug = productId.trim();
    const supabase = this._getSupabase();

    // If Supabase is not available, return a no-op unsubscribe
    if (!supabase) {
      console.warn('[InventoryManager] Cannot subscribe: Supabase not available');
      return () => {};
    }

    // Check if we already have a subscription for this product
    let subscription = this.subscriptions.get(slug);

    if (subscription) {
      // Add callback to existing subscription
      subscription.callbacks.add(callback);
    } else {
      // Create new subscription
      const callbacks = new Set([callback]);

      // Create channel for inventory updates
      const channelName = `inventory-${slug}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'inventory'
          },
          async (payload) => {
            // Check if this update is for our product
            // We need to verify the product_id matches
            try {
              // Invalidate cache to ensure fresh data
              this.invalidateCache(slug);

              // Fetch fresh inventory data
              const freshData = await this.fetchInventory(slug, { skipCache: true });

              // Notify all callbacks
              callbacks.forEach(cb => {
                try {
                  cb(freshData);
                } catch (err) {
                  console.error('[InventoryManager] Callback error:', err);
                }
              });
            } catch (error) {
              console.error('[InventoryManager] Failed to fetch updated inventory:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error(`[InventoryManager] Subscription error for ${slug}`);
          }
          // Note: SUBSCRIBED status logged only in debug mode
        });

      subscription = { channel, callbacks };
      this.subscriptions.set(slug, subscription);
    }

    // Return unsubscribe function
    return () => {
      this._removeCallback(slug, callback);
    };
  }

  /**
   * Removes a callback from a subscription
   * @param {string} productId - Product slug
   * @param {Function} callback - Callback to remove
   * @private
   */
  _removeCallback(productId, callback) {
    const subscription = this.subscriptions.get(productId);
    if (!subscription) return;

    subscription.callbacks.delete(callback);

    // If no more callbacks, unsubscribe from channel
    if (subscription.callbacks.size === 0) {
      this.unsubscribe(productId);
    }
  }

  /**
   * Unsubscribes from real-time updates for a product
   * Removes all callbacks and closes the Supabase channel
   *
   * @param {string} productId - Product slug to unsubscribe from
   */
  unsubscribe(productId) {
    if (!productId || typeof productId !== 'string') return;

    const slug = productId.trim();
    const subscription = this.subscriptions.get(slug);

    if (subscription) {
      // Unsubscribe from Supabase channel
      if (subscription.channel) {
        const supabase = this._getSupabase();
        if (supabase) {
          supabase.removeChannel(subscription.channel);
        }
      }

      // Clear callbacks
      subscription.callbacks.clear();

      // Remove from subscriptions map
      this.subscriptions.delete(slug);

      // Note: Unsubscribe logged only in debug mode
    }
  }

  /**
   * Invalidates cached data for a product
   * Forces the next fetchInventory call to fetch fresh data
   *
   * @param {string} productId - Product slug to invalidate
   */
  invalidateCache(productId) {
    if (!productId || typeof productId !== 'string') return;

    const slug = productId.trim();
    this.cache.delete(slug);
  }

  /**
   * Clears all cached inventory data
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Unsubscribes from all active subscriptions
   */
  unsubscribeAll() {
    const productIds = Array.from(this.subscriptions.keys());
    productIds.forEach(productId => this.unsubscribe(productId));
  }

  /**
   * Checks if a size is in stock for a product
   * Uses cached data if available
   *
   * @param {string} productId - Product slug
   * @param {string} size - Size to check (XS, S, M, L, XL, XXL)
   * @returns {Promise<boolean>} True if size is in stock
   */
  async isInStock(productId, size) {
    try {
      const data = await this.fetchInventory(productId);
      const sizeInventory = data.inventory[size];
      return sizeInventory && sizeInventory.quantity > 0;
    } catch (error) {
      console.error('[InventoryManager] Error checking stock:', error);
      return false;
    }
  }

  /**
   * Gets the status for a specific size
   *
   * @param {string} productId - Product slug
   * @param {string} size - Size to check
   * @returns {Promise<string>} Status: 'in_stock', 'low_stock', or 'sold_out'
   */
  async getSizeStatus(productId, size) {
    try {
      const data = await this.fetchInventory(productId);
      const sizeInventory = data.inventory[size];
      return sizeInventory ? sizeInventory.status : 'sold_out';
    } catch (error) {
      console.error('[InventoryManager] Error getting size status:', error);
      return 'sold_out';
    }
  }

  /**
   * Gets all available sizes for a product
   *
   * @param {string} productId - Product slug
   * @returns {Promise<string[]>} Array of size codes that are in stock
   */
  async getAvailableSizes(productId) {
    try {
      const data = await this.fetchInventory(productId);
      return Object.entries(data.inventory)
        .filter(([, info]) => info.quantity > 0)
        .map(([size]) => size);
    } catch (error) {
      console.error('[InventoryManager] Error getting available sizes:', error);
      return [];
    }
  }

  /**
   * Destroys the inventory manager instance
   * Clears cache and unsubscribes from all updates
   */
  destroy() {
    this.unsubscribeAll();
    this.clearCache();
    this._supabase = null;
    this._productIdCache.clear();
  }
}

// Create singleton instance
const inventoryManager = new InventoryManager();

// Export to window for global access
if (typeof window !== 'undefined') {
  window.inventoryManager = inventoryManager;
  window.InventoryManager = InventoryManager;
}

// Export for module systems (if applicable)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InventoryManager, inventoryManager };
}
