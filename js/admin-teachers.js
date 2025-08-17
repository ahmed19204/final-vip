// Admin Teachers Management
let teachersData = [];
let currentEditId = null;

// Initialize teachers management
document.addEventListener('DOMContentLoaded', function() {
    loadTeachersData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Add teacher form submission
    const addTeacherForm = document.getElementById('addTeacherForm');
    if (addTeacherForm) {
        addTeacherForm.addEventListener('submit', handleAddTeacher);
    }

    // Search functionality
    const searchInput = document.getElementById('teacherSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleTeacherSearch);
    }
}

// Load teachers data from Supabase
async function loadTeachersData() {
    try {
        showLoading('جاري تحميل بيانات المدرسين...');
        
        const result = await window.supabaseFunctions.getAllTeachers();
        
        if (result.success) {
            teachersData = result.data || [];
            displayTeachers(teachersData);
            showNotification('تم تحميل بيانات المدرسين بنجاح', 'success');
        } else {
            console.error('Error loading teachers:', result.error);
            showNotification('خطأ في تحميل بيانات المدرسين', 'error');
            // Fallback to empty array
            teachersData = [];
            displayTeachers([]);
        }
    } catch (error) {
        console.error('Exception loading teachers:', error);
        showNotification('خطأ في تحميل بيانات المدرسين', 'error');
        teachersData = [];
        displayTeachers([]);
    } finally {
        hideLoading();
    }
}

// Handle add teacher form submission
async function handleAddTeacher(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const teacherData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        bio: formData.get('bio'),
        experience_years: parseInt(formData.get('experience_years')) || 0,
        education: formData.get('education'),
        specializations: formData.get('specializations').split(',').map(s => s.trim()).filter(s => s),
        hourly_rate: parseFloat(formData.get('hourly_rate')) || 0.00,
        status: 'active'
    };

    try {
        showLoading('جاري إضافة المدرس...');
        
        const result = await window.supabaseFunctions.addTeacher(teacherData);
        
        if (result.success) {
            showNotification('تم إضافة المدرس بنجاح', 'success');
            event.target.reset();
            closeModal('addTeacherModal');
            loadTeachersData(); // Reload data
        } else {
            showNotification(`خطأ في إضافة المدرس: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Exception adding teacher:', error);
        showNotification('خطأ في إضافة المدرس', 'error');
    } finally {
        hideLoading();
    }
}

// Handle edit teacher
async function handleEditTeacher(teacherId) {
    const teacher = teachersData.find(t => t.id === teacherId);
    if (!teacher) return;

    currentEditId = teacherId;
    
    // Populate form fields
    document.getElementById('editTeacherName').value = teacher.name;
    document.getElementById('editTeacherEmail').value = teacher.email;
    document.getElementById('editTeacherPhone').value = teacher.phone || '';
    document.getElementById('editTeacherSubject').value = teacher.subject || '';
    document.getElementById('editTeacherBio').value = teacher.bio || '';
    document.getElementById('editTeacherExperience').value = teacher.experience_years || 0;
    document.getElementById('editTeacherEducation').value = teacher.education || '';
    document.getElementById('editTeacherSpecializations').value = (teacher.specializations || []).join(', ');
    document.getElementById('editTeacherHourlyRate').value = teacher.hourly_rate || 0;
    document.getElementById('editTeacherStatus').value = teacher.status || 'active';
    
    openModal('editTeacherModal');
}

// Handle update teacher
async function handleUpdateTeacher(event) {
    event.preventDefault();
    
    if (!currentEditId) return;
    
    const formData = new FormData(event.target);
    const teacherData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        bio: formData.get('bio'),
        experience_years: parseInt(formData.get('experience_years')) || 0,
        education: formData.get('education'),
        specializations: formData.get('specializations').split(',').map(s => s.trim()).filter(s => s),
        hourly_rate: parseFloat(formData.get('hourly_rate')) || 0.00,
        status: formData.get('status')
    };

    try {
        showLoading('جاري تحديث بيانات المدرس...');
        
        // Update in Supabase
        const { data, error } = await window.supabaseClient
            .from('teachers')
            .update(teacherData)
            .eq('id', currentEditId)
            .select();
        
        if (error) throw error;
        
        showNotification('تم تحديث بيانات المدرس بنجاح', 'success');
        closeModal('editTeacherModal');
        currentEditId = null;
        loadTeachersData(); // Reload data
    } catch (error) {
        console.error('Error updating teacher:', error);
        showNotification(`خطأ في تحديث بيانات المدرس: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Handle delete teacher
async function handleDeleteTeacher(teacherId) {
    if (!confirm('هل أنت متأكد من حذف هذا المدرس؟')) return;
    
    try {
        showLoading('جاري حذف المدرس...');
        
        const { error } = await window.supabaseClient
            .from('teachers')
            .delete()
            .eq('id', teacherId);
        
        if (error) throw error;
        
        showNotification('تم حذف المدرس بنجاح', 'success');
        loadTeachersData(); // Reload data
    } catch (error) {
        console.error('Error deleting teacher:', error);
        showNotification(`خطأ في حذف المدرس: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Display teachers in the table
function displayTeachers(teachers) {
    const tbody = document.querySelector('#teachersTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (teachers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">
                    لا يوجد مدرسين حالياً
                </td>
            </tr>
        `;
        return;
    }
    
    teachers.forEach(teacher => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="teacher-info">
                    <img src="${teacher.image_url || 'images/default-teacher.jpg'}" alt="${teacher.name}" class="teacher-avatar">
                    <div>
                        <div class="teacher-name">${teacher.name}</div>
                        <div class="teacher-subject">${teacher.subject || 'غير محدد'}</div>
                    </div>
                </div>
            </td>
            <td>${teacher.email}</td>
            <td>${teacher.phone || 'غير محدد'}</td>
            <td>${teacher.experience_years || 0} سنة</td>
            <td>${teacher.education || 'غير محدد'}</td>
            <td>
                <span class="status-badge status-${teacher.status}">
                    ${getStatusText(teacher.status)}
                </span>
            </td>
            <td>${teacher.total_students || 0}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="handleEditTeacher(${teacher.id})" class="btn-edit" title="تعديل">
                        ✏️
                    </button>
                    <button onclick="handleDeleteTeacher(${teacher.id})" class="btn-delete" title="حذف">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Handle teacher search
function handleTeacherSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    if (!searchTerm) {
        displayTeachers(teachersData);
        return;
    }
    
    const filteredTeachers = teachersData.filter(teacher => 
        teacher.name.toLowerCase().includes(searchTerm) ||
        teacher.email.toLowerCase().includes(searchTerm) ||
        (teacher.subject && teacher.subject.toLowerCase().includes(searchTerm)) ||
        (teacher.phone && teacher.phone.includes(searchTerm))
    );
    
    displayTeachers(filteredTeachers);
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
window.handleEditTeacher = handleEditTeacher;
window.handleUpdateTeacher = handleUpdateTeacher;
window.handleDeleteTeacher = handleDeleteTeacher;
window.handleTeacherSearch = handleTeacherSearch;
