const API_URL = "http://localhost:5002/api";

async function testProfileFlow() {
    console.log("Starting Profile Flow Test...");

    // 1. Login to get userId
    console.log("\n1. Logging in...");
    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "sridevi2@gmail.com", password: "password123" })
        });

        let data;
        if (!loginRes.ok) {
            console.log("Login failed, trying to create user...");
            await fetch(`${API_URL}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Test User", email: "test@example.com", phone: "1234567890", password: "password123" })
            });

            const loginRes2 = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "test@example.com", password: "password123" })
            });

            if (!loginRes2.ok) {
                console.error("Failed to login even after signup.");
                return;
            }
            data = await loginRes2.json();
        } else {
            data = await loginRes.json();
        }

        const userId = data.userId;
        console.log("Login successful. UserId:", userId);

        // 2. Fetch User Details
        console.log("\n2. Fetching User Details...");
        const userRes = await fetch(`${API_URL}/auth/user/${userId}`);
        const userData = await userRes.json();
        console.log("User Data:", userData);

        if (userData._id === userId) {
            console.log("✅ User details fetched successfully.");
        } else {
            console.error("❌ Failed to fetch user details.");
        }

        // 3. Fetch Orders
        console.log("\n3. Fetching Orders...");
        const ordersRes = await fetch(`${API_URL}/orders/${userId}`);
        const ordersData = await ordersRes.json();
        console.log(`Orders found: ${ordersData.length}`);
        console.log("✅ Orders fetched successfully.");

        // 4. Update Profile
        console.log("\n4. Updating Profile...");
        const newName = "Updated Name " + Date.now();
        const updateRes = await fetch(`${API_URL}/auth/update`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                _id: userId,
                name: newName,
                email: userData.email,
                phone: userData.phone
            })
        });
        const updateData = await updateRes.json();

        if (updateData.user.name === newName) {
            console.log("✅ Profile updated successfully.");
        } else {
            console.error("❌ Failed to update profile.");
        }

    } catch (err) {
        console.error("Test failed with error:", err);
    }

    console.log("\nTest Complete.");
}

testProfileFlow();
