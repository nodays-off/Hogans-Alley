/**
 * Hogan's Alley Inventory API
 * Netlify Serverless Function for fetching product inventory
 *
 * @author Hogan's Alley
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Valid sizes for inventory lookup
 * @type {readonly string[]}
 */
const VALID_SIZES = Object.freeze(['XS', 'S', 'M', 'L', 'XL', 'XXL']);

/**
 * Determines inventory status based on quantity
 * @param {number} quantity - Available quantity
 * @returns {'sold_out' | 'low_stock' | 'in_stock'} Status label
 */
function getInventoryStatus(quantity) {
  if (quantity === 0) return 'sold_out';
  if (quantity <= 3) return 'low_stock';
  return 'in_stock';
}

/**
 * Creates a standardized error response
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @returns {Object} Netlify function response object
 */
function errorResponse(statusCode, code, message) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify({
      success: false,
      error: {
        code,
        message
      }
    })
  };
}

/**
 * Creates a standardized success response
 * @param {Object} data - Response data
 * @returns {Object} Netlify function response object
 */
function successResponse(data) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30, s-maxage=30'
    },
    body: JSON.stringify({
      success: true,
      data
    })
  };
}

/**
 * Netlify Function Handler
 * GET /api/inventory?productId=<slug>
 *
 * @param {Object} event - Netlify function event object
 * @returns {Promise<Object>} Netlify function response
 */
export const handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Only GET method is allowed');
  }

  // Handle OPTIONS for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  // Extract productId from query parameters
  const productId = event.queryStringParameters?.productId;

  // Validate productId parameter
  if (!productId || typeof productId !== 'string' || !productId.trim()) {
    return errorResponse(400, 'INVALID_REQUEST', 'productId required');
  }

  const slug = productId.trim();

  try {
    // Query product by slug
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, slug, name, collection, price, currency')
      .eq('slug', slug)
      .single();

    // Handle product query errors
    if (productError) {
      // Check if it's a "not found" error
      if (productError.code === 'PGRST116') {
        return errorResponse(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      }
      console.error('[Inventory API] Product query error:', productError);
      return errorResponse(502, 'DATABASE_ERROR', productError.message);
    }

    // If no product found
    if (!product) {
      return errorResponse(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    // Query inventory for all sizes of this product
    const { data: inventoryRows, error: inventoryError } = await supabase
      .from('inventory')
      .select('size, quantity, updated_at')
      .eq('product_id', product.id);

    // Handle inventory query errors
    if (inventoryError) {
      console.error('[Inventory API] Inventory query error:', inventoryError);
      return errorResponse(502, 'DATABASE_ERROR', inventoryError.message);
    }

    // Build inventory object with status labels
    // Initialize all sizes with 0 quantity (sold_out)
    const inventory = {};
    let totalAvailable = 0;
    let latestUpdate = null;

    // Initialize all valid sizes as sold_out
    VALID_SIZES.forEach(size => {
      inventory[size] = {
        quantity: 0,
        status: 'sold_out'
      };
    });

    // Update with actual inventory data
    if (inventoryRows && inventoryRows.length > 0) {
      inventoryRows.forEach(row => {
        const size = row.size;
        const quantity = row.quantity || 0;

        if (VALID_SIZES.includes(size)) {
          inventory[size] = {
            quantity,
            status: getInventoryStatus(quantity)
          };
          totalAvailable += quantity;

          // Track latest update timestamp
          if (row.updated_at) {
            const updateTime = new Date(row.updated_at);
            if (!latestUpdate || updateTime > latestUpdate) {
              latestUpdate = updateTime;
            }
          }
        }
      });
    }

    // Build response data
    const responseData = {
      id: product.id, // Database UUID (for waitlist signup)
      productId: product.slug, // Product slug
      name: product.name,
      collection: product.collection,
      price: product.price,
      currency: product.currency || 'CAD',
      inventory,
      totalAvailable,
      updatedAt: latestUpdate ? latestUpdate.toISOString() : new Date().toISOString()
    };

    return successResponse(responseData);

  } catch (error) {
    console.error('[Inventory API] Unexpected error:', error);
    return errorResponse(502, 'DATABASE_ERROR', 'An unexpected error occurred');
  }
};
