const { createClient } = window.supabase;

const supabaseUrl = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const supabaseKey = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

let allStudents = [];
let allClassesList = [];
let currentSubjectFilter = 'ALL';
let currentSpecificClassFilter = null;
let classStatusMap = {};
let selectedStudentIds = [];
let currentDetailedClass = null;

async function fetchClassStatus() {
    try {
        const res = await fetch('/api/class-status');
        if (res.ok) {
            classStatusMap = await res.json();
        }
    } catch (e) {
        console.error("Lỗi lấy trạng thái lớp:", e);
    }
}

async function updateClassStatus(className, isActive) {
    classStatusMap[className] = isActive;
    try {
        await fetch('/api/class-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(classStatusMap)
        });
        renderClassGrid(); // Cập nhật lại UI
    } catch (e) {
        console.error("Lỗi cập nhật trạng thái lớp:", e);
    }
}

function loadData() {
    const loadingEl = document.getElementById('loading');
    const tableContainer = document.getElementById('tableContainer');
    
    fetchClassStatus();
    
    async function fetchAllStudents() {
        let allData = [];
        let start = 0;
        const limit = 1000;
        while (true) {
            const { data, error } = await supabaseClient
                .from('ds_tong')
                .select('*')
                .range(start, start + limit - 1);
                
            if (error) {
                console.error("Lỗi lấy dữ liệu:", error);
                loadingEl.innerHTML = `<p style="color: red;">Error loading data from Supabase.</p>`;
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

    try {
        fetchAllStudents().then(data => {
            if (data) {
                processDataAndRender(data, loadingEl, tableContainer);
            }
        });

        // Supabase Realtime updates
        supabaseClient
            .channel('public:ds_tong')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ds_tong' }, payload => {
                fetchAllStudents().then(data => {
                    if (data) {
                        processDataAndRender(data, loadingEl, tableContainer);
                    }
                });
            })
            .subscribe();
            
    } catch (error) {
        console.error("Error loading data:", error);
        loadingEl.innerHTML = `<p style="color: red;">Error loading data from Supabase.</p>`;
    }
}

function processDataAndRender(data, loadingEl, tableContainer) {
    allStudents = []; // clear the array on update
    data.forEach((docData) => {
        // Bỏ qua dòng TỔNG CỘNG nếu có trong CSDL
        const isTongCong = 
            (typeof docData['STT'] === 'string' && docData['STT'].toUpperCase().includes('TỔNG CỘNG')) ||
            (typeof docData['HỌ'] === 'string' && docData['HỌ'].toUpperCase().includes('TỔNG CỘNG')) ||
            (typeof docData['TÊN'] === 'string' && docData['TÊN'].toUpperCase().includes('TỔNG CỘNG'));
            
        // Bỏ qua dòng cấu hình hệ thống
        const isSystemConfig = (docData['STT'] === 99999 || docData['STT'] === '99999');

        if (!isTongCong && !isSystemConfig) {
            allStudents.push(docData);
        }
    });
    
    // Sắp xếp danh sách theo cột STT (từ nhỏ đến lớn)
    allStudents.sort((a, b) => {
        const sttA = parseInt(a['STT'], 10);
        const sttB = parseInt(b['STT'], 10);
        
        // Đẩy các học sinh không có STT hợp lệ xuống cuối danh sách
        const valA = isNaN(sttA) ? Number.MAX_SAFE_INTEGER : sttA;
        const valB = isNaN(sttB) ? Number.MAX_SAFE_INTEGER : sttB;
        
        return valA - valB;
    });
    
    // Populate class filter
    populateFilters();
    
    // Populate class management
    populateClassManagement();
    
    // Render data based on current filter values for main table
    filterData();
    
    // Update UI based on current state instead of forcing everything to show
    const currentActiveNav = document.querySelector('.side-nav .nav-item.active');
    const activeViewId = currentActiveNav ? currentActiveNav.dataset.view : 'class-view';
    
    if (activeViewId === 'class-view') {
        const detailView = document.getElementById('classDetailView');
        if (detailView.style.display === 'block' && currentSpecificClassFilter) {
            // User is currently viewing a specific class detail, refresh it!
            const updatedClass = allClassesList.find(c => c.id === currentSpecificClassFilter);
            if (updatedClass) {
                showClassDetail(updatedClass);
            } else {
                // The class might be empty now, go back to class list
                document.getElementById('btnBackToClasses').click();
            }
        } else {
            document.getElementById('classManagementContainer').style.display = 'block';
            document.getElementById('tableContainer').style.display = 'none';
        }
    } else if (activeViewId === 'student-view') {
        document.getElementById('classManagementContainer').style.display = 'none';
        document.getElementById('classDetailView').style.display = 'none';
        document.getElementById('tableContainer').style.display = 'block';
    }
    
    loadingEl.style.display = 'none';
    
    // Add a counter to show how many students are loaded
    let counterEl = document.getElementById('studentCounter');
    if (!counterEl) {
        counterEl = document.createElement('div');
        counterEl.id = 'studentCounter';
        counterEl.style.marginBottom = '1rem';
        counterEl.style.fontWeight = 'bold';
        counterEl.style.color = 'var(--primary-color)';
        document.querySelector('.controls').after(counterEl);
    }
    counterEl.textContent = `Tổng số học sinh tải về: ${allStudents.length}`;
}

function populateFilters() {
    const classFilter = document.getElementById('classFilter');
    const currentValue = classFilter.value; // Lấy giá trị đang chọn
    
    const classes = new Set();
    allStudents.forEach(student => {
        if (student['LỚP']) {
            classes.add(student['LỚP']);
        }
    });
    
    const sortedClasses = Array.from(classes).sort((a, b) => {
        return String(a).localeCompare(String(b), undefined, {numeric: true});
    });
    
    // Xóa hết các option cũ
    classFilter.innerHTML = '<option value="">-- Tất cả các lớp --</option>';
    
    sortedClasses.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls;
        option.textContent = `Lớp ${cls}`;
        classFilter.appendChild(option);
    });
    
    // Khôi phục lại giá trị bộ lọc đã chọn trước đó (nếu có)
    classFilter.value = currentValue;
}

