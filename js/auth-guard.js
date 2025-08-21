/**
 * نظام حماية الصفحات - يتحقق من تسجيل الدخول قبل الوصول للصفحات المحمية
 */

class AuthGuard {
    constructor() {
        this.protectedPages = [
            'student-dashboard-advanced.html',
            'student-profile.html',
            'admin-dashboard.html',
            'admin-teachers.html',
            'admin-courses.html',
            'admin-videos.html',
            'admin-students.html',
            'admin-subjects.html',
            'admin-codes.html',
            'admin-settings.html'
        ];
        
        this.publicPages = [
            'index.html',
            'home.html',
            'teachers.html',
            'login-simple.html',
            'login.html',
            'register.html',
            'video-access.html'
        ];
        
        this.init();
    }
    
    init() {
        this.checkPageAccess();
        this.setupAuthStateListener();
    }
    
    checkPageAccess() {
        const currentPage = this.getCurrentPageName();
        
        // إذا كانت الصفحة محمية، تحقق من تسجيل الدخول
        if (this.isProtectedPage(currentPage)) {
            if (!this.isUserLoggedIn()) {
                this.redirectToLogin();
                return false;
            }
            
            // تحقق من الصلاحيات للصفحات الإدارية
            if (this.isAdminPage(currentPage)) {
                if (!this.isAdmin()) {
                    this.redirectToHome('ليس لديك صلاحية للوصول إلى هذه الصفحة');
                    return false;
                }
            }
        }
        
        return true;
    }
    
    getCurrentPageName() {
        const path = window.location.pathname;
        return path.split('/').pop() || 'index.html';
    }
    
    isProtectedPage(pageName) {
        return this.protectedPages.includes(pageName);
    }
    
    isAdminPage(pageName) {
        return pageName.startsWith('admin-');
    }
    
    isUserLoggedIn() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn');
        const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        
        return isLoggedIn === 'true' && currentUser;
    }
    
    isAdmin() {
        try {
            const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
            if (!currentUser) return false;
            
            const user = JSON.parse(currentUser);
            return user.role === 'admin' || user.email === 'admin@vip.com';
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }
    
    getCurrentUser() {
        try {
            const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
            return currentUser ? JSON.parse(currentUser) : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }
    
    redirectToLogin(message = 'يجب تسجيل الدخول للوصول إلى هذه الصفحة') {
        // حفظ الصفحة الحالية للعودة إليها بعد تسجيل الدخول
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        
        // إظهار رسالة
        if (message) {
            sessionStorage.setItem('loginMessage', message);
        }
        
        // التوجيه إلى صفحة تسجيل الدخول
        window.location.href = 'login-simple.html';
    }
    
    redirectToHome(message = '') {
        if (message) {
            sessionStorage.setItem('homeMessage', message);
        }
        window.location.href = 'home.html';
    }
    
    setupAuthStateListener() {
        // مراقبة تغييرات حالة تسجيل الدخول
        window.addEventListener('storage', (e) => {
            if (e.key === 'isLoggedIn' || e.key === 'currentUser') {
                // إعادة فحص الصلاحيات
                setTimeout(() => {
                    this.checkPageAccess();
                }, 100);
            }
        });
    }
    
    // دالة للتحقق من Supabase Auth
    async checkSupabaseAuth() {
        try {
            if (!window.supabaseClient) return false;
            
            const { data: { user }, error } = await window.supabaseClient.auth.getUser();
            
            if (error || !user) return false;
            
            // إذا كان المستخدم مسجل في Supabase ولكن ليس في localStorage
            if (!this.isUserLoggedIn()) {
                const result = await window.supabaseFunctions.handleOAuthCallback();
                if (result.success) {
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                    localStorage.setItem('isLoggedIn', 'true');
                    return true;
                }
            }
            
            return true;
        } catch (error) {
            console.error('Supabase auth check error:', error);
            return false;
        }
    }
    
    // دالة لتسجيل الخروج
    async logout() {
        try {
            // تسجيل الخروج من Supabase
            if (window.supabaseFunctions) {
                await window.supabaseFunctions.signOut();
            }
            
            // مسح البيانات المحلية
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('isLoggedIn');
            
            // التوجيه إلى الصفحة الرئيسية
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            // في حالة الخطأ، امسح البيانات المحلية على الأقل
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    }
    
    // دالة للتحقق من انتهاء صلاحية الجلسة
    checkSessionExpiry() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;
        
        // إذا كان هناك تاريخ انتهاء للجلسة
        if (currentUser.sessionExpiry) {
            const now = new Date().getTime();
            const expiry = new Date(currentUser.sessionExpiry).getTime();
            
            if (now > expiry) {
                this.logout();
                return false;
            }
        }
        
        return true;
    }
}

// إنشاء مثيل عام من نظام الحماية
window.authGuard = new AuthGuard();

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthGuard;
}

// إضافة دالة عامة لتسجيل الخروج
window.logout = function() {
    window.authGuard.logout();
};

// فحص دوري لحالة المصادقة (كل 5 دقائق)
setInterval(() => {
    if (window.authGuard) {
        window.authGuard.checkSessionExpiry();
    }
}, 5 * 60 * 1000);
