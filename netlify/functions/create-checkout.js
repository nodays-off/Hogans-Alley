/**
 * Stripe Checkout Session Creator
 * Creates a Stripe Checkout session for Hogan's Alley e-commerce
 *
 * @author Hogan's Alley
 * @version 1.0.0
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Lazy-initialize clients (env vars may not be available at module load)
let _stripe, _supabase;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}
function getSupabase() {
  if (!_supabase) _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  return _supabase;
}

/**
 * CORS headers for API responses
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

/**
 * Creates a JSON response with proper headers
 * @param {number} statusCode - HTTP status code
 * @param {object} body - Response body
 * @returns {object} Netlify function response
 */
const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});

/**
 * Shipping options for Stripe Checkout
 * Prices are in cents (CAD)
 */
const SHIPPING_OPTIONS = [
  {
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: {
        amount: 0,
        currency: 'cad'
      },
      display_name: 'Free Shipping (Canada)',
      delivery_estimate: {
        minimum: {
          unit: 'business_day',
          value: 5
        },
        maximum: {
          unit: 'business_day',
          value: 7
        }
      }
    }
  },
  {
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: {
        amount: 2500, // $25 CAD in cents
        currency: 'cad'
      },
      display_name: 'Standard Shipping (USA)',
      delivery_estimate: {
        minimum: {
          unit: 'business_day',
          value: 7
        },
        maximum: {
          unit: 'business_day',
          value: 14
        }
      }
    }
  }
];

/**
 * Validates the request body structure
 * @param {object} body - Parsed request body
 * @returns {{ valid: boolean, error?: string }}
 */
const validateRequest = (body) => {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const { items, successUrl, cancelUrl } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: 'Items array is required and must not be empty' };
  }

  if (typeof successUrl !== 'string' || !successUrl.trim()) {
    return { valid: false, error: 'Success URL is required' };
  }

  if (typeof cancelUrl !== 'string' || !cancelUrl.trim()) {
    return { valid: false, error: 'Cancel URL is required' };
  }

  // Validate each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item || typeof item !== 'object') {
      return { valid: false, error: `Item at index ${i} is invalid` };
    }

    if (typeof item.productId !== 'string' || !item.productId.trim()) {
      return { valid: false, error: `Item at index ${i} is missing productId` };
    }

    if (typeof item.size !== 'string' || !item.size.trim()) {
      return { valid: false, error: `Item at index ${i} is missing size` };
    }

    if (typeof item.quantity !== 'number' || item.quantity < 1 || !Number.isInteger(item.quantity)) {
      return { valid: false, error: `Item at index ${i} has invalid quantity` };
    }
  }

  return { valid: true };
};

/**
 * Fetches product from Supabase by slug
 * @param {string} slug - Product slug (productId)
 * @returns {Promise<object|null>} Product data or null if not found
 */
const fetchProduct = async (slug) => {
  const { data, error } = await getSupabase()
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error(`[create-checkout] Error fetching product ${slug}:`, error);
    return null;
  }

  return data;
};

/**
 * Checks inventory availability for a product and size
 * @param {string} productId - Product ID (UUID)
 * @param {string} size - Size to check
 * @param {number} requestedQuantity - Quantity requested
 * @returns {Promise<{ available: boolean, currentStock?: number }>}
 */
const checkInventory = async (productId, size, requestedQuantity) => {
  const { data, error } = await getSupabase()
    .from('inventory')
    .select('quantity')
    .eq('product_id', productId)
    .eq('size', size)
    .single();

  if (error) {
    console.error(`[create-checkout] Error checking inventory:`, error);
    // If inventory record doesn't exist, assume unavailable
    return { available: false, currentStock: 0 };
  }

  const currentStock = data?.quantity || 0;
  return {
    available: currentStock >= requestedQuantity,
    currentStock
  };
};

/**
 * Builds Stripe line item from product and cart item
 * @param {object} product - Product from Supabase
 * @param {object} cartItem - Cart item with size and quantity
 * @returns {object} Stripe line item
 */
const buildLineItem = (product, cartItem) => {
  // Get product image URL (use first image or placeholder)
  const imageUrl = product.images && product.images.length > 0
    ? product.images[0]
    : null;

  return {
    price_data: {
      currency: 'cad',
      product_data: {
        name: product.name,
        description: `Size: ${cartItem.size}`,
        ...(imageUrl && { images: [imageUrl] }),
        metadata: {
          product_id: product.id,
          slug: product.slug,
          size: cartItem.size
        }
      },
      unit_amount: product.price // Price is already in cents
    },
    quantity: cartItem.quantity
  };
};

/**
 * Main handler for creating Stripe Checkout sessions
 * @param {object} event - Netlify function event
 * @returns {Promise<object>} Netlify function response
 */
export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed. Use POST.'
      }
    });
  }

  try {
    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      return jsonResponse(400, {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body'
        }
      });
    }

    // Validate request structure
    const validation = validateRequest(body);
    if (!validation.valid) {
      return jsonResponse(400, {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: validation.error
        }
      });
    }

    const { items, successUrl, cancelUrl } = body;
    const lineItems = [];
    const processedItems = [];

    // Process each cart item
    for (const item of items) {
      // Fetch product from Supabase
      const product = await fetchProduct(item.productId);

      if (!product) {
        return jsonResponse(404, {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: `Product not found: ${item.productId}`
          }
        });
      }

      // Check inventory availability
      const inventory = await checkInventory(product.id, item.size, item.quantity);

      if (!inventory.available) {
        return jsonResponse(409, {
          success: false,
          error: {
            code: 'INVENTORY_UNAVAILABLE',
            message: `Insufficient inventory for ${product.name} (Size: ${item.size}). Available: ${inventory.currentStock}, Requested: ${item.quantity}`
          }
        });
      }

      // Build line item for Stripe
      lineItems.push(buildLineItem(product, item));

      // Track processed items for metadata
      processedItems.push({
        productId: item.productId,
        productUuid: product.id,
        name: product.name,
        size: item.size,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Create Stripe Checkout session
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      shipping_address_collection: {
        allowed_countries: ['CA', 'US']
      },
      shipping_options: SHIPPING_OPTIONS,
      metadata: {
        items: JSON.stringify(processedItems)
      },
      // Enable automatic tax calculation if configured in Stripe
      // automatic_tax: { enabled: true },
      // Collect billing address for tax purposes
      billing_address_collection: 'required',
      // Phone number collection
      phone_number_collection: {
        enabled: true
      }
    });

    // Return success response with session details
    return jsonResponse(200, {
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });

  } catch (error) {
    console.error('[create-checkout] Error:', error);

    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
      return jsonResponse(400, {
        success: false,
        error: {
          code: 'STRIPE_ERROR',
          message: error.message
        }
      });
    }

    // Handle Stripe API errors
    if (error.type && error.type.startsWith('Stripe')) {
      return jsonResponse(502, {
        success: false,
        error: {
          code: 'STRIPE_API_ERROR',
          message: 'Payment service error. Please try again later.'
        }
      });
    }

    // Generic server error
    return jsonResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again.'
      }
    });
  }
};
