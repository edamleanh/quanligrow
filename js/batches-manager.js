/* =============================================================================
   BATCHES & FEE MANAGEMENT MODULE (JS/BATCHES-MANAGER.JS)
   ============================================================================= */

import { fetchAllClasses, fetchBatchesByClass, updateBatchStatus } from './api.js';

export async function initBatchesManager() {
    const selectClass = document.getElementById('batch-mgr-class-select');
    if (!selectClass) return;

    try {
        const classes = await fetchAllClasses();
        selectClass.innerHTML = classes.map(c => `<option value="${c.class_id}">${c.class_name}</option>`).join('');

        selectClass.addEventListener('change', () => {
            loadClassBatches(selectClass.value);
        });

        if (classes.length > 0) {
            loadClassBatches(classes[0].class_id);
        }
    } catch (err) {
        console.error('Error init batches manager:', err);
    }
}

async function loadClassBatches(classId) {
    const listContainer = document.getElementById('batch-mgr-list');
    if (!listContainer) return;

    try {
        const batches = await fetchBatchesByClass(classId);

        listContainer.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Đợt</th>
                        <th>Tên Đợt</th>
                        <th>Học Phí Đợt</th>
                        <th>Trạng Thái CSDL</th>
                        <th style="text-align: right;">Thao Tác Chuyển Đợt</th>
                    </tr>
                </thead>
                <tbody>
                    ${batches.map(b => `
                        <tr>
                            <td><strong>Đợt ${b.batch_number}</strong></td>
                            <td>${b.batch_name}</td>
                            <td><strong>${Number(b.fee_rate).toLocaleString('vi-VN')} VNĐ</strong></td>
                            <td>
                                <span class="badge badge-${b.status.toLowerCase()}">
                                    ${b.status === 'DANG_HOC' ? '🟢 Đang Học (Hiện tại)' : b.status === 'COMPLETED' ? '🔴 Đã Hoàn Thành' : '🟡 Sắp Học'}
                                </span>
                            </td>
                            <td style="text-align: right;">
                                ${b.status !== 'COMPLETED' ? `<button class="btn btn-sm btn-secondary" onclick="window.changeBatchStatus('${b.batch_id}', 'COMPLETED', '${classId}')">Đánh dấu Kết thúc đợt</button>` : ''}
                                ${b.status !== 'DANG_HOC' ? `<button class="btn btn-sm btn-primary" onclick="window.changeBatchStatus('${b.batch_id}', 'DANG_HOC', '${classId}')">Đặt làm Đợt Đang Học</button>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        console.error('Error loading batches:', err);
    }
}

window.changeBatchStatus = async function(batchId, newStatus, classId) {
    try {
        await updateBatchStatus(batchId, newStatus);
        alert('✅ Cập nhật trạng thái đợt học thành công!');
        loadClassBatches(classId);
    } catch (err) {
        alert('Lỗi cập nhật: ' + err.message);
    }
};
