// Secure Admin Authentication System
// يجب استخدام هذا النظام بدلاً من النظام الحالي

class SecureAdminAuth {
    constructor() {
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours
        this.inactivityTimeout = 30 * 60 * 1000; // 30 minutes
        this.lastActivity = Date.now();
        this.initializeActivityTracking();
    }

    // تسجيل الدخول باستخدام Supabase Auth
    async login(email, password) {
        try {
            // محاولة تسجيل الدخول عبر Supabase
            const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (authError) {
                throw new Error('بيانات تسجيل الدخول غير صحيحة');
            }

            // التحقق من صلاحيات الإدارة
            const { data: adminData, error: adminError } = await window.supabaseClient
                .from('admin_users')
                .select('*')
                .eq('email', email)
                .eq('status', 'active')
                .single();

            if (adminError || !adminData) {
                // تسجيل خروج المستخدم إذا لم يكن لديه صلاحيات إدارة
                await window.supabaseClient.auth.signOut();
                throw new Error('ليس لديك صلاحيات للوصول لهذه الصفحة');
            }

            // حفظ بيانات الجلسة
            const sessionData = {
                user: authData.user,
                adminProfile: adminData,
                loginTime: Date.now(),
                lastActivity: Date.now()
            };

            sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
            this.lastActivity = Date.now();

            return { success: true, user: adminData };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // تسجيل الخروج
    async logout() {
        try {
            await window.supabaseClient.auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        sessionStorage.removeItem('adminSession');
        localStorage.removeItem('adminData');
        window.location.href = 'admin-login.html';
    }

    // التحقق من صحة الجلسة
    async validateSession() {
        const sessionData = this.getSessionData();
        
        if (!sessionData) {
            return false;
        }

        // التحقق من انتهاء صلاحية الجلسة
        const now = Date.now();
        const sessionAge = now - sessionData.loginTime;
        const inactivityTime = now - sessionData.lastActivity;

        if (sessionAge > this.sessionTimeout) {
            this.logout();
            return false;
        }

        if (inactivityTime > this.inactivityTimeout) {
            this.logout();
            return false;
        }

        // التحقق من صحة الجلسة مع Supabase
        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        
        if (error || !user) {
            this.logout();
            return false;
        }

        // تحديث وقت آخر نشاط
        sessionData.lastActivity = now;
        sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
        this.lastActivity = now;

        return true;
    }

    // الحصول على بيانات الجلسة
    getSessionData() {
        try {
            const sessionData = sessionStorage.getItem('adminSession');
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (error) {
            return null;
        }
    }

    // الحصول على المستخدم الحالي
    getCurrentUser() {
        const sessionData = this.getSessionData();
        return sessionData ? sessionData.adminProfile : null;
    }

    // التحقق من الصلاحيات
    hasPermission(requiredRole) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const roleHierarchy = {
            'super_admin': 5,
            'admin': 4,
            'content_admin': 3,
            'teacher': 2,
            'student': 1
        };

        const userLevel = roleHierarchy[user.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        return userLevel >= requiredLevel;
    }

    // تتبع النشاط
    initializeActivityTracking() {
        // تتبع حركة الماوس والضغط على المفاتيح
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
                const sessionData = this.getSessionData();
                if (sessionData) {
                    sessionData.lastActivity = Date.now();
                    sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
                }
            }, true);
        });

        // فحص الجلسة كل دقيقة
        setInterval(() => {
            this.validateSession();
        }, 60000);
    }

    // حماية الصفحة
    async protectPage(requiredRole = 'admin') {
        const isValid = await this.validateSession();
        
        if (!isValid) {
            window.location.href = 'admin-login.html';
            return false;
        }

        if (!this.hasPermission(requiredRole)) {
            document.body.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #000; color: #fff; font-family: Tahoma;">
                    <div style="text-align: center;">
                        <h2>⚠️ ليس لديك صلاحية للوصول لهذه الصفحة</h2>
                        <p>يرجى التواصل مع المدير لطلب الصلاحيات المطلوبة</p>
                        <button onclick="window.location.href='admin-dashboard.html'" style="padding: 10px 20px; background: #ff4d4d; color: white; border: none; border-radius: 5px; cursor: pointer;">العودة للوحة التحكم</button>
                    </div>
                </div>
            `;
            return false;
        }

        return true;
    }
}

// إنشاء مثيل عام للنظام
window.secureAdminAuth = new SecureAdminAuth();

// دالة للتحقق من الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', async function() {
    // التحقق من أن هذه صفحة إدارة
    if (window.location.pathname.includes('admin-') && !window.location.pathname.includes('admin-login')) {
        const isAuthorized = await window.secureAdminAuth.protectPage();
        if (!isAuthorized) {
            return;
        }
    }
});

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureAdminAuth;
}
