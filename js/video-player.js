// مشغل فيديو متقدم مع حماية المحتوى
class SecureVideoPlayer {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            controls: true,
            autoplay: false,
            muted: false,
            loop: false,
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
            quality: 'auto',
            watermark: true,
            disableRightClick: true,
            disableDownload: true,
            disableScreenshot: true,
            trackViewing: true,
            ...options
        };
        
        this.player = null;
        this.isFullscreen = false;
        this.currentTime = 0;
        this.duration = 0;
        this.viewingStartTime = null;
        this.totalViewingTime = 0;
        
        this.init();
    }

    // تهيئة المشغل
    init() {
        this.createPlayerHTML();
        this.setupEventListeners();
        this.applySecurityMeasures();
    }

    // إنشاء HTML للمشغل
    createPlayerHTML() {
        this.container.innerHTML = `
            <div class="secure-video-player" id="${this.containerId}_player">
                <div class="video-container">
                    <video 
                        id="${this.containerId}_video"
                        class="video-element"
                        ${this.options.controls ? '' : 'controls'}
                        ${this.options.autoplay ? 'autoplay' : ''}
                        ${this.options.muted ? 'muted' : ''}
                        ${this.options.loop ? 'loop' : ''}
                        preload="metadata"
                        controlsList="nodownload nofullscreen noremoteplayback"
                        disablePictureInPicture
                    >
                        متصفحك لا يدعم تشغيل الفيديو
                    </video>
                    
                    ${this.options.watermark ? this.createWatermark() : ''}
                    
                    <div class="video-overlay" id="${this.containerId}_overlay">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                            <p>جاري التحميل...</p>
                        </div>
                    </div>
                    
                    ${this.options.controls ? this.createCustomControls() : ''}
                </div>
                
                <div class="video-info" id="${this.containerId}_info">
                    <h3 class="video-title"></h3>
                    <p class="video-description"></p>
                </div>
            </div>
        `;
        
        this.player = document.getElementById(`${this.containerId}_video`);
        this.overlay = document.getElementById(`${this.containerId}_overlay`);
    }

    // إنشاء علامة مائية
    createWatermark() {
        return `
            <div class="video-watermark">
                <img src="images/vip-logo.jpg" alt="VIP Center">
                <span>VIP Center</span>
            </div>
        `;
    }

    // إنشاء عناصر تحكم مخصصة
    createCustomControls() {
        return `
            <div class="custom-controls" id="${this.containerId}_controls">
                <div class="progress-container">
                    <div class="progress-bar" id="${this.containerId}_progress">
                        <div class="progress-filled" id="${this.containerId}_progress_filled"></div>
                        <div class="progress-handle" id="${this.containerId}_progress_handle"></div>
                    </div>
                </div>
                
                <div class="controls-row">
                    <div class="controls-left">
                        <button class="control-btn play-pause" id="${this.containerId}_play_pause">
                            <span class="play-icon">▶️</span>
                            <span class="pause-icon" style="display: none;">⏸️</span>
                        </button>
                        
                        <div class="volume-container">
                            <button class="control-btn volume-btn" id="${this.containerId}_volume_btn">🔊</button>
                            <div class="volume-slider" id="${this.containerId}_volume_slider">
                                <input type="range" min="0" max="1" step="0.1" value="1">
                            </div>
                        </div>
                        
                        <div class="time-display">
                            <span id="${this.containerId}_current_time">00:00</span>
                            <span>/</span>
                            <span id="${this.containerId}_duration">00:00</span>
                        </div>
                    </div>
                    
                    <div class="controls-right">
                        <select class="playback-rate" id="${this.containerId}_playback_rate">
                            ${this.options.playbackRates.map(rate => 
                                `<option value="${rate}" ${rate === 1 ? 'selected' : ''}>${rate}x</option>`
                            ).join('')}
                        </select>
                        
                        <button class="control-btn quality-btn" id="${this.containerId}_quality">HD</button>
                        
                        <button class="control-btn fullscreen-btn" id="${this.containerId}_fullscreen">⛶</button>
                    </div>
                </div>
            </div>
        `;
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        if (!this.player) return;

        // أحداث الفيديو الأساسية
        this.player.addEventListener('loadstart', () => this.showLoading());
        this.player.addEventListener('canplay', () => this.hideLoading());
        this.player.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
        this.player.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.player.addEventListener('ended', () => this.onVideoEnded());
        this.player.addEventListener('play', () => this.onPlay());
        this.player.addEventListener('pause', () => this.onPause());
        this.player.addEventListener('error', (e) => this.onError(e));

        // عناصر التحكم المخصصة
        if (this.options.controls) {
            this.setupCustomControls();
        }

        // تتبع المشاهدة
        if (this.options.trackViewing) {
            this.setupViewingTracking();
        }
    }

    // إعداد عناصر التحكم المخصصة
    setupCustomControls() {
        const playPauseBtn = document.getElementById(`${this.containerId}_play_pause`);
        const volumeBtn = document.getElementById(`${this.containerId}_volume_btn`);
        const volumeSlider = document.getElementById(`${this.containerId}_volume_slider`).querySelector('input');
        const playbackRateSelect = document.getElementById(`${this.containerId}_playback_rate`);
        const fullscreenBtn = document.getElementById(`${this.containerId}_fullscreen`);
        const progressBar = document.getElementById(`${this.containerId}_progress`);

        // تشغيل/إيقاف
        playPauseBtn?.addEventListener('click', () => this.togglePlayPause());

        // الصوت
        volumeBtn?.addEventListener('click', () => this.toggleMute());
        volumeSlider?.addEventListener('input', (e) => this.setVolume(e.target.value));

        // سرعة التشغيل
        playbackRateSelect?.addEventListener('change', (e) => this.setPlaybackRate(e.target.value));

        // ملء الشاشة
        fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());

        // شريط التقدم
        progressBar?.addEventListener('click', (e) => this.seekToPosition(e));
    }

    // إعداد تتبع المشاهدة
    setupViewingTracking() {
        // تسجيل بداية المشاهدة
        this.player.addEventListener('play', () => {
            this.viewingStartTime = Date.now();
        });

        // تسجيل إيقاف المشاهدة
        this.player.addEventListener('pause', () => {
            if (this.viewingStartTime) {
                this.totalViewingTime += Date.now() - this.viewingStartTime;
                this.viewingStartTime = null;
            }
        });

        // إرسال إحصائيات المشاهدة كل 30 ثانية
        setInterval(() => {
            if (!this.player.paused && this.viewingStartTime) {
                this.sendViewingStats();
            }
        }, 30000);

        // إرسال الإحصائيات عند مغادرة الصفحة
        window.addEventListener('beforeunload', () => {
            this.sendViewingStats();
        });
    }

    // تطبيق إجراءات الحماية
    applySecurityMeasures() {
        if (this.options.disableRightClick) {
            this.container.addEventListener('contextmenu', (e) => e.preventDefault());
        }

        if (this.options.disableScreenshot) {
            // منع لقطات الشاشة (محدود الفعالية)
            this.container.style.userSelect = 'none';
            this.container.style.webkitUserSelect = 'none';
            this.container.style.mozUserSelect = 'none';
            this.container.style.msUserSelect = 'none';
        }

        // منع فتح أدوات المطور على الفيديو
        this.player.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                e.preventDefault();
            }
        });

        // إخفاء الفيديو إذا تم فتح أدوات المطور
        let devtools = {
            open: false,
            orientation: null
        };
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 160) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.player.style.display = 'none';
                    this.showMessage('يرجى إغلاق أدوات المطور لمتابعة المشاهدة');
                }
            } else {
                if (devtools.open) {
                    devtools.open = false;
                    this.player.style.display = 'block';
                    this.hideMessage();
                }
            }
        }, 500);
    }

    // تحميل فيديو
    async loadVideo(videoData) {
        try {
            // التحقق من صلاحية الوصول
            const hasAccess = await this.checkVideoAccess(videoData.id);
            if (!hasAccess) {
                this.showError('ليس لديك صلاحية لمشاهدة هذا الفيديو');
                return;
            }

            this.player.src = videoData.video_url;
            
            // تحديث معلومات الفيديو
            const titleElement = this.container.querySelector('.video-title');
            const descElement = this.container.querySelector('.video-description');
            
            if (titleElement) titleElement.textContent = videoData.title;
            if (descElement) descElement.textContent = videoData.description;

            // تسجيل بداية المشاهدة
            this.logVideoView(videoData.id);

        } catch (error) {
            console.error('Error loading video:', error);
            this.showError('حدث خطأ في تحميل الفيديو');
        }
    }

    // التحقق من صلاحية الوصول للفيديو
    async checkVideoAccess(videoId) {
        try {
            // هنا يمكن إضافة منطق التحقق من الأكواد أو الاشتراكات
            const { data: video } = await window.supabaseClient
                .from('videos')
                .select('requires_code, course_id')
                .eq('id', videoId)
                .single();

            if (video.requires_code) {
                // التحقق من وجود كود صحيح
                const accessCode = localStorage.getItem(`video_access_${videoId}`);
                if (!accessCode) {
                    return false;
                }
                
                const { data: codeData } = await window.supabaseClient
                    .from('access_codes')
                    .select('*')
                    .eq('code', accessCode)
                    .eq('status', 'active')
                    .single();

                return !!codeData;
            }

            return true;
        } catch (error) {
            console.error('Error checking video access:', error);
            return false;
        }
    }

    // تسجيل مشاهدة الفيديو
    async logVideoView(videoId) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || '{}');
            
            await window.supabaseClient
                .from('video_views')
                .insert([{
                    video_id: videoId,
                    student_id: currentUser.id || null,
                    viewed_at: new Date().toISOString(),
                    ip_address: await this.getClientIP()
                }]);
        } catch (error) {
            console.error('Error logging video view:', error);
        }
    }

    // إرسال إحصائيات المشاهدة
    async sendViewingStats() {
        try {
            const stats = {
                current_time: this.currentTime,
                total_viewing_time: this.totalViewingTime,
                completion_percentage: (this.currentTime / this.duration) * 100
            };

            // يمكن إرسال الإحصائيات إلى قاعدة البيانات هنا
            console.log('Viewing stats:', stats);
        } catch (error) {
            console.error('Error sending viewing stats:', error);
        }
    }

    // دوال التحكم في المشغل
    play() { this.player.play(); }
    pause() { this.player.pause(); }
    togglePlayPause() { this.player.paused ? this.play() : this.pause(); }
    setVolume(volume) { this.player.volume = volume; }
    toggleMute() { this.player.muted = !this.player.muted; }
    setPlaybackRate(rate) { this.player.playbackRate = rate; }
    seekTo(time) { this.player.currentTime = time; }

    // ملء الشاشة
    toggleFullscreen() {
        if (!this.isFullscreen) {
            if (this.container.requestFullscreen) {
                this.container.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        this.isFullscreen = !this.isFullscreen;
    }

    // أحداث المشغل
    onMetadataLoaded() {
        this.duration = this.player.duration;
        this.updateDurationDisplay();
    }

    onTimeUpdate() {
        this.currentTime = this.player.currentTime;
        this.updateProgressBar();
        this.updateTimeDisplay();
    }

    onPlay() {
        const playIcon = this.container.querySelector('.play-icon');
        const pauseIcon = this.container.querySelector('.pause-icon');
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = 'inline';
    }

    onPause() {
        const playIcon = this.container.querySelector('.play-icon');
        const pauseIcon = this.container.querySelector('.pause-icon');
        if (playIcon) playIcon.style.display = 'inline';
        if (pauseIcon) pauseIcon.style.display = 'none';
    }

    onVideoEnded() {
        // يمكن إضافة منطق عند انتهاء الفيديو
        this.sendViewingStats();
    }

    onError(error) {
        console.error('Video error:', error);
        this.showError('حدث خطأ في تشغيل الفيديو');
    }

    // دوال مساعدة للواجهة
    showLoading() {
        if (this.overlay) this.overlay.style.display = 'flex';
    }

    hideLoading() {
        if (this.overlay) this.overlay.style.display = 'none';
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="video-error">
                <h3>❌ خطأ في تشغيل الفيديو</h3>
                <p>${message}</p>
                <button onclick="location.reload()">إعادة المحاولة</button>
            </div>
        `;
    }

    showMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'video-message';
        messageDiv.innerHTML = `<p>${message}</p>`;
        this.container.appendChild(messageDiv);
    }

    hideMessage() {
        const messageDiv = this.container.querySelector('.video-message');
        if (messageDiv) messageDiv.remove();
    }

    updateProgressBar() {
        const progressFilled = document.getElementById(`${this.containerId}_progress_filled`);
        if (progressFilled && this.duration > 0) {
            const percentage = (this.currentTime / this.duration) * 100;
            progressFilled.style.width = percentage + '%';
        }
    }

    updateTimeDisplay() {
        const currentTimeElement = document.getElementById(`${this.containerId}_current_time`);
        if (currentTimeElement) {
            currentTimeElement.textContent = this.formatTime(this.currentTime);
        }
    }

    updateDurationDisplay() {
        const durationElement = document.getElementById(`${this.containerId}_duration`);
        if (durationElement) {
            durationElement.textContent = this.formatTime(this.duration);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    seekToPosition(event) {
        const progressBar = event.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * this.duration;
        this.seekTo(newTime);
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

    // تنظيف الموارد
    destroy() {
        if (this.player) {
            this.player.pause();
            this.player.src = '';
            this.player.load();
        }
        this.sendViewingStats();
    }
}

// تصدير للاستخدام العام
window.SecureVideoPlayer = SecureVideoPlayer;

// دالة مساعدة لإنشاء مشغل فيديو
function createVideoPlayer(containerId, options = {}) {
    return new SecureVideoPlayer(containerId, options);
}

window.createVideoPlayer = createVideoPlayer;
