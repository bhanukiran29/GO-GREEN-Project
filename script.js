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

function refreshUserMenu() {
  const userMenuEl = document.getElementById("userMenu");
  const loginLinkEl = document.getElementById("navLoginLink");

  if (!isLoggedIn()) {
    if (userMenuEl) userMenuEl.style.display = "none";
    if (loginLinkEl) loginLinkEl.style.display = "block";
    return;
  }

  // User is logged in
  if (loginLinkEl) loginLinkEl.style.display = "none";

  const name = sessionStorage.getItem("userName") || "User";
  const email = sessionStorage.getItem("userEmail") || "";
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
  clearSession();
  refreshUserMenu();
  refreshCartBadge();
  window.location.href = "login.html";
}

/* ---------- Edit Profile Modal handlers ---------- */

function openEditProfileModal() {
  const userId = getUserId();
  if (!userId) return alert("Please login first.");

  // Fetch current user data
  fetch(`${API_URL}/auth/user/${userId}`)
    .then(res => res.json())
    .then(user => {
      document.getElementById("editName").value = user.name || "";
      document.getElementById("editEmail").value = user.email || "";
      document.getElementById("editPhone").value = user.phone || "";
      document.getElementById("editPassword").value = "********";

      if (window.jQuery) {
        $('#editProfileModal').modal('show');
      } else {
        alert("Bootstrap modal required.");
      }
    })
    .catch(err => {
      console.error("Error loading profile:", err);
      alert("Error loading profile data.");
    });
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

async function checkout() {
  const cart = await _fetchCart();
  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  const userId = getUserId();
  if (!userId) {
    alert("Please login to checkout.");
    window.location.href = "login.html";
    return;
  }

  try {
    const total = await getCartTotal();
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        items: cart,
        total
      })
    });

    const data = await res.json();

    if (res.ok) {
      // Clear cart via backend
      await fetch(`${API_URL}/cart/clear/${userId}`, { method: "DELETE" });

      const container = document.getElementById("cartContainer");
      if (container) container.innerHTML = "<h3>Your cart is empty.</h3>";
      await refreshCartBadge();
      alert("Order placed successfully!");
      window.location.reload();
    } else {
      alert(data.message || "Order failed");
    }
  } catch (err) {
    alert("Error connecting to server");
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
