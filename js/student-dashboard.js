// إدارة لوحة تحكم الطالب المتقدمة

class StudentDashboard {
    constructor() {
        this.currentUser = null;
        this.userCourses = [];
        this.userStats = {
            totalCourses: 0,
            completedCourses: 0,
            progressPercent: 0,
            studyHours: 0
        };
        
        this.init();
    }

    // تهيئة لوحة التحكم
    async init() {
        // التحقق من تسجيل الدخول
        if (!this.checkAuthentication()) {
            window.location.href = 'login.html';
            return;
        }

        // تحميل بيانات المستخدم
        await this.loadUserData();
        
        // تحميل إحصائيات المستخدم
        await this.loadUserStats();
        
        // تحميل الكورسات
        await this.loadUserCourses();
        
        // تحميل الكورسات المقترحة
        await this.loadRecommendedCourses();
        
        // إعداد مستمعي الأحداث
        this.setupEventListeners();
        
        // تحديث الواجهة
        this.updateUI();
    }

    // التحقق من المصادقة
    checkAuthentication() {
        const userData = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        const isLoggedIn = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn');
        
        if (userData && isLoggedIn === 'true') {
            this.currentUser = JSON.parse(userData);
            return true;
        }
        
        return false;
    }

    // تحميل بيانات المستخدم
    async loadUserData() {
        try {
            if (!this.currentUser) return;

            // تحديث بيانات المستخدم من قاعدة البيانات
            const { data: student, error } = await window.supabaseClient
                .from('students')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) throw error;

            if (student) {
                this.currentUser = { ...this.currentUser, ...student };
                
                // تحديث البيانات المحفوظة
                const storage = localStorage.getItem('currentUser') ? localStorage : sessionStorage;
                storage.setItem('currentUser', JSON.stringify(this.currentUser));
            }

        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // تحميل إحصائيات المستخدم
    async loadUserStats() {
        try {
            if (!this.currentUser) return;

            // جلب الكورسات المسجل فيها الطالب
            const { data: enrollments, error: enrollError } = await window.supabaseClient
                .from('course_enrollments')
                .select(`
                    *,
                    courses(id, title, duration_hours)
                `)
                .eq('student_id', this.currentUser.id)
                .eq('status', 'active');

            if (enrollError) throw enrollError;

            // حساب الإحصائيات
            const totalCourses = enrollments?.length || 0;
            const completedCourses = enrollments?.filter(e => e.status === 'completed' || e.progress_percentage === 100).length || 0;
            const totalHours = enrollments?.reduce((sum, e) => sum + (e.courses?.duration_hours || 0), 0) || 0;
            const avgProgress = totalCourses > 0 ? 
                enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / totalCourses : 0;

            this.userStats = {
                totalCourses,
                completedCourses,
                progressPercent: Math.round(avgProgress),
                studyHours: totalHours
            };

        } catch (error) {
            console.error('Error loading user stats:', error);
            // استخدام بيانات افتراضية في حالة الخطأ
            this.userStats = {
                totalCourses: 0,
                completedCourses: 0,
                progressPercent: 0,
                studyHours: 0
            };
        }
    }

    // تحميل كورسات المستخدم
    async loadUserCourses() {
        try {
            if (!this.currentUser) return;

            const { data: enrollments, error } = await window.supabaseClient
                .from('course_enrollments')
                .select(`
                    *,
                    courses(
                        *,
                        subjects(name),
                        teachers(name)
                    )
                `)
                .eq('student_id', this.currentUser.id)
                .eq('status', 'active')
                .order('enrolled_at', { ascending: false });

            if (error) throw error;

            this.userCourses = enrollments || [];

        } catch (error) {
            console.error('Error loading user courses:', error);
            this.userCourses = [];
        }
    }

    // تحميل الكورسات المقترحة
    async loadRecommendedCourses() {
        try {
            // جلب الكورسات الشائعة أو ذات الصلة
            const { data: courses, error } = await window.supabaseClient
                .from('courses')
                .select(`
                    *,
                    subjects(name),
                    teachers(name),
                    videos(id)
                `)
                .eq('status', 'active')
                .limit(6);

            if (error) throw error;

            this.recommendedCourses = courses || [];

        } catch (error) {
            console.error('Error loading recommended courses:', error);
            this.recommendedCourses = [];
        }
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // قائمة المستخدم
        const userMenuBtn = document.querySelector('.user-menu-btn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', () => {
                this.toggleUserMenu();
            });
        }

        // إغلاق القائمة عند النقر خارجها
        document.addEventListener('click', (e) => {
            const userMenu = document.getElementById('userMenuDropdown');
            const userMenuBtn = document.querySelector('.user-menu-btn');
            
            if (userMenu && userMenuBtn && 
                !userMenu.contains(e.target) && 
                !userMenuBtn.contains(e.target)) {
                userMenu.classList.remove('show');
            }
        });
    }

