// EduManager V2 - Module Thu Tiền POS & Tra Cứu Công Nợ Theo Lớp (Phân Nhóm, Cảnh Báo & Cho Phép Chỉnh Sửa Số Tiền Thực Thu)

let posSelectedStudent = null;
let posSelectedBatchIds = new Set();
let posBatchesMap = new Map();
let posStudentClassesPaidCountsMap = new Map(); // Tracks how many batches paid per class for the selected student

async function initPosModule() {
  const searchInput = document.getElementById('pos-student-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handlePosStudentSearch);
  }

  // Clear Selected Student
  const btnClear = document.getElementById('btn-clear-pos-student');
  if (btnClear) {
    btnClear.addEventListener('click', clearPosSelectedStudent);
  }

  // Receipt type change
  const selectType = document.getElementById('pos-receipt-type');
  if (selectType) {
    selectType.addEventListener('change', (e) => {
      const codeGroup = document.getElementById('pos-manual-code-group');
      if (e.target.value === 'NHAP_TAY') {
        codeGroup.style.display = 'block';
      } else {
        codeGroup.style.display = 'none';
      }
    });
  }

  // Submit Receipt
  const btnSubmit = document.getElementById('btn-submit-pos-receipt');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', handleSubmitPosReceipt);
  }

  // Sub-tabs switching
  const posTabsContainer = document.getElementById('pos-main-tabs');
  if (posTabsContainer) {
    posTabsContainer.addEventListener('click', (e) => {
      const tabItem = e.target.closest('.tab-item');
      if (!tabItem) return;

      const targetId = tabItem.getAttribute('data-target');
      posTabsContainer.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      tabItem.classList.add('active');

      document.querySelectorAll('#view-pos > .tab-content').forEach(c => c.classList.remove('active'));
      const activeContent = document.getElementById(targetId);
      if (activeContent) activeContent.classList.add('active');

      if (targetId === 'tab-pos-debt-report') {
        loadDebtReportModule();
      }
    });
  }

  // Initialize Debt Report Select Listeners
  const classSelect = document.getElementById('debt-report-class-select');
  const batchSelect = document.getElementById('debt-report-batch-select');
  const statusSelect = document.getElementById('debt-report-status-select');

  if (classSelect) classSelect.addEventListener('change', renderDebtReportTable);
  if (batchSelect) batchSelect.addEventListener('change', renderDebtReportTable);
  if (statusSelect) statusSelect.addEventListener('change', renderDebtReportTable);
}

async function loadDebtReportModule() {
  try {
    const classes = await ApiService.getClasses();
    const classSelect = document.getElementById('debt-report-class-select');
    if (classSelect) {
      const currentVal = classSelect.value;
      classSelect.innerHTML = `<option value="">-- Tất Cả Lớp Học --</option>` +
        classes.map(c => `<option value="${c.class_id}">${c.class_name} (${c.subject_name || ''})</option>`).join('');
      classSelect.value = currentVal;
    }
    await renderDebtReportTable();
  } catch (err) {
    console.error('Error loading debt report module:', err);
  }
}

