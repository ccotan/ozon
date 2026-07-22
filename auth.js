import { auth, googleProvider, db } from './firebase.js';
import { 
    signInWithPopup, createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from './firebase.js';
import { doc, setDoc, getDocs, collection } from './firebase.js';

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (window.updateHeaderCallback) {
        window.updateHeaderCallback(user);
    }
});

export function getCurrentUser() {
    return currentUser;
}

export async function logoutUser() {
    await signOut(auth);
    window.location.href = 'index.html';
}

export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const userDocSnap = await getDocs(collection(db, 'users'));
        const exists = userDocSnap.docs.some(d => d.id === user.uid);
        
        if (!exists) {
            const usersCount = userDocSnap.size;
            const role = usersCount === 0 ? 'admin' : 'user';
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: user.displayName || 'Пользователь',
                email: user.email,
                login: user.email.split('@')[0],
                role,
                phone: '',
                bio: '',
                avatar: user.photoURL || null,
                background: null,
                deliveryMethods: [],
                banned: false,
                provider: 'google',
                createdAt: new Date().toISOString()
            });
        }
        return user;
    } catch (error) {
        console.error('Ошибка входа через Google:', error);
        alert('Ошибка входа через Google: ' + error.message);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const googleBtn = document.getElementById('googleLoginBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            const user = await signInWithGoogle();
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists() && userDoc.data().banned) {
                    alert('Ваш аккаунт заблокирован');
                    await signOut(auth);
                    return;
                }
                window.location.href = 'profile.html';
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const passwordConfirm = document.getElementById('regPasswordConfirm').value;

            if (!name || !email || !password) { alert('Заполните все поля'); return; }
            if (password.length < 8) { alert('Минимум 8 символов'); return; }
            if (!/[0-9]/.test(password)) { alert('Нужна хотя бы одна цифра'); return; }
            if (!/[A-ZА-ЯЁ]/.test(password)) { alert('Нужна заглавная буква'); return; }
            if (password !== passwordConfirm) { alert('Пароли не совпадают'); return; }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const users = await getDocs(collection(db, 'users'));
                const role = users.empty ? 'admin' : 'user';
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    name, email,
                    login: email.split('@')[0],
                    role,
                    phone: '', bio: '',
                    avatar: null, background: null,
                    deliveryMethods: [],
                    banned: false,
                    provider: 'email',
                    createdAt: new Date().toISOString()
                });
                window.location.href = 'profile.html';
            } catch (error) {
                alert('Ошибка: ' + error.message);
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) { alert('Заполните все поля'); return; }

            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = 'profile.html';
            } catch (error) {
                alert('Ошибка: ' + error.message);
            }
        });
    }
});
