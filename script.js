document.addEventListener('DOMContentLoaded', () => {

    // --- Data Initialization ---
    const initialProducts = [
        { id: 1, name: 'Saree + Dhoti Combo', category: 'saree', image: 'https://i.postimg.cc/K1c4Fk9H/shopping.png', description: 'Traditional silk saree with matching dhoti for couple sets.', price: 2500, rating: 4.5, inStock: true, hasSizes: false, sizes: [] },
        { id: 2, name: 'Kidswear Pack', category: 'kidswear', image: 'https://i.postimg.cc/mtyh0NS9/kidswear-pack.jpg', description: '3-piece traditional kidswear set, soft and comfortable.', price: 1200, rating: 4.2, inStock: true, hasSizes: true, sizes: ['0-6m', '6-12m', '1-2y'] },
        { id: 3, name: 'Cotton Saree', category: 'saree', image: 'https://i.postimg.cc/xc2cxFLY/cotton-saree.jpg', description: 'Pure cotton handwoven saree, perfect for daily wear.', price: 1800, rating: 4.7, inStock: true, hasSizes: false, sizes: [] },
        { id: 4, name: "Men's Silk Shirt and Dhoti Set", category: 'menswear', image: 'https://i.postimg.cc/tT1d4yFz/menswear-set.jpg', description: 'A complete traditional men\'s attire set, including a golden silk-blend shirt and a matching dhoti.', price: 3500, rating: 4.8, inStock: true, hasSizes: true, sizes: ['M', 'L', 'XL'] }
    ];

    function initializeProducts() {
        if (localStorage.getItem('products') === null) {
            localStorage.setItem('products', JSON.stringify(initialProducts));
        }
        return JSON.parse(localStorage.getItem('products'));
    }

    let products = initializeProducts();
    let cart = JSON.parse(localStorage.getItem('cart')) || {};
    let filters = { category: '', searchQuery: '', sortBy: 'default' };

    // --- DOM Elements ---
    const productList = document.getElementById('product-list');
    const cartCountEl = document.getElementById('cart-count');
    const cartBtn = document.getElementById('cart-btn');
    const searchInput = document.getElementById('searchInput');
    const filterCategory = document.getElementById('filterCategory');
    const sortOrder = document.getElementById('sortOrder');
    const modalContainer = document.getElementById('modal-container');

    // --- Core Functions ---
    const saveCart = () => localStorage.setItem('cart', JSON.stringify(cart));

    const updateCartCount = () => {
        const totalQuantity = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountEl) {
            cartCountEl.textContent = totalQuantity;
        }
    };

    const clearCart = () => {
        if (confirm('Are you sure you want to empty your entire cart?')) {
            cart = {};
            saveCart();
            renderUI();
            const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
            if (cartModal) {
                cartModal.hide();
            }
        }
    };
    
    const addToCart = (id, size = '') => {
        const product = products.find(p => p.id === id);
        if (!product || !product.inStock) return;
        const key = product.hasSizes && size ? `${id}|${size}` : id;
        cart[key] = cart[key] || { productId: id, quantity: 0, ...(size && { size }) };
        cart[key].quantity++;
        saveCart();
        renderUI();
    };

    const updateQuantity = (key, change) => {
        if (!cart[key]) return;
        cart[key].quantity += change;
        if (cart[key].quantity <= 0) delete cart[key];
        saveCart();
        renderUI();
        if (document.getElementById('cartModal')) showCartModal();
    };

    const calculateTotal = () => {
        return Object.entries(cart).reduce((sum, [key, item]) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (product ? product.price * item.quantity : 0);
        }, 0).toFixed(2);
    };

    // --- Rendering Functions ---
    const renderProducts = (productsToRender) => {
        if (!productList) return;
        productList.innerHTML = '';
        if (productsToRender.length === 0) {
            productList.innerHTML = `<div class="col-12 text-center"><p class="text-muted fs-4">No products found.</p></div>`;
            return;
        }

        productsToRender.forEach(product => {
            const card = document.createElement('div');
            card.className = 'col-lg-4 col-md-6 mb-4';
            card.innerHTML = `
                <div class="card h-100 product-card" onclick="showProductDetail(${product.id})">
                    <div class="card-img-top-wrapper"><img src="${product.image}" alt="${product.name}" class="card-img-top" onload="this.classList.add('loaded')" onerror="this.src='https://via.placeholder.com/300x250?text=Image+Not+Found'; this.classList.add('loaded');"></div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold">${product.name}</h5>
                        <p class="card-text text-muted small flex-grow-1">${product.description}</p>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <p class="h5 text-accent fw-bold m-0">₹${product.price}</p>
                            <div class="text-warning small">${'★'.repeat(Math.round(product.rating))}${'☆'.repeat(5 - Math.round(product.rating))}</div>
                        </div>
                        <div class="mt-auto" onclick="event.stopPropagation()">${getCartControlsHTML(product)}</div>
                    </div>
                </div>`;
            productList.appendChild(card);
        });
    };

    const getCartControlsHTML = (product) => {
        if (product.hasSizes) {
            return product.sizes.map(size => {
                const key = `${product.id}|${size}`;
                const quantity = cart[key]?.quantity || 0;
                return quantity > 0
                    ? `<div class="quantity-controls mb-2"><span class="small fw-medium me-auto">In Cart (${size})</span><div class="d-flex align-items-center gap-2"><button onclick="updateQuantity('${key}', -1)" class="btn btn-sm btn-outline-danger py-0 px-2">-</button><span class="qty-display">${quantity}</span><button onclick="updateQuantity('${key}', 1)" class="btn btn-sm btn-outline-success py-0 px-2">+</button></div></div>`
                    : `<button onclick="addToCart(${product.id}, '${size}')" class="btn btn-add-to-cart btn-sm w-100 mb-2" ${!product.inStock ? 'disabled' : ''}>Add to Cart (${size})</button>`;
            }).join('');
        } else {
            const key = product.id;
            const quantity = cart[key]?.quantity || 0;
            return quantity > 0
                ? `<div class="quantity-controls"><span class="small fw-medium me-auto">In Cart</span><div class="d-flex align-items-center gap-2"><button onclick="updateQuantity('${key}', -1)" class="btn btn-sm btn-outline-danger py-0 px-2">-</button><span class="qty-display">${quantity}</span><button onclick="updateQuantity('${key}', 1)" class="btn btn-sm btn-outline-success py-0 px-2">+</button></div></div>`
                : `<button onclick="addToCart(${product.id})" class="btn btn-add-to-cart w-100" ${!product.inStock ? 'disabled' : ''}>Add to Cart</button>`;
        }
    };
    
    const renderUI = () => {
        let currentProducts = [...products];
        if (filters.searchQuery) currentProducts = currentProducts.filter(p => p.name.toLowerCase().includes(filters.searchQuery) || p.description.toLowerCase().includes(filters.searchQuery));
        if (filters.category) currentProducts = currentProducts.filter(p => p.category === filters.category);
        switch(filters.sortBy) {
            case 'rating': currentProducts.sort((a, b) => b.rating - a.rating); break;
            case 'price-asc': currentProducts.sort((a, b) => a.price - b.price); break;
            case 'price-desc': currentProducts.sort((a, b) => b.price - a.price); break;
        }
        renderProducts(currentProducts);
        updateCartCount();
    };

    // --- Modal and Checkout Functions ---
    const createModal = (id, title, body) => {
        modalContainer.innerHTML = `<div class="modal fade" id="${id}" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">${title}</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body">${body}</div></div></div></div>`;
        const modalEl = document.getElementById(id);
        const modal = new bootstrap.Modal(modalEl);
        modalEl.addEventListener('hidden.bs.modal', () => modalContainer.innerHTML = '');
        modal.show();
    };

    const showCartModal = () => {
        if (Object.keys(cart).length === 0) {
            alert('🛒 Your cart is empty!');
            return;
        }
        const itemsHTML = Object.entries(cart).map(([key, item]) => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return '';
            return `<li class="list-group-item d-flex justify-content-between align-items-center"><div>${product.name} ${item.size ? `<span class="text-muted">(Size: ${item.size})</span>` : ''}<br><small>${item.quantity} x ₹${product.price} = ₹${(product.price * item.quantity).toFixed(2)}</small></div><button class="btn btn-sm btn-outline-danger" onclick="updateQuantity('${key}', -cart['${key}'].quantity)">Remove</button></li>`;
        }).join('');
        
        const modalBody = `
            <ul class="list-group mb-3">${itemsHTML}</ul>
            <div class="text-end">
                <h4 class="fw-bold">Total: ₹${calculateTotal()}</h4>
                <button class="btn btn-outline-danger mt-2" id="clearCartBtn">Empty Cart</button>
                <button class="btn btn-whatsapp mt-2 ms-2" id="checkoutBtn"><i class="bi bi-whatsapp"></i> Proceed to Checkout</button>
            </div>`;

        createModal('cartModal', 'Your Shopping Cart', modalBody);
        document.getElementById('checkoutBtn').addEventListener('click', showCheckoutModal);
        document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    };

    const showCheckoutModal = () => {
        const modalBody = `<form id="checkoutForm"><div class="mb-3"><label for="customerName" class="form-label">Full Name</label><input type="text" class="form-control" id="customerName" required></div><div class="mb-3"><label for="customerPhone" class="form-label">WhatsApp Number</label><input type="tel" class="form-control" id="customerPhone" required pattern="[6-9][0-9]{9}"></div><div class="mb-3"><label for="customerAddress" class="form-label">Shipping Address</label><textarea class="form-control" id="customerAddress" required rows="3"></textarea></div><button type="submit" class="btn btn-whatsapp w-100">Confirm & Order via WhatsApp</button></form>`;
        createModal('checkoutModal', 'Complete Your Order', modalBody);
        document.getElementById('checkoutForm').addEventListener('submit', e => {
            e.preventDefault();
            sendWhatsAppOrder(
                document.getElementById('customerName').value.trim(),
                document.getElementById('customerPhone').value.trim(),
                document.getElementById('customerAddress').value.trim()
            );
            bootstrap.Modal.getInstance(document.getElementById('cartModal'))?.hide();
            bootstrap.Modal.getInstance(document.getElementById('checkoutModal'))?.hide();
        });
    };
    
    const showProductDetail = (id) => {
        const product = products.find(p => p.id === id);
        if (!product) return;
        const sizeSelector = product.hasSizes ? `<div class="mb-3"><label for="sizeSelect" class="form-label">Select Size:</label><select class="form-select" id="sizeSelect">${product.sizes.map(size => `<option value="${size}">${size}</option>`).join('')}</select></div>` : '';
        const modalBody = `<div class="row g-4"><div class="col-md-6"><img src="${product.image}" alt="${product.name}" class="img-fluid rounded"></div><div class="col-md-6"><p class="h3 fw-bold text-accent">₹${product.price}</p><p>${product.description}</p><div class="text-warning mb-3">${'★'.repeat(Math.round(product.rating))}${'☆'.repeat(5 - Math.round(product.rating))}</div>${sizeSelector}<button class="btn btn-add-to-cart w-100" id="detailAddToCartBtn">Add to Cart</button></div></div>`;
        createModal('productDetailModal', product.name, modalBody);
        document.getElementById('detailAddToCartBtn').addEventListener('click', () => {
            addToCart(product.id, document.getElementById('sizeSelect')?.value || '');
        });
    };

    // --- THIS IS THE MODIFIED FUNCTION ---
    const sendWhatsAppOrder = (name, phone, address) => {
        const whatsappNumber = '917598242759';
        let message = `*NEW ORDER from KAILASH*\n\n*Customer:* ${name}\n*Phone:* ${phone}\n\n*Items:*\n----------------------\n`;
        
        Object.entries(cart).forEach(([key, item]) => {
            const p = products.find(p => p.id === item.productId);
            if (p) {
                // Original line with product details
                message += `• ${p.name}${item.size ? `(${item.size})` : ''} x ${item.quantity} = ₹${(p.price * item.quantity).toFixed(2)}\n`;
                
                // --- THIS IS THE NEW LINE ---
                // It adds the image URL below the product details.
                message += `  📸 Image: ${p.image}\n`;
            }
        });

        message += `----------------------\n*Total Amount:* ₹${calculateTotal()}\n\n*Shipping Address:*\n${address}`;
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        
        // Clear cart and update UI
        cart = {};
        saveCart();
        renderUI();
    };
    // --- END OF MODIFICATION ---

    // --- Event Listeners and Initialization ---
    const debounce = (func, delay) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => func.apply(this, args), delay); }; };
    
    if(cartBtn) cartBtn.addEventListener('click', showCartModal);
    if(searchInput) searchInput.addEventListener('input', debounce(e => { filters.searchQuery = e.target.value.toLowerCase(); renderUI(); }, 300));
    if(filterCategory) filterCategory.addEventListener('change', e => { filters.category = e.target.value; renderUI(); });
    if(sortOrder) sortOrder.addEventListener('change', e => { filters.sortBy = e.target.value; renderUI(); });
    
    // Make functions globally accessible for inline onclick attributes
    window.addToCart = addToCart;
    window.updateQuantity = updateQuantity;
    window.showProductDetail = showProductDetail;
    window.clearCart = clearCart;

    // Initial Render
    renderUI();
});