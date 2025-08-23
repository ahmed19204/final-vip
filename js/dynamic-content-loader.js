// Dynamic Content Loader - VIP Center
// This file handles real-time synchronization between admin panel and frontend

class DynamicContentLoader {
    constructor() {
        this.cache = new Map();
        this.updateCallbacks = new Map();
        this.init();
    }

    init() {
        // Initialize content loading
        this.loadAllContent();
        
        // Set up auto-refresh intervals
        this.setupAutoRefresh();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('🚀 Dynamic Content Loader initialized');
    }

    // Load all content types
    async loadAllContent() {
        try {
            const [courses, teachers, subjects, videos, accessCodes] = await Promise.all([
                this.loadCourses(),
                this.loadTeachers(),
                this.loadSubjects(),
                this.loadVideos(),
                this.loadAccessCodes()
            ]);

            // Update UI with loaded content
            this.updateCoursesUI(courses);
            this.updateTeachersUI(teachers);
            this.updateSubjectsUI(subjects);
            this.updateVideosUI(videos);
            
            console.log('✅ All content loaded successfully');
        } catch (error) {
            console.error('❌ Error loading content:', error);
            this.showNotification('خطأ في تحميل المحتوى', 'error');
        }
    }

    // Load courses from Supabase
    async loadCourses() {
        try {
            if (!window.supabaseFunctions) {
                throw new Error('Supabase not available');
            }

            const result = await window.supabaseFunctions.getAllCourses();
            
            if (result.success) {
                this.cache.set('courses', result.data);
                this.triggerUpdate('courses', result.data);
                return result.data;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            return [];
        }
    }

    // Load teachers from Supabase
    async loadTeachers() {
        try {
            if (!window.supabaseFunctions) {
                throw new Error('Supabase not available');
            }

            const result = await window.supabaseFunctions.getAllTeachers();
            
            if (result.success) {
                this.cache.set('teachers', result.data);
                this.triggerUpdate('teachers', result.data);
                return result.data;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error loading teachers:', error);
            return [];
        }
    }

    // Load subjects from Supabase
    async loadSubjects() {
        try {
            if (!window.supabaseFunctions) {
                throw new Error('Supabase not available');
            }

            const result = await window.supabaseFunctions.getAllSubjects();
            
            if (result.success) {
                this.cache.set('subjects', result.data);
                this.triggerUpdate('subjects', result.data);
                return result.data;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
            return [];
        }
    }

    // Load videos from Supabase
    async loadVideos() {
        try {
            if (!window.supabaseFunctions) {
                throw new Error('Supabase not available');
            }

            const result = await window.supabaseFunctions.getAllVideos();
            
            if (result.success) {
                this.cache.set('videos', result.data);
                this.triggerUpdate('videos', result.data);
                return result.data;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error loading videos:', error);
            return [];
        }
    }

    // Load access codes from Supabase
    async loadAccessCodes() {
        try {
            if (!window.supabaseFunctions) {
                throw new Error('Supabase not available');
            }

            const result = await window.supabaseFunctions.getAllAccessCodes();
            
            if (result.success) {
                this.cache.set('accessCodes', result.data);
                this.triggerUpdate('accessCodes', result.data);
                return result.data;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error loading access codes:', error);
            return [];
        }
    }

    // Update courses UI
    updateCoursesUI(courses) {
        // Update courses section on homepage
        const coursesContainer = document.getElementById('coursesContainer');
        const featuredCoursesContainer = document.getElementById('featuredCourses');
        
        if (coursesContainer) {
            this.renderCourses(coursesContainer, courses);
        }
        
        if (featuredCoursesContainer) {
            // Show only featured/active courses
            const featuredCourses = courses.filter(course => 
                course.status === 'active'
            ).slice(0, 6); // Show top 6
            this.renderCourses(featuredCoursesContainer, featuredCourses);
        }
    }

    // Render courses HTML
    renderCourses(container, courses) {
        if (!courses || courses.length === 0) {
            container.innerHTML = `
                <div class="no-content">
                    <p>لا توجد كورسات متاحة حالياً</p>
                </div>
            `;
            return;
        }

        container.innerHTML = courses.map(course => `
            <div class="course-card" data-course-id="${course.id}">
                <div class="course-image">
                    <img src="${course.image_url || 'images/default-course.jpg'}" 
                         alt="${course.title}" 
                         loading="lazy">
                    <div class="course-overlay">
                        <span class="course-price">${course.price > 0 ? course.price + ' جنيه' : 'مجاني'}</span>
                    </div>
                </div>
                <div class="course-content">
                    <h3 class="course-title">${course.title}</h3>
                    <p class="course-description">${course.description || 'وصف الكورس غير متاح'}</p>
                    <div class="course-meta">
                        <span class="course-teacher">
                            👨‍🏫 ${course.teachers?.name || 'غير محدد'}
                        </span>
                        <span class="course-subject">
                            📚 ${course.subjects?.name || 'غير محدد'}
                        </span>
                    </div>
                    <div class="course-stats">
                        <span class="course-duration">⏱️ ${course.duration_hours || 0} ساعة</span>
                        <span class="course-students">👥 ${course.student_count || 0} طالب</span>
                        <span class="course-rating">⭐ ${course.rating || 0}</span>
                    </div>
                    <button class="course-btn" onclick="enrollInCourse('${course.id}')">
                        ${course.requires_code ? '🔐 يتطلب كود' : '📖 ابدأ التعلم'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Update teachers UI
    updateTeachersUI(teachers) {
        const teachersContainer = document.getElementById('teachersContainer');
        
        if (teachersContainer) {
            this.renderTeachers(teachersContainer, teachers);
        }
    }

    // Render teachers HTML
    renderTeachers(container, teachers) {
        if (!teachers || teachers.length === 0) {
            container.innerHTML = `
                <div class="no-content">
                    <p>لا يوجد مدرسين متاحين حالياً</p>
                </div>
            `;
            return;
        }

        container.innerHTML = teachers.map(teacher => `
            <div class="teacher-card" data-teacher-id="${teacher.id}">
                <div class="teacher-image">
                    <img src="${teacher.image_url || 'images/default-teacher.jpg'}" 
                         alt="${teacher.name}" 
                         loading="lazy">
                </div>
                <div class="teacher-content">
                    <h3 class="teacher-name">${teacher.name}</h3>
                    <p class="teacher-subject">${teacher.subject || 'تخصص غير محدد'}</p>
                    <p class="teacher-bio">${teacher.bio || 'لا يوجد وصف متاح'}</p>
                    <div class="teacher-stats">
                        <span class="teacher-experience">📚 ${teacher.experience_years || 0} سنة خبرة</span>
                        <span class="teacher-students">👥 ${teacher.total_students || 0} طالب</span>
                        <span class="teacher-rating">⭐ ${teacher.rating || 0}</span>
                    </div>
                    <button class="teacher-btn" onclick="viewTeacherProfile('${teacher.id}')">
                        عرض الملف الشخصي
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Update subjects UI
    updateSubjectsUI(subjects) {
        const subjectsContainer = document.getElementById('subjectsContainer');
        
        if (subjectsContainer) {
            this.renderSubjects(subjectsContainer, subjects);
        }
    }

    // Render subjects HTML
    renderSubjects(container, subjects) {
        if (!subjects || subjects.length === 0) {
            container.innerHTML = `
                <div class="no-content">
                    <p>لا توجد تخصصات متاحة حالياً</p>
                </div>
            `;
            return;
        }

        container.innerHTML = subjects.map(subject => `
            <div class="subject-card" data-subject-id="${subject.id}">
                <div class="subject-image">
                    <img src="${subject.image_url || 'images/default-subject.jpg'}" 
                         alt="${subject.name}" 
                         loading="lazy">
                </div>
                <div class="subject-content">
                    <h3 class="subject-name">${subject.name}</h3>
                    <p class="subject-description">${subject.description || 'وصف التخصص غير متاح'}</p>
                    <div class="subject-stats">
                        <span class="subject-level">📊 ${subject.difficulty_level || 'متوسط'}</span>
                        <span class="subject-courses">📚 ${subject.total_courses || 0} كورس</span>
                        <span class="subject-students">👥 ${subject.total_students || 0} طالب</span>
                    </div>
                    <button class="subject-btn" onclick="exploreSubject('${subject.id}')">
                        استكشف التخصص
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Update videos UI
    updateVideosUI(videos) {
        const videosContainer = document.getElementById('videosContainer');
        
        if (videosContainer) {
            this.renderVideos(videosContainer, videos);
        }
    }

    // Render videos HTML
    renderVideos(container, videos) {
        if (!videos || videos.length === 0) {
            container.innerHTML = `
                <div class="no-content">
                    <p>لا توجد فيديوهات متاحة حالياً</p>
                </div>
            `;
            return;
        }

        const activeVideos = videos.filter(video => video.status === 'active');
        
        container.innerHTML = activeVideos.map(video => `
            <div class="video-card" data-video-id="${video.id}">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail_url || 'images/default-video.jpg'}" 
                         alt="${video.title}" 
                         loading="lazy">
                    <div class="video-play-overlay">
                        <span class="play-icon">▶</span>
                    </div>
                    <div class="video-duration">${this.formatDuration(video.duration_minutes)}</div>
                </div>
                <div class="video-content">
                    <h3 class="video-title">${video.title}</h3>
                    <p class="video-description">${video.description || 'وصف الفيديو غير متاح'}</p>
                    <div class="video-meta">
                        <span class="video-course">📚 ${video.courses?.title || 'غير محدد'}</span>
                        <span class="video-views">👁️ ${video.views_count || 0} مشاهدة</span>
                    </div>
                    <button class="video-btn" onclick="playVideo('${video.id}', '${video.video_url}')">
                        مشاهدة الفيديو
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Format duration from minutes to readable format
    formatDuration(minutes) {
        if (!minutes || minutes === 0) return '0:00';
        
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:00`;
        } else {
            return `${mins}:00`;
        }
    }

    // Set up auto-refresh intervals
    setupAutoRefresh() {
        // Refresh content every 2 minutes
        setInterval(() => {
            this.loadAllContent();
        }, 120000); // 2 minutes

        // More frequent refresh for critical updates
        setInterval(() => {
            this.loadCourses();
        }, 60000); // 1 minute for courses
    }

    // Set up event listeners
    setupEventListeners() {
        // Listen for storage events (cross-tab communication)
        window.addEventListener('storage', (event) => {
            if (event.key === 'vip-content-updated') {
                this.loadAllContent();
            }
        });

        // Listen for focus events to refresh content
        window.addEventListener('focus', () => {
            this.loadAllContent();
        });

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.loadAllContent();
            this.showNotification('تم استعادة الاتصال - تحديث المحتوى', 'success');
        });
    }

    // Trigger update callbacks
    triggerUpdate(contentType, data) {
        const callbacks = this.updateCallbacks.get(contentType) || [];
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in update callback for ${contentType}:`, error);
            }
        });
    }

    // Register update callback
    onUpdate(contentType, callback) {
        if (!this.updateCallbacks.has(contentType)) {
            this.updateCallbacks.set(contentType, []);
        }
        this.updateCallbacks.get(contentType).push(callback);
    }

    // Get cached data
    getCached(contentType) {
        return this.cache.get(contentType) || [];
    }

    // Force refresh specific content
    async refreshContent(contentType) {
        switch (contentType) {
            case 'courses':
                return await this.loadCourses();
            case 'teachers':
                return await this.loadTeachers();
            case 'subjects':
                return await this.loadSubjects();
            case 'videos':
                return await this.loadVideos();
            case 'accessCodes':
                return await this.loadAccessCodes();
            default:
                return await this.loadAllContent();
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            max-width: 400px;
            word-wrap: break-word;
            animation: slideInRight 0.3s ease-out;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }
}

// Global functions for UI interactions
function enrollInCourse(courseId) {
    console.log('Enrolling in course:', courseId);
    // Implementation for course enrollment
    window.dynamicLoader.showNotification('سيتم إضافة نظام التسجيل قريباً', 'info');
}

function viewTeacherProfile(teacherId) {
    console.log('Viewing teacher profile:', teacherId);
    // Implementation for teacher profile
    window.dynamicLoader.showNotification('سيتم إضافة ملف المدرس قريباً', 'info');
}

function exploreSubject(subjectId) {
    console.log('Exploring subject:', subjectId);
    // Implementation for subject exploration
    window.dynamicLoader.showNotification('سيتم إضافة استكشاف التخصص قريباً', 'info');
}

function playVideo(videoId, videoUrl) {
    console.log('Playing video:', videoId, videoUrl);
    if (videoUrl) {
        window.open(videoUrl, '_blank');
    } else {
        window.dynamicLoader.showNotification('رابط الفيديو غير متاح', 'error');
    }
}

// Initialize dynamic loader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if supabase is available
    if (typeof window.supabaseClient !== 'undefined') {
        window.dynamicLoader = new DynamicContentLoader();
    } else {
        console.warn('Supabase not available - dynamic content loading disabled');
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .no-content {
        text-align: center;
        padding: 2rem;
        color: #888;
        font-style: italic;
    }

    .course-card, .teacher-card, .subject-card, .video-card {
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .course-card:hover, .teacher-card:hover, .subject-card:hover, .video-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(255, 77, 77, 0.3);
    }

    .video-play-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.7);
        border-radius: 50%;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }

    .play-icon {
        color: white;
        font-size: 24px;
        margin-left: 4px;
    }

    .video-duration {
        position: absolute;
        bottom: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
    }
`;
document.head.appendChild(style);

// Export for use in other files
window.DynamicContentLoader = DynamicContentLoader;