function populateClassManagement() {
    const classGrid = document.getElementById('classGrid');
    classGrid.innerHTML = '';
    
    const targetSubjects = ["TOÁN", "VĂN", "AV", "Hóa", "Lý"];
    const classMap = new Map();
    
    allStudents.forEach(student => {
        const lop = student['LỚP'] || '';
        if (!lop) return;
        
        targetSubjects.forEach(sub => {
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
    
    allClassesList = Array.from(classMap.values());
    
    allClassesList.sort((a, b) => {
        const gradeA = parseInt(a.grade) || 0;
        const gradeB = parseInt(b.grade) || 0;
        if (gradeA !== gradeB) return gradeA - gradeB;
        if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
        return a.name.localeCompare(b.name);
    });
    
    renderClassGrid();
}

function renderClassGrid() {
    const classGrid = document.getElementById('classGrid');
    classGrid.innerHTML = '';
    
    const filteredClasses = currentSubjectFilter === 'ALL' 
        ? allClassesList 
        : allClassesList.filter(c => c.subject.toUpperCase() === currentSubjectFilter.toUpperCase());
        
    filteredClasses.forEach(cls => {
        const card = document.createElement('div');
        card.className = 'class-card';
        if (currentSpecificClassFilter === cls.id) {
            card.classList.add('active-card');
        }
        
        const isActive = classStatusMap[cls.name] !== false;
        if (!isActive) {
            card.style.opacity = '0.5';
            card.style.backgroundColor = '#f0f0f0';
        }
        
        card.innerHTML = `
            <h3>${cls.name}</h3>
            <p>${cls.students.length} Học sinh</p>
            <p style="font-size: 0.8rem; color: ${isActive ? 'green' : 'red'};">${isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</p>
        `;
        
        card.addEventListener('click', () => {
            showClassDetail(cls);
        });
        
        classGrid.appendChild(card);
    });
}

function showClassDetail(cls) {
    currentSpecificClassFilter = cls.id;
    currentDetailedClass = cls; // Lưu lại đối tượng class hiện tại cho chức năng chuyển lớp
    document.getElementById('classManagementContainer').style.display = 'none';
    document.getElementById('classDetailView').style.display = 'block';
    
    document.getElementById('classDetailTitle').textContent = `Lớp: ${cls.name}`;
    document.getElementById('classDetailCount').textContent = `Tổng số: ${cls.students.length} học sinh`;
    
    const toggleBtn = document.getElementById('btnToggleClassStatus');
    let isActive = classStatusMap[cls.name] !== false;
    
    function updateBtnUI() {
        toggleBtn.textContent = isActive ? "Khóa lớp" : "Mở khóa lớp";
        toggleBtn.style.backgroundColor = isActive ? "#dc3545" : "#28a745";
    }
    updateBtnUI();
    
    // Remove old listeners to prevent multiple triggers
    const newToggleBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
    
    newToggleBtn.addEventListener('click', () => {
        isActive = !isActive;
        updateBtnUI();
        updateClassStatus(cls.name, isActive);
    });
    
    // Sắp xếp học sinh theo STT
    const sortedStudents = [...cls.students].sort((a, b) => {
        const sttA = parseInt(a['STT'], 10);
        const sttB = parseInt(b['STT'], 10);
        const valA = isNaN(sttA) ? Number.MAX_SAFE_INTEGER : sttA;
        const valB = isNaN(sttB) ? Number.MAX_SAFE_INTEGER : sttB;
        return valA - valB;
    });
    
    const tbody = document.getElementById('classDetailTableBody');
    tbody.innerHTML = '';
    
    // Reset selections
    selectedStudentIds = [];
    document.getElementById('selectAllStudents').checked = false;
    updateBulkActionsUI();
    
    sortedStudents.forEach(student => {
        const tr = document.createElement('tr');
        const fullName = `${student['HỌ'] || ''} ${student['TÊN'] || ''}`.trim();
        
        const subjects = [];
        const lop = student['LỚP'] || '';
        
        if (student['TOÁN']) subjects.push(`Toán ${lop}${student['TOÁN']}`.trim());
        if (student['VĂN']) subjects.push(`Văn ${lop}${student['VĂN']}`.trim());
        if (student['AV']) subjects.push(`Anh Văn ${lop}${student['AV']}`.trim());
        if (student['Hóa']) subjects.push(`Hóa ${lop}${student['Hóa']}`.trim());
        if (student['Lý']) subjects.push(`Lý ${lop}${student['Lý']}`.trim());
        
        tr.innerHTML = `
            <td style="text-align: center;" class="checkbox-cell">
                <input type="checkbox" class="student-checkbox" data-id="${student.id}">
            </td>
            <td>${student['STT'] || ''}</td>
            <td style="font-weight: 500;">${fullName}</td>
            <td>${lop}</td>
            <td>${student['SỐ ĐT'] || ''}</td>
            <td>${subjects.map(s => `<span class="badge">${s}</span>`).join(' ')}</td>
        `;
        
        // Prevent row click when clicking on the checkbox cell
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
                if (!selectedStudentIds.includes(student.id)) selectedStudentIds.push(student.id);
            } else {
                selectedStudentIds = selectedStudentIds.filter(id => id !== student.id);
                document.getElementById('selectAllStudents').checked = false;
            }
            updateBulkActionsUI();
        });
        
        tr.addEventListener('click', () => openModal(student));
        tbody.appendChild(tr);
    });
}

function updateBulkActionsUI() {
    const bar = document.getElementById('bulkActionsBar');
    const countSpan = document.getElementById('selectedCount');
    
    if (selectedStudentIds.length > 0) {
        bar.style.display = 'flex';
        countSpan.textContent = selectedStudentIds.length;
    } else {
        bar.style.display = 'none';
    }
}

// Select All functionality
document.getElementById('selectAllStudents').addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const checkboxes = document.querySelectorAll('.student-checkbox');
    
    selectedStudentIds = [];
    checkboxes.forEach(cb => {
        cb.checked = isChecked;
        if (isChecked) {
            selectedStudentIds.push(cb.dataset.id);
        }
    });
    updateBulkActionsUI();
});

