/* =============================================================================
   EDUMANAGER V2 - MODULE 3: CLASSES MANAGEMENT & DETAILS (js/classes.js)
   ============================================================================= */

import { api } from './api.js';
import { formatCurrency, formatDate, openModal, closeModal, showToast } from './utils.js';

export async function renderClassesView(container, activeYear) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 24px; font-weight: 800; color: var(--text-main);">🏫 Quản Lý Lớp Học</h2>
        <p style="font-size: 14px; color: var(--text-muted);">Danh sách các lớp học Niên khóa ${activeYear}</p>
      </div>
      <button class="btn btn-primary" id="btn-add-class">➕ Tạo Lớp Học Mới</button>
    </div>

    <!-- Filters & Search Bar -->
    <div class="card" style="margin-bottom: 24px; padding: 16px 24px;">
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <input type="text" id="search-class-input" class="form-control" style="flex: 1; min-width: 250px;" placeholder="🔍 Tìm theo Tên lớp học...">
        
        <select id="filter-class-grade" class="form-control" style="width: 150px;">
          <option value="">-- Tất cả Khối --</option>
          ${[1,2,3,4,5,6,7,8,9,10,11,12].map(g => `<option value="${g}">Khối ${g}</option>`).join('')}
        </select>

        <button class="btn btn-secondary" id="btn-search-class">Tìm Kiếm</button>
      </div>
    </div>

    <!-- Classes Grid -->
    <div id="classes-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
      <div style="text-align: center; color: var(--text-muted); padding: 40px; grid-column: 1 / -1;">Đang tải danh sách lớp học...</div>
    </div>
  `;

  document.getElementById('btn-add-class').onclick = () => showClassModal(null, activeYear);
  document.getElementById('btn-search-class').onclick = () => loadClassesData(activeYear);
  document.getElementById('search-class-input').onkeyup = (e) => {
    if (e.key === 'Enter') loadClassesData(activeYear);
  };
  document.getElementById('filter-class-grade').onchange = () => loadClassesData(activeYear);

  loadClassesData(activeYear);
}

async function loadClassesData(activeYear) {
  const search = document.getElementById('search-class-input').value.trim();
  const grade = document.getElementById('filter-class-grade').value;

  const grid = document.getElementById('classes-grid');
  grid.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px; grid-column: 1 / -1;">Đang tải dữ liệu...</div>`;

  try {
    const classes = await api.getClasses({ academic_year: activeYear, search, grade });

    if (classes.length === 0) {
      grid.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px; grid-column: 1 / -1;">Không có lớp học nào trong niên khóa ${activeYear}.</div>`;
      return;
    }

    grid.innerHTML = classes.map(c => `
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main);">${c.class_name}</h3>
            <span class="badge ${c.is_active ? 'badge-active' : 'badge-overdue'}">${c.is_active ? 'Đang Mở' : 'Đã Khóa'}</span>
          </div>

          <div style="font-size: 13px; color: var(--text-muted); display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;">
            <div>📘 Môn: <strong>${c.subjects ? c.subjects.subject_name : '-'}</strong> | <strong>Khối ${c.grade}</strong></div>
            <div>👨‍🏫 GV Phụ trách: <strong>${c.teachers ? c.teachers.full_name : 'Chưa phân công'}</strong></div>
            <div>💰 Học phí đợt: <strong style="color: var(--teal-600);">${formatCurrency(c.default_fee_rate)}</strong></div>
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 12px; border-top: 1px solid var(--border-light); padding-top: 12px;">
          <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="window.location.hash='#/classes/${c.class_id}'">
            👁️ Chi Tiết 12 Đợt Học & Học Sinh
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading classes:', err);
    grid.innerHTML = `<div style="color: var(--status-overdue-color); padding: 40px; text-align: center; grid-column: 1 / -1;">Lỗi tải dữ liệu lớp học.</div>`;
  }
}

// Show Create / Edit Class Modal
export function showClassModal(classObj = null, activeYear = '2025-2026') {
  const isEdit = !!classObj;
  const title = isEdit ? `Sửa Thông Tin Lớp Học (${classObj.class_name})` : 'Tạo Lớp Học Mới';

  Promise.all([api.getSubjects(), api.getTeachers()]).then(([subjects, teachers]) => {
    const bodyHtml = `
      <form id="form-class-modal">
        <div class="form-group">
          <label class="form-label">Tên Lớp Học (*)</label>
          <input type="text" id="m-class-name" class="form-control" required value="${classObj ? classObj.class_name : ''}" placeholder="Ví dụ: Toán 6A, Anh Văn 4B...">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Khối Lớp (*)</label>
            <select id="m-class-grade" class="form-control" required>
              ${[1,2,3,4,5,6,7,8,9,10,11,12].map(g => `<option value="${g}" ${classObj && classObj.grade === g ? 'selected' : ''}>Khối ${g}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Môn Học (*)</label>
            <select id="m-class-subject" class="form-control" required>
              ${subjects.map(s => `<option value="${s.subject_id}" ${classObj && classObj.subject_id === s.subject_id ? 'selected' : ''}>${s.subject_name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Giáo Viên Phụ Trách</label>
            <select id="m-class-teacher" class="form-control">
              <option value="">-- Chưa Phân Công --</option>
              ${teachers.map(t => `<option value="${t.teacher_id}" ${classObj && classObj.teacher_id === t.teacher_id ? 'selected' : ''}>${t.full_name} (${t.teacher_code})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Học Phí Gốc Cho 1 Đợt (VNĐ)</label>
            <input type="number" id="m-class-fee" class="form-control" value="${classObj ? classObj.default_fee_rate : 0}" placeholder="Ví dụ: 300000">
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" onclick="window.closeModal()">Hủy Bỏ</button>
      <button class="btn btn-primary" id="btn-save-class-modal">${isEdit ? 'Cập Nhật' : 'Tạo Lớp & Tự Động Sinh 12 Đợt'}</button>
    `;

    openModal(title, bodyHtml, footerHtml);

    document.getElementById('btn-save-class-modal').onclick = async () => {
      const className = document.getElementById('m-class-name').value.trim();
      const grade = parseInt(document.getElementById('m-class-grade').value, 10);
      const subjectId = parseInt(document.getElementById('m-class-subject').value, 10);
      const teacherId = document.getElementById('m-class-teacher').value || null;
      const feeRate = parseFloat(document.getElementById('m-class-fee').value) || 0;

      if (!className) {
        alert('Vui lòng nhập tên lớp học!');
        return;
      }

      try {
        if (isEdit) {
          await api.updateClass(classObj.class_id, {
            class_name: className,
            grade,
            subject_id: subjectId,
            teacher_id: teacherId,
            default_fee_rate: feeRate
          });
          showToast('Cập nhật lớp học thành công!');
        } else {
          await api.createClass({
            class_name: className,
            academic_year: activeYear,
            grade,
            subject_id: subjectId,
            teacher_id: teacherId,
            default_fee_rate: feeRate,
            is_active: true
          });
          showToast('Tạo mới lớp học & tự động sinh 12 đợt học thành công!');
        }
        closeModal();
        loadClassesData(activeYear);
      } catch (err) {
        console.error('Error saving class:', err);
        showToast('Lỗi lưu lớp học: ' + err.message, 'error');
      }
    };
  });
}

// Render Full-Page Class Details View
export async function renderClassDetailView(container, classId) {
  container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Đang tải thông tin chi tiết lớp học...</div>`;

  try {
    const classObj = await api.getClassById(classId);
    const batches = await api.getBatchesByClass(classId);
    const enrollments = await api.getEnrollmentsByClass(classId);

    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <a href="#/classes" style="color: var(--teal-600); font-weight: 700;">← Quay lại Danh sách Lớp Học</a>
      </div>

      <!-- Class Header Card -->
      <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <h2 style="font-size: 26px; font-weight: 800; color: var(--text-main);">${classObj.class_name}</h2>
              <span class="badge badge-active">Niên khóa ${classObj.academic_year}</span>
              <span class="badge badge-current">Khối ${classObj.grade}</span>
            </div>
            <div style="display: flex; gap: 24px; font-size: 14px; color: var(--text-muted);">
              <span>📘 Môn: <strong>${classObj.subjects ? classObj.subjects.subject_name : '-'}</strong></span>
              <span>👨‍🏫 GV Phụ trách: <strong>${classObj.teachers ? classObj.teachers.full_name : 'Chưa phân công'}</strong></span>
              <span>💰 Học phí đợt: <strong style="color: var(--teal-600);">${formatCurrency(classObj.default_fee_rate)}</strong></span>
              <span>👥 Sĩ số: <strong style="color: var(--accent-600);">${enrollments.length} học sinh</strong></span>
            </div>
          </div>

          <button class="btn btn-secondary" id="btn-edit-class-profile">✏️ Sửa Thông Tin Lớp</button>
        </div>
      </div>

      <!-- Detail Tabs -->
      <div style="display: flex; gap: 16px; border-bottom: 2px solid var(--border-color); margin-bottom: 24px;">
        <button class="tab-btn active" id="tab-btn-batches" style="padding: 12px 20px; font-weight: 700; background: transparent; border: none; border-bottom: 3px solid var(--teal-600); color: var(--teal-600); cursor: pointer;">
          📅 Quản Lý 12 Đợt Học (${batches.length})
        </button>
        <button class="tab-btn" id="tab-btn-roster" style="padding: 12px 20px; font-weight: 700; background: transparent; border: none; color: var(--text-muted); cursor: pointer;">
          👨‍🎓 Danh Sách Học Sinh Trong Lớp (${enrollments.length})
        </button>
      </div>

      <!-- Tab 1: 12 Batches Content -->
      <div id="tab-content-batches" class="card">
        <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 16px;">Danh Sách 12 Đợt Học Của Lớp</h3>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Số Đợt</th>
                <th>Tên Đợt Học</th>
                <th>Học Phí Đợt</th>
                <th>Trạng Thái Đợt</th>
                <th>Giáo Viên Phụ Trách Đợt</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              ${batches.map(b => `
                <tr>
                  <td><strong style="color: var(--teal-600);">Đợt ${b.batch_number}</strong></td>
                  <td><strong>${b.batch_name}</strong></td>
                  <td><strong style="color: var(--teal-600);">${formatCurrency(b.fee_rate)}</strong></td>
                  <td>
                    ${b.status === 'DANG_HOC' ? '<span class="badge badge-current">Đang Học</span>' :
                      b.status === 'COMPLETED' ? '<span class="badge badge-active">Đã Kết Thúc</span>' : '<span class="badge badge-upcoming">Sắp Học</span>'}
                  </td>
                  <td>${b.teachers ? b.teachers.full_name : '<span style="color: var(--text-light)">Theo GV lớp</span>'}</td>
                  <td>
                    <div style="display: flex; gap: 8px;">
                      <button class="btn btn-secondary btn-sm" onclick="window.showEditBatchModal('${b.batch_id}', '${b.batch_name}', ${b.fee_rate}, '${b.status}', '${b.teacher_id || ''}')">
                        ✏️ Sửa Đợt
                      </button>
                      ${b.status !== 'DANG_HOC' ? `
                        <button class="btn btn-primary btn-sm" onclick="window.quickSetCurrentBatch('${classObj.class_id}', ${b.batch_number})">
                          ⚡ Đặt Đợt Hiện Tại
                        </button>
                      ` : '<span style="font-size: 12px; color: var(--teal-600); font-weight: 700;">🟢 Đang diễn ra</span>'}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 2: Student Roster Content -->
      <div id="tab-content-roster" class="card" style="display: none;">
        <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 16px;">Danh Sách Học Sinh Ghi Danh Lớp</h3>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã HS</th>
                <th>Họ Và Tên Học Sinh</th>
                <th>Số Điện Thoại</th>
                <th>Đợt Bắt Đầu</th>
                <th>Đợt Kết Thúc</th>
                <th>Trạng Thái Học</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              ${enrollments.length === 0 ? `
                <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">Lớp chưa có học sinh ghi danh.</td></tr>
              ` : enrollments.map(en => `
                <tr>
                  <td><strong style="color: var(--teal-600);">${en.students ? en.students.student_code : '-'}</strong></td>
                  <td><strong>${en.students ? en.students.full_name : 'Học sinh'}</strong></td>
                  <td>${en.students && en.students.phone ? `📞 ${en.students.phone}` : '-'}</td>
                  <td><span class="badge badge-active">Đợt ${en.start_batch_number || 1}</span></td>
                  <td><span class="badge badge-current">Đợt ${en.end_batch_number || 12}</span></td>
                  <td><span class="badge badge-active">${en.status}</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/students/${en.student_id}'">
                      👁️ Xem Hồ Sơ HS
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind Tab Actions
    const btnBatches = document.getElementById('tab-btn-batches');
    const btnRoster = document.getElementById('tab-btn-roster');
    const contentBatches = document.getElementById('tab-content-batches');
    const contentRoster = document.getElementById('tab-content-roster');

    btnBatches.onclick = () => {
      btnBatches.style.borderBottom = '3px solid var(--teal-600)';
      btnBatches.style.color = 'var(--teal-600)';
      btnRoster.style.borderBottom = 'none';
      btnRoster.style.color = 'var(--text-muted)';
      contentBatches.style.display = 'block';
      contentRoster.style.display = 'none';
    };

    btnRoster.onclick = () => {
      btnRoster.style.borderBottom = '3px solid var(--teal-600)';
      btnRoster.style.color = 'var(--teal-600)';
      btnBatches.style.borderBottom = 'none';
      btnBatches.style.color = 'var(--text-muted)';
      contentRoster.style.display = 'block';
      contentBatches.style.display = 'none';
    };

    document.getElementById('btn-edit-class-profile').onclick = () => showClassModal(classObj, classObj.academic_year);

  } catch (err) {
    console.error('Error loading class details:', err);
    container.innerHTML = `<div style="color: var(--status-overdue-color); padding: 40px; text-align: center;">Lỗi tải thông tin chi tiết lớp học.</div>`;
  }
}

// Modal to Edit Batch Info & Assign Batch Teacher
window.showEditBatchModal = function(batchId, batchName, feeRate, status, teacherId) {
  api.getTeachers().then(teachers => {
    const title = `Chỉnh Sửa Đợt Học (${batchName})`;

    const bodyHtml = `
      <form id="form-edit-batch">
        <div class="form-group">
          <label class="form-label">Tên Đợt Học (*)</label>
          <input type="text" id="m-batch-name" class="form-control" value="${batchName}" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Học Phí Đợt (VNĐ)</label>
            <input type="number" id="m-batch-fee" class="form-control" value="${feeRate}">
          </div>

          <div class="form-group">
            <label class="form-label">Trạng Thái Đợt (*)</label>
            <select id="m-batch-status" class="form-control">
              <option value="DANG_HOC" ${status === 'DANG_HOC' ? 'selected' : ''}>Đang Học</option>
              <option value="UPCOMING" ${status === 'UPCOMING' ? 'selected' : ''}>Sắp Học</option>
              <option value="COMPLETED" ${status === 'COMPLETED' ? 'selected' : ''}>Đã Kết Thúc</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Giáo Viên Phụ Trách Đợt Này</label>
          <select id="m-batch-teacher" class="form-control">
            <option value="">-- Dùng GV mặc định của lớp --</option>
            ${teachers.map(t => `<option value="${t.teacher_id}" ${teacherId === t.teacher_id ? 'selected' : ''}>${t.full_name} (${t.teacher_code})</option>`).join('')}
          </select>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" onclick="window.closeModal()">Hủy Bỏ</button>
      <button class="btn btn-primary" id="btn-save-batch-modal">Cập Nhật Đợt Học</button>
    `;

    openModal(title, bodyHtml, footerHtml);

    document.getElementById('btn-save-batch-modal').onclick = async () => {
      const newName = document.getElementById('m-batch-name').value.trim();
      const newFee = parseFloat(document.getElementById('m-batch-fee').value) || 0;
      const newStatus = document.getElementById('m-batch-status').value;
      const newTeacher = document.getElementById('m-batch-teacher').value || null;

      try {
        await api.updateBatch(batchId, {
          batch_name: newName,
          fee_rate: newFee,
          status: newStatus,
          teacher_id: newTeacher
        });
        showToast('Cập nhật đợt học thành công!');
        closeModal();
        // Refresh details
        const hash = window.location.hash;
        const classId = hash.split('/')[2];
        if (classId) renderClassDetailView(document.getElementById('app-view'), classId);
      } catch (err) {
        console.error('Error updating batch:', err);
        showToast('Lỗi cập nhật đợt học: ' + err.message, 'error');
      }
    };
  });
};

// 1-Click Quick Set Current Batch for a Class
window.quickSetCurrentBatch = async function(classId, batchNumber) {
  if (!confirm(`Bạn có chắc muốn chuyển Lớp này sang Đợt ${batchNumber}? (Các đợt trước sẽ tự động chuyển thành "Đã Kết Thúc", đợt sau thành "Sắp Học")`)) {
    return;
  }
  try {
    await api.setCurrentClassBatch(classId, batchNumber);
    showToast(`Đã cập nhật Lớp học sang Đợt ${batchNumber} thành công!`);
    renderClassDetailView(document.getElementById('app-view'), classId);
  } catch (err) {
    console.error('Error quick setting batch:', err);
    showToast('Lỗi chuyển đợt: ' + err.message, 'error');
  }
};
