// EduManager V2 - Module Thu Tiền POS (Phân nhóm rõ ràng theo từng Lớp/Môn Học)

let posSelectedStudent = null;
let posSelectedBatchIds = new Set();
let posBatchesMap = new Map();

function initPosModule() {
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
                  <div style="font-size: 10px; color: var(--danger-red); font-weight: 700; margin-top: 4px;">NỢ LỚP CỦA CHUYỂN LỚP</div>
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

  document.getElementById('pos-selected-student-card').style.display = 'none';
  document.getElementById('pos-old-class-debts-container').style.display = 'none';
  document.getElementById('pos-current-class-debts-container').style.display = 'none';
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

function updatePosCheckoutSummary() {
  const selectedListEl = document.getElementById('pos-selected-batches-list');
  const totalAmountEl = document.getElementById('pos-total-amount');
  const btnSubmit = document.getElementById('btn-submit-pos-receipt');

  if (posSelectedBatchIds.size === 0) {
    selectedListEl.textContent = 'Chưa chọn đợt nào';
    totalAmountEl.textContent = '0 VNĐ';
    btnSubmit.disabled = true;
    return;
  }

  let total = 0;
  const names = [];
  posSelectedBatchIds.forEach(bId => {
    const b = posBatchesMap.get(bId);
    if (b) {
      total += Number(b.fee_amount || 350000);
      names.push(b.name);
    }
  });

  selectedListEl.innerHTML = names.map(n => `<div style="margin-bottom: 4px;">• <strong>${n}</strong></div>`).join('');
  totalAmountEl.textContent = `${total.toLocaleString('vi-VN')} VNĐ`;
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

  const selectedItemsList = Array.from(posSelectedBatchIds).map(bId => posBatchesMap.get(bId));
  let totalAmount = 0;
  selectedItemsList.forEach(b => {
    totalAmount += Number(b ? b.fee_amount : 350000);
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
        <strong>${Number(b ? b.fee_amount : 350000).toLocaleString('vi-VN')} VNĐ</strong>
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