// Bulk Delete Logic (Remove from class)
document.getElementById('btnBulkDelete').addEventListener('click', async () => {
    if (selectedStudentIds.length === 0 || !currentDetailedClass) return;
    
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedStudentIds.length} học sinh này khỏi lớp ${currentDetailedClass.name}? (Học sinh vẫn tồn tại trong hệ thống)`)) {
        return;
    }
    
    document.getElementById('btnBulkDelete').textContent = 'Đang xóa...';
    document.getElementById('btnBulkDelete').disabled = true;
    
    try {
        const subject = currentDetailedClass.subject;
        const payload = {
            [subject]: ''
        };
        
        const { error } = await supabaseClient
            .from('ds_tong')
            .update(payload)
            .in('id', selectedStudentIds);
            
        if (error) throw error;
        
        alert(`Đã xóa thành công ${selectedStudentIds.length} học sinh khỏi lớp ${currentDetailedClass.name}.`);
        selectedStudentIds = [];
        loadData(); // Tải lại toàn bộ dữ liệu
    } catch (e) {
        console.error("Lỗi xóa học sinh khỏi lớp:", e);
        alert("Lỗi khi xóa: " + e.message);
    } finally {
        document.getElementById('btnBulkDelete').textContent = 'Xóa Khỏi Lớp';
        document.getElementById('btnBulkDelete').disabled = false;
    }
});

// Bulk Move Logic
const bulkMoveModal = document.getElementById('bulkMoveModal');
const closeBulkMoveModalBtn = document.getElementById('closeBulkMoveModal');
const cancelBulkMoveModalBtn = document.getElementById('cancelBulkMoveModal');

function closeBulkMoveModal() {
    bulkMoveModal.style.display = 'none';
}

closeBulkMoveModalBtn.addEventListener('click', closeBulkMoveModal);
cancelBulkMoveModalBtn.addEventListener('click', closeBulkMoveModal);

document.getElementById('btnBulkMove').addEventListener('click', () => {
    if (selectedStudentIds.length === 0 || !currentDetailedClass) return;
    
    document.getElementById('bulkMoveSubjectInfo').textContent = `${currentDetailedClass.subject}`;
    document.getElementById('modalNewSubjectClass').value = '';
    
    bulkMoveModal.style.display = 'block';
});

document.getElementById('btnConfirmBulkMove').addEventListener('click', async () => {
    if (selectedStudentIds.length === 0 || !currentDetailedClass) return;
    
    const newClassValue = document.getElementById('modalNewSubjectClass').value;
    // Empty string is allowed (removes them from class)
    
    const btn = document.getElementById('btnConfirmBulkMove');
    btn.textContent = 'Đang xử lý...';
    btn.disabled = true;
    
    try {
        // Prepare update payload for specific subject
        // e.g. if subject is 'TOÁN', we set {'TOÁN': newClassValue.trim()}
        const subject = currentDetailedClass.subject;
        const payload = {
            [subject]: newClassValue.trim()
        };
        
        const { error } = await supabaseClient
            .from('ds_tong')
            .update(payload)
            .in('id', selectedStudentIds);
            
        if (error) throw error;
        
        alert(`Đã cập nhật lớp cho ${selectedStudentIds.length} học sinh thành công.`);
        closeBulkMoveModal();
        selectedStudentIds = [];
        loadData(); // Tải lại toàn bộ dữ liệu
    } catch (e) {
        console.error("Lỗi chuyển lớp:", e);
        alert("Lỗi khi chuyển lớp: " + e.message);
    } finally {
        btn.textContent = 'Chuyển Lớp';
        btn.disabled = false;
    }
});

document.getElementById('btnBackToClasses').addEventListener('click', () => {
    currentSpecificClassFilter = null;
    document.getElementById('classDetailView').style.display = 'none';
    document.getElementById('classManagementContainer').style.display = 'block';
});

document.querySelectorAll('#subjectTabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('#subjectTabs .tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentSubjectFilter = e.target.dataset.subject;
        renderClassGrid();
    });
});

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Không tìm thấy dữ liệu.</td></tr>';
        return;
    }
    
    data.forEach(student => {
        const tr = document.createElement('tr');
        
        const fullName = `${student['HỌ'] || ''} ${student['TÊN'] || ''}`.trim();
        
        // Check for subjects
        const subjects = [];
        const lop = student['LỚP'] || '';
        
        if (student['TOÁN']) subjects.push(`Toán ${lop}${student['TOÁN']}`.trim());
        if (student['VĂN']) subjects.push(`Văn ${lop}${student['VĂN']}`.trim());
        if (student['AV']) subjects.push(`Anh Văn ${lop}${student['AV']}`.trim());
        if (student['Hóa']) subjects.push(`Hóa ${lop}${student['Hóa']}`.trim());
        if (student['Lý']) subjects.push(`Lý ${lop}${student['Lý']}`.trim());
        
        tr.innerHTML = `
            <td>${student['STT'] || ''}</td>
            <td style="font-weight: 500;">${fullName}</td>
            <td>${lop}</td>
            <td>${student['SỐ ĐT'] || ''}</td>
            <td>${subjects.map(s => `<span class="badge">${s}</span>`).join(' ')}</td>
            <!-- <td style="display:none;">${student['THIẾU'] || '0'}</td> -->
        `;
        
        tr.addEventListener('click', () => openModal(student));
        
        tbody.appendChild(tr);
    });
}

// Event listeners for filters
document.getElementById('searchInput').addEventListener('input', filterData);
document.getElementById('classFilter').addEventListener('change', () => {
    document.getElementById('currentViewInfo').textContent = document.getElementById('classFilter').value 
        ? `Khối Lớp: ${document.getElementById('classFilter').value}` 
        : "Tất cả Học sinh";
    filterData();
});

// View Switching Logic
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(viewId).style.display = 'block';
    
    document.querySelectorAll('.side-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewId) {
            item.classList.add('active');
            document.getElementById('pageTitle').textContent = item.textContent.replace('🏫', '').replace('🎓', '').trim();
        }
    });
    
    if (viewId === 'student-view') {
        document.getElementById('tableContainer').style.display = 'block';
        document.getElementById('classManagementContainer').style.display = 'none';
        document.getElementById('classDetailView').style.display = 'none';
    } else if (viewId === 'class-view') {
        document.getElementById('tableContainer').style.display = 'none';
        // Check if detail view is already shown (user previously opened a class)
        const detailView = document.getElementById('classDetailView');
        if (detailView.style.display !== 'block') {
            document.getElementById('classManagementContainer').style.display = 'block';
        }
    }
}

document.querySelectorAll('.side-nav .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(e.currentTarget.dataset.view);
    });
});

function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const classVal = document.getElementById('classFilter').value;
    
    const filtered = allStudents.filter(student => {
        const fullName = `${student['HỌ'] || ''} ${student['TÊN'] || ''}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm) || (student['SỐ ĐT'] && student['SỐ ĐT'].toString().includes(searchTerm));
        const matchesClassDropdown = classVal === "" || student['LỚP'] == classVal;
        
        return matchesSearch && matchesClassDropdown;
    });
    
    renderTable(filtered);
}

