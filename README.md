# L'ÉLIXIR Skincare & Beauty E-Commerce Platform

A production-ready, full-stack skincare and beauty product e-commerce application built using the Next.js App Router, React 19, TypeScript, Tailwind CSS v4, MongoDB, Mongoose, NextAuth, and Cloudinary.

The platform splits the experience into two visual identities:
1. **Storefront**: Soft, elegant cream-and-emerald design tailored for luxury skincare customers.
2. **Admin Dashboard**: Sleek, slate-dark SaaS interface designed for reporting and inventory control.

---

## ⚡ Setup & Installation

### 1. Configure Environment Variables
Create a `.env.local` file in the root directory and copy the contents from `.env.example`.
Update it with your local MongoDB connection URI, NextAuth secret, Google OAuth client credentials, and Cloudinary API credentials.

```bash
# Example .env.local
MONGODB_URI=mongodb://localhost:27017/skin_prod
AUTH_SECRET=a_random_32_character_hex_string
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Install Packages
Dependencies have been configured in `package.json`. If you need to reinstall them:
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗃️ Database Seeding

To quickly test the application with realistic data (mock users, products, categories, logs, and notifications), trigger the seeding script:

1. Start the application.
2. Visit **`http://localhost:3000/api/seed`** in your browser.
3. The database will be cleared, initialized with Mongoose schemas, and populated with:
   - 5 skincare categories (Cleanser, Serum, Moisturizer, Sunscreen, Toner)
   - 6 products complete with ingredient details, benefits, application guides, skin types, concerns, and stock levels.
   - Initial inventory stock logs.
   - Demo low-stock notification alerts.
   - Initial test accounts.

### 🔑 Seeding Test Credentials:
* **Administrator Account**:
  - **Email**: `admin@skincare.com`
  - **Password**: `admin123`
* **Customer Account**:
  - **Email**: `customer@skincare.com`
  - **Password**: `customer123`

---

## 📁 Codebase Architecture

```
├── app/
│   ├── (admin)/               # Admin dashboard route group (slate dark theme)
│   │   ├── layout.tsx         # Restricts access to role="admin" via Edge session callbacks
│   │   └── admin/             # Analytics panel (custom SVG charts), products CRUD, customer status toggle
│   ├── (customer)/            # Customer storefront route group (luxury cream/emerald)
│   │   ├── layout.tsx         # Navbar with category dropdowns, client debounced search, profile status
│   │   ├── page.tsx           # Home with hero section, category goals, best sellers
│   │   ├── products/          # Catalog listing, multi-filtering, pagination, reviews, ingredients
│   │   ├── cart/              # Cart editing client component
│   │   ├── wishlist/          # Saved products listing
│   │   ├── checkout/          # Saved shipping address and payment card selections
│   │   ├── orders/            # Order history listing & order tracking vertical progress timelines
│   │   └── profile/           # Details edits, credentials password changer, address/card books
│   ├── (auth)/                # Authentication route group (Split visual panel layouts)
│   │   ├── login/             # Credentials + Google OAuth button
│   │   └── signup/            # Name, email, and password registration
│   ├── api/
│   │   ├── auth/              # NextAuth route handlers
│   │   ├── admin/cloudinary/  # Secures base64 uploads & deletions to Cloudinary
│   │   └── seed/              # Quick DB reset & population script
│   ├── components/            # Shared components (search, dropdowns, cart elements, SVGs)
│   └── globals.css            # Tailwind CSS v4 variables configuration & visual glass effects
├── lib/
│   ├── actions/               # Server Actions separating frontend UI from DB writes
│   │   ├── authActions.ts     # User signups, profiles edits, password overrides
│   │   ├── customerActions.ts # Cart modifiers, wishlist toggling, checkouts, review publications
│   │   └── adminActions.ts    # Product CRUDs, order updates, dispatch couriers, customer toggles
│   ├── models/                # Central Mongoose Schemas (User, Order, Product, etc.)
│   ├── db.ts                  # Serverless Mongoose connection pooling helper
│   └── mongodb.ts             # Underlying client promise for NextAuth database sessions
├── middleware.ts              # Route protection guards for "/admin", "/profile", "/checkout", "/orders"
├── auth.ts                    # Central Auth.js options mapping (strategy="database")
```

---

## 📈 Milestones & Progress Tracker

### 1. Core Architecture Setup (Done)
- **What was done**: Created serverless Mongoose caching connection pools (`lib/db.ts`), NextAuth database session helpers (`lib/mongodb.ts`), and central environment templates.
- **How it was done**: Configured `strategy: "database"` on NextAuth options (`auth.ts`) which stores session records inside the `sessions` collection in MongoDB, utilizing HTTP-only cookie tokens to ensure secure auth verification without relying on custom JWTs.

### 2. Mongoose Schemas & Database Layer (Done)
- **What was done**: Defined Mongoose schemas under `lib/models/`.
- **How it was done**: Wrote 12 integrated schemas (User, Product, Category, Cart, Wishlist, Address, PaymentMethod, Order, Review, Notification, InventoryLog, UserActivity) defining cross-references and text search indexes on product names, brands, descriptions, and tags.

### 3. Middleware Security Guard (Done)
- **What was done**: Implemented edge route guards (`middleware.ts`).
- **How it was done**: Intercepts matching routes: prevents access to `/admin/*` unless role equals `"admin"`, protects customer pages (`/profile`, `/checkout`, `/orders`) for authenticated sessions, and redirects logged-in sessions away from `/login` / `/signup`.

### 4. Database Seeding API (Done)
- **What was done**: Created seeding route `/api/seed`.
- **How it was done**: Implemented code that resets collections, hashes credentials passwords via `bcryptjs`, inserts categories, and sets up catalog products complete with stock levels, ingredients, application guidelines, and alert notifications.

### 5. Customer Storefront UI (Done)
- **What was done**: Developed homepage, product catalog, detail pages, cart, wishlist, checkout flow, profile management, and order tracking timeline.
- **How it was done**: Separated pages into the `(customer)` route group using a premium cream-and-emerald luxury skin-care theme. Used standard URL query parameters for filters/sorting/pagination to ensure SEO performance, built debounced client search and dropdown indicators, and created checkout screens selecting saved address books or registering card metadata. Placed orders decrement stock, log stock audits, and notify administrators.

### 6. Admin Control Dashboard (Done)
- **What was done**: Developed dashboard statistics panels, SVG-based line trend charts, product CRUD editors, category publishing, customer listings, user status deactivations, and order dispatch workflows.
- **How it was done**: Separated routes into the `(admin)` route group utilizing a dark mode SaaS-inspired dashboard design. Custom MongoDB aggregations fetch KPI figures, low stock indicators, best sellers, top spending categories, and customers. The line trend chart is built using native, responsive, interactive SVG components, preventing React 19 dependency library issues. Image file selections stream base64 data to our secure Cloudinary upload routes.

---

## 🔍 Validation Checklist
To verify the application is fully compiled and error-free:

1. **Verify TypeScript & Build Consistency**:
   ```bash
   npm run build
   ```
2. **Review DB Seed**:
   Run development server, visit `http://localhost:3000/api/seed` in browser, verify JSON success return.
3. **Verify Security Guard**:
   Visit `http://localhost:3000/admin/dashboard` while logged out, verify automatic redirect to `/login`.
