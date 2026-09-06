/**
 * EduManager V2 - Core Application Script
 * Software Specification: Web Quản lý Trung tâm Dạy thêm
 */

// ==========================================
// 1. CONFIG & SUPABASE CLIENT INITIALIZATION
// ==========================================
const { createClient } = window.supabase;
const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_SUBJECTS = ["TOÁN", "VĂN", "AV", "Hóa", "Lý"];

// ==========================================
// 2. APPLICATION STATE
// ==========================================
const appState = {
    allStudents: [],
    allClassesList: [],
    classStatusMap: {},
    currentSubjectFilter: 'ALL',
    currentSpecificClassFilter: null,
    currentDetailedClass: null,
    selectedStudentIds: [],
    activeView: 'class-view',
    currentRole: 'CASHIER', // ADMIN | CASHIER | TEACHER
    receiptLineItems: [],
    debtFilterStatus: 'ALL'
};

// ==========================================
// 3. API & DATA SERVICE LAYER
// ==========================================
async function fetchClassStatus() {
    try {
        const res = await fetch('/api/class-status');
        if (res.ok) appState.classStatusMap = await res.json();
    } catch (e) {
        console.warn("Lỗi lấy trạng thái lớp từ Express API:", e);
    }
}

async function updateClassStatus(className, isActive) {
    appState.classStatusMap[className] = isActive;
    const configStr = JSON.stringify(appState.classStatusMap);
    try {
        await fetch('/api/class-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: configStr
        });
    } catch (e) {
        console.warn("Lỗi lưu Express API:", e);
    }
    renderClassGrid();
}

async function fetchAllStudentsFromSupabase() {
    let allData = [];
    let start = 0;
    const limit = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('ds_tong')
            .select('*')
            .range(start, start + limit - 1);

        if (error) {
            console.error("Lỗi tải dữ liệu Supabase:", error);
            return null;
        }

        if (data && data.length > 0) {
            allData = allData.concat(data);
            if (data.length < limit) break;
            start += limit;
        } else {
            break;
        }
    }
    return allData;
}

// ==========================================
// 4. UTILITIES
// ==========================================
function getFullName(student) {
    return `${student['HỌ'] || ''} ${student['TÊN'] || ''}`.trim();
}

function getEnrolledSubjects(student) {
    const subjects = [];
    const lop = student['LỚP'] || '';

    if (student['TOÁN']) subjects.push(`Toán ${lop}${student['TOÁN']}`.trim());
    if (student['VĂN']) subjects.push(`Văn ${lop}${student['VĂN']}`.trim());
    if (student['AV']) subjects.push(`Anh Văn ${lop}${student['AV']}`.trim());
    if (student['Hóa']) subjects.push(`Hóa ${lop}${student['Hóa']}`.trim());
    if (student['Lý']) subjects.push(`Lý ${lop}${student['Lý']}`.trim());

    return subjects;
}

function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

// Check first-time tuition payment history
function checkHasPaymentHistory(studentId, className) {
    // Simulated history check against stored receipts
    const historyKey = `receipt_history_${studentId}_${className}`;
    return localStorage.getItem(historyKey) === 'true';
}

function markPaymentHistory(studentId, className) {
    const historyKey = `receipt_history_${studentId}_${className}`;
    localStorage.setItem(historyKey, 'true');
}

// ==========================================
// 5. CORE APP INITIALIZATION
// ==========================================
async function loadData() {
    const loadingEl = document.getElementById('loading');

    await fetchClassStatus();
    const rawData = await fetchAllStudentsFromSupabase();

    if (rawData) {
        processAndRender(rawData, loadingEl);
    } else if (loadingEl) {
        loadingEl.innerHTML = `<p style="color: #dc3545; font-weight: bold;">Không thể tải dữ liệu. Vui lòng kiểm tra Supabase connection.</p>`;
    }
}

function processAndRender(data, loadingEl) {
    appState.allStudents = data.filter(row => {
        const isTongCong = 
            (typeof row['STT'] === 'string' && row['STT'].toUpperCase().includes('TỔNG CỘNG')) ||
            (typeof row['HỌ'] === 'string' && row['HỌ'].toUpperCase().includes('TỔNG CỘNG')) ||
            (typeof row['TÊN'] === 'string' && row['TÊN'].toUpperCase().includes('TỔNG CỘNG'));

        const isSystemConfig = (row['STT'] === 99999 || row['STT'] === '99999');
        return !isTongCong && !isSystemConfig;
    });

    populateClassFilters();
    populateClassManagement();
    populateStudentSelectForReceipt();
    populateDebtClassDropdown();
    filterData();

    if (loadingEl) loadingEl.style.display = 'none';

    const counterEl = document.getElementById('studentCounter');
    if (counterEl) counterEl.textContent = `📊 Tổng số học sinh trong hệ thống: ${appState.allStudents.length}`;
}

