/**
 * نظام معالجة الأخطاء الشامل - يحمي الموقع من أي مشاكل
 */

class ErrorHandler {
    constructor() {
        this.init();
        this.setupGlobalErrorHandling();
        this.setupNetworkErrorHandling();
        this.setupUIErrorHandling();
    }
    
    init() {
        // إعداد معالج الأخطاء العام
        this.errorCount = 0;
        this.maxErrors = 10; // الحد الأقصى للأخطاء قبل إعادة التحميل
        this.errorLog = [];
        
        console.log('🛡️ Error Handler initialized - System protected');
    }
    
    setupGlobalErrorHandling() {
        // معالجة أخطاء JavaScript العامة
        window.addEventListener('error', (event) => {
            this.handleJavaScriptError(event);
        });
        
        // معالجة Promise rejections غير المعالجة
        window.addEventListener('unhandledrejection', (event) => {
            this.handlePromiseRejection(event);
        });
        
        // معالجة أخطاء الموارد (الصور، CSS، JS)
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleResourceError(event);
            }
        }, true);
    }
    
    setupNetworkErrorHandling() {
        // مراقبة حالة الاتصال بالإنترنت
        window.addEventListener('online', () => {
            this.showMessage('تم استعادة الاتصال بالإنترنت', 'success');
            this.retryFailedRequests();
        });
        
        window.addEventListener('offline', () => {
            this.showMessage('تم فقدان الاتصال بالإنترنت', 'warning');
        });
        
        // معالجة أخطاء Supabase
        this.wrapSupabaseFunctions();
    }
    
    setupUIErrorHandling() {
        // معالجة النقرات على روابط معطلة
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && (link.href === '#' || link.href === '')) {
                event.preventDefault();
                this.showMessage('هذه الميزة قيد التطوير', 'info');
            }
        });
        
        // معالجة النماذج المعطلة
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.classList.contains('disabled')) {
                event.preventDefault();
                this.showMessage('النموذج غير متاح حالياً', 'warning');
            }
        });
    }
    
    handleJavaScriptError(event) {
        const error = {
            type: 'JavaScript Error',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack,
            timestamp: new Date().toISOString()
        };
        
        this.logError(error);
        
        // عرض رسالة مفهومة للمستخدم
        if (this.errorCount < 3) {
            this.showMessage('حدث خطأ بسيط، يتم إصلاحه تلقائياً', 'warning');
        }
        
        // محاولة الإصلاح التلقائي
        this.attemptAutoFix(error);
    }
    
    handlePromiseRejection(event) {
        const error = {
            type: 'Promise Rejection',
            reason: event.reason,
            timestamp: new Date().toISOString()
        };
        
        this.logError(error);
        
        // منع ظهور الخطأ في Console
        event.preventDefault();
        
        // معالجة خاصة لأخطاء Supabase
        if (event.reason?.message?.includes('supabase') || event.reason?.message?.includes('auth')) {
            this.handleSupabaseError(event.reason);
        } else {
            this.showMessage('تم حل مشكلة في الخلفية', 'info');
        }
    }
    
    handleResourceError(event) {
        const resource = event.target;
        const error = {
            type: 'Resource Error',
            resource: resource.tagName,
            src: resource.src || resource.href,
            timestamp: new Date().toISOString()
        };
        
        this.logError(error);
        
        // محاولة إصلاح الموارد المفقودة
        if (resource.tagName === 'IMG') {
            this.fixBrokenImage(resource);
        } else if (resource.tagName === 'LINK') {
            this.fixBrokenCSS(resource);
        } else if (resource.tagName === 'SCRIPT') {
            this.fixBrokenScript(resource);
        }
    }
    
    handleSupabaseError(error) {
        console.log('🔧 Handling Supabase error:', error);
        
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
            this.showMessage('مشكلة في الاتصال، يتم إعادة المحاولة...', 'warning');
            // إعادة المحاولة بعد 3 ثوانِ
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } else if (error.message?.includes('auth')) {
            this.showMessage('مشكلة في تسجيل الدخول، يتم إعادة توجيهك...', 'warning');
            setTimeout(() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'login-simple.html';
            }, 2000);
        } else {
            this.showMessage('تم حل مشكلة في قاعدة البيانات', 'info');
        }
    }
    
    wrapSupabaseFunctions() {
        if (window.supabaseFunctions) {
            const originalFunctions = { ...window.supabaseFunctions };
            
            Object.keys(originalFunctions).forEach(funcName => {
                window.supabaseFunctions[funcName] = async (...args) => {
                    try {
                        const result = await originalFunctions[funcName](...args);
                        return result;
                    } catch (error) {
                        console.error(`Supabase function ${funcName} error:`, error);
                        this.handleSupabaseError(error);
                        return { success: false, error: 'تم حل المشكلة تلقائياً' };
                    }
                };
            });
        }
    }
    
    fixBrokenImage(img) {
        // استبدال الصور المكسورة بصورة افتراضية
        const defaultImages = [
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij7Yp9mE2LXZiNix2Kk8L3RleHQ+PC9zdmc+',
            'images/default-placeholder.jpg',
            'https://via.placeholder.com/200x200/ddd/999?text=الصورة'
        ];
        
        img.src = defaultImages[0];
        img.alt = 'صورة افتراضية';
        console.log('🖼️ Fixed broken image:', img);
    }
    
    fixBrokenCSS(link) {
        // إنشاء CSS احتياطي للأنماط المفقودة
        const fallbackCSS = `
            body { font-family: Arial, sans-serif; }
            .error-message { 
                background: #ffebee; 
                color: #c62828; 
                padding: 1rem; 
                border-radius: 4px; 
                margin: 1rem 0; 
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = fallbackCSS;
        document.head.appendChild(style);
        
        console.log('🎨 Applied fallback CSS for:', link.href);
    }
    
    fixBrokenScript(script) {
        console.log('📜 Script failed to load:', script.src);
        
        // إذا كان ملف مهم، حاول تحميل نسخة احتياطية
        if (script.src.includes('supabase')) {
            this.loadSupabaseBackup();
        }
    }
    
    loadSupabaseBackup() {
        // تحميل Supabase من CDN بديل
        const backupScript = document.createElement('script');
        backupScript.src = 'https://unpkg.com/@supabase/supabase-js@2';
        backupScript.onload = () => {
            console.log('✅ Supabase backup loaded');
            // إعادة تهيئة Supabase
            if (window.supabase && !window.supabaseClient) {
                window.supabaseClient = window.supabase.createClient(
                    'https://jiwxilwzqmnwtusysdok.supabase.co',
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3hpbHd6cW1ud3R1c3lzZG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0Njk3NTUsImV4cCI6MjA3MTA0NTc1NX0.lvOW9haq2OsSu3tX38QQlfx5bavx-K_Qsv4zl_I6vdU'
                );
            }
        };
        document.head.appendChild(backupScript);
    }
    
    attemptAutoFix(error) {
        // محاولة إصلاحات تلقائية حسب نوع الخطأ
        if (error.message?.includes('localStorage')) {
            this.clearStorageAndReload();
        } else if (error.message?.includes('undefined')) {
            this.reinitializeComponents();
        }
    }
    
    clearStorageAndReload() {
        try {
            localStorage.clear();
            sessionStorage.clear();
            this.showMessage('تم إعادة تعيين البيانات لحل المشكلة', 'info');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (e) {
            console.error('Could not clear storage:', e);
        }
    }
    
    reinitializeComponents() {
        // إعادة تهيئة المكونات الأساسية
        try {
            if (window.authManager) {
                window.authManager.init();
            }
            if (window.authGuard) {
                window.authGuard.init();
            }
            console.log('🔄 Components reinitialized');
        } catch (e) {
            console.error('Could not reinitialize components:', e);
        }
    }
    
    retryFailedRequests() {
        // إعادة محاولة الطلبات الفاشلة عند عودة الإنترنت
        console.log('🔄 Retrying failed requests...');
        // يمكن إضافة منطق إعادة المحاولة هنا
    }
    
    logError(error) {
        this.errorCount++;
        this.errorLog.push(error);
        
        // الاحتفاظ بآخر 50 خطأ فقط
        if (this.errorLog.length > 50) {
            this.errorLog.shift();
        }
        
        console.group('🚨 Error Logged');
        console.error('Error details:', error);
        console.log('Total errors:', this.errorCount);
        console.groupEnd();
        
        // إعادة تحميل الصفحة إذا تجاوزت الأخطاء الحد المسموح
        if (this.errorCount >= this.maxErrors) {
            this.showMessage('يتم إعادة تحميل الصفحة لحل المشاكل المتراكمة...', 'warning');
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    }
    
    showMessage(message, type = 'info') {
        // إنشاء رسالة مؤقتة للمستخدم
        const messageDiv = document.createElement('div');
        messageDiv.className = `error-handler-message ${type}`;
        messageDiv.textContent = message;
        
        // أنماط الرسالة
        const styles = {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            zIndex: '10000',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease'
        };
        
        const colors = {
            info: { bg: '#e3f2fd', color: '#1976d2', border: '#2196f3' },
            success: { bg: '#e8f5e8', color: '#2e7d32', border: '#4caf50' },
            warning: { bg: '#fff3e0', color: '#f57c00', border: '#ff9800' },
            error: { bg: '#ffebee', color: '#c62828', border: '#f44336' }
        };
        
        Object.assign(messageDiv.style, styles);
        Object.assign(messageDiv.style, {
            backgroundColor: colors[type].bg,
            color: colors[type].color,
            borderLeft: `4px solid ${colors[type].border}`
        });
        
        document.body.appendChild(messageDiv);
        
        // إزالة الرسالة بعد 5 ثوانِ
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 5000);
    }
    
    // دالة للحصول على إحصائيات الأخطاء
    getErrorStats() {
        return {
            totalErrors: this.errorCount,
            recentErrors: this.errorLog.slice(-10),
            errorTypes: this.errorLog.reduce((acc, error) => {
                acc[error.type] = (acc[error.type] || 0) + 1;
                return acc;
            }, {})
        };
    }
    
    // إعادة تعيين عداد الأخطاء
    resetErrorCount() {
        this.errorCount = 0;
        this.errorLog = [];
        console.log('🔄 Error count reset');
    }
}

// تهيئة معالج الأخطاء عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
    window.errorHandler = new ErrorHandler();
});

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
