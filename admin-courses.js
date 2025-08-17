// Admin Courses Management JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeCoursesPage();
});

// Course Management System
const courseManager = {
    currentCourseId: null,
    
    // Show add course modal
    showAddModal: function() {
        this.currentCourseId = null;
        document.getElementById('courseModalTitle').textContent = 'إضافة كورس جديد';
        document.getElementById('courseForm').reset();
        document.getElementById('courseModal').style.display = 'flex';
        this.resetForm();
    },
    
    // Show edit course modal
    showEditModal: function(courseId) {
        this.currentCourseId = courseId;
        document.getElementById('courseModalTitle').textContent = 'تعديل الكورس';
        document.getElementById('courseModal').style.display = 'flex';
        this.loadCourseData(courseId);
    },
    
    // Close modal
    closeModal: function() {
        document.getElementById('courseModal').style.display = 'none';
        this.resetForm();
    },
    
    // Reset form
    resetForm: function() {
        document.getElementById('courseImagePreview').style.display = 'none';
        document.getElementById('courseImagePreview').innerHTML = '';
    },
    
    // Handle course image upload
    handleImageUpload: function(input) {
        const file = input.files[0];
        if (!file) return;
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            showNotification('نوع الصورة غير مدعوم. يرجى اختيار صورة صالحة.', 'error');
            input.value = '';
            return;
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showNotification('حجم الصورة كبير جداً. الحد الأقصى 5 ميجا بايت.', 'error');
            input.value = '';
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('courseImagePreview');
            preview.innerHTML = `
                <img src="${e.target.result}" alt="معاينة صورة الكورس" style="max-width: 300px; max-height: 200px; border-radius: 8px;">
                <div style="margin-top: 0.5rem; color: #cccccc; font-size: 14px;">
                    اسم الملف: ${file.name}<br>
                    الحجم: ${formatFileSize(file.size)}
                </div>
            `;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    },
    
    // Load course data for editing
    loadCourseData: function(courseId) {
        // TODO: تحميل بيانات الكورس من قاعدة البيانات
        console.log('تحميل بيانات الكورس:', courseId);
        
        // إعادة تعيين النموذج
        document.getElementById('courseForm').reset();
        });
    },
    
    // Save course
    saveCourse: function(formData) {
        const courseData = {
            name: formData.get('name'),
            subject: formData.get('subject'),
            teacher: formData.get('teacher'),
            price: parseFloat(formData.get('price')),
            description: formData.get('description'),
            prerequisites: formData.get('prerequisites'),
            materials: formData.get('materials'),
            duration: parseInt(formData.get('duration')),
            lessons: parseInt(formData.get('lessons')),
            level: formData.get('level'),
            status: formData.get('status'),
            tags: formData.get('tags'),
            enrolledStudents: 0,
            rating: 0,
            createdAt: new Date().toISOString()
        };
        
        // Validate required fields
        if (!courseData.name || !courseData.subject || !courseData.teacher || !courseData.description) {
            showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }
        
        if (courseData.price < 0) {
            showNotification('السعر يجب أن يكون رقماً موجباً', 'error');
            return;
        }
        
        if (this.currentCourseId) {
            // Update existing course
            adminData.update('courses', this.currentCourseId, courseData);
            showNotification('تم تحديث الكورس بنجاح!', 'success');
        } else {
            // Add new course
            adminData.add('courses', courseData);
            showNotification('تم إضافة الكورس بنجاح!', 'success');
        }
        
        this.closeModal();
        this.refreshCourseTable();
        this.updateFrontendCourses(courseData);
    },
    
    // Update frontend courses display
    updateFrontendCourses: function(courseData) {
        // In a real application, this would sync with the frontend
        console.log('Updating frontend with new course:', courseData);
        
        // Simulate frontend update
        if (courseData.status === 'featured' || courseData.status === 'active') {
            showNotification('تم تحديث الصفحة الرئيسية بالكورس الجديد', 'info');
        }
    },
    
    // Delete course
    deleteCourse: function(courseId) {
        if (confirm('هل أنت متأكد من حذف هذا الكورس؟ سيتم حذف جميع البيانات المرتبطة به.')) {
            adminData.delete('courses', courseId);
            showNotification('تم حذف الكورس بنجاح!', 'success');
            this.refreshCourseTable();
        }
    },
    
    // View course details
    viewCourse: function(courseId) {
        // In a real application, this would open a detailed view
        showNotification('عرض تفاصيل الكورس - هذه الميزة ستكون متاحة قريباً', 'info');
    },
    
    // Refresh course table
    refreshCourseTable: function() {
        // In a real application, this would reload the table data
        console.log('Refreshing course table...');
    },
    
    // Filter courses
    filterCourses: function(filterType) {
        const table = document.getElementById('coursesTable');
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            if (filterType === 'all') {
                row.style.display = '';
            } else {
                const subjectCell = row.cells[2].textContent.toLowerCase();
                const statusCell = row.cells[7].textContent.toLowerCase();
                
                let shouldShow = false;
                
                switch(filterType) {
                    case 'featured':
                        shouldShow = statusCell.includes('مميز');
                        break;
                    case 'active':
                        shouldShow = statusCell.includes('نشط') && !statusCell.includes('مميز');
                        break;
                    case 'inactive':
                        shouldShow = statusCell.includes('غير نشط');
                        break;
                    case 'physics':
                        shouldShow = subjectCell.includes('فيزياء');
                        break;
                    case 'chemistry':
                        shouldShow = subjectCell.includes('كيمياء');
                        break;
                    case 'biology':
                        shouldShow = subjectCell.includes('أحياء');
                        break;
                    case 'math':
                        shouldShow = subjectCell.includes('رياضيات');
                        break;
                }
                
                row.style.display = shouldShow ? '' : 'none';
            }
        });
    },
    
    // Search courses
    searchCourses: function(searchTerm) {
        const table = document.getElementById('coursesTable');
        const rows = table.querySelectorAll('tbody tr');
        const term = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const name = row.cells[1].textContent.toLowerCase();
            const subject = row.cells[2].textContent.toLowerCase();
            const teacher = row.cells[3].textContent.toLowerCase();
            
            const shouldShow = name.includes(term) || 
                             subject.includes(term) || 
                             teacher.includes(term);
            
            row.style.display = shouldShow ? '' : 'none';
        });
    },
    
    // Bulk operations
    bulkDelete: function(courseIds) {
        if (confirm(`هل أنت متأكد من حذف ${courseIds.length} كورس؟`)) {
            courseIds.forEach(id => {
                adminData.delete('courses', id);
            });
            showNotification(`تم حذف ${courseIds.length} كورس بنجاح!`, 'success');
            this.refreshCourseTable();
        }
    },
    
    bulkUpdateStatus: function(courseIds, newStatus) {
        courseIds.forEach(id => {
            adminData.update('courses', id, { status: newStatus });
        });
        showNotification(`تم تحديث حالة ${courseIds.length} كورس بنجاح!`, 'success');
        this.refreshCourseTable();
    },
    
    // Export courses data
    exportCourses: function(format = 'json') {
        const courses = adminData.get('courses');
        
        if (format === 'json') {
            const dataStr = JSON.stringify(courses, null, 2);
            this.downloadFile(dataStr, 'courses.json', 'application/json');
        } else if (format === 'csv') {
            const csvData = this.convertToCSV(courses);
            this.downloadFile(csvData, 'courses.csv', 'text/csv');
        }
        
        showNotification(`تم تصدير ${courses.length} كورس بنجاح!`, 'success');
    },
    
    // Convert data to CSV
    convertToCSV: function(data) {
        if (!data.length) return '';
        
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        
        const csvRows = data.map(row => {
            return headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(',');
        });
        
        return [csvHeaders, ...csvRows].join('\n');
    },
    
    // Download file
    downloadFile: function(data, filename, type) {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

// Initialize courses page
function initializeCoursesPage() {
    // Set up form submission
    const courseForm = document.getElementById('courseForm');
    if (courseForm) {
        courseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            courseManager.saveCourse(formData);
        });
    }
    
    // Set up image upload handler
    const imageInput = document.getElementById('courseImage');
    if (imageInput) {
        imageInput.addEventListener('change', function() {
            courseManager.handleImageUpload(this);
        });
    }
    
    // Set up drag and drop for image upload
    const uploadLabel = document.querySelector('label[for="courseImage"]');
    if (uploadLabel) {
        uploadLabel.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#ff4d4d';
            this.style.background = 'rgba(255, 77, 77, 0.1)';
        });
        
        uploadLabel.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = 'rgba(255, 77, 77, 0.3)';
            this.style.background = 'rgba(255, 77, 77, 0.05)';
        });
        
        uploadLabel.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = 'rgba(255, 77, 77, 0.3)';
            this.style.background = 'rgba(255, 77, 77, 0.05)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const imageInput = document.getElementById('courseImage');
                imageInput.files = files;
                courseManager.handleImageUpload(imageInput);
            }
        });
    }
    
    // Add bulk selection functionality
    addBulkSelection();
}

