// EduManager V2 - Main App Router & Controller

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Init Auth & Role Switcher
  initAuth();

  // Setup Sidebar Navigation Click Handlers
  document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.dataset.view;
      navigateToView(targetView);
    });
  });

  // Setup Modal Tabs Click Handlers
  document.querySelectorAll('.modal-tabs .tab-item').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const container = tab.closest('.modal-card');
      container.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.dataset.target;
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  // Init Module Event Listeners
  initStudentsEvents();
  initClassesEvents();
  initTeachersEvents();
  initPosModule();

  // Load Initial View (Dashboard)
  navigateToView('dashboard');
}

function navigateToView(viewName) {
  // Update Sidebar Menu Active Class
  document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
    if (item.dataset.view === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update Page Title Header
  const titleEl = document.getElementById('page-title');
  const titleMap = {
    dashboard: '📊 Thống kê & Tổng quan Trung tâm',
    students: '🎓 Quản lý Hồ Sơ Học sinh',
    classes: '🏫 Quản lý Lớp học & 12 Đợt học',
    teachers: '👨‍🏫 Quản lý Giáo viên & Quyết toán Thù lao',
    pos: '💵 Thu Tiền (POS) & Xử lý Nợ Lớp Cũ'
  };
  if (titleEl) {
    titleEl.textContent = titleMap[viewName] || 'Trung Tâm Ngoại Ngữ Grow';
  }

  // Switch View Section
  document.querySelectorAll('.view-section').forEach(sec => {
    if (sec.id === `view-${viewName}`) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  // Load Module Data
  if (viewName === 'dashboard') loadDashboardModule();
  if (viewName === 'students') loadStudentsModule();
  if (viewName === 'classes') loadClassesModule();
  if (viewName === 'teachers') loadTeachersModule();
}

// Global Modal Helper Functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Close Modal on Backdrop Click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('active');
  }
});
