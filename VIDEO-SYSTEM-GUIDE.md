# 🎥 دليل نظام الفيديو المتقدم - المنصة التعليمية

## 📋 نظرة عامة على النظام

تم تطوير نظام فيديو متقدم ومؤمن للمنصة التعليمية يدعم:
- رفع الفيديوهات بأمان
- تشغيل محمي مع حماية المحتوى
- نظام أكواد الوصول
- تتبع المشاهدة والإحصائيات
- دعم خدمات التخزين المتعددة

## 🛠️ إعداد نظام الفيديو

### 1. إعداد Supabase Storage

#### أ) إنشاء Bucket للفيديوهات
```sql
-- في Supabase Dashboard > Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', false);
```

#### ب) إعداد سياسات الأمان
```sql
-- سماح للمدرسين برفع الفيديوهات
CREATE POLICY "Teachers can upload videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'videos' AND 
  auth.uid() IN (
    SELECT auth_user_id FROM admin_users 
    WHERE role IN ('teacher', 'admin', 'super_admin')
  )
);

-- سماح للطلاب بمشاهدة الفيديوهات
CREATE POLICY "Students can view videos" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');
```

### 2. إعداد خدمة خارجية (Bunny.net)

#### أ) إنشاء حساب Bunny.net
```javascript
// في js/video-upload-system.js
const bunnyConfig = {
    storageZone: 'your-storage-zone-name',
    accessKey: 'your-bunny-access-key',
    pullZone: 'your-pull-zone.b-cdn.net'
};
```

