// ==================== ДАННЫЕ ====================
const DEFAULT_CATEGORIES = [
    { id: 'blocks', name: 'Блоки', icon: 'fa-cube' },
    { id: 'items', name: 'Предметы', icon: 'fa-gem' },
    { id: 'mobs', name: 'Мобы', icon: 'fa-dragon' },
    { id: 'services', name: 'Услуги', icon: 'fa-hands-helping' },
    { id: 'other', name: 'Другое', icon: 'fa-ellipsis-h' }
];

function initData() {
    if (!localStorage.getItem('categories')) localStorage.setItem('categories', JSON.stringify(DEFAULT_CATEGORIES));
    if (!localStorage.getItem('products')) localStorage.setItem('products', JSON.stringify([]));
    if (!localStorage.getItem('users')) localStorage.setItem('users', JSON.stringify([]));
    if (!localStorage.getItem('orders')) localStorage.setItem('orders', JSON.stringify([]));
    if (!localStorage.getItem('chats')) localStorage.setItem('chats', JSON.stringify([]));
    if (!localStorage.getItem('reports')) localStorage.setItem('reports', JSON.stringify([]));
    if (!localStorage.getItem('cart')) localStorage.setItem('cart', JSON.stringify([]));
    if (!localStorage.getItem('currentUser')) localStorage.setItem('currentUser', 'null');
}

function getData(key) { return JSON.parse(localStorage.getItem(key) || '[]'); }
function setData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function getCurrentUser() {
    const u = localStorage.getItem('currentUser');
    return u === 'null' ? null : JSON.parse(u);
}
function refreshCurrentUser() {
    const u = getCurrentUser();
    if (!u) return null;
    const users = getData('users');
    const fresh = users.find(x => x.id === u.id);
    if (fresh) {
        localStorage.setItem('currentUser', JSON.stringify(fresh));
        return fresh;
    }
    return null;
}

// ==================== АНИМАЦИИ ====================
function initScrollAnimations() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => obs.observe(el));
}

// ==================== ШАПКА ====================
function updateHeader() {
    const user = getCurrentUser();
    const loginBtn = document.getElementById('loginBtn');
    const profileBtn = document.getElementById('profileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userName = document.getElementById('userName');
    const cartCount = document.getElementById('cartCount');

    if (user) {
        if (loginBtn) loginBtn.classList.add('hidden');
        if (profileBtn) { profileBtn.classList.remove('hidden'); if (userName) userName.textContent = user.name; }
        if (logoutBtn) logoutBtn.classList.remove('hidden');
    } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (profileBtn) profileBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
    }

    if (cartCount) {
        const cart = getData('cart');
        const total = cart.reduce((s, i) => s + i.quantity, 0);
        cartCount.textContent = total;
    }
}

// ==================== КАТЕГОРИИ ====================
function renderCategories(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const categories = getData('categories');
    container.innerHTML = categories.map(cat => `
        <a href="catalog.html?category=${cat.id}" class="category-card">
            <div class="category-icon"><i class="fas ${cat.icon}"></i></div>
            <span>${cat.name}</span>
        </a>
    `).join('');
}

