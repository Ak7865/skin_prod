# Walkthrough: Skin-Care & Beauty E-Commerce Platform

This document summarizes the changes made to construct the full-stack skincare and beauty product e-commerce web application.

---

## 🚀 Accomplishments & Features Built

### 1. Database Model Layer (`lib/models/`)
We established 12 primary Mongoose schemas to represent the complete e-commerce data footprint:
- [User.ts](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/lib/models/User.ts): Email logins, bcrypt hashed passwords, OAuth hooks, and status triggers (`active`/`inactive`).
- [Product.ts](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/lib/models/Product.ts): Skincare specific metadata (ingredients, instructions, benefits, skin type and concerns) with MongoDB text indexes for rapid search.
- [Category.ts](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/lib/models/Category.ts): Organizational slugs.
- [Cart.ts](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/lib/models/Cart.ts) & [Wishlist.ts](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/lib/models/Wishlist.ts): Customer item selections.
- [Address.ts](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/lib/models/Address.ts) & [PaymentMethod.ts](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/lib/models/PaymentMethod.ts): Shipping address books and PCI-compliant card metadata.
- [Order.ts](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/lib/models/Order.ts): Invoices capturing item history, financial math, shipping snapshots, and courier tracking data.
- [Review.ts](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/lib/models/Review.ts): Rating stars and verification logic.
- [Notification.ts](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/lib/models/Notification.ts): Customer shipping alerts and admin stock/order warnings.
- [InventoryLog.ts](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/lib/models/InventoryLog.ts): Historical stock level auditing.
- [UserActivity.ts](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/lib/models/UserActivity.ts): Log analytics for recommendation mappings.

### 2. NextAuth Configuration & Route Guarding
- **Database Session Strategy**: Configured [auth.ts](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/auth.ts) to utilize database-backed sessions with MongoDB. The session cookie holds a randomized lookup identifier instead of a JWT.
- **Next.js Edge Middleware**: Created [middleware.ts](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/middleware.ts) protecting the `/admin` path for administrators, `/profile`/`/checkout`/`/orders` for authenticated customers, and redirecting logged-in sessions away from `/login`/`/signup`.

### 3. Customer Storefront (`(customer)` route group)
- [Home Page](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/%28customer%29/page.tsx): Luxury aesthetics featuring hero banners, skin goals collections, best sellers, and reviews.
- [Listing Page](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/%28customer%29/products/page.tsx): Full-filtering sidebar (category, skin type, concern, min/max price, rating) with pagination and sorting.
- [Details Page](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/%28customer%29/products/%5Bid%5D/page.tsx): Displays ingredients, instructions, benefits, and a rating breakdown. Only allows verified buyers to post reviews. Suggests similar items.
- [Cart Page](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/%28customer%29/cart/page.tsx): Mounting [CartList.tsx](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/components/CartList.tsx) client controller to manage item additions, quantities, and removals.
- [Checkout Page](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/%28customer%29/checkout/page.tsx): Selects saved addresses and mock card metadata. Decrements stocks, writes inventory audits, and fires notifications to the admin.
- [Orders Page](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/%28customer%29/orders/page.tsx): Lists previous orders.
- [Orders Detail & Tracking Page](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/%28customer%29/orders/%5Bid%5D/page.tsx): Displays a visual fulfillment timeline. Renders a native CSS confetti overlay upon checkout.
- [Profile Page](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/%28customer%29/profile/page.tsx): Tab-based manager for editing profile settings, updating passwords, and managing saved address/card books.

