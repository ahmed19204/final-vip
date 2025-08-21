// Admin Courses Management
let coursesData = [];
let subjectsData = [];
let teachersData = [];
let currentEditId = null;

// Initialize courses management
document.addEventListener('DOMContentLoaded', function() {
    loadInitialData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Add course form submission
    const courseForm = document.getElementById('courseForm');
    if (courseForm) {
        courseForm.addEventListener('submit', handleAddCourse);
    }

    // Search functionality
    const searchInput = document.getElementById('courseSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleCourseSearch);
    }
}

// Load initial data from Supabase
async function loadInitialData() {
    try {
        showLoading('جاري تحميل البيانات...');
        
        // Load courses, subjects, and teachers in parallel
        const [coursesResult, subjectsResult, teachersResult] = await Promise.all([
            window.supabaseFunctions.getAllCourses(),
            window.supabaseFunctions.getAllSubjects(),
            window.supabaseFunctions.getAllTeachers()
        ]);
        
        if (coursesResult.success) {
            coursesData = coursesResult.data || [];
            displayCourses(coursesData);
        }
        
        if (subjectsResult.success) {
            subjectsData = subjectsResult.data || [];
            populateSubjectsDropdown();
        }
        
        if (teachersResult.success) {
            teachersData = teachersResult.data || [];
            populateTeachersDropdown();
        }
        
        showNotification('تم تحميل البيانات بنجاح', 'success');
    } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('خطأ في تحميل البيانات', 'error');
        // Fallback to empty arrays
        coursesData = [];
        subjectsData = [];
        teachersData = [];
        displayCourses([]);
    } finally {
        hideLoading();
    }
}

// Populate subjects dropdown
function populateSubjectsDropdown() {
    const subjectSelects = document.querySelectorAll('select[name="subject_id"]');
    subjectSelects.forEach(select => {
        select.innerHTML = '<option value="">اختر التخصص</option>';
        subjectsData.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            select.appendChild(option);
        });
    });
}

// Populate teachers dropdown
function populateTeachersDropdown() {
    const teacherSelects = document.querySelectorAll('select[name="teacher_id"]');
    teacherSelects.forEach(select => {
        select.innerHTML = '<option value="">اختر المدرس</option>';
        teachersData.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.name} - ${teacher.subject || 'غير محدد'}`;
            select.appendChild(option);
        });
    });
}

// Handle add course form submission
async function handleAddCourse(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const courseData = {
        title: formData.get('title'),
        description: formData.get('description'),
        subject_id: formData.get('subject_id') ? parseInt(formData.get('subject_id')) : null,
        teacher_id: formData.get('teacher_id') ? parseInt(formData.get('teacher_id')) : null,
        price: parseFloat(formData.get('price')) || 0.00,
        duration_hours: parseInt(formData.get('duration_hours')) || 0,
        level: formData.get('level'),
        requires_code: formData.get('requires_code') === 'on',
        status: 'active'
    };

    try {
        showLoading('جاري إضافة الكورس...');
        
        const result = await window.supabaseFunctions.addCourse(courseData);
        
        if (result.success) {
            showNotification('تم إضافة الكورس بنجاح', 'success');
            event.target.reset();
            closeModal('addCourseModal');
            loadInitialData(); // Reload data
        } else {
            showNotification(`خطأ في إضافة الكورس: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Exception adding course:', error);
        showNotification('خطأ في إضافة الكورس', 'error');
    } finally {
        hideLoading();
    }
}

// Handle edit course
async function handleEditCourse(courseId) {
    const course = coursesData.find(c => c.id === courseId);
    if (!course) return;

    currentEditId = courseId;
    
    // Populate form fields
    document.getElementById('editCourseTitle').value = course.title;
    document.getElementById('editCourseDescription').value = course.description || '';
    document.getElementById('editCourseSubjectId').value = course.subject_id || '';
    document.getElementById('editCourseTeacherId').value = course.teacher_id || '';
    document.getElementById('editCoursePrice').value = course.price || 0;
    document.getElementById('editCourseDuration').value = course.duration_hours || 0;
    document.getElementById('editCourseLevel').value = course.level || 'متوسط';
    document.getElementById('editCourseRequiresCode').checked = course.requires_code || false;
    document.getElementById('editCourseStatus').value = course.status || 'active';
    
    openModal('editCourseModal');
}