// ==================== ТОВАРЫ ====================
function renderProducts(containerId, products = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Товары не найдены</p></div>';
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="product-card" data-id="${p.id}">
            <div class="product-image">
                ${p.image ? `<img src="${p.image}" alt="${p.title}">` : `<i class="fas ${p.icon || 'fa-cube'}"></i>`}
                ${p.quantity === 0 ? '<div class="product-badge" style="background: var(--color-danger); color: white;">Нет в наличии</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-category">${p.categoryName || ''}</div>
                <div class="product-title">${p.title}</div>
                <div class="product-price">${p.price.toLocaleString('ru-RU')} ₽</div>
                <div class="product-stock ${p.quantity > 0 ? '' : 'out'}">
                    <i class="fas ${p.quantity > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${p.quantity > 0 ? `В наличии: ${p.quantity} шт` : 'Нет в наличии'}
                </div>
                ${p.delivery ? `<div class="product-delivery"><i class="fas fa-truck"></i> ${p.delivery}</div>` : ''}
                <div class="product-seller"><i class="fas fa-store"></i> ${p.sellerName || 'Неизвестно'}</div>
            </div>
        </div>
    `).join('');

    // Клик по товару
    container.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            const products = getData('products');
            const product = products.find(p => p.id === id);
            if (product) showProductModal(product);
        });
    });
}

// ==================== МОДАЛКА ТОВАРА ====================
function showProductModal(product) {
    const user = getCurrentUser();
    const existing = document.getElementById('productModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'productModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(10px);';
    modal.innerHTML = `
        <div style="background: var(--bg-card); border-radius: var(--radius); border: 2px solid var(--color-lime); max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-glow);">
            <div style="padding: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                    <h2 style="font-size: 28px; font-weight: 800; color: var(--color-white);">${product.title}</h2>
                    <button id="closeModal" style="background: none; border: none; color: var(--color-text-muted); font-size: 24px; cursor: pointer;"><i class="fas fa-times"></i></button>
                </div>
                <div style="width: 100%; height: 250px; background: var(--bg-tertiary); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 100px; color: var(--color-lime); margin-bottom: 20px; overflow: hidden;">
                    ${product.image ? `<img src="${product.image}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas ${product.icon || 'fa-cube'}"></i>`}
                </div>
                <div style="display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap;">
                    <span class="badge badge-admin">${product.categoryName || ''}</span>
                    <span class="product-stock ${product.quantity > 0 ? '' : 'out'}" style="margin: 0;"><i class="fas ${product.quantity > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${product.quantity > 0 ? `В наличии: ${product.quantity} шт` : 'Нет в наличии'}</span>
                </div>
                <div style="font-size: 36px; font-weight: 800; color: var(--color-lime); margin-bottom: 20px;">${product.price.toLocaleString('ru-RU')} ₽</div>
                ${product.description ? `<p style="color: var(--color-text-secondary); margin-bottom: 20px; line-height: 1.6;">${product.description}</p>` : ''}
                ${product.delivery ? `<p style="color: var(--color-text-secondary); margin-bottom: 20px;"><i class="fas fa-truck" style="color: var(--color-lime);"></i> ${product.delivery}</p>` : ''}
                <p style="color: var(--color-text-muted); margin-bottom: 20px;"><i class="fas fa-store"></i> Продавец: ${product.sellerName || 'Неизвестно'}</p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    ${user && user.id !== product.sellerId && product.quantity > 0 ? `<button class="btn btn-primary" id="buyNowBtn"><i class="fas fa-bolt"></i> Купить сейчас</button>` : ''}
                    ${user && user.id !== product.sellerId && product.quantity > 0 ? `<button class="btn btn-secondary" id="addToCartBtn"><i class="fas fa-cart-plus"></i> В корзину</button>` : ''}
                    ${user && user.id !== product.sellerId ? `<button class="btn btn-danger" id="reportProductBtn"><i class="fas fa-flag"></i> Пожаловаться</button>` : ''}
                    ${user && user.id === product.sellerId ? `<button class="btn btn-danger" id="deleteMyProductBtn"><i class="fas fa-trash"></i> Удалить товар</button>` : ''}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('closeModal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    const buyNowBtn = document.getElementById('buyNowBtn');
    if (buyNowBtn) {
        buyNowBtn.onclick = () => {
            modal.remove();
            buyProduct(product);
        };
    }

    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
        addToCartBtn.onclick = () => {
            addToCart(product);
            modal.remove();
        };
    }

    const reportProductBtn = document.getElementById('reportProductBtn');
    if (reportProductBtn) {
        reportProductBtn.onclick = () => {
            const reason = prompt('Причина жалобы:');
            if (reason && reason.trim()) {
                submitReport('product', product.id, product.sellerId, reason.trim());
                alert('Жалоба отправлена');
                modal.remove();
            }
        };
    }

    const deleteMyProductBtn = document.getElementById('deleteMyProductBtn');
    if (deleteMyProductBtn) {
        deleteMyProductBtn.onclick = () => {
            if (confirm('Удалить товар?')) {
                const products = getData('products').filter(p => p.id !== product.id);
                setData('products', products);
                alert('Товар удалён');
                modal.remove();
                location.reload();
            }
        };
    }
}

// ==================== ПОКУПКА ====================
function buyProduct(product) {
    const user = getCurrentUser();
    if (!user) { alert('Войдите в аккаунт'); window.location.href = 'login.html'; return; }
    if (product.quantity <= 0) { alert('Товар закончился'); return; }
    if (product.sellerId === user.id) { alert('Нельзя купить свой товар'); return; }

    const quantity = parseInt(prompt(`Сколько штук купить? (доступно: ${product.quantity})`, '1'));
    if (!quantity || quantity <= 0 || quantity > product.quantity) { alert('Неверное количество'); return; }

    const orders = getData('orders');
    const order = {
        id: Date.now(),
        productId: product.id,
        productTitle: product.title,
        productImage: product.image || null,
        productIcon: product.icon || 'fa-cube',
        price: product.price,
        quantity: quantity,
        total: product.price * quantity,
        buyerId: user.id,
        buyerName: user.name,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    orders.push(order);
    setData('orders', orders);

    // Создаём чат
    const chats = getData('chats');
    const chat = {
        id: Date.now(),
        orderId: order.id,
        buyerId: user.id,
        sellerId: product.sellerId,
        productId: product.id,
        productTitle: product.title,
        productImage: product.image || null,
        productIcon: product.icon || 'fa-cube',
        productPrice: product.price,
        messages: [{
            id: 1,
            userId: user.id,
            text: `Здравствуйте! Я купил "${product.title}" (${quantity} шт). Жду подтверждения.`,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        }]
    };
    chats.push(chat);
    setData('chats', chats);

    alert('Заказ оформлен! Чат с продавцом открыт.');
    window.location.href = `chat.html?chatId=${chat.id}`;
}

function addToCart(product) {
    const user = getCurrentUser();
    if (!user) { alert('Войдите в аккаунт'); window.location.href = 'login.html'; return; }
    if (product.quantity <= 0) { alert('Товар закончился'); return; }

    const cart = getData('cart');
    const existing = cart.find(i => i.productId === product.id);
    if (existing) {
        if (existing.quantity < product.quantity) existing.quantity++;
        else { alert('Достигнуто максимальное количество'); return; }
    } else {
        cart.push({ productId: product.id, quantity: 1 });
    }
    setData('cart', cart);
    updateHeader();
    alert('Товар добавлен в корзину');
}

// ==================== КОРЗИНА ====================
function initCart() {
    const cartItemsEl = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!cartItemsEl) return;

    const user = getCurrentUser();
    if (!user) { cartItemsEl.innerHTML = '<div class="empty-state"><p>Войдите, чтобы использовать корзину</p></div>'; return; }

    const cart = getData('cart');
    const products = getData('products');

    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-cart"></i><p>Корзина пуста</p></div>';
        return;
    }

    let total = 0;
    cartItemsEl.innerHTML = cart.map(item => {
        const p = products.find(x => x.id === item.productId);
        if (!p) return '';
        const subtotal = p.price * item.quantity;
        total += subtotal;
        return `
            <div class="cart-item">
                <div class="cart-item-image">${p.image ? `<img src="${p.image}">` : `<i class="fas ${p.icon || 'fa-cube'}"></i>`}</div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${p.title}</div>
                    <div class="cart-item-price">${p.price.toLocaleString('ru-RU')} ₽ × ${item.quantity} = ${subtotal.toLocaleString('ru-RU')} ₽</div>
                    <div style="font-size: 12px; color: var(--color-text-muted);">Продавец: ${p.sellerName}</div>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="changeCartQty(${p.id}, -1)">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="changeCartQty(${p.id}, 1)">+</button>
                    </div>
                    <button class="btn btn-danger btn-small" onclick="removeFromCart(${p.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');

    cartTotal.textContent = total.toLocaleString('ru-RU') + ' ₽';
    cartSummary.style.display = 'flex';

    if (checkoutBtn) {
        checkoutBtn.onclick = () => checkoutCart();
    }
}

window.changeCartQty = function(productId, delta) {
    const cart = getData('cart');
    const item = cart.find(i => i.productId === productId);
    const product = getData('products').find(p => p.id === productId);
    if (!item || !product) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        const idx = cart.indexOf(item);
        cart.splice(idx, 1);
    } else if (item.quantity > product.quantity) {
        item.quantity = product.quantity;
        alert('Достигнуто максимальное количество');
    }
    setData('cart', cart);
    updateHeader();
    initCart();
};

window.removeFromCart = function(productId) {
    const cart = getData('cart').filter(i => i.productId !== productId);
    setData('cart', cart);
    updateHeader();
    initCart();
};

function checkoutCart() {
    const user = getCurrentUser();
    if (!user) return;

    const cart = getData('cart');
    const products = getData('products');
    const orders = getData('orders');
    const chats = getData('chats');

    if (cart.length === 0) return;

    let total = 0;
    const newOrders = [];
    const newChats = [];

    cart.forEach(item => {
        const p = products.find(x => x.id === item.productId);
        if (!p || p.quantity < item.quantity) return;
        if (p.sellerId === user.id) return;

        const order = {
            id: Date.now() + Math.random(),
            productId: p.id,
            productTitle: p.title,
            productImage: p.image || null,
            productIcon: p.icon || 'fa-cube',
            price: p.price,
            quantity: item.quantity,
            total: p.price * item.quantity,
            buyerId: user.id,
            buyerName: user.name,
            sellerId: p.sellerId,
            sellerName: p.sellerName,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        newOrders.push(order);
        total += order.total;

        const chat = {
            id: Date.now() + Math.random(),
            orderId: order.id,
            buyerId: user.id,
            sellerId: p.sellerId,
            productId: p.id,
            productTitle: p.title,
            productImage: p.image || null,
            productIcon: p.icon || 'fa-cube',
            productPrice: p.price,
            messages: [{
                id: 1,
                userId: user.id,
                text: `Здравствуйте! Я купил "${p.title}" (${item.quantity} шт). Жду подтверждения.`,
                time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            }]
        };
        newChats.push(chat);
    });

    if (newOrders.length === 0) { alert('Нет доступных товаров для покупки'); return; }

    orders.push(...newOrders);
    chats.push(...newChats);
    setData('orders', orders);
    setData('chats', chats);
    setData('cart', []);

    alert(`Заказ оформлен! Сумма: ${total.toLocaleString('ru-RU')} ₽`);
    updateHeader();
    window.location.href = `chat.html?chatId=${newChats[0].id}`;
}

// ==================== КАТАЛОГ ====================
function initCatalog() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilters = document.getElementById('categoryFilters');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const applyBtn = document.getElementById('applyFilters');
    const sortSelect = document.getElementById('sortSelect');
    const productsGrid = document.getElementById('productsGrid');
    const inStockOnly = document.getElementById('inStockOnly');

    if (!productsGrid) return;

    if (categoryFilters) {
        const categories = getData('categories');
        categoryFilters.innerHTML = categories.map(cat => `
            <label><input type="checkbox" value="${cat.id}" class="category-checkbox"> ${cat.name}</label>
        `).join('');
    }

    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get('category');
    const urlSearch = params.get('search');

    if (urlSearch && searchInput) searchInput.value = urlSearch;

    function loadAndRender() {
        let products = getData('products');
        const selectedCategories = Array.from(document.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
        const search = (searchInput?.value || '').toLowerCase();
        const min = parseFloat(minPrice?.value) || 0;
        const max = parseFloat(maxPrice?.value) || Infinity;
        const onlyInStock = inStockOnly?.checked || false;

        products = products.filter(p => {
            const matchCat = selectedCategories.length === 0 || selectedCategories.includes(p.category);
            const matchSearch = !search || p.title.toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search);
            const matchPrice = p.price >= min && p.price <= max;
            const matchStock = !onlyInStock || p.quantity > 0;
            return matchCat && matchSearch && matchPrice && matchStock;
        });

        const sort = sortSelect?.value || 'popular';
        if (sort === 'price-asc') products.sort((a, b) => a.price - b.price);
        else if (sort === 'price-desc') products.sort((a, b) => b.price - a.price);
        else if (sort === 'name') products.sort((a, b) => a.title.localeCompare(b.title));

        renderProducts('productsGrid', products);
    }

    if (urlCategory && categoryFilters) {
        const cb = categoryFilters.querySelector(`input[value="${urlCategory}"]`);
        if (cb) cb.checked = true;
    }

    if (applyBtn) applyBtn.addEventListener('click', loadAndRender);
    if (sortSelect) sortSelect.addEventListener('change', loadAndRender);
    if (inStockOnly) inStockOnly.addEventListener('change', loadAndRender);

    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(loadAndRender, 300);
        });
    }

    loadAndRender();
}

// ==================== ПРОФИЛЬ ====================
function initProfile() {
    const navLinks = document.querySelectorAll('.profile-nav-link');
    const sections = document.querySelectorAll('.profile-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href').substring(1);
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(target)?.classList.add('active');
        });
    });

    const user = getCurrentUser();
    if (!user) return;

    const sidebarName = document.getElementById('sidebarUserName');
    if (sidebarName) sidebarName.textContent = user.name;

    const avatarDisplay = document.getElementById('userAvatarDisplay');
    if (avatarDisplay && user.avatar) {
        avatarDisplay.innerHTML = `<img src="${user.avatar}" alt="avatar">`;
    }

    const nameInput = document.getElementById('profileName');
    const emailInput = document.getElementById('profileEmail');
    const phoneInput = document.getElementById('profilePhone');
    const bioInput = document.getElementById('profileBio');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (bioInput) bioInput.value = user.bio || '';

    renderMyProducts(user);
    renderSales(user);
    renderPurchases(user);

    // Профиль форма
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const users = getData('users');
            const idx = users.findIndex(u => u.id === user.id);
            if (idx !== -1) {
                users[idx].name = document.getElementById('profileName').value;
                users[idx].email = document.getElementById('profileEmail').value;
                users[idx].phone = document.getElementById('profilePhone').value;
                users[idx].bio = document.getElementById('profileBio').value;
                setData('users', users);
                localStorage.setItem('currentUser', JSON.stringify(users[idx]));
                alert('Профиль сохранён');
                updateHeader();
                if (sidebarName) sidebarName.textContent = users[idx].name;
            }
        });
    }

    // Аватар и фон
    const avatarInput = document.getElementById('avatarInput');
    const bgInput = document.getElementById('bgInput');
    const previewAvatar = document.getElementById('previewAvatar');
    const previewBg = document.getElementById('previewBg');
    const removeAvatarBtn = document.getElementById('removeAvatarBtn');
    const removeBgBtn = document.getElementById('removeBgBtn');
    const saveAppearanceBtn = document.getElementById('saveAppearanceBtn');

    let tempAvatar = user.avatar;
    let tempBg = user.background;

    if (previewAvatar && user.avatar) previewAvatar.innerHTML = `<img src="${user.avatar}" style="width: 100%; height: 100%; object-fit: cover;">`;
    if (previewBg && user.background) previewBg.innerHTML = `<img src="${user.background}" style="width: 100%; height: 100%; object-fit: cover;">`;

    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                tempAvatar = ev.target.result;
                previewAvatar.innerHTML = `<img src="${tempAvatar}" style="width: 100%; height: 100%; object-fit: cover;">`;
            };
            reader.readAsDataURL(file);
        });
    }

    if (bgInput) {
        bgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                tempBg = ev.target.result;
                previewBg.innerHTML = `<img src="${tempBg}" style="width: 100%; height: 100%; object-fit: cover;">`;
            };
            reader.readAsDataURL(file);
        });
    }

    if (removeAvatarBtn) {
        removeAvatarBtn.onclick = () => {
            tempAvatar = null;
            previewAvatar.innerHTML = '<i class="fas fa-user"></i>';
            avatarInput.value = '';
        };
    }

    if (removeBgBtn) {
        removeBgBtn.onclick = () => {
            tempBg = null;
            previewBg.innerHTML = '<span style="color: var(--color-text-muted);">Фон не установлен</span>';
            bgInput.value = '';
        };
    }

    if (saveAppearanceBtn) {
        saveAppearanceBtn.onclick = () => {
            const users = getData('users');
            const idx = users.findIndex(u => u.id === user.id);
            if (idx !== -1) {
                users[idx].avatar = tempAvatar;
                users[idx].background = tempBg;
                setData('users', users);
                localStorage.setItem('currentUser', JSON.stringify(users[idx]));
                alert('Внешний вид сохранён');
                location.reload();
            }
        };
    }

    // Добавление товара с изображением
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        const categorySelect = document.getElementById('productCategory');
        if (categorySelect) {
            const categories = getData('categories');
            categorySelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }

        const productImageInput = document.getElementById('productImage');
        const imagePreview = document.getElementById('imagePreview');
        let tempProductImage = null;

        if (productImageInput) {
            productImageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    tempProductImage = ev.target.result;
                    imagePreview.innerHTML = `<img src="${tempProductImage}" style="max-width: 200px; border-radius: var(--radius-sm); border: 2px solid var(--color-border);">`;
                };
                reader.readAsDataURL(file);
            });
        }

        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('productTitle').value.trim();
            const category = document.getElementById('productCategory').value;
            const price = parseFloat(document.getElementById('productPrice').value);
            const quantity = parseInt(document.getElementById('productQuantity').value);
            const description = document.getElementById('productDescription').value;
            const delivery = document.getElementById('productDelivery').value;

            if (!title || !price || isNaN(quantity)) { alert('Заполните обязательные поля'); return; }

            const products = getData('products');
            const categories = getData('categories');
            const cat = categories.find(c => c.id === category);

            const newProduct = {
                id: Date.now(),
                title, price, category,
                categoryName: cat?.name || category,
                description, quantity, delivery,
                sellerId: user.id,
                sellerName: user.name,
                icon: cat?.icon || 'fa-cube',
                image: tempProductImage,
                createdAt: new Date().toISOString()
            };

            products.push(newProduct);
            setData('products', products);
            alert('Товар добавлен!');
            addProductForm.reset();
            imagePreview.innerHTML = '';
            tempProductImage = null;
            renderMyProducts(user);
        });
    }

    // Доставка
    loadDeliverySettings(user);
    const deliveryForm = document.getElementById('deliveryForm');
    if (deliveryForm) {
        deliveryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const deliveryMethods = [];
            const courierEnabled = document.getElementById('courierEnabled').checked;
            if (courierEnabled) {
                deliveryMethods.push({
                    type: 'courier',
                    name: 'Курьерская доставка',
                    price: parseFloat(document.getElementById('courierPrice').value) || 0,
                    time: document.getElementById('courierTime').value
                });
            }
            document.querySelectorAll('.pickup-point').forEach(point => {
                if (point.querySelector('.pickup-enabled').checked) {
                    deliveryMethods.push({
                        type: 'pickup',
                        name: point.querySelector('.pickup-name').value,
                        address: point.querySelector('.pickup-address').value,
                        price: parseFloat(point.querySelector('.pickup-price').value) || 0
                    });
                }
            });
            const users = getData('users');
            const idx = users.findIndex(u => u.id === user.id);
            if (idx !== -1) {
                users[idx].deliveryMethods = deliveryMethods;
                setData('users', users);
                localStorage.setItem('currentUser', JSON.stringify(users[idx]));
                alert('Настройки доставки сохранены');
            }
        });
    }

    const addPickupBtn = document.getElementById('addPickupBtn');
    if (addPickupBtn) {
        addPickupBtn.addEventListener('click', () => {
            const container = document.getElementById('pickupPointsContainer');
            const point = document.createElement('div');
            point.className = 'pickup-point';
            point.innerHTML = `
                <div class="pickup-point-header">
                    <label class="checkbox-label"><input type="checkbox" class="pickup-enabled" checked><span>Активен</span></label>
                    <button type="button" class="btn-remove" onclick="this.closest('.pickup-point').remove()"><i class="fas fa-trash"></i></button>
                </div>
                <div class="form-group"><label>Название пункта</label><input type="text" class="pickup-name" placeholder="СДЭК, Почта России" required></div>
                <div class="form-group"><label>Адрес</label><input type="text" class="pickup-address" placeholder="ул. Примерная, д. 1" required></div>
                <div class="form-group"><label>Стоимость (₽)</label><input type="number" class="pickup-price" placeholder="0" min="0" step="10"></div>
            `;
            container.appendChild(point);
        });
    }

    // Смена пароля
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const current = document.getElementById('currentPassword').value;
            const newPass = document.getElementById('newPassword').value;
            const confirm = document.getElementById('confirmPassword').value;

            if (current !== user.password) { alert('Неверный текущий пароль'); return; }
            if (newPass !== confirm) { alert('Пароли не совпадают'); return; }
            if (newPass.length < 8) { alert('Минимум 8 символов'); return; }
            if (!/[0-9]/.test(newPass)) { alert('Нужна цифра'); return; }
            if (!/[A-ZА-ЯЁ]/.test(newPass)) { alert('Нужна заглавная буква'); return; }

            const users = getData('users');
            const idx = users.findIndex(u => u.id === user.id);
            if (idx !== -1) {
                users[idx].password = newPass;
                setData('users', users);
                localStorage.setItem('currentUser', JSON.stringify(users[idx]));
                alert('Пароль изменён');
                settingsForm.reset();
            }
        });
    }
}

function renderMyProducts(user) {
    const grid = document.getElementById('myProductsGrid');
    if (!grid) return;
    const products = getData('products').filter(p => p.sellerId === user.id);
    if (products.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>У вас нет товаров. Добавьте первый!</p></div>';
        return;
    }
    renderProducts('myProductsGrid', products);
}

function renderSales(user) {
    const container = document.getElementById('salesContent');
    if (!container) return;
    const orders = getData('orders').filter(o => o.sellerId === user.id);
    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-hand-holding-usd"></i><p>У вас пока нет продаж</p></div>';
        return;
    }
    container.innerHTML = orders.map(o => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div style="font-weight: 700; font-size: 18px; color: var(--color-white);">${o.productTitle}</div>
                    <div style="font-size: 13px; color: var(--color-text-muted);">Покупатель: ${o.buyerName} • ${new Date(o.createdAt).toLocaleString('ru-RU')}</div>
                </div>
                <span class="order-status ${o.status}">${o.status === 'pending' ? 'Ожидает' : o.status === 'confirmed' ? 'Подтверждено' : 'Завершено'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div>
                    <div style="font-size: 14px; color: var(--color-text-secondary);">Количество: <strong>${o.quantity} шт</strong></div>
                    <div style="font-size: 22px; font-weight: 800; color: var(--color-lime);">${o.total.toLocaleString('ru-RU')} ₽</div>
                </div>
                <div style="display: flex; gap: 10px;">
                    ${o.status === 'pending' ? `<button class="btn btn-success" onclick="confirmSale(${o.id})"><i class="fas fa-check"></i> Подтвердить продажу</button>` : ''}
                    <button class="btn btn-secondary" onclick="openChatByOrder(${o.id})"><i class="fas fa-comments"></i> Чат</button>
                </div>
            </div>
        </div>
    `).join('');
}

window.confirmSale = function(orderId) {
    if (!confirm('Подтвердить продажу? Количество товара уменьшится.')) return;
    const orders = getData('orders');
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    order.status = 'confirmed';
    setData('orders', orders);

    // Уменьшаем количество товара
    const products = getData('products');
    const product = products.find(p => p.id === order.productId);
    if (product) {
        product.quantity -= order.quantity;
        if (product.quantity <= 0) {
            // Удаляем товар если 0
            const idx = products.indexOf(product);
            products.splice(idx, 1);
        }
        setData('products', products);
    }

    alert('Продажа подтверждена!');
    const user = getCurrentUser();
    renderSales(user);
    renderMyProducts(user);
};

window.openChatByOrder = function(orderId) {
    const chats = getData('chats');
    const chat = chats.find(c => c.orderId === orderId);
    if (chat) window.location.href = `chat.html?chatId=${chat.id}`;
    else alert('Чат не найден');
};

function renderPurchases(user) {
    const container = document.getElementById('purchasesContent');
    if (!container) return;
    const orders = getData('orders').filter(o => o.buyerId === user.id);
    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><p>У вас пока нет покупок</p></div>';
        return;
    }
    container.innerHTML = orders.map(o => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div style="font-weight: 700; font-size: 18px; color: var(--color-white);">${o.productTitle}</div>
                    <div style="font-size: 13px; color: var(--color-text-muted);">Продавец: ${o.sellerName} • ${new Date(o.createdAt).toLocaleString('ru-RU')}</div>
                </div>
                <span class="order-status ${o.status}">${o.status === 'pending' ? 'Ожидает' : o.status === 'confirmed' ? 'Подтверждено' : 'Завершено'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div>
                    <div style="font-size: 14px; color: var(--color-text-secondary);">Количество: <strong>${o.quantity} шт</strong></div>
                    <div style="font-size: 22px; font-weight: 800; color: var(--color-lime);">${o.total.toLocaleString('ru-RU')} ₽</div>
                </div>
                <button class="btn btn-secondary" onclick="openChatByOrder(${o.id})"><i class="fas fa-comments"></i> Чат с продавцом</button>
            </div>
        </div>
    `).join('');
}

function loadDeliverySettings(user) {
    const methods = user.deliveryMethods || [];
    const courierEnabled = document.getElementById('courierEnabled');
    const courierPrice = document.getElementById('courierPrice');
    const courierTime = document.getElementById('courierTime');

    if (courierEnabled && courierPrice && courierTime) {
        const courier = methods.find(m => m.type === 'courier');
        if (courier) {
            courierEnabled.checked = true;
            courierPrice.value = courier.price;
            courierTime.value = courier.time || '';
        }
    }

    const container = document.getElementById('pickupPointsContainer');
    if (container) {
        container.innerHTML = '';
        methods.filter(m => m.type === 'pickup').forEach(point => {
            const div = document.createElement('div');
            div.className = 'pickup-point';
            div.innerHTML = `
                <div class="pickup-point-header">
                    <label class="checkbox-label"><input type="checkbox" class="pickup-enabled" checked><span>Активен</span></label>
                    <button type="button" class="btn-remove" onclick="this.closest('.pickup-point').remove()"><i class="fas fa-trash"></i></button>
                </div>
                <div class="form-group"><label>Название</label><input type="text" class="pickup-name" value="${point.name}" required></div>
                <div class="form-group"><label>Адрес</label><input type="text" class="pickup-address" value="${point.address}" required></div>
                <div class="form-group"><label>Стоимость (₽)</label><input type="number" class="pickup-price" value="${point.price}" min="0" step="10"></div>
            `;
            container.appendChild(div);
        });
    }
}

// ==================== ПРОДАВЦЫ ====================
function initSellers() {
    const grid = document.getElementById('sellersGrid');
    if (!grid) return;

    const products = getData('products');
    const users = getData('users');
    const sellersMap = {};
    products.forEach(p => {
        if (p.sellerId) {
            if (!sellersMap[p.sellerId]) sellersMap[p.sellerId] = { name: p.sellerName, count: 0, id: p.sellerId };
            sellersMap[p.sellerId].count++;
        }
    });

    const sellers = Object.values(sellersMap);
    if (sellers.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-store"></i><p>Пока нет продавцов</p></div>';
        return;
    }

    grid.innerHTML = sellers.map(s => {
        const user = users.find(u => u.id === s.id);
        return `
            <a href="seller.html?id=${s.id}" class="seller-card">
                <div class="seller-card-header">
                    <div class="seller-card-avatar">${user?.avatar ? `<img src="${user.avatar}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-store"></i>`}</div>
                    <div class="seller-card-name">${s.name}</div>
                </div>
                <div class="seller-card-stats">
                    <span><i class="fas fa-box"></i> ${s.count} товаров</span>
                </div>
            </a>
        `;
    }).join('');
}

// ==================== СТРАНИЦА ПРОДАВЦА ====================
function initSellerPage() {
    const params = new URLSearchParams(window.location.search);
    const sellerId = parseInt(params.get('id'));
    if (!sellerId) return;

    const users = getData('users');
    const seller = users.find(u => u.id === sellerId);
    if (!seller) {
        document.querySelector('.container').innerHTML = '<div class="empty-state"><p>Продавец не найден</p></div>';
        return;
    }

    const title = document.getElementById('sellerTitle');
    const bio = document.getElementById('sellerBio');
    const nameBc = document.getElementById('sellerNameBc');
    const avatar = document.getElementById('sellerAvatar');
    const bg = document.getElementById('sellerBg');

    if (title) title.textContent = seller.name;
    if (bio) bio.textContent = seller.bio || 'Описание не указано';
    if (nameBc) nameBc.textContent = seller.name;

    if (avatar) {
        avatar.innerHTML = seller.avatar ? `<img src="${seller.avatar}" style="width: 100%; height: 100%; object-fit: cover;">` : '<i class="fas fa-store"></i>';
    }
    if (bg) {
        bg.style.background = seller.background ? `url(${seller.background}) center/cover` : 'var(--bg-tertiary)';
    }

    const products = getData('products').filter(p => p.sellerId === sellerId);
    renderProducts('sellerProductsGrid', products);

    const reportBtn = document.getElementById('reportSellerBtn');
    if (reportBtn) {
        const user = getCurrentUser();
        if (user && user.id === sellerId) reportBtn.style.display = 'none';
        reportBtn.onclick = () => {
            const reason = prompt('Причина жалобы на продавца:');
            if (reason && reason.trim()) {
                submitReport('seller', sellerId, sellerId, reason.trim());
                alert('Жалоба отправлена');
            }
        };
    }
}

// ==================== ЖАЛОБЫ ====================
function submitReport(type, targetId, reportedUserId, reason) {
    const user = getCurrentUser();
    if (!user) return;
    const reports = getData('reports');
    reports.push({
        id: Date.now(),
        type,
        targetId,
        reportedUserId,
        reporterId: user.id,
        reporterName: user.name,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString()
    });
    setData('reports', reports);
}

// ==================== ЧАТ ====================
function initChat() {
    const messagesContainer = document.getElementById('chatMessages');
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    const chatTitle = document.getElementById('chatTitle');
    const chatProductInfo = document.getElementById('chatProductInfo');

    if (!messagesContainer) return;

    const user = getCurrentUser();
    if (!user) {
        messagesContainer.innerHTML = '<div class="empty-state"><p>Войдите, чтобы использовать чат</p></div>';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const chatId = parseFloat(params.get('chatId'));

    const chats = getData('chats');
    const chat = chats.find(c => c.id === chatId);

    if (!chat) {
        messagesContainer.innerHTML = '<div class="empty-state"><p>Чат не найден</p></div>';
        return;
    }

    if (chat.buyerId !== user.id && chat.sellerId !== user.id) {
        messagesContainer.innerHTML = '<div class="empty-state"><p>У вас нет доступа к этому чату</p></div>';
        return;
    }

    const otherUser = getData('users').find(u => u.id === (chat.buyerId === user.id ? chat.sellerId : chat.buyerId));
    if (chatTitle) chatTitle.textContent = `Чат с ${otherUser?.name || 'пользователем'}`;

    if (chatProductInfo) {
        chatProductInfo.style.display = 'block';
        const imgEl = document.getElementById('chatProductImage');
        const titleEl = document.getElementById('chatProductTitle');
        const priceEl = document.getElementById('chatProductPrice');
        if (imgEl) {
            imgEl.innerHTML = chat.productImage ? `<img src="${chat.productImage}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas ${chat.productIcon || 'fa-cube'}"></i>`;
        }
        if (titleEl) titleEl.textContent = chat.productTitle;
        if (priceEl) priceEl.textContent = `${chat.productPrice.toLocaleString('ru-RU')} ₽`;
    }

    function renderMessages() {
        const currentChats = getData('chats');
        const currentChat = currentChats.find(c => c.id === chatId);
        if (!currentChat) return;
        messagesContainer.innerHTML = currentChat.messages.map(m => `
            <div class="chat-message ${m.userId === user.id ? 'own' : ''}">
                <div>${m.text}</div>
                <div class="meta">${m.time}</div>
            </div>
        `).join('');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        const currentChats = getData('chats');
        const currentChat = currentChats.find(c => c.id === chatId);
        if (!currentChat) return;

        currentChat.messages.push({
            id: Date.now(),
            userId: user.id,
            text,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        });
        setData('chats', currentChats);
        input.value = '';
        renderMessages();
    }

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    const reportChatBtn = document.getElementById('reportChatBtn');
    if (reportChatBtn) {
        reportChatBtn.onclick = () => {
            const otherUserId = chat.buyerId === user.id ? chat.sellerId : chat.buyerId;
            const reason = prompt('Причина жалобы:');
            if (reason && reason.trim()) {
                submitReport('user', otherUserId, otherUserId, reason.trim());
                alert('Жалоба отправлена');
            }
        };
    }

    renderMessages();
}

// ==================== АДМИНКА ====================
function initAdmin() {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') { window.location.href = 'index.html'; return; }

    const navLinks = document.querySelectorAll('.admin-nav-link');
    const sections = document.querySelectorAll('.admin-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href').substring(1);
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(target)?.classList.add('active');
        });
    });

    const usersBody = document.getElementById('usersTableBody');
    if (usersBody) {
        const users = getData('users');
        usersBody.innerHTML = users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td><span class="badge badge-${u.role || 'user'}">${u.role || 'user'}</span></td>
                <td>
                    ${u.role !== 'admin' ? `<button class="btn btn-danger btn-small" onclick="adminDeleteUser(${u.id})"><i class="fas fa-trash"></i></button>` : '-'}
                </td>
            </tr>
        `).join('');
    }

    const productsBody = document.getElementById('productsTableBody');
    if (productsBody) {
        const products = getData('products');
        productsBody.innerHTML = products.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${p.title}</td>
                <td>${p.price.toLocaleString('ru-RU')} ₽</td>
                <td>${p.categoryName || p.category}</td>
                <td>${p.quantity} шт</td>
                <td>${p.sellerName || '-'}</td>
                <td><button class="btn btn-danger btn-small" onclick="adminDeleteProduct(${p.id})"><i class="fas fa-trash"></i></button></td>
            </tr>
        `).join('');
    }

    const reportsContent = document.getElementById('reportsContent');
    if (reportsContent) {
        const reports = getData('reports');
        if (reports.length === 0) {
            reportsContent.innerHTML = '<div class="empty-state"><i class="fas fa-flag"></i><p>Жалоб нет</p></div>';
        } else {
            reportsContent.innerHTML = reports.map(r => {
                const reported = getData('users').find(u => u.id === r.reportedUserId);
                return `
                    <div class="report-card">
                        <div class="report-header">
                            <div>
                                <div style="font-weight: 700;">Жалоба на: ${reported?.name || 'Неизвестно'} (${r.type})</div>
                                <div style="font-size: 13px; color: var(--color-text-muted);">От: ${r.reporterName} • ${new Date(r.createdAt).toLocaleString('ru-RU')}</div>
                            </div>
                            <span class="report-type">${r.type === 'product' ? 'Товар' : r.type === 'seller' ? 'Продавец' : 'Пользователь'}</span>
                        </div>
                        <div style="margin-bottom: 15px; padding: 15px; background: var(--bg-card); border-radius: var(--radius-xs); border-left: 3px solid var(--color-danger);">
                            <strong>Причина:</strong> ${r.reason}
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-danger btn-small" onclick="adminResolveReport(${r.id}, 'ban')"><i class="fas fa-ban"></i> Забанить</button>
                            <button class="btn btn-secondary btn-small" onclick="adminResolveReport(${r.id}, 'dismiss')"><i class="fas fa-times"></i> Отклонить</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    const adminOrdersContent = document.getElementById('adminOrdersContent');
    if (adminOrdersContent) {
        const orders = getData('orders');
        if (orders.length === 0) {
            adminOrdersContent.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><p>Заказов нет</p></div>';
        } else {
            adminOrdersContent.innerHTML = orders.map(o => `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <div style="font-weight: 700;">${o.productTitle}</div>
                            <div style="font-size: 13px; color: var(--color-text-muted);">Покупатель: ${o.buyerName} • Продавец: ${o.sellerName}</div>
                        </div>
                        <span class="order-status ${o.status}">${o.status}</span>
                    </div>
                    <div>Количество: ${o.quantity} шт • Сумма: ${o.total.toLocaleString('ru-RU')} ₽</div>
                </div>
            `).join('');
        }
    }

    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.setItem('currentUser', 'null');
            window.location.href = 'index.html';
        });
    }
}

