/* ===========================
   Complete site script.js
   - Signup / Login (Backend API)
   - Edit Profile
   - User menu
   - Location dropdown
   - Basic Cart system (localStorage)
   - Smooth scroll + helpers
   =========================== */

const API_URL = "http://localhost:5002/api";

/* ---------- Utilities ---------- */
function qs(sel) { return document.querySelector(sel); }
function qsAll(sel) { return Array.from(document.querySelectorAll(sel)); }

/* ---------- Validation Helpers ---------- */
function validatePhone(phone) {
  // 10 digits, optional +91 or 0
  const re = /^(?:\+91|0)?[6-9]\d{9}$/;
  return re.test(phone);
}

function validatePassword(password) {
  // Min 8 chars, at least 1 number, 1 special char
  const re = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
  return re.test(password);
}

/* ---------- Session Management ---------- */
function getUserId() {
  return sessionStorage.getItem("userId");
}

function getSessionToken() {
  return sessionStorage.getItem("sessionToken");
}

function isLoggedIn() {
  return !!getSessionToken() && !!getUserId();
}

function clearSession() {
  sessionStorage.removeItem("userId");
  sessionStorage.removeItem("sessionToken");
  sessionStorage.removeItem("userName");
  sessionStorage.removeItem("userEmail");
}

/* ---------- Location Dropdown ---------- */
async function setLocation(city) {
  const el = document.getElementById("selected-location");
  if (el) el.innerText = city;

  const userId = getUserId();
  if (!userId) {
    // Guest user - store temporarily in sessionStorage
    sessionStorage.setItem("guestLocation", city);
    return;
  }

  try {
    await fetch(`${API_URL}/preferences/location`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, location: city })
    });
  } catch (err) {
    console.error("Error saving location:", err);
  }
}

