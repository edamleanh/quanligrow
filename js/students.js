// EduManager V2 - Module Quản Lý Học Sinh (Cập nhật giao diện danh sách chính)

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
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Không tìm thấy học sinh nào.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    // 1. Get ALL Active Enrolled Classes for this student
    const activeEnrollments = (s.enrollments || []).filter(e => e.status === 'ACTIVE');
    const classNamesList = activeEnrollments
      .map(e => e.classes ? e.classes.class_name : null)
      .filter(n => n);

    const displayClasses = classNamesList.length > 0 
      ? classNamesList.map(n => `<span class="badge badge-active" style="margin-right: 4px; margin-bottom: 2px;">${n}</span>`).join('')
      : `<span style="color: var(--text-muted); font-size: 13px;">Chưa có lớp</span>`;

    // 2. Format Status Label EXACTLY as requested: "đang học", "chưa có lớp", "đã tốt nghiệp"
    let statusBadge = '';
    if (s.status === 'DA_TN') {
      statusBadge = `<span class="badge" style="background: #f3e8ff; color: #7e22ce; border: 1px solid #d8b4fe;"><i class="fa-solid fa-graduation-cap"></i> Đã tốt nghiệp</span>`;
    } else if (activeEnrollments.length > 0) {
      statusBadge = `<span class="badge badge-active"><i class="fa-solid fa-circle" style="font-size: 8px;"></i> Đang học</span>`;
    } else {
      statusBadge = `<span class="badge badge-completed"><i class="fa-solid fa-circle-notch" style="font-size: 10px;"></i> Chưa có lớp</span>`;
    }

    return `
      <tr>
        <td><strong>${s.student_code || s.student_id.substring(0, 8)}</strong></td>
        <td><strong style="font-size: 15px;">${s.full_name}</strong></td>
        <td><span class="badge badge-secondary" style="background: #f1f5f9; color: #334155;">Khối ${s.grade || 'N/A'}</span></td>
        <td>${displayClasses}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="openStudentDetailPage('${s.student_id}')">
            <i class="fa-solid fa-eye"></i> Xem Trang Chi Tiết
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function openStudentDetailPage(studentId, updateHash = true) {
  currentSelectedStudentId = studentId;

  if (updateHash) {
    window.location.hash = `#/students/detail?id=${studentId}`;
    return;
  }

  try {
    const data = await ApiService.getStudentDetails(studentId);
    const { student, enrollments, transfers, receipts } = data;

    // Header Info
    document.getElementById('page-student-full-name').textContent = student.full_name;
    document.getElementById('page-student-meta').textContent = `Mã HS: ${student.student_code} | SĐT: ${student.phone || 'Chưa có'} | Khối: ${student.grade || 'N/A'} | Ghi chú: ${student.notes || 'Không có'}`;

    // Tab 1: Enrolled Classes
    const tblEnrolled = document.getElementById('tbl-page-student-enrolled-body');
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

    // Tab 3: Receipts History with exact Date/Time and Itemized Breakdown (Class, Subject, Batch, Fee)
    const tblReceipts = document.getElementById('tbl-page-student-receipts-body');
    tblReceipts.innerHTML = receipts.length > 0 ? receipts.map(r => {
      const d = new Date(r.created_at || r.receipt_date);
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const itemsHtml = (r.receipt_items && r.receipt_items.length > 0)
        ? `<div style="font-size: 13px; line-height: 1.5; display: flex; flex-direction: column; gap: 4px;">
            ${r.receipt_items.map(item => {
              const cName = item.classes?.class_name || 'Lớp';
              const sName = item.classes?.subjects?.subject_name ? ` (${item.classes.subjects.subject_name})` : '';
              const bName = item.batches?.batch_name || (`Đợt ${item.batches?.batch_number || ''}`);
              const amt = Number(item.amount_paid).toLocaleString('vi-VN');
              return `<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; background: rgba(5, 150, 105, 0.05); padding: 4px 8px; border-radius: 4px; border-left: 3px solid var(--primary);">
                <span><i class="fa-solid fa-book-bookmark" style="color: var(--primary); font-size: 11px; margin-right: 4px;"></i><strong>${cName}</strong>${sName} - <strong>${bName}</strong></span>
                <span style="font-weight: 700; color: var(--primary); white-space: nowrap;">${amt} VNĐ</span>
              </div>`;
            }).join('')}
          </div>`
        : `<span style="color: var(--text-muted); font-style: italic;">Không có chi tiết</span>`;

      return `
        <tr>
          <td><strong style="color: var(--text-main); font-family: monospace;">${r.receipt_code}</strong></td>
          <td>
            <div style="font-weight: 600; color: var(--text-main);">${timeStr}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${dateStr}</div>
          </td>
          <td>
            ${r.receipt_type === 'IN_MAY' 
              ? '<span class="badge badge-active" style="background: rgba(5, 150, 105, 0.1); color: var(--primary);"><i class="fa-solid fa-print"></i> In Máy</span>' 
              : '<span class="badge badge-warning"><i class="fa-solid fa-pen"></i> Nhập Tay</span>'}
          </td>
          <td style="min-width: 320px;">${itemsHtml}</td>
          <td><strong style="color: var(--primary); font-size: 15px;">${Number(r.total_amount).toLocaleString('vi-VN')} VNĐ</strong></td>
          <td>${r.manual_receipt_code ? `<span class="badge" style="background: var(--bg-body); border: 1px solid var(--border); font-family: monospace;">${r.manual_receipt_code}</span>` : '<span style="color: var(--text-muted);">-</span>'}</td>
        </tr>
      `;
    }).join('') : `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">Chưa đóng biên lai nào.</td></tr>`;

    // Navigate to Full Page Detail View
    navigateToView('student-detail', false);
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

  // Edit Student Info on Page
  const btnEditPage = document.getElementById('btn-page-edit-student');
  if (btnEditPage) {
    btnEditPage.addEventListener('click', async () => {
      if (!currentSelectedStudentId) return;
      const data = await ApiService.getStudentDetails(currentSelectedStudentId);
      const s = data.student;

      document.getElementById('student-id-field').value = s.student_id;
      document.getElementById('student-name-field').value = s.full_name;
      document.getElementById('student-phone-field').value = s.phone;
      document.getElementById('student-initial-class-group').style.display = 'none';
      document.getElementById('modal-student-form-title').textContent = 'Chỉnh Sửa Thông Tin Học Sinh';
      openModal('modal-student-form');
    });
  }

  // Open Add Student Modal
  const btnOpenAdd = document.getElementById('btn-open-add-student');
  if (btnOpenAdd) {
    btnOpenAdd.addEventListener('click', async () => {
      document.getElementById('form-student').reset();
      document.getElementById('student-id-field').value = '';
      document.getElementById('student-initial-class-group').style.display = 'block';
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
          openStudentDetailPage(studentId);
        } else {
          await ApiService.createStudent(name, phone, parentName, schoolName, classId || null);
          loadStudentsModule();
        }

        closeModal('modal-student-form');
        alert('Lưu thông tin học sinh thành công!');
      } catch (err) {
        alert('Lỗi lưu học sinh: ' + err.message);
      }
    });
  }
}
