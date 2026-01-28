/**
 * Hogan's Alley Analytics & Tracking
 *
 * This file handles:
 * - Google Analytics 4 (GA4) event tracking
 * - Google Ads conversion tracking
 * - E-commerce events (view_item, add_to_cart, purchase)
 */

(function() {
  'use strict';

  // GA4 Measurement ID - REPLACE WITH YOUR ID
  const GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX';

  // Google Ads Conversion ID - REPLACE WITH YOUR ID
  const GOOGLE_ADS_ID = 'AW-XXXXXXXXXX';
  const PURCHASE_CONVERSION_LABEL = 'XXXXXXXXXX';

  /**
   * Initialize Google Analytics 4
   */
  function initGA4() {
    // Load gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer and gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { dataLayer.push(arguments); };

    gtag('js', new Date());
    gtag('config', GA4_MEASUREMENT_ID, {
      'send_page_view': true,
      'cookie_flags': 'SameSite=None;Secure'
    });

    // Also configure Google Ads if ID is set
    if (GOOGLE_ADS_ID && GOOGLE_ADS_ID !== 'AW-XXXXXXXXXX') {
      gtag('config', GOOGLE_ADS_ID);
    }

    console.log('[Analytics] GA4 initialized');
  }

  /**
   * Track product view (collection page)
   */
  function trackViewItem(product) {
    if (!window.gtag) return;

    gtag('event', 'view_item', {
      currency: 'CAD',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.collection,
        price: product.price,
        quantity: 1
      }]
    });

    console.log('[Analytics] view_item:', product.name);
  }

  /**
   * Track add to cart
   */
  function trackAddToCart(product, size, quantity) {
    if (!window.gtag) return;

    gtag('event', 'add_to_cart', {
      currency: 'CAD',
      value: product.price * quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.collection,
        item_variant: size,
        price: product.price,
        quantity: quantity
      }]
    });

    console.log('[Analytics] add_to_cart:', product.name, size, quantity);
  }

  /**
   * Track cart view (drawer open)
   */
  function trackViewCart(cartItems, total) {
    if (!window.gtag) return;

    const items = cartItems.map(item => ({
      item_id: item.productId,
      item_name: item.name,
      item_category: item.collection,
      item_variant: item.size,
      price: item.price,
      quantity: item.quantity
    }));

    gtag('event', 'view_cart', {
      currency: 'CAD',
      value: total,
      items: items
    });

    console.log('[Analytics] view_cart:', items.length, 'items');
  }

  /**
   * Track begin checkout
   */
  function trackBeginCheckout(cartItems, total) {
    if (!window.gtag) return;

    const items = cartItems.map(item => ({
      item_id: item.productId,
      item_name: item.name,
      item_category: item.collection,
      item_variant: item.size,
      price: item.price,
      quantity: item.quantity
    }));

    gtag('event', 'begin_checkout', {
      currency: 'CAD',
      value: total,
      items: items
    });

    console.log('[Analytics] begin_checkout:', total);
  }

  /**
   * Track purchase (called on success page)
   */
  function trackPurchase(transactionId, total, items) {
    if (!window.gtag) return;

    // GA4 purchase event
    gtag('event', 'purchase', {
      transaction_id: transactionId,
      currency: 'CAD',
      value: total,
      items: items
    });

    // Google Ads conversion (if configured)
    if (GOOGLE_ADS_ID && GOOGLE_ADS_ID !== 'AW-XXXXXXXXXX') {
      gtag('event', 'conversion', {
        'send_to': `${GOOGLE_ADS_ID}/${PURCHASE_CONVERSION_LABEL}`,
        'value': total,
        'currency': 'CAD',
        'transaction_id': transactionId
      });
    }

    console.log('[Analytics] purchase:', transactionId, total);
  }

  /**
   * Track remove from cart
   */
  function trackRemoveFromCart(product, size, quantity) {
    if (!window.gtag) return;

    gtag('event', 'remove_from_cart', {
      currency: 'CAD',
      value: product.price * quantity,
      items: [{
        item_id: product.productId || product.id,
        item_name: product.name,
        item_variant: size,
        price: product.price,
        quantity: quantity
      }]
    });
  }

  /**
   * Track newsletter signup
   */
  function trackNewsletterSignup(email) {
    if (!window.gtag) return;

    gtag('event', 'generate_lead', {
      currency: 'CAD',
      value: 10 // Estimated value of email lead
    });

    console.log('[Analytics] newsletter_signup');
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGA4);
  } else {
    initGA4();
  }

  // Expose analytics functions globally
  window.hogansAnalytics = {
    trackViewItem,
    trackAddToCart,
    trackViewCart,
    trackBeginCheckout,
    trackPurchase,
    trackRemoveFromCart,
    trackNewsletterSignup
  };

})();
