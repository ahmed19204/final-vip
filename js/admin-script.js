// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initializeDashboard();
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

// Authentication System
const adminAuth = {
    // Valid admin credentials (in production, this would be server-side)
    validCredentials: {
        'admin': { password: 'admin123', role: 'super_admin', name: 'المدير العام' }
    },

    login: function(username, password, role) {
        const user = this.validCredentials[username];
        if (user && user.password === password && user.role === role) {
            // Store session
            sessionStorage.setItem('adminUser', JSON.stringify({
                username: username,
                name: user.name,
                role: role,
                loginTime: new Date().toISOString()
            }));
            return true;
        }
        return false;
    },

    logout: function() {
        sessionStorage.removeItem('adminUser');
        localStorage.removeItem('adminData');
        window.location.href = 'admin-login.html';
    },

    getCurrentUser: function() {
        const userData = sessionStorage.getItem('adminUser');
        return userData ? JSON.parse(userData) : null;
    },

    isAuthenticated: function() {
        return this.getCurrentUser() !== null;
    },

    checkPermission: function(requiredRole) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        const roleHierarchy = {
            'super_admin': 3,
            'content_admin': 2,
            'teacher_admin': 1
        };
        
        return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
    }
};

// Admin Login Handler
if (document.getElementById('adminLoginForm')) {
    document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        const role = document.getElementById('adminRole').value;
        const errorDiv = document.getElementById('adminLoginError');
        
        if (adminAuth.login(username, password, role)) {
            showNotification('تم تسجيل الدخول بنجاح!', 'success');
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);
        } else {
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'بيانات الدخول غير صحيحة';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
    });
}

// Check authentication on admin pages
function checkAdminAuth() {
    if (window.location.pathname.includes('admin-') && !window.location.pathname.includes('admin-login')) {
        if (!adminAuth.isAuthenticated()) {
            window.location.href = 'admin-login.html';
            return false;
        }
    }
    return true;
}

// Initialize Dashboard
function initializeDashboard() {
    if (!checkAdminAuth()) return;
    
    // Update user info in header
    const user = adminAuth.getCurrentUser();
    if (user) {
        const userInfoElements = document.querySelectorAll('.admin-user-info span:first-child');
        userInfoElements.forEach(el => {
            el.textContent = `مرحباً، ${user.name}`;
        });
        
        const roleElements = document.querySelectorAll('.admin-role');
        roleElements.forEach(el => {
            el.textContent = getRoleDisplayName(user.role);
        });
    }
    
    // Load dashboard data
    loadDashboardData();
    
    // Set up navigation
    setupNavigation();
}

// Get role display name in Arabic
function getRoleDisplayName(role) {
    const roleNames = {
        'super_admin': 'مدير عام',
        'content_admin': 'مدير محتوى',
        'teacher_admin': 'مدير مدرسين'
    };
    return roleNames[role] || role;
}

// Update Date/Time
function updateDateTime() {
    const now = new Date();
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };
        dateTimeElement.textContent = now.toLocaleDateString('ar-EG', options);
    }
}

// Load Dashboard Data
function loadDashboardData() {
    // Simulate API calls to load dashboard statistics
    setTimeout(() => {
        updateDashboardStats();
        loadRecentActivities();
    }, 500);
}

// Update Dashboard Statistics
function updateDashboardStats() {
    const stats = {
        totalStudents: 1245,
        totalCourses: 48,
        totalTeachers: 12,
        totalVideos: 324,
        activeCodes: 156,
        todayViews: 2847
    };
    
    // Animate counters
    Object.keys(stats).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            animateCounter(element, stats[key]);
        }
    });
}

// Animate Counter
function animateCounter(element, targetValue) {
    const startValue = 0;
    const duration = 2000;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
        element.textContent = currentValue.toLocaleString('ar-EG');
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Load Recent Activities
function loadRecentActivities() {
    const activities = [
        {
            time: '2025-01-17 14:30',
            activity: 'تسجيل طالب جديد',
            user: 'محمد أحمد',
            details: 'تسجيل في كورس الفيزياء',
            status: 'success'
        },
        {
            time: '2025-01-17 14:25',
            activity: 'رفع فيديو جديد',
            user: 'أ. مصطفى إبراهيم',
            details: 'درس الموجات الكهرومغناطيسية',
            status: 'success'
        },
        {
            time: '2025-01-17 14:20',
            activity: 'إنشاء كود جديد',
            user: 'المدير العام',
            details: 'كود للوحدة الثالثة - كيمياء',
            status: 'success'
        }
    ];
    
    const tbody = document.getElementById('recentActivities');
    if (tbody) {
        // Activities are already in HTML, but we could dynamically load them here
        console.log('Recent activities loaded:', activities.length);
    }
}

// Setup Navigation
function setupNavigation() {
    // Add active class to current page
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.admin-nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
    
    // Add click handlers
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('admin-')) {
                // Check permissions for specific pages
                const requiredRole = getRequiredRoleForPage(this.getAttribute('href'));
                if (requiredRole && !adminAuth.checkPermission(requiredRole)) {
                    e.preventDefault();
                    showNotification('ليس لديك صلاحية للوصول إلى هذه الصفحة', 'error');
                }
            }
        });
    });
}

