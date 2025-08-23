// Enhanced Admin Codes Management System
// Integrated with courses, videos, subjects, and payment system

class EnhancedCodesManager {
    constructor() {
        this.codesData = [];
        this.coursesData = [];
        this.videosData = [];
        this.subjectsData = [];
        this.currentEditId = null;
        this.init();
    }

    async init() {
        await this.loadInitialData();
        this.setupEventListeners();
        this.setupFormValidation();
        console.log('🎫 Enhanced Codes Manager initialized');
    }

    // Load all required data
    async loadInitialData() {
        try {
            showLoading('جاري تحميل البيانات...');
            
            const [codesResult, coursesResult, videosResult, subjectsResult] = await Promise.all([
                window.supabaseFunctions.getAllAccessCodes(),
                window.supabaseFunctions.getAllCourses(),
                window.supabaseFunctions.getAllVideos(),
                window.supabaseFunctions.getAllSubjects()
            ]);
            
            if (codesResult.success) {
                this.codesData = codesResult.data || [];
                this.displayCodes(this.codesData);
            }
            
            if (coursesResult.success) {
                this.coursesData = coursesResult.data || [];
                this.populateCoursesDropdown();
            }
            
            if (videosResult.success) {
                this.videosData = videosResult.data || [];
                this.populateVideosDropdown();
            }
            
            if (subjectsResult.success) {
                this.subjectsData = subjectsResult.data || [];
                this.populateSubjectsDropdown();
            }
            
            this.updateStatistics();
            showNotification('تم تحميل البيانات بنجاح', 'success');
        } catch (error) {
            console.error('Error loading initial data:', error);
            showNotification('خطأ في تحميل البيانات', 'error');
        } finally {
            hideLoading();
        }
    }

    // Setup event listeners
    setupEventListeners() {
        const codeForm = document.getElementById('codeForm');
        if (codeForm) {
            codeForm.addEventListener('submit', (e) => this.handleAddCode(e));
        }

        // Real-time code preview
        const codeValue = document.getElementById('codeValue');
        const codeType = document.getElementById('codeType');
        
        if (codeValue) {
            codeValue.addEventListener('input', () => this.updatePreview());
        }
        
        if (codeType) {
            codeType.addEventListener('change', () => this.updatePreview());
        }
    }

    // Setup form validation
    setupFormValidation() {
        const form = document.getElementById('codeForm');
        if (!form) return;

        // Add validation styles
        const style = document.createElement('style');
        style.textContent = `
            .form-error {
                border-color: #dc3545 !important;
                box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
            }
            
            .error-message {
                color: #dc3545;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: block;
            }
            
            .success-message {
                color: #28a745;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: block;
            }
        `;
        document.head.appendChild(style);
    }

