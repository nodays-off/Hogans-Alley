// ============================================================================
// Waitlist Signup Function
// Handles customer email signups for back-in-stock notifications
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

// Lazy-initialize Supabase client (env vars may not be available at module load)
let _supabase;
function getSupabase() {
  if (!_supabase) _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  return _supabase;
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { email, productId, size } = JSON.parse(event.body);

    // Validate input
    if (!email || !productId || !size) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: email, productId, size' }),
      };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email address' }),
      };
    }

    // Insert into waitlist (ON CONFLICT DO NOTHING handles duplicates)
    const { data, error } = await getSupabase()
      .from('waitlist')
      .insert({
        email: email.toLowerCase().trim(),
        product_id: productId,
        size: size,
      })
      .select()
      .single();

    if (error) {
      // If it's a duplicate, return success anyway
      if (error.code === '23505') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'You\'re already on the waitlist for this item',
            alreadySignedUp: true,
          }),
        };
      }

      console.error('Waitlist insert error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to join waitlist' }),
      };
    }

    // Get waitlist count
    const { data: countData } = await getSupabase()
      .rpc('get_waitlist_count', {
        p_product_id: productId,
        p_size: size,
      });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Successfully joined waitlist',
        waitlistCount: countData || 0,
      }),
    };

  } catch (error) {
    console.error('Waitlist signup error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
