/* =============================================================================
   EDUMANAGER V2 - MODULE 2: STUDENTS MANAGEMENT & DETAILS (js/students.js)
   ============================================================================= */

import { api } from './api.js';
import { formatCurrency, formatDate, formatDateTime, openModal, closeModal, showToast } from './utils.js';

export async function renderStudentsView(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 24px; font-weight: 800; color: var(--text-main);">👨‍🎓 Quản Lý Học Sinh</h2>
        <p style="font-size: 14px; color: var(--text-muted);">Danh sách 1,423 hồ sơ học sinh toàn trung tâm</p>
      </div>
      <button class="btn btn-primary" id="btn-add-student">➕ Thêm Mới Học Sinh</button>
    </div>

    <!-- Filters & Search Bar -->
    <div class="card" style="margin-bottom: 24px; padding: 16px 24px;">
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <input type="text" id="search-student-input" class="form-control" style="flex: 1; min-width: 250px;" placeholder="🔍 Tìm theo Họ tên, SĐT, Mã học sinh (VD: HS00120)...">
        
        <select id="filter-grade" class="form-control" style="width: 150px;">
          <option value="">-- Tất cả Khối --</option>
          ${[1,2,3,4,5,6,7,8,9,10,11,12].map(g => `<option value="${g}">Khối ${g}</option>`).join('')}
        </select>

        <button class="btn btn-secondary" id="btn-search-student">Tìm Kiếm</button>
      </div>
    </div>

    <!-- Student Table Card -->
    <div class="card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã HS</th>
              <th>Họ Và Tên Học Sinh</th>
              <th>Số Điện Thoại</th>
              <th>Khối</th>
              <th>Các Lớp Đang Học</th>
              <th>Trạng Thái</th>
              <th>Ghi Chú</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody id="student-table-body">
            <tr>
              <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">Đang tải danh sách học sinh...</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div id="student-pagination" style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;"></div>
    </div>
  `;

  // Bind Events
  document.getElementById('btn-add-student').onclick = () => showStudentModal();
  document.getElementById('btn-search-student').onclick = () => loadStudentsData();
  document.getElementById('search-student-input').onkeyup = (e) => {
    if (e.key === 'Enter') loadStudentsData();
  };
  document.getElementById('filter-grade').onchange = () => loadStudentsData();

  loadStudentsData();
}

async function loadStudentsData() {
  const search = document.getElementById('search-student-input').value.trim();
  const grade = document.getElementById('filter-grade').value;

  const tbody = document.getElementById('student-table-body');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">Đang tải dữ liệu...</td></tr>`;

  try {
    const { data: students, count } = await api.getStudents({ search, grade });

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">Không tìm thấy học sinh nào phù hợp.</td></tr>`;
      return;
    }

    tbody.innerHTML = students.slice(0, 50).map(s => {
      const activeClasses = (s.enrollments || [])
        .filter(e => e.status === 'ACTIVE')
        .map(e => e.classes ? e.classes.class_name : '')
        .filter(Boolean);

      const activeClassesHtml = activeClasses.length > 0
        ? activeClasses.map(cName => `<span class="badge badge-active" style="margin-right: 4px; margin-bottom: 2px;">${cName}</span>`).join('')
        : `<span style="color: var(--text-light); font-style: italic; font-size: 12px;">Chưa có lớp</span>`;

      const statusBadgeHtml = s.status === 'DA_TN'
        ? `<span class="badge badge-upcoming">Đã Tốt Nghiệp</span>`
        : activeClasses.length > 0
          ? `<span class="badge badge-active">Đang Học</span>`
          : `<span class="badge badge-current">Chưa Có Lớp</span>`;

      return `
        <tr>
          <td><strong style="color: var(--teal-600);">${s.student_code}</strong></td>
          <td><strong>${s.full_name}</strong></td>
          <td>${s.phone ? `📞 ${s.phone}` : '<span style="color: var(--text-light); italic">Chưa có SĐT</span>'}</td>
          <td><span class="badge badge-current">Khối ${s.grade}</span></td>
          <td style="max-width: 250px; font-size: 13px;">${activeClassesHtml}</td>
          <td>${statusBadgeHtml}</td>
          <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--text-muted);">${s.notes || '-'}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/students/${s.student_id}'">
              👁️ Xem Chi Tiết
            </button>
          </td>
        </tr>
      `;
    }).join('');

    document.getElementById('student-pagination').innerText = `Hiển thị ${Math.min(50, students.length)} / Tổng số ${count} học sinh`;
  } catch (err) {
    console.error('Error loading students:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--status-overdue-color); padding: 24px;">Lỗi tải dữ liệu học sinh.</td></tr>`;
  }
}