async function loadUserLocation() {
  const userId = getUserId();
  if (!userId) {
    const guestLoc = sessionStorage.getItem("guestLocation");
    if (guestLoc) {
      const el = document.getElementById("selected-location");
      if (el) el.innerText = guestLoc;
    }
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/user/${userId}`);
    const user = await res.json();
    if (user.selectedLocation && user.selectedLocation !== 'Select Location') {
      const el = document.getElementById("selected-location");
      if (el) el.innerText = user.selectedLocation;
    }
  } catch (err) {
    console.error("Error loading location:", err);
  }
}



/* ---------- ACCOUNT: Signup & Login ---------- */

async function createAccount() {
  const name = (document.getElementById("signupName") || {}).value.trim() || "";
  const email = (document.getElementById("signupEmail") || {}).value.trim() || "";
  const phone = (document.getElementById("signupPhone") || {}).value.trim() || "";
  const password = (document.getElementById("signupPassword") || {}).value.trim() || "";

  if (!name || !email || !phone || !password) {
    alert("Please fill all fields to create an account.");
    return;
  }


  if (!validatePhone(phone)) {
    alert("Invalid Phone Number! Please enter a valid 10-digit mobile number.");
    return;
  }

  if (!validatePassword(password)) {
    alert("Weak Password! Must be at least 8 chars long with 1 number and 1 special character.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password })
    });
    const data = await res.json();

    if (res.ok) {
      alert("Account created successfully! Please login.");
      // Clear form
      document.getElementById("signupName").value = "";
      document.getElementById("signupEmail").value = "";
      document.getElementById("signupPhone").value = "";
      document.getElementById("signupPassword").value = "";

      if (document.getElementById("loginForm") && document.getElementById("signupForm")) {
        document.getElementById("signupForm").style.display = "none";
        document.getElementById("loginForm").style.display = "block";
      }
    } else {
      alert(data.message || "Signup failed");
    }
  } catch (err) {
    alert("Error connecting to server");
  }
}

async function loginUser() {
  const email = (document.getElementById("loginEmail") || {}).value.trim() || "";
  const password = (document.getElementById("loginPassword") || {}).value.trim() || "";

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      // Store session data
      sessionStorage.setItem("sessionToken", data.sessionToken);
      sessionStorage.setItem("userId", data.userId);
      sessionStorage.setItem("userName", data.userName);
      sessionStorage.setItem("userEmail", data.userEmail);

      alert("Login successful!");
      window.location.href = "index.html";
    } else {
      alert(data.message || "Login failed");
    }
  } catch (err) {
    alert("Error connecting to server");
  }
}

/* ---------- USER MENU & PROFILE helpers ---------- */

async function refreshUserMenu() {
  const userMenuEl = document.getElementById("userMenu");
  const loginLinkEl = document.getElementById("navLoginLink");

  if (!isLoggedIn()) {
    if (userMenuEl) userMenuEl.style.display = "none";
    if (loginLinkEl) loginLinkEl.style.display = "block";
    return;
  }

  // User is logged in
  if (loginLinkEl) loginLinkEl.style.display = "none";


  const userId = getUserId();

  // Fetch fresh data from backend
  const res = await fetch(`${API_URL}/auth/user/${userId}`);
  const user = await res.json();

  const name = user.name || "User";
  const email = user.email || "";
  const initial = name.trim().charAt(0).toUpperCase();

  // Update session
  sessionStorage.setItem("userName", name);
  sessionStorage.setItem("userEmail", email);

  const menuUserName = document.getElementById("menuUserName");
  const menuUserEmail = document.getElementById("menuUserEmail");
  const navAvatar = document.getElementById("navAvatar");
  const menuAvatar = document.getElementById("menuAvatar");

  if (menuUserName) menuUserName.innerText = name;
  if (menuUserEmail) menuUserEmail.innerText = email;
  if (navAvatar) navAvatar.innerText = initial;
  if (menuAvatar) menuAvatar.innerText = initial;
  if (userMenuEl) userMenuEl.style.display = "block";

  try {
    if (window.location.pathname.includes("profile.html")) {
      populateProfilePage();
    }
  } catch (e) { /* ignore */ }
}

function logoutUser() {
  if (!confirm("Do you want to logout?")) return;
  clearSession();
  refreshUserMenu();
  refreshCartBadge();
  window.location.href = "login.html";
}

/* ---------- Edit Profile Modal handlers ---------- */

async function openEditProfileModal() {
  const userId = sessionStorage.getItem("userId");
  if (!userId) {
    alert("You are not logged in");
    return;
  }

  try {
    // Fetch fresh backend user data
    const res = await fetch(`${API_URL}/auth/user/${userId}`);
    const user = await res.json();

    if (!res.ok || !user || !user.name) {
      console.error("Failed to load user:", user);
      return; // REMOVE alert popup
    }

    // Fill modal fields
    document.getElementById("editName").value = user.name || "";
    document.getElementById("editEmail").value = user.email || "";
    document.getElementById("editPhone").value = user.phone || "";
    document.getElementById("editPassword").value = "********";



  } catch (err) {
    console.error("Error fetching edit profile data:", err);
    // NO alert here – avoid showing popup
  }
}



async function saveProfileEdits() {
  const userId = getUserId();
  if (!userId) return alert("Please login first.");

  const name = (document.getElementById("editName") || {}).value.trim();
  const email = (document.getElementById("editEmail") || {}).value.trim();
  const phone = (document.getElementById("editPhone") || {}).value.trim();
  const password = (document.getElementById("editPassword") || {}).value.trim();

  if (!name || !email) {
    alert("Name and email are required.");
    return;
  }

  const currentEmail = sessionStorage.getItem("userEmail");
  if (currentEmail && email !== currentEmail) {
    if (!confirm("Changing your email will require you to login again. Continue?")) {
      return;
    }
  }

  try {
    const res = await fetch(`${API_URL}/auth/update-profile/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        password: password === "********" ? undefined : password
      })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Failed to update profile");
      return;
    }

    // Update UI + session
    sessionStorage.setItem("userName", data.user.name);
    sessionStorage.setItem("userEmail", data.user.email);

    alert("Profile updated successfully!");

    refreshUserMenu();
    populateProfilePage();

    if (window.jQuery) $("#editProfileModal").modal("hide");

    // If email changed → force logout
    if (currentEmail && email !== currentEmail) {
      alert("Please login again using your updated email.");
      logoutUser();
    }

  } catch (err) {
    console.error(err);
    alert("Error connecting to server");
  }
}