// Add bulk selection functionality
function addBulkSelection() {
    const table = document.getElementById('coursesTable');
    if (!table) return;
    
    // Add select all checkbox to header
    const headerRow = table.querySelector('thead tr');
    const selectAllTh = document.createElement('th');
    selectAllTh.innerHTML = '<input type="checkbox" id="selectAllCourses" onchange="toggleSelectAll(this)">';
    headerRow.insertBefore(selectAllTh, headerRow.firstChild);
    
    // Add checkboxes to each row
    const bodyRows = table.querySelectorAll('tbody tr');
    bodyRows.forEach((row, index) => {
        const selectTd = document.createElement('td');
        selectTd.innerHTML = `<input type="checkbox" class="course-select" value="${index + 1}" onchange="updateBulkActions()">`;
        row.insertBefore(selectTd, row.firstChild);
    });
    
    // Add bulk actions toolbar
    const tableContainer = table.closest('.admin-table-container');
    const bulkToolbar = document.createElement('div');
    bulkToolbar.id = 'bulkToolbar';
    bulkToolbar.style.display = 'none';
    bulkToolbar.style.cssText = `
        background: rgba(255, 77, 77, 0.1);
        border: 1px solid rgba(255, 77, 77, 0.3);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        display: flex;
        gap: 1rem;
        align-items: center;
    `;
    bulkToolbar.innerHTML = `
        <span style="color: #ffffff;">تم تحديد <span id="selectedCount">0</span> كورس</span>
        <button class="admin-btn admin-btn-danger admin-action-btn" onclick="bulkDeleteCourses()">حذف المحدد</button>
        <button class="admin-btn admin-btn-secondary admin-action-btn" onclick="bulkUpdateStatus('active')">تفعيل</button>
        <button class="admin-btn admin-btn-secondary admin-action-btn" onclick="bulkUpdateStatus('inactive')">إلغاء تفعيل</button>
        <button class="admin-btn admin-btn-primary admin-action-btn" onclick="bulkUpdateStatus('featured')">جعل مميز</button>
    `;
    tableContainer.insertBefore(bulkToolbar, table);
}