#### ب) الحصول على مفاتيح API
1. اذهب إلى [Bunny.net Dashboard](https://dash.bunny.net)
2. أنشئ Storage Zone جديدة
3. أنشئ Pull Zone مرتبطة بـ Storage Zone
4. احفظ Access Key من إعدادات Storage Zone

### 3. إعداد مشغل الفيديو

#### تضمين المشغل في صفحة HTML:
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="css/video-player.css">
</head>
<body>
    <!-- حاوي المشغل -->
    <div id="videoContainer"></div>
    
    <script src="js/video-player.js"></script>
    <script>
        // إنشاء مشغل فيديو
        const player = createVideoPlayer('videoContainer', {
            controls: true,
            watermark: true,
            disableRightClick: true,
            trackViewing: true
        });
        
        // تحميل فيديو
        player.loadVideo({
            id: 'video-uuid',
            title: 'اسم الفيديو',
            description: 'وصف الفيديو',
            video_url: 'https://example.com/video.mp4'
        });
    </script>
</body>
</html>
```

## 🎬 رفع الفيديوهات

### 1. رفع عبر لوحة التحكم

#### في صفحة admin-videos.html:
```html
<!-- منطقة رفع الفيديو -->
<div class="video-upload-area" id="videoUploadArea">
    <div class="upload-icon">🎬</div>
    <h3>رفع فيديو جديد</h3>
    <p>اسحب الفيديو هنا أو انقر للاختيار</p>
    <p>الحد الأقصى: 500MB | الصيغ المدعومة: MP4, WebM, MOV</p>
</div>

<input type="file" id="videoFileInput" accept="video/*" style="display: none;">

<!-- نموذج معلومات الفيديو -->
<form id="videoInfoForm">
    <input type="text" id="videoTitle" placeholder="عنوان الفيديو" required>
    <textarea id="videoDescription" placeholder="وصف الفيديو"></textarea>
    <select id="videoCourse">
        <option value="">اختر الكورس</option>
        <!-- خيارات الكورسات -->
    </select>
    <select id="videoTeacher">
        <option value="">اختر المدرس</option>
        <!-- خيارات المدرسين -->
    </select>
    <label>
        <input type="checkbox" id="videoRequiresCode"> يتطلب كود وصول
    </label>
    <button type="submit">رفع الفيديو</button>
</form>

<!-- شريط التقدم -->
<div class="upload-progress-container" style="display: none;">
    <div class="upload-progress-bar" id="uploadProgress">0%</div>
    <div class="upload-status" id="uploadStatus">جاري التحضير...</div>
</div>
```

#### JavaScript لمعالجة الرفع:
```javascript
// تهيئة نظام رفع الفيديو
document.addEventListener('DOMContentLoaded', function() {
    initVideoUpload();
});

// معالجة رفع الفيديو
async function handleVideoUpload(file) {
    const metadata = {
        title: document.getElementById('videoTitle').value,
        description: document.getElementById('videoDescription').value,
        course_id: document.getElementById('videoCourse').value,
        teacher_id: document.getElementById('videoTeacher').value,
        requires_code: document.getElementById('videoRequiresCode').checked
    };

    // اختيار طريقة الرفع
    const uploadMethod = 'supabase'; // أو 'bunny'
    
    let result;
    if (uploadMethod === 'supabase') {
        result = await window.videoUploadSystem.uploadToSupabase(file, metadata);
    } else if (uploadMethod === 'bunny') {
        result = await window.videoUploadSystem.uploadToBunnyNet(file, metadata);
    }
    
    if (result.success) {
        showNotification('تم رفع الفيديو بنجاح!', 'success');
        loadVideosData(); // إعادة تحميل قائمة الفيديوهات
    } else {
        showNotification(`فشل في رفع الفيديو: ${result.error}`, 'error');
    }
}
```

### 2. رفع متقدم مع ضغط الفيديو

```javascript
// ضغط الفيديو قبل الرفع (تحتاج مكتبة إضافية)
async function compressAndUpload(file) {
    try {
        // ضغط الفيديو باستخدام ffmpeg.wasm (اختياري)
        const compressedFile = await compressVideo(file, {
            width: 1280,
            height: 720,
            bitrate: '1M'
        });
        
        // رفع الملف المضغوط
        await handleVideoUpload(compressedFile);
    } catch (error) {
        console.error('Compression failed:', error);
        // رفع الملف الأصلي في حالة فشل الضغط
        await handleVideoUpload(file);
    }
}
```

## 🔐 نظام أكواد الوصول

### 1. إنشاء أكواد الوصول

#### في admin-codes.html:
```javascript
// إنشاء كود وصول جديد
async function createAccessCode() {
    const codeData = {
        code: generateRandomCode(), // مثل: VIP-2024-ABC123
        course_id: selectedCourseId,
        video_id: selectedVideoId, // اختياري
        expiry_date: calculateExpiryDate(),
        max_uses: 100,
        status: 'active'
    };
    
    const result = await window.supabaseFunctions.addAccessCode(codeData);
    if (result.success) {
        showNotification('تم إنشاء كود الوصول بنجاح!', 'success');
    }
}

// إنشاء كود عشوائي
function generateRandomCode() {
    const prefix = 'VIP-2024-';
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return prefix + suffix;
}
```

### 2. التحقق من أكواد الوصول

#### في video-access.html:
```html
<!-- نموذج إدخال الكود -->
<form id="accessCodeForm">
    <input type="text" id="accessCode" placeholder="أدخل كود الوصول" required>
    <button type="submit">فتح الفيديو</button>
</form>

<script>
document.getElementById('accessCodeForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const code = document.getElementById('accessCode').value;
    const result = await validateAccessCode(code);
    
    if (result.valid) {
        // حفظ الكود في localStorage
        localStorage.setItem(`video_access_${result.videoId}`, code);
        
        // إعادة توجيه لصفحة الفيديو
        window.location.href = `video-player.html?id=${result.videoId}`;
    } else {
        showError('كود الوصول غير صحيح أو منتهي الصلاحية');
    }
});

