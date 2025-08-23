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
    const videoForm = document.getElementById('videoForm');
    if (videoForm) {
        videoForm.addEventListener('submit', handleAddVideo);
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
    
    // Get form values directly from form elements to ensure we capture them
    const title = document.getElementById('videoTitle').value.trim();
    const description = document.getElementById('videoDescription').value.trim();
    const teacherId = document.getElementById('videoTeacher').value.trim();
    const videoUrl = document.getElementById('videoUrl').value.trim();
    
    // Validate required fields
    if (!title) {
        showNotification('يرجى إدخال عنوان الفيديو', 'error');
        return;
    }
    
    if (!teacherId) {
        showNotification('يرجى اختيار المدرس', 'error');
        return;
    }
    
    if (!videoUrl) {
        showNotification('يرجى إدخال رابط الفيديو', 'error');
        return;
    }
    
    // Handle thumbnail upload
    let thumbnailUrl = null;
    const thumbnailFile = formData.get('video_thumbnail');
    if (thumbnailFile && thumbnailFile.size > 0) {
        // Convert image to base64 for storage
        const reader = new FileReader();
        thumbnailUrl = await new Promise((resolve, reject) => {
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(thumbnailFile);
        });
    }
    
    const videoData = {
        title: title,
        description: description || null,
        teacher_id: teacherId,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || null,
        duration_minutes: 0, // Default value
        order_in_course: 0, // Default value
        status: 'active'
    };

    try {
        showLoading('جاري إضافة الفيديو...');
        
        const result = await window.supabaseFunctions.addVideo(videoData);
        
        if (result.success) {
            showNotification('تم إضافة الفيديو بنجاح', 'success');
            event.target.reset();
            closeVideoModal();
            loadInitialData(); // Reload data
            
            // Notify other tabs/windows about content update
            localStorage.setItem('vip-content-updated', Date.now());
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
        course_id: formData.get('course_id') && formData.get('course_id').trim() !== '' ? formData.get('course_id') : null,
        teacher_id: formData.get('teacher_id') && formData.get('teacher_id').trim() !== '' ? formData.get('teacher_id') : null,
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

// Show add video modal
function showAddVideoModal() {
    const modal = document.getElementById('videoModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    const modalTitle = document.getElementById('videoModalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'إضافة فيديو جديد';
    }
    
    const form = document.getElementById('videoForm');
    if (form) {
        form.reset();
    }
    
    // Populate dropdowns
    populateCoursesDropdown();
    populateTeachersDropdown();
}

// Close video modal
function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// View video details
function viewVideo(videoId) {
    const video = videosData.find(v => v.id === videoId);
    if (video) {
        showNotification(`عرض تفاصيل الفيديو: ${video.title}`, 'info');
        // Open video in new tab if URL exists
        if (video.video_url) {
            window.open(video.video_url, '_blank');
        }
    }
}

// Edit video
function editVideo(videoId) {
    handleEditVideo(videoId);
}

// Delete video
function deleteVideo(videoId) {
    handleDeleteVideo(videoId);
}

// Filter videos
function filterVideos(filter) {
    let filteredVideos = videosData;
    
    switch(filter) {
        case 'public':
            filteredVideos = videosData.filter(v => !v.requires_code);
            break;
        case 'private':
            filteredVideos = videosData.filter(v => v.requires_code);
            break;
        case 'active':
            filteredVideos = videosData.filter(v => v.status === 'active');
            break;
        case 'inactive':
            filteredVideos = videosData.filter(v => v.status === 'inactive');
            break;
        default:
            // Filter by course ID if numeric
            if (!isNaN(filter)) {
                filteredVideos = videosData.filter(v => v.course_id == filter);
            }
    }
    
    displayVideos(filteredVideos);
}

// Search videos
function searchVideos(searchTerm) {
    if (!searchTerm) {
        displayVideos(videosData);
        return;
    }
    
    const filtered = videosData.filter(video => 
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (video.teacher_name && video.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    displayVideos(filtered);
}

// Toggle video source display
function toggleVideoSource() {
    const sourceType = document.getElementById('videoSourceType').value;
    const uploadSection = document.getElementById('uploadSection');
    const linkSection = document.getElementById('linkSection');
    
    // Hide both sections first
    if (uploadSection) uploadSection.style.display = 'none';
    if (linkSection) linkSection.style.display = 'none';
    
    // Show appropriate section based on selection
    switch(sourceType) {
        case 'upload':
            if (uploadSection) uploadSection.style.display = 'block';
            break;
        case 'youtube':
        case 'vimeo':
        case 'external':
            if (linkSection) linkSection.style.display = 'block';
            break;
    }
}

// Handle video file upload
function handleVideoUpload(input) {
    const file = input.files[0];
    if (file) {
        const fileSize = formatFileSize(file.size);
        showNotification(`تم اختيار الملف: ${file.name} (${fileSize})`, 'info');
        
        // Show upload progress simulation
        const progressContainer = document.getElementById('uploadProgress');
        if (progressContainer) {
            progressContainer.style.display = 'block';
            simulateUpload();
        }
    }
}

// Handle thumbnail upload
function handleThumbnailUpload(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('thumbnailPreview');
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة المصغرة" style="max-width: 200px; max-height: 120px; border-radius: 8px;">`;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
        showNotification(`تم اختيار الصورة المصغرة: ${file.name}`, 'info');
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلو بايت', 'ميجا بايت', 'جيجا بايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Export functions for global use
window.handleEditVideo = handleEditVideo;
window.handleUpdateVideo = handleUpdateVideo;
window.handleDeleteVideo = handleDeleteVideo;
window.handleVideoSearch = handleVideoSearch;
window.showAddVideoModal = showAddVideoModal;
window.closeVideoModal = closeVideoModal;
window.viewVideo = viewVideo;
window.editVideo = editVideo;
window.deleteVideo = deleteVideo;
window.filterVideos = filterVideos;
window.searchVideos = searchVideos;
window.simulateUpload = simulateUpload;
window.toggleVideoSource = toggleVideoSource;
window.handleVideoUpload = handleVideoUpload;
window.handleThumbnailUpload = handleThumbnailUpload;
