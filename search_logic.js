/* ============================
   SEARCH SYSTEM FOR PRODUCTS
   ============================ */

const PRODUCTS = [
    { name: "Plants & Seeds", price: 150, img: "iplants_&_Seeds.jpeg", link: "plants&seeds.html" },
    { name: "Soil & Fertilizers", price: 200, img: "isoil_&_fertilizer.jpg", link: "soil-&-Fertilizers.html" },
    { name: "Pots & Planters", price: 300, img: "i212.jpg", link: "pots-&-Planters.html" },
    { name: "Eco-Friendly Products", price: 180, img: "iEco-Friendly Products.jpg", link: "Eco_Friendly.html" },
    { name: "Handmade Products", price: 250, img: "i226.jpg", link: "Handmade.html" },
    { name: "Natural Beauty Products", price: 220, img: "iNatural Beauty Productss.jpg", link: "Natural-Beauty.html" }
];

document.addEventListener("DOMContentLoaded", () => {

    const searchBox = document.querySelector(".search-box");
    if (!searchBox) return;

    // Create dropdown
    const dropdown = document.createElement("div");
    dropdown.className = "search-results-dropdown";
    searchBox.appendChild(dropdown);

    const input = document.querySelector(".search-input");

    input.addEventListener("input", () => {
        const q = input.value.toLowerCase().trim();

        if (!q) {
            dropdown.style.display = "none";
            return;
        }

        const results = PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(q)
        );

        dropdown.innerHTML = "";

        if (results.length === 0) {
            dropdown.innerHTML = `<div class="search-result-item">No results found</div>`;
        } else {
            results.forEach(item => {
                dropdown.innerHTML += `
                    <div class="search-result-item" onclick="location.href='${item.link}'">
                        <img src="${item.img}">
                        <div class="item-info">
                            <span class="item-name">${item.name}</span>
                            <span class="item-price">₹${item.price}</span>
                        </div>
                    </div>
                `;
            });
        }

        dropdown.style.display = "block";
    });

    document.addEventListener("click", (e) => {
        if (!searchBox.contains(e.target)) {
            dropdown.style.display = "none";
        }
    });
});
