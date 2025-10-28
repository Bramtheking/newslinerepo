// Firebase products loader for frontend pages
// This file handles loading products from Firebase for display on shop pages

// Firebase will be initialized by firebase-config.js
// Access the global instance
let db;

// Load products from Firebase
async function loadProductsFromFirebase() {
  try {
    const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error loading products from Firebase:', error);
    return [];
  }
}

// Load single product by ID
async function loadProductById(productId) {
  try {
    const doc = await db.collection('products').doc(productId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error loading product:', error);
    return null;
  }
}

// Render products in the shop page
async function renderShopProducts() {
  const productsContainer = document.querySelector('.products-grid');
  if (!productsContainer) return;

  try {
    // Show loading state
    productsContainer.innerHTML = '<div style="text-align: center; padding: 40px;">Loading products...</div>';

    const products = await loadProductsFromFirebase();

    if (products.length === 0) {
      productsContainer.innerHTML = '<div style="text-align: center; padding: 40px;">No products available</div>';
      return;
    }

    productsContainer.innerHTML = products.map(product => `
      <div class="product" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-category="${product.category}">
        <img src="${product.imageUrl || product.image || ''}" alt="${product.name}" loading="lazy">
        <h3>${product.name}</h3>
        <p>KSh ${Number(product.price).toLocaleString('en-KE')}</p>
        <button class="btn add-to-cart">Add to Cart</button>
      </div>
    `).join('');

    // Re-initialize add to cart functionality
    initializeAddToCartButtons();

  } catch (error) {
    console.error('Error rendering products:', error);
    productsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: red;">Error loading products</div>';
  }
}

// Initialize add to cart buttons after products are loaded
function initializeAddToCartButtons() {
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productEl = e.target.closest('.product');
      if (!productEl) return;

      const id = productEl.dataset.id || productEl.dataset.name;
      const name = productEl.dataset.name || productEl.querySelector('h3').textContent;
      const priceRaw = productEl.dataset.price || productEl.querySelector('p').textContent;
      const price = parseFloat(String(priceRaw).replace(/[^0-9.]/g, '')) || 0;
      const img = productEl.querySelector('img') ? productEl.querySelector('img').getAttribute('src') : '';

      let cart = getCart();
      const existing = cart.find(item => item.id === id);
      if (existing) {
        existing.quantity = Number(existing.quantity) + 1;
      } else {
        cart.push({ id, name, price, image: img, quantity: 1 });
      }
      saveCart(cart);

      if (typeof showToast === 'function') {
        showToast(`${name} added to cart`, 'success');
      }
    });
  });
}

// Render featured products on index page
async function renderFeaturedProducts() {
  const productsContainer = document.querySelector('.product-grid');
  if (!productsContainer) return;

  try {
    const products = await loadProductsFromFirebase();

    // Show only first 6 products as featured
    const featuredProducts = products.slice(0, 6);

    if (featuredProducts.length === 0) {
      productsContainer.innerHTML = '<div style="text-align: center; padding: 40px;">No featured products available</div>';
      return;
    }

    productsContainer.innerHTML = featuredProducts.map(product => `
      <div class="product" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-category="${product.category}">
        <img src="${product.imageUrl || product.image || ''}" alt="${product.name}" loading="lazy">
        <h3>${product.name}</h3>
        <p>KSh ${Number(product.price).toLocaleString('en-KE')}</p>
        <button class="btn add-to-cart">Add to Cart</button>
      </div>
    `).join('');

    // Re-initialize add to cart functionality
    initializeAddToCartButtons();

  } catch (error) {
    console.error('Error rendering featured products:', error);
    productsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: red;">Error loading featured products</div>';
  }
}

// Initialize Firebase reference
function initializeFirebaseProducts() {
  if (window.firebaseDb) {
    db = window.firebaseDb;
    return true;
  }
  return false;
}

// Load products when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Firebase first
  if (!initializeFirebaseProducts()) {
    setTimeout(() => {
      if (!initializeFirebaseProducts()) {
        console.error('Failed to initialize Firebase for products');
        return;
      }
      loadProductsBasedOnPage();
    }, 500);
  } else {
    loadProductsBasedOnPage();
  }
});

function loadProductsBasedOnPage() {
  // Load products based on which page we're on
  if (document.querySelector('.products-grid')) {
    renderShopProducts();
  } else if (document.querySelector('.product-grid')) {
    renderFeaturedProducts();
  }
}