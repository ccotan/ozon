import { getCurrentUser, logoutUser } from './auth.js';
import { db, auth } from './firebase.js';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, addDoc, onSnapshot, query, where } from './firebase.js';
import { compressImage, validateImage } from './imageUtils.js';

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
async function initCategories() {
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);
    if (snapshot.empty) {
        const defaultCategories = [
            { id: 'blocks', name: 'Блоки', icon: 'fa-cube' },
            { id: 'items', name: 'Предметы', icon: 'fa-gem' },
            { id: 'mobs', name: 'Мобы', icon: 'fa-dragon' },
            { id: 'services', name: 'Услуги', icon: 'fa-hands-helping' },
            { id: 'other', name: 'Другое', icon: 'fa-ellipsis-h' }
        ];
        for (const cat of defaultCategories) {
            await setDoc(doc(db, 'categories', cat.id), cat);
        }
    }
}

async function handleImageUpload(file, maxSize = 800) {
    const error = validateImage(file);
    if (error) { alert(error); return null; }
    try {
        const base64 = await compressImage(file, maxSize, maxSize, 0.7);
        return base64;
    } catch (err) {
        alert('Ошибка загрузки изображения');
        console.error(err);
        return null;
    }
}

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
    const adminBtn = document.getElementById('adminBtn');

    if (user) {
        if (loginBtn) loginBtn.classList.add('hidden');
        if (profileBtn) { 
            profileBtn.classList.remove('hidden'); 
            if (userName) userName.textContent = user.displayName || 'Профиль'; 
        }
        if (logoutBtn) {
            logoutBtn.classList.remove('hidden');
            logoutBtn.onclick = () => logoutUser();
        }
        
        getDoc(doc(db, 'users', user.uid)).then(doc => {
            if (doc.exists() && doc.data().role === 'admin') {
                if (adminBtn) adminBtn.classList.remove('hidden');
            } else {
                if (adminBtn) adminBtn.classList.add('hidden');
            }
        });
    } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (profileBtn) profileBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (adminBtn) adminBtn.classList.add('hidden');
    }

    if (cartCount) {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const total = cart.reduce((s, i) => s + i.quantity, 0);
        cartCount.textContent = total;
    }
}

window.updateHeaderCallback = updateHeader;

