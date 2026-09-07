/* =============================================================================
   MAIN APP ENTRY POINT (JS/APP.JS)
   ============================================================================= */

import { initAuth } from './auth.js';
import { initPOS } from './pos.js';
import { renderAdminDashboard } from './dashboard.js';
import { renderTeacherView } from './teacher.js';
import { initBatchesManager } from './batches-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Auth & Role Switcher
    initAuth((newRole) => {
        console.log(`Switched to role: ${newRole}`);
        if (newRole === 'ADMIN') {
            renderAdminDashboard();
            initBatchesManager();
        } else if (newRole === 'CASHIER') {
            initPOS();
        } else if (newRole === 'TEACHER') {
            renderTeacherView();
        }
    });

    // 2. Init POS default listeners
    initPOS();

    // 3. Modal close handlers
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(elem => {
        elem.addEventListener('click', (e) => {
            if (e.target === elem || elem.classList.contains('modal-close')) {
                document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
            }
        });
    });
});
