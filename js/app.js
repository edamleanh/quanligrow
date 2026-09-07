/* =============================================================================
   EDUMANAGER V2 - MAIN SPA ROUTER & ENTRYPOINT (js/app.js)
   ============================================================================= */

import { renderDashboard } from './dashboard.js';
import { renderStudentsView, renderStudentDetailView } from './students.js';
import { renderClassesView, renderClassDetailView } from './classes.js';
import { renderTeachersView, renderTeacherDetailView } from './teachers.js';
import { renderPOSView } from './pos.js';

// Application State
let activeYear = '2025-2026';
let currentRole = 'ADMIN';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🌱 EduManager V2 Initializing...');

  // Setup Academic Year Selector
  const yearSelect = document.getElementById('select-academic-year');
  if (yearSelect) {
    yearSelect.value = activeYear;
    yearSelect.onchange = (e) => {
      activeYear = e.target.value;
      console.log('Academic year changed to:', activeYear);
      handleRoute();
    };
  }

  // Setup Role Quick Switcher Buttons
  const roleButtons = document.querySelectorAll('.role-btn');
  roleButtons.forEach(btn => {
    btn.onclick = () => {
      roleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRole = btn.getAttribute('data-role');
      console.log('Role switched to:', currentRole);
      handleRoute();
    };
  });

  // Listen to Hash Route Changes
  window.addEventListener('hashchange', handleRoute);

  // Initial Route Load
  if (!window.location.hash) {
    window.location.hash = '#/dashboard';
  } else {
    handleRoute();
  }
});

async function handleRoute() {
  const hash = window.location.hash || '#/dashboard';
  const container = document.getElementById('app-view');
  if (!container) return;

  // Update Active Sidebar Navigation Item
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => item.classList.remove('active'));

  const routeParts = hash.replace('#/', '').split('/');
  const mainRoute = routeParts[0] || 'dashboard';
  const paramId = routeParts[1] || null;

  const activeNavItem = document.querySelector(`.nav-item[data-nav="${mainRoute}"]`);
  if (activeNavItem) {
    activeNavItem.classList.add('active');
  }

  // Route Dispatcher
  switch (mainRoute) {
    case 'dashboard':
      await renderDashboard(container, activeYear);
      break;

    case 'students':
      if (paramId) {
        await renderStudentDetailView(container, paramId);
      } else {
        await renderStudentsView(container);
      }
      break;

    case 'classes':
      if (paramId) {
        await renderClassDetailView(container, paramId);
      } else {
        await renderClassesView(container, activeYear);
      }
      break;

    case 'teachers':
      if (paramId) {
        await renderTeacherDetailView(container, paramId);
      } else {
        await renderTeachersView(container);
      }
      break;

    case 'pos':
      await renderPOSView(container, paramId);
      break;

    default:
      await renderDashboard(container, activeYear);
      break;
  }
}
