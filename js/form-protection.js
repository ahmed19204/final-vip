/**
 * نظام حماية النماذج والأزرار من الاستخدام الخاطئ
 */

class FormProtection {
    constructor() {
        this.init();
        this.protectedForms = new Set();
        this.protectedButtons = new Set();
    }
    
    init() {
        this.setupFormProtection();
        this.setupButtonProtection();
        this.setupInputValidation();
        this.preventDoubleSubmit();
        console.log('🛡️ Form Protection initialized');
    }
    
    setupFormProtection() {
        // حماية جميع النماذج من الإرسال المتكرر
        document.addEventListener('submit', (event) => {
            const form = event.target;
            
            // منع الإرسال إذا كان النموذج محمي بالفعل
            if (this.protectedForms.has(form)) {
                event.preventDefault();
                this.showProtectionMessage('يتم معالجة طلبك، يرجى الانتظار...');
                return;
            }
            
            // حماية النموذج لمدة 3 ثوانِ
            this.protectForm(form, 3000);
        });
    }
    
    setupButtonProtection() {
        // حماية الأزرار من النقر المتكرر
        document.addEventListener('click', (event) => {
            const button = event.target.closest('button, input[type="submit"], .btn');
            
            if (button && !button.disabled) {
                // حماية خاصة للأزرار المهمة
                if (this.isImportantButton(button)) {
                    if (this.protectedButtons.has(button)) {
                        event.preventDefault();
                        this.showProtectionMessage('يتم تنفيذ العملية، يرجى الانتظار...');
                        return;
                    }
                    
                    this.protectButton(button, 2000);
                }
            }
        });
    }
    
    setupInputValidation() {
        // حماية الحقول من الإدخال الخاطئ
        document.addEventListener('input', (event) => {
            const input = event.target;
            
            if (input.type === 'email') {
                this.validateEmail(input);
            } else if (input.type === 'tel' || input.name === 'phone') {
                this.validatePhone(input);
            } else if (input.type === 'password') {
                this.validatePassword(input);
            }
        });
        
        // منع لصق محتوى ضار في حقول كلمة المرور
        document.addEventListener('paste', (event) => {
            const input = event.target;
            if (input.type === 'password') {
                setTimeout(() => {
                    this.sanitizePasswordInput(input);
                }, 0);
            }
        });
    }
    
    preventDoubleSubmit() {
        // منع الإرسال المتكرر بسبب النقر السريع
        let lastSubmitTime = 0;
        
        document.addEventListener('submit', (event) => {
            const now = Date.now();
            if (now - lastSubmitTime < 1000) {
                event.preventDefault();
                this.showProtectionMessage('تم الإرسال بالفعل، يرجى الانتظار...');
                return;
            }
            lastSubmitTime = now;
        });
    }
    
    protectForm(form, duration = 3000) {
        this.protectedForms.add(form);
        form.classList.add('form-protected');
        
        // تعطيل جميع الأزرار في النموذج
        const buttons = form.querySelectorAll('button, input[type="submit"]');
        buttons.forEach(button => {
            button.disabled = true;
            button.classList.add('btn-loading');
        });
        
        // إزالة الحماية بعد المدة المحددة
        setTimeout(() => {
            this.unprotectForm(form);
        }, duration);
    }
    
    unprotectForm(form) {
        this.protectedForms.delete(form);
        form.classList.remove('form-protected');
        
        // إعادة تفعيل الأزرار
        const buttons = form.querySelectorAll('button, input[type="submit"]');
        buttons.forEach(button => {
            button.disabled = false;
            button.classList.remove('btn-loading');
        });
    }
    
    protectButton(button, duration = 2000) {
        this.protectedButtons.add(button);
        const originalText = button.textContent;
        
        button.disabled = true;
        button.classList.add('btn-loading');
        
        // إضافة مؤشر تحميل
        if (!button.querySelector('.loading-spinner')) {
            const spinner = document.createElement('span');
            spinner.className = 'loading-spinner';
            spinner.innerHTML = '⏳';
            button.prepend(spinner);
        }
        
        setTimeout(() => {
            this.unprotectButton(button, originalText);
        }, duration);
    }
    
