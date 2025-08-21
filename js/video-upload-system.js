// نظام رفع وإدارة الفيديوهات المتقدم
// يدعم Supabase Storage و خدمات خارجية

class VideoUploadSystem {
    constructor() {
        this.maxFileSize = 500 * 1024 * 1024; // 500MB
        this.allowedFormats = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
        this.compressionSettings = {
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1080
        };
    }

    // رفع فيديو إلى Supabase Storage
    async uploadToSupabase(file, metadata = {}) {
        try {
            // التحقق من صحة الملف
            const validation = this.validateFile(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // إنشاء اسم فريد للملف
            const fileName = this.generateUniqueFileName(file.name);
            const filePath = `videos/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

            // عرض تقدم الرفع
            const progressCallback = (progress) => {
                this.updateUploadProgress(progress);
            };

            // رفع الملف
            const { data, error } = await window.supabaseClient.storage
                .from('videos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                    onUploadProgress: progressCallback
                });

            if (error) {
                throw new Error(`فشل في رفع الملف: ${error.message}`);
            }

            // الحصول على رابط الملف
            const { data: urlData } = await window.supabaseClient.storage
                .from('videos')
                .createSignedUrl(filePath, 60 * 60 * 24 * 365); // صالح لسنة

            // حفظ معلومات الفيديو في قاعدة البيانات
            const videoData = {
                ...metadata,
                video_url: urlData.signedUrl,
                file_path: filePath,
                file_size: file.size,
                duration_minutes: await this.getVideoDuration(file),
                thumbnail_url: await this.generateThumbnail(file),
                status: 'processing'
            };

            const result = await window.supabaseFunctions.addVideo(videoData);
            
            if (result.success) {
                // تحديث حالة الفيديو إلى "متاح"
                await this.updateVideoStatus(result.data.id, 'active');
                return { success: true, data: result.data, url: urlData.signedUrl };
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Upload error:', error);
            return { success: false, error: error.message };
        }
    }

    // رفع فيديو إلى خدمة خارجية (مثل Bunny.net)
    async uploadToBunnyNet(file, metadata = {}) {
        try {
            const validation = this.validateFile(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            const fileName = this.generateUniqueFileName(file.name);
            
            // إعدادات Bunny.net (يجب تخصيصها)
            const bunnyConfig = {
                storageZone: 'vip-videos', // اسم Storage Zone
                accessKey: 'YOUR_BUNNY_ACCESS_KEY', // مفتاح الوصول
                pullZone: 'vip-videos-pull.b-cdn.net' // Pull Zone URL
            };

            // رفع الملف إلى Bunny.net
            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await fetch(`https://storage.bunnycdn.com/${bunnyConfig.storageZone}/${fileName}`, {
                method: 'PUT',
                headers: {
                    'AccessKey': bunnyConfig.accessKey,
                    'Content-Type': 'application/octet-stream'
                },
                body: file
            });

            if (!uploadResponse.ok) {
                throw new Error('فشل في رفع الملف إلى Bunny.net');
            }

            const videoUrl = `https://${bunnyConfig.pullZone}/${fileName}`;

            // حفظ معلومات الفيديو في قاعدة البيانات
            const videoData = {
                ...metadata,
                video_url: videoUrl,
                file_path: fileName,
                file_size: file.size,
                duration_minutes: await this.getVideoDuration(file),
                thumbnail_url: await this.generateThumbnail(file),
                storage_provider: 'bunny',
                status: 'active'
            };

            const result = await window.supabaseFunctions.addVideo(videoData);
            
            if (result.success) {
                return { success: true, data: result.data, url: videoUrl };
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Bunny.net upload error:', error);
            return { success: false, error: error.message };
        }
    }

    // التحقق من صحة الملف
    validateFile(file) {
        if (!file) {
            return { valid: false, error: 'لم يتم اختيار ملف' };
        }

        if (file.size > this.maxFileSize) {
            return { valid: false, error: `حجم الملف كبير جداً. الحد الأقصى ${this.maxFileSize / (1024 * 1024)}MB` };
        }

        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!this.allowedFormats.includes(fileExtension)) {
            return { valid: false, error: `صيغة الملف غير مدعومة. الصيغ المدعومة: ${this.allowedFormats.join(', ')}` };
        }

