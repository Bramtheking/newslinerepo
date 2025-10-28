// script.js for Shopa: cart (localStorage), search, toasts, and cart page rendering

// Key used for storing cart data in localStorage (brand-normalized)
const CART_KEY = 'shopy_cart';

/**
 * Retrieves the current cart from localStorage.
 * @returns {Array} Array of cart items.
 */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

/**
 * Saves the cart array to localStorage and updates the cart count in the UI.
 * @param {Array} cart - Array of cart items.
 */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCountUI();
}

/**
 * Updates the cart count display in the UI.
 */
function updateCartCountUI() {
  const countEl = document.getElementById('cart-count');
  if (!countEl) return;
  const cart = getCart();
  const totalQty = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  countEl.textContent = totalQty;
}

/**
 * Displays a toast notification.
 * @param {string} message - The message to display.
 * @param {string} [type='success'] - The type of toast ('success', 'error', or 'info').
 */
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
      if (container.childElementCount === 0 && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }, 300);
  }, 3000);
}

/**
 * Initializes event listeners and UI updates when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  updateCartCountUI();

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuToggle && navLinks) {
    mobileMenuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileMenuToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('show');
      }
    });
  }

  // Enhanced dropdown functionality
  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    const dropdownMenu = dropdown.querySelector('.dropdown-menu');
    const dropdownLink = dropdown.querySelector('a');

    // ARIA setup for accessibility
    if (dropdownLink) {
      dropdownLink.setAttribute('aria-haspopup', 'true');
      dropdownLink.setAttribute('aria-expanded', 'false');
      dropdownLink.setAttribute('role', 'button');
    }
    
    // Add click functionality for mobile
    dropdownLink.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const willOpen = dropdownMenu.style.display !== 'block';
        dropdownMenu.style.display = willOpen ? 'block' : 'none';
        if (dropdownLink) dropdownLink.setAttribute('aria-expanded', String(willOpen));
      }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        dropdownMenu.style.display = 'none';
        if (dropdownLink) dropdownLink.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Add hover effects for desktop
  if (window.innerWidth > 768) {
    dropdowns.forEach(dropdown => {
      const dropdownMenu = dropdown.querySelector('.dropdown-menu');
      
      dropdown.addEventListener('mouseenter', () => {
        dropdownMenu.style.display = 'block';
        const link = dropdown.querySelector('a');
        if (link) link.setAttribute('aria-expanded', 'true');
      });
      
      dropdown.addEventListener('mouseleave', () => {
        dropdownMenu.style.display = 'none';
        const link = dropdown.querySelector('a');
        if (link) link.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Set up "Add to Cart" button handlers for products.
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

      showToast(`${name} added to cart`, 'success');
    });
  });

  // Search functionality
  const searchBar = document.getElementById('searchBar');
  if (searchBar) {
    const products = Array.from(document.querySelectorAll('.product'));
    searchBar.addEventListener('input', () => {
      const q = searchBar.value.trim().toLowerCase();
      products.forEach(p => {
        const name = (p.dataset.name || p.querySelector('h3').textContent).toLowerCase();
        p.style.display = name.includes(q) ? '' : 'none';
      });
    });
  }

  if (document.getElementById('cartItems')) {
    renderCartPage();
  }
});
// ===== Theme Toggle =====
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

// Check saved theme in localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-theme');
  themeIcon.classList.replace('fa-sun', 'fa-moon');
}

// When user clicks toggle
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');

  if (document.body.classList.contains('dark-theme')) {
    themeIcon.classList.replace('fa-sun', 'fa-moon');
    localStorage.setItem('theme', 'dark');
  } else {
    themeIcon.classList.replace('fa-moon', 'fa-sun');
    localStorage.setItem('theme', 'light');
  }
});


/**
 * Renders the cart page including items list, quantities, subtotals, and overall total.
 */
