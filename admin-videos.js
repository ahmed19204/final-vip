// Admin Videos Management JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeVideosPage();
});

// Video Management System
const videoManager = {
    currentVideoId: null,
    uploadProgress: 0,
    
    // Show add video modal
    showAddModal: function() {
        this.currentVideoId = null;
        document.getElementById('modalTitle').textContent = 'إضافة فيديو جديد';
        document.getElementById('videoForm').reset();
        document.getElementById('videoModal').style.display = 'flex';
        this.resetForm();
    },
    
    // Show edit video modal
    showEditModal: function(videoId) {
        this.currentVideoId = videoId;
        document.getElementById('modalTitle').textContent = 'تعديل الفيديو';
        document.getElementById('videoModal').style.display = 'flex';
        this.loadVideoData(videoId);
    },
    
    // Close modal
    closeModal: function() {
        document.getElementById('videoModal').style.display = 'none';
        this.resetForm();
    },
    
    // Reset form
    resetForm: function() {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('linkSection').style.display = 'none';
        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('thumbnailPreview').style.display = 'none';
        this.uploadProgress = 0;
    },
    
    // Toggle video source type
    toggleSourceType: function() {
        const sourceType = document.getElementById('videoSourceType').value;
        const uploadSection = document.getElementById('uploadSection');
        const linkSection = document.getElementById('linkSection');
        
        uploadSection.style.display = 'none';
        linkSection.style.display = 'none';
        
        if (sourceType === 'upload') {
            uploadSection.style.display = 'block';
        } else if (['youtube', 'vimeo', 'external'].includes(sourceType)) {
            linkSection.style.display = 'block';
        }
    },
    
    // Handle video file upload
    handleVideoUpload: function(input) {
        const file = input.files[0];
        if (!file) return;
        
        // Validate file type
        const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
        if (!allowedTypes.includes(file.type)) {
            showNotification('نوع الملف غير مدعوم. يرجى اختيار ملف فيديو صالح.', 'error');
            input.value = '';
            return;
        }
        
        // Validate file size (max 500MB)
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (file.size > maxSize) {
            showNotification('حجم الملف كبير جداً. الحد الأقصى 500 ميجا بايت.', 'error');
            input.value = '';
            return;
        }
        
        // Show upload progress
        this.simulateUpload(file);
    },
    
    // Simulate file upload with progress
    simulateUpload: function(file) {
        const progressSection = document.getElementById('uploadProgress');
        const progressBar = document.getElementById('progressBar');
        const statusText = document.getElementById('uploadStatus');
        
        progressSection.style.display = 'block';
        this.uploadProgress = 0;
        
        // TODO: رفع الفيديو إلى قاعدة البيانات
        console.log('رفع الفيديو:', file.name);
        
        setTimeout(() => {
            this.uploadProgress = 100;
            statusText.textContent = 'تم رفع الفيديو بنجاح!';
            statusText.style.color = '#51cf66';
                setTimeout(() => {
                    progressSection.style.display = 'none';
                }, 2000);
            }
            
            progressBar.style.width = this.uploadProgress + '%';
            statusText.textContent = `جاري الرفع... ${Math.round(this.uploadProgress)}%`;
        }, 200);
    },
    
    // Handle thumbnail upload
    handleThumbnailUpload: function(input) {
        const file = input.files[0];
        if (!file) return;
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            showNotification('نوع الصورة غير مدعوم. يرجى اختيار صورة صالحة.', 'error');
            input.value = '';
            return;
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showNotification('حجم الصورة كبير جداً. الحد الأقصى 5 ميجا بايت.', 'error');
            input.value = '';
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('thumbnailPreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة المصغرة">`;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    },
    
    // Load video data for editing
    loadVideoData: function(videoId) {
        // In a real application, this would load from the server
        const sampleData = {
            title: 'مقدمة في الموجات الكهرومغناطيسية',
            subject: 'physics',
            teacher: '1',
            code: 'PHYSICS101',
            description: 'شرح مفصل لمفهوم الموجات الكهرومغناطيسية وخصائصها',
            sourceType: 'youtube',
            url: 'https://www.youtube.com/watch?v=example',
            placement: 'homepage',
            tags: 'فيزياء, موجات, كهرومغناطيسية',
            status: 'active'
        };
        
        // Populate form fields
        Object.keys(sampleData).forEach(key => {
            const element = document.getElementById('video' + key.charAt(0).toUpperCase() + key.slice(1));
            if (element) {
                element.value = sampleData[key];
            }
        });
        
        // Update source type display
        this.toggleSourceType();
    },
    
    // Save video
    saveVideo: function(formData) {
        const videoData = {
            title: formData.get('title'),
            subject: formData.get('subject'),
            teacher: formData.get('teacher'),
            code: formData.get('code'),
            description: formData.get('description'),
            sourceType: formData.get('sourceType'),
            url: formData.get('url'),
            placement: formData.get('placement'),
            tags: formData.get('tags'),
            status: formData.get('status'),
            views: 0,
            duration: '00:00',
            createdAt: new Date().toISOString()
        };
        
        if (this.currentVideoId) {
            // Update existing video
            adminData.update('videos', this.currentVideoId, videoData);
            showNotification('تم تحديث الفيديو بنجاح!', 'success');
        } else {
            // Add new video
            adminData.add('videos', videoData);
            showNotification('تم إضافة الفيديو بنجاح!', 'success');
        }
        
        this.closeModal();
        this.refreshVideoTable();
    },
    
    // Delete video
    deleteVideo: function(videoId) {
        if (confirm('هل أنت متأكد من حذف هذا الفيديو؟')) {
            adminData.delete('videos', videoId);
            showNotification('تم حذف الفيديو بنجاح!', 'success');
            this.refreshVideoTable();
        }
    },
    
    // Preview video
    previewVideo: function(videoId) {
        // In a real application, this would open a preview modal
        showNotification('معاينة الفيديو - هذه الميزة ستكون متاحة قريباً', 'info');
    },
    
    // Refresh video table
    refreshVideoTable: function() {
        // In a real application, this would reload the table data
        console.log('Refreshing video table...');
    },
    
    // Filter videos
    filterVideos: function(filterType) {
        const table = document.getElementById('videosTable');
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            if (filterType === 'all') {
                row.style.display = '';
            } else {
                const subjectCell = row.cells[2].textContent.toLowerCase();
                const codeCell = row.cells[5].textContent;
                
                let shouldShow = false;
                
                switch(filterType) {
                    case 'protected':
                        shouldShow = codeCell && codeCell !== '-';
                        break;
                    case 'free':
                        shouldShow = !codeCell || codeCell === '-';
                        break;
                    case 'physics':
                        shouldShow = subjectCell.includes('فيزياء');
                        break;
                    case 'chemistry':
                        shouldShow = subjectCell.includes('كيمياء');
                        break;
                    case 'biology':
                        shouldShow = subjectCell.includes('أحياء');
                        break;
                    case 'math':
                        shouldShow = subjectCell.includes('رياضيات');
                        break;
                }
                
                row.style.display = shouldShow ? '' : 'none';
            }
        });
    },
    
    // Search videos
    searchVideos: function(searchTerm) {
        const table = document.getElementById('videosTable');
        const rows = table.querySelectorAll('tbody tr');
        const term = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const title = row.cells[1].textContent.toLowerCase();
            const subject = row.cells[2].textContent.toLowerCase();
            const teacher = row.cells[3].textContent.toLowerCase();
            
            const shouldShow = title.includes(term) || 
                             subject.includes(term) || 
                             teacher.includes(term);
            
            row.style.display = shouldShow ? '' : 'none';
        });
    }
};

