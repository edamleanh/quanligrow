/* =============================================================================
   ADMIN ANALYTICS DASHBOARD (JS/DASHBOARD.JS)
   ============================================================================= */

import { fetchTodayRevenue, fetchClassesUnpaidCompletedStats, fetchOverallStats } from './api.js';

export async function renderAdminDashboard() {
    const revenueElem = document.getElementById('stat-today-revenue');
    const unpaidClassesContainer = document.getElementById('dashboard-unpaid-classes-list');

    if (!revenueElem) return;

    try {
        // Fetch Today's Revenue
        const todayRev = await fetchTodayRevenue();
        revenueElem.innerText = `${Number(todayRev).toLocaleString('vi-VN')} VNĐ`;

        // Fetch Overall Stats
        const overall = await fetchOverallStats();
        const statStudents = document.getElementById('stat-total-students');
        const statClasses = document.getElementById('stat-total-classes');
        const statActiveBatches = document.getElementById('stat-active-batches');

        if (statStudents) statStudents.innerText = overall.totalStudents.toLocaleString('vi-VN');
        if (statClasses) statClasses.innerText = overall.totalClasses;
        if (statActiveBatches) statActiveBatches.innerText = overall.activeBatches;

        // Fetch Classes with Most Unpaid Students for Completed Batches
        const unpaidStats = await fetchClassesUnpaidCompletedStats();

        if (unpaidClassesContainer) {
            if (!unpaidStats || unpaidStats.length === 0) {
                unpaidClassesContainer.innerHTML = `<p style="color: var(--text-muted); text-align: center;">Không có lớp nào nợ đợt đã xong.</p>`;
            } else {
                unpaidClassesContainer.innerHTML = `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tên Lớp Học</th>
                                <th style="text-align: right;">Số HS Chưa Đóng Phí</th>
                                <th style="text-align: center;">Trạng Thái Nợ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${unpaidStats.slice(0, 10).map((c, idx) => `
                                <tr>
                                    <td><strong>${idx + 1}</strong></td>
                                    <td><strong>${c.className}</strong></td>
                                    <td style="text-align: right; color: var(--status-completed-text); font-weight: 700;">${c.unpaidCount} học sinh</td>
                                    <td style="text-align: center;">
                                        <span class="badge badge-completed">Nợ Cần Nhắc</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
        }
    } catch (err) {
        console.error('Error rendering dashboard:', err);
    }
}
