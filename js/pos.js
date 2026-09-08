/* =============================================================================
   EDUMANAGER V2 - MODULE 5: POS PAYMENTS & DEBT REPORT (js/pos.js)
   ============================================================================= */

import { api } from './api.js';
import { formatCurrency, formatDateTime, openModal, closeModal, showToast } from './utils.js';

export async function renderPOSView(container, targetStudentId = null) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 24px; font-weight: 800; color: var(--text-main);">💳 POS Thu Tiền Học Phí & In Biên Lai</h2>
        <p style="font-size: 14px; color: var(--text-muted);">Màn hình lập phiếu thu học phí & tra cứu công nợ</p>
      </div>

      <div style="display: flex; gap: 12px;">
        <button class="tab-btn active" id="pos-tab-pay" style="padding: 10px 18px; font-weight: 700; background: var(--teal-600); color: #fff; border: none; border-radius: var(--radius-md); cursor: pointer;">
          💳 Lập Biên Lai Thu Tiền
        </button>
        <button class="tab-btn" id="pos-tab-debt" style="padding: 10px 18px; font-weight: 700; background: var(--surface-hover); color: var(--text-main); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer;">
          📊 Tra Cứu Báo Cáo Nợ Phí
        </button>
      </div>
    </div>

    <!-- POS Content Container -->
    <div id="pos-main-content">
      <!-- Pay View Content -->
      <div id="pos-view-pay" style="display: grid; grid-template-columns: 1fr 340px; gap: 24px;">
        
        <!-- Left Panel: Student Search & Batches List -->
        <div>
          <!-- Student Search Card -->
          <div class="card" style="margin-bottom: 20px;">
            <label class="form-label" style="font-size: 14px;">1. Tìm Kiếm & Chọn Học Sinh Đóng Phí (*)</label>
            <div style="position: relative;">
              <input type="text" id="pos-student-search-input" class="form-control" placeholder="🔍 Nhập Tên, SĐT, hoặc Mã Học Sinh (VD: HS00120)..." autocomplete="off">
              <div id="pos-student-dropdown" style="position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid var(--border-color); border-radius: var(--radius-md); max-height: 250px; overflow-y: auto; box-shadow: var(--shadow-lg); z-index: 20; display: none;"></div>
            </div>

            <!-- Selected Student Banner -->
            <div id="pos-selected-student-card" style="margin-top: 16px; display: none; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: 14px 18px;"></div>
          </div>

          <!-- Batches Selection Container -->
          <div class="card" id="pos-batches-card">
            <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 16px; color: var(--text-main);">
              2. Danh Sách Các Đợt Học (Phân Theo Lớp & Bảo Lưu Nợ Cũ)
            </h3>
            <div id="pos-batches-list" style="color: var(--text-muted); font-size: 14px; text-align: center; padding: 30px;">
              👈 Vui lòng chọn Học sinh ở trên để hiển thị danh sách đợt học...
            </div>
          </div>
        </div>

        <!-- Right Panel: Receipt Summary & Confirm -->
        <div>
          <div class="card" style="position: sticky; top: 90px; border-top: 5px solid var(--teal-600);">
            <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 16px; color: var(--text-main);">3. Chi Tiết Biên Lai</h3>

            <div class="form-group">
              <label class="form-label">Loại Biên Lai Thu</label>
              <select id="pos-receipt-type" class="form-control">
                <option value="IN_MAY" selected>In Máy (Mã tự sinh)</option>
                <option value="NHAP_TAY">Nhập Tay (Cuống sổ tay)</option>
              </select>
            </div>

            <div class="form-group" id="group-manual-code" style="display: none;">
              <label class="form-label">Mã Biên Lai Nhập Tay (*)</label>
              <input type="text" id="pos-manual-code" class="form-control" placeholder="Nhập mã từ cuống sổ tay...">
            </div>

            <div style="border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); padding: 16px 0; margin: 16px 0;">
              <div style="font-size: 13px; font-weight: 700; color: var(--text-muted); margin-bottom: 10px;">CÁC MỤC ĐÃ CHỌN ĐÓNG:</div>
              <div id="pos-receipt-selected-items" style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; max-height: 180px; overflow-y: auto;">
                <div style="color: var(--text-light); italic;">Chưa chọn đợt học nào</div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <span style="font-size: 15px; font-weight: 700; color: var(--text-main);">TỔNG TIỀN THU:</span>
              <strong id="pos-total-amount" style="font-size: 22px; font-weight: 800; color: var(--teal-600);">0 VNĐ</strong>
            </div>

            <button class="btn btn-primary" id="btn-confirm-payment" style="width: 100%; padding: 14px; font-size: 16px;" disabled>
              💳 Xác Nhận Thu Tiền & In Phiếu Thu
            </button>
          </div>
        </div>
      </div>

      <!-- Debt Report Content -->
      <div id="pos-view-debt" class="card" style="display: none;">
        <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 16px;">📊 Báo Cáo Tra Cứu Công Nợ Học Phí Theo Lớp & Đợt</h3>
        <div style="display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;">
          <input type="text" id="debt-search-input" class="form-control" style="flex: 1; min-width: 250px;" placeholder="🔍 Tìm theo Tên/SĐT học sinh...">
          <button class="btn btn-primary" id="btn-search-debt">Tra Cứu Nợ</button>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã HS</th>
                <th>Họ Và Tên Học Sinh</th>
                <th>SĐT Liên Hệ</th>
                <th>Lớp Học</th>
                <th>Đợt Học</th>
                <th>Học Phí Đợt</th>
                <th>Đã Đóng</th>
                <th>Còn Nợ</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody id="debt-report-tbody">
              <tr>
                <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 24px;">Đang tải dữ liệu công nợ...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Bind POS Tab Switcher
  const btnPay = document.getElementById('pos-tab-pay');
  const btnDebt = document.getElementById('pos-tab-debt');
  const viewPay = document.getElementById('pos-view-pay');
  const viewDebt = document.getElementById('pos-view-debt');

  btnPay.onclick = () => {
    btnPay.style.background = 'var(--teal-600)';
    btnPay.style.color = '#fff';
    btnDebt.style.background = 'var(--surface-hover)';
    btnDebt.style.color = 'var(--text-main)';
    viewPay.style.display = 'grid';
    viewDebt.style.display = 'none';
  };

  btnDebt.onclick = () => {
    btnDebt.style.background = 'var(--teal-600)';
    btnDebt.style.color = '#fff';
    btnPay.style.background = 'var(--surface-hover)';
    btnPay.style.color = 'var(--text-main)';
    viewPay.style.display = 'none';
    viewDebt.style.display = 'block';
    loadDebtReport();
  };

  document.getElementById('btn-search-debt').onclick = () => loadDebtReport();

  document.getElementById('pos-receipt-type').onchange = (e) => {
    document.getElementById('group-manual-code').style.display = e.target.value === 'NHAP_TAY' ? 'block' : 'none';
  };

  // Setup Student Autocomplete Search
  setupStudentAutocomplete(targetStudentId);
}

