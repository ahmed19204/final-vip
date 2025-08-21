// نظام إدارة الصلاحيات المتقدم
class PermissionsManager {
    constructor() {
        this.permissions = {
            // صلاحيات المدير العام
            super_admin: {
                dashboard: { view: true, edit: true },
                teachers: { view: true, add: true, edit: true, delete: true, manage_permissions: true },
                students: { view: true, add: true, edit: true, delete: true, manage_subscriptions: true },
                courses: { view: true, add: true, edit: true, delete: true, publish: true },
                videos: { view: true, add: true, edit: true, delete: true, upload: true },
                subjects: { view: true, add: true, edit: true, delete: true },
                codes: { view: true, add: true, edit: true, delete: true, generate_bulk: true },
                settings: { view: true, edit: true, system_config: true },
                reports: { view: true, export: true, analytics: true },
                admin_users: { view: true, add: true, edit: true, delete: true }
            },

            // صلاحيات المدير
            admin: {
                dashboard: { view: true, edit: false },
                teachers: { view: true, add: true, edit: true, delete: false, manage_permissions: false },
                students: { view: true, add: true, edit: true, delete: false, manage_subscriptions: true },
                courses: { view: true, add: true, edit: true, delete: false, publish: true },
                videos: { view: true, add: true, edit: true, delete: false, upload: true },
                subjects: { view: true, add: true, edit: true, delete: false },
                codes: { view: true, add: true, edit: true, delete: false, generate_bulk: false },
                settings: { view: true, edit: false, system_config: false },
                reports: { view: true, export: true, analytics: false },
                admin_users: { view: true, add: false, edit: false, delete: false }
            },

            // صلاحيات مدير المحتوى
            content_admin: {
                dashboard: { view: true, edit: false },
                teachers: { view: true, add: false, edit: false, delete: false, manage_permissions: false },
                students: { view: true, add: false, edit: false, delete: false, manage_subscriptions: false },
                courses: { view: true, add: true, edit: true, delete: false, publish: false },
                videos: { view: true, add: true, edit: true, delete: false, upload: true },
                subjects: { view: true, add: true, edit: true, delete: false },
                codes: { view: true, add: true, edit: false, delete: false, generate_bulk: false },
                settings: { view: false, edit: false, system_config: false },
                reports: { view: true, export: false, analytics: false },
                admin_users: { view: false, add: false, edit: false, delete: false }
            },

            // صلاحيات المدرس
            teacher: {
                dashboard: { view: true, edit: false },
                teachers: { view: false, add: false, edit: false, delete: false, manage_permissions: false },
                students: { view: true, add: false, edit: false, delete: false, manage_subscriptions: false },
                courses: { view: true, add: false, edit: false, delete: false, publish: false },
                videos: { view: true, add: true, edit: true, delete: false, upload: true },
                subjects: { view: true, add: false, edit: false, delete: false },
                codes: { view: false, add: false, edit: false, delete: false, generate_bulk: false },
                settings: { view: false, edit: false, system_config: false },
                reports: { view: false, export: false, analytics: false },
                admin_users: { view: false, add: false, edit: false, delete: false }
            },

            // صلاحيات الطالب
            student: {
                dashboard: { view: false, edit: false },
                teachers: { view: false, add: false, edit: false, delete: false, manage_permissions: false },
                students: { view: false, add: false, edit: false, delete: false, manage_subscriptions: false },
                courses: { view: false, add: false, edit: false, delete: false, publish: false },
                videos: { view: false, add: false, edit: false, delete: false, upload: false },
                subjects: { view: false, add: false, edit: false, delete: false },
                codes: { view: false, add: false, edit: false, delete: false, generate_bulk: false },
                settings: { view: false, edit: false, system_config: false },
                reports: { view: false, export: false, analytics: false },
                admin_users: { view: false, add: false, edit: false, delete: false }
            }
        };
    }

    // التحقق من صلاحية معينة
    hasPermission(userRole, module, action) {
        try {
            const rolePermissions = this.permissions[userRole];
            if (!rolePermissions) return false;

            const modulePermissions = rolePermissions[module];
            if (!modulePermissions) return false;

            return modulePermissions[action] === true;
        } catch (error) {
            console.error('Permission check error:', error);
            return false;
        }
    }

    // التحقق من صلاحية الوصول لصفحة
    canAccessPage(userRole, pageName) {
        const pagePermissions = {
            'admin-dashboard.html': { module: 'dashboard', action: 'view' },
            'admin-teachers.html': { module: 'teachers', action: 'view' },
            'admin-students.html': { module: 'students', action: 'view' },
            'admin-courses.html': { module: 'courses', action: 'view' },
            'admin-videos.html': { module: 'videos', action: 'view' },
            'admin-subjects.html': { module: 'subjects', action: 'view' },
            'admin-codes.html': { module: 'codes', action: 'view' },
            'admin-settings.html': { module: 'settings', action: 'view' }
        };

        const permission = pagePermissions[pageName];
        if (!permission) return false;

        return this.hasPermission(userRole, permission.module, permission.action);
    }

    // الحصول على قائمة الصفحات المسموحة للمستخدم
    getAllowedPages(userRole) {
        const allPages = [
            { name: 'admin-dashboard.html', title: 'لوحة التحكم', icon: '🏠' },
            { name: 'admin-teachers.html', title: 'إدارة المدرسين', icon: '👨‍🏫' },
            { name: 'admin-students.html', title: 'إدارة الطلاب', icon: '👥' },
            { name: 'admin-courses.html', title: 'إدارة الكورسات', icon: '📚' },
            { name: 'admin-videos.html', title: 'إدارة الفيديوهات', icon: '🎥' },
            { name: 'admin-subjects.html', title: 'إدارة التخصصات', icon: '📖' },
            { name: 'admin-codes.html', title: 'إدارة الأكواد', icon: '🎫' },
            { name: 'admin-settings.html', title: 'الإعدادات', icon: '⚙️' }
        ];

        return allPages.filter(page => this.canAccessPage(userRole, page.name));
    }