// Show Student Add/Edit Modal
export function showStudentModal(student = null) {
  const isEdit = !!student;
  const title = isEdit ? `Sửa Hồ Sơ Học Sinh (${student.student_code})` : 'Thêm Mới Hồ Sơ Học Sinh';

  const bodyHtml = `
    <form id="form-student-modal">
      <div class="form-group">
        <label class="form-label">Họ Và Tên Học Sinh (*)</label>
        <input type="text" id="m-full-name" class="form-control" required value="${student ? student.full_name : ''}" placeholder="Nhập đầy đủ họ tên học sinh...">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div class="form-group">
          <label class="form-label">Số Điện Thoại (Tùy chọn)</label>
          <input type="text" id="m-phone" class="form-control" value="${student && student.phone ? student.phone : ''}" placeholder="Ví dụ: 0912345678">
        </div>

        <div class="form-group">
          <label class="form-label">Khối Lớp (*)</label>
          <select id="m-grade" class="form-control" required>
            ${[1,2,3,4,5,6,7,8,9,10,11,12].map(g => `
              <option value="${g}" ${student && student.grade === g ? 'selected' : ''}>Khối ${g}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Ghi Chú / Trường Học</label>
        <textarea id="m-notes" class="form-control" rows="3" placeholder="Nhập thông tin trường học, ghi chú cá nhân...">${student && student.notes ? student.notes : ''}</textarea>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="window.closeModal()">Hủy Bỏ</button>
    <button class="btn btn-primary" id="btn-save-student-modal">${isEdit ? 'Cập Nhật' : 'Tạo Mới'}</button>
  `;

  openModal(title, bodyHtml, footerHtml);

  document.getElementById('btn-save-student-modal').onclick = async () => {
    const fullName = document.getElementById('m-full-name').value.trim();
    const phone = document.getElementById('m-phone').value.trim();
    const grade = parseInt(document.getElementById('m-grade').value, 10);
    const notes = document.getElementById('m-notes').value.trim();

    if (!fullName) {
      alert('Vui lòng nhập họ tên học sinh!');
      return;
    }

    try {
      if (isEdit) {
        await api.updateStudent(student.student_id, { full_name: fullName, phone, grade, notes });
        showToast('Cập nhật thông tin học sinh thành công!');
      } else {
        const studentCode = `HS${Date.now().toString().slice(-5)}`;
        await api.createStudent({ student_code: studentCode, full_name: fullName, phone, grade, notes, status: 'DANG_HOC' });
        showToast('Tạo mới học sinh thành công!');
      }
      closeModal();
      loadStudentsData();
    } catch (err) {
      console.error('Error saving student:', err);
      showToast('Lỗi lưu thông tin học sinh: ' + err.message, 'error');
    }
  };
}

// Render Full-Page Student Details View
export async function renderStudentDetailView(container, studentId) {
  container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Đang tải thông tin chi tiết học sinh...</div>`;

  try {
    const student = await api.getStudentById(studentId);
    const enrollments = await api.getEnrollmentsByStudent(studentId);
    const receipts = await api.getReceiptsByStudent(studentId);

    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <a href="#/students" style="color: var(--teal-600); font-weight: 700;">← Quay lại Danh sách Học Sinh</a>
      </div>

      <!-- Profile Header Card -->
      <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <h2 style="font-size: 26px; font-weight: 800; color: var(--text-main);">${student.full_name}</h2>
              <span class="badge badge-active">${student.student_code}</span>
              <span class="badge badge-current">Khối ${student.grade}</span>
            </div>
            <div style="display: flex; gap: 24px; font-size: 14px; color: var(--text-muted);">
              <span>📞 SĐT: <strong>${student.phone || 'Chưa có SĐT'}</strong></span>
              <span>📅 Ngày tạo: <strong>${formatDate(student.created_at)}</strong></span>
              <span>📝 Ghi chú: <strong>${student.notes || 'Không có'}</strong></span>
            </div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" id="btn-edit-student-profile">✏️ Sửa Thông Tin</button>
            <button class="btn btn-accent" id="btn-transfer-class">🔄 Chuyển Lớp / Gia Nhập Lớp Mới</button>
            <button class="btn btn-primary" onclick="window.openPOSForStudent('${student.student_id}')">💳 Thu Tiền POS</button>
          </div>
        </div>
      </div>

      <!-- Detail Tabs -->
      <div style="display: flex; gap: 16px; border-bottom: 2px solid var(--border-color); margin-bottom: 24px;">
        <button class="tab-btn active" id="tab-btn-classes" style="padding: 12px 20px; font-weight: 700; background: transparent; border: none; border-bottom: 3px solid var(--teal-600); color: var(--teal-600); cursor: pointer;">
          🏫 Lớp Đã Ghi Danh (${enrollments.length})
        </button>
        <button class="tab-btn" id="tab-btn-receipts" style="padding: 12px 20px; font-weight: 700; background: transparent; border: none; color: var(--text-muted); cursor: pointer;">
          💳 Lịch Sử Biên Lai Thu Tiền (${receipts.length})
        </button>
      </div>

      <!-- Tab 1: Enrolled Classes Content -->
      <div id="tab-content-classes" class="card">
        <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 16px;">Danh Sách Lớp Học Sinh Đăng Ký & Lịch Sử Chuyển Lớp</h3>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tên Lớp Học</th>
                <th>Niên Khóa</th>
                <th>Môn Học</th>
                <th>Đợt Bắt Đầu</th>
                <th>Đợt Kết Thúc</th>
                <th>Ngày Đăng Ký</th>
                <th>Trạng Thái Ghi Danh</th>
              </tr>
            </thead>
            <tbody>
              ${enrollments.length === 0 ? `
                <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">Học sinh chưa ghi danh lớp nào.</td></tr>
              ` : enrollments.map(en => `
                <tr>
                  <td><strong>${en.classes ? en.classes.class_name : 'Lớp không tồn tại'}</strong></td>
                  <td>${en.classes ? en.classes.academic_year : '-'}</td>
                  <td><span class="badge badge-upcoming">${en.classes && en.classes.subjects ? en.classes.subjects.subject_name : '-'}</span></td>
                  <td><span class="badge badge-active">Đợt ${en.start_batch_number || 1}</span></td>
                  <td><span class="badge badge-current">Đợt ${en.end_batch_number || 12}</span></td>
                  <td>${formatDate(en.enrolled_at)}</td>
                  <td>
                    ${en.status === 'ACTIVE' ? '<span class="badge badge-active">Đang Học</span>' :
                      en.status === 'TRANSFERRED' ? '<span class="badge badge-overdue">Đã Chuyển Lớp</span>' : '<span class="badge badge-upcoming">Đã Thôi Học</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 2: Receipts History Content -->
      <div id="tab-content-receipts" class="card" style="display: none;">
        <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 16px;">Lịch Sử Các Biên Lai Học Phí Đã Lập</h3>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã Biên Lai</th>
                <th>Ngày & Giờ Lập</th>
                <th>Loại Thu</th>
                <th>Chi Tiết Các Mục Đóng</th>
                <th>Tổng Tiền</th>
                <th>Mã Biên Lai Tay</th>
              </tr>
            </thead>
            <tbody>
              ${receipts.length === 0 ? `
                <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">Chưa có biên lai đóng tiền nào.</td></tr>
              ` : receipts.map(r => `
                <tr>
                  <td><strong style="color: var(--teal-600);">${r.receipt_code}</strong></td>
                  <td>${formatDateTime(r.receipt_date)}</td>
                  <td><span class="badge badge-active">${r.receipt_type === 'IN_MAY' ? 'In Máy' : 'Nhập Tay'}</span></td>
                  <td style="font-size: 13px;">
                    ${(r.receipt_items || []).map(i => `
                      <div>• <strong>${i.classes ? i.classes.class_name : 'Lớp'}</strong> - ${i.batches ? i.batches.batch_name : 'Đợt'}: <span style="color: var(--teal-600); font-weight: 700;">${formatCurrency(i.amount_paid)}</span></div>
                    `).join('')}
                  </td>
                  <td><strong style="color: var(--primary-600); font-size: 16px;">${formatCurrency(r.total_amount)}</strong></td>
                  <td>${r.manual_receipt_code || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind Tab Actions
    const btnClasses = document.getElementById('tab-btn-classes');
    const btnReceipts = document.getElementById('tab-btn-receipts');
    const contentClasses = document.getElementById('tab-content-classes');
    const contentReceipts = document.getElementById('tab-content-receipts');

    btnClasses.onclick = () => {
      btnClasses.style.borderBottom = '3px solid var(--teal-600)';
      btnClasses.style.color = 'var(--teal-600)';
      btnReceipts.style.borderBottom = 'none';
      btnReceipts.style.color = 'var(--text-muted)';
      contentClasses.style.display = 'block';
      contentReceipts.style.display = 'none';
    };

    btnReceipts.onclick = () => {
      btnReceipts.style.borderBottom = '3px solid var(--teal-600)';
      btnReceipts.style.color = 'var(--teal-600)';
      btnClasses.style.borderBottom = 'none';
      btnClasses.style.color = 'var(--text-muted)';
      contentReceipts.style.display = 'block';
      contentClasses.style.display = 'none';
    };

    document.getElementById('btn-edit-student-profile').onclick = () => showStudentModal(student);
    document.getElementById('btn-transfer-class').onclick = () => showTransferClassModal(student, enrollments);

  } catch (err) {
    console.error('Error loading student details:', err);
    container.innerHTML = `<div style="color: var(--status-overdue-color); padding: 40px; text-align: center;">Lỗi tải thông tin chi tiết học sinh.</div>`;
  }
}

// Show Class Transfer & Enrollment Modal
function showTransferClassModal(student, existingEnrollments) {
  const activeEnrollments = existingEnrollments.filter(e => e.status === 'ACTIVE');

  api.getClasses().then(allClasses => {
    const title = `Chuyển Lớp / Gia Nhập Lớp Mới cho ${student.full_name}`;

    const bodyHtml = `
      <form id="form-transfer-modal">
        <div style="background: #f8fafc; padding: 12px 16px; border-radius: var(--radius-md); margin-bottom: 16px; font-size: 13px; color: var(--text-muted);">
          ℹ️ <strong>Quy tắc Chuyển Đợt</strong>: Hệ thống sẽ tự động lưu Đợt học kết thúc ở Lớp cũ và ghi nhận Đợt bắt đầu ở Lớp mới. Khoản nợ đợt cũ (nếu có) sẽ được bảo lưu nguyên vẹn.
        </div>

        <div class="form-group">
          <label class="form-label">Chọn Lớp Muốn Đăng Ký / Chuyển Đến (*)</label>
          <select id="m-target-class" class="form-control" required>
            <option value="">-- Chọn Lớp Học --</option>
            ${allClasses.map(c => `<option value="${c.class_id}">${c.class_name} (${c.academic_year})</option>`).join('')}
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Gia Nhập Từ Đợt Mấy? (*)</label>
            <select id="m-start-batch" class="form-control" required>
              ${[1,2,3,4,5,6,7,8,9,10,11,12].map(b => `<option value="${b}">Đợt ${b}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Đợt Kết Thúc Dự Kiến</label>
            <select id="m-end-batch" class="form-control">
              ${[12,11,10,9,8,7,6,5,4,3,2,1].map(b => `<option value="${b}">Đợt ${b}</option>`).join('')}
            </select>
          </div>
        </div>

        ${activeEnrollments.length > 0 ? `
          <div class="form-group" style="margin-top: 16px;">
            <label class="form-label">Nếu đang học lớp khác, Đợt Kết Thúc Ở Lớp Cũ Là Đợt Mấy?</label>
            <select id="m-old-end-batch" class="form-control">
              ${[1,2,3,4,5,6,7,8,9,10,11,12].map(b => `<option value="${b}" ${b === 4 ? 'selected' : ''}>Chuyển khỏi lớp cũ ở Đợt ${b}</option>`).join('')}
            </select>
          </div>
        ` : ''}
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" onclick="window.closeModal()">Hủy Bỏ</button>
      <button class="btn btn-primary" id="btn-save-transfer">Xác Nhận Đăng Ký / Chuyển Lớp</button>
    `;

    openModal(title, bodyHtml, footerHtml);

    document.getElementById('btn-save-transfer').onclick = async () => {
      const targetClassId = document.getElementById('m-target-class').value;
      const startBatch = parseInt(document.getElementById('m-start-batch').value, 10);
      const endBatch = parseInt(document.getElementById('m-end-batch').value, 10);
      const oldEndBatch = document.getElementById('m-old-end-batch') ? parseInt(document.getElementById('m-old-end-batch').value, 10) : 12;

      if (!targetClassId) {
        alert('Vui lòng chọn lớp học!');
        return;
      }

      try {
        // If student is currently active in old classes, mark old active enrollments as TRANSFERRED with oldEndBatch
        for (const oldEn of activeEnrollments) {
          await api.updateEnrollment(oldEn.enrollment_id, {
            status: 'TRANSFERRED',
            end_batch_number: oldEndBatch
          });
        }

        // Create new enrollment record
        await api.createEnrollment({
          student_id: student.student_id,
          class_id: targetClassId,
          start_batch_number: startBatch,
          end_batch_number: endBatch,
          status: 'ACTIVE'
        });

        showToast('Chuyển lớp / Gia nhập lớp mới thành công!');
        closeModal();
        renderStudentDetailView(document.getElementById('app-view'), student.student_id);
      } catch (err) {
        console.error('Error transferring class:', err);
        showToast('Lỗi chuyển lớp: ' + err.message, 'error');
      }
    };
  });
}