let selectedStudentState = null; // { student, enrollments, debtItems }
let selectedPaymentItemsState = new Map(); // key: "CLASS_ID|BATCH_ID" -> { classId, batchId, className, batchName, amount }

async function setupStudentAutocomplete(targetStudentId = null) {
  const input = document.getElementById('pos-student-search-input');
  const dropdown = document.getElementById('pos-student-dropdown');

  input.oninput = async () => {
    const val = input.value.trim();
    if (val.length < 1) {
      dropdown.style.display = 'none';
      return;
    }

    try {
      const { data: students } = await api.getStudents({ search: val });
      if (students.length === 0) {
        dropdown.innerHTML = `<div style="padding: 12px; color: var(--text-muted); font-size: 13px;">Không tìm thấy học sinh.</div>`;
      } else {
        dropdown.innerHTML = students.slice(0, 8).map(s => `
          <div class="student-select-item" data-id="${s.student_id}" style="padding: 10px 14px; border-bottom: 1px solid var(--border-light); cursor: pointer; display: flex; justify-content: space-between;">
            <span><strong>${s.full_name}</strong> (${s.student_code})</span>
            <span style="color: var(--teal-600); font-weight: 600;">Khối ${s.grade}</span>
          </div>
        `).join('');

        dropdown.querySelectorAll('.student-select-item').forEach(el => {
          el.onclick = () => {
            const sid = el.getAttribute('data-id');
            dropdown.style.display = 'none';
            input.value = '';
            selectStudentForPOS(sid);
          };
        });
      }
      dropdown.style.display = 'block';
    } catch (err) {
      console.error('Error searching students for POS:', err);
    }
  };

  if (targetStudentId) {
    selectStudentForPOS(targetStudentId);
  }
}

