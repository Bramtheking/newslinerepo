// Load products from Firebase
async function getAllProducts() {
  try {
    const snapshot = await window.firebaseDb.collection('products').get();
    const products = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      products[doc.id] = { id: doc.id, ...data };
    });
    return products;
  } catch (error) {
    console.error('Error loading products:', error);
    return {};
  }
}

// Load single product from Firebase
async function getProductById(productId) {
  try {
    const doc = await window.firebaseDb.collection('products').doc(productId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error loading product:', error);
    return null;
  }
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
  
  const imageUrl = product.imageUrl || product.image || '';
  if (mainImage) {
    mainImage.src = imageUrl;
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
      <img src="${imageUrl}" alt="${product.name} thumbnail" />
      <img src="${imageUrl}" alt="${product.name} thumbnail" />
      <img src="${imageUrl}" alt="${product.name} thumbnail" />
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
document.addEventListener('DOMContentLoaded', async () => {
  // Resolve product by id
  const id = getQueryParam('id');
  if (!id) {
    document.body.innerHTML = '<div style="text-align: center; padding: 40px;">Product not found</div>';
    return;
  }
  
  try {
    const product = await getProductById(id);
    if (product) {
      populateProductPage(product);
    } else {
      document.body.innerHTML = '<div style="text-align: center; padding: 40px;">Product not found</div>';
      return;
    }
  } catch (error) {
    console.error('Error loading product:', error);
    document.body.innerHTML = '<div style="text-align: center; padding: 40px; color: red;">Error loading product</div>';
    return;
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
document.addEventListener('DOMContentLoaded', async () => {
  const id = getQueryParam('id');
  if (!id) return;
  
  try {
    const current = await getProductById(id);
    const grid = document.getElementById('similar-products');
    if (!grid || !current) return;

    const all = await getAllProducts();
    const candidates = Object.values(all)
      .filter(p => p.category === current.category && p.id !== current.id)
      .slice(0, 3);

    grid.innerHTML = candidates.map(p => `
      <div class="product-card">
        <img src="${p.imageUrl || p.image || ''}" alt="${p.name}" loading="lazy" />
        <h4>${p.name}</h4>
        <p>${formatKES(p.price)}</p>
        <a href="product.html?id=${p.id}" class="btn">View</a>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading similar products:', error);
  }
});
