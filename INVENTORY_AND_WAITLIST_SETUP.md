# Inventory Update & Waitlist Setup Guide

## Overview

This guide covers:
1. **Updating inventory** to reflect current stock (Money print only: 4 Medium, 10 Large)
2. **Premium waitlist system** for "Sold Out" items with email notifications

---

## Part 1: Update Inventory in Database

### Step 1: Run SQL Migration

Go to your **Supabase SQL Editor** and run this migration:

```bash
# Location: supabase/migrations/20260207000000_update_inventory.sql
```

This will:
- Set all products to 0 stock
- Update Money jacket: 4 Medium, 10 Large
- All other prints (Libation, Transport, Sanitation) will show as "Sold Out"

### Step 2: Verify Inventory

Run this query to confirm:

```sql
SELECT p.name, i.size, i.quantity, i.reserved
FROM inventory i
JOIN products p ON p.id = i.product_id
ORDER BY p.name, i.size;
```

You should see:
- **Money**: M=4, L=10, all other sizes=0
- **Libation, Transport, Sanitation**: all sizes=0

---

## Part 2: Add Waitlist System

### Step 1: Create Waitlist Table

Run the second migration in Supabase SQL Editor:

```bash
# Location: supabase/migrations/20260207000001_add_waitlist.sql
```

This creates:
- `waitlist` table for email signups
- Functions for managing waitlist
- RLS policies for security

### Step 2: Deploy Netlify Function

The waitlist signup function is already created at:
```
netlify/functions/waitlist-signup.js
```

This will be automatically deployed with your next Netlify deployment.

### Step 3: Add Waitlist to Shop Page

Add these lines to your `shop.html` (in the `<head>` section):

```html
<!-- Add waitlist CSS -->
<link rel="stylesheet" href="/css/waitlist.css">

<!-- Add waitlist JS module (before closing </body>) -->
<script type="module" src="/js/waitlist.js"></script>
```

### Step 4: Update inventory.js

The existing `js/inventory.js` needs to be updated to:
1. Check inventory levels
2. Show "Sold Out" for zero-stock items
3. Render waitlist form instead of "Add to Cart" button

---

## Part 3: "Sold Out" vs "Out of Stock"

### Terminology Decision: **"Sold Out"**

✅ **Use "Sold Out"** - More premium and exclusive
- Implies high demand
- Creates urgency
- Sounds more intentional

❌ **Avoid "Out of Stock"** - Sounds like a supply chain issue
- Implies poor planning
- Less aspirational

### Where It Appears

1. **Size buttons**: Greyed out with strikethrough
2. **Add to Cart area**: Replaced with waitlist form
3. **Product card badges** (optional): Small "Sold Out" badge

---

## Part 4: How the Waitlist Works

### Customer Experience

1. **Customer sees "Sold Out"** on unavailable sizes
2. **Customer enters email** in waitlist form
3. **Confirmation message** appears: "You're on the list!"
4. **No spam promise**: "We'll only email you when this item is back in stock"

### Admin Side (When Restocking)

When you restock a product:

1. **Update inventory** in Supabase:
   ```sql
   UPDATE inventory
   SET quantity = 10
   WHERE product_id = (SELECT id FROM products WHERE slug = 'libation-jacket')
     AND size = 'M';
   ```

2. **Get waitlist emails**:
   ```sql
   SELECT email, size
   FROM waitlist
   WHERE product_id = (SELECT id FROM products WHERE slug = 'libation-jacket')
     AND notified = FALSE
   ORDER BY created_at ASC;
   ```

3. **Send restock emails** (manually or via automation tool like Mailchimp)

4. **Mark as notified**:
   ```sql
   SELECT notify_waitlist(
     (SELECT id FROM products WHERE slug = 'libation-jacket'),
     'M'
   );
   ```

---

## Part 5: Email Template (Restock Notification)

When items are back in stock, send this email to waitlist:

```
Subject: Back in Stock: [Product Name] - Size [Size]

Hi there!

Good news — the item you've been waiting for is back in stock:

[Product Name]
Size: [Size]
$395.00 CAD

[Shop Now Button → Link to product page]

This is a limited restock, so we recommend acting fast.

Questions? Just reply to this email.

Best,
Hogan's Alley Team

---
You're receiving this because you signed up for back-in-stock notifications.
Unsubscribe | Update Preferences
```

---

## Part 6: Deploy Changes

### Commit and Deploy

```bash
git add .
git commit -m "Add inventory update and waitlist system"
git push
```

Netlify will automatically:
- Deploy the new waitlist function
- Include waitlist.js and waitlist.css
- Make everything live

### Test the Waitlist

1. Go to shop page
2. Select a sold-out size (e.g., Libation - Medium)
3. Enter test email
4. Check Supabase `waitlist` table to confirm entry

---

## Part 7: Premium Touches

### Optional Enhancements

1. **Waitlist counter**: Show "Join X others on the waitlist"
2. **Scarcity messaging**: "Only 4 left in Medium"
3. **Email automation**: Use Supabase triggers + Resend.com or SendGrid
4. **Analytics**: Track waitlist signups in Google Analytics

---

## Summary

✅ **Inventory updated**: Money print only (4M, 10L)
✅ **"Sold Out" terminology**: Premium and exclusive
✅ **Waitlist system**: Captures emails for restocks
✅ **No spam promise**: Builds trust
✅ **Ready to deploy**: All files created

### Next Steps

1. Run both SQL migrations in Supabase
2. Add CSS + JS to shop.html
3. Deploy to Netlify
4. Test waitlist signup
5. Plan restock email campaign

---

## Questions?

- **How do I manually add someone to the waitlist?**
  ```sql
  INSERT INTO waitlist (email, product_id, size)
  VALUES ('customer@example.com', (SELECT id FROM products WHERE slug = 'money-jacket'), 'M');
  ```

- **How do I see all waitlist signups?**
  ```sql
  SELECT w.email, p.name, w.size, w.created_at
  FROM waitlist w
  JOIN products p ON p.id = w.product_id
  WHERE w.notified = FALSE
  ORDER BY w.created_at DESC;
  ```

- **Can customers sign up for multiple sizes?**
  Yes! The system allows one signup per email/product/size combination.
