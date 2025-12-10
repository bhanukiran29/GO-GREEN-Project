
/* ---------- SEARCH FUNCTIONALITY ---------- */
const PRODUCTS = [
    // Ceramic Pots
    { name: "5″ Designer Ceramic Pot", price: 139, img: "i205.jpg", link: "Ceramic Pots.html" },
    { name: "Blushing Sun Ceramic Planter", price: 1593, img: "i206.jpg", link: "Ceramic Pots.html" },
    { name: "Lazy Gardener Ceramic Plant Pots", price: 499, img: "i207.jpg", link: "Ceramic Pots.html" },
    { name: "5 inches Tulsi Ceramic Plant Pots", price: 229, img: "i208.jpg", link: "Ceramic Pots.html" },

    // Clay Pots
    { name: "12″ Terracotta Clay Pot Set", price: 899, img: "i201.webp", link: "Clay Pots.html" },
    { name: "Sienna Terracotta Pots (Set of 3)", price: 935, img: "i202.jpg", link: "Clay Pots.html" },
    { name: "Wonderland Snail Terracotta Pot", price: 549, img: "i203.jpg", link: "Clay Pots.html" },
    { name: "Rusticana Terracotta Planter", price: 1150, img: "i204.jpg", link: "Clay Pots.html" },

    // Indoor Plants
    { name: "Snake Plant", price: 299, img: "i101.jpg", link: "indoor-plants.html" },
    { name: "Money Plant", price: 199, img: "i102.jpg", link: "indoor-plants.html" },
    { name: "Aloe Vera", price: 179, img: "i103.jpg", link: "indoor-plants.html" },
    { name: "Areca Palm", price: 399, img: "i104.jpg", link: "indoor-plants.html" },

    // Add more as needed...
];

function initSearch() {
    console.log('🔍 Initializing search...');
    const searchInput = document.querySelector('.search-input');
    const searchBox = document.querySelector('.search-box');

    console.log('Search input found:', searchInput);
    console.log('Search box found:', searchBox);

    if (!searchInput || !searchBox) {
        console.error('❌ Search elements not found!');
        return;
    }

    console.log('✅ Search elements found, setting up dropdown...');

    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'search-results-dropdown';
    searchBox.appendChild(dropdown);

    // Make search box relative for positioning
    searchBox.style.position = 'relative';

    searchInput.addEventListener('input', function (e) {
        const term = e.target.value.toLowerCase().trim();
        dropdown.innerHTML = '';

        // Page Filtering (Local)
        filterPageProducts(term);

        if (term.length < 2) {
            dropdown.style.display = 'none';
            return;
        }

        // Global Search (Dropdown)
        const matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(term));

        if (matches.length > 0) {
            dropdown.style.display = 'block';
            matches.forEach(p => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `
          <img src="${p.img}" alt="${p.name}">
          <div class="item-info">
            <span class="item-name">${p.name}</span>
            <span class="item-price">₹${p.price}</span>
          </div>
        `;
                item.onclick = () => window.location.href = p.link;
                dropdown.appendChild(item);
            });
        } else {
            dropdown.style.display = 'none';
        }
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!searchBox.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

function filterPageProducts(term) {
    const cards = document.querySelectorAll('.product-card');
    if (cards.length === 0) return;

    cards.forEach(card => {
        const nameEl = card.querySelector('h3');
        if (!nameEl) return;

        const name = nameEl.innerText.toLowerCase();
        if (name.includes(term)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Initialize search on load
if (window.jQuery) {
    $(document).ready(function () {
        initSearch();
    });
} else {
    // Fallback if jQuery is not loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        initSearch();
    }
}