    unprotectButton(button, originalText) {
        this.protectedButtons.delete(button);
        button.disabled = false;
        button.classList.remove('btn-loading');
        
        // إزالة مؤشر التحميل
        const spinner = button.querySelector('.loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    }
    
    isImportantButton(button) {
        // تحديد الأزرار المهمة التي تحتاج حماية خاصة
        const importantClasses = [
            'form-submit', 'google-btn', 'login-btn', 'register-btn',
            'btn-primary', 'btn-danger', 'btn-success'
        ];
        
        const importantTexts = [
            'تسجيل الدخول', 'التسجيل', 'إنشاء الحساب', 'حفظ',
            'حذف', 'إرسال', 'تأكيد', 'دفع'
        ];
        
        return importantClasses.some(cls => button.classList.contains(cls)) ||
               importantTexts.some(text => button.textContent.includes(text));
    }
    
    validateEmail(input) {
        const email = input.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            this.showInputError(input, 'البريد الإلكتروني غير صحيح');
        } else {
            this.clearInputError(input);
        }
    }
    
    validatePhone(input) {
        const phone = input.value.replace(/\D/g, ''); // إزالة كل شيء عدا الأرقام
        
        if (phone && phone.length < 10) {
            this.showInputError(input, 'رقم الهاتف قصير جداً');
        } else if (phone && phone.length > 15) {
            this.showInputError(input, 'رقم الهاتف طويل جداً');
        } else {
            this.clearInputError(input);
        }
        
        // تنسيق رقم الهاتف تلقائياً
        if (phone.startsWith('01') && phone.length === 11) {
            input.value = phone.replace(/(\d{2})(\d{4})(\d{5})/, '$1 $2 $3');
        }
    }
    
    validatePassword(input) {
        const password = input.value;
        const minLength = 6;
        
        if (password && password.length < minLength) {
            this.showInputError(input, `كلمة المرور يجب أن تكون ${minLength} أحرف على الأقل`);
        } else {
            this.clearInputError(input);
        }
        
        // فحص قوة كلمة المرور
        this.showPasswordStrength(input);
    }
    
    sanitizePasswordInput(input) {
        // إزالة المحتوى الضار من كلمة المرور
        let password = input.value;
        
        // إزالة المسافات والأحرف الخطيرة
        password = password.replace(/[\s<>'"&]/g, '');
        
        if (password !== input.value) {
            input.value = password;
            this.showInputError(input, 'تم إزالة أحرف غير مسموحة');
        }
    }
    
    showPasswordStrength(input) {
        const password = input.value;
        let strength = 0;
        let strengthText = '';
        let strengthColor = '';
        
        if (password.length >= 6) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        switch (strength) {
            case 0:
            case 1:
                strengthText = 'ضعيفة جداً';
                strengthColor = '#f44336';
                break;
            case 2:
                strengthText = 'ضعيفة';
                strengthColor = '#ff9800';
                break;
            case 3:
                strengthText = 'متوسطة';
                strengthColor = '#ffc107';
                break;
            case 4:
                strengthText = 'قوية';
                strengthColor = '#8bc34a';
                break;
            case 5:
                strengthText = 'قوية جداً';
                strengthColor = '#4caf50';
                break;
        }
        
        this.showPasswordStrengthIndicator(input, strengthText, strengthColor);
    }
    
    showPasswordStrengthIndicator(input, text, color) {
        let indicator = input.parentNode.querySelector('.password-strength');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'password-strength';
            indicator.style.cssText = `
                font-size: 0.8rem;
                margin-top: 0.25rem;
                transition: all 0.3s ease;
            `;
            input.parentNode.appendChild(indicator);
        }
        
        indicator.textContent = `قوة كلمة المرور: ${text}`;
        indicator.style.color = color;
    }
    
    showInputError(input, message) {
        // إزالة رسالة الخطأ السابقة
        this.clearInputError(input);
        
        // إنشاء رسالة خطأ جديدة
        const errorDiv = document.createElement('div');
        errorDiv.className = 'input-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #f44336;
            font-size: 0.8rem;
            margin-top: 0.25rem;
            animation: shake 0.3s ease-in-out;
        `;
        
        input.parentNode.appendChild(errorDiv);
        input.classList.add('input-invalid');
        
        // إضافة أنماط CSS للاهتزاز
        if (!document.querySelector('#shake-animation')) {
            const style = document.createElement('style');
            style.id = 'shake-animation';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .input-invalid {
                    border-color: #f44336 !important;
                    box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    clearInputError(input) {
        const errorDiv = input.parentNode.querySelector('.input-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        input.classList.remove('input-invalid');
    }
    
    showProtectionMessage(message) {
        // إظهار رسالة حماية مؤقتة
        if (window.errorHandler) {
            window.errorHandler.showMessage(message, 'info');
        } else {
            console.log('🛡️ Protection:', message);
        }
    }
    
    // دالة لحماية عنصر معين يدوياً
    protectElement(element, duration = 2000) {
        if (element.tagName === 'FORM') {
            this.protectForm(element, duration);
        } else if (element.tagName === 'BUTTON' || element.type === 'submit') {
            this.protectButton(element, duration);
        }
    }
    
    // دالة للتحقق من حالة الحماية
    isProtected(element) {
        if (element.tagName === 'FORM') {
            return this.protectedForms.has(element);
        } else if (element.tagName === 'BUTTON' || element.type === 'submit') {
            return this.protectedButtons.has(element);
        }
        return false;
    }
}

// تهيئة حماية النماذج عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
    window.formProtection = new FormProtection();
});

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormProtection;
}