// Initialize videos page
function initializeVideosPage() {
    // Set up form submission
    const videoForm = document.getElementById('videoForm');
    if (videoForm) {
        videoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            videoManager.saveVideo(formData);
        });
    }
    
    // Set up source type change handler
    const sourceTypeSelect = document.getElementById('videoSourceType');
    if (sourceTypeSelect) {
        sourceTypeSelect.addEventListener('change', () => {
            videoManager.toggleSourceType();
        });
    }
    
    // Set up file upload handlers
    const videoFileInput = document.getElementById('videoFile');
    if (videoFileInput) {
        videoFileInput.addEventListener('change', function() {
            videoManager.handleVideoUpload(this);
        });
    }
    
    const thumbnailInput = document.getElementById('videoThumbnail');
    if (thumbnailInput) {
        thumbnailInput.addEventListener('change', function() {
            videoManager.handleThumbnailUpload(this);
        });
    }
    
    // Set up drag and drop for video upload
    const uploadLabel = document.querySelector('.admin-file-label');
    if (uploadLabel) {
        uploadLabel.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#ff4d4d';
            this.style.background = 'rgba(255, 77, 77, 0.1)';
        });
        
        uploadLabel.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = 'rgba(255, 77, 77, 0.3)';
            this.style.background = 'rgba(255, 77, 77, 0.05)';
        });
        
        uploadLabel.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = 'rgba(255, 77, 77, 0.3)';
            this.style.background = 'rgba(255, 77, 77, 0.05)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const videoInput = document.getElementById('videoFile');
                videoInput.files = files;
                videoManager.handleVideoUpload(videoInput);
            }
        });
    }
}

