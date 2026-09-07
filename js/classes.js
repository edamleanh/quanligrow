// EduManager V2 - Module Quản Lý Lớp Học & Tự Động Sinh 12 Đợt (Cho phép Đổi Tên Đợt & Học Phí Đợt)

let currentSelectedClassId = null;

async function loadClassesModule() {
  const searchInput = document.getElementById('search-class-input');
  const query = searchInput ? searchInput.value.trim() : '';
  const academicYearSelect = document.getElementById('filter-academic-year-select');
  const academicYear = academicYearSelect ? academicYearSelect.value : '';

  try {
    const classes = await ApiService.getClasses(query, academicYear);
    renderClassesTable(classes);
  } catch (err) {
    console.error('Error loading classes:', err);
    alert('Không thể tải danh sách lớp học: ' + err.message);
  }
}

function renderClassesTable(classes) {
  const tbody = document.getElementById('tbl-classes-body');
  if (!tbody) return;

  if (classes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Không tìm thấy lớp học nào.</td></tr>`;
    return;
  }

  tbody.innerHTML = classes.map(c => `
    <tr>
      <td><strong style="color: var(--primary); font-size: 15px;">${c.class_name}</strong></td>
      <td><span class="badge" style="background: #e0f2fe; color: #0369a1; font-weight: 700;">${c.academic_year || '2025-2026'}</span></td>
      <td>${c.subject_name || 'Môn học'}</td>
      <td><span class="badge" style="background: #f1f5f9; color: #334155;">Khối ${c.grade}</span></td>
      <td>${c.teacher_name || 'Chưa phân công'}</td>
      <td><span class="badge badge-active">${c.enrolled_count} học sinh</span></td>
      <td><strong>${Number(c.default_fee_rate).toLocaleString('vi-VN')} VNĐ</strong></td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="openClassDetailPage('${c.class_id}')">
          <i class="fa-solid fa-layer-group"></i> Xem Trang Chi Tiết & 12 Đợt
        </button>
      </td>
    </tr>
  `).join('');
}

async function openClassDetailPage(classId, updateHash = true) {
  currentSelectedClassId = classId;

  if (updateHash) {
    const targetHash = `#/classes/detail?id=${classId}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
      return;
    }
  }

  try {
    const data = await ApiService.getClassDetails(classId);
    const { classObj, batches, roster } = data;

    // Header Info
    document.getElementById('page-class-title').innerHTML = `🏫 Lớp: ${classObj.class_name} (${classObj.subject_name}) - Năm Học ${classObj.academic_year || '2025-2026'}`;
    document.getElementById('page-class-meta').textContent = `Giáo viên phụ trách: ${classObj.teacher_name || 'Chưa phân công'} | Học phí gốc: ${Number(classObj.default_fee_rate).toLocaleString('vi-VN')} VNĐ/đợt | Sĩ số: ${roster.filter(r => r.status === 'ACTIVE').length} học sinh`;

    // Tab 1: Render 12 Batches with Editable Name and Fee Rate (.000 VNĐ)
    const tbodyBatches = document.getElementById('tbl-page-class-batches-body');
    tbodyBatches.innerHTML = batches.map(b => {
      const displayFeeK = b.fee_rate >= 1000 ? Math.round(b.fee_rate / 1000) : b.fee_rate;
      return `
        <tr>
          <td><strong>Đợt ${b.batch_number}</strong></td>
          <td>
            <input type="text" id="batch-name-${b.batch_id}" class="form-control-simple" value="${b.batch_name}" style="max-width: 180px; font-weight: 600;">
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 4px;">
              <input type="number" id="batch-fee-${b.batch_id}" class="form-control-simple" value="${displayFeeK}" step="5" min="0" style="max-width: 100px; font-weight: 700; color: var(--primary); text-align: right;">
              <span style="font-size: 13px; font-weight: 700; color: var(--primary);">.000 VNĐ</span>
            </div>
          </td>
          <td><strong style="color: var(--text-primary);">${b.teachers ? b.teachers.full_name : classObj.teacher_name}</strong></td>
          <td>
            ${b.status === 'DANG_HOC' || b.status === 'ACTIVE' ? '<span class="badge badge-active">Đang Học</span>' : ''}
            ${b.status === 'UPCOMING' ? '<span class="badge badge-transferred">Sắp Tới</span>' : ''}
            ${b.status === 'COMPLETED' ? '<span class="badge badge-completed">Đã Xong</span>' : ''}
          </td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="saveBatchEdit('${b.batch_id}')">
              <i class="fa-solid fa-save"></i> Lưu Thay Đổi
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Tab 2: Render Roster
    const tbodyRoster = document.getElementById('tbl-page-class-roster-body');
    tbodyRoster.innerHTML = roster.length > 0 ? roster.map(r => `
      <tr>
        <td>${r.students ? r.students.student_code || r.students.student_id.substring(0, 8) : 'N/A'}</td>
        <td><strong>${r.students ? r.students.full_name : 'N/A'}</strong></td>
        <td>${r.students ? r.students.phone : 'N/A'}</td>
        <td>
          ${r.status === 'ACTIVE' ? '<span class="badge badge-active">Đang Học</span>' : ''}
          ${r.status === 'TRANSFERRED' ? '<span class="badge badge-transferred">Đã Chuyển Lớp</span>' : ''}
          ${r.status === 'WITHDRAWN' ? '<span class="badge badge-withdrawn">Đã Rút Nam</span>' : ''}
        </td>
        <td>
          ${r.status === 'ACTIVE' ? `
            <button class="btn btn-sm btn-outline-danger" onclick="withdrawStudent('${r.enrollment_id}')">
              <i class="fa-solid fa-user-minus"></i> Rút khỏi lớp
            </button>
          ` : 'N/A'}
        </td>
      </tr>
    `).join('') : `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Chưa có học sinh nào trong lớp.</td></tr>`;

    // Navigate to Full Page Class Detail
    navigateToView('class-detail', false);
  } catch (err) {
    alert('Lỗi lấy chi tiết lớp học: ' + err.message);
  }
}

async function saveBatchEdit(batchId) {
  const newName = document.getElementById(`batch-name-${batchId}`).value.trim();
  const inputFeeVal = Number(document.getElementById(`batch-fee-${batchId}`).value);

  if (!newName || isNaN(inputFeeVal) || inputFeeVal < 0) {
    alert('Vui lòng nhập Tên Đợt và Học Phí Đợt hợp lệ!');
    return;
  }

  const actualFee = inputFeeVal < 1000 ? inputFeeVal * 1000 : inputFeeVal;

  try {
    await ApiService.updateBatch(batchId, {
      batch_name: newName,
      fee_rate: actualFee
    });
    alert(`Cập nhật thành công "${newName}" với học phí ${actualFee.toLocaleString('vi-VN')} VNĐ!`);
    openClassDetailPage(currentSelectedClassId, false);
  } catch (err) {
    alert('Lỗi cập nhật đợt học: ' + err.message);
  }
}

async function withdrawStudent(enrollmentId) {
  if (confirm('Bạn có chắc chắn muốn rút học sinh này khỏi lớp không?')) {
    try {
      await ApiService.withdrawStudentFromClass(enrollmentId);
      alert('Đã rút học sinh khỏi lớp!');
      openClassDetailPage(currentSelectedClassId, false);
    } catch (err) {
      alert('Lỗi rút học sinh: ' + err.message);
    }
  }
}

function initClassesEvents() {
  const searchInput = document.getElementById('search-class-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => loadClassesModule());
  }

  const academicYearSelect = document.getElementById('filter-academic-year-select');
  if (academicYearSelect) {
    academicYearSelect.addEventListener('change', () => loadClassesModule());
  }

  // Auto adjust fee based on subject selection (.000 VNĐ)
  const subjectSelect = document.getElementById('class-subject-field');
  if (subjectSelect) {
    subjectSelect.addEventListener('change', (e) => {
      const subject = e.target.value;
      const feeInput = document.getElementById('class-fee-field');
      if (subject === 'Ngữ văn') {
        feeInput.value = 300;
      } else {
        feeInput.value = 350;
      }
    });
  }

  // Open Create Class Modal
  const btnOpenCreate = document.getElementById('btn-open-create-class');
  if (btnOpenCreate) {
    btnOpenCreate.addEventListener('click', async () => {
      document.getElementById('form-class').reset();
      document.getElementById('class-id-field').value = '';
      document.getElementById('class-fee-field').value = 350;

      const teachers = await ApiService.getTeachers();
      const teacherSelect = document.getElementById('class-teacher-field');
      teacherSelect.innerHTML = teachers.map(t => `<option value="${t.teacher_id}">${t.full_name}</option>`).join('');

      openModal('modal-class-form');
    });
  }

  // Save Class & Auto Generate 12 Batches
  const btnSaveClass = document.getElementById('btn-save-class');
  if (btnSaveClass) {
    btnSaveClass.addEventListener('click', async () => {
      const name = document.getElementById('class-name-field').value.trim();
      const subject = document.getElementById('class-subject-field').value;
      const gradeLevel = document.getElementById('class-grade-field').value;
      const teacherId = document.getElementById('class-teacher-field').value;
      const inputFeeVal = Number(document.getElementById('class-fee-field').value);
      const academicYear = document.getElementById('class-academic-year-field')?.value || '2025-2026';

      if (!name || !teacherId || isNaN(inputFeeVal) || inputFeeVal <= 0) {
        alert('Vui lòng điền đầy đủ Tên lớp, Giáo viên và Học phí gốc!');
        return;
      }

      const actualFee = inputFeeVal < 1000 ? inputFeeVal * 1000 : inputFeeVal;

      try {
        await ApiService.createClassWith12Batches(name, subject, gradeLevel, teacherId, actualFee, academicYear);
        closeModal('modal-class-form');
        loadClassesModule();
        alert(`Tạo lớp "${name}" (${academicYear}) với học phí ${actualFee.toLocaleString('vi-VN')} VNĐ/đợt và tự động sinh 12 Đợt học thành công!`);
      } catch (err) {
        alert('Lỗi tạo lớp học: ' + err.message);
      }
    });
  }

  // Add Student to Class Button in Roster Page
  const btnPageAddStudentToClass = document.getElementById('btn-page-add-student-to-class');
  if (btnPageAddStudentToClass) {
    btnPageAddStudentToClass.addEventListener('click', async () => {
      if (!currentSelectedClassId) return;

      const studentNameOrPhone = prompt('Nhập Họ và Tên hoặc Số điện thoại học sinh cần ghi danh vào lớp này:');
      if (!studentNameOrPhone) return;

      try {
        const students = await ApiService.getStudents(studentNameOrPhone);
        if (students.length === 0) {
          alert('Không tìm thấy học sinh nào khớp với từ khóa!');
          return;
        }

        const selectedStudent = students[0];
        if (confirm(`Ghi danh học sinh "${selectedStudent.full_name}" (SĐT: ${selectedStudent.phone}) vào lớp này?`)) {
          await ApiService.enrollStudentToClass(currentSelectedClassId, selectedStudent.student_id);
          alert('Ghi danh học sinh thành công!');
          openClassDetailPage(currentSelectedClassId);
        }
      } catch (err) {
        alert('Lỗi ghi danh học sinh: ' + err.message);
      }
    });
  }
}