    // تحديث واجهة المستخدم
    updateUI() {
        // تحديث معلومات المستخدم
        this.updateUserInfo();
        
        // تحديث الإحصائيات
        this.updateStats();
        
        // عرض الكورسات الحالية
        this.displayCurrentCourses();
        
        // عرض الكورسات المقترحة
        this.displayRecommendedCourses();
    }

    // تحديث معلومات المستخدم
    updateUserInfo() {
        const studentNameEl = document.getElementById('studentName');
        const studentLevelEl = document.getElementById('studentLevel');

        if (studentNameEl && this.currentUser) {
            const name = this.currentUser.name || this.currentUser.full_name || 'الطالب';
            studentNameEl.textContent = `مرحباً، ${name}`;
        }

        if (studentLevelEl) {
            // تحديد مستوى الطالب بناءً على عدد الكورسات المكتملة
            let level = 'طالب جديد';
            if (this.userStats.completedCourses >= 10) {
                level = 'طالب خبير';
            } else if (this.userStats.completedCourses >= 5) {
                level = 'طالب متقدم';
            } else if (this.userStats.completedCourses >= 1) {
                level = 'طالب نشط';
            }
            
            studentLevelEl.textContent = level;
        }
    }

    // تحديث الإحصائيات
    updateStats() {
        const elements = {
            totalCourses: document.getElementById('totalCourses'),
            completedCourses: document.getElementById('completedCourses'),
            progressPercent: document.getElementById('progressPercent'),
            studyHours: document.getElementById('studyHours')
        };

        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                let value = this.userStats[key];
                if (key === 'progressPercent') {
                    value += '%';
                }
                elements[key].textContent = value;
            }
        });
    }

    // عرض الكورسات الحالية
    displayCurrentCourses() {
        const container = document.getElementById('currentCoursesGrid');
        if (!container) return;

        if (!this.userCourses.length) {
            container.innerHTML = `
                <div class="no-courses-message">
                    <h3>لم تسجل في أي كورس بعد</h3>
                    <p>ابدأ رحلتك التعليمية بتصفح الكورسات المتاحة</p>
                    <button class="btn btn-primary" onclick="showCourseCatalog()">تصفح الكورسات</button>
                </div>
            `;
            return;
        }

        const coursesHTML = this.userCourses.slice(0, 4).map(enrollment => {
            const course = enrollment.courses;
            const progress = enrollment.progress_percentage || 0;
            
            return `
                <div class="course-card" onclick="openCourse('${course.id}')">
                    <img src="${course.image_url || 'images/default-course.jpg'}" 
                         alt="${course.title}" class="course-image">
                    <div class="course-content">
                        <h3 class="course-title">${course.title}</h3>
                        <p class="course-description">${course.description || 'وصف غير متوفر'}</p>
                        
                        <div class="course-meta">
                            <span>👨‍🏫 ${course.teachers?.name || 'غير محدد'}</span>
                            <span>📚 ${course.subjects?.name || 'عام'}</span>
                        </div>
                        
                        <div class="course-progress">
                            <div class="progress-bar" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">${Math.round(progress)}% مكتمل</div>
                        
                        <div class="course-actions">
                            <button class="course-btn btn-primary" onclick="continueCourse('${course.id}')">
                                ${progress > 0 ? 'متابعة' : 'بدء'} الكورس
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = coursesHTML;
    }

    // عرض الكورسات المقترحة
    displayRecommendedCourses() {
        const container = document.getElementById('recommendedCoursesGrid');
        if (!container || !this.recommendedCourses) return;

        const coursesHTML = this.recommendedCourses.slice(0, 4).map(course => {
            const videosCount = course.videos?.length || 0;
            const isOwned = this.userCourses.some(enrollment => 
                enrollment.course_id === course.id);
            
            return `
                <div class="course-card">
                    <img src="${course.image_url || 'images/default-course.jpg'}" 
                         alt="${course.title}" class="course-image">
                    <div class="course-content">
                        <h3 class="course-title">${course.title}</h3>
                        <p class="course-description">${course.description || 'وصف غير متوفر'}</p>
                        
                        <div class="course-meta">
                            <div class="course-price">
                                ${course.price > 0 ? `${course.price} جنيه` : 'مجاني'}
                            </div>
                        </div>
                        
                        <div class="course-details">
                            <span>👨‍🏫 ${course.teachers?.name || 'غير محدد'}</span>
                            <span>🎥 ${videosCount} فيديو</span>
                            <span>⏱️ ${course.duration_hours || 0} ساعة</span>
                        </div>
                        
                        <div class="course-actions">
                            ${isOwned ? 
                                `<button class="course-btn btn-secondary" onclick="continueCourse('${course.id}')">متابعة</button>` :
                                course.price > 0 ? 
                                    `<button class="course-btn btn-primary" onclick="purchaseCourse('${course.id}')">شراء</button>` :
                                    `<button class="course-btn btn-primary" onclick="enrollFreeCourse('${course.id}')">تسجيل مجاني</button>`
                            }
                            <button class="course-btn btn-outline" onclick="previewCourse('${course.id}')">معاينة</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = coursesHTML;
    }

    // تبديل قائمة المستخدم
    toggleUserMenu() {
        const dropdown = document.getElementById('userMenuDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    // عرض نافذة الملف الشخصي
    showProfileModal() {
        // يمكن تطوير هذه الوظيفة لاحقاً
        alert('ميزة الملف الشخصي ستتوفر قريباً');
    }

    // عرض نافذة الإشعارات
    showNotificationsModal() {
        // يمكن تطوير هذه الوظيفة لاحقاً
        alert('ميزة الإشعارات ستتوفر قريباً');
    }

    // عرض نافذة الإعدادات
    showSettingsModal() {
        // يمكن تطوير هذه الوظيفة لاحقاً
        alert('ميزة الإعدادات ستتوفر قريباً');
    }

    // تسجيل الخروج
    logout() {
        if (confirm('هل تريد تسجيل الخروج؟')) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('isLoggedIn');
            
            window.location.href = 'login.html';
        }
    }
}

// إنشاء مثيل عام من لوحة التحكم
window.studentDashboard = null;

// تهيئة لوحة التحكم عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    window.studentDashboard = new StudentDashboard();
});

