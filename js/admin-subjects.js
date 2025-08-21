// Admin Subjects Management
let subjectsData = [];
let currentEditId = null;

// Initialize subjects management
document.addEventListener('DOMContentLoaded', function() {
    loadSubjectsData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Add subject form submission
    const addSubjectForm = document.getElementById('addSubjectForm');
    if (addSubjectForm) {
        addSubjectForm.addEventListener('submit', handleAddSubject);
    }

    // Search functionality
    const searchInput = document.getElementById('subjectSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleSubjectSearch);
    }
}

// Load subjects data from Supabase
async function loadSubjectsData() {
    try {
        showLoading('جاري تحميل بيانات التخصصات...');
        
        const result = await window.supabaseFunctions.getAllSubjects();
        
        if (result.success) {
            subjectsData = result.data || [];
            displaySubjects(subjectsData);
            showNotification('تم تحميل بيانات التخصصات بنجاح', 'success');
        } else {
            console.error('Error loading subjects:', result.error);
            showNotification('خطأ في تحميل بيانات التخصصات', 'error');
            // Fallback to empty array
            subjectsData = [];
            displaySubjects([]);
        }
    } catch (error) {
        console.error('Exception loading subjects:', error);
        showNotification('خطأ في تحميل بيانات التخصصات', 'error');
        subjectsData = [];
        displaySubjects([]);
    } finally {
        hideLoading();
    }
}

// Handle add subject form submission
async function handleAddSubject(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const subjectData = {
        name: formData.get('name'),
        description: formData.get('description'),
        grade_level: formData.get('grade_level'),
        difficulty_level: formData.get('difficulty_level'),
        status: 'active'
    };

    try {
        showLoading('جاري إضافة التخصص...');
        
        const result = await window.supabaseFunctions.addSubject(subjectData);
        
        if (result.success) {
            showNotification('تم إضافة التخصص بنجاح', 'success');
            event.target.reset();
            closeModal('addSubjectModal');
            loadSubjectsData(); // Reload data
        } else {
            showNotification(`خطأ في إضافة التخصص: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Exception adding subject:', error);
        showNotification('خطأ في إضافة التخصص', 'error');
    } finally {
        hideLoading();
    }
}

// Handle edit subject
async function handleEditSubject(subjectId) {
    const subject = subjectsData.find(s => s.id === subjectId);
    if (!subject) return;

    currentEditId = subjectId;
    
    // Populate form fields
    document.getElementById('editSubjectName').value = subject.name;
    document.getElementById('editSubjectDescription').value = subject.description || '';
    document.getElementById('editSubjectGradeLevel').value = subject.grade_level || '';
    document.getElementById('editSubjectDifficultyLevel').value = subject.difficulty_level || 'متوسط';
    document.getElementById('editSubjectStatus').value = subject.status || 'active';
    
    openModal('editSubjectModal');
}

// Handle update subject
async function handleUpdateSubject(event) {
    event.preventDefault();
    
    if (!currentEditId) return;
    
    const formData = new FormData(event.target);
    const subjectData = {
        name: formData.get('name'),
        description: formData.get('description'),
        grade_level: formData.get('grade_level'),
        difficulty_level: formData.get('difficulty_level'),
        status: formData.get('status')
    };

    try {
        showLoading('جاري تحديث بيانات التخصص...');
        
        // Update in Supabase
        const { data, error } = await window.supabaseClient
            .from('subjects')
            .update(subjectData)
            .eq('id', currentEditId)
            .select();
        
        if (error) throw error;
        
        showNotification('تم تحديث بيانات التخصص بنجاح', 'success');
        closeModal('editSubjectModal');
        currentEditId = null;
        loadSubjectsData(); // Reload data
    } catch (error) {
        console.error('Error updating subject:', error);
        showNotification(`خطأ في تحديث بيانات التخصص: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Handle delete subject
async function handleDeleteSubject(subjectId) {
    if (!confirm('هل أنت متأكد من حذف هذا التخصص؟')) return;
    
    try {
        showLoading('جاري حذف التخصص...');
        
        const { error } = await window.supabaseClient
            .from('subjects')
            .delete()
            .eq('id', subjectId);
        
        if (error) throw error;
        
        showNotification('تم حذف التخصص بنجاح', 'success');
        loadSubjectsData(); // Reload data
    } catch (error) {
        console.error('Error deleting subject:', error);
        showNotification(`خطأ في حذف التخصص: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Display subjects in the table
function displaySubjects(subjects) {
    const tbody = document.querySelector('#subjectsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (subjects.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    لا يوجد تخصصات حالياً
                </td>
            </tr>
        `;
        return;
    }
    
    subjects.forEach(subject => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="subject-info">
                    <img src="${subject.image_url || 'images/default-subject.jpg'}" alt="${subject.name}" class="subject-avatar">
                    <div>
                        <div class="subject-name">${subject.name}</div>
                        <div class="subject-grade">${subject.grade_level || 'غير محدد'}</div>
                    </div>
                </div>
            </td>
            <td>${subject.description ? subject.description.substring(0, 50) + '...' : 'لا يوجد وصف'}</td>
            <td>${subject.grade_level || 'غير محدد'}</td>
            <td>
                <span class="difficulty-badge difficulty-${subject.difficulty_level}">
                    ${getDifficultyText(subject.difficulty_level)}
                </span>
            </td>
            <td>${subject.total_courses || 0}</td>
            <td>
                <span class="status-badge status-${subject.status}">
                    ${getStatusText(subject.status)}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button onclick="handleEditSubject(${subject.id})" class="btn-edit" title="تعديل">
                        ✏️
                    </button>
                    <button onclick="handleDeleteSubject(${subject.id})" class="btn-delete" title="حذف">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Handle subject search
function handleSubjectSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    if (!searchTerm) {
        displaySubjects(subjectsData);
        return;
    }
    
    const filteredSubjects = subjectsData.filter(subject => 
        subject.name.toLowerCase().includes(searchTerm) ||
        (subject.description && subject.description.toLowerCase().includes(searchTerm)) ||
        (subject.grade_level && subject.grade_level.toLowerCase().includes(searchTerm)) ||
        (subject.difficulty_level && subject.difficulty_level.toLowerCase().includes(searchTerm))
    );
    
    displaySubjects(filteredSubjects);
}

// Get difficulty text in Arabic
function getDifficultyText(difficulty) {
    const difficultyMap = {
        'مبتدئ': 'مبتدئ',
        'متوسط': 'متوسط',
        'متقدم': 'متقدم'
    };
    return difficultyMap[difficulty] || difficulty;
}

// Get status text in Arabic
function getStatusText(status) {
    const statusMap = {
        'active': 'نشط',
        'inactive': 'غير نشط'
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

// Show add subject modal
function showAddSubjectModal() {
    const modal = document.getElementById('subjectModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    const modalTitle = document.getElementById('subjectModalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'إضافة تخصص جديد';
    }
    
    const form = document.getElementById('subjectForm');
    if (form) {
        form.reset();
    }
}

// Close subject modal
function closeSubjectModal() {
    const modal = document.getElementById('subjectModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// View subject details
function viewSubject(subjectId) {
    const subject = subjectsData.find(s => s.id === subjectId);
    if (subject) {
        showNotification(`عرض تفاصيل التخصص: ${subject.name}`, 'info');
    }
}

// Edit subject
function editSubject(subjectId) {
    handleEditSubject(subjectId);
}

// Delete subject
function deleteSubject(subjectId) {
    handleDeleteSubject(subjectId);
}

// Filter subjects
function filterSubjects(filter) {
    let filteredSubjects = subjectsData;
    
    switch(filter) {
        case 'active':
            filteredSubjects = subjectsData.filter(s => s.status === 'active');
            break;
        case 'inactive':
            filteredSubjects = subjectsData.filter(s => s.status === 'inactive');
            break;
        case 'beginner':
        case 'intermediate':
        case 'advanced':
            filteredSubjects = subjectsData.filter(s => s.difficulty_level === filter);
            break;
    }
    
    displaySubjects(filteredSubjects);
}

// Search subjects
function searchSubjects(searchTerm) {
    if (!searchTerm) {
        displaySubjects(subjectsData);
        return;
    }
    
    const filtered = subjectsData.filter(subject => 
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subject.description && subject.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    displaySubjects(filtered);
}

// Export functions for global use
window.handleEditSubject = handleEditSubject;
window.handleUpdateSubject = handleUpdateSubject;
window.handleDeleteSubject = handleDeleteSubject;
window.handleSubjectSearch = handleSubjectSearch;
window.showAddSubjectModal = showAddSubjectModal;
window.closeSubjectModal = closeSubjectModal;
window.viewSubject = viewSubject;
window.editSubject = editSubject;
window.deleteSubject = deleteSubject;
window.filterSubjects = filterSubjects;
window.searchSubjects = searchSubjects;