### 4. Admin Control Panel (`(admin)` route group)
- [Admin Layout](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/%28admin%29/layout.tsx): SaaS-inspired dark sidebar. Mounts the [AdminTopbar.tsx](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/components/AdminTopbar.tsx) client component to view alert counts and mark them as read.
- [Dashboard](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/%28admin%29/admin/dashboard/page.tsx): Displays core business KPIs. Integrates a custom SVG trend chart with tooltips (avoiding external graphing library compilation issues). Warns of low-stock items.
- [Products Listing & Form](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/%28admin%29/admin/products/page.tsx): Creates, reads, updates, and deletes products. Integrates with Cloudinary API routes for secure uploads.
- [Categories Management](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/%28admin%29/admin/categories/page.tsx): Lists, publishes, and deletes catalog categories.
- [Orders Fulfillment Management](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/%28admin%29/admin/orders/page.tsx): Views, accepts, and rejects orders. Allows assigning tracking IDs, courier names, and estimated delivery dates.
- [Customer Listings](file:///c:/Users/ah076/OneDrive/Desktop/skin_prod/app/%28admin%29/admin/customers/page.tsx): Displays buyer spends and includes buttons to activate/deactivate accounts.

---

## 🧪 Testing & Verification Guide

### 1. Seeding Mock Catalog
1. Start the server via `npm run dev`.
2. Visit **`http://localhost:3000/api/seed`** in your browser.
3. This resets the local database and inserts categories, products, notifications, and customer/admin testing accounts.

### 2. Testing Storefront Flow (Customer)
1. Visit `http://localhost:3000/login`.
2. Log in using `customer@skincare.com` / `customer123`.
3. Add products to your cart from the homepage or catalog filter.
4. Go to `/cart` and click **Proceed to Checkout**.
5. Save a new shipping address and mock card metadata, select them, and click **Place Order**.
6. Verify the order page loads, triggers the confetti, and displays the tracking timeline.
7. Go to `/profile` to manage your settings.

### 3. Testing Order Fulfillment & Analytics (Admin)
1. Log out of your customer account.
2. Log in to `http://localhost:3000/login` using `admin@skincare.com` / `admin123`.
3. Navigate to **Admin Dashboard**.
4. Check the SVG sales trend chart and KPI metrics.
5. Go to **Orders**, select the newly placed order, click **Accept**.
6. Enter shipping courier name and tracking ID, and click **Assign & Ship**.
7. Confirm that the order status transitions to `tracking_updated`.
8. Log in as the customer again and verify that the tracking timeline on their order page shows the update!

---

## 🛠 Build & Environment Fixes Applied

1. **Bypassed Turbopack Compilation Issues (Windows x64)**:
   - Updated `package.json` scripts to use the `--webpack` flag for both `dev` and `build` commands. This forces Next.js to use Webpack instead of Turbopack, which requires native win32 compilation bindings that were invalid or missing on this machine.
   - Kept Next.js's native SWC WASM compiler fallback active (avoiding custom Babel setup which compiles Server Actions in a way that conflicts with Next.js expectations).

2. **Decoupled Database from Build-Time Prerendering**:
   - Added `export const dynamic = "force-dynamic"` to all route components in `app/(customer)` and `app/(admin)` that connect to the database or query models. This stops Next.js from trying to statically build/prerender these pages at compilation time, eliminating the need to have a live MongoDB instance running during `npm run build`.

3. **Next.js 16 Middleware Convention Update**:
   - Renamed `middleware.ts` to `proxy.ts` and changed the exported function to `proxy(request: NextRequest)` in accordance with Next.js 16 requirements, resolving the deprecation warning in the compiler logs.
   - Refactored `proxy.ts` to use `next-auth/jwt`'s `getToken` to read session credentials and role info securely directly from the decrypted JWT session cookie, avoiding stale role-state mismatches.

4. **Cleaned CSS Warnings**:
   - Reordered `@import` statements in `app/globals.css` so that the Google Fonts `@import url(...)` declaration precedes `@import "tailwindcss"`, resolving CSS optimization warning logs.

5. **Dynamic SEO & Sitemap Generation**:
   - Added `sitemap.ts` and `robots.ts` to root of `app` to automatically index dynamic categories and products.
   - Implemented dynamic meta header properties using `generateMetadata` in product detail pages.