// دوال عامة للاستخدام في HTML
function toggleUserMenu() {
    if (window.studentDashboard) {
        window.studentDashboard.toggleUserMenu();
    }
}

function showProfileModal() {
    if (window.studentDashboard) {
        window.studentDashboard.showProfileModal();
    }
}

function showNotificationsModal() {
    if (window.studentDashboard) {
        window.studentDashboard.showNotificationsModal();
    }
}

function showSettingsModal() {
    if (window.studentDashboard) {
        window.studentDashboard.showSettingsModal();
    }
}

function logout() {
    if (window.studentDashboard) {
        window.studentDashboard.logout();
    }
}

function openCourse(courseId) {
    window.location.href = `course-viewer.html?id=${courseId}`;
}

function continueCourse(courseId) {
    window.location.href = `course-viewer.html?id=${courseId}`;
}

function showAllCourses() {
    showCourseCatalog();
}

function showRecommendedCourses() {
    showCourseCatalog();
}

function showCertificates() {
    alert('ميزة الشهادات ستتوفر قريباً');
}

function showAddCodeModal() {
    const modal = document.getElementById('addCodeModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

function validateDiscountCode() {
    const codeInput = document.getElementById('discountCode');
    const resultDiv = document.getElementById('codeResult');
    
    if (!codeInput || !resultDiv) return;
    
    const code = codeInput.value.trim();
    if (!code) {
        alert('يرجى إدخال كود الخصم');
        return;
    }
    
    // محاكاة التحقق من الكود
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <div class="code-success">
            <h4>✅ كود صالح!</h4>
            <p>خصم 20% على جميع الكورسات</p>
            <p>صالح حتى: 31/12/2024</p>
        </div>
    `;
}

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudentDashboard;
}
