/* =============================================================================
   AUTH & ROLE SWITCHER MODULE (JS/AUTH.JS)
   ============================================================================= */

export let currentRole = 'CASHIER'; // Default role for cashier POS flow

const roleViews = {
    'ADMIN': 'view-admin',
    'CASHIER': 'view-cashier',
    'TEACHER': 'view-teacher'
};

export function initAuth(onRoleChangeCallback) {
    const roleBtns = document.querySelectorAll('.role-btn');

    roleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedRole = btn.getAttribute('data-role');
            if (selectedRole && selectedRole !== currentRole) {
                switchRole(selectedRole, onRoleChangeCallback);
            }
        });
    });

    // Default init
    switchRole('CASHIER', onRoleChangeCallback);
}

export function switchRole(newRole, callback) {
    currentRole = newRole;

    // Update active button UI
    document.querySelectorAll('.role-btn').forEach(btn => {
        if (btn.getAttribute('data-role') === newRole) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Switch view containers
    Object.keys(roleViews).forEach(role => {
        const containerId = roleViews[role];
        const elem = document.getElementById(containerId);
        if (elem) {
            if (role === newRole) {
                elem.style.display = 'block';
            } else {
                elem.style.display = 'none';
            }
        }
    });

    if (typeof callback === 'function') {
        callback(newRole);
    }
}
