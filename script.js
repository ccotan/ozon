// ==================== ДАННЫЕ MINECRAFT ====================
const DEFAULT_CATEGORIES = [
    { id: 'ores', name: 'Руды и минералы', icon: 'fa-gem' },
    { id: 'blocks', name: 'Блоки', icon: 'fa-cube' },
    { id: 'tools', name: 'Инструменты', icon: 'fa-hammer' },
    { id: 'weapons', name: 'Оружие', icon: 'fa-khanda' },
    { id: 'armor', name: 'Броня', icon: 'fa-shield-halved' },
    { id: 'food', name: 'Еда', icon: 'fa-apple-whole' },
    { id: 'potions', name: 'Зелья', icon: 'fa-flask' },
    { id: 'redstone', name: 'Редстоун', icon: 'fa-microchip' },
    { id: 'decoration', name: 'Декор', icon: 'fa-palette' },
    { id: 'rare', name: 'Редкие предметы', icon: 'fa-crown' }
];

// ==================== ХРАНИЛИЩЕ ====================
function initData() {
    if (!localStorage.getItem('categories')) localStorage.setItem('categories', JSON.stringify(DEFAULT_CATEGORIES));
    if (!localStorage.getItem('products')) localStorage.setItem('products', JSON.stringify([]));
    if (!localStorage.getItem('users')) localStorage.setItem('users', JSON.stringify([]));
    if (!localStorage.getItem('sellers')) localStorage.setItem('sellers', JSON.stringify([]));
    if (!localStorage.getItem('orders')) localStorage.setItem('orders', JSON.stringify([]));
    if (!localStorage.getItem('chats')) localStorage.setItem('chats', JSON.stringify([]));
    if (!localStorage.getItem('currentUser')) localStorage.setItem('currentUser', 'null');
}

function getData(key) { return JSON.parse(localStorage.getItem(key) || '[]'); }
function setData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function getCurrentUser() {
    const u = localStorage.getItem('currentUser');
    return u === 'null' ? null : JSON.parse(u);
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

    if (user) {
        if (loginBtn) loginBtn.classList.add('hidden');
        if (profileBtn) { profileBtn.classList.remove('hidden'); if (userName) userName.textContent = user.name; }
        if (logoutBtn) logoutBtn.classList.remove('hidden');
    } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (profileBtn) profileBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
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
            <div class="product-image"><i class="fas ${p.icon || 'fa-cube'}"></i></div>
            <div class="product-info">
                <div class="product-category">${p.categoryName || ''}</div>
                <div class="product-title">${p.title}</div>
                <div class="product-price">${p.price.toLocaleString('ru-RU')} ₽</div>
                <div class="product-stock ${p.quantity > 0 ? '' : 'out'}">
                    <i class="fas ${p.quantity > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${p.quantity > 0 ? `В наличии: ${p.quantity} шт` : 'Нет в наличии'}
                </div>
                ${p.delivery ? `<div class="product-delivery"><i class="fas fa-truck"></i> ${p.delivery}</div>` : ''}
                ${p.sellerName ? `<div class="product-seller"><i class="fas fa-store"></i> ${p.sellerName}</div>` : ''}
            </div>
        </div>
    `).join('');
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

    const nameInput = document.getElementById('profileName');
    const emailInput = document.getElementById('profileEmail');
    const phoneInput = document.getElementById('profilePhone');
    const bioInput = document.getElementById('profileBio');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (bioInput) bioInput.value = user.bio || '';

    // Мои товары
    renderMyProducts(user);

    // Форма профиля
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

    // Добавление товара
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        const categorySelect = document.getElementById('productCategory');
        if (categorySelect) {
            const categories = getData('categories');
            categorySelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }

        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('productTitle').value.trim();
            const category = document.getElementById('productCategory').value;
            const price = parseFloat(document.getElementById('productPrice').value);
            const quantity = parseInt(document.getElementById('productQuantity').value);
            const description = document.getElementById('productDescription').value;
            const delivery = document.getElementById('productDelivery').value;

            if (!title || !price || isNaN(quantity)) {
                alert('Заполните обязательные поля');
                return;
            }

            const products = getData('products');
            const categories = getData('categories');
            const cat = categories.find(c => c.id === category);

            const newProduct = {
                id: Date.now(),
                title,
                price,
                category,
                categoryName: cat?.name || category,
                description,
                quantity,
                delivery,
                sellerId: user.id,
                sellerName: user.name,
                icon: cat?.icon || 'fa-cube',
                createdAt: new Date().toISOString()
            };

            products.push(newProduct);
            setData('products', products);
            alert('Товар добавлен!');
            addProductForm.reset();
            renderMyProducts(user);
        });
    }

    // Настройки доставки
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
                <div class="form-group">
                    <label>Название пункта</label>
                    <input type="text" class="pickup-name" placeholder="СДЭК, Почта России" required>
                </div>
                <div class="form-group">
                    <label>Адрес</label>
                    <input type="text" class="pickup-address" placeholder="ул. Примерная, д. 1" required>
                </div>
                <div class="form-group">
                    <label>Стоимость (₽)</label>
                    <input type="number" class="pickup-price" placeholder="0" min="0" step="10">
                </div>
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
    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="product-image"><i class="fas ${p.icon || 'fa-cube'}"></i></div>
            <div class="product-info">
                <div class="product-category">${p.categoryName || ''}</div>
                <div class="product-title">${p.title}</div>
                <div class="product-price">${p.price.toLocaleString('ru-RU')} ₽</div>
                <div class="product-stock ${p.quantity > 0 ? '' : 'out'}">
                    <i class="fas ${p.quantity > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${p.quantity > 0 ? `В наличии: ${p.quantity} шт` : 'Нет в наличии'}
                </div>
                <button class="btn btn-danger btn-small" style="margin-top: 10px;" onclick="deleteProduct(${p.id})">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        </div>
    `).join('');
}

