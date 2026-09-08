/* =============================================================================
   EDUMANAGER V2 - MODULE 2: STUDENTS MANAGEMENT & DETAILS (js/students.js)
   ============================================================================= */

import { api } from './api.js';
import { formatCurrency, formatDate, formatDateTime, openModal, closeModal, showToast, removeVietnameseTones, matchSearchTokens } from './utils.js';

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
        <div style="position: relative; flex: 1; min-width: 250px;">
          <input type="text" id="search-student-input" class="form-control" placeholder="🔍 Tìm theo Họ tên, SĐT, Mã học sinh (gõ 'hai' gợi ý 'Hải')..." autocomplete="off">
          <div id="search-student-suggestions" style="display: none; position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15); max-height: 280px; overflow-y: auto; margin-top: 4px;"></div>
        </div>
        
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
              <th>Các Lớp Đang Học</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody id="student-table-body">
            <tr>
              <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">Đang tải danh sách học sinh...</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div id="student-pagination" style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;"></div>
    </div>
  `;

  // Bind Events
  const searchInput = document.getElementById('search-student-input');
  const suggestionsBox = document.getElementById('search-student-suggestions');
  let searchTimer = null;

  document.getElementById('btn-add-student').onclick = () => showStudentModal();
  document.getElementById('btn-search-student').onclick = () => {
    suggestionsBox.style.display = 'none';
    loadStudentsData();
  };

  searchInput.oninput = (e) => {
    const rawVal = e.target.value.trim();
    const cleanVal = removeVietnameseTones(rawVal);
    clearTimeout(searchTimer);
    suggestionsBox.style.display = 'none';

    if (cleanVal.length === 0) {
      loadStudentsData();
      return;
    }

    // Wait until user finishes typing (450ms pause)
    searchTimer = setTimeout(() => {
      loadStudentsData();

      if (cleanVal.length >= 1) {
        api.getStudents({ grade: document.getElementById('filter-grade').value })
          .then(({ data: allData }) => {
            const matches = (allData || []).filter(s => 
              matchSearchTokens(`${s.full_name} ${s.student_code} ${s.phone || ''}`, rawVal)
            );

            if (!matches || matches.length === 0) {
              suggestionsBox.innerHTML = `<div style="padding: 12px; color: var(--text-muted); text-align: center; font-size: 13px;">Không tìm thấy đề xuất phù hợp</div>`;
            } else {
              suggestionsBox.innerHTML = matches.slice(0, 8).map(s => `
                <div class="student-suggestion-item" data-id="${s.student_id}" style="padding: 10px 14px; border-bottom: 1px solid var(--border-light); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.15s;" onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='transparent'">
                  <div>
                    <strong style="color: var(--teal-600);">${s.student_code}</strong> - <strong>${s.full_name}</strong>
                    <div style="font-size: 12px; color: var(--text-muted);">${s.phone ? `📞 ${s.phone}` : 'Chưa có SĐT'} | Khối ${s.grade}</div>
                  </div>
                  <span class="badge badge-active" style="font-size: 11px;">Xem Hồ Sơ ➔</span>
                </div>
              `).join('');

              suggestionsBox.querySelectorAll('.student-suggestion-item').forEach(el => {
                el.onclick = () => {
                  const sid = el.getAttribute('data-id');
                  suggestionsBox.style.display = 'none';
                  window.location.hash = `#/students/${sid}`;
                };
              });
            }
            suggestionsBox.style.display = 'block';
          }).catch(err => console.error('Error getting student proposals:', err));
      }
    }, 450);
  };

  // Close suggestions box on click outside
  document.addEventListener('click', (evt) => {
    if (suggestionsBox && !searchInput.contains(evt.target) && !suggestionsBox.contains(evt.target)) {
      suggestionsBox.style.display = 'none';
    }
  });

  document.getElementById('filter-grade').onchange = () => loadStudentsData();

  loadStudentsData();
}

