// Admin Codes Management JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeCodesPage();
});

// Code Management System
const codeManager = {
    currentCodeId: null,
    
    // Show add code modal
    showAddModal: function() {
        this.currentCodeId = null;
        document.getElementById('codeModalTitle').textContent = 'إنشاء كود جديد';
        document.getElementById('codeForm').reset();
        document.getElementById('codeModal').style.display = 'flex';
        this.resetForm();
    },
    
    // Show edit code modal
    showEditModal: function(codeId) {
        this.currentCodeId = codeId;
        document.getElementById('codeModalTitle').textContent = 'تعديل الكود';
        document.getElementById('codeModal').style.display = 'flex';
        this.loadCodeData(codeId);
    },
    
    // Close code modal
    closeModal: function() {
        document.getElementById('codeModal').style.display = 'none';
        this.resetForm();
    },
    
    // Show bulk code modal
    showBulkModal: function() {
        document.getElementById('bulkCodeForm').reset();
        document.getElementById('bulkCodeModal').style.display = 'flex';
    },
    
    // Close bulk code modal
    closeBulkModal: function() {
        document.getElementById('bulkCodeModal').style.display = 'none';
    },
    
    // Reset form
    resetForm: function() {
        document.getElementById('usageLimitGroup').style.display = 'none';
        document.getElementById('codeLinkedContent').innerHTML = '<option value="">اختر المحتوى</option>';
    },
    
    // Generate random code
    generateRandomCode: function() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        document.getElementById('codeValue').value = code;
    },
    
    // Load content options based on type
    loadContentOptions: function() {
        const contentType = document.getElementById('codeContentType').value;
        const contentSelect = document.getElementById('codeLinkedContent');
        
        contentSelect.innerHTML = '<option value="">اختر المحتوى</option>';
        
        let options = [];
        
        switch(contentType) {
            case 'video':
                options = [
                    { value: 'video_1', text: 'فيديو تعليمي جديد' },
                    { value: 'video_2', text: 'فيديو تعليمي جديد' },
                    { value: 'video_3', text: 'فيديو تعليمي جديد' },
                    { value: 'video_4', text: 'فيديو تعليمي جديد' }
                ];
                break;
            case 'course':
                options = [
                    { value: 'course_1', text: 'كورس جديد' },
                    { value: 'course_2', text: 'كورس جديد' },
                    { value: 'course_3', text: 'كورس جديد' },
                    { value: 'course_4', text: 'كورس جديد' }
                ];
                break;
            case 'subject':
                options = [
                    { value: 'subject_physics', text: 'جميع فيديوهات الفيزياء' },
                    { value: 'subject_chemistry', text: 'جميع فيديوهات الكيمياء' },
                    { value: 'subject_biology', text: 'جميع فيديوهات الأحياء' },
                    { value: 'subject_math', text: 'جميع فيديوهات الرياضيات' }
                ];
                break;
            case 'teacher':
                options = [
                    { value: 'teacher_1', text: 'جميع فيديوهات مدرس جديد' },
                    { value: 'teacher_2', text: 'جميع فيديوهات مدرس جديد' },
                    { value: 'teacher_3', text: 'جميع فيديوهات مدرس جديد' },
                    { value: 'teacher_4', text: 'جميع فيديوهات مدرس جديد' }
                ];
                break;
        }
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            contentSelect.appendChild(optionElement);
        });
    },
    
    // Load bulk content options
    loadBulkContentOptions: function() {
        const contentType = document.getElementById('bulkCodeContentType').value;
        const contentSelect = document.getElementById('bulkCodeLinkedContent');
        
        contentSelect.innerHTML = '<option value="">اختر المحتوى</option>';
        
        // Use same options as single code
        this.loadContentOptions();
        const singleOptions = document.getElementById('codeLinkedContent').innerHTML;
        contentSelect.innerHTML = singleOptions;
    },
    
    // Toggle usage limit field
    toggleUsageLimit: function() {
        const usageType = document.getElementById('codeUsageType').value;
        const limitGroup = document.getElementById('usageLimitGroup');
        
        if (usageType === 'limited') {
            limitGroup.style.display = 'block';
            document.getElementById('codeUsageLimit').required = true;
        } else {
            limitGroup.style.display = 'none';
            document.getElementById('codeUsageLimit').required = false;
        }
    },
    
    // Toggle bulk usage limit field
    toggleBulkUsageLimit: function() {
        const usageType = document.getElementById('bulkCodeUsageType').value;
        const limitGroup = document.getElementById('bulkUsageLimitGroup');
        
        if (usageType === 'limited') {
            limitGroup.style.display = 'block';
            document.getElementById('bulkCodeUsageLimit').required = true;
        } else {
            limitGroup.style.display = 'none';
            document.getElementById('bulkCodeUsageLimit').required = false;
        }
    },
    
    // Load code data for editing
    loadCodeData: function(codeId) {
        // In a real application, this would load from the server
        const sampleData = {
            value: codeId,
            contentType: 'video',
            linkedContent: 'video_1',
            usageType: 'limited',
            usageLimit: '100',
            expiryDate: '2025-03-15T23:59',
            description: 'كود خاص بفيديو الموجات الكهرومغناطيسية',
            status: 'active',
            activationDate: ''
        };
        
        // Populate form fields
        document.getElementById('codeValue').value = sampleData.value;
        document.getElementById('codeContentType').value = sampleData.contentType;
        this.loadContentOptions();
        document.getElementById('codeLinkedContent').value = sampleData.linkedContent;
        document.getElementById('codeUsageType').value = sampleData.usageType;
        document.getElementById('codeUsageLimit').value = sampleData.usageLimit;
        document.getElementById('codeExpiryDate').value = sampleData.expiryDate;
        document.getElementById('codeDescription').value = sampleData.description;
        document.getElementById('codeStatus').value = sampleData.status;
        document.getElementById('codeActivationDate').value = sampleData.activationDate;
        
        this.toggleUsageLimit();
    },
    
    // Save code
    saveCode: function(formData) {
        const codeData = {
            value: formData.get('value') || this.generateRandomCodeString(),
            contentType: formData.get('contentType'),
            linkedContent: formData.get('linkedContent'),
            usageType: formData.get('usageType'),
            usageLimit: formData.get('usageLimit') ? parseInt(formData.get('usageLimit')) : null,
            usageCount: 0,
            expiryDate: formData.get('expiryDate'),
            description: formData.get('description'),
            status: formData.get('status'),
            activationDate: formData.get('activationDate'),
            createdAt: new Date().toISOString()
        };
        
        // Validate code
        const validation = this.validateCode(codeData);
        if (!validation.isValid) {
            showNotification(validation.message, 'error');
            return;
        }
        
        if (this.currentCodeId) {
            // Update existing code
            adminData.update('codes', this.currentCodeId, codeData);
            showNotification('تم تحديث الكود بنجاح!', 'success');
        } else {
            // Add new code
            adminData.add('codes', codeData);
            showNotification('تم إنشاء الكود بنجاح!', 'success');
        }
        
        this.closeModal();
        this.refreshCodeTable();
    },
    
    // Generate bulk codes
    generateBulkCodes: function(formData) {
        const bulkData = {
            count: parseInt(formData.get('count')),
            prefix: formData.get('prefix') || '',
            contentType: formData.get('contentType'),
            linkedContent: formData.get('linkedContent'),
            usageType: formData.get('usageType'),
            usageLimit: formData.get('usageLimit') ? parseInt(formData.get('usageLimit')) : null,
            expiryDate: formData.get('expiryDate')
        };
        
        if (bulkData.count > 1000) {
            showNotification('لا يمكن إنشاء أكثر من 1000 كود في المرة الواحدة', 'error');
            return;
        }
        
        const generatedCodes = [];
        const existingCodes = adminData.get('codes').map(code => code.value);
        
        for (let i = 0; i < bulkData.count; i++) {
            let codeValue;
            do {
                codeValue = bulkData.prefix + this.generateRandomCodeString(6);
            } while (existingCodes.includes(codeValue) || generatedCodes.includes(codeValue));
            
            const codeData = {
                value: codeValue,
                contentType: bulkData.contentType,
                linkedContent: bulkData.linkedContent,
                usageType: bulkData.usageType,
                usageLimit: bulkData.usageLimit,
                usageCount: 0,
                expiryDate: bulkData.expiryDate,
                description: `كود مُنشأ بشكل جماعي - ${i + 1}/${bulkData.count}`,
                status: 'active',
                activationDate: '',
                createdAt: new Date().toISOString()
            };
            
            adminData.add('codes', codeData);
            generatedCodes.push(codeValue);
        }
        
        this.closeBulkModal();
        this.refreshCodeTable();
        showNotification(`تم إنشاء ${bulkData.count} كود بنجاح!`, 'success');
        
        // Offer to download codes
        if (confirm('هل تريد تحميل قائمة الأكواد المُنشأة؟')) {
            this.downloadCodes(generatedCodes);
        }
    },
    
    // Generate random code string
    generateRandomCodeString: function(length = 8) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    },
    
    // Validate code data
    validateCode: function(codeData) {
        if (!codeData.value) {
            return { isValid: false, message: 'يجب إدخال قيمة الكود' };
        }
        
        if (codeData.value.length < 4) {
            return { isValid: false, message: 'الكود يجب أن يكون 4 أحرف على الأقل' };
        }
        
        if (!codeData.contentType || !codeData.linkedContent) {
            return { isValid: false, message: 'يجب اختيار نوع المحتوى والمحتوى المرتبط' };
        }
        
        if (codeData.usageType === 'limited' && (!codeData.usageLimit || codeData.usageLimit < 1)) {
            return { isValid: false, message: 'يجب تحديد حد أقصى صالح للاستخدام' };
        }
        
        if (codeData.expiryDate && new Date(codeData.expiryDate) <= new Date()) {
            return { isValid: false, message: 'تاريخ الانتهاء يجب أن يكون في المستقبل' };
        }
        
        // Check if code already exists
        const existingCodes = adminData.get('codes');
        const codeExists = existingCodes.some(code => 
            code.value === codeData.value && 
            (!this.currentCodeId || code.id !== this.currentCodeId)
        );
        
        if (codeExists) {
            return { isValid: false, message: 'هذا الكود موجود بالفعل' };
        }
        
        return { isValid: true, message: 'البيانات صحيحة' };
    },
    
    // Copy code to clipboard
    copyCode: function(codeValue) {
        navigator.clipboard.writeText(codeValue).then(() => {
            showNotification(`تم نسخ الكود: ${codeValue}`, 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = codeValue;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification(`تم نسخ الكود: ${codeValue}`, 'success');
        });
    },
    
    // Deactivate code
    deactivateCode: function(codeValue) {
        if (confirm(`هل أنت متأكد من إلغاء تفعيل الكود: ${codeValue}؟`)) {
            // In a real application, find by code value and update
            showNotification(`تم إلغاء تفعيل الكود: ${codeValue}`, 'success');
            this.refreshCodeTable();
        }
    },
    
    // Reset code usage
    resetCode: function(codeValue) {
        if (confirm(`هل أنت متأكد من إعادة تفعيل الكود: ${codeValue}؟`)) {
            // In a real application, find by code value and reset usage
            showNotification(`تم إعادة تفعيل الكود: ${codeValue}`, 'success');
            this.refreshCodeTable();
        }
    },
    
    // View code usage details
    viewCodeUsage: function(codeValue) {
        // In a real application, this would show detailed usage statistics
        showNotification(`عرض تفاصيل استخدام الكود: ${codeValue} - هذه الميزة ستكون متاحة قريباً`, 'info');
    },
    
    // Download codes list
    downloadCodes: function(codesList) {
        const codesText = codesList.join('\n');
        const blob = new Blob([codesText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vip-codes-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
    
    // Filter codes
    filterCodes: function(filterType) {
        const table = document.getElementById('codesTable');
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            if (filterType === 'all') {
                row.style.display = '';
            } else {
                const statusCell = row.cells[6].textContent.toLowerCase();
                const usageTypeCell = row.cells[2].textContent.toLowerCase();
                const usageCount = parseInt(row.cells[3].textContent);
                const maxUsage = row.cells[4].textContent;
                
                let shouldShow = false;
                
                switch(filterType) {
                    case 'active':
                        shouldShow = statusCell.includes('نشط');
                        break;
                    case 'used':
                        shouldShow = statusCell.includes('مستخدم') || 
                                   (maxUsage !== 'غير محدود' && usageCount >= parseInt(maxUsage));
                        break;
                    case 'expired':
                        shouldShow = statusCell.includes('منتهي');
                        break;
                    case 'unlimited':
                        shouldShow = usageTypeCell.includes('غير محدود');
                        break;
                    case 'single-use':
                        shouldShow = usageTypeCell.includes('استخدام واحد');
                        break;
                }
                
                row.style.display = shouldShow ? '' : 'none';
            }
        });
    },
    
    // Search codes
    searchCodes: function(searchTerm) {
        const table = document.getElementById('codesTable');
        const rows = table.querySelectorAll('tbody tr');
        const term = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const code = row.cells[0].textContent.toLowerCase();
            const content = row.cells[1].textContent.toLowerCase();
            
            const shouldShow = code.includes(term) || content.includes(term);
            row.style.display = shouldShow ? '' : 'none';
        });
    },
    
    // Refresh code table
    refreshCodeTable: function() {
        // In a real application, this would reload the table data
        console.log('Refreshing code table...');
    }
};

