/**
 * EduManager - Hệ thống Quản lý Học sinh & Lớp học
 * Frontend Application Core Script (Refactored)
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
// 2. CENTRALIZED APPLICATION STATE
// ==========================================
const appState = {
    allStudents: [],
    allClassesList: [],
    classStatusMap: {},
    currentSubjectFilter: 'ALL',
    currentSpecificClassFilter: null,
    currentDetailedClass: null,
    selectedStudentIds: [],
    activeView: 'class-view'
};

// ==========================================
// 3. API & DATA SERVICE LAYER
// ==========================================
async function fetchClassStatus() {
    try {
        const res = await fetch('/api/class-status');
        if (res.ok) {
            appState.classStatusMap = await res.json();
        }
    } catch (e) {
        console.error("Lỗi lấy trạng thái lớp từ server:", e);
    }
}

async function updateClassStatus(className, isActive) {
    appState.classStatusMap[className] = isActive;
    try {
        await fetch('/api/class-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appState.classStatusMap)
        });
        renderClassGrid();
    } catch (e) {
        console.error("Lỗi cập nhật trạng thái lớp:", e);
    }
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
// 4. UTILITY FUNCTIONS
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

function sortStudentsBySTT(students) {
    return [...students].sort((a, b) => {
        const sttA = parseInt(a['STT'], 10);
        const sttB = parseInt(b['STT'], 10);
        const valA = isNaN(sttA) ? Number.MAX_SAFE_INTEGER : sttA;
        const valB = isNaN(sttB) ? Number.MAX_SAFE_INTEGER : sttB;
        return valA - valB;
    });
}

// ==========================================
// 5. CORE DATA PIPELINE & REALTIME LISTENER
// ==========================================
async function loadData() {
    const loadingEl = document.getElementById('loading');
    const tableContainer = document.getElementById('tableContainer');

    await fetchClassStatus();
    const rawData = await fetchAllStudentsFromSupabase();

    if (rawData) {
        processAndRender(rawData, loadingEl, tableContainer);
    } else if (loadingEl) {
        loadingEl.innerHTML = `<p style="color: #dc3545; font-weight: bold;">Không thể tải dữ liệu từ Supabase. Vui lòng kiểm tra kết nối mạng.</p>`;
    }
}

function initRealtimeSubscription() {
    supabase
        .channel('public:ds_tong')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ds_tong' }, async () => {
            console.log("[REALTIME] Phát hiện thay đổi dữ liệu từ Supabase. Đang làm mới...");
            const freshData = await fetchAllStudentsFromSupabase();
            if (freshData) {
                const loadingEl = document.getElementById('loading');
                const tableContainer = document.getElementById('tableContainer');
                processAndRender(freshData, loadingEl, tableContainer);
            }
        })
        .subscribe();
}

function processAndRender(data, loadingEl, tableContainer) {
    // 1. Filter out system rows & header totals
    appState.allStudents = data.filter(row => {
        const isTongCong = 
            (typeof row['STT'] === 'string' && row['STT'].toUpperCase().includes('TỔNG CỘNG')) ||
            (typeof row['HỌ'] === 'string' && row['HỌ'].toUpperCase().includes('TỔNG CỘNG')) ||
            (typeof row['TÊN'] === 'string' && row['TÊN'].toUpperCase().includes('TỔNG CỘNG'));

        const isSystemConfig = (row['STT'] === 99999 || row['STT'] === '99999');

        return !isTongCong && !isSystemConfig;
    });

    // 2. Sort students by STT
    appState.allStudents = sortStudentsBySTT(appState.allStudents);

    // 3. Re-populate dropdowns & class management lists
    populateClassFilters();
    populateClassManagement();
    filterData();

    // 4. Update view states gracefully
    if (appState.activeView === 'class-view') {
        const detailView = document.getElementById('classDetailView');
        if (!detailView.classList.contains('hidden') && appState.currentSpecificClassFilter) {
            const updatedClass = appState.allClassesList.find(c => c.id === appState.currentSpecificClassFilter);
            if (updatedClass) {
                showClassDetail(updatedClass);
            } else {
                document.getElementById('btnBackToClasses').click();
            }
        } else {
            document.getElementById('classManagementContainer').classList.remove('hidden');
            document.getElementById('tableContainer').classList.add('hidden');
        }
    } else if (appState.activeView === 'student-view') {
        document.getElementById('classManagementContainer').classList.add('hidden');
        document.getElementById('classDetailView').classList.add('hidden');
        document.getElementById('tableContainer').classList.remove('hidden');
    }

    if (loadingEl) loadingEl.style.display = 'none';

    // 5. Render student counter
    const counterEl = document.getElementById('studentCounter');
    if (counterEl) {
        counterEl.textContent = `📊 Tổng số học sinh trong hệ thống: ${appState.allStudents.length}`;
    }
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
                const classFullName = `${className} ${sub}`;

                if (!classMap.has(classFullName)) {
                    classMap.set(classFullName, {
                        id: classFullName,
                        grade: lop,
                        subject: sub,
                        name: classFullName,
                        students: []
                    });
                }
                classMap.get(classFullName).students.push(student);
            }
        });
    });

    appState.allClassesList = Array.from(classMap.values());

    // Sort classes by Grade -> Subject -> Class Name
    appState.allClassesList.sort((a, b) => {
        const gradeA = parseInt(a.grade, 10) || 0;
        const gradeB = parseInt(b.grade, 10) || 0;
        if (gradeA !== gradeB) return gradeA - gradeB;
        if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
        return a.name.localeCompare(b.name);
    });

    renderClassGrid();
}

function renderClassGrid() {
    const classGrid = document.getElementById('classGrid');
    if (!classGrid) return;

    classGrid.innerHTML = '';

    const filteredClasses = appState.currentSubjectFilter === 'ALL'
        ? appState.allClassesList
        : appState.allClassesList.filter(c => c.subject.toUpperCase() === appState.currentSubjectFilter.toUpperCase());

    if (filteredClasses.length === 0) {
        classGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #6c757d;">Không tìm thấy lớp học nào thuộc môn này.</div>`;
        return;
    }

    filteredClasses.forEach(cls => {
        const card = document.createElement('div');
        card.className = 'class-card';
        if (appState.currentSpecificClassFilter === cls.id) {
            card.classList.add('active-card');
        }

        const isActive = appState.classStatusMap[cls.name] !== false;
        if (!isActive) {
            card.classList.add('inactive-card');
        }

        card.innerHTML = `
            <h3>${cls.name}</h3>
            <p>${cls.students.length} Học sinh</p>
            <p style="font-size: 0.8rem; margin-top: 5px; font-weight: 600; color: ${isActive ? '#28a745' : '#dc3545'};">
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

    document.getElementById('classDetailTitle').textContent = `Lớp: ${cls.name}`;
    document.getElementById('classDetailCount').textContent = `Tổng số: ${cls.students.length} học sinh`;

    // Toggle Class Status button handler
    const toggleBtn = document.getElementById('btnToggleClassStatus');
    let isActive = appState.classStatusMap[cls.name] !== false;

    function updateBtnUI() {
        toggleBtn.textContent = isActive ? "Khóa Lớp" : "Mở Khóa Lớp";
        toggleBtn.style.backgroundColor = isActive ? "#dc3545" : "#28a745";
    }
    updateBtnUI();

    const newToggleBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

    newToggleBtn.addEventListener('click', () => {
        isActive = !isActive;
        updateBtnUI();
        updateClassStatus(cls.name, isActive);
    });

    // Populate class detail table
    const sortedStudents = sortStudentsBySTT(cls.students);
    const tbody = document.getElementById('classDetailTableBody');
    tbody.innerHTML = '';

    appState.selectedStudentIds = [];
    document.getElementById('selectAllStudents').checked = false;
    updateBulkActionsUI();

    sortedStudents.forEach(student => {
        const tr = document.createElement('tr');
        const fullName = getFullName(student);
        const subjects = getEnrolledSubjects(student);
        const lop = student['LỚP'] || '';

        tr.innerHTML = `
            <td class="col-checkbox checkbox-cell">
                <input type="checkbox" class="student-checkbox" data-id="${student.id}">
            </td>
            <td class="col-stt">${student['STT'] || ''}</td>
            <td style="font-weight: 600;">${fullName}</td>
            <td>${lop}</td>
            <td>${student['SỐ ĐT'] || ''}</td>
            <td>${subjects.map(s => `<span class="badge">${s}</span>`).join(' ')}</td>
        `;

        tr.querySelector('.checkbox-cell').addEventListener('click', (e) => {
            e.stopPropagation();
            if (e.target.tagName !== 'INPUT') {
                const checkbox = tr.querySelector('.student-checkbox');
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });

        tr.querySelector('.student-checkbox').addEventListener('change', (e) => {
            if (e.target.checked) {
                if (!appState.selectedStudentIds.includes(student.id)) appState.selectedStudentIds.push(student.id);
            } else {
                appState.selectedStudentIds = appState.selectedStudentIds.filter(id => id !== student.id);
                document.getElementById('selectAllStudents').checked = false;
            }
            updateBulkActionsUI();
        });

        tr.addEventListener('click', () => openStudentModal(student));
        tbody.appendChild(tr);
    });
}

function updateBulkActionsUI() {
    const bar = document.getElementById('bulkActionsBar');
    const countSpan = document.getElementById('selectedCount');

    if (appState.selectedStudentIds.length > 0) {
        bar.classList.remove('hidden');
        countSpan.textContent = appState.selectedStudentIds.length;
    } else {
        bar.classList.add('hidden');
    }
}

// Select All Handler
document.getElementById('selectAllStudents').addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const checkboxes = document.querySelectorAll('.student-checkbox');

    appState.selectedStudentIds = [];
    checkboxes.forEach(cb => {
        cb.checked = isChecked;
        if (isChecked) {
            appState.selectedStudentIds.push(cb.dataset.id);
        }
    });
    updateBulkActionsUI();
});

// ==========================================
// 7. BULK ACTIONS CONTROLLER
// ==========================================

// Bulk Delete Handler
document.getElementById('btnBulkDelete').addEventListener('click', async () => {
    if (appState.selectedStudentIds.length === 0 || !appState.currentDetailedClass) return;

    const className = appState.currentDetailedClass.name;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${appState.selectedStudentIds.length} học sinh này khỏi lớp ${className}?`)) {
        return;
    }

    const btn = document.getElementById('btnBulkDelete');
    btn.textContent = 'Đang xóa...';
    btn.disabled = true;

    try {
        const subject = appState.currentDetailedClass.subject;
        const payload = { [subject]: '' };

        const { error } = await supabase
            .from('ds_tong')
            .update(payload)
            .in('id', appState.selectedStudentIds);

        if (error) throw error;

        alert(`Đã xóa thành công ${appState.selectedStudentIds.length} học sinh khỏi lớp ${className}.`);
        appState.selectedStudentIds = [];
        await loadData();
    } catch (e) {
        console.error("Lỗi xóa học sinh khỏi lớp:", e);
        alert("Lỗi khi xóa: " + e.message);
    } finally {
        btn.textContent = 'Xóa Khỏi Lớp';
        btn.disabled = false;
    }
});

// Bulk Move Handlers
const bulkMoveModal = document.getElementById('bulkMoveModal');
const closeBulkMoveModalBtn = document.getElementById('closeBulkMoveModal');
const cancelBulkMoveModalBtn = document.getElementById('cancelBulkMoveModal');

function closeBulkMoveModal() {
    bulkMoveModal.style.display = 'none';
}

closeBulkMoveModalBtn.addEventListener('click', closeBulkMoveModal);
cancelBulkMoveModalBtn.addEventListener('click', closeBulkMoveModal);

document.getElementById('btnBulkMove').addEventListener('click', () => {
    if (appState.selectedStudentIds.length === 0 || !appState.currentDetailedClass) return;

    document.getElementById('bulkMoveSubjectInfo').textContent = appState.currentDetailedClass.subject;
    document.getElementById('modalNewSubjectClass').value = '';
    bulkMoveModal.style.display = 'block';
});

document.getElementById('btnConfirmBulkMove').addEventListener('click', async () => {
    if (appState.selectedStudentIds.length === 0 || !appState.currentDetailedClass) return;

    const newClassValue = document.getElementById('modalNewSubjectClass').value;
    const btn = document.getElementById('btnConfirmBulkMove');
    btn.textContent = 'Đang xử lý...';
    btn.disabled = true;

    try {
        const subject = appState.currentDetailedClass.subject;
        const payload = { [subject]: newClassValue.trim() };

        const { error } = await supabase
            .from('ds_tong')
            .update(payload)
            .in('id', appState.selectedStudentIds);

        if (error) throw error;

        alert(`Đã chuyển lớp thành công cho ${appState.selectedStudentIds.length} học sinh.`);
        closeBulkMoveModal();
        appState.selectedStudentIds = [];
        await loadData();
    } catch (e) {
        console.error("Lỗi chuyển lớp:", e);
        alert("Lỗi khi chuyển lớp: " + e.message);
    } finally {
        btn.textContent = 'Xác Nhận Chuyển';
        btn.disabled = false;
    }
});

document.getElementById('btnBackToClasses').addEventListener('click', () => {
    appState.currentSpecificClassFilter = null;
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
// 8. STUDENT TABLE & SEARCH FILTER
// ==========================================
function renderStudentTable(data) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6c757d; padding: 2rem;">Không tìm thấy học sinh nào phù hợp.</td></tr>';
        return;
    }

    data.forEach(student => {
        const tr = document.createElement('tr');
        const fullName = getFullName(student);
        const subjects = getEnrolledSubjects(student);
        const lop = student['LỚP'] || '';

        tr.innerHTML = `
            <td class="col-stt">${student['STT'] || ''}</td>
            <td style="font-weight: 600;">${fullName}</td>
            <td>${lop}</td>
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

        const matchesSearch = !searchTerm || fullName.includes(searchTerm) || phone.includes(searchTerm);
        const matchesClass = !classVal || student['LỚP'] == classVal;

        return matchesSearch && matchesClass;
    });

    renderStudentTable(filtered);
}

// Event Listeners for Filters
document.getElementById('searchInput').addEventListener('input', filterData);
document.getElementById('classFilter').addEventListener('change', () => {
    const selected = document.getElementById('classFilter').value;
    document.getElementById('currentViewInfo').textContent = selected 
        ? `Học sinh Khối Lớp ${selected}` 
        : "Tất cả Học sinh";
    filterData();
});

// ==========================================
// 9. VIEW SWITCHING LOGIC
// ==========================================
function switchView(viewId) {
    appState.activeView = viewId;

    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    const targetSection = document.getElementById(viewId);
    if (targetSection) targetSection.classList.remove('hidden');

    document.querySelectorAll('.side-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewId) {
            item.classList.add('active');
            document.getElementById('pageTitle').textContent = item.textContent.replace('🏫', '').replace('🎓', '').trim();
        }
    });

    if (viewId === 'student-view') {
        document.getElementById('tableContainer').classList.remove('hidden');
        document.getElementById('classManagementContainer').classList.add('hidden');
        document.getElementById('classDetailView').classList.add('hidden');
    } else if (viewId === 'class-view') {
        document.getElementById('tableContainer').classList.add('hidden');
        const detailView = document.getElementById('classDetailView');
        if (detailView.classList.contains('hidden')) {
            document.getElementById('classManagementContainer').classList.remove('hidden');
        }
    }
}

document.querySelectorAll('.side-nav .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(e.currentTarget.dataset.view);
    });
});

// ==========================================
// 10. EXPORT EXCEL PIPELINE CONTROLLER
// ==========================================
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
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                alert(data.success ? data.message : "Có lỗi xảy ra: " + data.message);
            } else {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'DanhSachCacLop.zip';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                alert('✅ Đã trích xuất và tải file Excel (ZIP) thành công!');
            }
        } else {
            let errorMsg = "Lỗi kết nối máy chủ";
            try {
                const data = await response.json();
                errorMsg = data.message || errorMsg;
            } catch(e) {}
            alert("Có lỗi xảy ra: " + errorMsg);
        }
    } catch (error) {
        console.error("Lỗi API Export:", error);
        alert("Không thể kết nối đến server trích xuất. Hãy đảm bảo bạn đã khởi chạy 'npm start' hoặc 'node server.js'.");
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// ==========================================
// 11. STUDENT MODAL CONTROLLER
// ==========================================
const studentModal = document.getElementById('studentModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelModalBtn = document.getElementById('cancelModal');
const studentForm = document.getElementById('studentForm');

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

    document.getElementById('modalTitle').textContent = 'Chi Tiết Học Sinh';
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

    document.getElementById('modalTitle').textContent = 'Thêm Học Sinh Mới';
    studentModal.style.display = 'block';
});

function closeStudentModal() {
    studentModal.style.display = 'none';
}

closeModalBtn.addEventListener('click', closeStudentModal);
cancelModalBtn.addEventListener('click', closeStudentModal);

window.addEventListener('click', (e) => {
    if (e.target === studentModal) closeStudentModal();
    if (e.target === bulkMoveModal) closeBulkMoveModal();
});

studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('modalStudentId').value;
    const saveBtn = studentForm.querySelector('.btn-save');
    const originalText = saveBtn.textContent;

    saveBtn.textContent = 'Đang lưu...';
    saveBtn.disabled = true;

    try {
        const payload = {
            'HỌ': document.getElementById('modalHo').value.trim(),
            'TÊN': document.getElementById('modalTen').value.trim(),
            'LỚP': document.getElementById('modalLop').value.trim(),
            'SỐ ĐT': document.getElementById('modalSdt').value.trim(),
            'TOÁN': document.getElementById('modalToan').value.trim(),
            'VĂN': document.getElementById('modalVan').value.trim(),
            'AV': document.getElementById('modalAv').value.trim(),
            'Hóa': document.getElementById('modalHoa').value.trim(),
            'Lý': document.getElementById('modalLy').value.trim(),
        };

        let error = null;
        if (id) {
            const result = await supabase
                .from('ds_tong')
                .update(payload)
                .eq('id', id);
            error = result.error;
        } else {
            let maxStt = 0;
            appState.allStudents.forEach(s => {
                const sttNum = parseInt(s['STT'], 10);
                if (!isNaN(sttNum) && sttNum > maxStt) {
                    maxStt = sttNum;
                }
            });
            payload['STT'] = (maxStt + 1).toString();

            const result = await supabase
                .from('ds_tong')
                .insert([payload]);
            error = result.error;
        }

        if (error) throw error;

        closeStudentModal();
        await loadData();
    } catch (error) {
        console.error("Lỗi cập nhật học sinh:", error);
        alert("Lỗi khi lưu dữ liệu học sinh: " + error.message);
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
});

// ==========================================
// 12. INITIALIZATION
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    loadData();
    initRealtimeSubscription();
});
