// EduManager V2 - Module Quản Lý Lớp Học & Tự Động Sinh 12 Đợt Học

let currentSelectedClassId = null;

async function loadClassesModule() {
  const searchInput = document.getElementById('search-class-input');
  const query = searchInput ? searchInput.value.trim() : '';

  try {
    const classes = await ApiService.getClasses(query);
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
      <td><strong>${c.class_id.substring(0, 8)}...</strong></td>
      <td><strong style="color: var(--primary);">${c.class_name}</strong></td>
      <td>${c.subject_name || 'Môn học'}</td>
      <td>Khối ${c.grade}</td>
      <td>${c.teacher_name || 'Chưa phân công'}</td>
      <td><span class="badge badge-active">${c.enrolled_count} học sinh</span></td>
      <td><strong>${Number(c.default_fee_rate).toLocaleString('vi-VN')} VNĐ</strong></td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="openClassDetailModal('${c.class_id}')">
          <i class="fa-solid fa-layer-group"></i> 12 Đợt & Sĩ Số
        </button>
      </td>
    </tr>
  `).join('');
}

async function openClassDetailModal(classId) {
  currentSelectedClassId = classId;

  try {
    const data = await ApiService.getClassDetails(classId);
    const { classObj, batches, roster } = data;

    document.getElementById('class-detail-title').innerHTML = `🏫 Lớp: ${classObj.class_name} (${classObj.subject_name}) - 12 Đợt Học`;

    // Render 12 Batches
    const tbodyBatches = document.getElementById('tbl-class-batches-body');
    tbodyBatches.innerHTML = batches.map(b => `
      <tr>
        <td><strong>Đợt ${b.batch_number}</strong></td>
        <td>${b.batch_name}</td>
        <td><strong style="color: var(--primary);">${b.teachers ? b.teachers.full_name : classObj.teacher_name}</strong></td>
        <td><strong>${Number(b.fee_rate).toLocaleString('vi-VN')} VNĐ</strong></td>
        <td>
          ${b.status === 'DANG_HOC' || b.status === 'ACTIVE' ? '<span class="badge badge-active">Đang Học</span>' : ''}
          ${b.status === 'UPCOMING' ? '<span class="badge badge-transferred">Sắp Tới</span>' : ''}
          ${b.status === 'COMPLETED' ? '<span class="badge badge-completed">Đã Xong</span>' : ''}
        </td>
      </tr>
    `).join('');

    // Render Roster
    const tbodyRoster = document.getElementById('tbl-class-roster-body');
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

    openModal('modal-class-detail');
  } catch (err) {
    alert('Lỗi lấy chi tiết lớp học: ' + err.message);
  }
}

async function withdrawStudent(enrollmentId) {
  if (confirm('Bạn có chắc chắn muốn rút học sinh này khỏi lớp không?')) {
    try {
      await ApiService.withdrawStudentFromClass(enrollmentId);
      alert('Đã rút học sinh khỏi lớp!');
      openClassDetailModal(currentSelectedClassId);
      loadClassesModule();
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

  // Auto adjust fee based on subject selection
  const subjectSelect = document.getElementById('class-subject-field');
  if (subjectSelect) {
    subjectSelect.addEventListener('change', (e) => {
      const subject = e.target.value;
      const feeInput = document.getElementById('class-fee-field');
      if (subject === 'Ngữ văn') {
        feeInput.value = 300000;
      } else {
        feeInput.value = 350000;
      }
    });
  }

  // Open Create Class Modal
  const btnOpenCreate = document.getElementById('btn-open-create-class');
  if (btnOpenCreate) {
    btnOpenCreate.addEventListener('click', async () => {
      document.getElementById('form-class').reset();
      document.getElementById('class-id-field').value = '';

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
      const feePerBatch = Number(document.getElementById('class-fee-field').value);

      if (!name || !teacherId || !feePerBatch) {
        alert('Vui lòng điền đầy đủ Tên lớp, Giáo viên và Học phí gốc!');
        return;
      }

      try {
        await ApiService.createClassWith12Batches(name, subject, gradeLevel, teacherId, feePerBatch);
        closeModal('modal-class-form');
        loadClassesModule();
        alert(`Tạo lớp "${name}" và tự động sinh 12 Đợt học (Đợt 1 -> Đợt 12) thành công!`);
      } catch (err) {
        alert('Lỗi tạo lớp học: ' + err.message);
      }
    });
  }

  // Add Student to Class Button in Roster Modal
  const btnAddStudentToClass = document.getElementById('btn-open-add-student-to-class');
  if (btnAddStudentToClass) {
    btnAddStudentToClass.addEventListener('click', async () => {
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
          openClassDetailModal(currentSelectedClassId);
          loadClassesModule();
        }
      } catch (err) {
        alert('Lỗi ghi danh học sinh: ' + err.message);
      }
    });
  }
}