async function validateAccessCode(code) {
    try {
        const { data, error } = await window.supabaseClient
            .from('access_codes')
            .select('*, videos(*)')
            .eq('code', code)
            .eq('status', 'active')
            .single();
            
        if (error || !data) {
            return { valid: false };
        }
        
        // التحقق من انتهاء الصلاحية
        if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
            return { valid: false, reason: 'expired' };
        }
        
        // التحقق من عدد الاستخدامات
        if (data.current_uses >= data.max_uses) {
            return { valid: false, reason: 'max_uses_reached' };
        }
        
        // تحديث عدد الاستخدامات
        await window.supabaseClient
            .from('access_codes')
            .update({ current_uses: data.current_uses + 1 })
            .eq('id', data.id);
            
        return { 
            valid: true, 
            videoId: data.video_id || data.videos?.id,
            courseId: data.course_id 
        };
        
    } catch (error) {
        console.error('Code validation error:', error);
        return { valid: false };
    }
}
</script>
```

## 📊 تتبع المشاهدة والإحصائيات

### 1. إنشاء جدول إحصائيات المشاهدة

```sql
-- جدول مشاهدات الفيديو
CREATE TABLE video_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    session_id TEXT,
    watch_duration INTEGER DEFAULT 0, -- بالثواني
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس للأداء
CREATE INDEX idx_video_views_video_id ON video_views(video_id);
CREATE INDEX idx_video_views_student_id ON video_views(student_id);
CREATE INDEX idx_video_views_date ON video_views(viewed_at);
```

### 2. تتبع المشاهدة في المشغل

```javascript
// في مشغل الفيديو
class ViewingTracker {
    constructor(videoId, studentId) {
        this.videoId = videoId;
        this.studentId = studentId;
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.totalWatchTime = 0;
        this.lastPosition = 0;
        
        this.initTracking();
    }
    
    initTracking() {
        // تسجيل بداية المشاهدة
        this.logView();
        
        // تحديث الإحصائيات كل 30 ثانية
        setInterval(() => {
            this.updateViewingStats();
        }, 30000);
        
        // حفظ الإحصائيات عند مغادرة الصفحة
        window.addEventListener('beforeunload', () => {
            this.finalizeViewing();
        });
    }
    
    async logView() {
        try {
            await window.supabaseClient
                .from('video_views')
                .insert([{
                    video_id: this.videoId,
                    student_id: this.studentId,
                    session_id: this.sessionId,
                    ip_address: await this.getClientIP()
                }]);
        } catch (error) {
            console.error('Failed to log view:', error);
        }
    }
    
    async updateViewingStats() {
        const currentTime = this.player.currentTime;
        const duration = this.player.duration;
        const completionPercentage = (currentTime / duration) * 100;
        
        try {
            await window.supabaseClient
                .from('video_views')
                .update({
                    watch_duration: Math.floor(currentTime),
                    completion_percentage: completionPercentage.toFixed(2)
                })
                .eq('session_id', this.sessionId);
        } catch (error) {
            console.error('Failed to update viewing stats:', error);
        }
    }
    
