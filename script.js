// ==================== ОБЩИЕ ДАННЫЕ ====================
const DEFAULT_CATEGORIES = [
    { id: 'electronics', name: 'Электроника', icon: 'fa-laptop' },
    { id: 'clothing', name: 'Одежда', icon: 'fa-tshirt' },
    { id: 'home', name: 'Для дома', icon: 'fa-home' },
    { id: 'sports', name: 'Спорт', icon: 'fa-running' },
    { id: 'books', name: 'Книги', icon: 'fa-book' },
    { id: 'toys', name: 'Игрушки', icon: 'fa-gamepad' }
];

// Инициализация данных в localStorage
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

// ==================== АНИМАЦИИ ПРИ СКРОЛЛЕ ====================
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

// ==================== ОБНОВЛЕНИЕ ШАПКИ ====================
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

// ==================== РЕНДЕР КАТЕГОРИЙ ====================
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

// ==================== РЕНДЕР ТОВАРОВ ====================
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
                <i class="fas ${product.icon || 'fa-box'}"></i>
            </div>
            <div class="product-info">
                <div class="product-category">${product.categoryName || ''}</div>
                <div class="product-title">${product.title}</div>
                <div class="product-price">${product.price.toLocaleString('ru-RU')} ₽</div>
            </div>
        </div>
    `).join('');
}

// ==================== КАТАЛОГ: ФИЛЬТРАЦИЯ И ПОИСК ====================
function initCatalog() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilters = document.getElementById('categoryFilters');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const applyBtn = document.getElementById('applyFilters');
    const sortSelect = document.getElementById('sortSelect');
    const productsGrid = document.getElementById('productsGrid');

    if (!productsGrid) return;

    // Рендер категорий в фильтре
    if (categoryFilters) {
        const categories = getData('categories');
        categoryFilters.innerHTML = categories.map(cat => `
            <label>
                <input type="checkbox" value="${cat.id}" class="category-checkbox">
                ${cat.name}
            </label>
        `).join('');
    }

    // Получение параметров URL
    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get('category');

    function loadAndRender() {
        let products = getData('products');
        const selectedCategories = Array.from(document.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
        const search = (searchInput?.value || '').toLowerCase();
        const min = parseFloat(minPrice?.value) || 0;
        const max = parseFloat(maxPrice?.value) || Infinity;

        // Фильтрация
        products = products.filter(p => {
            const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
            const matchSearch = !search || p.title.toLowerCase().includes(search);
            const matchPrice = p.price >= min && p.price <= max;
            return matchCategory && matchSearch && matchPrice;
        });

        // Сортировка
        const sort = sortSelect?.value || 'popular';
        if (sort === 'price-asc') products.sort((a, b) => a.price - b.price);
        else if (sort === 'price-desc') products.sort((a, b) => b.price - a.price);
        else if (sort === 'name') products.sort((a, b) => a.title.localeCompare(b.title));

        renderProducts('productsGrid', products);
    }

    // Если есть категория в URL — выбираем её
    if (urlCategory && categoryFilters) {
        const checkbox = categoryFilters.querySelector(`input[value="${urlCategory}"]`);
        if (checkbox) checkbox.checked = true;
    }

    if (applyBtn) applyBtn.addEventListener('click', loadAndRender);
    if (sortSelect) sortSelect.addEventListener('change', loadAndRender);

    // Дебаунс для поиска
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(loadAndRender, 300);
        });
    }

    loadAndRender();
}

// ==================== ПРОФИЛЬ: ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ====================
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

    // Загрузка данных профиля
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
    }

    // Сохранение профиля
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

    // Смена пароля
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

    // Таблица пользователей
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

    // Таблица товаров
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
                </tr>
            `;
        }).join('');
    }

    // Выход
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
            sellerId: 1, // демо
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

    // Главная
    if (document.getElementById('categoriesGrid')) {
        renderCategories('categoriesGrid');
    }

    // Каталог
    if (document.getElementById('productsGrid') && document.getElementById('searchInput')) {
        initCatalog();
    }

    // Профиль
    if (document.querySelector('.profile-layout')) {
        const user = getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
        } else {
            initProfile();
        }
    }

    // Админка
    if (document.querySelector('.admin-layout')) {
        initAdmin();
    }

    // Чат
    if (document.querySelector('.chat-container')) {
        initChat();
    }
});