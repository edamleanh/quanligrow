// EduManager V2 - Authentication & Role State Management

const CURRENT_USER_KEY = 'edumanager_current_role';

// Default Role State
let currentRoleState = {
  role: 'ADMIN',
  name: 'Admin Quan Tri',
  avatar: 'A'
};

function initAuth() {
  const savedRole = localStorage.getItem(CURRENT_USER_KEY) || 'ADMIN';
  switchRole(savedRole, false);

  // Setup Event Listeners for 1-Click Role Buttons
  document.querySelectorAll('.btn-role').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const selectedRole = e.target.dataset.role;
      switchRole(selectedRole, true);
    });
  });
}

function switchRole(role, triggerNavigation = true) {
  let roleName = 'ADMINISTRATOR';
  let displayName = 'Admin Quan Tri';
  let avatar = 'A';

  if (role === 'CASHIER') {
    roleName = 'CASHIER (THU NGÂN)';
    displayName = 'Thu Ngân Phương Anh';
    avatar = 'TN';
  } else if (role === 'TEACHER') {
    roleName = 'TEACHER (GIÁO VIÊN)';
    displayName = 'Thầy Nguyễn Văn Nam';
    avatar = 'GV';
  }

  currentRoleState = { role, name: displayName, avatar };
  localStorage.setItem(CURRENT_USER_KEY, role);

  // Update UI Elements
  document.getElementById('current-user-avatar').textContent = avatar;
  document.getElementById('current-user-name').textContent = displayName;
  document.getElementById('current-user-role').textContent = roleName;

  // Update Active Button
  document.querySelectorAll('.btn-role').forEach(btn => {
    if (btn.dataset.role === role) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Adjust Sidebar Visibility based on Role
  applyRolePermissions(role, triggerNavigation);
}

function applyRolePermissions(role, triggerNavigation) {
  const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
  
  menuItems.forEach(item => {
    const view = item.dataset.view;
    if (role === 'ADMIN') {
      item.style.display = 'flex';
    } else if (role === 'CASHIER') {
      if (view === 'pos' || view === 'students' || view === 'dashboard') {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    } else if (role === 'TEACHER') {
      if (view === 'classes' || view === 'dashboard') {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    }
  });

  if (triggerNavigation) {
    if (role === 'CASHIER') {
      navigateToView('pos');
    } else if (role === 'TEACHER') {
      navigateToView('classes');
    } else {
      navigateToView('dashboard');
    }
  }
}
