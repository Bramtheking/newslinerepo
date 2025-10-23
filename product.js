// --- Product dataset (kept small and in-file for demo) ---
const PRODUCTS = {
  '1': { id: '1', name: 'Wireless Earbuds', price: 6499, category: 'audio', image: 'images/wireless earbuds.png' },
  '2': { id: '2', name: 'Smart Watch', price: 14999, category: 'accessories', image: 'images/smartwatches.png' },
  '3': { id: '3', name: 'Portable Bluetooth Speaker', price: 7999, category: 'audio', image: 'images/portable audio.png' },
  '4': { id: '4', name: 'Camera Drone', price: 54999, category: 'accessories', image: 'images/drone2.png' },
  '5': { id: '5', name: 'High-Performance Laptop', price: 89999, category: 'laptops', image: 'images/freepik_assistant_1759405778781.png' },
  '6': { id: '6', name: 'Latest Smartphone', price: 39999, category: 'phones', image: 'images/freepik_assistant_1759408274503.png' },
  '7': { id: '7', name: 'Premium Headphones', price: 12499, category: 'audio', image: 'images/headphones.png' },
  '8': { id: '8', name: 'Powerbank 20,000mAh', price: 4999, category: 'accessories', image: 'images/powerbank.png' },
  '9': { id: '9', name: 'Gaming Console', price: 49999, category: 'gaming', image: 'images/gaming console.png' },
  '10': { id: '10', name: '4K Smart TV', price: 64999, category: 'tv', image: 'images/smarttv.png' }
};

// Merge admin-saved products (from localStorage) with static dataset
function getAllProducts() {
  let merged = { ...PRODUCTS };
  try {
    const admin = JSON.parse(localStorage.getItem('shopy_products_admin')) || [];
    admin.forEach(p => { merged[String(p.id)] = p; });
  } catch (e) {}
  return merged;
}

function getQueryParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

function formatKES(amount) {
  return 'KSh ' + Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 0 });
}

function populateProductPage(product) {
  const titleEl = document.querySelector('.purchase-info h2');
  const priceEl = document.querySelector('.price');
  const mainImage = document.getElementById('main-image');
  const thumbsWrap = document.querySelector('.thumbnails');
  const descEl = document.getElementById('product-description');
  const specsBody = document.getElementById('specs-body');

  if (titleEl) titleEl.textContent = product.name;
  if (priceEl) priceEl.textContent = formatKES(product.price);
  if (document) document.title = product.name + ' - Shopy';
  if (mainImage) {
    mainImage.src = product.image;
    mainImage.alt = product.name;
  }

  if (descEl) {
    descEl.textContent = product.description || '';
  }

  if (specsBody) {
    const rows = (product.specs || []).map(s => `<tr><td>${s.key}</td><td>${s.value}</td></tr>`).join('');
    specsBody.innerHTML = rows || '';
  }

  if (thumbsWrap) {
    thumbsWrap.innerHTML = `
      <img src="${product.image}" alt="${product.name} thumbnail" />
      <img src="${product.image}" alt="${product.name} thumbnail" />
      <img src="${product.image}" alt="${product.name} thumbnail" />
    `;
    // Rebind thumbnail click handlers
    thumbsWrap.querySelectorAll('img').forEach(thumb => {
      thumb.addEventListener('click', () => {
        if (mainImage) mainImage.src = thumb.src;
      });
    });
  }
}

// Cart + Buy Now + Wishlist
document.addEventListener('DOMContentLoaded', () => {
  // Resolve product by id
  const id = getQueryParam('id') || '1';
  const product = getAllProducts()[id];
  if (product) {
    populateProductPage(product);
  }
  // Add to cart functionality
  const addToCartBtn = document.querySelector('.add-to-cart');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      // Get product details from the page
      const productName = document.querySelector('.purchase-info h2').textContent;
      const priceText = document.querySelector('.price').textContent;
      const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
      const image = mainImage ? mainImage.src : '';
      
      // Add to cart using the main script's functions
      if (typeof getCart === 'function') {
        let cart = getCart();
        const existingItem = cart.find(item => item.name === productName);
        
        if (existingItem) {
          existingItem.quantity = Number(existingItem.quantity) + 1;
        } else {
          cart.push({
            id: Date.now().toString(),
            name: productName,
            price: price,
            image: image,
            quantity: 1
          });
        }
        
        saveCart(cart);
        showToast(`${productName} added to cart!`, 'success');
      } else {
        alert('✅ Product added to cart!');
      }
    });
  }

  // Buy now functionality
  const buyNowBtn = document.querySelector('.buy-now');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      // Add to cart first, then redirect to checkout
      if (addToCartBtn) {
        addToCartBtn.click();
        setTimeout(() => {
          window.location.href = 'checkout.html';
        }, 1000);
      }
    });
  }

  // Wishlist functionality
  const wishlistBtn = document.querySelector('.wishlist');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      const productName = document.querySelector('.purchase-info h2').textContent;
      
      // Simple wishlist using localStorage
      let wishlist = JSON.parse(localStorage.getItem('shopy_wishlist')) || [];
      const existingItem = wishlist.find(item => item.name === productName);
      
      if (!existingItem) {
        wishlist.push({
          id: Date.now().toString(),
          name: productName,
          price: parseFloat(document.querySelector('.price').textContent.replace(/[^0-9.]/g, '')) || 0,
          image: mainImage ? mainImage.src : '',
          dateAdded: new Date().toISOString()
        });
        localStorage.setItem('shopy_wishlist', JSON.stringify(wishlist));
        
        // Update button appearance
        wishlistBtn.innerHTML = '<i class="fa-solid fa-heart"></i> Added to Wishlist';
        wishlistBtn.style.background = '#ff6600';
        wishlistBtn.style.color = '#fff';
        
        if (typeof showToast === 'function') {
          showToast('❤️ Added to wishlist!', 'success');
        } else {
          alert('❤️ Added to wishlist!');
        }
      } else {
        if (typeof showToast === 'function') {
          showToast('Item already in wishlist!', 'info');
        } else {
          alert('Item already in wishlist!');
        }
      }
    });
  }
});

// Populate similar products based on current product category
document.addEventListener('DOMContentLoaded', () => {
  const id = getQueryParam('id') || '1';
  const all = getAllProducts();
  const current = all[id];
  const grid = document.getElementById('similar-products');
  if (!grid || !current) return;

  const candidates = Object.values(all)
    .filter(p => p.category === current.category && p.id !== current.id)
    .slice(0, 3);

  grid.innerHTML = candidates.map(p => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}" loading="lazy" />
      <h4>${p.name}</h4>
      <p>${formatKES(p.price)}</p>
      <a href="product.html?id=${p.id}" class="btn">View</a>
    </div>
  `).join('');
});
