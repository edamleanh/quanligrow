/* =============================================================================
   TEACHER CLASS ROSTER MODULE (JS/TEACHER.JS)
   ============================================================================= */

import { fetchAllClasses } from './api.js';

export async function renderTeacherView() {
    const container = document.getElementById('teacher-classes-grid');
    if (!container) return;

    try {
        const classes = await fetchAllClasses();

        if (!classes || classes.length === 0) {
            container.innerHTML = `<p style="color: var(--text-muted); text-align: center;">Chưa có lớp học nào được phân công.</p>`;
            return;
        }

        container.innerHTML = classes.map(c => `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <div>
                        <h4 style="font-size: 1.1rem; color: var(--text-main);">${c.class_name}</h4>
                        <span style="font-size: 0.8rem; color: var(--text-secondary);">Môn: <strong>${c.subject_name}</strong> | Khối ${c.grade}</span>
                    </div>
                    <span class="badge badge-dang-hoc">Đang dạy</span>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; background-color: var(--bg-subtle); padding: 0.6rem 0.9rem; border-radius: var(--radius-md); font-size: 0.85rem;">
                    <span>Giáo viên phụ trách: <strong>${c.teacher_name || 'Đang phân công'}</strong></span>
                    <span>Sĩ số: <strong style="color: var(--primary); font-size: 1rem;">${c.enrolled_count || 0}</strong> học sinh</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error rendering teacher view:', err);
    }
}
