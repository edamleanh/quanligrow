/* =============================================================================
   EDUMANAGER V2 - MODULE 1: DASHBOARD (js/dashboard.js)
   ============================================================================= */

import { api } from './api.js';
import { formatCurrency } from './utils.js';

export async function renderDashboard(container, activeYear) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 24px; font-weight: 800; color: var(--text-main);">📊 Dashboard Tổng Quan</h2>
        <p style="font-size: 14px; color: var(--text-muted);">Thống kê doanh thu & tình hình học vụ Niên khóa ${activeYear}</p>
      </div>
      <button class="btn btn-primary" onclick="window.location.hash='#/pos'">💳 Mở Màn Hình POS Thu Tiền</button>
    </div>

    <!-- 4 Summary Stats Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px;">
      <div class="card" style="border-left: 5px solid var(--teal-600);">
        <div style="font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Doanh Thu Hôm Nay</div>
        <div id="stat-today-revenue" style="font-size: 26px; font-weight: 800; color: var(--teal-600); margin-top: 6px;">0 VNĐ</div>
        <div style="font-size: 12px; color: var(--text-light); margin-top: 4px;">Tính theo biên lai thực thu trong ngày</div>
      </div>

      <div class="card" style="border-left: 5px solid var(--accent-500);">
        <div style="font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Tổng Số Học Sinh</div>
        <div id="stat-total-students" style="font-size: 26px; font-weight: 800; color: var(--accent-600); margin-top: 6px;">0</div>
        <div style="font-size: 12px; color: var(--text-light); margin-top: 4px;">Đang học toàn trung tâm</div>
      </div>

      <div class="card" style="border-left: 5px solid var(--primary-500);">
        <div style="font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Số Lớp Hoạt Động</div>
        <div id="stat-active-classes" style="font-size: 26px; font-weight: 800; color: var(--primary-600); margin-top: 6px;">0</div>
        <div style="font-size: 12px; color: var(--text-light); margin-top: 4px;">Niên khóa ${activeYear}</div>
      </div>

      <div class="card" style="border-left: 5px solid #f59e0b;">
        <div style="font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Lớp Đã Kết Thúc</div>
        <div id="stat-completed-classes" style="font-size: 26px; font-weight: 800; color: #d97706; margin-top: 6px;">0</div>
        <div style="font-size: 12px; color: var(--text-light); margin-top: 4px;">Số lớp đã xong chương trình</div>
      </div>
    </div>

    <!-- Completed Classes Needing Debt Collection Table -->
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 18px; font-weight: 800; color: var(--text-main);">🚨 Bảng Lớp Học Kết Thúc / Cần Thu Nợ Học Phí</h3>
        <span class="badge badge-overdue">Theo dõi công nợ</span>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã Học Sinh</th>
              <th>Họ Và Tên Học Sinh</th>
              <th>Tên Lớp Học</th>
              <th>Đợt Học</th>
              <th>Học Phí Đợt</th>
              <th>Đã Đóng</th>
              <th>Còn Nợ</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody id="debt-table-body">
            <tr>
              <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">Đang tải dữ liệu công nợ...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Fetch real data
  try {
    const { count: studentCount } = await api.getStudents();
    const classes = await api.getClasses({ academic_year: activeYear });
    const debtSummary = await api.getDebtSummary();

    const activeClassesCount = classes.filter(c => c.is_active).length;
    const completedClassesCount = classes.filter(c => !c.is_active).length;

    // Calculate today's revenue (from receipts created today)
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: receiptsToday } = await api.supabase
      .from('receipts')
      .select('total_amount')
      .gte('receipt_date', `${todayStr}T00:00:00.000Z`);

    const todayRevenue = (receiptsToday || []).reduce((sum, r) => sum + Number(r.total_amount || 0), 0);

    // Populate stat cards
    document.getElementById('stat-today-revenue').innerText = formatCurrency(todayRevenue);
    document.getElementById('stat-total-students').innerText = studentCount || 0;
    document.getElementById('stat-active-classes').innerText = activeClassesCount;
    document.getElementById('stat-completed-classes').innerText = completedClassesCount;

    // Filter debt items where remaining_debt > 0
    const unpaidItems = (debtSummary || []).filter(d => Number(d.remaining_debt) > 0).slice(0, 15);

    const tbody = document.getElementById('debt-table-body');
    if (unpaidItems.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--primary-600); font-weight: 600; padding: 24px;">
            🎉 Không có công nợ tồn đọng! Tất cả học sinh đã hoàn thành học phí.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = unpaidItems.map(d => `
        <tr>
          <td><strong style="color: var(--teal-600);">${d.student_code}</strong></td>
          <td><strong>${d.student_name}</strong></td>
          <td>${d.class_name}</td>
          <td><span class="badge badge-current">${d.batch_name}</span></td>
          <td>${formatCurrency(d.expected_amount)}</td>
          <td style="color: var(--primary-600); font-weight: 700;">${formatCurrency(d.paid_amount)}</td>
          <td style="color: var(--status-overdue-color); font-weight: 800;">${formatCurrency(d.remaining_debt)}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="window.openPOSForStudent('${d.student_id}')">
              💳 Thu Nợ POS
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }
}