// Initialize codes page
function initializeCodesPage() {
    // Set up form submission
    const codeForm = document.getElementById('codeForm');
    if (codeForm) {
        codeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            codeManager.saveCode(formData);
        });
    }
    
    const bulkCodeForm = document.getElementById('bulkCodeForm');
    if (bulkCodeForm) {
        bulkCodeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            codeManager.generateBulkCodes(formData);
        });
    }
    
    // Set up change handlers
    const contentTypeSelect = document.getElementById('codeContentType');
    if (contentTypeSelect) {
        contentTypeSelect.addEventListener('change', () => {
            codeManager.loadContentOptions();
        });
    }
    
    const usageTypeSelect = document.getElementById('codeUsageType');
    if (usageTypeSelect) {
        usageTypeSelect.addEventListener('change', () => {
            codeManager.toggleUsageLimit();
        });
    }
    
    const bulkContentTypeSelect = document.getElementById('bulkCodeContentType');
    if (bulkContentTypeSelect) {
        bulkContentTypeSelect.addEventListener('change', () => {
            codeManager.loadBulkContentOptions();
        });
    }
    
    const bulkUsageTypeSelect = document.getElementById('bulkCodeUsageType');
    if (bulkUsageTypeSelect) {
        bulkUsageTypeSelect.addEventListener('change', () => {
            codeManager.toggleBulkUsageLimit();
        });
    }
}

