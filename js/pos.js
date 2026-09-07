/* =============================================================================
   CASHIER POS & SMART RECEIPT GENERATION (JS/POS.JS)
   ============================================================================= */

import { searchStudents, getStudentEnrolledClassesAndBatches, createReceipt } from './api.js';

let selectedStudent = null;
let enrolledClassesData = [];
let selectedBatchItems = []; // Array of { class_id, batch_id, class_name, batch_name, fee_rate, is_first_time }

export function initPOS() {
    const searchInput = document.getElementById('pos-student-search');
    const dropdown = document.getElementById('pos-search-dropdown');

    if (!searchInput) return;

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value;
        if (query.trim().length === 0) {
            dropdown.classList.remove('active');
            dropdown.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(async () => {
            const results = await searchStudents(query);
            renderSearchResults(results, dropdown);
        }, 300);
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    // Initialize Receipt Creation Handler
    const btnSubmitReceipt = document.getElementById('btn-submit-receipt');
    if (btnSubmitReceipt) {
        btnSubmitReceipt.addEventListener('click', handleCreateReceipt);
    }
}

function renderSearchResults(results, dropdown) {
    if (!results || results.length === 0) {
        dropdown.innerHTML = `<div class="search-item" style="color: var(--text-muted);">Không tìm thấy học sinh phù hợp</div>`;
        dropdown.classList.add('active');
        return;
    }

    dropdown.innerHTML = results.map(s => `
        <div class="search-item" data-student-id="${s.student_id}">
            <div>
                <strong>${s.full_name}</strong> <span style="color: var(--text-secondary);">(${s.student_code})</span>
                <div style="font-size: 0.8rem; color: var(--text-muted);">SĐT: ${s.phone} | Khối ${s.grade}</div>
            </div>
            <span class="badge badge-${s.status.toLowerCase()}">${s.status === 'DANG_HOC' ? 'Đang học' : 'Đã tốt nghiệp'}</span>
        </div>
    `).join('');

    dropdown.classList.add('active');

    dropdown.querySelectorAll('.search-item').forEach(item => {
        item.addEventListener('click', async () => {
            const studentId = item.getAttribute('data-student-id');
            const studentObj = results.find(s => s.student_id === studentId);
            dropdown.classList.remove('active');
            await selectStudent(studentObj);
        });
    });
}

async function selectStudent(student) {
    selectedStudent = student;
    selectedBatchItems = [];

    // Render Student Header Card
    const headerElem = document.getElementById('pos-student-header');
    if (headerElem) {
        headerElem.style.display = 'block';
        headerElem.innerHTML = `
            <div class="card" style="background-color: var(--primary-light); border-color: var(--primary-border);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="color: var(--primary-active); font-size: 1.25rem;">${student.full_name} (${student.student_code})</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">SĐT Liên hệ: <strong>${student.phone}</strong> | Khối lớp: <strong>Khối ${student.grade}</strong></p>
                    </div>
                    <span class="badge badge-${student.status.toLowerCase()}">${student.status}</span>
                </div>
            </div>
        `;
    }

    // Fetch enrolled classes & 12 batches
    enrolledClassesData = await getStudentEnrolledClassesAndBatches(student.student_id);
    renderEnrolledClassesAndBatches(enrolledClassesData);
    updateReceiptSummary();
}

function renderEnrolledClassesAndBatches(classes) {
    const container = document.getElementById('pos-classes-container');
    if (!container) return;

    if (!classes || classes.length === 0) {
        container.innerHTML = `<div class="card" style="text-align: center; color: var(--text-muted);">Học sinh này chưa ghi danh vào lớp học nào.</div>`;
        return;
    }

    container.innerHTML = classes.map(c => {
        const hasAnyPreviousPaid = c.batches.some(b => b.is_paid);
        const isFirstTimeClass = !hasAnyPreviousPaid;

        return `
            <div class="class-pos-card">
                <div class="class-pos-header">
                    <div>
                        <strong style="font-size: 1.05rem; color: var(--text-main);">${c.class_name}</strong>
                        ${isFirstTimeClass ? `<span style="font-size: 0.75rem; color: #d97706; background-color: #fffbeb; padding: 2px 8px; border-radius: 12px; margin-left: 8px; font-weight: 600;">⚠️ Đóng lần đầu</span>` : ''}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">Học phí mặc định: <strong>${Number(c.default_fee_rate).toLocaleString('vi-VN')} VNĐ</strong></div>
                </div>

                <div class="batches-flex-grid">
                    ${c.batches.map(b => {
                        const isSelected = selectedBatchItems.some(item => item.batch_id === b.batch_id);
                        let badgeClass = 'badge-upcoming';
                        let statusText = 'Sắp học';
                        if (b.status === 'DANG_HOC') { badgeClass = 'badge-dang-hoc'; statusText = 'Đang học'; }
                        else if (b.status === 'COMPLETED') { badgeClass = 'badge-completed'; statusText = 'Đã xong'; }

                        return `
                            <div class="batch-pill ${b.is_paid ? 'paid' : ''} ${isSelected ? 'selected' : ''}" 
                                 data-class-id="${c.class_id}" 
                                 data-batch-id="${b.batch_id}" 
                                 data-is-paid="${b.is_paid}"
                                 data-is-first="${isFirstTimeClass}">
                                <div class="batch-pill-name">Đợt ${b.batch_number}</div>
                                <div style="margin: 3px 0;"><span class="badge ${badgeClass}" style="font-size: 0.65rem;">${statusText}</span></div>
                                <div class="batch-pill-fee">${b.is_paid ? '✓ Đã đóng' : `${Number(b.fee_rate).toLocaleString('vi-VN')}đ`}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');

    // Attach click listeners to batch pills
    container.querySelectorAll('.batch-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const isPaid = pill.getAttribute('data-is-paid') === 'true';
            if (isPaid) return; // Cannot re-pay already paid batch

            const classId = pill.getAttribute('data-class-id');
            const batchId = pill.getAttribute('data-batch-id');
            const isFirst = pill.getAttribute('data-is-first') === 'true';

            const classObj = enrolledClassesData.find(c => c.class_id === classId);
            const batchObj = classObj.batches.find(b => b.batch_id === batchId);

            toggleBatchSelection(classObj, batchObj, isFirst, pill);
        });
    });
}