/* ---------- Profile page population ---------- */
async function populateProfilePage() {
  const userId = getUserId();
  if (!userId) {
    alert("You are not logged in");
    window.location.href = "login.html";
    return;
  }

  /* --- Load User Details --- */
  try {
    const res = await fetch(`${API_URL}/auth/user/${userId}`);
    const user = await res.json();

    if (!res.ok) {
      console.error("Error fetching user:", user);
      return;
    }

    const name = user.name || "User";
    const email = user.email || "Not provided";
    const phone = user.phone || "Not provided";
    const initial = name.charAt(0).toUpperCase();

    // Update UI
    if (document.getElementById("profileAvatar"))
      document.getElementById("profileAvatar").innerText = initial;

    if (document.getElementById("profileName"))
      document.getElementById("profileName").innerText = name;

    if (document.getElementById("profileEmail"))
      document.getElementById("profileEmail").innerText = email;

    if (document.getElementById("profilePhone"))
      document.getElementById("profilePhone").innerText = "📞 " + phone;

    if (document.getElementById("detailName"))
      document.getElementById("detailName").innerText = name;

    if (document.getElementById("detailEmail"))
      document.getElementById("detailEmail").innerText = email;

    if (document.getElementById("detailPhone"))
      document.getElementById("detailPhone").innerText = phone;

  } catch (err) {
    console.error("Error loading profile data:", err);
  }

  /* --- Load Orders --- */
  const ordersContainer = document.getElementById("ordersContainer");
  if (!ordersContainer) return;

  try {
    const res = await fetch(`${API_URL}/orders/${userId}`);
    const orders = await res.json();

    if (!res.ok || !orders.length) {
      ordersContainer.innerHTML = "<p>No orders found.</p>";
      return;
    }

    let html = '<div class="list-group">';
    orders.forEach(order => {
      const date = new Date(order.date).toLocaleDateString();
      html += `
        <div class="list-group-item">
          <h4 class="list-group-item-heading">
            Order #${order._id.slice(-6)}
            <small class="pull-right">${date}</small>
          </h4>
          <p class="list-group-item-text">
            <strong>Items:</strong> ${order.items.length} |
            <strong>Total:</strong> ₹${order.total}
          </p>
        </div>`;
    });

    html += '</div>';
    ordersContainer.innerHTML = html;

  } catch (err) {
    console.error("Order Load Error:", err);
    ordersContainer.innerHTML = "<p>Error loading orders.</p>";
  }
}

/* ---------- Database-Backed Cart System ---------- */

async function _fetchCart() {
  const userId = getUserId();
  if (!userId) return [];

  try {
    const res = await fetch(`${API_URL}/cart/${userId}`);
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error("Error fetching cart:", err);
    return [];
  }
}

async function addToCart(name, price, img) {
  console.log("addToCart called:", { name, price, img });

  const userId = getUserId();
  if (!userId) {
    alert("Please login to add items to cart");
    window.location.href = "login.html";
    return;
  }

  try {
    const payload = {
      userId: userId,
      productId: "p" + Date.now(),
      name,
      price: Number(price),
      img
    };
    console.log("Sending to API:", payload);

    const res = await fetch(`${API_URL}/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);

    if (res.ok) {
      alert(name + " added to cart!");
      await refreshCartBadge();
    } else {
      alert(data.message || "Failed to add to cart");
    }
  } catch (err) {
    console.error("Error in addToCart:", err);
    alert("Error connecting to server: " + err.message);
  }
}

async function removeFromCart(productId) {
  const userId = getUserId();
  if (!userId) return;

  try {
    const res = await fetch(`${API_URL}/cart/remove`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId })
    });

    if (res.ok) {
      await renderCartPage();
      await refreshCartBadge();
    }
  } catch (err) {
    console.error("Error removing from cart:", err);
  }
}

async function changeQty(productId, qty) {
  const userId = getUserId();
  if (!userId) return;

  try {
    const res = await fetch(`${API_URL}/cart/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId, qty: Number(qty) })
    });

    if (res.ok) {
      await renderCartPage();
      await refreshCartBadge();
    }
  } catch (err) {
    console.error("Error updating quantity:", err);
  }
}

async function getCartTotal() {
  const cart = await _fetchCart();
  return cart.reduce((sum, i) => sum + (i.price * (i.qty || 1)), 0);
}

async function renderCartPage() {
  const container = document.getElementById("cartContainer");
  if (!container) return;

  const cart = await _fetchCart();

  if (!cart.length) {
    container.innerHTML = `<h3>Your cart is empty.</h3>`;
    return;
  }

  let html = `
  <table class="table table-bordered">
      <thead>
          <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Subtotal</th>
              <th>Remove</th>
          </tr>
      </thead>
      <tbody>
  `;

  cart.forEach((item) => {
    html += `
      <tr>
          <td><img src="${item.img}" width="70"></td>
          <td>${item.name}</td>
          <td>₹${item.price}</td>
          <td>
              <button onclick="decreaseQty('${item.productId}')">-</button>
              ${item.qty}
              <button onclick="increaseQty('${item.productId}')">+</button>
          </td>
          <td>₹${item.price * item.qty}</td>
          <td>
              <button class="btn btn-danger btn-sm" onclick="removeItem('${item.productId}')">X</button>
          </td>
      </tr>`;
  });

  html += `
      </tbody>
  </table>

  <h3>Total: ₹${cart.reduce((t, i) => t + i.price * i.qty, 0)}</h3>
  `;

  container.innerHTML = html;
}

