const API_URL = "http://localhost:5002/api";

async function testFlow() {
    const email = "test_" + Date.now() + "@example.com";
    const password = "password123";
    const name = "Test User";
    const phone = "1234567890";

    console.log("1. Creating Account...");
    try {
        const signupRes = await fetch(`${API_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, phone, password })
        });
        const signupData = await signupRes.json();
        console.log("Signup Response:", signupData);
    } catch (e) {
        console.error("Signup failed (server might be down):", e.message);
        return;
    }

    console.log("\n2. Logging In...");
    let user;
    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        console.log("Login Response:", loginData);
        if (loginRes.ok) {
            user = loginData.user;
            console.log("Login Successful!");
        } else {
            console.error("Login Failed!");
            return;
        }
    } catch (e) {
        console.error("Login error:", e.message);
        return;
    }

    console.log("\n3. Simulating Logout (Client-side action)...");
    // Logout is just clearing local state, server is stateless here
    user = null;
    console.log("Logged out.");

    console.log("\n4. Logging In Again...");
    try {
        const loginRes2 = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const loginData2 = await loginRes2.json();
        console.log("Re-Login Response:", loginData2);
        if (loginRes2.ok) {
            console.log("Re-Login Successful!");
        } else {
            console.error("Re-Login Failed!");
        }
    } catch (e) {
        console.error("Re-Login error:", e.message);
    }
}

testFlow();