    // إنشاء قائمة التنقل بناءً على الصلاحيات
    generateNavigation(userRole, currentPage = '') {
        const allowedPages = this.getAllowedPages(userRole);
        
        return allowedPages.map(page => {
            const isActive = currentPage.includes(page.name) ? 'active' : '';
            return `
                <div class="admin-nav-item">
                    <a href="${page.name}" class="admin-nav-link ${isActive}">
                        <span class="admin-nav-icon">${page.icon}</span>
                        <span>${page.title}</span>
                    </a>
                </div>
            `;
        }).join('');
    }

    // التحقق من صلاحية العملية وإظهار/إخفاء العناصر
    applyUIPermissions(userRole) {
        const elements = document.querySelectorAll('[data-permission]');
        
        elements.forEach(element => {
            const permission = element.getAttribute('data-permission');
            const [module, action] = permission.split(':');
            
            if (!this.hasPermission(userRole, module, action)) {
                element.style.display = 'none';
                element.disabled = true;
            } else {
                element.style.display = '';
                element.disabled = false;
            }
        });
    }

    // تسجيل العملية في سجل النشاط
    async logActivity(userId, action, targetType = null, targetId = null, details = null) {
        try {
            const activityData = {
                admin_id: userId,
                action: action,
                target_type: targetType,
                target_id: targetId,
                details: details,
                ip_address: await this.getClientIP(),
                user_agent: navigator.userAgent,
                created_at: new Date().toISOString()
            };

            await window.supabaseClient
                .from('admin_activity_log')
                .insert([activityData]);

        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    // الحصول على IP العميل
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    // التحقق من قفل الحساب
    async checkAccountLock(email) {
        try {
            const { data: user } = await window.supabaseClient
                .from('admin_users')
                .select('locked_until, login_attempts')
                .eq('email', email)
                .single();

            if (user && user.locked_until) {
                const lockTime = new Date(user.locked_until);
                const now = new Date();
                
                if (now < lockTime) {
                    const remainingTime = Math.ceil((lockTime - now) / (1000 * 60));
                    return {
                        locked: true,
                        remainingMinutes: remainingTime
                    };
                }
            }

            return { locked: false };
        } catch (error) {
            console.error('Error checking account lock:', error);
            return { locked: false };
        }
    }

    // قفل الحساب بعد محاولات فاشلة
    async lockAccount(email, minutes = 30) {
        try {
            const lockUntil = new Date(Date.now() + (minutes * 60 * 1000));
            
            await window.supabaseClient
                .from('admin_users')
                .update({
                    locked_until: lockUntil.toISOString(),
                    login_attempts: 0
                })
                .eq('email', email);

        } catch (error) {
            console.error('Error locking account:', error);
        }
    }

    // زيادة عداد محاولات تسجيل الدخول
    async incrementLoginAttempts(email) {
        try {
            const { data: user } = await window.supabaseClient
                .from('admin_users')
                .select('login_attempts')
                .eq('email', email)
                .single();

            const attempts = (user?.login_attempts || 0) + 1;

            await window.supabaseClient
                .from('admin_users')
                .update({ login_attempts: attempts })
                .eq('email', email);

            // قفل الحساب بعد 5 محاولات فاشلة
            if (attempts >= 5) {
                await this.lockAccount(email);
                return { locked: true, attempts };
            }

            return { locked: false, attempts };
        } catch (error) {
            console.error('Error incrementing login attempts:', error);
            return { locked: false, attempts: 0 };
        }
    }

    // إعادة تعيين محاولات تسجيل الدخول عند النجاح
    async resetLoginAttempts(email) {
        try {
            await window.supabaseClient
                .from('admin_users')
                .update({
                    login_attempts: 0,
                    locked_until: null,
                    last_login: new Date().toISOString()
                })
                .eq('email', email);
        } catch (error) {
            console.error('Error resetting login attempts:', error);
        }
    }

    // التحقق من قوة كلمة المرور
    validatePasswordStrength(password) {
        const requirements = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const score = Object.values(requirements).filter(Boolean).length;
        
        return {
            score,
            requirements,
            strength: score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong',
            valid: score >= 3
        };
    }

    // إنشاء كلمة مرور قوية
    generateSecurePassword(length = 12) {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*(),.?":{}|<>';
        
        const allChars = lowercase + uppercase + numbers + symbols;
        let password = '';
        
        // ضمان وجود حرف من كل نوع
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        
        // إكمال باقي الطول
        for (let i = 4; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // خلط الأحرف
        return password.split('').sort(() => 0.5 - Math.random()).join('');
    }
}

// إنشاء مثيل عام
window.permissionsManager = new PermissionsManager();

// دوال مساعدة للاستخدام في HTML
function checkPermission(module, action) {
    const user = window.secureAdminAuth?.getCurrentUser();
    if (!user) return false;
    return window.permissionsManager.hasPermission(user.role, module, action);
}

function showIfPermitted(element, module, action) {
    if (checkPermission(module, action)) {
        element.style.display = '';
    } else {
        element.style.display = 'none';
    }
}

// تطبيق الصلاحيات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const user = window.secureAdminAuth?.getCurrentUser();
    if (user) {
        window.permissionsManager.applyUIPermissions(user.role);
    }
});

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PermissionsManager;
}
