// نظام تحسين الأداء للمنصة التعليمية
class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.imageCache = new Map();
        this.lazyLoadObserver = null;
        this.performanceMetrics = {
            pageLoadTime: 0,
            apiCallsCount: 0,
            cacheHitRatio: 0,
            imageLoadTime: 0
        };
        
        this.init();
    }

    // تهيئة النظام
    init() {
        this.initLazyLoading();
        this.initImageOptimization();
        this.initCaching();
        this.initPerformanceMonitoring();
        this.preloadCriticalResources();
    }

    // تهيئة التحميل التدريجي للصور
    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.lazyLoadObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        this.lazyLoadObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            // تطبيق التحميل التدريجي على الصور الموجودة
            this.applyLazyLoading();
        }
    }

    // تطبيق التحميل التدريجي على الصور
    applyLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            this.lazyLoadObserver.observe(img);
        });
    }

    // تحميل صورة مع تحسين
    async loadImage(img) {
        const startTime = performance.now();
        
        try {
            // التحقق من وجود الصورة في الكاش
            const cacheKey = img.dataset.src;
            if (this.imageCache.has(cacheKey)) {
                img.src = this.imageCache.get(cacheKey);
                img.classList.add('loaded');
                return;
            }

            // تحميل الصورة
            const response = await fetch(img.dataset.src);
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            // حفظ في الكاش
            this.imageCache.set(cacheKey, imageUrl);
            
            // تطبيق الصورة
            img.src = imageUrl;
            img.classList.add('loaded');
            
            // حساب وقت التحميل
            const loadTime = performance.now() - startTime;
            this.performanceMetrics.imageLoadTime += loadTime;
            
        } catch (error) {
            console.error('Error loading image:', error);
            // استخدام صورة افتراضية في حالة الخطأ
            img.src = 'images/placeholder.jpg';
            img.classList.add('error');
        }
    }

    // تهيئة تحسين الصور
    initImageOptimization() {
        // ضغط الصور قبل الرفع
        this.setupImageCompression();
        
        // تحويل الصور إلى WebP إذا كان مدعوماً
        if (this.supportsWebP()) {
            this.convertToWebP();
        }
    }

    // إعداد ضغط الصور
    setupImageCompression() {
        const fileInputs = document.querySelectorAll('input[type="file"][accept*="image"]');
        
        fileInputs.forEach(input => {
            input.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files);
                const compressedFiles = await Promise.all(
                    files.map(file => this.compressImage(file))
                );
                
                // استبدال الملفات المضغوطة
                const dt = new DataTransfer();
                compressedFiles.forEach(file => dt.items.add(file));
                input.files = dt.files;
            });
        });
    }

    // ضغط صورة
    async compressImage(file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // حساب الأبعاد الجديدة
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // رسم الصورة المضغوطة
                ctx.drawImage(img, 0, 0, width, height);
                
                // تحويل إلى blob
                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                }, file.type, quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // التحقق من دعم WebP
    supportsWebP() {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    // تحويل الصور إلى WebP
    convertToWebP() {
        const images = document.querySelectorAll('img[data-webp]');
        images.forEach(img => {
            if (this.supportsWebP()) {
                img.src = img.dataset.webp;
            }
        });
    }

    // تهيئة نظام الكاش
    initCaching() {
        // كاش للـ API calls
        this.setupAPICache();
        
        // كاش للموارد الثابتة
        this.setupStaticResourceCache();
        
        // تنظيف الكاش القديم
        this.cleanupCache();
    }

    // إعداد كاش الـ API
    setupAPICache() {
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            // تجاهل الكاش للطلبات POST/PUT/DELETE
            if (options.method && options.method !== 'GET') {
                this.performanceMetrics.apiCallsCount++;
                return originalFetch(url, options);
            }
            
            const cacheKey = `${url}_${JSON.stringify(options)}`;
            
            // التحقق من وجود البيانات في الكاش
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                
                // التحقق من صلاحية الكاش (5 دقائق)
                if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
                    console.log('Cache hit:', url);
                    return Promise.resolve(new Response(
                        JSON.stringify(cached.data),
                        { status: 200, headers: { 'Content-Type': 'application/json' } }
                    ));
                } else {
                    this.cache.delete(cacheKey);
                }
            }
            
            // تنفيذ الطلب الفعلي
            this.performanceMetrics.apiCallsCount++;
            const response = await originalFetch(url, options);
            
            // حفظ في الكاش إذا كان الطلب ناجحاً
            if (response.ok) {
                const clonedResponse = response.clone();
                const data = await clonedResponse.json();
                
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
                
                console.log('Cache miss, stored:', url);
            }
            
            return response;
        };
    }

    // إعداد كاش الموارد الثابتة
    setupStaticResourceCache() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    // تنظيف الكاش القديم
    cleanupCache() {
        setInterval(() => {
            const now = Date.now();
            const maxAge = 15 * 60 * 1000; // 15 دقيقة
            
            for (const [key, value] of this.cache.entries()) {
                if (now - value.timestamp > maxAge) {
                    this.cache.delete(key);
                }
            }
            
            // تنظيف كاش الصور
            if (this.imageCache.size > 50) {
                const entries = Array.from(this.imageCache.entries());
                const toDelete = entries.slice(0, 10);
                toDelete.forEach(([key]) => {
                    URL.revokeObjectURL(this.imageCache.get(key));
                    this.imageCache.delete(key);
                });
            }
        }, 5 * 60 * 1000); // كل 5 دقائق
    }

    // تهيئة مراقبة الأداء
    initPerformanceMonitoring() {
        // قياس وقت تحميل الصفحة
        window.addEventListener('load', () => {
            this.performanceMetrics.pageLoadTime = performance.now();
            this.sendPerformanceMetrics();
        });

        // مراقبة استهلاك الذاكرة
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                    console.warn('High memory usage detected');
                    this.optimizeMemoryUsage();
                }
            }, 30000);
        }

        // مراقبة سرعة الاتصال
        if ('connection' in navigator) {
            const connection = navigator.connection;
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                this.enableLowBandwidthMode();
            }
        }
    }

    // تحميل الموارد الحيوية مسبقاً
    preloadCriticalResources() {
        const criticalResources = [
            'css/styles.css',
            'css/admin-styles.css',
            'js/supabase-config.js',
            'images/vip-logo.jpg'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            
            if (resource.endsWith('.css')) {
                link.as = 'style';
            } else if (resource.endsWith('.js')) {
                link.as = 'script';
            } else if (resource.match(/\.(jpg|jpeg|png|webp)$/)) {
                link.as = 'image';
            }
            
            document.head.appendChild(link);
        });
    }

    // تفعيل وضع البيانات المحدودة
    enableLowBandwidthMode() {
        console.log('Low bandwidth detected, enabling optimization mode');
        
        // تقليل جودة الصور
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.dataset.lowres) {
                img.src = img.dataset.lowres;
            }
        });

        // تأجيل تحميل الموارد غير الحيوية
        const nonCriticalScripts = document.querySelectorAll('script[data-defer]');
        nonCriticalScripts.forEach(script => {
            script.defer = true;
        });

        // تقليل معدل تحديث البيانات
        this.reducePollFrequency();
    }

    // تقليل معدل تحديث البيانات
    reducePollFrequency() {
        // يمكن تخصيص هذا حسب احتياجات التطبيق
        if (window.dataRefreshInterval) {
            clearInterval(window.dataRefreshInterval);
            window.dataRefreshInterval = setInterval(
                window.refreshData, 
                30000 // كل 30 ثانية بدلاً من 10
            );
        }
    }

    // تحسين استهلاك الذاكرة
    optimizeMemoryUsage() {
        // تنظيف الكاش
        this.cache.clear();
        
        // تنظيف كاش الصور
        this.imageCache.forEach(url => URL.revokeObjectURL(url));
        this.imageCache.clear();

        // إجبار جمع القمامة إذا كان متاحاً
        if (window.gc) {
            window.gc();
        }

        console.log('Memory optimization completed');
    }

    // إرسال مقاييس الأداء
    async sendPerformanceMetrics() {
        try {
            const metrics = {
                ...this.performanceMetrics,
                cacheHitRatio: this.calculateCacheHitRatio(),
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            // يمكن إرسال هذه البيانات إلى خدمة تحليل الأداء
            console.log('Performance metrics:', metrics);
            
            // حفظ في localStorage للمراجعة اللاحقة
            const existingMetrics = JSON.parse(localStorage.getItem('performanceMetrics') || '[]');
            existingMetrics.push(metrics);
            
            // الاحتفاظ بآخر 10 قياسات فقط
            if (existingMetrics.length > 10) {
                existingMetrics.splice(0, existingMetrics.length - 10);
            }
            
            localStorage.setItem('performanceMetrics', JSON.stringify(existingMetrics));
            
        } catch (error) {
            console.error('Error sending performance metrics:', error);
        }
    }

    // حساب نسبة إصابة الكاش
    calculateCacheHitRatio() {
        const totalRequests = this.performanceMetrics.apiCallsCount;
        if (totalRequests === 0) return 0;
        
        // تقدير تقريبي بناءً على حجم الكاش
        const estimatedCacheHits = Math.min(this.cache.size, totalRequests);
        return (estimatedCacheHits / totalRequests) * 100;
    }

    // تحسين النماذج الكبيرة
    optimizeLargeForms() {
        const largeForms = document.querySelectorAll('form[data-optimize]');
        
        largeForms.forEach(form => {
            // تأجيل التحقق من صحة البيانات
            this.debounceValidation(form);
            
            // تجميع التغييرات
            this.batchFormUpdates(form);
        });
    }

    // تأجيل التحقق من صحة البيانات
    debounceValidation(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            let timeoutId;
            
            input.addEventListener('input', () => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    this.validateField(input);
                }, 300);
            });
        });
    }

    // تجميع تحديثات النموذج
    batchFormUpdates(form) {
        const updates = [];
        let batchTimeout;
        
        form.addEventListener('input', (e) => {
            updates.push({
                field: e.target.name,
                value: e.target.value,
                timestamp: Date.now()
            });
            
            clearTimeout(batchTimeout);
            batchTimeout = setTimeout(() => {
                this.processBatchedUpdates(updates);
                updates.length = 0;
            }, 500);
        });
    }

    // معالجة التحديثات المجمعة
    processBatchedUpdates(updates) {
        // معالجة جميع التحديثات دفعة واحدة
        console.log('Processing batched updates:', updates);
        
        // يمكن تنفيذ منطق الحفظ التلقائي هنا
        if (typeof autoSaveForm === 'function') {
            autoSaveForm(updates);
        }
    }

    // التحقق من صحة حقل
    validateField(input) {
        // منطق التحقق من صحة البيانات
        const isValid = input.checkValidity();
        
        input.classList.toggle('invalid', !isValid);
        input.classList.toggle('valid', isValid);
        
        // إظهار/إخفاء رسائل الخطأ
        const errorElement = input.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.style.display = isValid ? 'none' : 'block';
        }
    }

    // الحصول على تقرير الأداء
    getPerformanceReport() {
        return {
            metrics: this.performanceMetrics,
            cacheSize: this.cache.size,
            imageCacheSize: this.imageCache.size,
            memoryUsage: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null,
            networkInfo: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
    }
}

// إنشاء مثيل عام
window.performanceOptimizer = new PerformanceOptimizer();

// دوال مساعدة للاستخدام العام
function optimizeImage(file, options = {}) {
    return window.performanceOptimizer.compressImage(file, options.quality, options.maxWidth, options.maxHeight);
}

function clearCache() {
    window.performanceOptimizer.cache.clear();
    window.performanceOptimizer.imageCache.forEach(url => URL.revokeObjectURL(url));
    window.performanceOptimizer.imageCache.clear();
}

function getPerformanceReport() {
    return window.performanceOptimizer.getPerformanceReport();
}

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}
