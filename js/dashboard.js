// EduManager V2 - Module Thống Kê Analytics Dashboard (100% Real DB Data)

async function loadDashboardModule() {
  try {
    const stats = await ApiService.getDashboardStats();

    // Stats Cards directly from DB
    document.getElementById('stat-revenue-today').textContent = `${stats.revenueToday.toLocaleString('vi-VN')} VNĐ`;
    document.getElementById('stat-total-students').textContent = stats.totalStudents;
    document.getElementById('stat-total-classes').textContent = stats.totalClasses;
    document.getElementById('stat-unpaid-finished-classes').textContent = stats.unpaidFinishedClassesCount;

    // Table Unpaid Finished Classes from v_class_details
    const tbody = document.getElementById('tbl-unpaid-classes-body');
    if (stats.unpaidClasses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">Không có lớp nào đã kết thúc còn nợ học phí trong cơ sở dữ liệu.</td></tr>`;
      return;
    }

    tbody.innerHTML = stats.unpaidClasses.map(c => `
      <tr>
        <td><strong>${c.class_id.substring(0, 8)}...</strong></td>
        <td><strong style="color: var(--primary);">${c.class_name}</strong></td>
        <td>${c.teacher_name || 'N/A'}</td>
        <td><span class="badge badge-active">${c.enrolled_count} học sinh</span></td>
        <td><strong>${Number(c.default_fee_rate).toLocaleString('vi-VN')} VNĐ</strong></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="openClassDetailPage('${c.class_id}')">
            <i class="fa-solid fa-eye"></i> Xem Lớp
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}