async function loadStudentsData() {
  const searchInput = document.getElementById('search-student-input');
  const search = searchInput ? searchInput.value.trim() : '';
  const cleanSearch = removeVietnameseTones(search);
  const gradeSelect = document.getElementById('filter-grade');
  const grade = gradeSelect ? gradeSelect.value : '';

  const tbody = document.getElementById('student-table-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">Đang tải dữ liệu...</td></tr>`;

  try {
    const { data: rawStudents, count } = await api.getStudents({ grade });

    const students = cleanSearch
      ? (rawStudents || []).filter(s =>
          matchSearchTokens(`${s.full_name} ${s.student_code} ${s.phone || ''}`, search)
        )
      : (rawStudents || []);

    const paginationEl = document.getElementById('student-pagination');

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">Không tìm thấy học sinh nào phù hợp.</td></tr>`;
      if (paginationEl) paginationEl.innerText = `Hiển thị 0 / Tổng số ${count || 0} học sinh`;
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

      return `
        <tr>
          <td><strong style="color: var(--teal-600);">${s.student_code}</strong></td>
          <td><strong>${s.full_name}</strong></td>
          <td>${s.phone ? `📞 ${s.phone}` : '<span style="color: var(--text-light); font-style: italic;">Chưa có SĐT</span>'}</td>
          <td style="max-width: 300px; font-size: 13px;">${activeClassesHtml}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/students/${s.student_id}'">
              👁️ Xem Chi Tiết
            </button>
          </td>
        </tr>
      `;
    }).join('');

    const totalCount = cleanSearch ? students.length : (count || students.length);
    if (paginationEl) paginationEl.innerText = `Hiển thị ${Math.min(50, students.length)} / Tổng số ${totalCount} học sinh`;
  } catch (err) {
    console.error('Error loading students:', err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--status-overdue-color); padding: 24px;">Lỗi tải dữ liệu học sinh.</td></tr>`;
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
      const hash = window.location.hash;
      if (hash.startsWith('#/students/') && isEdit && student) {
        renderStudentDetailView(document.getElementById('app-view'), student.student_id);
      } else {
        loadStudentsData();
      }
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

// Show Class Transfer & Enrollment Modal with intuitive Join vs Transfer modes
function showTransferClassModal(student, existingEnrollments) {
  const activeEnrollments = existingEnrollments.filter(e => e.status === 'ACTIVE');

  api.getClasses().then(allClasses => {
    const title = `Gia Nhập Lớp Mới / Chuyển Lớp cho ${student.full_name}`;

    const bodyHtml = `
      <form id="form-transfer-modal">
        <!-- Action Type Radio Selector -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: var(--radius-md); margin-bottom: 20px;">
          <div style="font-weight: 800; color: #065f46; margin-bottom: 8px;">Vui lòng chọn loại thao tác:</div>
          <div style="display: flex; gap: 20px; font-size: 14px; font-weight: 700;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 6px;">
              <input type="radio" name="m_action_type" value="JOIN_NEW" checked> 🟢 Học Thêm Lớp Mới (Giữ nguyên các lớp cũ)
            </label>
            ${activeEnrollments.length > 0 ? `
              <label style="cursor: pointer; display: flex; align-items: center; gap: 6px;">
                <input type="radio" name="m_action_type" value="TRANSFER"> 🔄 Chuyển Lớp (Rời lớp cũ sang lớp mới)
              </label>
            ` : ''}
          </div>
        </div>

        <!-- Section 1: Target New Class & Start Batch -->
        <div class="form-group">
          <label class="form-label">Chọn Lớp Mới (*)</label>
          <select id="m-target-class" class="form-control" required>
            <option value="">-- Chọn Lớp Học --</option>
            ${allClasses.map(c => `<option value="${c.class_id}">${c.class_name} (Niên khóa ${c.academic_year})</option>`).join('')}
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Bắt Đầu Học Lớp Mới Từ Đợt Mấy? (*)</label>
            <select id="m-start-batch" class="form-control" required>
              ${[1,2,3,4,5,6,7,8,9,10,11,12].map(b => `<option value="${b}">Đợt ${b}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Đợt Kết Thúc Dự Kiến Lớp Mới</label>
            <select id="m-end-batch" class="form-control">
              ${[12,11,10,9,8,7,6,5,4,3,2,1].map(b => `<option value="${b}">Đợt ${b}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Section 2: Transfer Out Details (Only shown if action_type is TRANSFER) -->
        <div id="transfer-out-section" style="display: none; border-top: 1px dashed var(--border-color); padding-top: 16px; margin-top: 16px; background: #fff5f5; border-radius: var(--radius-md); padding: 16px;">
          <h4 style="font-size: 14px; font-weight: 800; color: #991b1b; margin-bottom: 12px;">🔄 Thông Tin Rời Lớp Cũ:</h4>
          
          <div class="form-group">
            <label class="form-label">Chọn Lớp Cũ Muốn Rời Đi (*)</label>
            <select id="m-old-enrollment-id" class="form-control">
              ${activeEnrollments.map(e => `
                <option value="${e.enrollment_id}">Lớp: ${e.classes ? e.classes.class_name : 'Lớp cũ'} (Đang học từ Đợt ${e.start_batch_number || 1})</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Đợt Kết Thúc Học Ở Lớp Cũ Là Đợt Mấy? (*)</label>
            <select id="m-old-end-batch" class="form-control">
              ${[1,2,3,4,5,6,7,8,9,10,11,12].map(b => `<option value="${b}" ${b === 4 ? 'selected' : ''}>Học xong Đợt ${b} thì rời lớp cũ</option>`).join('')}
            </select>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" onclick="window.closeModal()">Hủy Bỏ</button>
      <button class="btn btn-primary" id="btn-save-transfer">Xác Nhận Thực Hiện</button>
    `;

    openModal(title, bodyHtml, footerHtml);

    // Dynamic Display Switcher for Radio Buttons
    const radios = document.querySelectorAll('input[name="m_action_type"]');
    const transferSec = document.getElementById('transfer-out-section');

    radios.forEach(r => {
      r.onchange = () => {
        if (r.value === 'TRANSFER') {
          transferSec.style.display = 'block';
        } else {
          transferSec.style.display = 'none';
        }
      };
    });

    document.getElementById('btn-save-transfer').onclick = async () => {
      const actionType = document.querySelector('input[name="m_action_type"]:checked').value;
      const targetClassId = document.getElementById('m-target-class').value;
      const startBatch = parseInt(document.getElementById('m-start-batch').value, 10);
      const endBatch = parseInt(document.getElementById('m-end-batch').value, 10);

      if (!targetClassId) {
        alert('Vui lòng chọn lớp mới!');
        return;
      }

      try {
        if (actionType === 'TRANSFER') {
          const oldEnrollmentId = document.getElementById('m-old-enrollment-id').value;
          const oldEndBatch = parseInt(document.getElementById('m-old-end-batch').value, 10);

          if (oldEnrollmentId) {
            // Update old enrollment status to TRANSFERRED and end_batch_number to oldEndBatch
            await api.updateEnrollment(oldEnrollmentId, {
              status: 'TRANSFERRED',
              end_batch_number: oldEndBatch
            });
          }
        }

        // Create new enrollment record for target class
        await api.createEnrollment({
          student_id: student.student_id,
          class_id: targetClassId,
          start_batch_number: startBatch,
          end_batch_number: endBatch,
          status: 'ACTIVE'
        });

        showToast(actionType === 'TRANSFER' ? 'Chuyển lớp thành công!' : 'Thêm lớp mới thành công!');
        closeModal();
        renderStudentDetailView(document.getElementById('app-view'), student.student_id);
      } catch (err) {
        console.error('Error in student enrollment modal:', err);
        showToast('Lỗi thực hiện: ' + err.message, 'error');
      }
    };
  });
}