// Initialize
window.addEventListener('DOMContentLoaded', loadData);

// Export functionality
document.getElementById('exportBtn').addEventListener('click', async () => {
    const btn = document.getElementById('exportBtn');
    const originalText = btn.textContent;
    btn.textContent = "Đang trích xuất...";
    btn.disabled = true;

    try {
        // We use Vercel Serverless Function
        const response = await fetch('/api/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(allStudents)
        });
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                alert(data.success ? data.message : "Có lỗi xảy ra: " + data.message);
            } else {
                // Đây là file zip trả về
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
                alert('Đã trích xuất và tải về máy thành công!');
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
        console.error("Lỗi khi gọi API export:", error);
        alert("Không thể kết nối đến server trích xuất. Hãy đảm bảo bạn đã chạy 'node server.js'.");
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// Modal functionality
const modal = document.getElementById('studentModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelModalBtn = document.getElementById('cancelModal');
const studentForm = document.getElementById('studentForm');

function openModal(student) {
    document.getElementById('modalStudentId').value = student.id;
    document.getElementById('modalHo').value = student['HỌ'] || '';
    document.getElementById('modalTen').value = student['TÊN'] || '';
    document.getElementById('modalLop').value = student['LỚP'] || '';
    document.getElementById('modalSdt').value = student['SỐ ĐT'] || '';
    // document.getElementById('modalThieu').value = student['THIẾU'] || '0';
    document.getElementById('modalToan').value = student['TOÁN'] || '';
    document.getElementById('modalVan').value = student['VĂN'] || '';
    document.getElementById('modalAv').value = student['AV'] || '';
    document.getElementById('modalHoa').value = student['Hóa'] || '';
    document.getElementById('modalLy').value = student['Lý'] || '';
    
    document.getElementById('studentModal').querySelector('h2').textContent = 'Chi Tiết Học Sinh';
    modal.style.display = 'block';
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
    
    document.getElementById('studentModal').querySelector('h2').textContent = 'Thêm Học Sinh Mới';
    modal.style.display = 'block';
});

function closeModal() {
    modal.style.display = 'none';
}

closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
    if (e.target === bulkMoveModal) {
        closeBulkMoveModal();
    }
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
            'HỌ': document.getElementById('modalHo').value,
            'TÊN': document.getElementById('modalTen').value,
            'LỚP': document.getElementById('modalLop').value,
            'SỐ ĐT': document.getElementById('modalSdt').value,
            'TOÁN': document.getElementById('modalToan').value,
            'VĂN': document.getElementById('modalVan').value,
            'AV': document.getElementById('modalAv').value,
            'Hóa': document.getElementById('modalHoa').value,
            'Lý': document.getElementById('modalLy').value,
        };

        let error = null;
        if (id) {
            // Update
            const result = await supabaseClient
                .from('ds_tong')
                .update(payload)
                .eq('id', id);
            error = result.error;
        } else {
            // Tự động tính STT cho học sinh mới bằng cách lấy STT lớn nhất + 1
            let maxStt = 0;
            allStudents.forEach(s => {
                let sttNum = parseInt(s['STT'], 10);
                if (!isNaN(sttNum) && sttNum > maxStt) {
                    maxStt = sttNum;
                }
            });
            payload['STT'] = (maxStt + 1).toString();

            // Insert
            const result = await supabaseClient
                .from('ds_tong')
                .insert([payload]);
            error = result.error;
        }
            
        if (error) throw error;
        closeModal();
        
        // Tải lại dữ liệu ngay lập tức để cập nhật giao diện
        loadData();
    } catch (error) {
        console.error("Error updating document: ", error);
        alert("Lỗi khi lưu dữ liệu. Vui lòng thử lại.");
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
});