async function renderDebtReportTable() {
  const classId = document.getElementById('debt-report-class-select')?.value || '';
  const batchNum = document.getElementById('debt-report-batch-select')?.value || '';
  const status = document.getElementById('debt-report-status-select')?.value || '';

  const tbody = document.getElementById('tbl-debt-report-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted);">Đang tải báo cáo công nợ...</td></tr>`;

  try {
    const reportData = await ApiService.getDebtReport(classId, batchNum, status);

    // Update Stats
    const totalCount = reportData.length;
    const unpaidCount = reportData.filter(r => r.payment_status === 'UNPAID' || r.payment_status === 'PARTIAL').length;
    const paidCount = reportData.filter(r => r.payment_status === 'PAID').length;
    let totalRev = 0;
    reportData.forEach(r => totalRev += Number(r.total_paid || 0));

    document.getElementById('debt-stat-total').textContent = totalCount;
    document.getElementById('debt-stat-unpaid').textContent = unpaidCount;
    document.getElementById('debt-stat-paid').textContent = paidCount;
    document.getElementById('debt-stat-revenue').textContent = `${totalRev.toLocaleString('vi-VN')} VNĐ`;

    if (reportData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted);">Không tìm thấy dữ liệu công nợ phù hợp.</td></tr>`;
      return;
    }

    tbody.innerHTML = reportData.map(r => {
      const reqFee = Number(r.required_fee || 0);
      const paid = Number(r.total_paid || 0);
      const remaining = Math.max(0, reqFee - paid);

      let statusBadge = '';
      if (r.payment_status === 'PAID') {
        statusBadge = '<span class="badge badge-active">🟢 Đã đóng đủ</span>';
      } else if (r.payment_status === 'PARTIAL') {
        statusBadge = '<span class="badge badge-transferred">🟡 Đóng thiếu</span>';
      } else {
        statusBadge = '<span class="badge badge-danger">🔴 Chưa đóng</span>';
      }

      return `
        <tr>
          <td><strong>${r.student_code || 'N/A'}</strong></td>
          <td><strong style="color: var(--text-primary);">${r.student_name}</strong></td>
          <td>${r.student_phone || 'N/A'}</td>
          <td>${r.class_name}</td>
          <td><span class="badge" style="background: #f1f5f9; color: #334155;">Đợt ${r.batch_number}</span></td>
          <td><strong>${reqFee.toLocaleString('vi-VN')} đ</strong></td>
          <td style="color: var(--primary); font-weight: 700;">${paid.toLocaleString('vi-VN')} đ</td>
          <td style="color: ${remaining > 0 ? 'var(--danger-red)' : 'var(--text-muted)'}; font-weight: 700;">${remaining.toLocaleString('vi-VN')} đ</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="quickPayStudentForPos('${r.student_id}')">
              <i class="fa-solid fa-cash-register"></i> Thu Tiền POS
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--danger-red);">Lỗi tải báo cáo: ${err.message}</td></tr>`;
  }
}

async function quickPayStudentForPos(studentId) {
  // Switch to POS Payment Tab
  const tabPaymentBtn = document.querySelector('#pos-main-tabs .tab-item[data-target="tab-pos-payment"]');
  if (tabPaymentBtn) tabPaymentBtn.click();

  await selectStudentForPos(studentId);
}

async function handlePosStudentSearch(e) {
  const query = e.target.value.trim();
  const resultsContainer = document.getElementById('pos-student-search-results');

  if (query.length < 2) {
    resultsContainer.style.display = 'none';
    resultsContainer.innerHTML = '';
    return;
  }

  try {
    const students = await ApiService.getStudents(query);
    if (students.length === 0) {
      resultsContainer.style.display = 'block';
      resultsContainer.innerHTML = `<div style="padding: 12px; color: var(--text-muted); font-size: 13px;">Không tìm thấy học sinh nào.</div>`;
      return;
    }

    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = students.map(s => {
      const activeEnrs = (s.enrollments || []).filter(e => e.status === 'ACTIVE');
      const classNames = activeEnrs.map(e => e.classes ? e.classes.class_name : '').filter(n => n).join(', ');
      return `
        <div style="padding: 10px 14px; border-bottom: 1px solid var(--border-color); cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
             onclick="selectStudentForPos('${s.student_id}')">
          <div>
            <strong style="color: var(--primary); font-size: 14px;">${s.full_name} (${s.student_code})</strong>
            <div style="font-size: 12px; color: var(--text-secondary);">Khối ${s.grade || 'N/A'} | Các Lớp: ${classNames || 'Chưa có lớp'}</div>
          </div>
          <span class="badge badge-active">Chọn HS</span>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('POS search error:', err);
  }
}

async function selectStudentForPos(studentId) {
  const resultsContainer = document.getElementById('pos-student-search-results');
  resultsContainer.style.display = 'none';
  document.getElementById('pos-student-search-input').value = '';

  try {
    const data = await ApiService.getStudentDetails(studentId);
    posSelectedStudent = data.student;

    // Show Selected Student Card
    document.getElementById('pos-student-name').textContent = `${posSelectedStudent.full_name} (${posSelectedStudent.student_code})`;
    document.getElementById('pos-student-info').textContent = `Mã HS: ${posSelectedStudent.student_code} | Khối: ${posSelectedStudent.grade || 'N/A'} | SĐT: ${posSelectedStudent.phone || 'Chưa có'}`;
    document.getElementById('pos-selected-student-card').style.display = 'block';

    // Fetch Batches Grouped By Class
    const debtsData = await ApiService.getStudentDebtsAndBatches(studentId);
    const { activeClassesGrouped, oldClassesGrouped } = debtsData;

    posSelectedBatchIds.clear();
    posBatchesMap.clear();
    posStudentClassesPaidCountsMap.clear();

    // Track how many batches paid per class
    (activeClassesGrouped || []).forEach(cls => {
      const paidBatchesCount = cls.batches.filter(b => b.is_paid).length;
      posStudentClassesPaidCountsMap.set(cls.class_id, paidBatchesCount);
    });

    // 1. RENDER TRANSFERRED OLD CLASS DEBTS (RED WARNING BOXES) GROUPED BY OLD CLASS
    const oldDebtsBox = document.getElementById('pos-old-class-debts-container');
    if (oldClassesGrouped && oldClassesGrouped.length > 0) {
      oldDebtsBox.style.display = 'block';
      oldDebtsBox.innerHTML = oldClassesGrouped.map(cls => `
        <div style="margin-bottom: 12px;">
          <div class="old-class-debt-header">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>NỢ LỚP CỦA CHUYỂN LỚP: ${cls.class_name}</span>
          </div>
          <div class="batch-pills-grid">
            ${cls.batches.map(b => {
              posBatchesMap.set(b.id, b);
              return `
                <div class="batch-pill-item unpaid" id="pill-${b.id}" onclick="toggleBatchSelection('${b.id}')">
                  <div class="batch-pill-name" style="color: var(--danger-text);">${b.batch_name}</div>
                  <div class="batch-pill-fee">${Number(b.fee_amount).toLocaleString('vi-VN')} VNĐ</div>
                  <div style="font-size: 10px; color: var(--danger-red); font-weight: 700; margin-top: 4px;">NỢ LỚP CHUYỂN</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('');
    } else {
      oldDebtsBox.style.display = 'none';
      oldDebtsBox.innerHTML = '';
    }

    // 2. RENDER ACTIVE CURRENT CLASSES GROUPED BY CLASS & SUBJECT
    const currentBox = document.getElementById('pos-current-class-debts-container');
    if (activeClassesGrouped && activeClassesGrouped.length > 0) {
      currentBox.style.display = 'block';
      currentBox.style.background = 'transparent';
      currentBox.style.border = 'none';
      currentBox.style.padding = '0';

      currentBox.innerHTML = activeClassesGrouped.map(cls => `
        <div class="card" style="margin-bottom: 16px;">
          <div class="card-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
            <h3 class="card-title" style="color: var(--primary);">
              <i class="fa-solid fa-chalkboard-user"></i> ${cls.class_name}
            </h3>
            <span class="badge badge-active">${cls.batches.filter(b => b.is_paid).length} / ${cls.batches.length} đợt đã đóng</span>
          </div>
          <div class="batch-pills-grid">
            ${cls.batches.map(b => {
              posBatchesMap.set(b.id, b);
              if (b.is_paid) {
                return `
                  <div class="batch-pill-item paid">
                    <div class="batch-pill-name">Đợt ${b.batch_number}</div>
                    <div class="batch-pill-fee">${Number(b.fee_amount).toLocaleString('vi-VN')} VNĐ</div>
                    <span class="badge badge-active" style="margin-top: 4px;">Đã đóng</span>
                  </div>
                `;
              } else {
                return `
                  <div class="batch-pill-item unpaid" id="pill-${b.id}" onclick="toggleBatchSelection('${b.id}')">
                    <div class="batch-pill-name">Đợt ${b.batch_number}</div>
                    <div class="batch-pill-fee">${Number(b.fee_amount).toLocaleString('vi-VN')} VNĐ</div>
                    <span class="badge badge-danger" style="margin-top: 4px;">Chưa đóng</span>
                  </div>
                `;
              }
            }).join('')}
          </div>
        </div>
      `).join('');
    } else {
      currentBox.style.display = 'none';
      currentBox.innerHTML = '';
    }

    updatePosCheckoutSummary();
  } catch (err) {
    alert('Lỗi nạp dữ liệu đợt học sinh: ' + err.message);
  }
}

function clearPosSelectedStudent() {
  posSelectedStudent = null;
  posSelectedBatchIds.clear();
  posBatchesMap.clear();
  posStudentClassesPaidCountsMap.clear();

  document.getElementById('pos-selected-student-card').style.display = 'none';
  document.getElementById('pos-old-class-debts-container').style.display = 'none';
  document.getElementById('pos-current-class-debts-container').style.display = 'none';
  document.getElementById('pos-first-time-warning-box').style.display = 'none';
  updatePosCheckoutSummary();
}

function toggleBatchSelection(batchId) {
  if (posSelectedBatchIds.has(batchId)) {
    posSelectedBatchIds.delete(batchId);
    document.getElementById(`pill-${batchId}`).classList.remove('selected');
  } else {
    posSelectedBatchIds.add(batchId);
    document.getElementById(`pill-${batchId}`).classList.add('selected');
  }
  updatePosCheckoutSummary();
}

function updateCustomBatchFee(batchId, val) {
  const b = posBatchesMap.get(batchId);
  if (b) {
    const numVal = Number(val);
    const actualFee = numVal < 1000 ? numVal * 1000 : numVal;
    b.custom_fee = actualFee;
  }
  calculatePosTotal();
}

function calculatePosTotal() {
  const totalAmountEl = document.getElementById('pos-total-amount');
  let total = 0;
  posSelectedBatchIds.forEach(bId => {
    const b = posBatchesMap.get(bId);
    if (b) {
      const fee = b.custom_fee !== undefined ? b.custom_fee : Number(b.fee_amount || 350000);
      total += fee;
    }
  });
  if (totalAmountEl) {
    totalAmountEl.textContent = `${total.toLocaleString('vi-VN')} VNĐ`;
  }
}

function updatePosCheckoutSummary() {
  const selectedListEl = document.getElementById('pos-selected-batches-list');
  const totalAmountEl = document.getElementById('pos-total-amount');
  const btnSubmit = document.getElementById('btn-submit-pos-receipt');
  const warningBox = document.getElementById('pos-first-time-warning-box');

  if (posSelectedBatchIds.size === 0) {
    selectedListEl.textContent = 'Chưa chọn đợt nào';
    totalAmountEl.textContent = '0 VNĐ';
    btnSubmit.disabled = true;
    if (warningBox) warningBox.style.display = 'none';
    return;
  }

  let isFirstTimePaymentForAnyClass = false;

  const itemsHtml = Array.from(posSelectedBatchIds).map(bId => {
    const b = posBatchesMap.get(bId);
    if (!b) return '';

    // Check if student has paid 0 batches for this class
    const previousPaidCount = posStudentClassesPaidCountsMap.get(b.class_id) || 0;
    if (previousPaidCount === 0) {
      isFirstTimePaymentForAnyClass = true;
    }

    const currentFeeRaw = b.custom_fee !== undefined ? b.custom_fee : Number(b.fee_amount || 350000);
    const displayFeeK = currentFeeRaw >= 1000 ? Math.round(currentFeeRaw / 1000) : currentFeeRaw;

    return `
      <div style="margin-bottom: 12px; background: #ffffff; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
        <div style="font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 6px;">• ${b.name}</div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 12px; color: var(--text-secondary);">Thực thu đợt này:</span>
          <div style="display: flex; align-items: center; gap: 4px;">
            <input type="number" id="pos-item-fee-${b.id}" class="form-control-simple" 
                   value="${displayFeeK}" step="5" min="0" 
                   style="max-width: 90px; font-weight: 700; color: var(--primary); text-align: right; padding: 4px 8px;"
                   oninput="updateCustomBatchFee('${b.id}', this.value)">
            <span style="font-size: 13px; font-weight: 700; color: var(--primary);">.000 VNĐ</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (warningBox) {
    if (isFirstTimePaymentForAnyClass) {
      warningBox.style.display = 'block';
      warningBox.innerHTML = `
        <strong style="display: flex; align-items: center; gap: 6px; font-size: 13px; margin-bottom: 4px;">
          <i class="fa-solid fa-triangle-exclamation"></i> CẢNH BÁO HỌC SINH MỚI / ĐÓNG PHÍ LẦN ĐẦU
        </strong>
        <span>Đây là lần đầu tiên học sinh đóng học phí cho lớp này! Bạn có thể chỉnh sửa trực tiếp số tiền ở ô <strong>"Thực thu đợt này"</strong> nếu học sinh được giảm giá hoặc vào học giữa chừng.</span>
      `;
    } else {
      warningBox.style.display = 'none';
    }
  }

  selectedListEl.innerHTML = itemsHtml;
  calculatePosTotal();
  btnSubmit.disabled = false;
}

async function handleSubmitPosReceipt() {
  if (!posSelectedStudent || posSelectedBatchIds.size === 0) return;

  const receiptType = document.getElementById('pos-receipt-type').value;
  const manualCode = document.getElementById('pos-manual-receipt-code').value.trim();
  const note = document.getElementById('pos-receipt-note').value.trim();

  if (receiptType === 'NHAP_TAY' && !manualCode) {
    alert('Vui lòng nhập Mã số biên lai khi chọn loại Nhập Tay!');
    return;
  }

  const selectedItemsList = Array.from(posSelectedBatchIds).map(bId => {
    const b = posBatchesMap.get(bId);
    const feeToPay = b.custom_fee !== undefined ? b.custom_fee : Number(b ? b.fee_amount : 350000);
    return {
      ...b,
      fee_amount: feeToPay
    };
  });

  let totalAmount = 0;
  selectedItemsList.forEach(b => {
    totalAmount += Number(b.fee_amount);
  });

  try {
    const receipt = await ApiService.createReceipt(
      posSelectedStudent.student_id,
      selectedItemsList,
      receiptType,
      manualCode,
      note,
      totalAmount
    );

    // Open Printable Receipt Modal
    document.getElementById('print-receipt-code').textContent = `Mã BL: ${receipt.receipt_code}`;
    document.getElementById('print-receipt-date').textContent = new Date().toLocaleString('vi-VN');
    document.getElementById('print-student-name').textContent = posSelectedStudent.full_name;
    document.getElementById('print-student-phone').textContent = posSelectedStudent.phone || 'N/A';
    document.getElementById('print-cashier-name').textContent = currentRoleState.name;

    const itemsHtml = selectedItemsList.map(b => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>• ${b ? b.name : 'Học phí đợt'}</span>
        <strong>${Number(b.fee_amount).toLocaleString('vi-VN')} VNĐ</strong>
      </div>
    `).join('');

    document.getElementById('print-receipt-items').innerHTML = itemsHtml;
    document.getElementById('print-receipt-total').textContent = `${totalAmount.toLocaleString('vi-VN')} VNĐ`;

    openModal('modal-receipt-print');

    // Refresh POS selection
    selectStudentForPos(posSelectedStudent.student_id);
  } catch (err) {
    alert('Lỗi tạo biên lai thu tiền: ' + err.message);
  }
}