async function increaseQty(productId) {
  const cart = await _fetchCart();
  const item = cart.find(i => i.productId === productId);
  if (item) {
    await changeQty(productId, item.qty + 1);
  }
}

async function decreaseQty(productId) {
  const cart = await _fetchCart();
  const item = cart.find(i => i.productId === productId);
  if (item && item.qty > 1) {
    await changeQty(productId, item.qty - 1);
  }
}

async function removeItem(productId) {
  await removeFromCart(productId);
}
// //  updated
async function checkout() {
  const userId = getUserId();
  if (!userId) {
    alert("Please login to checkout.");
    return window.location.href = "login.html";
  }

  try {
    const res = await fetch(`${API_URL}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        address: JSON.parse(localStorage.getItem("selectedAddress")) || null
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Checkout failed.");
      return;
    }

    // Redirect with orderId
    window.location.href = "order-success.html?orderId=" + data.orderId;

  } catch (err) {
    console.error("Checkout error:", err);
    alert("Server error");
  }
}


async function refreshCartBadge() {
  const cart = await _fetchCart();
  const count = cart.reduce((s, i) => s + (i.qty || 1), 0);
  const badge = document.getElementById("cartBadge");
  if (badge) badge.innerText = count || "";
}

/* ---------- Initialization ---------- */
document.addEventListener("DOMContentLoaded", function () {
  // Initial checks
  refreshUserMenu();
  refreshCartBadge();

  // If we are on the cart page, render it
  if (document.getElementById("cartContainer")) {
    renderCartPage();
  }

  // Event Listeners
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) loginBtn.addEventListener("click", function (e) { e.preventDefault(); loginUser(); });

  const createBtn = document.getElementById("createAccountBtn");
  if (createBtn) createBtn.addEventListener("click", function (e) { e.preventDefault(); createAccount(); });

  const editForm = document.getElementById("editProfileForm");
  if (editForm) editForm.addEventListener("submit", function (e) {
    e.preventDefault();
    saveProfileEdits();
  });

  // jQuery specific handlers
  if (window.jQuery) {
    $('#editProfileModal').on('show.bs.modal', function () {
      openEditProfileModal();
    });
  }
});

/* ---------- BUY NOW (Single Product Checkout) ---------- */
/* BUY NOW from Product Page */
function buyNow(name, price, img) {
  const userId = getUserId();
  if (!userId) {
    alert("Please login");
    window.location.href = "login.html";
    return;
  }

  localStorage.setItem("checkoutMode", "single");
  localStorage.setItem("checkoutSingle", JSON.stringify({
    name,
    price,
    img,
    qty: 1
  }));

  window.location.href = "checkout.html";
}

/* BUY NOW from Cart Page */
function buyNowItem(productId) {
  // we are buying from CART, so ignore any previous product-page Buy Now
  localStorage.setItem("checkoutMode", "single");
  localStorage.removeItem("checkoutSingle");          // 👈 important
  localStorage.setItem("checkoutSingleProductId", productId);

  window.location.href = "checkout.html";
}


/* BUY ALL from Cart Page */
function buyNowAll() {
  localStorage.setItem("checkoutMode", "cart");
  localStorage.removeItem("checkoutSingle");
  localStorage.removeItem("checkoutSingleProductId");
  window.location.href = "checkout.html";
}

/* CHECKOUT PAGE LOADER */
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.location.pathname.includes("checkout.html")) return;

  const userId = getUserId();
  const mode = localStorage.getItem("checkoutMode");
  const orderBox = document.getElementById("orderDetails");
  const totalBox = document.getElementById("grandTotal");

  console.log("Checkout mode:", mode);

  if (mode === "single") {
    let item = JSON.parse(localStorage.getItem("checkoutSingle"));
    if (!item) {
      const pid = localStorage.getItem("checkoutSingleProductId");
      const res = await fetch(`${API_URL}/cart/${userId}`);
      const data = await res.json();
      item = data.items.find(i => i.productId === pid);
    }

    if (!item) return orderBox.innerHTML = `<p>No product selected.</p>`;

    const subtotal = item.price * (item.qty || 1);
    orderBox.innerHTML = `
            <div class="item-row">
                <img src="${item.img}">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p>₹${item.price} × ${item.qty || 1} = ₹${subtotal}</p>
                </div>
            </div>`;
    totalBox.innerText = "₹" + subtotal;
    return;
  }

  if (mode === "cart") {
    const res = await fetch(`${API_URL}/cart/${userId}`);
    const data = await res.json();
    const cart = data.items;

    let html = "";
    let total = 0;

    cart.forEach(item => {
      const qty = item.qty || 1;
      const subtotal = item.price * qty;
      html += `
            <div class="item-row">
                <img src="${item.img}">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p>₹${item.price} × ${qty} = ₹${subtotal}</p>
                </div>
            </div>`;
      total += subtotal;
    });

    orderBox.innerHTML = html;
    totalBox.innerText = "₹" + total;
  }

  // Calculate Delivery Date (current date + 3 days)
  const today = new Date();
  today.setDate(today.getDate() + 3);
  const dateStr = today.toDateString();

  const deliveryEl = document.getElementById("deliveryDate");
  if (deliveryEl) {
    deliveryEl.innerText = "Expected Delivery: " + dateStr;
    deliveryEl.setAttribute("data-date", dateStr);
  }
});
/* ===== PLACE ORDER FUNCTION ===== */
async function placeOrder() {
  const userId = getUserId();
  if (!userId) return alert("Login first!");

  const fullName = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const state = document.getElementById("state").value.trim();
  const district = document.getElementById("district").value.trim();
  const city = document.getElementById("city").value.trim();
  const street = document.getElementById("street").value.trim();
  const pincode = document.getElementById("pincode").value.trim();

  if (!fullName || !phone || !state || !district || !city || !street || !pincode) {
    return alert("Please fill all delivery details!");
  }

  if (!validatePhone(phone)) {
    return alert("Invalid Phone Number provided in delivery address!");
  }

  if (pincode.length !== 6 || isNaN(pincode)) {
    return alert("Invalid Pincode! Must be 6 digits.");
  }

  const mode = localStorage.getItem("checkoutMode");
  let items = [];

  // 1. Try to get items from Backend Cart first
  const resCart = await fetch(`${API_URL}/cart/${userId}`);
  const cartData = await resCart.json();

  if (mode === "single") {
    // CASE A: Buy Now from Cart (passed via Product ID)
    const pid = localStorage.getItem("checkoutSingleProductId");
    if (pid) {
      items = cartData.items.filter(i => i.productId === pid);
    }

    // CASE B: Buy Now from Product Page (passed via localStorage JSON)
    if (!items.length) {
      const storedItem = localStorage.getItem("checkoutSingle");
      if (storedItem) {
        try {
          const parsed = JSON.parse(storedItem);
          // Construct a valid item object for backend
          items = [{
            productId: "direct_" + Date.now(), // direct buy, no permanent cart ID
            name: parsed.name,
            price: parsed.price,
            img: parsed.img,
            qty: parsed.qty || 1
          }];
        } catch (e) {
          console.error("Error parsing checkoutSingle", e);
        }
      }
    }
  } else {
    items = cartData.items; // Full cart buy
  }

  if (!items.length) return alert("No items to order! Please try adding to cart again.");

  const total = items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);

  // Get Payment Method
  const paymentMethodEl = document.querySelector('input[name="payment"]:checked');
  const paymentMethod = paymentMethodEl ? paymentMethodEl.value : "COD";

  // Get Delivery Date
  const deliveryDate = document.getElementById("deliveryDate").getAttribute("data-date") || new Date().toDateString();

  const orderPayload = {
    userId,
    items,
    total,
    date: new Date(),
    deliveryDate,
    paymentMethod,
    address: { fullName, phone, state, district, city, street, pincode }
  };

  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderPayload)
  });

  if (!res.ok) {
    console.error("Order create error", await res.text());
    return alert("Order failed!");
  }

  // Clear only purchased items
  if (mode === "single") {
    const pid = localStorage.getItem("checkoutSingleProductId");
    await fetch(`${API_URL}/cart/remove`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId: pid })
    });
  } else {
    await fetch(`${API_URL}/cart/clear/${userId}`, { method: "DELETE" });
  }

  localStorage.removeItem("checkoutMode");
  localStorage.removeItem("checkoutSingleProductId");

  alert("🎉 Order placed successfully!");
  window.location.href = "orders.html";
}
