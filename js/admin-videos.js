// Admin Videos Management
let videosData = [];
let coursesData = [];
let teachersData = [];
let currentEditId = null;

// Initialize videos management
document.addEventListener('DOMContentLoaded', function() {
    loadInitialData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Add video form submission
    const addVideoForm = document.getElementById('addVideoForm');
    if (addVideoForm) {
        addVideoForm.addEventListener('submit', handleAddVideo);
    }

    // Search functionality
    const searchInput = document.getElementById('videoSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleVideoSearch);
    }
}

// Load initial data from Supabase
async function loadInitialData() {
    try {
        showLoading('جاري تحميل البيانات...');
        
        // Load videos, courses, and teachers in parallel
        const [videosResult, coursesResult, teachersResult] = await Promise.all([
            window.supabaseFunctions.getAllVideos(),
            window.supabaseFunctions.getAllCourses(),
            window.supabaseFunctions.getAllTeachers()
        ]);
        
        if (videosResult.success) {
            videosData = videosResult.data || [];
            displayVideos(videosData);
        }
        
        if (coursesResult.success) {
            coursesData = coursesResult.data || [];
            populateCoursesDropdown();
        }
        
        if (teachersResult.success) {
            teachersData = teachersResult.data || [];
            populateTeachersDropdown();
        }
        
        showNotification('تم تحميل البيانات بنجاح', 'success');
    } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('خطأ في تحميل البيانات', 'error');
        // Fallback to empty arrays
        videosData = [];
        coursesData = [];
        teachersData = [];
        displayVideos([]);
    } finally {
        hideLoading();
    }
}

// Populate courses dropdown
function populateCoursesDropdown() {
    const courseSelects = document.querySelectorAll('select[name="course_id"]');
    courseSelects.forEach(select => {
        select.innerHTML = '<option value="">اختر الكورس</option>';
        coursesData.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.title;
            select.appendChild(option);
        });
    });
}

// Populate teachers dropdown
function populateTeachersDropdown() {
    const teacherSelects = document.querySelectorAll('select[name="teacher_id"]');
    teacherSelects.forEach(select => {
        select.innerHTML = '<option value="">اختر المدرس</option>';
        teachersData.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.name} - ${teacher.subject || 'غير محدد'}`;
            select.appendChild(option);
        });
    });
}

// Handle add video form submission
async function handleAddVideo(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const videoData = {
        title: formData.get('title'),
        description: formData.get('description'),
        course_id: parseInt(formData.get('course_id')),
        teacher_id: formData.get('teacher_id') ? parseInt(formData.get('teacher_id')) : null,
        video_url: formData.get('video_url'),
        thumbnail_url: formData.get('thumbnail_url') || null,
        duration_minutes: parseInt(formData.get('duration_minutes')) || 0,
        order_in_course: parseInt(formData.get('order_in_course')) || 0,
        status: 'active'
    };

    try {
        showLoading('جاري إضافة الفيديو...');
        
        const result = await window.supabaseFunctions.addVideo(videoData);
        
        if (result.success) {
            showNotification('تم إضافة الفيديو بنجاح', 'success');
            event.target.reset();
            closeModal('addVideoModal');
            loadInitialData(); // Reload data
        } else {
            showNotification(`خطأ في إضافة الفيديو: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Exception adding video:', error);
        showNotification('خطأ في إضافة الفيديو', 'error');
    } finally {
        hideLoading();
    }
}

// Handle edit video
async function handleEditVideo(videoId) {
    const video = videosData.find(v => v.id === videoId);
    if (!video) return;

    currentEditId = videoId;
    
    // Populate form fields
    document.getElementById('editVideoTitle').value = video.title;
    document.getElementById('editVideoDescription').value = video.description || '';
    document.getElementById('editVideoCourseId').value = video.course_id || '';
    document.getElementById('editVideoTeacherId').value = video.teacher_id || '';
    document.getElementById('editVideoUrl').value = video.video_url;
    document.getElementById('editVideoThumbnailUrl').value = video.thumbnail_url || '';
    document.getElementById('editVideoDuration').value = video.duration_minutes || 0;
    document.getElementById('editVideoOrder').value = video.order_in_course || 0;
    document.getElementById('editVideoStatus').value = video.status || 'active';
    
    openModal('editVideoModal');
}

