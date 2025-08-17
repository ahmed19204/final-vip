// Admin Students Management
let studentsData = [];
let currentEditId = null;

// Initialize students management
document.addEventListener('DOMContentLoaded', function() {
    loadStudentsData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Add student form submission
    const addStudentForm = document.getElementById('addStudentForm');
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', handleAddStudent);
    }

    // Search functionality
    const searchInput = document.getElementById('studentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleStudentSearch);
    }
}

// Load students data from Supabase
async function loadStudentsData() {
    try {
        showLoading('جاري تحميل بيانات الطلاب...');
        
        const result = await window.supabaseFunctions.getAllStudents();
        
        if (result.success) {
            studentsData = result.data || [];
            displayStudents(studentsData);
            showNotification('تم تحميل بيانات الطلاب بنجاح', 'success');
        } else {
            console.error('Error loading students:', result.error);
            showNotification('خطأ في تحميل بيانات الطلاب', 'error');
            // Fallback to empty array
            studentsData = [];
            displayStudents([]);
        }
    } catch (error) {
        console.error('Exception loading students:', error);
        showNotification('خطأ في تحميل بيانات الطلاب', 'error');
        studentsData = [];
        displayStudents([]);
    } finally {
        hideLoading();
    }
}

// Handle add student form submission
async function handleAddStudent(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const studentData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        grade: formData.get('grade'),
        governorate: formData.get('governorate'),
        country: formData.get('country'),
        birth_date: formData.get('birth_date'),
        gender: formData.get('gender'),
        password_hash: 'temp_password_hash', // In real app, this should be hashed
        status: 'active'
    };

    try {
        showLoading('جاري إضافة الطالب...');
        
        const result = await window.supabaseFunctions.addStudent(studentData);
        
        if (result.success) {
            showNotification('تم إضافة الطالب بنجاح', 'success');
            event.target.reset();
            closeModal('addStudentModal');
            loadStudentsData(); // Reload data
        } else {
            showNotification(`خطأ في إضافة الطالب: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Exception adding student:', error);
        showNotification('خطأ في إضافة الطالب', 'error');
    } finally {
        hideLoading();
    }
}

// Handle edit student
async function handleEditStudent(studentId) {
    const student = studentsData.find(s => s.id === studentId);
    if (!student) return;

    currentEditId = studentId;
    
    // Populate form fields
    document.getElementById('editStudentName').value = student.name;
    document.getElementById('editStudentEmail').value = student.email;
    document.getElementById('editStudentPhone').value = student.phone || '';
    document.getElementById('editStudentGrade').value = student.grade || '';
    document.getElementById('editStudentGovernorate').value = student.governorate || '';
    document.getElementById('editStudentCountry').value = student.country || 'مصر';
    document.getElementById('editStudentBirthDate').value = student.birth_date || '';
    document.getElementById('editStudentGender').value = student.gender || '';
    document.getElementById('editStudentStatus').value = student.status || 'active';
    
    openModal('editStudentModal');
}

// Handle update student
async function handleUpdateStudent(event) {
    event.preventDefault();
    
    if (!currentEditId) return;
    
    const formData = new FormData(event.target);
    const studentData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        grade: formData.get('grade'),
        governorate: formData.get('governorate'),
        country: formData.get('country'),
        birth_date: formData.get('birth_date'),
        gender: formData.get('gender'),
        status: formData.get('status')
    };

    try {
        showLoading('جاري تحديث بيانات الطالب...');
        
        // Update in Supabase
        const { data, error } = await window.supabaseClient
            .from('students')
            .update(studentData)
            .eq('id', currentEditId)
            .select();
        
        if (error) throw error;
        
        showNotification('تم تحديث بيانات الطالب بنجاح', 'success');
        closeModal('editStudentModal');
        currentEditId = null;
        loadStudentsData(); // Reload data
    } catch (error) {
        console.error('Error updating student:', error);
        showNotification(`خطأ في تحديث بيانات الطالب: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Handle delete student
async function handleDeleteStudent(studentId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    
    try {
        showLoading('جاري حذف الطالب...');
        
        const { error } = await window.supabaseClient
            .from('students')
            .delete()
            .eq('id', studentId);
        
        if (error) throw error;
        
        showNotification('تم حذف الطالب بنجاح', 'success');
        loadStudentsData(); // Reload data
    } catch (error) {
        console.error('Error deleting student:', error);
        showNotification(`خطأ في حذف الطالب: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Display students in the table
function displayStudents(students) {
    const tbody = document.querySelector('#studentsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    لا يوجد طلاب حالياً
                </td>
            </tr>
        `;
        return;
    }
    
    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="student-info">
                    <img src="${student.profile_image || 'images/default-student.jpg'}" alt="${student.name}" class="student-avatar">
                    <div>
                        <div class="student-name">${student.name}</div>
                        <div class="student-grade">${student.grade || 'غير محدد'}</div>
                    </div>
                </div>
            </td>
            <td>${student.email}</td>
            <td>${student.phone || 'غير محدد'}</td>
            <td>${student.grade || 'غير محدد'}</td>
            <td>${student.governorate || 'غير محدد'}</td>
            <td>${student.country || 'مصر'}</td>
            <td>${student.birth_date || 'غير محدد'}</td>
            <td>
                <span class="status-badge status-${student.status}">
                    ${getStatusText(student.status)}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button onclick="handleEditStudent(${student.id})" class="btn-edit" title="تعديل">
                        ✏️
                    </button>
                    <button onclick="handleDeleteStudent(${student.id})" class="btn-delete" title="حذف">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Handle student search
function handleStudentSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    if (!searchTerm) {
        displayStudents(studentsData);
        return;
    }
    
    const filteredStudents = studentsData.filter(student => 
        student.name.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm) ||
        (student.phone && student.phone.includes(searchTerm)) ||
        (student.grade && student.grade.toLowerCase().includes(searchTerm)) ||
        (student.governorate && student.governorate.toLowerCase().includes(searchTerm))
    );
    
    displayStudents(filteredStudents);
}

// Get status text in Arabic
function getStatusText(status) {
    const statusMap = {
        'active': 'نشط',
        'inactive': 'غير نشط',
        'suspended': 'معلق'
    };
    return statusMap[status] || status;
}

// Utility functions
function showLoading(message) {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.textContent = message;
        loadingDiv.style.display = 'block';
    }
}

function hideLoading() {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Export functions for global use
window.handleEditStudent = handleEditStudent;
window.handleUpdateStudent = handleUpdateStudent;
window.handleDeleteStudent = handleDeleteStudent;
window.handleStudentSearch = handleStudentSearch;