// ==========================================
// 6. UI RENDERERS & CLASS MANAGEMENT
// ==========================================
function populateClassFilters() {
    const classFilter = document.getElementById('classFilter');
    const currentValue = classFilter.value;

    const gradesSet = new Set();
    appState.allStudents.forEach(student => {
        if (student['LỚP']) gradesSet.add(student['LỚP']);
    });

    const sortedGrades = Array.from(gradesSet).sort((a, b) => 
        String(a).localeCompare(String(b), undefined, { numeric: true })
    );

    classFilter.innerHTML = '<option value="">-- Tất cả khối lớp --</option>';
    sortedGrades.forEach(grade => {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = `Khối Lớp ${grade}`;
        classFilter.appendChild(option);
    });

    classFilter.value = currentValue;
}

function populateClassManagement() {
    const classMap = new Map();

    appState.allStudents.forEach(student => {
        const lop = student['LỚP'] || '';
        if (!lop) return;

        TARGET_SUBJECTS.forEach(sub => {
            const subVal = student[sub];
            if (subVal && typeof subVal === 'string' && subVal.trim().length > 0 && subVal.trim().length <= 2) {
                const className = `${lop}${subVal.trim()}`.trim();
                const classFullName = `Lớp ${className} - ${sub}`;

                if (!classMap.has(classFullName)) {
                    classMap.set(classFullName, {
                        id: classFullName,
                        grade: lop,
                        subject: sub,
                        name: classFullName,
                        code: className,
                        students: []
                    });
                }
                classMap.get(classFullName).students.push(student);
            }
        });
    });

    appState.allClassesList = Array.from(classMap.values());
    renderClassGrid();
}

function renderClassGrid() {
    const classGrid = document.getElementById('classGrid');
    if (!classGrid) return;

    classGrid.innerHTML = '';

    const filteredClasses = appState.currentSubjectFilter === 'ALL'
        ? appState.allClassesList
        : appState.allClassesList.filter(c => c.subject.toUpperCase() === appState.currentSubjectFilter.toUpperCase());

    filteredClasses.forEach(cls => {
        const card = document.createElement('div');
        card.className = 'class-card';

        const isActive = appState.classStatusMap[cls.name] !== false;
        if (!isActive) card.classList.add('inactive-card');

        card.innerHTML = `
            <h3>${cls.name}</h3>
            <p>${cls.students.length} Học sinh ghi danh</p>
            <p style="font-size: 0.85rem; margin-top: 5px; font-weight: 600; color: ${isActive ? '#28a745' : '#dc3545'};">
                ${isActive ? '● Đang hoạt động' : '🔒 Ngừng hoạt động'}
            </p>
        `;

        card.addEventListener('click', () => showClassDetail(cls));
        classGrid.appendChild(card);
    });
}