function renderCartPage() {
  const container = document.getElementById('cartItems');
  if (!container) return;
  const cart = getCart();
  container.innerHTML = '';

  if (cart.length === 0) {
    container.innerHTML = `
      <p class="empty">Your cart is empty. <a href="index.html">Continue shopping</a></p>
    `;
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = '0.00';
    return;
  }

  const table = document.createElement('table');
  table.className = 'cart-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Product</th>
        <th>Price</th>
        <th>Quantity</th>
        <th>Subtotal</th>
        <th></th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  cart.forEach(item => {
    const tr = document.createElement('tr');
    const subtotal = (Number(item.price) * Number(item.quantity)).toLocaleString('en-KE', { minimumFractionDigits: 2 });
    tr.innerHTML = `
      <td class="prod">
        <img src="${item.image}" alt="${item.name}">
        <div class="prod-info"><strong>${item.name}</strong></div>
      </td>
      <td>KSh ${Number(item.price).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
      <td>
        <input type="number" min="1" class="qty" data-id="${item.id}" value="${item.quantity}">
      </td>
      <td class="subtotal">KSh ${subtotal}</td>
      <td><button class="remove" data-id="${item.id}">Remove</button></td>
    `;
    tbody.appendChild(tr);
  });

  container.appendChild(table);
  updateCartTotal();

  // Quantity change
  container.querySelectorAll('.qty').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      let qty = parseInt(e.target.value) || 1;
      if (qty < 1) qty = 1;
      const cart = getCart();
      const item = cart.find(it => it.id === id);
      if (item) {
        item.quantity = qty;
        saveCart(cart);
        const row = e.target.closest('tr');
        const subtotalCell = row.querySelector('.subtotal');
        subtotalCell.textContent = `KSh ${(Number(item.price) * Number(item.quantity)).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
        updateCartTotal();
      }
    });
  });

  // Remove item
  container.querySelectorAll('.remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      let cart = getCart();
      cart = cart.filter(it => it.id !== id);
      saveCart(cart);
      showToast('Removed item from cart', 'info');
      renderCartPage();
    });
  });

  // Checkout
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const cart = getCart();
      if (cart.length === 0) {
        showToast('Cart is empty', 'error');
        return;
      }
      localStorage.removeItem(CART_KEY);
      updateCartCountUI();
      renderCartPage();
      showToast('Order placed! Thank you 🎉', 'success');
    });
  }
}

/**
 * Calculates the total price of items in the cart and updates the UI.
 */
function updateCartTotal() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = total.toLocaleString('en-KE', { minimumFractionDigits: 2 });
}

// Category filter
const categoryLinks = document.querySelectorAll(".sidebar ul li a");
const products = document.querySelectorAll(".product");

categoryLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    categoryLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    const category = link.getAttribute("data-category");

    products.forEach(product => {
      if (category === "all" || product.dataset.category === category) {
        product.style.display = "block";
      } else {
        product.style.display = "none";
      }
    });
  });
});

// Price filter
const priceRange = document.getElementById("price-range");
const priceValue = document.getElementById("price-value");

if (priceRange) {
  priceRange.addEventListener("input", () => {
    let maxPrice = parseInt(priceRange.value);
    priceValue.textContent = "KSh " + maxPrice.toLocaleString('en-KE');

    products.forEach(product => {
      let price = parseInt(product.dataset.price);
      if (price <= maxPrice) {
        product.style.display = "block";
      } else {
        product.style.display = "none";
      }
    });
  });
}

// Search filter
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");

function filterProducts() {
  const searchText = searchInput.value.toLowerCase();

  products.forEach(product => {
    const name = product.querySelector("h3").textContent.toLowerCase();
    if (name.includes(searchText)) {
      product.style.display = "block";
    } else {
      product.style.display = "none";
    }
  });
}

searchInput.addEventListener("keyup", filterProducts);

if (searchBtn) {
  searchBtn.addEventListener("click", filterProducts);
}
