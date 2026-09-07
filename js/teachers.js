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

  tbody.innerHTML = teachers.map(t => `
    <tr>
      <td><strong>${t.teacher_code || t.teacher_id.substring(0, 8)}</strong></td>
      <td><strong style="color: var(--primary);">${t.full_name}</strong></td>
      <td>${t.phone || 'N/A'}</td>
      <td>${t.phone ? t.phone + '@grow.edu.vn' : 'N/A'}</td>
      <td><span class="badge badge-active">Giáo viên Bộ môn</span></td>
      <td><strong>${t.assignedClassCount} lớp</strong></td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="openTeacherDetailPage('${t.teacher_id}')">
          <i class="fa-solid fa-calculator"></i> Xem Trang Chi Tiết & Payroll
        </button>
      </td>
    </tr>
  `).join('');
}

async function openTeacherDetailPage(teacherId) {
  currentSelectedTeacherId = teacherId;

  try {
    const data = await ApiService.getTeacherDetails(teacherId);
    const { teacher, classes, payroll } = data;

    // Header Info directly from DB
    document.getElementById('page-teacher-full-name').textContent = teacher.full_name;
    document.getElementById('page-teacher-meta').textContent = `Mã GV: ${teacher.teacher_code} | SĐT: ${teacher.phone || 'N/A'} | Lớp phụ trách: ${classes.length} lớp`;

    // Tab 1: Classes from DB (Hidden Mã Lớp)
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

    navigateToView('teacher-detail');
  } catch (err) {
    alert('Lỗi lấy chi tiết giáo viên: ' + err.message);
  }
}

function initTeachersEvents() {
  const searchInput = document.getElementById('search-teacher-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => loadTeachersModule());
  }

  // Open Add Teacher Modal
  const btnOpenAdd = document.getElementById('btn-open-add-teacher');
  if (btnOpenAdd) {
    btnOpenAdd.addEventListener('click', () => {
      document.getElementById('form-teacher').reset();
      document.getElementById('teacher-id-field').value = '';
      document.getElementById('modal-teacher-form-title').textContent = 'Thêm Mới Giáo Viên';
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

      if (!name || !phone) {
        alert('Vui lòng điền đầy đủ Họ tên và Số điện thoại!');
        return;
      }

      try {
        if (teacherId) {
          await ApiService.updateTeacher(teacherId, {
            full_name: name,
            phone: phone
          });
        } else {
          await ApiService.createTeacher(name, phone, '', '');
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
