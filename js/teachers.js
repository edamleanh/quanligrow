/* =============================================================================
   EDUMANAGER V2 - MODULE 4: TEACHERS MANAGEMENT & PAYROLL (js/teachers.js)
   ============================================================================= */

import { api } from './api.js';
import { formatCurrency, openModal, closeModal, showToast } from './utils.js';

export async function renderTeachersView(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 24px; font-weight: 800; color: var(--text-main);">👨‍🏫 Quản Lý Giáo Viên</h2>
        <p style="font-size: 14px; color: var(--text-muted);">Danh sách đội ngũ giảng dạy & Báo cáo thù lao Payroll</p>
      </div>
      <button class="btn btn-primary" id="btn-add-teacher">➕ Thêm Mới Giáo Viên</button>
    </div>

    <!-- Search Bar -->
    <div class="card" style="margin-bottom: 24px; padding: 16px 24px;">
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <div style="position: relative; flex: 1; min-width: 250px;">
          <input type="text" id="search-teacher-input" class="form-control" placeholder="🔍 Tìm theo Họ tên, SĐT, Mã giáo viên..." autocomplete="off">
          <div id="search-teacher-suggestions" style="display: none; position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15); max-height: 280px; overflow-y: auto; margin-top: 4px;"></div>
        </div>
        <button class="btn btn-secondary" id="btn-search-teacher">Tìm Kiếm</button>
      </div>
    </div>

    <!-- Teachers Table Card -->
    <div class="card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã GV</th>
              <th>Họ Và Tên Giáo Viên</th>
              <th>Số Điện Thoại</th>
              <th>Môn Chuyên Môn</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody id="teacher-table-body">
            <tr>
              <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">Đang tải danh sách giáo viên...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const teacherSearchInput = document.getElementById('search-teacher-input');
  const teacherSuggestionsBox = document.getElementById('search-teacher-suggestions');
  let teacherSearchTimer = null;

  document.getElementById('btn-add-teacher').onclick = () => showTeacherModal();
  document.getElementById('btn-search-teacher').onclick = () => {
    teacherSuggestionsBox.style.display = 'none';
    loadTeachersData();
  };

  teacherSearchInput.oninput = (e) => {
    const val = e.target.value.trim().toLowerCase();
    clearTimeout(teacherSearchTimer);

    // Live search table refresh
    teacherSearchTimer = setTimeout(() => {
      loadTeachersData();
    }, 250);

    // Proposal Autocomplete Dropdown
    if (val.length >= 1) {
      api.getTeachers().then(allTeachers => {
        const matches = allTeachers.filter(t => 
          t.full_name.toLowerCase().includes(val) ||
          t.teacher_code.toLowerCase().includes(val) ||
          (t.phone && t.phone.includes(val))
        );

        if (!matches || matches.length === 0) {
          teacherSuggestionsBox.innerHTML = `<div style="padding: 12px; color: var(--text-muted); text-align: center; font-size: 13px;">Không tìm thấy giáo viên phù hợp</div>`;
        } else {
          teacherSuggestionsBox.innerHTML = matches.slice(0, 6).map(t => `
            <div class="teacher-suggestion-item" data-id="${t.teacher_id}" style="padding: 10px 14px; border-bottom: 1px solid var(--border-light); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.15s;" onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='transparent'">
              <div>
                <strong style="color: var(--teal-600);">${t.teacher_code}</strong> - <strong>${t.full_name}</strong>
                <div style="font-size: 12px; color: var(--text-muted);">Môn: ${t.subjects ? t.subjects.subject_name : 'Chưa phân'} | SĐT: ${t.phone || 'Chưa có'}</div>
              </div>
              <span class="badge badge-active" style="font-size: 11px;">Xem Lương/Lớp ➔</span>
            </div>
          `).join('');

          teacherSuggestionsBox.querySelectorAll('.teacher-suggestion-item').forEach(el => {
            el.onclick = () => {
              const tid = el.getAttribute('data-id');
              teacherSuggestionsBox.style.display = 'none';
              window.location.hash = `#/teachers/${tid}`;
            };
          });
        }
        teacherSuggestionsBox.style.display = 'block';
      }).catch(err => console.error('Error getting teacher proposals:', err));
    } else {
      teacherSuggestionsBox.style.display = 'none';
    }
  };

  // Close dropdown on click outside
  document.addEventListener('click', (evt) => {
    if (teacherSuggestionsBox && !teacherSearchInput.contains(evt.target) && !teacherSuggestionsBox.contains(evt.target)) {
      teacherSuggestionsBox.style.display = 'none';
    }
  });

  loadTeachersData();
}