// ==================== КАТЕГОРИИ ====================
async function renderCategories(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const categories = await getDocs(collection(db, 'categories'));
    const cats = categories.docs.map(doc => doc.data());
    container.innerHTML = cats.map(cat => `
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

    const user = getCurrentUser();

    container.innerHTML = products.map(p => `
        <div class="product-card" data-id="${p.id}">
            <div class="product-image">
                ${p.image ? `<img src="${p.image}" alt="${p.title}">` : `<i class="fas ${p.icon || 'fa-cube'}"></i>`}
                ${p.quantity === 0 ? '<div class="product-badge" style="background: var(--color-danger); color: white;">Нет в наличии</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-category">${p.categoryName || ''}</div>
                <div class="product-title">${p.title}</div>
                <div class="product-price">${p.price.toLocaleString('ru-RU')} АР</div>
                <div class="product-stock ${p.quantity > 0 ? '' : 'out'}">
                    <i class="fas ${p.quantity > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${p.quantity > 0 ? `В наличии: ${p.quantity} шт` : 'Нет в наличии'}
                </div>
                ${p.delivery ? `<div class="product-delivery"><i class="fas fa-truck"></i> ${p.delivery}</div>` : ''}
                <div class="product-seller"><i class="fas fa-store"></i> ${p.sellerName || 'Неизвестно'}</div>
                <div class="product-actions">
                    ${user && user.uid !== p.sellerId && p.quantity > 0 ? 
                        `<button class="btn btn-primary" onclick="event.stopPropagation(); window.buyProductDirect('${p.id}')">
                            <i class="fas fa-bolt"></i> Купить
                        </button>` : ''}
                    ${user && user.uid !== p.sellerId && p.quantity > 0 ? 
                        `<button class="btn btn-secondary" onclick="event.stopPropagation(); window.addToCart('${p.id}')">
                            <i class="fas fa-cart-plus"></i> В корзину
                        </button>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const product = products.find(p => p.id === id);
            if (product) showProductModal(product);
        });
    });
}

window.buyProductDirect = async function(productId) {
    const productDoc = await getDoc(doc(db, 'products', productId));
    if (productDoc.exists()) {
        const product = { id: productDoc.id, ...productDoc.data() };
        buyProduct(product);
    }
};

window.addToCart = async function(productId) {
    const productDoc = await getDoc(doc(db, 'products', productId));
    if (productDoc.exists()) {
        const product = { id: productDoc.id, ...productDoc.data() };
        addToCart(product);
    }
};

window.contactAboutProduct = async function(productId) {
    const productDoc = await getDoc(doc(db, 'products', productId));
    if (!productDoc.exists()) return;
    const product = { id: productDoc.id, ...productDoc.data() };
    const user = getCurrentUser();
    if (!user) { alert('Войдите в аккаунт'); window.location.href = 'login.html'; return; }
    
    const chats = await getDocs(collection(db, 'chats'));
    const existingChat = chats.docs.find(c => {
        const data = c.data();
        return (data.buyerId === user.uid && data.sellerId === product.sellerId && data.productId === productId) ||
               (data.sellerId === user.uid && data.buyerId === product.sellerId && data.productId === productId);
    });
    
    if (existingChat) {
        window.location.href = `chat.html?chatId=${existingChat.id}`;
    } else {
        const chatRef = await addDoc(collection(db, 'chats'), {
            orderId: null,
            buyerId: user.uid,
            sellerId: product.sellerId,
            productId: productId,
            productTitle: product.title,
            productImage: product.image || null,
            productIcon: product.icon || 'fa-cube',
            productPrice: product.price,
            messages: [{
                id: 1,
                userId: user.uid,
                text: `Здравствуйте! Интересует "${product.title}". Есть вопросы по товару.`,
                time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            }],
            createdAt: new Date().toISOString()
        });
        window.location.href = `chat.html?chatId=${chatRef.id}`;
    }
};

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
                <div style="font-size: 36px; font-weight: 800; color: var(--color-lime); margin-bottom: 20px;">${product.price.toLocaleString('ru-RU')} АР</div>
                ${product.description ? `<p style="color: var(--color-text-secondary); margin-bottom: 20px; line-height: 1.6;">${product.description}</p>` : ''}
                ${product.delivery ? `<p style="color: var(--color-text-secondary); margin-bottom: 20px;"><i class="fas fa-truck" style="color: var(--color-lime);"></i> ${product.delivery}</p>` : ''}
                <p style="color: var(--color-text-muted); margin-bottom: 20px;"><i class="fas fa-store"></i> Продавец: ${product.sellerName || 'Неизвестно'}</p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    ${user && user.uid !== product.sellerId && product.quantity > 0 ? `<button class="btn btn-primary" id="buyNowBtn"><i class="fas fa-bolt"></i> Купить сейчас</button>` : ''}
                    ${user && user.uid !== product.sellerId && product.quantity > 0 ? `<button class="btn btn-secondary" id="addToCartBtn"><i class="fas fa-cart-plus"></i> В корзину</button>` : ''}
                    ${user && user.uid !== product.sellerId ? `<button class="btn btn-secondary" id="contactBtn"><i class="fas fa-comment"></i> Написать по поводу товара</button>` : ''}
                    ${user && user.uid !== product.sellerId ? `<button class="btn btn-danger" id="reportProductBtn"><i class="fas fa-flag"></i> Пожаловаться</button>` : ''}
                    ${user && user.uid === product.sellerId ? `<button class="btn btn-danger" id="deleteMyProductBtn"><i class="fas fa-trash"></i> Удалить товар</button>` : ''}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('closeModal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    const buyNowBtn = document.getElementById('buyNowBtn');
    if (buyNowBtn) buyNowBtn.onclick = () => { modal.remove(); buyProduct(product); };

    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) addToCartBtn.onclick = () => { modal.remove(); addToCart(product); };

    const contactBtn = document.getElementById('contactBtn');
    if (contactBtn) contactBtn.onclick = () => { modal.remove(); window.contactAboutProduct(product.id); };

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
        deleteMyProductBtn.onclick = async () => {
            if (confirm('Удалить товар?')) {
                await deleteDoc(doc(db, 'products', product.id));
                alert('Товар удалён');
                modal.remove();
                location.reload();
            }
        };
    }
}

// ==================== ПОКУПКА ====================
async function buyProduct(product) {
    const user = getCurrentUser();
    if (!user) { alert('Войдите в аккаунт'); window.location.href = 'login.html'; return; }
    if (product.quantity <= 0) { alert('Товар закончился'); return; }
    if (product.sellerId === user.uid) { alert('Нельзя купить свой товар'); return; }

    const quantity = parseInt(prompt(`Сколько штук купить? (доступно: ${product.quantity})`, '1'));
    if (!quantity || quantity <= 0 || quantity > product.quantity) { alert('Неверное количество'); return; }

    const order = {
        productId: product.id,
        productTitle: product.title,
        productImage: product.image || null,
        productIcon: product.icon || 'fa-cube',
        price: product.price,
        quantity: quantity,
        total: product.price * quantity,
        buyerId: user.uid,
        buyerName: user.displayName || user.email,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        status: 'pending',
        delivery: product.delivery,
        createdAt: new Date().toISOString()
    };
    const orderRef = await addDoc(collection(db, 'orders'), order);

    const chatRef = await addDoc(collection(db, 'chats'), {
        orderId: orderRef.id,
        buyerId: user.uid,
        sellerId: product.sellerId,
        productId: product.id,
        productTitle: product.title,
        productImage: product.image || null,
        productIcon: product.icon || 'fa-cube',
        productPrice: product.price,
        messages: [{
            id: 1,
            userId: user.uid,
            text: `Здравствуйте! Я купил "${product.title}" (${quantity} шт). Жду подтверждения.`,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        }],
        createdAt: new Date().toISOString()
    });

    await createNotification(
        product.sellerId,
        'Новый заказ',
        `${user.displayName || user.email} купил "${product.title}"`,
        `profile.html#sales`
    );

    alert('Заказ оформлен! Чат с продавцом открыт.');
    window.location.href = `chat.html?chatId=${chatRef.id}`;
}

// ==================== КОРЗИНА ====================
function addToCart(product) {
    const user = getCurrentUser();
    if (!user) { alert('Войдите в аккаунт'); window.location.href = 'login.html'; return; }
    if (product.quantity <= 0) { alert('Товар закончился'); return; }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(i => i.productId === product.id);
    
    if (existing) {
        if (existing.quantity < product.quantity) {
            existing.quantity++;
        } else { 
            alert('Достигнуто максимальное количество'); 
            return; 
        }
    } else {
        cart.push({ 
            productId: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            icon: product.icon,
            quantity: 1,
            sellerId: product.sellerId,
            sellerName: product.sellerName
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateHeader();
    showNotification('Товар добавлен в корзину', 'success');
}

function removeFromCart(productId) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const newCart = cart.filter(i => i.productId !== productId);
    localStorage.setItem('cart', JSON.stringify(newCart));
    updateHeader();
    initCart();
}

function changeCartQty(productId, delta) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const item = cart.find(i => i.productId === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateHeader();
        initCart();
    }
}

async function initCart() {
    const cartItemsEl = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!cartItemsEl) return;

    const user = getCurrentUser();
    if (!user) { 
        cartItemsEl.innerHTML = '<div class="empty-state"><p>Войдите, чтобы использовать корзину</p></div>'; 
        return; 
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-cart"></i><p>Корзина пуста</p></div>';
        return;
    }

    let total = 0;
    cartItemsEl.innerHTML = cart.map(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        return `
            <div class="cart-item">
                <div class="cart-item-image">
                    ${item.image ? `<img src="${item.image}">` : `<i class="fas ${item.icon || 'fa-cube'}"></i>`}
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-price">${item.price.toLocaleString('ru-RU')} АР × ${item.quantity} = ${subtotal.toLocaleString('ru-RU')} АР</div>
                    <div style="font-size: 12px; color: var(--color-text-muted);">Продавец: ${item.sellerName}</div>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="changeCartQty('${item.productId}', -1)">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="changeCartQty('${item.productId}', 1)">+</button>
                    </div>
                    <button class="btn btn-danger btn-small" onclick="removeFromCart('${item.productId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (cartTotal) cartTotal.textContent = total.toLocaleString('ru-RU') + ' АР';
    if (cartSummary) cartSummary.style.display = 'flex';

    if (checkoutBtn) {
        checkoutBtn.onclick = () => checkoutCart();
    }
}

async function checkoutCart() {
    const user = getCurrentUser();
    if (!user) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) return;

    const orders = [];

    for (const item of cart) {
        const productDoc = await getDoc(doc(db, 'products', item.productId));
        if (!productDoc.exists()) continue;
        
        const product = productDoc.data();
        if (product.quantity < item.quantity) {
            alert(`Товар "${item.title}" закончился`);
            continue;
        }
        if (product.sellerId === user.uid) continue;

        const order = {
            productId: item.productId,
            productTitle: item.title,
            productImage: item.image,
            productIcon: item.icon,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
            buyerId: user.uid,
            buyerName: user.displayName || user.email,
            sellerId: product.sellerId,
            sellerName: product.sellerName,
            status: 'pending',
            delivery: product.delivery,
            createdAt: new Date().toISOString()
        };
        
        const orderRef = await addDoc(collection(db, 'orders'), order);
        orders.push(orderRef.id);

        await addDoc(collection(db, 'chats'), {
            orderId: orderRef.id,
            buyerId: user.uid,
            sellerId: product.sellerId,
            productId: item.productId,
            productTitle: item.title,
            productImage: item.image,
            productIcon: item.icon,
            productPrice: item.price,
            messages: [{
                id: 1,
                userId: user.uid,
                text: `Здравствуйте! Я купил "${item.title}" (${item.quantity} шт). Жду подтверждения.`,
                time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            }],
            createdAt: new Date().toISOString()
        });
        
        await createNotification(
            product.sellerId,
            'Новый заказ',
            `${user.displayName || user.email} купил "${item.title}"`,
            `profile.html#sales`
        );
    }

    if (orders.length > 0) {
        localStorage.setItem('cart', '[]');
        updateHeader();
        alert(`Заказ оформлен! Товаров: ${orders.length}`);
        window.location.href = 'profile.html#purchases';
    }
}

// ==================== КАТАЛОГ ====================
async function initCatalog() {
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
        const categories = await getDocs(collection(db, 'categories'));
        const cats = categories.docs.map(doc => doc.data());
        categoryFilters.innerHTML = cats.map(cat => `
            <label><input type="checkbox" value="${cat.id}" class="category-checkbox"> ${cat.name}</label>
        `).join('');
    }

    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get('category');
    const urlSearch = params.get('search');

    if (urlSearch && searchInput) searchInput.value = urlSearch;

    async function loadAndRender() {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        let products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
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
async function initProfile() {
    const user = getCurrentUser();
    if (!user) { window.location.href = 'login.html'; return; }

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};

    // Проверка бана
    if (userData.banned) {
        alert('Ваш аккаунт заблокирован: ' + (userData.banReason || 'Причина не указана'));
        await logoutUser();
        return;
    }

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

    const nameInput = document.getElementById('profileName');
    const emailInput = document.getElementById('profileEmail');
    const phoneInput = document.getElementById('profilePhone');
    const bioInput = document.getElementById('profileBio');
    const sidebarUserName = document.getElementById('sidebarUserName');

    if (nameInput) nameInput.value = userData.name || user.displayName || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = userData.phone || '';
    if (bioInput) bioInput.value = userData.bio || '';
    if (sidebarUserName) sidebarUserName.textContent = userData.name || user.displayName || 'Пользователь';

    // Показ ссылки на админку
    if (userData.role === 'admin') {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) adminLink.style.display = 'flex';
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateDoc(doc(db, 'users', user.uid), {
                name: document.getElementById('profileName').value,
                phone: document.getElementById('profilePhone').value,
                bio: document.getElementById('profileBio').value
            });
            alert('Профиль сохранён');
            if (sidebarUserName) sidebarUserName.textContent = document.getElementById('profileName').value;
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

    let tempAvatar = userData.avatar;
    let tempBg = userData.background;

    if (previewAvatar && userData.avatar) {
        previewAvatar.innerHTML = `<img src="${userData.avatar}" style="width: 100%; height: 100%; object-fit: cover;">`;
    }
    if (previewBg && userData.background) {
        previewBg.innerHTML = `<img src="${userData.background}" style="width: 100%; height: 100%; object-fit: cover;">`;
    }

    if (avatarInput) {
        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const base64 = await handleImageUpload(file, 400);
            if (base64) {
                tempAvatar = base64;
                previewAvatar.innerHTML = `<img src="${base64}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
        });
    }

    if (bgInput) {
        bgInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const base64 = await handleImageUpload(file, 1200);
            if (base64) {
                tempBg = base64;
                previewBg.innerHTML = `<img src="${base64}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
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
        saveAppearanceBtn.onclick = async () => {
            await updateDoc(doc(db, 'users', user.uid), {
                avatar: tempAvatar,
                background: tempBg
            });
            alert('Внешний вид сохранён');
            location.reload();
        };
    }

    // Добавление товара
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        const categorySelect = document.getElementById('productCategory');
        if (categorySelect) {
            const categories = await getDocs(collection(db, 'categories'));
            const cats = categories.docs.map(doc => doc.data());
            categorySelect.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }

        const productImageInput = document.getElementById('productImage');
        const imagePreview = document.getElementById('imagePreview');
        let tempProductImage = null;

        if (productImageInput) {
            productImageInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const base64 = await handleImageUpload(file, 800);
                if (base64) {
                    tempProductImage = base64;
                    imagePreview.innerHTML = `<img src="${base64}" style="max-width: 200px; border-radius: var(--radius-sm); border: 2px solid var(--color-border);">`;
                }
            });
        }

        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('productTitle').value.trim();
            const category = document.getElementById('productCategory').value;
            const price = parseFloat(document.getElementById('productPrice').value);
            const quantity = parseInt(document.getElementById('productQuantity').value);
            const description = document.getElementById('productDescription').value;
            const delivery = document.getElementById('productDelivery').value;

            // Опции доставки
            const deliveryCourier = document.getElementById('deliveryCourier')?.checked || false;
            const deliveryPickup = document.getElementById('deliveryPickup')?.checked || false;

            if (!title || !price || isNaN(quantity)) { alert('Заполните обязательные поля'); return; }

            const categories = await getDocs(collection(db, 'categories'));
            const cats = categories.docs.map(doc => doc.data());
            const cat = cats.find(c => c.id === category);

            const productData = {
                title, price, category,
                categoryName: cat?.name || category,
                description, quantity, delivery,
                deliveryCourier,
                deliveryPickup,
                sellerId: user.uid,
                sellerName: userData.name || user.displayName || user.email,
                icon: cat?.icon || 'fa-cube',
                image: tempProductImage,
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'products'), productData);
            alert('Товар добавлен!');
            addProductForm.reset();
            imagePreview.innerHTML = '';
            tempProductImage = null;
            renderMyProducts();
        });
    }

    async function renderMyProducts() {
        const grid = document.getElementById('myProductsGrid');
        if (!grid) return;
        const productsSnapshot = await getDocs(query(collection(db, 'products'), where('sellerId', '==', user.uid)));
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (products.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>У вас нет товаров. Добавьте первый!</p></div>';
            return;
        }
        renderProducts('myProductsGrid', products);
    }

    renderMyProducts();

    // Настройки доставки
    const deliveryForm = document.getElementById('deliveryForm');
    if (deliveryForm) {
        const courierEnabled = document.getElementById('courierEnabled');
        const courierPrice = document.getElementById('courierPrice');
        const courierTime = document.getElementById('courierTime');

        if (userData.deliveryMethods) {
            const courier = userData.deliveryMethods.find(m => m.type === 'courier');
            if (courier) {
                courierEnabled.checked = true;
                courierPrice.value = courier.price;
                courierTime.value = courier.time || '';
            }

            const pickupPoints = userData.deliveryMethods.filter(m => m.type === 'pickup');
            const container = document.getElementById('pickupPointsContainer');
            if (container) {
                container.innerHTML = '';
                pickupPoints.forEach(point => {
                    const div = document.createElement('div');
                    div.className = 'pickup-point';
                    div.innerHTML = `
                        <div class="pickup-point-header">
                            <label class="checkbox-label"><input type="checkbox" class="pickup-enabled" checked><span>Активен</span></label>
                            <button type="button" class="btn-remove" onclick="this.closest('.pickup-point').remove()"><i class="fas fa-trash"></i></button>
                        </div>
                        <div class="form-group"><label>Название</label><input type="text" class="pickup-name" value="${point.name}" required></div>
                        <div class="form-group">
                            <label>Координаты (X Y Z)</label>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <input type="text" class="pickup-coords" value="${point.coords || ''}" placeholder="100 64 -200" required style="flex: 1;">
                                <button type="button" class="copy-coords-btn" onclick="copyCoords(this)"><i class="fas fa-copy"></i> Копировать</button>
                            </div>
                            <small class="form-hint">Например: 100 64 -200</small>
                        </div>
                        <div class="form-group"><label>Стоимость (АР)</label><input type="number" class="pickup-price" value="${point.price}" min="0" step="10"></div>
                    `;
                    container.appendChild(div);
                });
            }
        }

        deliveryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const deliveryMethods = [];
            if (courierEnabled.checked) {
                deliveryMethods.push({
                    type: 'courier',
                    name: 'Личная встреча',
                    price: parseFloat(courierPrice.value) || 0,
                    time: courierTime.value
                });
            }
            document.querySelectorAll('.pickup-point').forEach(point => {
                if (point.querySelector('.pickup-enabled').checked) {
                    deliveryMethods.push({
                        type: 'pickup',
                        name: point.querySelector('.pickup-name').value,
                        coords: point.querySelector('.pickup-coords').value,
                        price: parseFloat(point.querySelector('.pickup-price').value) || 0
                    });
                }
            });
            await updateDoc(doc(db, 'users', user.uid), { deliveryMethods });
            alert('Настройки доставки сохранены');
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
                <div class="form-group"><label>Название пункта</label><input type="text" class="pickup-name" placeholder="Моя база" required></div>
                <div class="form-group">
                    <label>Координаты (X Y Z)</label>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" class="pickup-coords" placeholder="100 64 -200" required style="flex: 1;">
                        <button type="button" class="copy-coords-btn" onclick="copyCoords(this)"><i class="fas fa-copy"></i> Копировать</button>
                    </div>
                    <small class="form-hint">Например: 100 64 -200</small>
                </div>
                <div class="form-group"><label>Стоимость (АР)</label><input type="number" class="pickup-price" placeholder="0" min="0" step="10"></div>
            `;
            container.appendChild(point);
        });
    }

    // Продажи
    async function renderSales() {
        const container = document.getElementById('salesContent');
        if (!container) return;
        const ordersSnapshot = await getDocs(query(collection(db, 'orders'), where('sellerId', '==', user.uid)));
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
                    <span class="order-status ${o.status}">${o.status === 'pending' ? 'Ожидает' : o.status === 'confirmed' ? 'Подтверждено' : o.status === 'cancelled' ? 'Отменено' : 'Завершено'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <div style="font-size: 14px; color: var(--color-text-secondary);">Количество: <strong>${o.quantity} шт</strong></div>
                        <div style="font-size: 22px; font-weight: 800; color: var(--color-lime);">${o.total.toLocaleString('ru-RU')} АР</div>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        ${o.status === 'pending' ? `<button class="btn btn-success" onclick="window.confirmSale('${o.id}', '${o.productId}', ${o.quantity})"><i class="fas fa-check"></i> Подтвердить продажу</button>` : ''}
                        ${o.status === 'pending' ? `<button class="cancel-btn" onclick="window.cancelSale('${o.id}', '${o.productId}', ${o.quantity})"><i class="fas fa-times"></i> Отменить</button>` : ''}
                        <button class="btn btn-secondary" onclick="window.openChatByOrder('${o.id}')"><i class="fas fa-comments"></i> Чат</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    window.confirmSale = async function(orderId, productId, quantity) {
        if (!confirm('Подтвердить продажу? Количество товара уменьшится.')) return;
        await updateDoc(doc(db, 'orders', orderId), { status: 'confirmed' });
        const productDoc = await getDoc(doc(db, 'products', productId));
        if (productDoc.exists()) {
            const product = productDoc.data();
            const newQuantity = product.quantity - quantity;
            if (newQuantity <= 0) {
                await deleteDoc(doc(db, 'products', productId));
            } else {
                await updateDoc(doc(db, 'products', productId), { quantity: newQuantity });
            }
        }
        alert('Продажа подтверждена!');
        renderSales();
        renderMyProducts();
    };

    window.cancelSale = async function(orderId, productId, quantity) {
        if (!confirm('Отменить продажу? Товар вернётся на склад.')) return;
        await updateDoc(doc(db, 'orders', orderId), { status: 'cancelled' });
        const productDoc = await getDoc(doc(db, 'products', productId));
        if (productDoc.exists()) {
            const product = productDoc.data();
            await updateDoc(doc(db, 'products', productId), { quantity: product.quantity + quantity });
        }
        alert('Продажа отменена');
        renderSales();
        renderMyProducts();
    };

    window.openChatByOrder = async function(orderId) {
        const chatsSnapshot = await getDocs(query(collection(db, 'chats'), where('orderId', '==', orderId)));
        if (!chatsSnapshot.empty) {
            const chat = chatsSnapshot.docs[0];
            window.location.href = `chat.html?chatId=${chat.id}`;
        } else {
            alert('Чат не найден');
        }
    };

    renderSales();

    // Покупки
    async function renderPurchases() {
        const container = document.getElementById('purchasesContent');
        if (!container) return;
        const ordersSnapshot = await getDocs(query(collection(db, 'orders'), where('buyerId', '==', user.uid)));
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
                    <span class="order-status ${o.status}">${o.status === 'pending' ? 'Ожидает' : o.status === 'confirmed' ? 'Подтверждено' : o.status === 'cancelled' ? 'Отменено' : 'Завершено'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <div style="font-size: 14px; color: var(--color-text-secondary);">Количество: <strong>${o.quantity} шт</strong></div>
                        <div style="font-size: 22px; font-weight: 800; color: var(--color-lime);">${o.total.toLocaleString('ru-RU')} АР</div>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        ${o.status === 'pending' ? `<button class="cancel-btn" onclick="window.cancelPurchase('${o.id}')"><i class="fas fa-times"></i> Отменить покупку</button>` : ''}
                        <button class="btn btn-secondary" onclick="window.openChatByOrder('${o.id}')"><i class="fas fa-comments"></i> Чат с продавцом</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    window.cancelPurchase = async function(orderId) {
        if (!confirm('Отменить покупку?')) return;
        await updateDoc(doc(db, 'orders', orderId), { status: 'cancelled' });
        alert('Покупка отменена');
        renderPurchases();
    };

    renderPurchases();
}

// ==================== УВЕДОМЛЕНИЯ ====================
async function createNotification(userId, title, message, link = '') {
    await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        message,
        link,
        read: false,
        createdAt: new Date().toISOString()
    });
}

function showNotification(text, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-header">
            <span class="notification-title">${type === 'success' ? '✓ Успешно' : type === 'error' ? '✕ Ошибка' : 'ℹ Информация'}</span>
            <button class="notification-close" onclick="this.closest('.notification').remove()">×</button>
        </div>
        <div class="notification-message">${text}</div>
        <div class="notification-time">${new Date().toLocaleTimeString('ru-RU')}</div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => { notification.remove(); }, 5000);
}

// ==================== ЖАЛОБЫ ====================
async function submitReport(type, targetId, reportedUserId, reason) {
    const user = getCurrentUser();
    if (!user) return;
    await addDoc(collection(db, 'reports'), {
        type, targetId, reportedUserId,
        reporterId: user.uid,
        reporterName: user.displayName || user.email,
        reason, status: 'pending',
        createdAt: new Date().toISOString()
    });
}

// ==================== ПРОДАВЦЫ ====================
async function initSellers() {
    const grid = document.getElementById('sellersGrid');
    if (!grid) return;

    const productsSnapshot = await getDocs(collection(db, 'products'));
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const sellersMap = {};
    productsSnapshot.docs.forEach(doc => {
        const p = doc.data();
        if (p.sellerId) {
            if (!sellersMap[p.sellerId]) {
                sellersMap[p.sellerId] = { name: p.sellerName, count: 0, id: p.sellerId };
            }
            sellersMap[p.sellerId].count++;
        }
    });

    const sellers = Object.values(sellersMap);
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

async function initSellerPage() {
    const params = new URLSearchParams(window.location.search);
    const sellerId = params.get('id');
    if (!sellerId) return;

    const sellerDoc = await getDoc(doc(db, 'users', sellerId));
    if (!sellerDoc.exists()) {
        document.querySelector('.container').innerHTML = '<div class="empty-state"><p>Продавец не найден</p></div>';
        return;
    }

    const seller = sellerDoc.data();
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
        if (seller.background) {
            bg.style.backgroundImage = `url(${seller.background})`;
            bg.style.backgroundSize = 'cover';
            bg.style.backgroundPosition = 'center';
        } else {
            bg.style.background = 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)';
        }
    }

    const productsSnapshot = await getDocs(query(collection(db, 'products'), where('sellerId', '==', sellerId)));
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProducts('sellerProductsGrid', products);

    const reportBtn = document.getElementById('reportSellerBtn');
    if (reportBtn) {
        const user = getCurrentUser();
        if (user && user.uid === sellerId) reportBtn.style.display = 'none';
        reportBtn.onclick = () => {
            const reason = prompt('Причина жалобы на продавца:');
            if (reason && reason.trim()) {
                submitReport('seller', sellerId, sellerId, reason.trim());
                alert('Жалоба отправлена');
            }
        };
    }
}

// ==================== ЧАТ ====================
async function initChat() {
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
    const chatId = params.get('chatId');
    
    if (!chatId) {
        messagesContainer.innerHTML = '<div class="empty-state"><p>Чат не найден</p></div>';
        return;
    }

    try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (!chatDoc.exists()) {
            messagesContainer.innerHTML = '<div class="empty-state"><p>Чат не найден</p></div>';
            return;
        }

        const chat = chatDoc.data();
        
        if (chat.buyerId !== user.uid && chat.sellerId !== user.uid) {
            messagesContainer.innerHTML = '<div class="empty-state"><p>У вас нет доступа к этому чату</p></div>';
            return;
        }

        const otherUserId = chat.buyerId === user.uid ? chat.sellerId : chat.buyerId;
        const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
        const otherUser = otherUserDoc.data();
        
        if (chatTitle) {
            chatTitle.textContent = `Чат с ${otherUser?.name || 'пользователем'}`;
        }

        if (chatProductInfo && chat.productTitle) {
            chatProductInfo.style.display = 'block';
            const imgEl = document.getElementById('chatProductImage');
            const titleEl = document.getElementById('chatProductTitle');
            const priceEl = document.getElementById('chatProductPrice');
            
            if (imgEl) {
                imgEl.innerHTML = chat.productImage ? 
                    `<img src="${chat.productImage}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                    `<i class="fas ${chat.productIcon || 'fa-cube'}"></i>`;
            }
            if (titleEl) titleEl.textContent = chat.productTitle;
            if (priceEl) priceEl.textContent = `${chat.productPrice.toLocaleString('ru-RU')} АР`;
        }

        onSnapshot(doc(db, 'chats', chatId), (doc) => {
            const chatData = doc.data();
            if (!chatData.messages) return;
            
            messagesContainer.innerHTML = chatData.messages.map(m => `
                <div class="chat-message ${m.userId === user.uid ? 'own' : ''}">
                    <div>${escapeHtml(m.text)}</div>
                    <div class="meta">${m.time}</div>
                </div>
            `).join('');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });

        function sendMessage() {
            const text = input.value.trim();
            if (!text) return;

            const chatRef = doc(db, 'chats', chatId);
            getDoc(chatRef).then(docSnap => {
                if (!docSnap.exists()) return;
                
                const chatData = docSnap.data();
                const newMessage = {
                    id: Date.now(),
                    userId: user.uid,
                    text: text,
                    time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                };
                
                updateDoc(chatRef, { 
                    messages: [...(chatData.messages || []), newMessage] 
                }).then(() => {
                    createNotification(
                        otherUserId,
                        'Новое сообщение',
                        `${user.displayName || user.email} написал(а) вам`,
                        `chat.html?chatId=${chatId}`
                    );
                });
            });
            
            input.value = '';
        }

        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (input) {
            input.addEventListener('keypress', (e) => { 
                if (e.key === 'Enter') sendMessage(); 
            });
        }

    } catch (error) {
        console.error('Ошибка загрузки чата:', error);
        messagesContainer.innerHTML = '<div class="empty-state"><p>Ошибка загрузки чата</p></div>';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== АДМИНКА ====================
async function initAdmin() {
    const user = getCurrentUser();
    if (!user) { window.location.href = 'index.html'; return; }

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
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

    // Пользователи
    const usersBody = document.getElementById('usersTableBody');
    if (usersBody) {
        const users = await getDocs(collection(db, 'users'));
        usersBody.innerHTML = users.docs.map(doc => {
            const u = doc.data();
            return `
                <tr>
                    <td>${doc.id.substring(0, 8)}...</td>
                    <td>${u.name || '-'}</td>
                    <td>${u.email || '-'}</td>
                    <td><span class="badge badge-${u.role || 'user'}">${u.role || 'user'}</span></td>
                    <td><span class="user-ban-status ${u.banned ? 'banned' : 'active'}">${u.banned ? 'Забанен' : 'Активен'}</span></td>
                    <td>
                        ${u.role !== 'admin' ? `
                            ${u.banned ? 
                                `<button class="btn btn-success btn-small" onclick="window.unbanUser('${doc.id}')"><i class="fas fa-unlock"></i> Разбанить</button>` : 
                                `<button class="btn btn-danger btn-small" onclick="window.banUser('${doc.id}')"><i class="fas fa-ban"></i> Забанить</button>`
                            }
                        ` : '-'}
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Товары
    const productsBody = document.getElementById('productsTableBody');
    if (productsBody) {
        const products = await getDocs(collection(db, 'products'));
        productsBody.innerHTML = products.docs.map(doc => {
            const p = doc.data();
            return `
                <tr>
                    <td>${doc.id.substring(0, 8)}...</td>
                    <td>${p.title}</td>
                    <td>${p.price.toLocaleString('ru-RU')} АР</td>
                    <td>${p.categoryName || p.category}</td>
                    <td>${p.quantity} шт</td>
                    <td>${p.sellerName || '-'}</td>
                    <td><button class="btn btn-danger btn-small" onclick="window.adminDeleteProduct('${doc.id}')"><i class="fas fa-trash"></i></button></td>
                </tr>
            `;
        }).join('');
    }

    // Жалобы
    const reportsContent = document.getElementById('reportsContent');
    if (reportsContent) {
        const reports = await getDocs(collection(db, 'reports'));
        if (reports.empty) {
            reportsContent.innerHTML = '<div class="empty-state"><i class="fas fa-flag"></i><p>Жалоб нет</p></div>';
        } else {
            reportsContent.innerHTML = reports.docs.map(doc => {
                const r = doc.data();
                return `
                    <div class="report-card">
                        <div class="report-header">
                            <div>
                                <div style="font-weight: 700;">Жалоба на: ${r.reporterName || 'Неизвестно'} (${r.type})</div>
                                <div style="font-size: 13px; color: var(--color-text-muted);">От: ${r.reporterName} • ${new Date(r.createdAt).toLocaleString('ru-RU')}</div>
                            </div>
                            <span class="report-type">${r.type === 'product' ? 'Товар' : r.type === 'seller' ? 'Продавец' : 'Пользователь'}</span>
                        </div>
                        <div style="margin-bottom: 15px; padding: 15px; background: var(--bg-card); border-radius: var(--radius-xs); border-left: 3px solid var(--color-danger);">
                            <strong>Причина:</strong> ${r.reason}
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-danger btn-small" onclick="window.adminBanFromReport('${r.reportedUserId}', '${r.reason}')"><i class="fas fa-ban"></i> Забанить</button>
                            <button class="btn btn-secondary btn-small" onclick="window.adminDismissReport('${doc.id}')"><i class="fas fa-times"></i> Отклонить</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Заказы
    const adminOrdersContent = document.getElementById('adminOrdersContent');
    if (adminOrdersContent) {
        const orders = await getDocs(collection(db, 'orders'));
        if (orders.empty) {
            adminOrdersContent.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><p>Заказов нет</p></div>';
        } else {
            adminOrdersContent.innerHTML = orders.docs.map(doc => {
                const o = doc.data();
                return `
                    <div class="order-card">
                        <div class="order-header">
                            <div>
                                <div style="font-weight: 700;">${o.productTitle}</div>
                                <div style="font-size: 13px; color: var(--color-text-muted);">Покупатель: ${o.buyerName} • Продавец: ${o.sellerName}</div>
                            </div>
                            <span class="order-status ${o.status}">${o.status}</span>
                        </div>
                        <div>Количество: ${o.quantity} шт • Сумма: ${o.total.toLocaleString('ru-RU')} АР</div>
                    </div>
                `;
            }).join('');
        }
    }

    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => logoutUser());
    }
}

window.banUser = async function(userId) {
    const reason = prompt('Причина бана:');
    if (!reason) return;
    await updateDoc(doc(db, 'users', userId), {
        banned: true,
        banReason: reason,
        bannedAt: new Date().toISOString()
    });
    alert('Пользователь забанен');
    initAdmin();
};

window.unbanUser = async function(userId) {
    await updateDoc(doc(db, 'users', userId), {
        banned: false,
        banReason: null,
        bannedAt: null
    });
    alert('Пользователь разбанен');
    initAdmin();
};

window.adminBanFromReport = async function(userId, reason) {
    await updateDoc(doc(db, 'users', userId), {
        banned: true,
        banReason: reason,
        bannedAt: new Date().toISOString()
    });
    alert('Пользователь забанен');
    initAdmin();
};

window.adminDismissReport = async function(reportId) {
    await deleteDoc(doc(db, 'reports', reportId));
    alert('Жалоба отклонена');
    initAdmin();
};

window.adminDeleteProduct = async function(productId) {
    if (!confirm('Удалить товар?')) return;
    await deleteDoc(doc(db, 'products', productId));
    alert('Товар удалён');
    initAdmin();
};

// ==================== УТИЛИТЫ ====================
function doHeaderSearch() {
    const searchInput = document.getElementById('headerSearch');
    if (!searchInput) return;
    const query = searchInput.value.trim();
    if (query) window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
}

window.copyCoords = function(btn) {
    const input = btn.parentElement.querySelector('.pickup-coords');
    if (input && input.value) {
        navigator.clipboard.writeText(input.value).then(() => {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Скопировано';
            setTimeout(() => { btn.innerHTML = originalHTML; }, 1500);
        });
    }
};

// ==================== ЗАПУСК ====================
document.addEventListener('DOMContentLoaded', async () => {
    await initCategories();
    initScrollAnimations();
    updateHeader();

    if (document.getElementById('categoriesGrid')) renderCategories('categoriesGrid');
    if (document.getElementById('productsGrid') && document.getElementById('searchInput')) initCatalog();
    if (document.getElementById('productsGrid') && !document.getElementById('searchInput') && !document.getElementById('sellerProductsGrid') && !document.getElementById('myProductsGrid')) {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const popular = products.filter(p => p.quantity > 0).slice(0, 8);
        renderProducts('productsGrid', popular);
    }

    if (document.querySelector('.profile-layout')) initProfile();
    if (document.querySelector('.admin-layout')) initAdmin();
    if (document.querySelector('.chat-container')) initChat();
    if (document.getElementById('sellersGrid')) initSellers();
    if (document.getElementById('sellerProductsGrid')) initSellerPage();
    if (document.getElementById('cartItems')) initCart();
});