// Get required role for page
function getRequiredRoleForPage(page) {
    // Allow all pages for super_admin
    // Remove restrictions for now to allow testing
    return null; // No restrictions
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.admin-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `admin-notification admin-message admin-message-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 10001;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        max-width: 400px;
        word-wrap: break-word;
        animation: slideInLeft 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutLeft 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Data Management System
const adminData = {
    // Local storage keys
    STORAGE_KEY: 'adminData',
    
    // Initialize data structure
    init: function() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            const initialData = {
                courses: [],
                teachers: [],
                videos: [],
                codes: [],
                students: [],
                subjects: [],
                settings: {}
            };
            this.save(initialData);
        }
    },
    
    // Load data from localStorage
    load: function() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    },
    
    // Save data to localStorage
    save: function(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    },
    
    // Get specific data type
    get: function(type) {
        const data = this.load();
        return data ? data[type] || [] : [];
    },
    
    // Set specific data type
    set: function(type, value) {
        const data = this.load() || {};
        data[type] = value;
        this.save(data);
    },
    
    // Add item to specific data type
    add: function(type, item) {
        const items = this.get(type);
        item.id = Date.now(); // Simple ID generation
        item.createdAt = new Date().toISOString();
        items.push(item);
        this.set(type, items);
        return item;
    },
    
    // Update item in specific data type
    update: function(type, id, updatedItem) {
        const items = this.get(type);
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updatedItem, updatedAt: new Date().toISOString() };
            this.set(type, items);
            return items[index];
        }
        return null;
    },
    
    // Delete item from specific data type
    delete: function(type, id) {
        const items = this.get(type);
        const filteredItems = items.filter(item => item.id !== id);
        this.set(type, filteredItems);
        return filteredItems.length < items.length;
    }
};

// Initialize data management
adminData.init();

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلو بايت', 'ميجا بايت', 'جيجا بايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInLeft {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutLeft {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(-100%);
            opacity: 0;
        }
    }
    
    .admin-table tr {
        transition: all 0.3s ease;
    }
    
    .admin-card {
        transition: all 0.3s ease;
    }
    
    .admin-nav-link {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);

// Export functions for use in other files
window.adminAuth = adminAuth;
window.adminData = adminData;
window.showNotification = showNotification;
window.formatDate = formatDate;
window.formatFileSize = formatFileSize;
window.generateUniqueId = generateUniqueId;
window.validateEmail = validateEmail;
window.validateUrl = validateUrl;

// Admin Script - General Functions
let currentUser = null;

// Check admin authentication
function checkAdminAuth() {
    // For now, use simple authentication
    // In production, implement proper JWT or session-based auth
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
    
    if (!isAuthenticated) {
        // Redirect to login if not authenticated
        if (window.location.pathname !== '/admin-login.html' && !window.location.pathname.includes('admin-login.html')) {
            window.location.href = 'admin-login.html';
            return false;
        }
    }
    
    return true;
}

// Initialize admin page
function initializeAdminPage() {
    if (!checkAdminAuth()) return;
    
    // Set current user
    currentUser = {
        name: 'مدير عام',
        role: 'admin',
        email: 'admin@vipcenter.com'
    };
    
    // Update UI with user info
    updateUserInfo();
    
    // Add event listeners
    setupAdminEventListeners();
}

// Update user information in UI
function updateUserInfo() {
    const userInfoElements = document.querySelectorAll('.admin-user-info');
    userInfoElements.forEach(element => {
        element.innerHTML = `
            <div class="user-name">${currentUser.name}</div>
            <div class="user-role">${currentUser.role}</div>
        `;
    });
}

// Setup admin event listeners
function setupAdminEventListeners() {
    // Logout functionality
    const logoutButtons = document.querySelectorAll('.admin-logout-btn');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
    
    // Sidebar toggle for mobile
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
}

// Logout function
function logout() {
    // Clear session
    sessionStorage.removeItem('adminAuthenticated');
    
    // Redirect to login
    window.location.href = 'admin-login.html';
}

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    const main = document.querySelector('.admin-main');
    
    if (sidebar && main) {
        sidebar.classList.toggle('collapsed');
        main.classList.toggle('expanded');
    }
}

// Show notification
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

// Open modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        // Add body scroll lock
        document.body.style.overflow = 'hidden';
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Restore body scroll
        document.body.style.overflow = 'auto';
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Close modals with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal[style*="display: block"]');
        openModals.forEach(modal => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
});

// Format date
function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format currency
function formatCurrency(amount) {
    if (!amount) return '0 جنيه';
    
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP'
    }).format(amount);
}

// Validate email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone number (Egyptian format)
function validatePhone(phone) {
    const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
    return phoneRegex.test(phone);
}

// Show loading
function showLoading(message = 'جاري التحميل...') {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.textContent = message;
        loadingDiv.style.display = 'block';
    }
}

// Hide loading
function hideLoading() {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on an admin page
    if (window.location.pathname.includes('admin') || window.location.pathname.includes('admin-')) {
        initializeAdminPage();
    }
});

// Mobile sidebar toggle function
function toggleMobileSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const body = document.body;
    
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
        
        // Add overlay when sidebar is open
        if (sidebar.classList.contains('mobile-open')) {
            const overlay = document.createElement('div');
            overlay.id = 'mobile-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 9999;
                backdrop-filter: blur(2px);
            `;
            overlay.onclick = closeMobileSidebar;
            body.appendChild(overlay);
            body.style.overflow = 'hidden';
        } else {
            closeMobileSidebar();
        }
    }
}

// Close mobile sidebar
function closeMobileSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('mobile-overlay');
    const body = document.body;
    
    if (sidebar) {
        sidebar.classList.remove('mobile-open');
    }
    
    if (overlay) {
        overlay.remove();
    }
    
    body.style.overflow = 'auto';
}

// Close sidebar on window resize
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        closeMobileSidebar();
    }
});

// Export functions for global use
window.checkAdminAuth = checkAdminAuth;
window.showNotification = showNotification;
window.openModal = openModal;
window.closeModal = closeModal;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.toggleMobileSidebar = toggleMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;