function showClassDetail(cls) {
    appState.currentSpecificClassFilter = cls.id;
    appState.currentDetailedClass = cls;

    document.getElementById('classManagementContainer').classList.add('hidden');
    document.getElementById('classDetailView').classList.remove('hidden');

    const toggleBtn = document.getElementById('btnToggleClassStatus');
    const classDetailTitle = document.getElementById('classDetailTitle');

    function updateHeaderStatusUI() {
        const isActive = appState.classStatusMap[cls.name] !== false;
        classDetailTitle.innerHTML = `${cls.name} <span class="status-badge" style="font-size: 0.85rem; padding: 4px 10px; border-radius: 12px; font-weight: 600; color: white; background-color: ${isActive ? '#28a745' : '#dc3545'}; margin-left: 8px;">${isActive ? '● Đang hoạt động' : '🔒 Đã khóa'}</span>`;

        toggleBtn.textContent = isActive ? "🔒 Khóa Lớp" : "🔓 Mở Khóa Lớp";
        toggleBtn.style.backgroundColor = isActive ? "#dc3545" : "#28a745";
    }

    updateHeaderStatusUI();

    const newToggleBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

    newToggleBtn.addEventListener('click', async () => {
        const currentIsActive = appState.classStatusMap[cls.name] !== false;
        const targetState = !currentIsActive;
        newToggleBtn.disabled = true;
        newToggleBtn.textContent = "⏳ Đang lưu...";

        try {
            await updateClassStatus(cls.name, targetState);
            updateHeaderStatusUI();
            alert(targetState ? `✅ Đã mở khóa lớp "${cls.name}" thành công!` : `🔒 Đã khóa lớp "${cls.name}" thành công!`);
        } finally {
            newToggleBtn.disabled = false;
        }
    });

    // Render detail table
    const tbody = document.getElementById('classDetailTableBody');
    tbody.innerHTML = '';

    cls.students.forEach((student, idx) => {
        const tr = document.createElement('tr');
        const fullName = getFullName(student);
        const subjects = getEnrolledSubjects(student);
        const studentCode = student['STT'] ? `HS${String(student['STT']).padStart(4, '0')}` : `HS${String(idx+1).padStart(4, '0')}`;

        tr.innerHTML = `
            <td class="col-checkbox"><input type="checkbox" class="student-checkbox" data-id="${student.id}"></td>
            <td class="col-stt">${student['STT'] || idx+1}</td>
            <td style="font-weight: 700; color: var(--primary-color);">${studentCode}</td>
            <td style="font-weight: 600;">${fullName}</td>
            <td>Khối ${student['LỚP'] || ''}</td>
            <td>${student['SỐ ĐT'] || ''}</td>
            <td>${subjects.map(s => `<span class="badge">${s}</span>`).join(' ')}</td>
        `;

        tr.addEventListener('click', () => openStudentModal(student));
        tbody.appendChild(tr);
    });
}

document.getElementById('btnBackToClasses').addEventListener('click', () => {
    document.getElementById('classDetailView').classList.add('hidden');
    document.getElementById('classManagementContainer').classList.remove('hidden');
});

// Subject Tab Filters
document.querySelectorAll('#subjectTabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('#subjectTabs .tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        appState.currentSubjectFilter = e.target.dataset.subject;
        renderClassGrid();
    });
});

// ==========================================
// 7. STUDENT TABLE & SEARCH
// ==========================================
function renderStudentTable(data) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #6c757d; padding: 2rem;">Không tìm thấy học sinh nào.</td></tr>';
        return;
    }

    data.forEach((student, idx) => {
        const tr = document.createElement('tr');
        const fullName = getFullName(student);
        const subjects = getEnrolledSubjects(student);
        const studentCode = student['STT'] ? `HS${String(student['STT']).padStart(4, '0')}` : `HS${String(idx+1).padStart(4, '0')}`;

        tr.innerHTML = `
            <td class="col-stt">${student['STT'] || idx+1}</td>
            <td style="font-weight: 700; color: var(--primary-color);">${studentCode}</td>
            <td style="font-weight: 600;">${fullName}</td>
            <td>Khối ${student['LỚP'] || ''}</td>
            <td>${student['SỐ ĐT'] || ''}</td>
            <td>${subjects.map(s => `<span class="badge">${s}</span>`).join(' ')}</td>
        `;

        tr.addEventListener('click', () => openStudentModal(student));
        tbody.appendChild(tr);
    });
}

function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const classVal = document.getElementById('classFilter').value;

    const filtered = appState.allStudents.filter(student => {
        const fullName = getFullName(student).toLowerCase();
        const phone = student['SỐ ĐT'] ? student['SỐ ĐT'].toString() : '';
        const stt = student['STT'] ? `hs${String(student['STT']).padStart(4, '0')}` : '';

        const matchesSearch = !searchTerm || fullName.includes(searchTerm) || phone.includes(searchTerm) || stt.includes(searchTerm);
        const matchesClass = !classVal || student['LỚP'] == classVal;

        return matchesSearch && matchesClass;
    });

    renderStudentTable(filtered);
}

document.getElementById('searchInput').addEventListener('input', filterData);
document.getElementById('classFilter').addEventListener('change', filterData);

