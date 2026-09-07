// EduManager V2 - Module Quản Lý Học Sinh

let currentSelectedStudentId = null;

async function loadStudentsModule() {
  const searchInput = document.getElementById('search-student-input');
  const query = searchInput ? searchInput.value.trim() : '';

  try {
    const students = await ApiService.getStudents(query);
    renderStudentsTable(students);
  } catch (err) {
    console.error('Error loading students:', err);
    alert('Không thể tải danh sách học sinh: ' + err.message);
  }
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('tbl-students-body');
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Không tìm thấy học sinh nào.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const activeEnrollment = (s.enrollments || []).find(e => e.status === 'ACTIVE');
    const className = activeEnrollment && activeEnrollment.classes ? activeEnrollment.classes.class_name : 'Chưa ghi danh';
    const statusBadge = activeEnrollment 
      ? `<span class="badge badge-active">Đang Học (${className})</span>` 
      : `<span class="badge badge-completed">Chưa Có Lớp</span>`;

    return `
      <tr>
        <td><strong>${s.student_code || s.student_id.substring(0, 8)}</strong></td>
        <td><strong>${s.full_name}</strong></td>
        <td>${s.phone || 'N/A'}</td>
        <td>${s.notes || 'N/A'}</td>
        <td>${className}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="openStudentDetailModal('${s.student_id}')">
            <i class="fa-solid fa-eye"></i> Xem Hồ Sơ Chi Tiết
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function openStudentDetailModal(studentId) {
  currentSelectedStudentId = studentId;

  try {
    const data = await ApiService.getStudentDetails(studentId);
    const { student, enrollments, transfers, receipts } = data;

    // Header & Info Tab
    document.getElementById('student-detail-title').innerHTML = `🎓 Hồ Sơ Chi Tiết: ${student.full_name}`;
    document.getElementById('detail-student-full-name').textContent = student.full_name;
    document.getElementById('detail-student-meta').textContent = `Mã HS: ${student.student_code} | SĐT: ${student.phone || 'Chưa có'} | Ghi chú: ${student.notes || 'Không có'}`;

    // Populate Transfer Class Select Dropdown
    const classes = await ApiService.getClasses();
    const selectTransfer = document.getElementById('transfer-to-class-select');
    selectTransfer.innerHTML = classes.map(c => `<option value="${c.class_id}">${c.class_name} (${c.subject_name})</option>`).join('');

    // Tab 1: Enrolled Classes
    const tblEnrolled = document.getElementById('tbl-student-enrolled-body');
    tblEnrolled.innerHTML = enrollments.length > 0 ? enrollments.map(e => `
      <tr>
        <td><strong>${e.classes ? e.classes.class_name : 'N/A'}</strong></td>
        <td>${e.classes ? Number(e.classes.default_fee_rate).toLocaleString('vi-VN') + ' VNĐ' : 'N/A'}</td>
        <td>${new Date(e.enrolled_at).toLocaleDateString('vi-VN')}</td>
        <td>
          ${e.status === 'ACTIVE' ? '<span class="badge badge-active">Đang Học</span>' : ''}
          ${e.status === 'TRANSFERRED' ? '<span class="badge badge-transferred">Đã Chuyển Lớp</span>' : ''}
          ${e.status === 'WITHDRAWN' ? '<span class="badge badge-withdrawn">Đã Rút Lớp</span>' : ''}
        </td>
      </tr>
    `).join('') : `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Chưa ghi danh lớp nào.</td></tr>`;

    // Tab 2: Class Transfers
    const tblTransfers = document.getElementById('tbl-student-transfers-body');
    tblTransfers.innerHTML = transfers.length > 0 ? transfers.map(t => `
      <tr>
        <td><strong style="color: var(--danger-red);">${t.from_class ? t.from_class.class_name : 'N/A'}</strong></td>
        <td><strong style="color: var(--primary);">${t.to_class ? t.to_class.class_name : 'N/A'}</strong></td>
        <td>${new Date(t.transfer_date).toLocaleDateString('vi-VN')}</td>
        <td>${t.reason || 'N/A'}</td>
      </tr>
    `).join('') : `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Chưa có lịch sử chuyển lớp.</td></tr>`;

    // Tab 3: Receipts History
    const tblReceipts = document.getElementById('tbl-student-receipts-body');
    tblReceipts.innerHTML = receipts.length > 0 ? receipts.map(r => `
      <tr>
        <td><strong>${r.receipt_code}</strong></td>
        <td>${new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
        <td>${r.receipt_type === 'IN_MAY' ? 'In Máy' : 'Nhập Tay'}</td>
        <td><strong style="color: var(--primary);">${Number(r.total_amount).toLocaleString('vi-VN')} VNĐ</strong></td>
        <td>${r.manual_receipt_code || ''}</td>
      </tr>
    `).join('') : `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Chưa đóng biên lai nào.</td></tr>`;

    openModal('modal-student-detail');
  } catch (err) {
    console.error('Error fetching student details:', err);
    alert('Không thể lấy chi tiết học sinh: ' + err.message);
  }
}

function initStudentsEvents() {
  const searchInput = document.getElementById('search-student-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => loadStudentsModule());
  }

  // Open Add Student Modal
  const btnOpenAdd = document.getElementById('btn-open-add-student');
  if (btnOpenAdd) {
    btnOpenAdd.addEventListener('click', async () => {
      document.getElementById('form-student').reset();
      document.getElementById('student-id-field').value = '';
      document.getElementById('modal-student-form-title').textContent = 'Thêm Mới Học Sinh';

      const classes = await ApiService.getClasses();
      const selectClass = document.getElementById('student-class-select-field');
      selectClass.innerHTML = `<option value="">-- Chọn Lớp Học (Tùy Chọn) --</option>` + 
        classes.map(c => `<option value="${c.class_id}">${c.class_name} (${c.subject_name})</option>`).join('');

      openModal('modal-student-form');
    });
  }

  // Save Student
  const btnSave = document.getElementById('btn-save-student');
  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const studentId = document.getElementById('student-id-field').value;
      const name = document.getElementById('student-name-field').value.trim();
      const phone = document.getElementById('student-phone-field').value.trim();
      const parentName = document.getElementById('student-parent-field').value.trim();
      const schoolName = document.getElementById('student-school-field').value.trim();
      const classId = document.getElementById('student-class-select-field').value;

      if (!name || !phone) {
        alert('Vui lòng điền đầy đủ Họ tên và Số điện thoại!');
        return;
      }

      try {
        if (studentId) {
          await ApiService.updateStudent(studentId, {
            full_name: name,
            phone: phone
          });
        } else {
          await ApiService.createStudent(name, phone, parentName, schoolName, classId || null);
        }

        closeModal('modal-student-form');
        loadStudentsModule();
        alert('Lưu thông tin học sinh thành công!');
      } catch (err) {
        alert('Lỗi lưu học sinh: ' + err.message);
      }
    });
  }

  // Execute Class Transfer
  const btnTransfer = document.getElementById('btn-execute-transfer');
  if (btnTransfer) {
    btnTransfer.addEventListener('click', async () => {
      if (!currentSelectedStudentId) return;

      const toClassId = document.getElementById('transfer-to-class-select').value;
      const reason = document.getElementById('transfer-reason-input').value.trim();

      if (!toClassId) {
        alert('Vui lòng chọn lớp học mới!');
        return;
      }

      const data = await ApiService.getStudentDetails(currentSelectedStudentId);
      const activeEnr = data.enrollments.find(e => e.status === 'ACTIVE');
      if (!activeEnr) {
        alert('Học sinh hiện chưa ở trong lớp nào để chuyển!');
        return;
      }

      if (activeEnr.classes.class_id === toClassId) {
        alert('Học sinh đang học đúng lớp này rồi!');
        return;
      }

      if (confirm(`Bạn có chắc chắn muốn chuyển học sinh sang lớp mới không?`)) {
        try {
          await ApiService.transferStudentClass(currentSelectedStudentId, activeEnr.classes.class_id, toClassId, reason);
          alert('Chuyển lớp thành công! Khoản nợ cũ (nếu có) sẽ hiển thị trong khung đỏ khi Thu tiền.');
          openStudentDetailModal(currentSelectedStudentId);
          loadStudentsModule();
        } catch (err) {
          alert('Lỗi chuyển lớp: ' + err.message);
        }
      }
    });
  }
}