async function loadTeachersData() {
  const search = document.getElementById('search-teacher-input').value.trim().toLowerCase();
  const tbody = document.getElementById('teacher-table-body');

  try {
    let teachers = await api.getTeachers();

    if (search) {
      teachers = teachers.filter(t => 
        t.full_name.toLowerCase().includes(search) ||
        t.teacher_code.toLowerCase().includes(search) ||
        (t.phone && t.phone.includes(search))
      );
    }

    if (teachers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">Không tìm thấy giáo viên nào.</td></tr>`;
      return;
    }

    tbody.innerHTML = teachers.map(t => `
      <tr>
        <td><strong style="color: var(--teal-600);">${t.teacher_code}</strong></td>
        <td><strong>${t.full_name}</strong></td>
        <td>${t.phone ? `📞 ${t.phone}` : '<span style="color: var(--text-light); italic">Chưa có SĐT</span>'}</td>
        <td><span class="badge badge-upcoming">${t.subjects ? t.subjects.subject_name : 'Toàn diện'}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/teachers/${t.teacher_id}'">
            👁️ Chi Tiết & Payroll
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading teachers:', err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--status-overdue-color); padding: 24px;">Lỗi tải danh sách giáo viên.</td></tr>`;
  }
}

// Show Create/Edit Teacher Modal
export function showTeacherModal(teacher = null) {
  const isEdit = !!teacher;
  const title = isEdit ? `Sửa Thông Tin Giáo Viên (${teacher.teacher_code})` : 'Thêm Mới Giáo Viên';

  api.getSubjects().then(subjects => {
    const bodyHtml = `
      <form id="form-teacher-modal">
        <div class="form-group">
          <label class="form-label">Họ Và Tên Giáo Viên (*)</label>
          <input type="text" id="m-teacher-name" class="form-control" required value="${teacher ? teacher.full_name : ''}" placeholder="Nhập tên giáo viên...">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Số Điện Thoại (Tùy chọn)</label>
            <input type="text" id="m-teacher-phone" class="form-control" value="${teacher && teacher.phone ? teacher.phone : ''}" placeholder="Ví dụ: 0987654321">
          </div>

          <div class="form-group">
            <label class="form-label">Môn Chuyên Môn (*)</label>
            <select id="m-teacher-subject" class="form-control" required>
              <option value="">-- Chọn Môn Chuyên Môn --</option>
              ${subjects.map(s => `<option value="${s.subject_id}" ${teacher && teacher.specialization_subject_id === s.subject_id ? 'selected' : ''}>${s.subject_name}</option>`).join('')}
            </select>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" onclick="window.closeModal()">Hủy Bỏ</button>
      <button class="btn btn-primary" id="btn-save-teacher-modal">${isEdit ? 'Cập Nhật' : 'Tạo Mới'}</button>
    `;

    openModal(title, bodyHtml, footerHtml);

    document.getElementById('btn-save-teacher-modal').onclick = async () => {
      const name = document.getElementById('m-teacher-name').value.trim();
      const phone = document.getElementById('m-teacher-phone').value.trim() || null;
      const subId = parseInt(document.getElementById('m-teacher-subject').value, 10) || null;

      if (!name) {
        alert('Vui lòng nhập tên giáo viên!');
        return;
      }

      try {
        if (isEdit) {
          await api.updateTeacher(teacher.teacher_id, {
            full_name: name,
            phone,
            specialization_subject_id: subId
          });
          showToast('Cập nhật giáo viên thành công!');
        } else {
          const code = `GV${Date.now().toString().slice(-4)}`;
          await api.createTeacher({
            teacher_code: code,
            full_name: name,
            phone,
            specialization_subject_id: subId
          });
          showToast('Tạo mới giáo viên thành công!');
        }
        closeModal();
        const hash = window.location.hash;
        if (hash.startsWith('#/teachers/') && isEdit && teacher) {
          renderTeacherDetailView(document.getElementById('app-view'), teacher.teacher_id);
        } else {
          loadTeachersData();
        }
      } catch (err) {
        console.error('Error saving teacher:', err);
        showToast('Lỗi lưu thông tin giáo viên: ' + err.message, 'error');
      }
    };
  });
}

// Render Full-Page Teacher Details View & Payroll Report
export async function renderTeacherDetailView(container, teacherId) {
  container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Đang tải báo cáo thù lao giáo viên...</div>`;

  try {
    const teacher = await api.getTeacherById(teacherId);
    const payrollData = await api.getTeacherPayroll(teacherId);

    const totalRevenue = payrollData.reduce((sum, p) => sum + Number(p.total_tuition_collected || 0), 0);

    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <a href="#/teachers" style="color: var(--teal-600); font-weight: 700;">← Quay lại Danh sách Giáo Viên</a>
      </div>

      <!-- Teacher Header Card -->
      <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <h2 style="font-size: 26px; font-weight: 800; color: var(--text-main);">${teacher.full_name}</h2>
              <span class="badge badge-active">${teacher.teacher_code}</span>
              <span class="badge badge-upcoming">${teacher.subjects ? teacher.subjects.subject_name : 'Toàn diện'}</span>
            </div>
            <div style="display: flex; gap: 24px; font-size: 14px; color: var(--text-muted);">
              <span>📞 SĐT: <strong>${teacher.phone || 'Chưa có SĐT'}</strong></span>
              <span>💰 Tổng doanh thu thực thu các đợt phụ trách: <strong style="color: var(--teal-600); font-size: 16px;">${formatCurrency(totalRevenue)}</strong></span>
            </div>
          </div>

          <button class="btn btn-secondary" id="btn-edit-teacher-profile">✏️ Sửa Thông Tin</button>
        </div>
      </div>

      <!-- Detail Tabs -->
      <div style="display: flex; gap: 16px; border-bottom: 2px solid var(--border-color); margin-bottom: 24px;">
        <button class="tab-btn active" id="tab-btn-payroll" style="padding: 12px 20px; font-weight: 700; background: transparent; border: none; border-bottom: 3px solid var(--teal-600); color: var(--teal-600); cursor: pointer;">
          📊 Báo Cáo Thù Lao & Doanh Thu Đợt (${payrollData.length})
        </button>
      </div>

      <!-- Payroll Content -->
      <div id="tab-content-payroll" class="card">
        <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 16px;">Chi Tiết Doanh Thu Thực Thu Theo Đợt Giáo Viên Trực Tiếp Dạy</h3>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã Lớp</th>
                <th>Tên Lớp Học</th>
                <th>Niên Khóa</th>
                <th>Đợt Học</th>
                <th>Sĩ Số Học Sinh</th>
                <th>Tổng Học Phí Thực Thu (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              ${payrollData.length === 0 ? `
                <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">Giáo viên chưa được phân công đợt dạy nào.</td></tr>
              ` : payrollData.map(p => `
                <tr>
                  <td><strong style="color: var(--teal-600);">${p.class_id ? p.class_id.substring(0, 8) : '-'}</strong></td>
                  <td><strong>${p.class_name}</strong></td>
                  <td>${p.academic_year}</td>
                  <td><span class="badge badge-current">${p.batch_name}</span></td>
                  <td><strong>${p.enrolled_students} học sinh</strong></td>
                  <td><strong style="color: var(--primary-600); font-size: 15px;">${formatCurrency(p.total_tuition_collected)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btn-edit-teacher-profile').onclick = () => showTeacherModal(teacher);

  } catch (err) {
    console.error('Error loading teacher details:', err);
    container.innerHTML = `<div style="color: var(--status-overdue-color); padding: 40px; text-align: center;">Lỗi tải báo cáo thù lao giáo viên.</div>`;
  }
}