// ==========================================
// 8. RECEIPT CREATION WORKSPACE & FIRST-TIME ALERT
// ==========================================
function populateStudentSelectForReceipt() {
    const select = document.getElementById('receiptStudentSelect');
    select.innerHTML = '<option value="">-- Chọn học sinh đóng học phí --</option>';

    appState.allStudents.forEach(student => {
        const fullName = getFullName(student);
        const code = student['STT'] ? `HS${String(student['STT']).padStart(4, '0')}` : '';
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${code} - ${fullName} (SĐT: ${student['SỐ ĐT'] || 'N/A'}) - Lớp ${student['LỚP'] || ''}`;
        select.appendChild(option);
    });
}

const receiptTypeSelect = document.getElementById('receiptTypeSelect');
receiptTypeSelect.addEventListener('change', () => {
    const manualGroup = document.getElementById('manualCodeGroup');
    if (receiptTypeSelect.value === 'NHAP_TAY') {
        manualGroup.classList.remove('hidden');
        document.getElementById('manualReceiptCode').required = true;
    } else {
        manualGroup.classList.add('hidden');
        document.getElementById('manualReceiptCode').required = false;
    }
});

// Add Receipt Line Item
document.getElementById('btnAddReceiptLine').addEventListener('click', () => {
    const tbody = document.getElementById('receiptItemsTableBody');
    const studentId = document.getElementById('receiptStudentSelect').value;

    if (!studentId) {
        alert("Vui lòng chọn Học Sinh trước khi thêm dòng đóng tiền!");
        return;
    }

    const tr = document.createElement('tr');

    let classOptions = '<option value="">-- Chọn lớp học --</option>';
    appState.allClassesList.forEach(cls => {
        classOptions += `<option value="${cls.name}">${cls.name}</option>`;
    });

    tr.innerHTML = `
        <td>
            <select class="item-class-select" required>
                ${classOptions}
            </select>
        </td>
        <td>
            <select class="item-batch-select" required>
                <option value="Đợt 1 (Tháng 9/2026)">Đợt 1 (Tháng 9/2026)</option>
                <option value="Đợt 2 (Tháng 10/2026)">Đợt 2 (Tháng 10/2026)</option>
                <option value="Hè 2026">Hè 2026</option>
            </select>
        </td>
        <td>
            <input type="number" class="item-amount-input" value="800000" min="0" step="50000" required style="width: 130px;">
        </td>
        <td>
            <input type="text" class="item-note-input" placeholder="Ghi chú dòng...">
        </td>
        <td style="text-align: center;">
            <button type="button" class="btn-delete-line" style="color: red; border: none; background: transparent; cursor: pointer; font-size: 1.2rem;">&times;</button>
        </td>
    `;

    // First-Time Payment Warning Alert Logic
    const classSelect = tr.querySelector('.item-class-select');
    classSelect.addEventListener('change', () => {
        const className = classSelect.value;
        if (className && !checkHasPaymentHistory(studentId, className)) {
            // Display Warning Modal
            document.getElementById('firstTimeAlertMessage').innerHTML = `
                ⚠️ <strong>Phát hiện Học Sinh Đóng Phí Lần Đầu!</strong><br><br>
                Học sinh <strong>${getFullName(appState.allStudents.find(s=>s.id===studentId))}</strong> chưa từng có lịch sử đóng học phí cho <strong>${className}</strong>.<br>
                Vui lòng kiểm tra và sửa lại số tiền đợt đầu cho phù hợp (nếu học sinh vào học giữa chừng)!
            `;
            document.getElementById('firstTimeAlertModal').style.display = 'block';
        }
    });

    tr.querySelector('.btn-delete-line').addEventListener('click', () => {
        tr.remove();
        calculateReceiptTotal();
    });

    tr.querySelector('.item-amount-input').addEventListener('input', calculateReceiptTotal);

    tbody.appendChild(tr);
    calculateReceiptTotal();
});

function calculateReceiptTotal() {
    let total = 0;
    document.querySelectorAll('.item-amount-input').forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    document.getElementById('receiptTotalDisplay').textContent = formatVND(total);
}

// Receipt Form Submit
document.getElementById('receiptForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const studentId = document.getElementById('receiptStudentSelect').value;
    const type = document.getElementById('receiptTypeSelect').value;
    const manualCode = document.getElementById('manualReceiptCode').value;

    const items = [];
    document.querySelectorAll('#receiptItemsTableBody tr').forEach(tr => {
        const className = tr.querySelector('.item-class-select').value;
        const batchName = tr.querySelector('.item-batch-select').value;
        const amount = parseFloat(tr.querySelector('.item-amount-input').value) || 0;
        const note = tr.querySelector('.item-note-input').value;

        if (className) {
            items.push({ className, batchName, amount, note });
            markPaymentHistory(studentId, className);
        }
    });

    if (items.length === 0) {
        alert("Vui lòng thêm ít nhất 1 dòng đóng tiền!");
        return;
    }

    const receiptCode = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    alert(`🎉 ĐÃ LẬP BIÊN LAI THÀNH CÔNG!\n\n• Mã Biên Lai: ${receiptCode}\n• Loại: ${type}\n${manualCode ? '• Mã Biên Lai Tay: ' + manualCode + '\n' : ''}• Số mục đóng: ${items.length}\n• Tổng Tiền: ${document.getElementById('receiptTotalDisplay').textContent}`);

    // Reset form
    document.getElementById('receiptItemsTableBody').innerHTML = '';
    calculateReceiptTotal();
});

// Close Warning Modal
document.getElementById('closeFirstTimeAlertModal').addEventListener('click', () => {
    document.getElementById('firstTimeAlertModal').style.display = 'none';
});
document.getElementById('btnConfirmFirstTimeAlert').addEventListener('click', () => {
    document.getElementById('firstTimeAlertModal').style.display = 'none';
});

// ==========================================
// 9. DEBT REPORTING WORKSPACE
// ==========================================
function populateDebtClassDropdown() {
    const select = document.getElementById('debtClassSelect');
    select.innerHTML = '<option value="">-- Tất cả các lớp --</option>';

    appState.allClassesList.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.name;
        option.textContent = cls.name;
        select.appendChild(option);
    });
}

function renderDebtTable() {
    const tbody = document.getElementById('debtTableBody');
    tbody.innerHTML = '';

    const selectedClass = document.getElementById('debtClassSelect').value;
    const selectedBatch = document.getElementById('debtBatchSelect').value;

    let targetClasses = selectedClass 
        ? appState.allClassesList.filter(c => c.name === selectedClass)
        : appState.allClassesList;

    let rowsHtml = '';
    let sttCounter = 1;

    targetClasses.forEach(cls => {
        cls.students.forEach(student => {
            const fullName = getFullName(student);
            const studentCode = student['STT'] ? `HS${String(student['STT']).padStart(4, '0')}` : 'HS0001';

            // Random status simulation for demonstration
            const historyKey = `receipt_history_${student.id}_${cls.name}`;
            const hasPaid = localStorage.getItem(historyKey) === 'true';

            let status = 'UNPAID';
            let paidAmount = 0;
            const requiredFee = 800000;

            if (hasPaid) {
                status = 'PAID';
                paidAmount = 800000;
            } else if (parseInt(student['STT']) % 3 === 0) {
                status = 'PARTIAL';
                paidAmount = 400000;
            }

            if (appState.debtFilterStatus !== 'ALL' && status !== appState.debtFilterStatus) {
                return;
            }

            let statusBadge = '';
            if (status === 'PAID') statusBadge = '<span class="status-badge-pill status-paid">🟢 Đã đóng đủ</span>';
            else if (status === 'PARTIAL') statusBadge = '<span class="status-badge-pill status-partial">🟡 Đóng thiếu</span>';
            else statusBadge = '<span class="status-badge-pill status-unpaid">🔴 Chưa đóng</span>';

            rowsHtml += `
                <tr>
                    <td class="col-stt">${sttCounter++}</td>
                    <td style="font-weight: 700; color: var(--primary-color);">${studentCode}</td>
                    <td style="font-weight: 600;">${fullName}</td>
                    <td>${cls.name}</td>
                    <td>${selectedBatch}</td>
                    <td style="font-weight: 600;">${formatVND(requiredFee)}</td>
                    <td style="font-weight: 600; color: ${status==='PAID'?'#065f46':status==='PARTIAL'?'#92400e':'#991b1b'};">${formatVND(paidAmount)}</td>
                    <td>${statusBadge}</td>
                    <td>
                        ${status !== 'PAID' ? `<button class="btn-secondary-action" onclick="alert('Đã gửi thông báo nhắc phí đến SĐT: ${student['SỐ ĐT'] || 'N/A'}')">📩 Nhắc Phí</button>` : '✅ Đã hoàn tất'}
                    </td>
                </tr>
            `;
        });
    });

    tbody.innerHTML = rowsHtml || '<tr><td colspan="9" style="text-align: center; color: #6c757d; padding: 2rem;">Không tìm thấy dữ liệu công nợ phù hợp.</td></tr>';
}

document.getElementById('debtClassSelect').addEventListener('change', renderDebtTable);
document.getElementById('debtBatchSelect').addEventListener('change', renderDebtTable);

document.querySelectorAll('.filter-badge-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-badge-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        appState.debtFilterStatus = e.target.dataset.status;
        renderDebtTable();
    });
});

// ==========================================
// 10. ROLE-BASED ACCESS CONTROL (RBAC)
// ==========================================
document.getElementById('roleSelector').addEventListener('change', (e) => {
    appState.currentRole = e.target.value;
    applyRolePermissions();
});

function applyRolePermissions() {
    const role = appState.currentRole;

    if (role === 'TEACHER') {
        document.getElementById('navReceipt').classList.add('hidden');
        document.getElementById('navDebt').classList.add('hidden');
        document.getElementById('btnAddStudent').classList.add('hidden');
        document.getElementById('exportBtn').classList.add('hidden');
        document.getElementById('btnCreateReceiptHeader').classList.add('hidden');
    } else if (role === 'CASHIER') {
        document.getElementById('navReceipt').classList.remove('hidden');
        document.getElementById('navDebt').classList.remove('hidden');
        document.getElementById('btnAddStudent').classList.remove('hidden');
        document.getElementById('exportBtn').classList.remove('hidden');
        document.getElementById('btnCreateReceiptHeader').classList.remove('hidden');
    } else { // ADMIN
        document.getElementById('navReceipt').classList.remove('hidden');
        document.getElementById('navDebt').classList.remove('hidden');
        document.getElementById('btnAddStudent').classList.remove('hidden');
        document.getElementById('exportBtn').classList.remove('hidden');
        document.getElementById('btnCreateReceiptHeader').classList.remove('hidden');
    }
}

// Nav Header Action button
document.getElementById('btnCreateReceiptHeader').addEventListener('click', () => {
    switchView('receipt-view');
});

// View Switching
function switchView(viewId) {
    appState.activeView = viewId;

    document.querySelectorAll('.view-section').forEach(section => section.classList.add('hidden'));
    const targetSection = document.getElementById(viewId);
    if (targetSection) targetSection.classList.remove('hidden');

    document.querySelectorAll('.side-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewId) {
            item.classList.add('active');
            document.getElementById('pageTitle').textContent = item.textContent.replace('🏫', '').replace('🎓', '').replace('🧾', '').replace('📊', '').trim();
        }
    });

    if (viewId === 'debt-view') renderDebtTable();
}

document.querySelectorAll('.side-nav .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(e.currentTarget.dataset.view);
    });
});

// Student Modal
const studentModal = document.getElementById('studentModal');
function openStudentModal(student) {
    document.getElementById('modalStudentId').value = student.id;
    document.getElementById('modalHo').value = student['HỌ'] || '';
    document.getElementById('modalTen').value = student['TÊN'] || '';
    document.getElementById('modalLop').value = student['LỚP'] || '';
    document.getElementById('modalSdt').value = student['SỐ ĐT'] || '';
    document.getElementById('modalToan').value = student['TOÁN'] || '';
    document.getElementById('modalVan').value = student['VĂN'] || '';
    document.getElementById('modalAv').value = student['AV'] || '';
    document.getElementById('modalHoa').value = student['Hóa'] || '';
    document.getElementById('modalLy').value = student['Lý'] || '';

    document.getElementById('modalTitle').textContent = 'Chi Tiết Hồ Sơ Học Sinh';
    studentModal.style.display = 'block';
}

document.getElementById('btnAddStudent').addEventListener('click', () => {
    document.getElementById('modalStudentId').value = '';
    document.getElementById('modalHo').value = '';
    document.getElementById('modalTen').value = '';
    document.getElementById('modalLop').value = '';
    document.getElementById('modalSdt').value = '';
    document.getElementById('modalToan').value = '';
    document.getElementById('modalVan').value = '';
    document.getElementById('modalAv').value = '';
    document.getElementById('modalHoa').value = '';
    document.getElementById('modalLy').value = '';

    document.getElementById('modalTitle').textContent = 'Thêm Hồ Sơ Học Sinh Mới';
    studentModal.style.display = 'block';
});

document.getElementById('closeModal').addEventListener('click', () => studentModal.style.display = 'none');
document.getElementById('cancelModal').addEventListener('click', () => studentModal.style.display = 'none');

// Export Excel API
document.getElementById('exportBtn').addEventListener('click', async () => {
    const btn = document.getElementById('exportBtn');
    const originalText = btn.textContent;
    btn.textContent = "⌛ Đang trích xuất...";
    btn.disabled = true;

    try {
        const response = await fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appState.allStudents)
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'DanhSachCacLop.zip';
            a.click();
            alert('✅ Đã trích xuất và tải file Excel (ZIP) thành công!');
        }
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    loadData();
    applyRolePermissions();
});
