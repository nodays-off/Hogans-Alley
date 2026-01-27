/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events for Hogan's Alley e-commerce
 *
 * @author Hogan's Alley
 * @version 1.0.0
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client with service role key for database operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Response headers
 */
const headers = {
  'Content-Type': 'application/json'
};

/**
 * Creates a JSON response
 * @param {number} statusCode - HTTP status code
 * @param {object} body - Response body
 * @returns {object} Netlify function response
 */
const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers,
  body: JSON.stringify(body)
});

/**
 * Decrements inventory for a purchased item
 * @param {string} productId - Product UUID
 * @param {string} size - Size purchased
 * @param {number} quantity - Quantity purchased
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
const decrementInventory = async (productId, size, quantity) => {
  try {
    const { data, error } = await supabase.rpc('decrement_inventory', {
      p_product_id: productId,
      p_size: size,
      p_quantity: quantity
    });

    if (error) {
      console.error(`[webhook] Error decrementing inventory for ${productId}/${size}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[webhook] Decremented inventory: ${productId}/${size} by ${quantity}`);
    return { success: true };
  } catch (err) {
    console.error(`[webhook] Exception decrementing inventory:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Creates an order record in the database
 * @param {object} session - Stripe checkout session
 * @param {object[]} items - Parsed items from metadata
 * @returns {Promise<{ success: boolean, orderId?: string, error?: string }>}
 */
const createOrderRecord = async (session, items) => {
  try {
    const orderData = {
      stripe_checkout_id: session.id,
      stripe_payment_intent: session.payment_intent,
      customer_email: session.customer_details?.email,
      items: items,
      subtotal: session.amount_subtotal,
      shipping: session.total_details?.amount_shipping || 0,
      total: session.amount_total,
      currency: session.currency.toUpperCase(),
      status: 'paid',
      shipping_address: session.shipping_details?.address,
      paid_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select('id')
      .single();

    if (error) {
      console.error('[webhook] Error creating order record:', error);
      return { success: false, error: error.message };
    }

    console.log(`[webhook] Created order record: ${data.id}`);
    return { success: true, orderId: data.id };
  } catch (err) {
    console.error('[webhook] Exception creating order record:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Handles the checkout.session.completed event
 * @param {object} session - Stripe checkout session
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
const handleCheckoutCompleted = async (session) => {
  console.log(`[webhook] Processing checkout.session.completed: ${session.id}`);

  // Parse items from session metadata
  let items;
  try {
    items = JSON.parse(session.metadata?.items || '[]');
  } catch (parseError) {
    console.error('[webhook] Error parsing items metadata:', parseError);
    return { success: false, error: 'Invalid items metadata' };
  }

  if (!Array.isArray(items) || items.length === 0) {
    console.error('[webhook] No items found in session metadata');
    return { success: false, error: 'No items in order' };
  }

  // Decrement inventory for each item
  const inventoryResults = [];
  for (const item of items) {
    // Use productUuid if available, otherwise use productId
    const productId = item.productUuid || item.productId;

    const result = await decrementInventory(
      productId,
      item.size,
      item.quantity
    );

    inventoryResults.push({
      productId,
      size: item.size,
      quantity: item.quantity,
      ...result
    });
  }

  // Log any inventory decrement failures (but don't fail the webhook)
  const inventoryFailures = inventoryResults.filter(r => !r.success);
  if (inventoryFailures.length > 0) {
    console.warn('[webhook] Some inventory decrements failed:', inventoryFailures);
  }

  // Create order record
  const orderResult = await createOrderRecord(session, items);

  if (!orderResult.success) {
    // Log error but don't fail - we don't want Stripe to retry
    // The payment was successful, we just had a DB issue
    console.error('[webhook] Failed to create order record:', orderResult.error);
  }

  return {
    success: true,
    orderId: orderResult.orderId,
    inventoryUpdated: inventoryResults.filter(r => r.success).length,
    inventoryFailed: inventoryFailures.length
  };
};

/**
 * Main webhook handler
 * @param {object} event - Netlify function event
 * @returns {Promise<object>} Netlify function response
 */
export const handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  // Get the webhook signature from headers
  const signature = event.headers['stripe-signature'];

  if (!signature) {
    console.error('[webhook] Missing stripe-signature header');
    return jsonResponse(400, { error: 'Missing stripe-signature header' });
  }

  // Verify webhook secret is configured
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET not configured');
    return jsonResponse(500, { error: 'Webhook secret not configured' });
  }

  // Verify the webhook signature and construct the event
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return jsonResponse(400, { error: `Webhook signature verification failed: ${err.message}` });
  }

  console.log(`[webhook] Received event: ${stripeEvent.type} (${stripeEvent.id})`);

  // Handle specific event types
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;

        // Only process if payment was successful
        if (session.payment_status === 'paid') {
          const result = await handleCheckoutCompleted(session);

          if (!result.success) {
            console.error('[webhook] checkout.session.completed handling failed:', result.error);
            // Return 200 anyway to acknowledge receipt
            // We don't want Stripe to keep retrying for DB issues
          }

          return jsonResponse(200, {
            received: true,
            type: stripeEvent.type,
            ...result
          });
        } else {
          console.log(`[webhook] Skipping unpaid session: ${session.id}`);
          return jsonResponse(200, {
            received: true,
            type: stripeEvent.type,
            message: 'Session not yet paid'
          });
        }
      }

      case 'checkout.session.async_payment_succeeded': {
        // Handle async payment methods (like bank transfers) if needed
        const session = stripeEvent.data.object;
        console.log(`[webhook] Async payment succeeded for session: ${session.id}`);

        const result = await handleCheckoutCompleted(session);

        return jsonResponse(200, {
          received: true,
          type: stripeEvent.type,
          ...result
        });
      }

      case 'checkout.session.async_payment_failed': {
        // Handle failed async payments
        const session = stripeEvent.data.object;
        console.log(`[webhook] Async payment failed for session: ${session.id}`);

        // Could implement notification logic here

        return jsonResponse(200, {
          received: true,
          type: stripeEvent.type,
          message: 'Async payment failure acknowledged'
        });
      }

      case 'checkout.session.expired': {
        // Handle expired sessions (cleanup if needed)
        const session = stripeEvent.data.object;
        console.log(`[webhook] Session expired: ${session.id}`);

        return jsonResponse(200, {
          received: true,
          type: stripeEvent.type,
          message: 'Session expiration acknowledged'
        });
      }

      default:
        // Log unhandled events for debugging
        console.log(`[webhook] Unhandled event type: ${stripeEvent.type}`);
        return jsonResponse(200, {
          received: true,
          type: stripeEvent.type,
          message: 'Event type not handled'
        });
    }
  } catch (err) {
    console.error(`[webhook] Error processing ${stripeEvent.type}:`, err);

    // Return 200 to acknowledge receipt
    // Internal errors shouldn't cause Stripe to retry
    return jsonResponse(200, {
      received: true,
      type: stripeEvent.type,
      error: 'Internal processing error'
    });
  }
};
