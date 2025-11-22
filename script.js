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
function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

/* ---------- Location Dropdown ---------- */
function setLocation(city) {
  const el = document.getElementById("selected-location");
  if (el) el.innerText = city;
  localStorage.setItem("selectedLocation", city);
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

  try {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password })
    });
    const data = await res.json();

    if (res.ok) {
      alert("Account created successfully! Please login.");
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
      localStorage.setItem("userData", JSON.stringify(data.user));
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

function refreshUserMenu() {
  const raw = localStorage.getItem("userData");
  const userMenuEl = document.getElementById("userMenu");
  const loginLinkEl = document.getElementById("navLoginLink");

  if (!raw) {
    if (userMenuEl) userMenuEl.style.display = "none";
    if (loginLinkEl) loginLinkEl.style.display = "block"; // Show login link
    return;
  }

  // User is logged in
  if (loginLinkEl) loginLinkEl.style.display = "none"; // Hide login link

  const user = JSON.parse(raw);
  const name = user.name || user.email || "User";
  const email = user.email || "";
  const initial = (name && name.trim().charAt(0).toUpperCase()) || "U";

  const mName = document.getElementById("menuUserName");
  const mEmail = document.getElementById("menuUserEmail");
  const navAvatar = document.getElementById("navAvatar");
  const menuAvatar = document.getElementById("menuAvatar");

  if (mName) mName.innerText = name;
  if (mEmail) mEmail.innerText = email;
  if (navAvatar) navAvatar.innerText = initial;
  if (menuAvatar) menuAvatar.innerText = initial;

  if (userMenuEl) userMenuEl.style.display = "block";

  try {
    if (window.location.pathname.endsWith("profile.html")) {
      populateProfilePage();
    }
  } catch (e) { /* ignore */ }
}

function logoutUser() {
  if (!confirm("Do you want to logout?")) return;
  localStorage.removeItem("userData");
  // localStorage.removeItem("cartItems"); // REMOVED: Keep user's cart saved
  refreshUserMenu();
  refreshCartBadge(); // Update badge for guest (likely 0 or guest cart)
  window.location.href = "login.html";
}

/* ---------- Edit Profile Modal handlers ---------- */

function openEditProfileModal() {
  const raw = localStorage.getItem("userData");
  if (!raw) return alert("No user data found.");

  const user = JSON.parse(raw);

  // Fill fields
  document.getElementById("editName").value = user.name || "";
  document.getElementById("editEmail").value = user.email || "";
  document.getElementById("editPhone").value = user.phone || "";
  // Show hidden password (fake — not real password)
  document.getElementById("editPassword").value = "********";

  // Show the modal
  if (window.jQuery) {
    $('#editProfileModal').modal('show');
  } else {
    alert("Bootstrap modal required.");
  }
}


async function saveProfileEdits() {
  const name = (document.getElementById("editName") || {}).value.trim();
  const email = (document.getElementById("editEmail") || {}).value.trim();
  const phone = (document.getElementById("editPhone") || {}).value.trim();
  const password = (document.getElementById("editPassword") || {}).value.trim();

  const raw = localStorage.getItem("userData");
  if (!raw) return alert("No user data found.");
  const currentUser = JSON.parse(raw);

  if (email !== currentUser.email) {
    if (!confirm("Changing your email will require you to login again with the new email. Continue?")) {
      return false;
    }
  }

  if (!name || !email) {
    alert("Name and email are required.");
    return false;
  }

  // raw is already declared above
  // const raw = localStorage.getItem("userData"); 
  // if (!raw) return alert("No user data found.");
  // const user = JSON.parse(raw);

  try {
    const res = await fetch(`${API_URL}/auth/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _id: currentUser._id, // Use currentUser from above
        name,
        email,
        phone,
        password: password === "********" ? undefined : password
      })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("userData", JSON.stringify(data.user));
      refreshUserMenu();

      // Immediate UI update for profile page if we are on it
      if (document.getElementById("profileName")) document.getElementById("profileName").innerText = data.user.name;
      if (document.getElementById("profileEmail")) document.getElementById("profileEmail").innerText = data.user.email;
      if (document.getElementById("profilePhone")) document.getElementById("profilePhone").innerText = "📞 " + data.user.phone;
      if (document.getElementById("detailName")) document.getElementById("detailName").innerText = data.user.name;
      if (document.getElementById("detailEmail")) document.getElementById("detailEmail").innerText = data.user.email;
      if (document.getElementById("detailPhone")) document.getElementById("detailPhone").innerText = data.user.phone;

      if (window.jQuery) $('#editProfileModal').modal('hide');

      if (email !== currentUser.email) {
        alert("Email updated! Please login with your new email.");
        logoutUser();
        return;
      }

      alert("Profile updated successfully!");
    } else {
      alert(data.message || "Update failed");
    }
  } catch (err) {
    alert("Error connecting to server");
  }
  return false;
}

/* ---------- Profile page population ---------- */
async function populateProfilePage() {
  const raw = localStorage.getItem("userData");
  if (!raw) return;

  const user = JSON.parse(raw);
  const name = user.name || "User";
  const email = user.email || "";
  const phone = user.phone || "Not provided";
  const initial = (name.trim().charAt(0) || "U").toUpperCase();

  // Populate User Details
  if (document.getElementById("profileAvatar")) document.getElementById("profileAvatar").innerText = initial;
  if (document.getElementById("profileName")) document.getElementById("profileName").innerText = name;
  if (document.getElementById("profileEmail")) document.getElementById("profileEmail").innerText = email;
  if (document.getElementById("profilePhone")) document.getElementById("profilePhone").innerText = "📞 " + phone;

  if (document.getElementById("detailName")) document.getElementById("detailName").innerText = name;
  if (document.getElementById("detailEmail")) document.getElementById("detailEmail").innerText = email;
  if (document.getElementById("detailPhone")) document.getElementById("detailPhone").innerText = phone;

  // Fetch and Populate Orders
  const ordersContainer = document.getElementById("ordersContainer");
  if (!ordersContainer) return;

  if (!user._id) {
    ordersContainer.innerHTML = "<p>Please login to view orders.</p>";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/orders/${user._id}`);
    const orders = await res.json();

    if (!res.ok || !orders.length) {
      ordersContainer.innerHTML = "<p>No orders found.</p>";
      return;
    }

    let html = '<div class="list-group">';
    orders.forEach(order => {
      const date = new Date(order.date).toLocaleDateString();
      const total = order.total;
      const itemCount = order.items.length;

      html += `
        <div class="list-group-item">
          <h4 class="list-group-item-heading">Order #${order._id.slice(-6)} <small class="pull-right">${date}</small></h4>
          <p class="list-group-item-text">
            <strong>Items:</strong> ${itemCount} | <strong>Total:</strong> ₹${total}
          </p>
        </div>
      `;
    });
    html += '</div>';
    ordersContainer.innerHTML = html;

  } catch (err) {
    ordersContainer.innerHTML = "<p>Error loading orders.</p>";
  }
}

/* ---------- Basic Cart System ---------- */

function _getCartKey() {
  const raw = localStorage.getItem("userData");
  if (raw) {
    const user = JSON.parse(raw);
    return `cartItems_${user._id}`;
  }
  return "cartItems_guest";
}

function _readCart() {
  try {
    return JSON.parse(localStorage.getItem(_getCartKey()) || "[]");
  } catch (e) {
    return [];
  }
}

function _writeCart(cart) {
  localStorage.setItem(_getCartKey(), JSON.stringify(cart));
}

function addToCart(name, price, img) {
  let cart = _readCart();

  let existing = cart.find(item => item.name === name);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: "p" + Date.now(),
      name,
      price,
      img,
      qty: 1
    });
  }

  _writeCart(cart);
  alert(name + " added to cart!");
  refreshCartBadge();
}