// Global functions for HTML onclick handlers
function showAddCodeModal() {
    codeManager.showAddModal();
}

function closeCodeModal() {
    codeManager.closeModal();
}

function generateBulkCodes() {
    codeManager.showBulkModal();
}

function closeBulkCodeModal() {
    codeManager.closeBulkModal();
}

function generateRandomCode() {
    codeManager.generateRandomCode();
}

function loadContentOptions() {
    codeManager.loadContentOptions();
}

function loadBulkContentOptions() {
    codeManager.loadBulkContentOptions();
}

function toggleUsageLimit() {
    codeManager.toggleUsageLimit();
}

function toggleBulkUsageLimit() {
    codeManager.toggleBulkUsageLimit();
}

function editCode(codeValue) {
    codeManager.showEditModal(codeValue);
}

function copyCode(codeValue) {
    codeManager.copyCode(codeValue);
}

function deactivateCode(codeValue) {
    codeManager.deactivateCode(codeValue);
}

function resetCode(codeValue) {
    codeManager.resetCode(codeValue);
}

function viewCodeUsage(codeValue) {
    codeManager.viewCodeUsage(codeValue);
}

function filterCodes(filterType) {
    codeManager.filterCodes(filterType);
}

function searchCodes(searchTerm) {
    codeManager.searchCodes(searchTerm);
}

