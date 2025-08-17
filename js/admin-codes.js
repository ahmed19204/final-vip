// Admin Access Codes Management
let accessCodesData = [];
let coursesData = [];
let currentEditId = null;

// Initialize access codes management
document.addEventListener('DOMContentLoaded', function() {
    loadInitialData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Add code form submission
    const addCodeForm = document.getElementById('addCodeForm');
    if (addCodeForm) {
        addCodeForm.addEventListener('submit', handleAddCode);
    }

    // Search functionality
    const searchInput = document.getElementById('codeSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleCodeSearch);
    }
}

// Load initial data from Supabase
async function loadInitialData() {
    try {
        showLoading('جاري تحميل البيانات...');
        
        // Load access codes and courses in parallel
        const [codesResult, coursesResult] = await Promise.all([
            window.supabaseFunctions.getAllAccessCodes(),
            window.supabaseFunctions.getAllCourses()
        ]);
        
        if (codesResult.success) {
            accessCodesData = codesResult.data || [];
            displayAccessCodes(accessCodesData);
        }
        
        if (coursesResult.success) {
            coursesData = coursesResult.data || [];
            populateCoursesDropdown();
        }
        
        showNotification('تم تحميل البيانات بنجاح', 'success');
    } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('خطأ في تحميل البيانات', 'error');
        // Fallback to empty arrays
        accessCodesData = [];
        coursesData = [];
        displayAccessCodes([]);
    } finally {
        hideLoading();
    }
}

// Populate courses dropdown
function populateCoursesDropdown() {
    const courseSelects = document.querySelectorAll('select[name="course_id"]');
    courseSelects.forEach(select => {
        select.innerHTML = '<option value="">اختر الكورس</option>';
        coursesData.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.title} - ${course.price} جنيه`;
            select.appendChild(option);
        });
    });
}

// Handle add code form submission
async function handleAddCode(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const codeData = {
        code: formData.get('code'),
        course_id: parseInt(formData.get('course_id')),
        description: formData.get('description'),
        max_uses: parseInt(formData.get('max_uses')) || 1,
        expires_at: formData.get('expires_at') ? new Date(formData.get('expires_at')).toISOString() : null,
        is_active: true
    };

    try {
        showLoading('جاري إنشاء كود الوصول...');
        
        const result = await window.supabaseFunctions.addAccessCode(codeData);
        
        if (result.success) {
            showNotification('تم إنشاء كود الوصول بنجاح', 'success');
            event.target.reset();
            closeModal('addCodeModal');
            loadInitialData(); // Reload data
        } else {
            showNotification(`خطأ في إنشاء كود الوصول: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Exception adding access code:', error);
        showNotification('خطأ في إنشاء كود الوصول', 'error');
    } finally {
        hideLoading();
    }
}

// Handle edit code
async function handleEditCode(codeId) {
    const code = accessCodesData.find(c => c.id === codeId);
    if (!code) return;

    currentEditId = codeId;
    
    // Populate form fields
    document.getElementById('editCodeCode').value = code.code;
    document.getElementById('editCodeCourseId').value = code.course_id || '';
    document.getElementById('editCodeDescription').value = code.description || '';
    document.getElementById('editCodeMaxUses').value = code.max_uses || 1;
    document.getElementById('editCodeCurrentUses').value = code.current_uses || 0;
    document.getElementById('editCodeExpiresAt').value = code.expires_at ? new Date(code.expires_at).toISOString().split('T')[0] : '';
    document.getElementById('editCodeIsActive').checked = code.is_active;
    
    openModal('editCodeModal');
}

// Handle update code
async function handleUpdateCode(event) {
    event.preventDefault();
    
    if (!currentEditId) return;
    
    const formData = new FormData(event.target);
    const codeData = {
        code: formData.get('code'),
        course_id: parseInt(formData.get('course_id')),
        description: formData.get('description'),
        max_uses: parseInt(formData.get('max_uses')) || 1,
        expires_at: formData.get('expires_at') ? new Date(formData.get('expires_at')).toISOString() : null,
        is_active: formData.get('is_active') === 'on'
    };

    try {
        showLoading('جاري تحديث كود الوصول...');
        
        // Update in Supabase
        const { data, error } = await window.supabaseClient
            .from('access_codes')
            .update(codeData)
            .eq('id', currentEditId)
            .select();
        
        if (error) throw error;
        
        showNotification('تم تحديث كود الوصول بنجاح', 'success');
        closeModal('editCodeModal');
        currentEditId = null;
        loadInitialData(); // Reload data
    } catch (error) {
        console.error('Error updating access code:', error);
        showNotification(`خطأ في تحديث كود الوصول: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Handle delete code
async function handleDeleteCode(codeId) {
    if (!confirm('هل أنت متأكد من حذف هذا كود الوصول؟')) return;
    
    try {
        showLoading('جاري حذف كود الوصول...');
        
        const { error } = await window.supabaseClient
            .from('access_codes')
            .delete()
            .eq('id', codeId);
        
        if (error) throw error;
        
        showNotification('تم حذف كود الوصول بنجاح', 'success');
        loadInitialData(); // Reload data
    } catch (error) {
        console.error('Error deleting access code:', error);
        showNotification(`خطأ في حذف كود الوصول: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Generate random code
function generateRandomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const codeInput = document.getElementById('code');
    if (codeInput) {
        codeInput.value = result;
    }
}

// Display access codes in the table
function displayAccessCodes(codes) {
    const tbody = document.querySelector('#codesTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (codes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">
                    لا يوجد أكواد وصول حالياً
                </td>
            </tr>
        `;
        return;
    }
    
    codes.forEach(code => {
        const course = coursesData.find(c => c.id === code.course_id);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="code-info">
                    <div class="code-text">${code.code}</div>
                    <div class="code-description">${code.description || 'لا يوجد وصف'}</div>
                </div>
            </td>
            <td>${course ? course.title : 'غير محدد'}</td>
            <td>${code.current_uses || 0} / ${code.max_uses}</td>
            <td>
                <span class="status-badge status-${code.is_active ? 'active' : 'inactive'}">
                    ${code.is_active ? 'نشط' : 'غير نشط'}
                </span>
            </td>
            <td>${code.expires_at ? new Date(code.expires_at).toLocaleDateString('ar-EG') : 'لا ينتهي'}</td>
            <td>${code.created_at ? new Date(code.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="handleEditCode(${code.id})" class="btn-edit" title="تعديل">
                        ✏️
                    </button>
                    <button onclick="handleDeleteCode(${code.id})" class="btn-delete" title="حذف">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Handle code search
function handleCodeSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    if (!searchTerm) {
        displayAccessCodes(accessCodesData);
        return;
    }
    
    const filteredCodes = accessCodesData.filter(code => 
        code.code.toLowerCase().includes(searchTerm) ||
        (code.description && code.description.toLowerCase().includes(searchTerm)) ||
        (code.course_id && coursesData.find(c => c.id === code.course_id)?.title.toLowerCase().includes(searchTerm))
    );
    
    displayAccessCodes(filteredCodes);
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
window.handleEditCode = handleEditCode;
window.handleUpdateCode = handleUpdateCode;
window.handleDeleteCode = handleDeleteCode;
window.handleCodeSearch = handleCodeSearch;
window.generateRandomCode = generateRandomCode;