function removeFromCart(itemId) {
  let cart = _readCart();
  cart = cart.filter(i => i.id !== itemId);
  _writeCart(cart);
  renderCartPage();
  refreshCartBadge();
}

function changeQty(itemId, qty) {
  let cart = _readCart();
  const it = cart.find(i => i.id === itemId);
  if (!it) return;
  it.qty = Math.max(1, Number(qty) || 1);
  _writeCart(cart);
  renderCartPage();
  refreshCartBadge();
}

function getCartTotal() {
  const cart = _readCart();
  return cart.reduce((sum, i) => sum + (i.price * (i.qty || 1)), 0);
}

function renderCartPage() {
  const container = document.getElementById("cartContainer");
  if (!container) return;

  const cart = _readCart();

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

  cart.forEach((item, i) => {
    html += `
      <tr>
          <td><img src="${item.img}" width="70"></td>
          <td>${item.name}</td>
          <td>₹${item.price}</td>
          <td>
              <button onclick="decreaseQty(${i})">-</button>
              ${item.qty}
              <button onclick="increaseQty(${i})">+</button>
          </td>
          <td>₹${item.price * item.qty}</td>
          <td>
              <button class="btn btn-danger btn-sm" onclick="removeItem(${i})">X</button>
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

function increaseQty(i) {
  let cart = _readCart();
  cart[i].qty++;
  _writeCart(cart);
  renderCartPage();
}

function decreaseQty(i) {
  let cart = _readCart();
  if (cart[i].qty > 1) cart[i].qty--;
  _writeCart(cart);
  renderCartPage();
}

function removeItem(i) {
  let cart = _readCart();
  cart.splice(i, 1);
  _writeCart(cart);
  renderCartPage();
  refreshCartBadge();
}

async function checkout() {
  const cart = _readCart();
  if (!cart.length) { alert("Your cart is empty."); return; }

  const rawUser = localStorage.getItem("userData");
  if (!rawUser) {
    alert("Please login to checkout.");
    window.location.href = "login.html";
    return;
  }
  const user = JSON.parse(rawUser);
  const userId = user._id || "guest"; // MongoDB ID if available

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        items: cart,
        total: getCartTotal()
      })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.removeItem(_getCartKey());
      // Explicitly clear the UI immediately
      const container = document.getElementById("cartContainer");
      if (container) container.innerHTML = "<h3>Your cart is empty.</h3>";
      refreshCartBadge();
      alert("Order placed successfully!");
      window.location.reload();
    } else {
      alert(data.message || "Order failed");
    }
  } catch (err) {
    alert("Error connecting to server");
  }
}

function refreshCartBadge() {
  const count = _readCart().reduce((s, i) => s + (i.qty || 1), 0);
  const badge = document.getElementById("cartBadge");
  if (badge) badge.innerText = count || "";
}

function smoothScroll(targetID) {
  const el = document.querySelector(targetID);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.addEventListener("DOMContentLoaded", function () {
  const savedLoc = localStorage.getItem("selectedLocation");
  if (savedLoc) {
    const el = document.getElementById("selected-location");
    if (el) el.innerText = savedLoc;
  }

  refreshUserMenu();

  if (window.jQuery) {
    $('#editProfileModal').on('show.bs.modal', function () {
      openEditProfileModal();
    });
  }

  renderCartPage();
  refreshCartBadge();

  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) loginBtn.addEventListener("click", function (e) { e.preventDefault(); loginUser(); });

  const createBtn = document.getElementById("createAccountBtn");
  if (createBtn) createBtn.addEventListener("click", function (e) { e.preventDefault(); createAccount(); });

  const editForm = document.getElementById("editProfileForm");
  if (editForm) editForm.addEventListener("submit", function (e) {
    e.preventDefault();
    saveProfileEdits();
  });
});