// Handle update video
async function handleUpdateVideo(event) {
    event.preventDefault();
    
    if (!currentEditId) return;
    
    const formData = new FormData(event.target);
    const videoData = {
        title: formData.get('title'),
        description: formData.get('description'),
        course_id: parseInt(formData.get('course_id')),
        teacher_id: formData.get('teacher_id') ? parseInt(formData.get('teacher_id')) : null,
        video_url: formData.get('video_url'),
        thumbnail_url: formData.get('thumbnail_url') || null,
        duration_minutes: parseInt(formData.get('duration_minutes')) || 0,
        order_in_course: parseInt(formData.get('order_in_course')) || 0,
        status: formData.get('status')
    };

    try {
        showLoading('جاري تحديث بيانات الفيديو...');
        
        // Update in Supabase
        const { data, error } = await window.supabaseClient
            .from('videos')
            .update(videoData)
            .eq('id', currentEditId)
            .select();
        
        if (error) throw error;
        
        showNotification('تم تحديث بيانات الفيديو بنجاح', 'success');
        closeModal('editVideoModal');
        currentEditId = null;
        loadInitialData(); // Reload data
    } catch (error) {
        console.error('Error updating video:', error);
        showNotification(`خطأ في تحديث بيانات الفيديو: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Handle delete video
async function handleDeleteVideo(videoId) {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;
    
    try {
        showLoading('جاري حذف الفيديو...');
        
        const { error } = await window.supabaseClient
            .from('videos')
            .delete()
            .eq('id', videoId);
        
        if (error) throw error;
        
        showNotification('تم حذف الفيديو بنجاح', 'success');
        loadInitialData(); // Reload data
    } catch (error) {
        console.error('Error deleting video:', error);
        showNotification(`خطأ في حذف الفيديو: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Simulate video upload (for demo purposes)
function simulateUpload() {
    const progressBar = document.getElementById('uploadProgress');
    const progressText = document.getElementById('uploadProgressText');
    
    if (progressBar && progressText) {
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                showNotification('تم رفع الفيديو بنجاح!', 'success');
            }
            
            progressBar.style.width = progress + '%';
            progressText.textContent = Math.round(progress) + '%';
        }, 200);
    }
}

// Display videos in the table
function displayVideos(videos) {
    const tbody = document.querySelector('#videosTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (videos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    لا يوجد فيديوهات حالياً
                </td>
            </tr>
        `;
        return;
    }
    
    videos.forEach(video => {
        const course = coursesData.find(c => c.id === video.course_id);
        const teacher = teachersData.find(t => t.id === video.teacher_id);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="video-info">
                    <img src="${video.thumbnail_url || 'images/default-video.jpg'}" alt="${video.title}" class="video-thumbnail">
                    <div>
                        <div class="video-title">${video.title}</div>
                        <div class="video-course">${course ? course.title : 'غير محدد'}</div>
                    </div>
                </div>
            </td>
            <td>${video.description ? video.description.substring(0, 50) + '...' : 'لا يوجد وصف'}</td>
            <td>${teacher ? teacher.name : 'غير محدد'}</td>
            <td>${video.duration_minutes} دقيقة</td>
            <td>${video.order_in_course}</td>
            <td>${video.views_count || 0}</td>
            <td>
                <span class="status-badge status-${video.status}">
                    ${getStatusText(video.status)}
                </span>
            </td>
            <td>${video.created_at ? new Date(video.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="handleEditVideo(${video.id})" class="btn-edit" title="تعديل">
                        ✏️
                    </button>
                    <button onclick="handleDeleteVideo(${video.id})" class="btn-delete" title="حذف">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Handle video search
function handleVideoSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    if (!searchTerm) {
        displayVideos(videosData);
        return;
    }
    
    const filteredVideos = videosData.filter(video => 
        video.title.toLowerCase().includes(searchTerm) ||
        (video.description && video.description.toLowerCase().includes(searchTerm)) ||
        (video.course_id && coursesData.find(c => c.id === video.course_id)?.title.toLowerCase().includes(searchTerm)) ||
        (video.teacher_id && teachersData.find(t => t.id === video.teacher_id)?.name.toLowerCase().includes(searchTerm))
    );
    
    displayVideos(filteredVideos);
}

// Get status text in Arabic
function getStatusText(status) {
    const statusMap = {
        'active': 'نشط',
        'inactive': 'غير نشط',
        'processing': 'قيد المعالجة'
    };
    return statusMap[status] || status;
}

// Utility functions
function showLoading(message) {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.textContent = message;
        loadingDiv.style.display = 'block';
    }
}

function hideLoading() {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

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

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Export functions for global use
window.handleEditVideo = handleEditVideo;
window.handleUpdateVideo = handleUpdateVideo;
window.handleDeleteVideo = handleDeleteVideo;
window.handleVideoSearch = handleVideoSearch;
window.simulateUpload = simulateUpload;