// Global functions for HTML onclick handlers
function showAddCourseModal() {
    courseManager.showAddModal();
}

function closeCourseModal() {
    courseManager.closeModal();
}

function editCourse(courseId) {
    courseManager.showEditModal(courseId);
}

function deleteCourse(courseId) {
    courseManager.deleteCourse(courseId);
}

function viewCourse(courseId) {
    courseManager.viewCourse(courseId);
}

function handleCourseImageUpload(input) {
    courseManager.handleImageUpload(input);
}

function filterCourses(filterType) {
    courseManager.filterCourses(filterType);
}

function searchCourses(searchTerm) {
    courseManager.searchCourses(searchTerm);
}

// Bulk selection functions
function toggleSelectAll(checkbox) {
    const courseCheckboxes = document.querySelectorAll('.course-select');
    courseCheckboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
    updateBulkActions();
}

function updateBulkActions() {
    const selectedCheckboxes = document.querySelectorAll('.course-select:checked');
    const bulkToolbar = document.getElementById('bulkToolbar');
    const selectedCount = document.getElementById('selectedCount');
    
    if (selectedCheckboxes.length > 0) {
        bulkToolbar.style.display = 'flex';
        selectedCount.textContent = selectedCheckboxes.length;
    } else {
        bulkToolbar.style.display = 'none';
    }
}

function bulkDeleteCourses() {
    const selectedCheckboxes = document.querySelectorAll('.course-select:checked');
    const courseIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
    courseManager.bulkDelete(courseIds);
}

function bulkUpdateStatus(newStatus) {
    const selectedCheckboxes = document.querySelectorAll('.course-select:checked');
    const courseIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
    courseManager.bulkUpdateStatus(courseIds, newStatus);
}

// Course validation utilities
const courseUtils = {
    // Validate course data
    validateCourse: function(courseData) {
        const errors = [];
        
        if (!courseData.name || courseData.name.length < 3) {
            errors.push('اسم الكورس يجب أن يكون 3 أحرف على الأقل');
        }
        
        if (!courseData.description || courseData.description.length < 20) {
            errors.push('وصف الكورس يجب أن يكون 20 حرف على الأقل');
        }
        
        if (courseData.price < 0) {
            errors.push('السعر يجب أن يكون رقماً موجباً');
        }
        
        if (courseData.duration && courseData.duration < 1) {
            errors.push('مدة الكورس يجب أن تكون ساعة واحدة على الأقل');
        }
        
        if (courseData.lessons && courseData.lessons < 1) {
            errors.push('عدد الدروس يجب أن يكون درس واحد على الأقل');
        }
        
        return errors;
    },
    
    // Generate course slug
    generateSlug: function(courseName) {
        return courseName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-أ-ي]/g, '');
    },
    
    // Calculate course rating
    calculateRating: function(reviews) {
        if (!reviews || !reviews.length) return 0;
        
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        return Math.round((totalRating / reviews.length) * 10) / 10;
    },
    
    // Format course price
    formatPrice: function(price) {
        if (price === 0) return 'مجاني';
        return `${price.toLocaleString('ar-EG')} جنيه`;
    }
};

// Export course utilities
window.courseUtils = courseUtils;
