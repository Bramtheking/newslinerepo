# Firebase & Cloudinary Integration

## Overview
This e-commerce project now uses Firebase Firestore for product data storage and Cloudinary for image hosting.

## Firebase Configuration
- **Project ID**: aidetectorweb
- **Database**: Firestore (products collection)
- **Authentication**: Not implemented (admin access is open)

## Cloudinary Configuration
- **Cloud Name**: ds60x41jz
- **Upload Preset**: ecommerce (unsigned)
- **Folder**: ecommerce-products

## Features Implemented

### Admin Panel (`admin.html`)
- Upload images directly to Cloudinary using the upload widget
- Store product details in Firebase Firestore
- Real-time product management (CRUD operations)
- Image preview after upload

### Frontend Pages
- **Shop Page**: Loads products dynamically from Firebase
- **Index Page**: Shows featured products from Firebase
- **Product Details**: Loads individual product data from Firebase
- **Cart System**: Still uses localStorage for cart data

## File Structure
```
├── admin.html              # Admin panel with Cloudinary upload
├── admin.js               # Firebase + Cloudinary integration
├── firebase-products.js   # Frontend Firebase product loader
├── firebase-config.js     # Firebase configuration (unused - using CDN)
├── shop.html              # Shop page with Firebase products
├── index.html             # Homepage with Firebase featured products
├── product.html           # Product details with Firebase data
├── product.js             # Updated for Firebase integration
└── script.js              # Cart and UI functionality
```

## Usage

### Adding Products (Admin)
1. Go to `admin.html`
2. Fill in product details
3. Click "Upload to Cloudinary" to select and upload an image
4. Click "Save Product" to store in Firebase

### Viewing Products
- Products are automatically loaded from Firebase on all frontend pages
- Images are served from Cloudinary CDN
- Cart functionality remains localStorage-based

## Database Schema (Firestore)
```javascript
// products collection
{
  id: "auto-generated",
  name: "Product Name",
  price: 1000,
  category: "audio|phones|laptops|gaming|tv|accessories",
  imageUrl: "https://res.cloudinary.com/...",
  description: "Product description",
  specs: [
    { key: "Battery", value: "5000mAh" },
    { key: "Weight", value: "180g" }
  ],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Notes
- Firebase configuration is hardcoded in the files (for study purposes)
- Cloudinary upload is unsigned (public access)
- No authentication implemented
- Cart data still uses localStorage
- All Firebase operations use the compat SDK for simplicity