// Handle update course
async function handleUpdateCourse(event) {
    event.preventDefault();
    
    if (!currentEditId) return;
    
    const formData = new FormData(event.target);
    const courseData = {
        title: formData.get('title'),
        description: formData.get('description'),
        subject_id: formData.get('subject_id') ? parseInt(formData.get('subject_id')) : null,
        teacher_id: formData.get('teacher_id') ? parseInt(formData.get('teacher_id')) : null,
        price: parseFloat(formData.get('price')) || 0.00,
        duration_hours: parseInt(formData.get('duration_hours')) || 0,
        level: formData.get('level'),
        requires_code: formData.get('requires_code') === 'on',
        status: formData.get('status')
    };

    try {
        showLoading('جاري تحديث بيانات الكورس...');
        
        // Update in Supabase
        const { data, error } = await window.supabaseClient
            .from('courses')
            .update(courseData)
            .eq('id', currentEditId)
            .select();
        
        if (error) throw error;
        
        showNotification('تم تحديث بيانات الكورس بنجاح', 'success');
        closeModal('editCourseModal');
        currentEditId = null;
        loadInitialData(); // Reload data
    } catch (error) {
        console.error('Error updating course:', error);
        showNotification(`خطأ في تحديث بيانات الكورس: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Handle delete course
async function handleDeleteCourse(courseId) {
    if (!confirm('هل أنت متأكد من حذف هذا الكورس؟')) return;
    
    try {
        showLoading('جاري حذف الكورس...');
        
        const { error } = await window.supabaseClient
            .from('courses')
            .delete()
            .eq('id', courseId);
        
        if (error) throw error;
        
        showNotification('تم حذف الكورس بنجاح', 'success');
        loadInitialData(); // Reload data
    } catch (error) {
        console.error('Error deleting course:', error);
        showNotification(`خطأ في حذف الكورس: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Display courses in the table
function displayCourses(courses) {
    const tbody = document.querySelector('#coursesTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (courses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    لا يوجد كورسات حالياً
                </td>
            </tr>
        `;
        return;
    }
    
    courses.forEach(course => {
        const subject = subjectsData.find(s => s.id === course.subject_id);
        const teacher = teachersData.find(t => t.id === course.teacher_id);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="course-info">
                    <img src="${course.image_url || 'images/default-course.jpg'}" alt="${course.title}" class="course-avatar">
                    <div>
                        <div class="course-title">${course.title}</div>
                        <div class="course-subject">${subject ? subject.name : 'غير محدد'}</div>
                    </div>
                </div>
            </td>
            <td>${course.description ? course.description.substring(0, 50) + '...' : 'لا يوجد وصف'}</td>
            <td>${teacher ? teacher.name : 'غير محدد'}</td>
            <td>${course.price} جنيه</td>
            <td>${course.duration_hours} ساعة</td>
            <td>
                <span class="level-badge level-${course.level}">
                    ${getLevelText(course.level)}
                </span>
            </td>
            <td>
                <span class="status-badge status-${course.status}">
                    ${getStatusText(course.status)}
                </span>
            </td>
            <td>${course.student_count || 0}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="handleEditCourse(${course.id})" class="btn-edit" title="تعديل">
                        ✏️
                    </button>
                    <button onclick="handleDeleteCourse(${course.id})" class="btn-delete" title="حذف">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Handle course search
function handleCourseSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    if (!searchTerm) {
        displayCourses(coursesData);
        return;
    }
    
    const filteredCourses = coursesData.filter(course => 
        course.title.toLowerCase().includes(searchTerm) ||
        (course.description && course.description.toLowerCase().includes(searchTerm)) ||
        (course.subject_id && subjectsData.find(s => s.id === course.subject_id)?.name.toLowerCase().includes(searchTerm)) ||
        (course.teacher_id && teachersData.find(t => t.id === course.teacher_id)?.name.toLowerCase().includes(searchTerm))
    );
    
    displayCourses(filteredCourses);
}

// Get level text in Arabic
function getLevelText(level) {
    const levelMap = {
        'مبتدئ': 'مبتدئ',
        'متوسط': 'متوسط',
        'متقدم': 'متقدم'
    };
    return levelMap[level] || level;
}

// Get status text in Arabic
function getStatusText(status) {
    const statusMap = {
        'active': 'نشط',
        'inactive': 'غير نشط',
        'draft': 'مسودة'
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

// Show add course modal
function showAddCourseModal() {
    const modal = document.getElementById('courseModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    const modalTitle = document.getElementById('courseModalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'إضافة كورس جديد';
    }
    
    const form = document.getElementById('courseForm');
    if (form) {
        form.reset();
    }
    
    // Populate dropdowns
    populateSubjectsDropdown();
    populateTeachersDropdown();
}

// Close course modal
function closeCourseModal() {
    const modal = document.getElementById('courseModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// View course details
function viewCourse(courseId) {
    const course = coursesData.find(c => c.id === courseId);
    if (course) {
        showNotification(`عرض تفاصيل الكورس: ${course.title}`, 'info');
    }
}

// Edit course
function editCourse(courseId) {
    handleEditCourse(courseId);
}

// Delete course
function deleteCourse(courseId) {
    handleDeleteCourse(courseId);
}

// Filter courses
function filterCourses(filter) {
    let filteredCourses = coursesData;
    
    switch(filter) {
        case 'featured':
            filteredCourses = coursesData.filter(c => c.status === 'featured');
            break;
        case 'active':
            filteredCourses = coursesData.filter(c => c.status === 'active');
            break;
        case 'inactive':
            filteredCourses = coursesData.filter(c => c.status === 'inactive');
            break;
        case 'physics':
        case 'chemistry':
        case 'biology':
        case 'math':
            filteredCourses = coursesData.filter(c => c.subject && c.subject.toLowerCase() === filter);
            break;
    }
    
    displayCourses(filteredCourses);
}

// Search courses
function searchCourses(searchTerm) {
    if (!searchTerm) {
        displayCourses(coursesData);
        return;
    }
    
    const filtered = coursesData.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (course.teacher_name && course.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    displayCourses(filtered);
}

// Export functions for global use
window.handleEditCourse = handleEditCourse;
window.handleUpdateCourse = handleUpdateCourse;
window.handleDeleteCourse = handleDeleteCourse;
window.handleCourseSearch = handleCourseSearch;
window.showAddCourseModal = showAddCourseModal;
window.closeCourseModal = closeCourseModal;
window.viewCourse = viewCourse;
window.editCourse = editCourse;
window.deleteCourse = deleteCourse;
window.filterCourses = filterCourses;
window.searchCourses = searchCourses;