    generateSessionId() {
        return `${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
    
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }
}
```

### 3. تقارير الإحصائيات

```javascript
// دالة لجلب إحصائيات الفيديو
async function getVideoStatistics(videoId) {
    try {
        const { data, error } = await window.supabaseClient
            .from('video_views')
            .select(`
                watch_duration,
                completion_percentage,
                viewed_at,
                students(name)
            `)
            .eq('video_id', videoId);
            
        if (error) throw error;
        
        return {
            totalViews: data.length,
            uniqueViewers: new Set(data.map(v => v.student_id)).size,
            averageWatchTime: data.reduce((sum, v) => sum + v.watch_duration, 0) / data.length,
            averageCompletion: data.reduce((sum, v) => sum + v.completion_percentage, 0) / data.length,
            viewsOverTime: data.map(v => ({
                date: v.viewed_at,
                duration: v.watch_duration
            }))
        };
    } catch (error) {
        console.error('Error fetching video statistics:', error);
        return null;
    }
}

// عرض الإحصائيات في لوحة التحكم
async function displayVideoStats(videoId) {
    const stats = await getVideoStatistics(videoId);
    
    document.getElementById('totalViews').textContent = stats.totalViews;
    document.getElementById('uniqueViewers').textContent = stats.uniqueViewers;
    document.getElementById('avgWatchTime').textContent = `${Math.floor(stats.averageWatchTime / 60)} دقيقة`;
    document.getElementById('avgCompletion').textContent = `${stats.averageCompletion.toFixed(1)}%`;
}
```

## 🔒 حماية المحتوى

### 1. حماية من التحميل
```javascript
// منع النقر بالزر الأيمن
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// منع استخدام Developer Tools
document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
    }
});

// إخفاء الفيديو عند فتح Developer Tools
let devtools = {open: false};
setInterval(() => {
    if (window.outerHeight - window.innerHeight > 160) {
        if (!devtools.open) {
            devtools.open = true;
            document.querySelector('video').style.display = 'none';
        }
    } else {
        if (devtools.open) {
            devtools.open = false;
            document.querySelector('video').style.display = 'block';
        }
    }
}, 500);
```

### 2. العلامة المائية
```css
.video-watermark {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 12px;
    z-index: 1000;
    pointer-events: none;
    user-select: none;
}
```

### 3. تشفير URL الفيديو
```javascript
// تشفير URL الفيديو (بسيط)
function encryptVideoUrl(url, key) {
    const encrypted = btoa(url + '|' + Date.now());
    return encrypted;
}

function decryptVideoUrl(encryptedUrl, key) {
    try {
        const decoded = atob(encryptedUrl);
        const [url, timestamp] = decoded.split('|');
        
        // التحقق من انتهاء الصلاحية (24 ساعة)
        if (Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000) {
            throw new Error('URL expired');
        }
        
        return url;
    } catch (error) {
        throw new Error('Invalid URL');
    }
}
```

## 🎯 نصائح للتحسين والأداء

### 1. ضغط الفيديوهات
```bash
# استخدام FFmpeg لضغط الفيديوهات قبل الرفع
ffmpeg -i input.mp4 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k output.mp4
```

### 2. إنشاء صور مصغرة تلقائياً
```javascript
// إنشاء thumbnail للفيديو
async function generateThumbnail(videoFile) {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    return new Promise((resolve) => {
        video.onloadedmetadata = function() {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            video.currentTime = 5; // الثانية الخامسة
        };
        
        video.onseeked = function() {
            ctx.drawImage(video, 0, 0);
            canvas.toBlob(resolve, 'image/jpeg', 0.8);
        };
        
        video.src = URL.createObjectURL(videoFile);
    });
}
```

### 3. تحسين سرعة التحميل
```javascript
// تحميل الفيديو بشكل تدريجي
video.preload = 'metadata'; // بدلاً من 'auto'

// استخدام Adaptive Bitrate
const qualities = [
    { label: '720p', src: 'video_720p.mp4' },
    { label: '480p', src: 'video_480p.mp4' },
    { label: '360p', src: 'video_360p.mp4' }
];

// اختيار الجودة بناءً على سرعة الاتصال
if (navigator.connection) {
    const connection = navigator.connection;
    if (connection.effectiveType === '4g') {
        video.src = qualities[0].src; // 720p
    } else if (connection.effectiveType === '3g') {
        video.src = qualities[1].src; // 480p
    } else {
        video.src = qualities[2].src; // 360p
    }
}
```

---

## 🎯 الخلاصة

تم إنشاء نظام فيديو متكامل يوفر:
- ✅ رفع آمن ومحمي للفيديوهات
- ✅ تشغيل متقدم مع حماية المحتوى
- ✅ نظام أكواد وصول مرن
- ✅ تتبع مفصل للمشاهدة
- ✅ إحصائيات شاملة للمحتوى
- ✅ أداء محسن وسرعة عالية

النظام جاهز للاستخدام الفوري ويمكن تخصيصه حسب احتياجات المنصة التعليمية.
