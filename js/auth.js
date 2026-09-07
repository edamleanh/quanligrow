/* =============================================================================
   AUTHENTICATION & SESSION MANAGEMENT (JS/AUTH.JS)
   ============================================================================= */

import { authenticateUser } from './api.js';

export let currentUser = null;

const roleViews = {
    'ADMIN': 'view-admin',
    'CASHIER': 'view-cashier',
    'TEACHER': 'view-teacher'
};

export function initAuth(onViewChangeCallback) {
    // 1. Check existing session in localStorage
    const savedUser = localStorage.getItem('edumanager_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
        } catch (e) {
            currentUser = null;
        }
    }

    // 2. Setup Login Form Handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('login-username').value;
            const passwordInput = document.getElementById('login-password').value;
            const errorElem = document.getElementById('login-error-msg');

            errorElem.style.display = 'none';

            try {
                const userObj = await authenticateUser(usernameInput, passwordInput);
                if (userObj) {
                    currentUser = userObj;
                    localStorage.setItem('edumanager_user', JSON.stringify(userObj));
                    applyAuthState(onViewChangeCallback);
                } else {
                    errorElem.innerText = '❌ Sai tên đăng nhập hoặc mật khẩu. Vui lòng thử lại!';
                    errorElem.style.display = 'block';
                }
            } catch (err) {
                errorElem.innerText = '❌ Lỗi đăng nhập: ' + err.message;
                errorElem.style.display = 'block';
            }
        });
    }

    // 3. Setup Quick Login Chips Helper
    document.querySelectorAll('.login-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const u = chip.getAttribute('data-username');
            const p = chip.getAttribute('data-password');
            document.getElementById('login-username').value = u;
            document.getElementById('login-password').value = p;
            document.getElementById('login-form').dispatchEvent(new Event('submit'));
        });
    });

    // 4. Setup Logout Button Handler
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            logout(onViewChangeCallback);
        });
    }

    // Apply initial state
    applyAuthState(onViewChangeCallback);
}

export function logout(callback) {
    currentUser = null;
    localStorage.removeItem('edumanager_user');
    applyAuthState(callback);
}

function applyAuthState(callback) {
    const loginView = document.getElementById('view-login');
    const mainApp = document.getElementById('main-app-content');
    const userProfileHeader = document.getElementById('user-profile-header');

    if (!currentUser) {
        // Not logged in -> Show Login View, Hide App
        if (loginView) loginView.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        if (userProfileHeader) userProfileHeader.style.display = 'none';
    } else {
        // Logged in -> Hide Login View, Show App & User Header
        if (loginView) loginView.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';

        if (userProfileHeader) {
            userProfileHeader.style.display = 'flex';
            document.getElementById('header-user-name').innerText = currentUser.full_name;
            document.getElementById('header-user-role').innerText = getRoleLabel(currentUser.role);
            document.getElementById('header-user-role').className = `badge badge-${getRoleBadgeClass(currentUser.role)}`;
        }

        // Switch to default role view
        switchViewByRole(currentUser.role, callback);
    }
}

function getRoleLabel(role) {
    if (role === 'ADMIN') return '👑 Admin (Chủ trung tâm)';
    if (role === 'CASHIER') return '💵 Thu Ngân';
    if (role === 'TEACHER') return '👨‍🏫 Giáo Viên';
    return role;
}

function getRoleBadgeClass(role) {
    if (role === 'ADMIN') return 'completed';
    if (role === 'CASHIER') return 'dang-hoc';
    return 'tn';
}

function switchViewByRole(role, callback) {
    Object.keys(roleViews).forEach(r => {
        const containerId = roleViews[r];
        const elem = document.getElementById(containerId);
        if (elem) {
            if (r === role) {
                elem.style.display = 'block';
            } else {
                elem.style.display = 'none';
            }
        }
    });

    if (typeof callback === 'function') {
        callback(role);
    }
}
