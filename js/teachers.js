// EduManager V2 - Module Quản Lý Giáo Viên & Quyết Toán Payroll (Ẩn cột Mã Lớp)

let currentSelectedTeacherId = null;

async function loadTeachersModule() {
  const searchInput = document.getElementById('search-teacher-input');
  const query = searchInput ? searchInput.value.trim() : '';

  try {
    const teachers = await ApiService.getTeachers(query);
    renderTeachersTable(teachers);
  } catch (err) {
    console.error('Error loading teachers:', err);
    alert('Không thể tải danh sách giáo viên: ' + err.message);
  }
}

function renderTeachersTable(teachers) {
  const tbody = document.getElementById('tbl-teachers-body');
  if (!tbody) return;

  if (teachers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Không tìm thấy giáo viên nào trong cơ sở dữ liệu.</td></tr>`;
    return;
  }

  tbody.innerHTML = teachers.map(t => {
    const hasPhone = (t.phone && t.phone !== '0000000000');
    const phoneDisplay = hasPhone ? t.phone : `<span style="color: var(--text-muted); font-style: italic;">Chưa có SĐT</span>`;
    const emailDisplay = hasPhone ? `${t.phone}@grow.edu.vn` : `<span style="color: var(--text-muted);">-</span>`;
    const subjectName = t.subjects ? t.subjects.subject_name : (t.specialization_subject_id ? `Môn ID ${t.specialization_subject_id}` : 'Chưa phân môn');

    return `
      <tr>
        <td><strong>${t.teacher_code || t.teacher_id.substring(0, 8)}</strong></td>
        <td><strong style="color: var(--primary);">${t.full_name}</strong></td>
        <td>${phoneDisplay}</td>
        <td>${emailDisplay}</td>
        <td><span class="badge badge-active" style="background: rgba(5, 150, 105, 0.1); color: var(--primary);"><i class="fa-solid fa-book-open" style="font-size: 11px; margin-right: 4px;"></i>${subjectName}</span></td>
        <td><strong>${t.assignedClassCount} lớp</strong></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="openTeacherDetailPage('${t.teacher_id}')">
            <i class="fa-solid fa-calculator"></i> Xem Trang Chi Tiết & Payroll
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function openTeacherDetailPage(teacherId, updateHash = true) {
  currentSelectedTeacherId = teacherId;

  if (updateHash) {
    const targetHash = `#/teachers/detail?id=${teacherId}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
      return;
    }
  }

  try {
    const data = await ApiService.getTeacherDetails(teacherId);
    const { teacher, classes, payroll } = data;

    const phoneStr = (teacher.phone && teacher.phone !== '0000000000') ? teacher.phone : 'Chưa có SĐT';
    const subStr = teacher.subjects ? teacher.subjects.subject_name : 'Chưa phân môn';

    // Header Info directly from DB
    document.getElementById('page-teacher-full-name').textContent = teacher.full_name;
    document.getElementById('page-teacher-meta').textContent = `Mã GV: ${teacher.teacher_code} | SĐT: ${phoneStr} | Chuyên môn: ${subStr} | Lớp phụ trách: ${classes.length} lớp`;

    // Tab 1: Classes from DB
    const tbodyClasses = document.getElementById('tbl-page-teacher-classes-body');
    tbodyClasses.innerHTML = classes.length > 0 ? classes.map(c => `
      <tr>
        <td><strong style="color: var(--primary);">${c.class_name}</strong></td>
        <td><span class="badge" style="background: #f1f5f9; color: #334155;">Khối ${c.grade}</span></td>
        <td><span class="badge badge-active">${c.is_active ? 'Đang Mở' : 'Kết Thúc'}</span></td>
      </tr>
    `).join('') : `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Chưa được phân công lớp nào trong CSDL.</td></tr>`;

    // Tab 2: Payroll Breakdown directly from v_teacher_batch_payroll View in DB
    const tbodyPayroll = document.getElementById('tbl-page-teacher-payroll-body');
    tbodyPayroll.innerHTML = payroll.length > 0 ? payroll.map(p => `
      <tr>
        <td><strong>${p.class_name}</strong></td>
        <td>Đợt ${p.batch_number} (${p.batch_name})</td>
        <td><span class="badge badge-active">${p.total_receipts_count} lượt thu</span></td>
        <td><strong style="color: var(--primary);">${Number(p.total_revenue_collected || 0).toLocaleString('vi-VN')} VNĐ</strong></td>
      </tr>
    `).join('') : `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Chưa có lượt thu học phí nào cho các đợt của giáo viên này trong CSDL.</td></tr>`;

    navigateToView('teacher-detail', false);
  } catch (err) {
    alert('Lỗi lấy chi tiết giáo viên: ' + err.message);
  }
}

function initTeachersEvents() {
  const searchInput = document.getElementById('search-teacher-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => loadTeachersModule());
  }

  // Open Add Teacher Modal & Populate Subjects Dropdown
  const btnOpenAdd = document.getElementById('btn-open-add-teacher');
  if (btnOpenAdd) {
    btnOpenAdd.addEventListener('click', async () => {
      document.getElementById('form-teacher').reset();
      document.getElementById('teacher-id-field').value = '';
      document.getElementById('modal-teacher-form-title').textContent = 'Thêm Mới Giáo Viên';
      
      const subjects = await ApiService.getSubjects();
      const selectSub = document.getElementById('teacher-subject-field');
      if (selectSub) {
        selectSub.innerHTML = subjects.map(s => `<option value="${s.subject_id}">${s.subject_name}</option>`).join('');
      }

      openModal('modal-teacher-form');
    });
  }

  // Save Teacher directly into DB
  const btnSave = document.getElementById('btn-save-teacher');
  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const teacherId = document.getElementById('teacher-id-field').value;
      const name = document.getElementById('teacher-name-field').value.trim();
      const phone = document.getElementById('teacher-phone-field').value.trim();
      const subjectId = document.getElementById('teacher-subject-field').value;

      if (!name) {
        alert('Vui lòng nhập Họ và Tên giáo viên!');
        return;
      }

      try {
        const phoneVal = phone ? phone : '0000000000';
        if (teacherId) {
          await ApiService.updateTeacher(teacherId, {
            full_name: name,
            phone: phoneVal,
            specialization_subject_id: subjectId ? parseInt(subjectId) : null
          });
        } else {
          await ApiService.createTeacher(name, phoneVal, subjectId ? parseInt(subjectId) : null);
        }

        closeModal('modal-teacher-form');
        loadTeachersModule();
        alert('Lưu thông tin giáo viên thành công!');
      } catch (err) {
        alert('Lỗi lưu giáo viên: ' + err.message);
      }
    });
  }
}