async function selectStudentForPOS(studentId) {
  try {
    const student = await api.getStudentById(studentId);
    const enrollments = await api.getEnrollmentsByStudent(studentId);
    const debtSummary = await api.getDebtSummary();

    const studentDebts = (debtSummary || []).filter(d => d.student_id === studentId);

    selectedStudentState = { student, enrollments, studentDebts };
    selectedPaymentItemsState.clear();

    // Render Student Banner Card
    const banner = document.getElementById('pos-selected-student-card');
    const isFirstTime = enrollments.length <= 1;

    banner.style.display = 'block';
    banner.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4 style="font-size: 16px; font-weight: 800; color: #065f46;">👤 ${student.full_name} (${student.student_code})</h4>
          <div style="font-size: 13px; color: #047857; margin-top: 2px;">
            Khối ${student.grade} | 📞 ${student.phone || 'Chưa có SĐT'} | Đang đăng ký ${enrollments.length} lớp học
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.clearPOSStudent()">Đổi Học Sinh</button>
      </div>

      ${isFirstTime ? `
        <div style="margin-top: 10px; background: #fff3cd; border: 1px solid #ffeba2; color: #856404; padding: 8px 12px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 700;">
          ⚠️ BANNER NỔI: Đây là học sinh mới / đóng học phí lần đầu cho lớp! Kiểm tra giảm giá hoặc trừ tiền nếu vào học giữa đợt.
        </div>
      ` : ''}
    `;

    // Render Batches Selection Grouped by Class
    renderStudentPOSBatches();
    updateReceiptSummary();

  } catch (err) {
    console.error('Error selecting student for POS:', err);
    showToast('Lỗi tải học sinh cho POS: ' + err.message, 'error');
  }
}

window.clearPOSStudent = function() {
  selectedStudentState = null;
  selectedPaymentItemsState.clear();
  document.getElementById('pos-selected-student-card').style.display = 'none';
  document.getElementById('pos-batches-list').innerHTML = `👈 Vui lòng chọn Học sinh ở trên để hiển thị danh sách đợt học...`;
  updateReceiptSummary();
};

async function renderStudentPOSBatches() {
  const container = document.getElementById('pos-batches-list');
  const { enrollments } = selectedStudentState;

  if (enrollments.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">Học sinh này chưa ghi danh lớp nào.</div>`;
    return;
  }

  container.innerHTML = `<div>Đang tải 12 đợt học của các lớp...</div>`;

  let html = '';

  for (const en of enrollments) {
    if (!en.classes) continue;

    const classObj = en.classes;
    const batches = await api.getBatchesByClass(classObj.class_id);
    const isTransferred = en.status === 'TRANSFERRED';

    html += `
      <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <strong style="font-size: 16px; color: var(--text-main);">${classObj.class_name}</strong>
            ${isTransferred ? '<span class="badge badge-overdue" style="margin-left: 8px;">Nợ Bảo Lưu Lớp Cũ</span>' : '<span class="badge badge-active" style="margin-left: 8px;">Đang Học</span>'}
          </div>
          <span style="font-size: 13px; color: var(--text-muted);">Đợt học từ <strong>Đợt ${en.start_batch_number || 1}</strong> đến <strong>Đợt ${en.end_batch_number || 12}</strong></span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;">
          ${batches.map(b => {
            const isIncluded = b.batch_number >= (en.start_batch_number || 1) && b.batch_number <= (en.end_batch_number || 12);
            if (!isIncluded && !isTransferred) return ''; // Skip batches outside enrollment range

            const key = `${classObj.class_id}|${b.batch_id}`;
            const isChecked = selectedPaymentItemsState.has(key);

            return `
              <div class="pos-batch-box ${isChecked ? 'selected' : ''}" style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px; text-align: center; cursor: pointer; transition: var(--transition-fast); background: ${isChecked ? '#f0fdf4' : '#f8fafc'};"
                   onclick="window.togglePOSBatch('${classObj.class_id}', '${b.batch_id}', '${classObj.class_name}', '${b.batch_name}', ${b.fee_rate})">
                <div style="font-size: 12px; font-weight: 700; color: var(--text-muted);">${b.batch_name}</div>
                <div style="font-size: 13px; font-weight: 800; color: var(--teal-600); margin: 4px 0;">${formatCurrency(b.fee_rate)}</div>
                <span class="badge ${b.status === 'DANG_HOC' ? 'badge-current' : 'badge-upcoming'}" style="font-size: 10px;">${b.status === 'DANG_HOC' ? 'Đợt Hiện Tại' : b.status}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

window.togglePOSBatch = function(classId, batchId, className, batchName, defaultFee) {
  const key = `${classId}|${batchId}`;

  if (selectedPaymentItemsState.has(key)) {
    selectedPaymentItemsState.delete(key);
  } else {
    selectedPaymentItemsState.set(key, {
      classId,
      batchId,
      className,
      batchName,
      amount: defaultFee
    });
  }

  renderStudentPOSBatches();
  updateReceiptSummary();
};

function updateReceiptSummary() {
  const container = document.getElementById('pos-receipt-selected-items');
  const totalEl = document.getElementById('pos-total-amount');
  const btn = document.getElementById('btn-confirm-payment');

  if (selectedPaymentItemsState.size === 0) {
    container.innerHTML = `<div style="color: var(--text-light); italic;">Chưa chọn đợt học nào</div>`;
    totalEl.innerText = '0 VNĐ';
    btn.disabled = true;
    return;
  }

  let total = 0;
  let itemsHtml = '';

  selectedPaymentItemsState.forEach((item, key) => {
    total += Number(item.amount);
    itemsHtml += `
      <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 6px 10px; border-radius: var(--radius-sm);">
        <span>• <strong>${item.className}</strong> (${item.batchName})</span>
        <strong style="color: var(--teal-600);">${formatCurrency(item.amount)}</strong>
      </div>
    `;
  });

  container.innerHTML = itemsHtml;
  totalEl.innerText = formatCurrency(total);
  btn.disabled = false;

  btn.onclick = executePOSPayment;
}

async function executePOSPayment() {
  if (!selectedStudentState) return;

  const receiptType = document.getElementById('pos-receipt-type').value;
  const manualCode = document.getElementById('pos-manual-code').value.trim();

  if (receiptType === 'NHAP_TAY' && !manualCode) {
    alert('Vui lòng nhập mã biên lai tay!');
    return;
  }

  const { student } = selectedStudentState;
  const receiptCode = receiptType === 'IN_MAY' ? `BL${Date.now().toString().slice(-6)}` : manualCode;

  const itemsArray = [];
  selectedPaymentItemsState.forEach((item) => {
    itemsArray.push({
      class_id: item.classId,
      batch_id: item.batchId,
      amount_paid: item.amount,
      item_note: `Đóng tiền ${item.className} - ${item.batchName}`
    });
  });

  try {
    const { receipt } = await api.createReceiptWithItems(
      {
        receipt_code: receiptCode,
        receipt_type: receiptType,
        manual_receipt_code: manualCode || null,
        student_id: student.student_id,
        total_amount: Array.from(selectedPaymentItemsState.values()).reduce((s, i) => s + i.amount, 0)
      },
      itemsArray
    );

    showToast('Xác nhận thu tiền & lập biên lai thành công!');

    // Show Printable Receipt Modal
    showPrintableReceiptModal(receipt, student, Array.from(selectedPaymentItemsState.values()));

    window.clearPOSStudent();
    loadDebtReport();
  } catch (err) {
    console.error('Error executing POS payment:', err);
    showToast('Lỗi thu tiền biên lai: ' + err.message, 'error');
  }
}

function showPrintableReceiptModal(receipt, student, items) {
  const title = `🖨️ Phiếu Thu Học Phí (${receipt.receipt_code})`;

  const bodyHtml = `
    <div id="printable-receipt-area" style="font-family: sans-serif; padding: 20px; border: 2px dashed var(--border-color); border-radius: var(--radius-md); background: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="font-size: 20px; font-weight: 800; color: #047857;">TRUNG TÂM NGOẠI NGỮ GROW</h2>
        <div style="font-size: 12px; color: var(--text-muted);">Địa chỉ: Trung Tâm Ngoại Ngữ Grow - Hotline: 0987.654.321</div>
        <h3 style="font-size: 18px; font-weight: 800; margin-top: 10px; color: #0f172a;">BIÊN LAI THU HỌC PHÍ</h3>
        <div style="font-size: 13px; font-weight: 700; color: var(--teal-600);">Mã biên lai: ${receipt.receipt_code}</div>
      </div>

      <div style="font-size: 14px; display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;">
        <div>Họ và tên học sinh: <strong>${student.full_name}</strong> (Mã HS: ${student.student_code})</div>
        <div>Khối lớp: <strong>Khối ${student.grade}</strong> | SĐT: <strong>${student.phone || 'Chưa có SĐT'}</strong></div>
        <div>Ngày lập phiếu: <strong>${formatDateTime(receipt.receipt_date)}</strong></div>
        <div>Hình thức thu: <strong>${receipt.receipt_type === 'IN_MAY' ? 'In Máy Tự Động' : `Nhập Tay (${receipt.manual_receipt_code})`}</strong></div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Tên Lớp Học</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Đợt Đóng</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Số Tiền (VNĐ)</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(i => `
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">${i.className}</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">${i.batchName}</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: 700; color: #047857;">${formatCurrency(i.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="text-align: right; font-size: 16px; font-weight: 800; color: #047857; margin-bottom: 24px;">
        TỔNG CỘNG THU: ${formatCurrency(receipt.total_amount)}
      </div>

      <div style="display: flex; justify-content: space-between; text-align: center; font-size: 13px; margin-top: 30px;">
        <div>
          <strong>Người Nộp Tiền</strong><br>
          <span style="font-size: 11px; color: var(--text-muted);">(Ký & ghi rõ họ tên)</span>
        </div>
        <div>
          <strong>Thu Ngân Lập Phiếu</strong><br>
          <span style="font-size: 11px; color: var(--text-muted);">(Ký & ghi rõ họ tên)</span>
        </div>
      </div>
    </div>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="window.closeModal()">Đóng</button>
    <button class="btn btn-primary" onclick="window.printPOSReceipt()">🖨️ In Phiếu Thu (Print)</button>
  `;

  openModal(title, bodyHtml, footerHtml);

  window.printPOSReceipt = function() {
    const printContent = document.getElementById('printable-receipt-area').innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>In Phiếu Thu ${receipt.receipt_code}</title>
          <style>body { font-family: sans-serif; padding: 20px; }</style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };
}

async function loadDebtReport() {
  const search = document.getElementById('debt-search-input').value.trim().toLowerCase();
  const tbody = document.getElementById('debt-report-tbody');

  try {
    let debtSummary = await api.getDebtSummary();
    let unpaidList = (debtSummary || []).filter(d => Number(d.remaining_debt) > 0);

    if (search) {
      unpaidList = unpaidList.filter(d => 
        d.student_name.toLowerCase().includes(search) ||
        d.student_code.toLowerCase().includes(search) ||
        (d.student_phone && d.student_phone.includes(search))
      );
    }

    if (unpaidList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--primary-600); font-weight: 600; padding: 24px;">🎉 Không có công nợ! Mọi học sinh đã hoàn thành học phí.</td></tr>`;
      return;
    }

    tbody.innerHTML = unpaidList.map(d => `
      <tr>
        <td><strong style="color: var(--teal-600);">${d.student_code}</strong></td>
        <td><strong>${d.student_name}</strong></td>
        <td>${d.student_phone ? `📞 ${d.student_phone}` : '-'}</td>
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
  } catch (err) {
    console.error('Error loading debt report:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--status-overdue-color); padding: 24px;">Lỗi tải báo cáo nợ phí.</td></tr>`;
  }
}

window.openPOSForStudent = function(studentId) {
  window.location.hash = '#/pos';
  setTimeout(() => selectStudentForPOS(studentId), 150);
};