window.deleteProduct = function(id) {
    if (!confirm('Удалить товар?')) return;
    const products = getData('products').filter(p => p.id !== id);
    setData('products', products);
    const user = getCurrentUser();
    renderMyProducts(user);
};

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

    grid.innerHTML = sellers.map(s => `
        <a href="seller.html?id=${s.id}" class="seller-card">
            <div class="seller-card-header">
                <div class="seller-card-avatar"><i class="fas fa-store"></i></div>
                <div class="seller-card-name">${s.name}</div>
            </div>
            <div class="seller-card-stats">
                <span><i class="fas fa-box"></i> ${s.count} товаров</span>
            </div>
        </a>
    `).join('');
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
            </tr>
        `).join('');
    }

    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.setItem('currentUser', 'null');
            window.location.href = 'index.html';
        });
    }
}

// ==================== ЧАТ ====================
function initChat() {
    const messagesContainer = document.getElementById('chatMessages');
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendMessageBtn');

    if (!messagesContainer) return;

    const user = getCurrentUser();
    if (!user) {
        messagesContainer.innerHTML = '<div class="empty-state"><p>Войдите, чтобы использовать чат</p></div>';
        return;
    }

    function renderMessages() {
        const chats = getData('chats');
        const userChats = chats.filter(c => c.userId === user.id || c.sellerId === user.id);
        messagesContainer.innerHTML = userChats.map(m => `
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

        const chats = getData('chats');
        chats.push({
            id: Date.now(),
            userId: user.id,
            sellerId: 1,
            text,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        });
        setData('chats', chats);
        input.value = '';
        renderMessages();
    }

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    renderMessages();
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

// ==================== ПОИСК В ШАПКЕ ====================
function initHeaderSearch() {
    const searchInput = document.getElementById('headerSearch');
    if (!searchInput) return;

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
            }
        }
    });
}

// ==================== ЗАПУСК ====================
document.addEventListener('DOMContentLoaded', () => {
    initData();
    updateHeader();
    initScrollAnimations();
    initLogout();
    initHeaderSearch();

    if (document.getElementById('categoriesGrid')) renderCategories('categoriesGrid');
    if (document.getElementById('productsGrid') && document.getElementById('searchInput')) initCatalog();
    if (document.getElementById('productsGrid') && !document.getElementById('searchInput')) {
        // Главная страница — показать популярные
        const products = getData('products').slice(0, 8);
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
});