// Code validation and integration with video access
const codeValidator = {
    // Validate code for video access
    validateForAccess: function(codeValue) {
        const codes = adminData.get('codes');
        const code = codes.find(c => c.value === codeValue);
        
        if (!code) {
            return { valid: false, message: 'الكود غير موجود' };
        }
        
        if (code.status !== 'active') {
            return { valid: false, message: 'الكود غير نشط' };
        }
        
        // Check expiry date
        if (code.expiryDate && new Date(code.expiryDate) <= new Date()) {
            return { valid: false, message: 'انتهت صلاحية الكود' };
        }
        
        // Check usage limit
        if (code.usageType === 'single' && code.usageCount >= 1) {
            return { valid: false, message: 'تم استخدام هذا الكود من قبل' };
        }
        
        if (code.usageType === 'limited' && code.usageCount >= code.usageLimit) {
            return { valid: false, message: 'تم الوصول للحد الأقصى لاستخدام هذا الكود' };
        }
        
        return { 
            valid: true, 
            message: 'الكود صالح',
            code: code
        };
    },
    
    // Use code (increment usage count)
    useCode: function(codeValue) {
        const validation = this.validateForAccess(codeValue);
        if (!validation.valid) {
            return validation;
        }
        
        // Increment usage count
        const updatedCode = {
            ...validation.code,
            usageCount: validation.code.usageCount + 1,
            lastUsed: new Date().toISOString()
        };
        
        adminData.update('codes', validation.code.id, updatedCode);
        
        return {
            valid: true,
            message: 'تم استخدام الكود بنجاح',
            content: this.getLinkedContent(validation.code)
        };
    },
    
    // Get linked content for code
    getLinkedContent: function(code) {
        // In a real application, this would fetch the actual content
        const contentMap = {
            'video_1': { type: 'video', title: 'مقدمة في الموجات الكهرومغناطيسية', url: 'video1.mp4' },
            'video_2': { type: 'video', title: 'التفاعلات الكيميائية المعقدة', url: 'video2.mp4' },
            'course_1': { type: 'course', title: 'كورس الفيزياء المتقدمة', videos: ['video1.mp4', 'video2.mp4'] },
            'subject_physics': { type: 'subject', title: 'جميع فيديوهات الفيزياء', videos: ['video1.mp4', 'video3.mp4'] }
        };
        
        return contentMap[code.linkedContent] || null;
    }
};

// Export code validator for use in video access page
window.codeValidator = codeValidator;
