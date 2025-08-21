/**
 * نظام إدارة المصادقة - يتحكم في حالة تسجيل الدخول عبر الموقع
 * يحافظ على نفس شكل الموقع مع تغيير Navigation فقط
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }
    
    init() {
        // فحص حالة تسجيل الدخول عند تحميل الصفحة
        this.checkAuthStatus();
        
        // تحديث Navigation
        this.updateNavigation();
        
        // إضافة مستمعي الأحداث
        this.attachEventListeners();
    }
    
    checkAuthStatus() {
        const userData = localStorage.getItem('currentUser');
        const loginStatus = localStorage.getItem('isLoggedIn');
        
        if (loginStatus === 'true' && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.isLoggedIn = true;
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
            }
        }
    }
    
    updateNavigation() {
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu) return;
        
        if (this.isLoggedIn && this.currentUser) {
            // إزالة أزرار تسجيل الدخول والتسجيل
            const loginLink = navMenu.querySelector('a[href="login.html"]');
            const registerLink = navMenu.querySelector('a[href="register.html"]');
            
            if (loginLink) loginLink.parentElement.style.display = 'none';
            if (registerLink) registerLink.parentElement.style.display = 'none';
            
            // إضافة معلومات المستخدم وزر الخروج
            this.addUserNavigation(navMenu);
        } else {
            // إظهار أزرار تسجيل الدخول والتسجيل
            const loginLink = navMenu.querySelector('a[href="login.html"]');
            const registerLink = navMenu.querySelector('a[href="register.html"]');
            
            if (loginLink) loginLink.parentElement.style.display = 'flex';
            if (registerLink) registerLink.parentElement.style.display = 'flex';
            
            // إزالة معلومات المستخدم
            this.removeUserNavigation(navMenu);
        }
    }
    
    addUserNavigation(navMenu) {
        // التحقق من وجود العناصر مسبقاً
        if (navMenu.querySelector('.user-nav')) return;
        
        // إنشاء عنصر معلومات المستخدم
        const userNav = document.createElement('li');
        userNav.className = 'nav-item user-nav';
        
        // تحديد الصورة الشخصية
        let avatarHtml = '<span class="user-avatar">👤</span>';
        if (this.currentUser.avatar_url) {
            avatarHtml = `<img src="${this.currentUser.avatar_url}" alt="صورة المستخدم" class="user-avatar-img">`;
        }
        
        userNav.innerHTML = `
            <div class="user-dropdown">
                <button class="user-btn">
                    ${avatarHtml}
                    <span class="user-name">${this.currentUser.name || 'مستخدم'}</span>
                    <span class="dropdown-arrow">▼</span>
                </button>
                <div class="dropdown-menu">
                    <div class="dropdown-header">
                        ${avatarHtml}
                        <div class="user-info">
                            <div class="user-display-name">${this.currentUser.name || 'مستخدم'}</div>
                            <div class="user-email">${this.currentUser.email || ''}</div>
                        </div>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a href="student-dashboard-advanced.html" class="dropdown-item">
                        <span>📊</span> لوحة التحكم
                    </a>
                    ${this.currentUser.role === 'admin' || this.currentUser.email === 'admin@vip.com' ? 
                        '<a href="admin-dashboard.html" class="dropdown-item"><span>⚙️</span> إدارة النظام</a>' : 
                        ''}
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item logout-item" onclick="window.authGuard ? window.authGuard.logout() : authManager.logout()">
                        <span>🚪</span> تسجيل الخروج
                    </a>
                </div>
            </div>
        `;
        
        // إضافة الأنماط
        this.addUserNavStyles();
        
        // إضافة العنصر إلى القائمة
        navMenu.appendChild(userNav);
        
        // إضافة وظيفة القائمة المنسدلة
        this.attachDropdownEvents(userNav);
    }
    
    removeUserNavigation(navMenu) {
        const userNav = navMenu.querySelector('.user-nav');
        if (userNav) {
            userNav.remove();
        }
    }
    
    addUserNavStyles() {
        // التحقق من وجود الأنماط مسبقاً
        if (document.querySelector('#auth-nav-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'auth-nav-styles';
        styles.textContent = `
            .user-dropdown {
                position: relative;
            }
            
            .user-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: rgba(255, 77, 77, 0.1);
                border: 1px solid rgba(255, 77, 77, 0.3);
                border-radius: 25px;
                padding: 0.5rem 1rem;
                color: #fff;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9rem;
            }
            
            .user-btn:hover {
                background: rgba(255, 77, 77, 0.2);
                border-color: #ff4d4d;
                transform: translateY(-2px);
            }
            
            .user-avatar {
                width: 24px;
                height: 24px;
                background: #ff4d4d;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }
            
            .user-name {
                font-weight: 600;
                max-width: 100px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .dropdown-arrow {
                font-size: 10px;
                transition: transform 0.3s ease;
            }
            
            .user-dropdown.active .dropdown-arrow {
                transform: rotate(180deg);
            }
            
            .dropdown-menu {
                position: absolute;
                top: 100%;
                right: 0;
                background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 77, 77, 0.3);
                border-radius: 12px;
                min-width: 200px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                z-index: 1000;
                margin-top: 0.5rem;
            }
            
            .user-dropdown.active .dropdown-menu {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .dropdown-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                color: #fff;
                text-decoration: none;
                transition: all 0.3s ease;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .dropdown-item:last-child {
                border-bottom: none;
            }
            
            .dropdown-item:hover {
                background: rgba(255, 77, 77, 0.1);
                color: #ff4d4d;
            }
            
            .dropdown-item span {
                width: 16px;
                text-align: center;
            }
            
            @media (max-width: 768px) {
                .user-name {
                    display: none;
                }
                
                .dropdown-menu {
                    right: -50px;
                    min-width: 150px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    attachDropdownEvents(userNav) {
        const userBtn = userNav.querySelector('.user-btn');
        const dropdown = userNav.querySelector('.user-dropdown');
        
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });
        
        // إغلاق القائمة عند النقر خارجها
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }
    
    attachEventListeners() {
        // مستمع لتغييرات التخزين المحلي (للتزامن بين التبويبات)
        window.addEventListener('storage', (e) => {
            if (e.key === 'isLoggedIn' || e.key === 'currentUser') {
                this.checkAuthStatus();
                this.updateNavigation();
            }
        });
    }
    
    login(userData) {
        this.currentUser = userData;
        this.isLoggedIn = true;
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
        
        this.updateNavigation();
    }
    
    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('isLoggedIn');
        
        // إعادة توجيه إلى الصفحة الرئيسية
        window.location.href = 'index.html';
    }
    
    requireAuth() {
        if (!this.isLoggedIn) {
            window.location.href = 'login-simple.html';
            return false;
        }
        return true;
    }
    
    requireRole(role) {
        if (!this.requireAuth()) return false;
        
        if (this.currentUser.role !== role) {
            alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
            window.location.href = 'home.html';
            return false;
        }
        return true;
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isUserLoggedIn() {
        return this.isLoggedIn;
    }
}

// إنشاء مثيل عام من مدير المصادقة
window.authManager = new AuthManager();

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