    // Populate dropdowns
    populateCoursesDropdown() {
        const courseSelect = document.getElementById('codeCourse');
        if (!courseSelect) return;

        courseSelect.innerHTML = '<option value="">اختر الكورس</option>';
        this.coursesData.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.title} - ${course.subjects?.name || 'غير محدد'}`;
            courseSelect.appendChild(option);
        });
    }

    populateVideosDropdown() {
        const videoSelect = document.getElementById('codeVideo');
        if (!videoSelect) return;

        videoSelect.innerHTML = '<option value="">اختر الفيديو</option>';
        this.videosData.forEach(video => {
            const option = document.createElement('option');
            option.value = video.id;
            option.textContent = `${video.title} - ${video.courses?.title || 'غير محدد'}`;
            videoSelect.appendChild(option);
        });
    }

    populateSubjectsDropdown() {
        const subjectSelect = document.getElementById('codeSubject');
        if (!subjectSelect) return;

        subjectSelect.innerHTML = '<option value="">اختر التخصص</option>';
        this.subjectsData.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            subjectSelect.appendChild(option);
        });
    }

    // Handle code type change
    handleCodeTypeChange() {
        const codeType = document.getElementById('codeType').value;
        const courseSelection = document.getElementById('courseSelection');
        const videoSelection = document.getElementById('videoSelection');
        const subjectSelection = document.getElementById('subjectSelection');
        const discountGroup = document.getElementById('discountGroup');

        // Hide all selections first
        [courseSelection, videoSelection, subjectSelection, discountGroup].forEach(el => {
            if (el) el.style.display = 'none';
        });

        // Show relevant selection based on code type
        switch (codeType) {
            case 'course':
                if (courseSelection) courseSelection.style.display = 'block';
                break;
            case 'video':
                if (videoSelection) videoSelection.style.display = 'block';
                break;
            case 'subject':
                if (subjectSelection) subjectSelection.style.display = 'block';
                break;
            case 'discount':
                if (discountGroup) discountGroup.style.display = 'block';
                break;
        }

        this.updatePreview();
    }

    // Generate random code
    generateRandomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const codeLength = 8;
        let result = '';
        
        for (let i = 0; i < codeLength; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Add prefix based on type
        const codeType = document.getElementById('codeType').value;
        const prefixes = {
            'course': 'CRS',
            'video': 'VID',
            'subject': 'SUB',
            'premium': 'VIP',
            'discount': 'DSC'
        };
        
        const prefix = prefixes[codeType] || 'GEN';
        const finalCode = `${prefix}-${result}`;
        
        document.getElementById('codeValue').value = finalCode;
        this.updatePreview();
        
        showNotification(`تم إنشاء الكود: ${finalCode}`, 'success');
    }

    // Update code preview
    updatePreview() {
        const preview = document.getElementById('codePreview');
        const previewCode = document.getElementById('previewCodeValue');
        const previewDetails = document.getElementById('previewDetails');
        
        if (!preview || !previewCode || !previewDetails) return;

        const codeValue = document.getElementById('codeValue').value;
        const codeType = document.getElementById('codeType').value;
        const maxUses = document.getElementById('codeUsageLimit').value;
        const expiresAt = document.getElementById('codeExpiry').value;
        
        if (!codeValue || !codeType) {
            preview.style.display = 'none';
            return;
        }

        preview.style.display = 'block';
        previewCode.textContent = codeValue;

        const typeNames = {
            'course': 'كورس كامل',
            'video': 'فيديو واحد',
            'subject': 'تخصص كامل',
            'premium': 'عضوية مميزة',
            'discount': 'خصم مالي'
        };

        const usageText = maxUses ? `${maxUses} مرة` : 'غير محدود';
        const expiryText = expiresAt ? new Date(expiresAt).toLocaleDateString('ar-EG') : 'غير محدود';

        previewDetails.innerHTML = `
            <p><strong>النوع:</strong> ${typeNames[codeType] || codeType}</p>
            <p><strong>الاستخدام:</strong> ${usageText}</p>
            <p><strong>الصلاحية:</strong> ${expiryText}</p>
        `;
    }

    // Handle add code form submission
    async handleAddCode(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        
        // Get form values
        const code = document.getElementById('codeValue').value.trim();
        const codeType = document.getElementById('codeType').value;
        const description = document.getElementById('codeDescription').value.trim();
        const maxUses = document.getElementById('codeUsageLimit').value;
        const expiresAt = document.getElementById('codeExpiry').value;
        const status = document.getElementById('codeStatus').value;
        
        // Validation
        if (!code) {
            this.showFieldError('codeValue', 'يرجى إدخال كود الوصول');
            return;
        }
        
        if (!codeType) {
            this.showFieldError('codeType', 'يرجى اختيار نوع الكود');
            return;
        }

        // Check for duplicate code
        if (this.codesData.some(existingCode => existingCode.code === code)) {
            this.showFieldError('codeValue', 'هذا الكود موجود بالفعل');
            return;
        }

        // Get related content ID
        let relatedId = null;
        switch (codeType) {
            case 'course':
                relatedId = document.getElementById('codeCourse').value;
                break;
            case 'video':
                relatedId = document.getElementById('codeVideo').value;
                break;
            case 'subject':
                relatedId = document.getElementById('codeSubject').value;
                break;
        }

        const codeData = {
            code: code,
            description: description || null,
            max_uses: maxUses ? parseInt(maxUses) : null,
            current_uses: 0,
            expires_at: expiresAt || null,
            status: status || 'active',
            code_type: codeType,
            course_id: codeType === 'course' ? relatedId : null,
            video_id: codeType === 'video' ? relatedId : null,
            subject_id: codeType === 'subject' ? relatedId : null,
            discount_percentage: codeType === 'discount' ? document.getElementById('discountValue').value : null,
            requires_payment: document.getElementById('requirePayment')?.checked || false,
            single_user_only: document.getElementById('singleUser')?.checked || false,
            auto_expire: document.getElementById('autoExpire')?.checked || false
        };

        try {
            showLoading('جاري إنشاء الكود...');
            
            const result = await window.supabaseFunctions.addAccessCode(codeData);
            
            if (result.success) {
                showNotification('تم إنشاء الكود بنجاح', 'success');
                event.target.reset();
                this.closeCodeModal();
                await this.loadInitialData(); // Reload data
                
                // Notify other tabs about content update
                localStorage.setItem('vip-content-updated', Date.now());
            } else {
                showNotification(`خطأ في إنشاء الكود: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Exception creating code:', error);
            showNotification('خطأ في إنشاء الكود', 'error');
        } finally {
            hideLoading();
        }
    }

    // Display codes in table
    displayCodes(codes) {
        const tbody = document.querySelector('#codesTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (codes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        لا توجد أكواد حالياً
                    </td>
                </tr>
            `;
            return;
        }
        
        codes.forEach(code => {
            const relatedContent = this.getRelatedContent(code);
            const usagePercentage = code.max_uses ? (code.current_uses / code.max_uses) * 100 : 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="code-info">
                        <div class="code-value">${code.code}</div>
                        <div class="code-type">${this.getCodeTypeText(code.code_type)}</div>
                    </div>
                </td>
                <td>${relatedContent}</td>
                <td>${code.description || 'لا يوجد وصف'}</td>
                <td>
                    <div class="usage-info">
                        <div class="usage-text">${code.current_uses}/${code.max_uses || '∞'}</div>
                        ${code.max_uses ? `<div class="usage-bar"><div class="usage-progress" style="width: ${usagePercentage}%"></div></div>` : ''}
                    </div>
                </td>
                <td>${code.expires_at ? new Date(code.expires_at).toLocaleDateString('ar-EG') : 'غير محدود'}</td>
                <td>
                    <span class="status-badge status-${code.status}">
                        ${this.getStatusText(code.status)}
                    </span>
                </td>
                <td>${code.created_at ? new Date(code.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="codesManager.copyCode('${code.code}')" class="btn-copy" title="نسخ الكود">
                            📋
                        </button>
                        <button onclick="codesManager.editCode(${code.id})" class="btn-edit" title="تعديل">
                            ✏️
                        </button>
                        <button onclick="codesManager.deleteCode(${code.id})" class="btn-delete" title="حذف">
                            🗑️
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Get related content text
    getRelatedContent(code) {
        if (code.course_id) {
            const course = this.coursesData.find(c => c.id === code.course_id);
            return course ? `📚 ${course.title}` : 'كورس محذوف';
        }
        
        if (code.video_id) {
            const video = this.videosData.find(v => v.id === code.video_id);
            return video ? `🎥 ${video.title}` : 'فيديو محذوف';
        }
        
        if (code.subject_id) {
            const subject = this.subjectsData.find(s => s.id === code.subject_id);
            return subject ? `📖 ${subject.name}` : 'تخصص محذوف';
        }
        
        return code.code_type === 'premium' ? '⭐ عضوية مميزة' : 
               code.code_type === 'discount' ? '💰 خصم مالي' : 'عام';
    }

    // Get code type text
    getCodeTypeText(type) {
        const types = {
            'course': 'كورس',
            'video': 'فيديو',
            'subject': 'تخصص',
            'premium': 'مميز',
            'discount': 'خصم'
        };
        return types[type] || type;
    }

    // Get status text
    getStatusText(status) {
        const statusMap = {
            'active': 'نشط',
            'inactive': 'غير نشط',
            'expired': 'منتهي الصلاحية'
        };
        return statusMap[status] || status;
    }

    // Update statistics
    updateStatistics() {
        const totalCodes = this.codesData.length;
        const activeCodes = this.codesData.filter(c => c.status === 'active').length;
        const usedCodes = this.codesData.filter(c => c.current_uses > 0).length;
        const expiredCodes = this.codesData.filter(c => 
            c.expires_at && new Date(c.expires_at) < new Date()
        ).length;

        // Update UI elements if they exist
        this.updateStatElement('totalCodes', totalCodes);
        this.updateStatElement('activeCodes', activeCodes);
        this.updateStatElement('usedCodes', usedCodes);
        this.updateStatElement('expiredCodes', expiredCodes);
    }

    updateStatElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value.toLocaleString('ar-EG');
        }
    }

    // Copy code to clipboard
    async copyCode(code) {
        try {
            await navigator.clipboard.writeText(code);
            showNotification(`تم نسخ الكود: ${code}`, 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification(`تم نسخ الكود: ${code}`, 'success');
        }
    }

    // Edit code
    editCode(codeId) {
        // Implementation for editing codes
        showNotification('سيتم إضافة تعديل الأكواد قريباً', 'info');
    }

    // Delete code
    async deleteCode(codeId) {
        if (!confirm('هل أنت متأكد من حذف هذا الكود؟')) return;
        
        try {
            showLoading('جاري حذف الكود...');
            
            const result = await window.supabaseFunctions.deleteAccessCode(codeId);
            
            if (result.success) {
                showNotification('تم حذف الكود بنجاح', 'success');
                await this.loadInitialData();
                localStorage.setItem('vip-content-updated', Date.now());
            } else {
                showNotification(`خطأ في حذف الكود: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error deleting code:', error);
            showNotification('خطأ في حذف الكود', 'error');
        } finally {
            hideLoading();
        }
    }

    // Show field error
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        field.classList.add('form-error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
        
        // Remove error after 5 seconds
        setTimeout(() => {
            field.classList.remove('form-error');
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Modal functions
    showAddCodeModal() {
        const modal = document.getElementById('codeModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            document.getElementById('codePreview').style.display = 'none';
        }
    }

    closeCodeModal() {
        const modal = document.getElementById('codeModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Reset form
            const form = document.getElementById('codeForm');
            if (form) {
                form.reset();
            }
            
            // Hide all conditional sections
            ['courseSelection', 'videoSelection', 'subjectSelection', 'discountGroup', 'codePreview'].forEach(id => {
                const element = document.getElementById(id);
                if (element) element.style.display = 'none';
            });
        }
    }

    previewCode() {
        this.updatePreview();
        const preview = document.getElementById('codePreview');
        if (preview) {
            preview.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Initialize the enhanced codes manager
let codesManager;
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.supabaseClient !== 'undefined') {
        codesManager = new EnhancedCodesManager();
    }
});

// Global functions for HTML onclick handlers
function showAddCodeModal() {
    if (codesManager) codesManager.showAddCodeModal();
}

function closeCodeModal() {
    if (codesManager) codesManager.closeCodeModal();
}

function generateRandomCode() {
    if (codesManager) codesManager.generateRandomCode();
}

function handleCodeTypeChange() {
    if (codesManager) codesManager.handleCodeTypeChange();
}

function previewCode() {
    if (codesManager) codesManager.previewCode();
}

// Export for use in other files
window.codesManager = codesManager;
window.EnhancedCodesManager = EnhancedCodesManager;
