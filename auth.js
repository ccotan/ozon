// ==================== УТИЛИТЫ ====================
function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

function setUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function validatePassword(password) {
    if (password.length < 8) return 'Пароль должен быть минимум 8 символов';
    if (!/[0-9]/.test(password)) return 'Пароль должен содержать хотя бы одну цифру';
    if (!/[A-ZА-ЯЁ]/.test(password)) return 'Пароль должен содержать хотя бы одну заглавную букву';
    return null;
}

function showMessage(elementId, message, type = 'error') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.className = type === 'error' ? 'error-message' : 'success-message';
}

// ==================== ПЕРЕКЛЮЧЕНИЕ ПАРОЛЯ ====================
document.addEventListener('DOMContentLoaded', () => {
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

    // ==================== РЕГИСТРАЦИЯ ====================
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const login = document.getElementById('regLogin').value.trim();
            const password = document.getElementById('regPassword').value;
            const passwordConfirm = document.getElementById('regPasswordConfirm').value;

            // Валидация
            if (!name || !email || !login || !password) {
                alert('Заполните все поля');
                return;
            }

            const passwordError = validatePassword(password);
            if (passwordError) {
                alert(passwordError);
                return;
            }

            if (password !== passwordConfirm) {
                alert('Пароли не совпадают');
                return;
            }

            // Проверка уникальности
            const users = getUsers();
            const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
            const loginExists = users.some(u => u.login.toLowerCase() === login.toLowerCase());

            if (emailExists) {
                alert('Пользователь с таким email уже существует');
                return;
            }
            if (loginExists) {
                alert('Такой логин уже занят');
                return;
            }

            // Создание пользователя
            const newUser = {
                id: Date.now(),
                name,
                email,
                login,
                password,
                role: users.length === 0 ? 'admin' : 'user', // первый пользователь = админ
                phone: '',
                bio: '',
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            setUsers(users);

            // Авто-вход
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            alert('Регистрация успешна!');
            window.location.href = 'profile.html';
        });
    }

    // ==================== ВХОД ====================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const emailOrLogin = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!emailOrLogin || !password) {
                alert('Заполните все поля');
                return;
            }

            const users = getUsers();
            const user = users.find(u =>
                u.email.toLowerCase() === emailOrLogin.toLowerCase() ||
                u.login.toLowerCase() === emailOrLogin.toLowerCase()
            );

            if (!user) {
                alert('Пользователь не найден');
                return;
            }

            if (user.password !== password) {
                alert('Неверный пароль');
                return;
            }

            localStorage.setItem('currentUser', JSON.stringify(user));
            alert('Вход выполнен!');
            window.location.href = 'profile.html';
        });
    }
});