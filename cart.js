// Get cart items from localStorage
let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];

// Get elements to display order items and total
const orderList = document.getElementById("order-list");
const orderTotal = document.getElementById("order-total");

// Show the order items and total cost
function renderOrder() {
    orderList.innerHTML = "";
    let total = 0;

    // If there are no items, show a message
    if (cartItems.length === 0) {
        orderList.innerHTML = "<li>Your cart is empty</li>";
        orderTotal.textContent = "Total: KSHS 0";
        return;
    }

    // Loop through each item and add it to the list
    cartItems.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `${item.name} <span>KSHS ${item.price}</span>`;
        orderList.appendChild(li);
        total += item.price;
    });

    // Display the total cost
    orderTotal.textContent = `Total: KSHS ${total}`;
}

renderOrder();

// Get the checkout form element
const checkoutForm = document.getElementById("checkoutForm");

// When the form is submitted, handle the checkout process
checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(checkoutForm);
    const name = formData.get("name");
    const email = formData.get("email");
    const address = formData.get("address");
    const phone = formData.get("phone");
    const payment = formData.get("payment");

    // Check if all fields are filled
    if (!name || !email || !address || !phone || !payment) {
        alert("Please fill in all fields");
        return;
    }

    // Show a confirmation message
    alert(`✅ Order placed successfully!\n\nThank you, ${name}. Your total is ${orderTotal.textContent}.`);

    // Remove items from the cart
    localStorage.removeItem("cartItems");
    cartItems = [];
    renderOrder();
    checkoutForm.reset();
});