        return { valid: true };
    }

    // إنشاء اسم فريد للملف
    generateUniqueFileName(originalName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const extension = originalName.split('.').pop();
        return `video_${timestamp}_${random}.${extension}`;
    }

    // الحصول على مدة الفيديو
    async getVideoDuration(file) {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            video.onloadedmetadata = function() {
                window.URL.revokeObjectURL(video.src);
                resolve(Math.round(video.duration / 60)); // بالدقائق
            };
            
            video.onerror = function() {
                resolve(0);
            };
            
            video.src = URL.createObjectURL(file);
        });
    }

    // إنشاء صورة مصغرة للفيديو
    async generateThumbnail(file) {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            video.onloadedmetadata = function() {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                video.currentTime = Math.min(5, video.duration / 2); // الثانية الخامسة أو منتصف الفيديو
            };
            
            video.onseeked = function() {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                window.URL.revokeObjectURL(video.src);
                resolve(thumbnailDataUrl);
            };
            
            video.onerror = function() {
                resolve(null);
            };
            
            video.src = URL.createObjectURL(file);
        });
    }

    // تحديث تقدم الرفع
    updateUploadProgress(progress) {
        const progressElement = document.getElementById('uploadProgress');
        if (progressElement) {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            progressElement.style.width = percentage + '%';
            progressElement.textContent = percentage + '%';
        }

        const statusElement = document.getElementById('uploadStatus');
        if (statusElement) {
            if (progress.loaded === progress.total) {
                statusElement.textContent = 'جاري معالجة الفيديو...';
            } else {
                statusElement.textContent = `جاري الرفع... ${Math.round(progress.loaded / (1024 * 1024))}MB من ${Math.round(progress.total / (1024 * 1024))}MB`;
            }
        }
    }

    // تحديث حالة الفيديو
    async updateVideoStatus(videoId, status) {
        try {
            await window.supabaseFunctions.updateVideo(videoId, { status: status });
        } catch (error) {
            console.error('Error updating video status:', error);
        }
    }

    // ضغط الفيديو (إذا لزم الأمر)
    async compressVideo(file) {
        // هذه دالة متقدمة تحتاج مكتبة خارجية مثل ffmpeg.wasm
        // يمكن تنفيذها لاحقاً حسب الحاجة
        return file;
    }

    // حذف فيديو من التخزين
    async deleteVideo(videoId, filePath, storageProvider = 'supabase') {
        try {
            if (storageProvider === 'supabase') {
                const { error } = await window.supabaseClient.storage
                    .from('videos')
                    .remove([filePath]);
                
                if (error) {
                    console.error('Error deleting from storage:', error);
                }
            } else if (storageProvider === 'bunny') {
                // حذف من Bunny.net
                const bunnyConfig = {
                    storageZone: 'vip-videos',
                    accessKey: 'YOUR_BUNNY_ACCESS_KEY'
                };

                await fetch(`https://storage.bunnycdn.com/${bunnyConfig.storageZone}/${filePath}`, {
                    method: 'DELETE',
                    headers: {
                        'AccessKey': bunnyConfig.accessKey
                    }
                });
            }

            // حذف من قاعدة البيانات
            return await window.supabaseFunctions.deleteVideo(videoId);

        } catch (error) {
            console.error('Error deleting video:', error);
            return { success: false, error: error.message };
        }
    }
}

// إنشاء مثيل عام
window.videoUploadSystem = new VideoUploadSystem();

// دوال مساعدة للواجهة
function initVideoUpload() {
    const uploadArea = document.getElementById('videoUploadArea');
    const fileInput = document.getElementById('videoFileInput');
    
    if (uploadArea && fileInput) {
        // دعم السحب والإفلات
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleVideoUpload(files[0]);
            }
        });
        
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleVideoUpload(e.target.files[0]);
            }
        });
    }
}

// معالجة رفع الفيديو
async function handleVideoUpload(file) {
    const metadata = {
        title: document.getElementById('videoTitle')?.value || 'فيديو بدون عنوان',
        description: document.getElementById('videoDescription')?.value || '',
        course_id: document.getElementById('videoCourse')?.value || null,
        teacher_id: document.getElementById('videoTeacher')?.value || null,
        requires_code: document.getElementById('videoRequiresCode')?.checked || false
    };

    // اختيار طريقة الرفع (يمكن جعلها قابلة للتخصيص)
    const uploadMethod = 'supabase'; // أو 'bunny'
    
    let result;
    if (uploadMethod === 'supabase') {
        result = await window.videoUploadSystem.uploadToSupabase(file, metadata);
    } else if (uploadMethod === 'bunny') {
        result = await window.videoUploadSystem.uploadToBunnyNet(file, metadata);
    }
    
    if (result.success) {
        showNotification('تم رفع الفيديو بنجاح!', 'success');
        // إعادة تحميل قائمة الفيديوهات
        if (typeof loadVideosData === 'function') {
            loadVideosData();
        }
    } else {
        showNotification(`فشل في رفع الفيديو: ${result.error}`, 'error');
    }
}

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoUploadSystem;
}
