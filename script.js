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

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
function initData() {
    if (!localStorage.getItem('categories')) {
        localStorage.setItem('categories', JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem('products')) {
        localStorage.setItem('products', JSON.stringify([]));
    }
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('sellers')) {
        localStorage.setItem('sellers', JSON.stringify([]));
    }
    if (!localStorage.getItem('orders')) {
        localStorage.setItem('orders', JSON.stringify([]));
    }
    if (!localStorage.getItem('chats')) {
        localStorage.setItem('chats', JSON.stringify([]));
    }
    if (!localStorage.getItem('currentUser')) {
        localStorage.setItem('currentUser', 'null');
    }
}

function getData(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function setData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user === 'null' ? null : JSON.parse(user);
}

// ==================== АНИМАЦИИ ====================
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
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
        if (profileBtn) {
            profileBtn.classList.remove('hidden');
            if (userName) userName.textContent = user.name;
        }
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
            <div class="category-icon">
                <i class="fas ${cat.icon}"></i>
            </div>
            <span>${cat.name}</span>
        </a>
    `).join('');
}

// ==================== ТОВАРЫ ====================
function renderProducts(containerId, products = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-box-open"></i>
                <p>Товары не найдены</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <i class="fas ${product.icon || 'fa-cube'}"></i>
            </div>
            <div class="product-info">
                <div class="product-category">${product.categoryName || ''}</div>
                <div class="product-title">${product.title}</div>
                <div class="product-price">${product.price.toLocaleString('ru-RU')} ₽</div>
                ${product.delivery ? `<div class="product-delivery"><i class="fas fa-truck"></i> Доставка: ${product.delivery}</div>` : ''}
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

    if (!productsGrid) return;

    if (categoryFilters) {
        const categories = getData('categories');
        categoryFilters.innerHTML = categories.map(cat => `
            <label>
                <input type="checkbox" value="${cat.id}" class="category-checkbox">
                ${cat.name}
            </label>
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

        products = products.filter(p => {
            const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
            const matchSearch = !search || p.title.toLowerCase().includes(search);
            const matchPrice = p.price >= min && p.price <= max;
            return matchCategory && matchSearch && matchPrice;
        });

        const sort = sortSelect?.value || 'popular';
        if (sort === 'price-asc') products.sort((a, b) => a.price - b.price);
        else if (sort === 'price-desc') products.sort((a, b) => b.price - a.price);
        else if (sort === 'name') products.sort((a, b) => a.title.localeCompare(b.title));

        renderProducts('productsGrid', products);
    }

    if (urlCategory && categoryFilters) {
        const checkbox = categoryFilters.querySelector(`input[value="${urlCategory}"]`);
        if (checkbox) checkbox.checked = true;
    }

    if (applyBtn) applyBtn.addEventListener('click', loadAndRender);
    if (sortSelect) sortSelect.addEventListener('change', loadAndRender);

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
    if (user) {
        const nameInput = document.getElementById('profileName');
        const emailInput = document.getElementById('profileEmail');
        const phoneInput = document.getElementById('profilePhone');
        const bioInput = document.getElementById('profileBio');

        if (nameInput) nameInput.value = user.name || '';
        if (emailInput) emailInput.value = user.email || '';
        if (phoneInput) phoneInput.value = user.phone || '';
        if (bioInput) bioInput.value = user.bio || '';

        // Загрузка настроек доставки
        loadDeliverySettings(user);
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentUser = getCurrentUser();
            if (!currentUser) return;

            const users = getData('users');
            const idx = users.findIndex(u => u.id === currentUser.id);
            if (idx !== -1) {
                users[idx].name = document.getElementById('profileName').value;
                users[idx].email = document.getElementById('profileEmail').value;
                users[idx].phone = document.getElementById('profilePhone').value;
                users[idx].bio = document.getElementById('profileBio').value;
                setData('users', users);
                localStorage.setItem('currentUser', JSON.stringify(users[idx]));
                alert('Профиль сохранён');
                updateHeader();
            }
        });
    }

    // Сохранение настроек доставки
    const deliveryForm = document.getElementById('deliveryForm');
    if (deliveryForm) {
        deliveryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentUser = getCurrentUser();
            if (!currentUser) return;

            const deliveryMethods = [];
            
            // Курьерская доставка
            const courierEnabled = document.getElementById('courierEnabled').checked;
            if (courierEnabled) {
                deliveryMethods.push({
                    type: 'courier',
                    name: 'Курьерская доставка',
                    price: parseFloat(document.getElementById('courierPrice').value) || 0,
                    time: document.getElementById('courierTime').value
                });
            }

            // Пункты выдачи
            const pickupPoints = document.querySelectorAll('.pickup-point');
            pickupPoints.forEach(point => {
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
            const idx = users.findIndex(u => u.id === currentUser.id);
            if (idx !== -1) {
                users[idx].deliveryMethods = deliveryMethods;
                setData('users', users);
                localStorage.setItem('currentUser', JSON.stringify(users[idx]));
                alert('Настройки доставки сохранены');
            }
        });
    }

    // Добавление пункта выдачи
    const addPickupBtn = document.getElementById('addPickupBtn');
    if (addPickupBtn) {
        addPickupBtn.addEventListener('click', () => {
            const container = document.getElementById('pickupPointsContainer');
            const point = document.createElement('div');
            point.className = 'pickup-point';
            point.innerHTML = `
                <div class="pickup-point-header">
                    <label class="checkbox-label">
                        <input type="checkbox" class="pickup-enabled" checked>
                        <span>Активен</span>
                    </label>
                    <button type="button" class="btn-remove" onclick="this.closest('.pickup-point').remove()">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="form-group">
                    <label>Название пункта</label>
                    <input type="text" class="pickup-name" placeholder="СДЭК, Почта России и т.д." required>
                </div>
                <div class="form-group">
                    <label>Адрес</label>
                    <input type="text" class="pickup-address" placeholder="ул. Примерная, д. 1" required>
                </div>
                <div class="form-group">
                    <label>Стоимость доставки (₽)</label>
                    <input type="number" class="pickup-price" placeholder="0" min="0" step="10">
                </div>
            `;
            container.appendChild(point);
        });
    }

    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentUser = getCurrentUser();
            if (!currentUser) return;

            const current = document.getElementById('currentPassword').value;
            const newPass = document.getElementById('newPassword').value;
            const confirm = document.getElementById('confirmPassword').value;

            if (current !== currentUser.password) {
                alert('Неверный текущий пароль');
                return;
            }
            if (newPass !== confirm) {
                alert('Пароли не совпадают');
                return;
            }
            if (newPass.length < 8) {
                alert('Пароль должен быть минимум 8 символов');
                return;
            }

            const users = getData('users');
            const idx = users.findIndex(u => u.id === currentUser.id);
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
                    <label class="checkbox-label">
                        <input type="checkbox" class="pickup-enabled" checked>
                        <span>Активен</span>
                    </label>
                    <button type="button" class="btn-remove" onclick="this.closest('.pickup-point').remove()">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="form-group">
                    <label>Название пункта</label>
                    <input type="text" class="pickup-name" value="${point.name}" required>
                </div>
                <div class="form-group">
                    <label>Адрес</label>
                    <input type="text" class="pickup-address" value="${point.address}" required>
                </div>
                <div class="form-group">
                    <label>Стоимость доставки (₽)</label>
                    <input type="number" class="pickup-price" value="${point.price}" min="0" step="10">
                </div>
            `;
            container.appendChild(div);
        });
    }
}

// ==================== АДМИНКА ====================
function initAdmin() {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

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
        const categories = getData('categories');
        productsBody.innerHTML = products.map(p => {
            const cat = categories.find(c => c.id === p.category);
            return `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.title}</td>
                    <td>${p.price.toLocaleString('ru-RU')} ₽</td>
                    <td>${cat?.name || p.category}</td>
                    <td>${p.sellerName || '-'}</td>
                </tr>
            `;
        }).join('');
    }

    // Добавление товара
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        const categories = getData('categories');
        const categorySelect = document.getElementById('productCategory');
        if (categorySelect) {
            categorySelect.innerHTML = categories.map(c => 
                `<option value="${c.id}">${c.name}</option>`
            ).join('');
        }

        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('productTitle').value;
            const price = parseFloat(document.getElementById('productPrice').value);
            const category = document.getElementById('productCategory').value;
            const description = document.getElementById('productDescription').value;
            const quantity = parseInt(document.getElementById('productQuantity').value);
            const delivery = document.getElementById('productDelivery').value;

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
            alert('Товар добавлен');
            addProductForm.reset();
            initAdmin(); // Обновить таблицу
        });
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

// ==================== ЗАПУСК ====================
document.addEventListener('DOMContentLoaded', () => {
    initData();
    updateHeader();
    initScrollAnimations();
    initLogout();

    if (document.getElementById('categoriesGrid')) {
        renderCategories('categoriesGrid');
    }

    if (document.getElementById('productsGrid') && document.getElementById('searchInput')) {
        initCatalog();
    }

    if (document.querySelector('.profile-layout')) {
        const user = getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
        } else {
            initProfile();
        }
    }

    if (document.querySelector('.admin-layout')) {
        initAdmin();
    }

    if (document.querySelector('.chat-container')) {
        initChat();
    }
});
