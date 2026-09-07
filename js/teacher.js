/* =============================================================================
   TEACHER CLASS ROSTER & POS FEE COLLECTION MODULE (JS/TEACHER.JS)
   ============================================================================= */

import { fetchTeacherAssignedClasses, fetchClassStudentsRoster } from './api.js';
import { currentUser } from './auth.js';

export async function renderTeacherView() {
    const container = document.getElementById('teacher-classes-grid');
    if (!container) return;

    try {
        const teacherName = currentUser ? currentUser.full_name : 'Trần Văn Anh';
        const classes = await fetchTeacherAssignedClasses(teacherName);

        if (!classes || classes.length === 0) {
            container.innerHTML = `
                <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <p style="color: var(--text-secondary); font-size: 1.1rem;">Chưa tìm thấy lớp học nào được phân công cho <strong>${teacherName}</strong>.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = classes.map(c => `
            <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                        <div>
                            <h4 style="font-size: 1.15rem; color: var(--text-main); font-weight: 700;">${c.class_name}</h4>
                            <span style="font-size: 0.85rem; color: var(--text-secondary);">Môn: <strong>${c.subject_name}</strong> | Khối ${c.grade}</span>
                        </div>
                        <span class="badge badge-dang-hoc">Đang Dạy</span>
                    </div>

                    <div style="background-color: var(--bg-subtle); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                            <span>Sĩ số học sinh:</span>
                            <strong style="color: var(--primary); font-size: 1.05rem;">${c.enrolled_count || 0} học sinh</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Học phí mặc định:</span>
                            <strong>${Number(c.default_fee_rate).toLocaleString('vi-VN')} VNĐ / đợt</strong>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="window.viewClassRoster('${c.class_id}', '${c.class_name}')">
                        📋 Danh Sách Lớp
                    </button>
                    <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="window.openTeacherClassPOS('${c.class_id}', '${c.class_name}')">
                        💵 Thu Phí Lớp Này
                    </button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error rendering teacher view:', err);
    }
}

window.viewClassRoster = async function(classId, className) {
    try {
        const students = await fetchClassStudentsRoster(classId);
        const modalBackdrop = document.getElementById('modal-print-receipt');
        const printableArea = document.getElementById('receipt-print-area');
        if (!modalBackdrop || !printableArea) return;

        printableArea.innerHTML = `
            <div style="padding: 1rem;">
                <h3 style="margin-bottom: 0.5rem; color: var(--text-main);">📋 Danh Sách Học Sinh: ${className}</h3>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">Tổng sĩ số: <strong>${students.length} học sinh</strong></p>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Mã HS</th>
                            <th>Họ và Tên</th>
                            <th>Số Điện Thoại</th>
                            <th>Khối</th>
                            <th>Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map((s, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td><strong>${s.student_code}</strong></td>
                                <td><strong>${s.full_name}</strong></td>
                                <td>${s.phone}</td>
                                <td>Khối ${s.grade}</td>
                                <td><span class="badge badge-dang-hoc">${s.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        modalBackdrop.classList.add('active');
    } catch (err) {
        alert('Lỗi tải danh sách lớp: ' + err.message);
    }
};

window.openTeacherClassPOS = async function(classId, className) {
    try {
        // Switch view to POS and auto-populate student select for this teacher's class
        const posView = document.getElementById('view-cashier');
        const teacherView = document.getElementById('view-teacher');
        if (posView) posView.style.display = 'block';
        if (teacherView) teacherView.style.display = 'none';

        const students = await fetchClassStudentsRoster(classId);
        const searchInput = document.getElementById('pos-student-search');
        if (searchInput && students.length > 0) {
            searchInput.value = students[0].full_name;
            searchInput.dispatchEvent(new Event('input'));
        }
    } catch (err) {
        alert('Lỗi mở POS: ' + err.message);
    }
};