function toggleBatchSelection(classObj, batchObj, isFirst, pillElem) {
    const existingIndex = selectedBatchItems.findIndex(item => item.batch_id === batchObj.batch_id);

    if (existingIndex >= 0) {
        selectedBatchItems.splice(existingIndex, 1);
        pillElem.classList.remove('selected');
    } else {
        selectedBatchItems.push({
            class_id: classObj.class_id,
            batch_id: batchObj.batch_id,
            class_name: classObj.class_name,
            batch_name: batchObj.batch_name,
            batch_number: batchObj.batch_number,
            amount_paid: batchObj.fee_rate,
            is_first_time: isFirst
        });
        pillElem.classList.add('selected');

        if (isFirst) {
            alert(`⚠️ Cảnh báo: Học sinh ${selectedStudent.full_name} đóng đợt đầu tiên cho lớp ${classObj.class_name}. Vui lòng kiểm tra và điều chỉnh số tiền nếu học sinh vào học giữa chừng!`);
        }
    }

    updateReceiptSummary();
}

function updateReceiptSummary() {
    const summaryCard = document.getElementById('pos-receipt-summary');
    if (!summaryCard) return;

    if (selectedBatchItems.length === 0) {
        summaryCard.innerHTML = `<p style="color: var(--text-muted); text-align: center;">Chưa chọn đợt đóng phí nào.</p>`;
        return;
    }

    const total = selectedBatchItems.reduce((sum, item) => sum + Number(item.amount_paid), 0);

    summaryCard.innerHTML = `
        <h4 style="margin-bottom: 0.75rem; color: var(--text-main);">Danh sách đợt thanh toán:</h4>
        <ul style="list-style: none; margin-bottom: 1rem;">
            ${selectedBatchItems.map((item, idx) => `
                <li style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px dashed var(--border-color); font-size: 0.9rem;">
                    <span><strong>${item.class_name}</strong> - Đợt ${item.batch_number}</span>
                    <input type="number" class="form-input" style="width: 130px; text-align: right; padding: 2px 6px;" 
                           value="${item.amount_paid}" data-idx="${idx}" onchange="window.updateLineAmount(${idx}, this.value)" />
                </li>
            `).join('')}
        </ul>
        <div style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 700; color: var(--primary-hover); margin-bottom: 1rem;">
            <span>Tổng tiền thực thu:</span>
            <span>${total.toLocaleString('vi-VN')} VNĐ</span>
        </div>
    `;
}