window.adminDeleteUser = function(id) {
    if (!confirm('Удалить пользователя?')) return;
    const users = getData('users').filter(u => u.id !== id);
    setData('users', users);
    initAdmin();
};

window.adminDeleteProduct = function(id) {
    if (!confirm('Удалить товар?')) return;
    const products = getData('products').filter(p => p.id !== id);
    setData('products', products);
    initAdmin();
};

window.adminResolveReport = function(id, action) {
    const reports = getData('reports');
    const report = reports.find(r => r.id === id);
    if (!report) return;

    if (action === 'ban') {
        const users = getData('users');
        const idx = users.findIndex(u => u.id === report.reportedUserId);
        if (idx !== -1) {
            users.splice(idx, 1);
            setData('users', users);
            alert('Пользователь забанен (удалён)');
        }
    }

    report.status = action;
    setData('reports', reports.filter(r => r.id !== id));
    initAdmin();
};

// ==================== ПОИСК В ШАПКЕ ====================
function doHeaderSearch() {
    const searchInput = document.getElementById('headerSearch');
    if (!searchInput) return;
    const query = searchInput.value.trim();
    if (query) window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
}

// ==================== ВЫХОД ====================
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.setItem('currentUser', 'null');
            window.location.href = 'index.html';
        });
    }
}

// ==================== ЗАПУСК ====================
document.addEventListener('DOMContentLoaded', () => {
    initData();
    updateHeader();
    initScrollAnimations();
    initLogout();

    if (document.getElementById('categoriesGrid')) renderCategories('categoriesGrid');
    if (document.getElementById('productsGrid') && document.getElementById('searchInput')) initCatalog();
    if (document.getElementById('productsGrid') && !document.getElementById('searchInput') && !document.getElementById('sellerProductsGrid') && !document.getElementById('myProductsGrid')) {
        const products = getData('products').filter(p => p.quantity > 0).slice(0, 8);
        renderProducts('productsGrid', products);
    }

    if (document.querySelector('.profile-layout')) {
        const user = getCurrentUser();
        if (!user) window.location.href = 'login.html';
        else initProfile();
    }

    if (document.querySelector('.admin-layout')) initAdmin();
    if (document.querySelector('.chat-container')) initChat();
    if (document.getElementById('sellersGrid')) initSellers();
    if (document.getElementById('sellerProductsGrid')) initSellerPage();
    if (document.getElementById('cartItems')) initCart();
});
