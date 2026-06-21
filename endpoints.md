# Jawhara Jewellery — API Endpoint Reference

> **Base URL:** your Vercel backend deployment URL (e.g. `https://jawhara-api.vercel.app`)
>
> **Auth:** Protected routes require `Authorization: Bearer <token>` header.
> The token is returned by `/api/auth/login` and `/api/auth/register`.
>
> All responses follow the shape `{ success: boolean, data: any }`.
> Error responses follow `{ success: false, message: string }`.

---

## Table of Contents

1. [App Startup](#1-app-startup)
2. [Authentication](#2-authentication)
3. [Products](#3-products)
4. [Categories](#4-categories)
5. [Collections](#5-collections)
6. [Brands](#6-brands)
7. [Banners](#7-banners)
8. [Offers](#8-offers)
9. [Reviews](#9-reviews)
10. [Orders](#10-orders)
11. [Wishlist & Profile](#11-wishlist--profile)
12. [Mobile App Content](#12-mobile-app-content)
13. [Miscellaneous](#13-miscellaneous)
14. [Image Upload](#14-image-upload)

---

## 1. App Startup

Call these on app launch to hydrate global state.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/mobile-dashboard` | — | Full home screen config — all enabled sections with their active items in display order |
| GET | `/api/settings/branding` | — | App branding: `websiteLogo`, `mobileLogo`, `favicon` URLs |
| GET | `/api/settings/delivery` | — | Delivery country restrictions and message |

### `GET /api/mobile-dashboard`

Returns all **enabled** dashboard sections, each with their **active** items sorted by display order.

```json
{
  "success": true,
  "data": [
    {
      "key": "banner_slider",
      "label": "Top Banner Slider",
      "order": 1,
      "items": [
        {
          "_id": "...",
          "title": "Summer Collection",
          "subtitle": "Up to 50% off",
          "imageUrl": "/uploads/mobile/webp/abc.webp",
          "ctaText": "Shop Now",
          "ctaLink": "/category/rings",
          "badge": "",
          "active": true,
          "order": 1
        }
      ]
    },
    { "key": "categories",   "label": "Categories",          "order": 2, "items": [...] },
    { "key": "offers",       "label": "Limited-Time Offers", "order": 3, "items": [...] },
    { "key": "collections",  "label": "Diamond Collections", "order": 4, "items": [...] },
    { "key": "most_loved",   "label": "Most Loved",          "order": 5, "items": [...] },
    { "key": "gifting",      "label": "Gifting",             "order": 6, "items": [...] },
    { "key": "trending",     "label": "Trending Now",        "order": 7, "items": [...] },
    { "key": "moodboard",    "label": "Style Moodboard",     "order": 8, "items": [...] },
    { "key": "iconic",       "label": "Iconic Collections",  "order": 9, "items": [...] },
    { "key": "best_sellers", "label": "Diamond Best Sellers","order": 10,"items": [...] },
    { "key": "stories",      "label": "Customer Stories",    "order": 11,"items": [...] }
  ]
}
```

**Dashboard item fields:**

| Field | Type | Notes |
|-------|------|-------|
| `_id` | string | Unique item ID |
| `section` | string | Section key (e.g. `banner_slider`) |
| `title` | string | Main title. For `stories`: customer name |
| `subtitle` | string | Supporting text |
| `description` | string | Extra copy. For `stories`: review text |
| `imageUrl` | string | Relative upload path — prepend base URL |
| `ctaText` | string | Call-to-action button label |
| `ctaLink` | string | Deep link or relative URL |
| `badge` | string | Label/tag. For `stories`: star rating (1–5) |
| `order` | number | Display order within section |
| `active` | boolean | Always `true` in public response |

### `GET /api/settings/branding`

```json
{
  "success": true,
  "data": {
    "websiteLogo": "/uploads/branding/webp/logo.webp",
    "mobileLogo":  "/uploads/branding/webp/mobile-logo.webp",
    "favicon":     "/uploads/branding/webp/favicon.webp"
  }
}
```

### `GET /api/settings/delivery`

```json
{
  "success": true,
  "data": {
    "enableInternationalDelivery": false,
    "supportedCountryCodes": ["AE"],
    "supportedCountryNames": ["UAE"],
    "restrictionMessage": "Currently we deliver only within UAE."
  }
}
```

---

## 2. Authentication

| Method | Endpoint | Auth | Body |
|--------|----------|------|------|
| POST | `/api/auth/register` | — | `{ name, email, password, phone? }` |
| POST | `/api/auth/login` | — | `{ email, password }` |
| POST | `/api/auth/forgot-password` | — | `{ email }` |
| GET | `/api/auth/me` | ✅ | — |
| PUT | `/api/auth/profile` | ✅ | `{ name?, phone?, avatar? }` |
| PUT | `/api/auth/change-password` | ✅ | `{ currentPassword, newPassword }` |

### `POST /api/auth/register`

```json
// Request
{ "name": "Aisha", "email": "aisha@example.com", "password": "secret123", "phone": "+971501234567" }

// Response 201
{ "success": true, "token": "<jwt>", "data": { "_id": "...", "name": "Aisha", "email": "...", "phone": "...", "role": "user", "avatar": "" } }
```

### `POST /api/auth/login`

```json
// Request
{ "email": "aisha@example.com", "password": "secret123" }

// Response 200
{ "success": true, "token": "<jwt>", "data": { "_id": "...", "name": "Aisha", "email": "...", "role": "user", "avatar": "" } }
```

### `PUT /api/auth/profile`

Upload an avatar first using `/api/upload/avatar`, then pass the returned URL here.

```json
// Request
{ "name": "Aisha K.", "phone": "+971509999999", "avatar": "/uploads/avatars/webp/abc.webp" }

// Response 200
{ "success": true, "data": { "_id": "...", "name": "Aisha K.", "avatar": "/uploads/avatars/webp/abc.webp", ... } }
```

---

## 3. Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | — | Paginated product list with filters |
| GET | `/api/products/search` | — | Quick search (autocomplete / suggestions) |
| GET | `/api/products/:id` | — | Single product detail |

### `GET /api/products` — Query Parameters

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `q` | string | `rings` | Full-text search across name, brand, category, tags |
| `category` | string | `Rings` | Filter by category name (case-insensitive) |
| `collection` | string | `Gold Collection` | Filter by collection name |
| `brand` | string | `Malabar,JOYALUKKAS` | Comma-separated brand names |
| `metal` | string | `Gold` | Filter by metal (single/multi-value) |
| `stone` | string | `Diamond` | Filter by stone |
| `minPrice` | number | `500` | Minimum price |
| `maxPrice` | number | `5000` | Maximum price |
| `inStock` | boolean | `true` | Only in-stock items |
| `badge` | string | `New` | Filter by badge label |
| `flag` | string | `bestseller` | Filter by flag tag |
| `forWho` | string | `Women` | Filter by intended recipient |
| `minRating` | number | `4` | Minimum rating (0–5) |
| `sort` | string | `price_asc` | `price_asc` / `price_desc` / `rating` / `newest` |
| `page` | number | `1` | Page number (default: 1) |
| `limit` | number | `20` | Items per page (default: 20, max: 500) |

```json
// Response
{
  "success": true,
  "data": [ { "_id": "...", "name": "Diamond Ring", "price": 1200, "images": [...], ... } ],
  "total": 84,
  "page": 1,
  "pages": 5
}
```

### `GET /api/products/search`

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `q` | string | `gold` | Search term |
| `flag` | string | `trending` | Filter by flag |
| `sort` | string | `rating` | `rating` / `newest` |
| `limit` | number | `8` | Max results (default: 8) |

### `GET /api/products/:id`

Returns a full product document including all fields (images, metals, stones, sizes, SEO, etc.).

---

## 4. Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | — | All categories sorted by name |
| GET | `/api/categories/:slug` | — | Single category by slug |

### `GET /api/categories`

```json
{
  "success": true,
  "data": [
    { "_id": "...", "name": "Rings", "slug": "rings", "icon": "...", "image": "...", "description": "...", "subcategories": ["Solitaire", "Band"] }
  ]
}
```

### `GET /api/categories/:slug`

Example: `GET /api/categories/rings`

To get products for a category use `GET /api/products?category=Rings`.

---

## 5. Collections

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/collections` | — | All collections |
| GET | `/api/collections/:id` | — | Single collection by MongoDB `_id` |
| GET | `/api/collections/:id/products` | — | Paginated products in this collection |

### `GET /api/collections`

```json
{
  "success": true,
  "data": [
    { "_id": "abc123", "name": "Gold Collection", "image": "...", "description": "...", "featured": true, "discount": 10 }
  ]
}
```

### `GET /api/collections/:id/products`

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `sort` | string | `price_asc` / `price_desc` / `rating` / `newest` |

```json
{
  "success": true,
  "data": [...],
  "total": 12,
  "page": 1,
  "pages": 1
}
```

> **Alternative:** `GET /api/products?collection=Gold+Collection` — filters by collection name directly.

---

## 6. Brands

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/brands` | — | All brands |
| GET | `/api/brands/:slug` | — | Single brand by slug |
| GET | `/api/brands/:slug/products` | — | Products by brand |

---

## 7. Banners

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/banners` | — | Active web banners for the homepage carousel |

```json
{
  "success": true,
  "data": [
    { "_id": "...", "title": "Summer Sale", "imageUrl": "...", "link": "...", "active": true, "order": 1 }
  ]
}
```

---

## 8. Offers

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/offers/active` | — | Currently active countdown offer |

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Eid Special",
    "subtitle": "50% off on all diamond rings",
    "discount": 50,
    "endDate": "2026-07-01T00:00:00.000Z",
    "imageUrl": "...",
    "active": true
  }
}
```

---

## 9. Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reviews` | — | Public reviews (paginated) |
| GET | `/api/reviews/latest` | — | Latest few reviews |
| GET | `/api/reviews/product/:productId` | — | Reviews for a specific product |
| POST | `/api/reviews` | ✅ | Submit a new review |
| GET | `/api/reviews/my-reviews` | ✅ | Current user's submitted reviews |
| GET | `/api/reviews/pending-for-user` | ✅ | Products the user can review (delivered orders) |

### `POST /api/reviews`

```json
// Request
{ "productId": "...", "rating": 5, "title": "Beautiful ring!", "body": "Loved the quality." }

// Response 201
{ "success": true, "data": { "_id": "...", "rating": 5, "title": "...", "body": "...", "status": "pending" } }
```

---

## 10. Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | ✅ | Place a new order |
| GET | `/api/orders` | ✅ | Current user's order history |
| GET | `/api/orders/:id` | ✅ | Single order detail (items populated with product name & images) |

### `POST /api/orders`

```json
// Request
{
  "items": [
    { "product": "<productId>", "qty": 1, "price": 1200, "name": "Diamond Ring", "image": "..." }
  ],
  "shippingAddress": {
    "name": "Aisha K.",
    "phone": "+971501234567",
    "line1": "Villa 12, Palm Jumeirah",
    "city": "Dubai",
    "country": "AE"
  },
  "subtotal": 1200,
  "shippingFee": 0,
  "totalAmount": 1200
}

// Response 201
{ "success": true, "data": { "_id": "...", "status": "pending", "paymentStatus": "pending", ... } }
```

---

## 11. Wishlist & Profile

All routes under `/api/users` require authentication.

| Method | Endpoint | Auth | Body / Notes |
|--------|----------|------|--------------|
| GET | `/api/users/wishlist` | ✅ | Returns fully populated product objects |
| POST | `/api/users/wishlist` | ✅ | `{ "productId": "..." }` |
| DELETE | `/api/users/wishlist/:productId` | ✅ | — |
| PUT | `/api/users/profile` | ✅ | `{ name?, phone?, address?, avatar? }` |

### Avatar update flow

1. Upload the image: `POST /api/upload/avatar` with `multipart/form-data` (field: `image`)
2. Save the returned `webp` URL via `PUT /api/auth/profile` or `PUT /api/users/profile` with `{ "avatar": "<url>" }`

---

## 12. Mobile App Content

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/mobile-dashboard` | — | Full home screen (see [Section 1](#1-app-startup)) |
| GET | `/api/mobile-assets/onboarding` | — | Onboarding slides (active, sorted by order) |
| GET | `/api/mobile-assets/home` | — | Home banner carousel (active, sorted by order) |

### `GET /api/mobile-assets/onboarding`

```json
{
  "success": true,
  "data": [
    { "_id": "...", "title": "Welcome", "description": "Discover fine jewellery", "imageUrl": "...", "order": 1 }
  ]
}
```

### `GET /api/mobile-assets/home`

```json
{
  "success": true,
  "data": [
    { "_id": "...", "title": "Summer Sale", "description": "Up to 50% off", "imageUrl": "...", "order": 1 }
  ]
}
```

---

## 13. Miscellaneous

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/gold-price` | — | Live gold price data |
| GET | `/api/stores` | — | Physical store locations |

---

## 14. Image Upload

Upload images before saving a product, avatar, or any content that requires an image.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload/avatar` | ✅ | Upload a user profile photo |
| POST | `/api/upload/:category` | ✅ (admin) | Upload content images (`products`, `banners`, `mobile`, `categories`, `brands`, `branding`) |

**Request:** `multipart/form-data`, field name `images` (up to 10 files, max 10 MB each).  
**Allowed types:** JPEG, PNG, WebP.

```json
// Response
{
  "success": true,
  "data": [
    {
      "original":  "/uploads/mobile/original/uuid.jpg",
      "webp":      "/uploads/mobile/webp/uuid.webp",
      "thumbnail": "/uploads/mobile/thumbnails/uuid.webp",
      "filename":  "uuid",
      "width": 1080,
      "height": 540
    }
  ]
}
```

Use the `webp` URL when storing image references. Prepend the backend base URL when displaying images in the app.

---

## Image URL Helper

All `imageUrl` fields in API responses are **relative paths** (e.g. `/uploads/mobile/webp/abc.webp`).  
Prepend the backend base URL to display them:

```
https://<your-backend>.vercel.app/uploads/mobile/webp/abc.webp
```

---

## Error Responses

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Bad request — missing or invalid fields |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — account inactive or not admin |
| 404 | Resource not found |
| 500 | Server error |

```json
{ "success": false, "message": "Email already registered" }
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-21 | Initial endpoint reference created |
| 2026-06-21 | Added `GET /api/mobile-dashboard` — full dynamic home screen |
| 2026-06-21 | Added `GET /api/categories/:slug` — single category metadata |
| 2026-06-21 | Added `GET /api/collections/:id` and `/:id/products` |
| 2026-06-21 | Added `collection` query param to `GET /api/products` |
| 2026-06-21 | Added `GET /api/settings/branding` — public app branding |
| 2026-06-21 | `PUT /api/users/profile` now accepts `avatar` field |
