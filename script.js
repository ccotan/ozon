// Анимация при скролле
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
});

// Демо-данные товаров
const demoProducts = [
    { id: 1, title: 'Смартфон XYZ', price: 29990, icon: 'fa-mobile-alt' },
    { id: 2, title: 'Ноутбук Pro', price: 89990, icon: 'fa-laptop' },
    { id: 3, title: 'Наушники Wireless', price: 5990, icon: 'fa-headphones' },
    { id: 4, title: 'Умные часы', price: 12990, icon: 'fa-clock' },
    { id: 5, title: 'Планшет Air', price: 45990, icon: 'fa-tablet-alt' },
    { id: 6, title: 'Камера DSLR', price: 67990, icon: 'fa-camera' }
];

// Рендер товаров
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = demoProducts.map(product => `
        <div class="product-card">
            <div class="product-image">
                <i class="fas ${product.icon}"></i>
            </div>
            <div class="product-info">
                <div class="product-title">${product.title}</div>
                <div class="product-price">${product.price.toLocaleString('ru-RU')} ₽</div>
            </div>
        </div>
    `).join('');
}

// Инициализация
renderProducts();