window.updateLineAmount = function(idx, val) {
    if (selectedBatchItems[idx]) {
        selectedBatchItems[idx].amount_paid = Number(val) || 0;
        updateReceiptSummary();
    }
};

async function handleCreateReceipt() {
    if (!selectedStudent) {
        alert('Vui lòng chọn học sinh!');
        return;
    }
    if (selectedBatchItems.length === 0) {
        alert('Vui lòng chọn ít nhất 1 đợt đóng phí!');
        return;
    }

    const receiptTypeElem = document.getElementById('pos-receipt-type');
    const manualCodeElem = document.getElementById('pos-manual-code');
    const receiptType = receiptTypeElem ? receiptTypeElem.value : 'IN_MAY';
    const manualCode = manualCodeElem ? manualCodeElem.value.trim() : null;

    try {
        const receipt = await createReceipt(selectedStudent.student_id, receiptType, selectedBatchItems, manualCode);
        alert(`✅ Đã tạo biên lai thành công! Mã biên lai: ${receipt.receipt_code}`);
        
        // Show printable receipt modal
        showPrintReceiptModal(receipt, selectedStudent, selectedBatchItems);

        // Reset POS Selection
        selectStudent(selectedStudent);
    } catch (err) {
        alert('Lỗi khi tạo biên lai: ' + err.message);
    }
}

function showPrintReceiptModal(receipt, student, items) {
    const modalBackdrop = document.getElementById('modal-print-receipt');
    const printableArea = document.getElementById('receipt-print-area');
    if (!modalBackdrop || !printableArea) return;

    const total = items.reduce((sum, item) => sum + Number(item.amount_paid), 0);
    const todayStr = new Date().toLocaleDateString('vi-VN');

    printableArea.innerHTML = `
        <div class="receipt-printable">
            <div class="receipt-header-print">
                <div class="receipt-center-title">TRUNG TÂM NGOẠI NGỮ GROW</div>
                <div style="font-size: 0.85rem; color: #475569;">Địa chỉ: Trung tâm Bồi dưỡng Kiến thức & Ngoại ngữ Grow</div>
                <div class="receipt-bill-title">BIÊN LAI THU HỌC PHÍ</div>
                <div style="font-size: 0.85rem;">Mã biên lai: <strong>${receipt.receipt_code}</strong> | Ngày: ${todayStr}</div>
            </div>

            <div style="margin-bottom: 1rem; font-size: 0.9rem; line-height: 1.6;">
                <div>Họ và tên học sinh: <strong>${student.full_name}</strong> (Mã HS: ${student.student_code})</div>
                <div>Số điện thoại liên hệ: ${student.phone} | Khối lớp: Khối ${student.grade}</div>
                <div>Hình thức thu: ${receipt.receipt_type === 'IN_MAY' ? 'In máy trực tiếp' : `Thu sổ tay (${receipt.manual_receipt_code || '---'})`}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.85rem;">
                <thead>
                    <tr style="background-color: #f1f5f9; text-align: left;">
                        <th style="border: 1px solid #cbd5e1; padding: 6px;">Lớp học</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px;">Đợt học</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">Số tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(it => `
                        <tr>
                            <td style="border: 1px solid #cbd5e1; padding: 6px;">${it.class_name}</td>
                            <td style="border: 1px solid #cbd5e1; padding: 6px;">Đợt ${it.batch_number}</td>
                            <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">${Number(it.amount_paid).toLocaleString('vi-VN')} VNĐ</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="text-align: right; font-size: 1.1rem; font-weight: bold; margin-bottom: 1.5rem;">
                TỔNG TIỀN THỰC THU: <span style="color: var(--primary);">${total.toLocaleString('vi-VN')} VNĐ</span>
            </div>

            <div style="display: flex; justify-content: space-between; text-align: center; font-size: 0.85rem; margin-top: 1rem;">
                <div>
                    <strong>Người nộp tiền</strong><br/>
                    <span style="font-size: 0.75rem; color: #64748b;">(Ký, ghi rõ họ tên)</span>
                </div>
                <div>
                    <strong>Người lập phiếu thu</strong><br/>
                    <span style="font-size: 0.75rem; color: #64748b;">(Ký, ghi rõ họ tên)</span>
                </div>
            </div>
        </div>
    `;

    modalBackdrop.classList.add('active');
}
