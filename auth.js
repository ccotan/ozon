function getUsers() { return JSON.parse(localStorage.getItem('users') || '[]'); }
function setUsers(users) { localStorage.setItem('users', JSON.stringify(users)); }

function validatePassword(password) {
    if (password.length < 8) return 'Минимум 8 символов';
    if (!/[0-9]/.test(password)) return 'Нужна хотя бы одна цифра';
    if (!/[A-ZА-ЯЁ]/.test(password)) return 'Нужна заглавная буква';
    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    // Переключение пароля
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Регистрация
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const login = document.getElementById('regLogin').value.trim();
            const password = document.getElementById('regPassword').value;
            const passwordConfirm = document.getElementById('regPasswordConfirm').value;

            if (!name || !email || !login || !password) { alert('Заполните все поля'); return; }

            const passwordError = validatePassword(password);
            if (passwordError) { alert(passwordError); return; }

            if (password !== passwordConfirm) { alert('Пароли не совпадают'); return; }

            const users = getUsers();
            if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                alert('Email уже используется'); return;
            }
            if (users.some(u => u.login.toLowerCase() === login.toLowerCase())) {
                alert('Логин уже занят'); return;
            }

            const newUser = {
                id: Date.now(),
                name, email, login, password,
                role: users.length === 0 ? 'admin' : 'user',
                phone: '', bio: '',
                deliveryMethods: [],
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            setUsers(users);
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            alert('Регистрация успешна!');
            window.location.href = 'profile.html';
        });
    }

    // Вход
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const emailOrLogin = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!emailOrLogin || !password) { alert('Заполните все поля'); return; }

            const users = getUsers();
            const user = users.find(u =>
                u.email.toLowerCase() === emailOrLogin.toLowerCase() ||
                u.login.toLowerCase() === emailOrLogin.toLowerCase()
            );

            if (!user) { alert('Пользователь не найден'); return; }
            if (user.password !== password) { alert('Неверный пароль'); return; }

            localStorage.setItem('currentUser', JSON.stringify(user));
            alert('Вход выполнен!');
            window.location.href = 'profile.html';
        });
    }
});