// Global functions for HTML onclick handlers
function showAddVideoModal() {
    videoManager.showAddModal();
}

function closeVideoModal() {
    videoManager.closeModal();
}

function editVideo(videoId) {
    videoManager.showEditModal(videoId);
}

function deleteVideo(videoId) {
    videoManager.deleteVideo(videoId);
}

function previewVideo(videoId) {
    videoManager.previewVideo(videoId);
}

function toggleVideoSource() {
    videoManager.toggleSourceType();
}

function handleVideoUpload(input) {
    videoManager.handleVideoUpload(input);
}

function handleThumbnailUpload(input) {
    videoManager.handleThumbnailUpload(input);
}

function filterVideos(filterType) {
    videoManager.filterVideos(filterType);
}

function searchVideos(searchTerm) {
    videoManager.searchVideos(searchTerm);
}

// Video validation utilities
const videoUtils = {
    // Extract video ID from YouTube URL
    extractYouTubeId: function(url) {
        const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    },
    
    // Extract video ID from Vimeo URL
    extractVimeoId: function(url) {
        const regex = /vimeo\.com\/(\d+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    },
    
    // Validate video URL
    validateVideoUrl: function(url, sourceType) {
        if (!url) return false;
        
        switch(sourceType) {
            case 'youtube':
                return this.extractYouTubeId(url) !== null;
            case 'vimeo':
                return this.extractVimeoId(url) !== null;
            case 'external':
                return validateUrl(url);
            default:
                return false;
        }
    },
    
    // Generate embed URL
    generateEmbedUrl: function(url, sourceType) {
        switch(sourceType) {
            case 'youtube':
                const youtubeId = this.extractYouTubeId(url);
                return youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : null;
            case 'vimeo':
                const vimeoId = this.extractVimeoId(url);
                return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
            default:
                return url;
        }
    },
    
    // Get video thumbnail
    getVideoThumbnail: function(url, sourceType) {
        switch(sourceType) {
            case 'youtube':
                const youtubeId = this.extractYouTubeId(url);
                return youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null;
            case 'vimeo':
                // Vimeo thumbnails require API call, return placeholder
                return 'https://via.placeholder.com/320x180?text=Vimeo+Video';
            default:
                return 'https://via.placeholder.com/320x180?text=Video';
        }
    }
};

// Export video utilities
window.videoUtils = videoUtils;
