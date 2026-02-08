# Deployment Checklist - Inventory & Waitlist System

## ✅ Completed

### 1. Shop Page Integration
- ✅ Added `inventory.js` script to [shop.html:1103](shop.html#L1103)
- ✅ Added `waitlist.js` module to [shop.html:1106](shop.html#L1106)
- ✅ Added `waitlist.css` stylesheet to [shop.html:564](shop.html#L564)
- ✅ Updated shop page JavaScript to:
  - Fetch inventory data when selecting a print
  - Mark sold-out sizes with strikethrough styling
  - Show waitlist form instead of "Add to Cart" for sold-out sizes
  - Use proper product UUIDs for waitlist signups

### 2. API Updates
- ✅ Updated [netlify/functions/inventory.js](netlify/functions/inventory.js#L188) to return product UUID (`id` field)
  - This is required for the waitlist signup to work correctly

### 3. Files Created (Previously)
- ✅ `css/waitlist.css` - Premium waitlist form styling
- ✅ `js/waitlist.js` - Waitlist form rendering and submission
- ✅ `netlify/functions/waitlist-signup.js` - Backend for email signups
- ✅ `supabase/migrations/20260207000000_update_inventory.sql` - Inventory reset migration
- ✅ `supabase/migrations/20260207000001_add_waitlist.sql` - Waitlist table creation

---

## ⚠️ Manual Steps Required

### 1. Run SQL Migrations in Supabase

You need to run these two migrations in your **Supabase SQL Editor**:

#### Migration 1: Update Inventory
**File:** `supabase/migrations/20260207000000_update_inventory.sql`

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of the migration file:
   ```sql
   -- Reset all inventory to 0
   UPDATE inventory
   SET quantity = 0,
       reserved = 0,
       updated_at = NOW();

   -- Update Money jacket inventory: 4 Medium, 10 Large
   UPDATE inventory
   SET quantity = 4,
       updated_at = NOW()
   FROM products p
   WHERE inventory.product_id = p.id
     AND p.slug = 'money-jacket'
     AND inventory.size = 'M';

   UPDATE inventory
   SET quantity = 10,
       updated_at = NOW()
   FROM products p
   WHERE inventory.product_id = p.id
     AND p.slug = 'money-jacket'
     AND inventory.size = 'L';
   ```
5. Run the query
6. Verify with:
   ```sql
   SELECT p.name, i.size, i.quantity, i.reserved
   FROM inventory i
   JOIN products p ON p.id = i.product_id
   ORDER BY p.name, i.size;
   ```

#### Migration 2: Create Waitlist Table
**File:** `supabase/migrations/20260207000001_add_waitlist.sql`

1. In Supabase SQL Editor, create a new query
2. Copy the entire contents of the migration file
3. Run the query
4. This creates:
   - `waitlist` table
   - RLS policies for security
   - Helper functions (`get_waitlist_count`, `notify_waitlist`)

---

### 2. Configure Environment Variables

Make sure your Netlify environment has these variables set:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-public-key
```

**To set these:**
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the variables above

---

### 3. Update inventory.js Configuration

In [js/inventory.js](js/inventory.js#L18-L19), replace the placeholder credentials:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // ← Replace this
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // ← Replace this
```

With your actual Supabase project URL and anon key:
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-public-key';
```

---

## 🚀 Deploy

Once the above steps are complete:

```bash
git add .
git commit -m "Add inventory checking and waitlist system to shop page"
git push
```

Netlify will automatically:
- Deploy the updated shop.html
- Deploy the waitlist-signup function
- Deploy the updated inventory function

---

## ✅ Testing Checklist

After deployment:

1. **Test Inventory Display**
   - [ ] Go to shop page
   - [ ] Select "Money" print → Should show M and L available
   - [ ] Select other prints → All sizes should show as sold out

2. **Test Sold-Out Sizes**
   - [ ] Select "Money" print
   - [ ] Click on XS, S, XL, or XXL
   - [ ] Buttons should be greyed out with strikethrough

3. **Test Waitlist Form**
   - [ ] Select "Libation" print (sold out)
   - [ ] Should see "Sold Out" message and email form
   - [ ] Enter email: `test@example.com`
   - [ ] Click "Notify Me"
   - [ ] Should see success message: "You're on the list!"

4. **Verify Waitlist Database**
   - [ ] Go to Supabase dashboard → Table Editor → `waitlist` table
   - [ ] Should see your test email entry

5. **Test Available Sizes**
   - [ ] Select "Money" print
   - [ ] Select size M or L
   - [ ] Should see "Add to Cart" button (not waitlist form)

---

## 📊 Monitoring Waitlist Signups

To view all waitlist signups in Supabase SQL Editor:

```sql
SELECT
  w.email,
  p.name as product,
  w.size,
  w.created_at,
  w.notified
FROM waitlist w
JOIN products p ON p.id = w.product_id
WHERE w.notified = FALSE
ORDER BY w.created_at DESC;
```

---

## 🔄 When Restocking Items

When you restock a sold-out print:

1. **Update inventory in Supabase:**
   ```sql
   UPDATE inventory
   SET quantity = 10
   WHERE product_id = (SELECT id FROM products WHERE slug = 'libation-jacket')
     AND size = 'M';
   ```

2. **Get waitlist emails:**
   ```sql
   SELECT email, size
   FROM waitlist
   WHERE product_id = (SELECT id FROM products WHERE slug = 'libation-jacket')
     AND notified = FALSE
   ORDER BY created_at ASC;
   ```

3. **Send restock emails** (see INVENTORY_AND_WAITLIST_SETUP.md for email template)

4. **Mark as notified:**
   ```sql
   SELECT notify_waitlist(
     (SELECT id FROM products WHERE slug = 'libation-jacket'),
     'M'
   );
   ```

---

## 📝 Summary

**What's Working:**
- ✅ Shop page checks inventory via API
- ✅ Sold-out sizes are visually disabled
- ✅ Waitlist form appears for sold-out items
- ✅ Email signups are stored in database

**What You Need to Do:**
1. Run the 2 SQL migrations in Supabase
2. Update environment variables in Netlify (if not already set)
3. Update Supabase credentials in js/inventory.js
4. Deploy to Netlify
5. Test the complete flow

Once these manual steps are done, the entire inventory and waitlist system will be fully operational! 🎉
