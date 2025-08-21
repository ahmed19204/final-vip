// Service Worker للمنصة التعليمية - نظام كاش متقدم
const CACHE_NAME = 'vip-center-v1.2.0';
const DYNAMIC_CACHE = 'vip-center-dynamic-v1.2.0';

// الموارد الحيوية التي يجب تخزينها مسبقاً
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/home.html',
    '/teachers.html',
    '/login.html',
    '/register.html',
    '/css/styles.css',
    '/css/admin-styles.css',
    '/css/video-player.css',
    '/js/script.js',
    '/js/supabase-config.js',
    '/js/secure-admin-auth.js',
    '/js/permissions-manager.js',
    '/js/performance-optimizer.js',
    '/js/video-player.js',
    '/images/vip-logo.jpg',
    '/images/classroom-bg.jpg',
    'https://fonts.googleapis.com/css2?family=Tahoma:wght@400;700&display=swap',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// الموارد التي يجب تحديثها دائماً من الشبكة
const NETWORK_FIRST = [
    '/admin-',
    '/api/',
    'supabase.co'
];

// الموارد التي يمكن تخزينها لفترة طويلة
const CACHE_FIRST = [
    '/css/',
    '/js/',
    '/images/',
    'fonts.googleapis.com',
    'cdn.jsdelivr.net'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Installation complete');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Installation failed', error);
            })
    );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // حذف الكاش القديم
                        if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activation complete');
                return self.clients.claim();
            })
    );
});

// اعتراض طلبات الشبكة
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // تجاهل الطلبات غير المناسبة
    if (request.method !== 'GET' || 
        url.protocol !== 'http:' && url.protocol !== 'https:') {
        return;
    }
    
    // تحديد استراتيجية التخزين
    if (shouldUseNetworkFirst(request.url)) {
        event.respondWith(networkFirstStrategy(request));
    } else if (shouldUseCacheFirst(request.url)) {
        event.respondWith(cacheFirstStrategy(request));
    } else {
        event.respondWith(staleWhileRevalidateStrategy(request));
    }
});

// التحقق من ضرورة استخدام Network First
function shouldUseNetworkFirst(url) {
    return NETWORK_FIRST.some(pattern => url.includes(pattern));
}

// التحقق من ضرورة استخدام Cache First
function shouldUseCacheFirst(url) {
    return CACHE_FIRST.some(pattern => url.includes(pattern));
}

// استراتيجية Network First
async function networkFirstStrategy(request) {
    try {
        // محاولة الحصول على الاستجابة من الشبكة أولاً
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // حفظ في الكاش الديناميكي
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache', request.url);
        
        // في حالة فشل الشبكة، محاولة الحصول من الكاش
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // إرجاع صفحة offline إذا لم تكن متوفرة في الكاش
        if (request.destination === 'document') {
            return caches.match('/offline.html');
        }
        
        // إرجاع استجابة خطأ للموارد الأخرى
        return new Response('Network error occurred', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// استراتيجية Cache First
async function cacheFirstStrategy(request) {
    // محاولة الحصول من الكاش أولاً
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        // إذا لم تكن موجودة في الكاش، جلب من الشبكة
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Cache and network failed', request.url);
        
        // إرجاع placeholder للصور
        if (request.destination === 'image') {
            return caches.match('/images/placeholder.jpg');
        }
        
        return new Response('Resource not available', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// استراتيجية Stale While Revalidate
async function staleWhileRevalidateStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    // جلب من الشبكة وتحديث الكاش في الخلفية
    const networkResponsePromise = fetch(request)
        .then(response => {
            if (response.ok) {
                const cache = caches.open(DYNAMIC_CACHE);
                cache.then(c => c.put(request, response.clone()));
            }
            return response;
        })
        .catch(() => null);
    
    // إرجاع النسخة المخزنة فوراً إن وجدت، وإلا انتظار الشبكة
    return cachedResponse || networkResponsePromise;
}

// معالجة رسائل من الصفحة الرئيسية
self.addEventListener('message', event => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
            
        case 'GET_CACHE_SIZE':
            getCacheSize().then(size => {
                event.ports[0].postMessage({ size });
            });
            break;
            
        case 'PRELOAD_RESOURCES':
            preloadResources(payload.urls).then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
    }
});

// مسح جميع الكاش
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('Service Worker: All caches cleared');
}

// حساب حجم الكاش
async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }
    
    return totalSize;
}

// تحميل موارد مسبقاً
async function preloadResources(urls) {
    const cache = await caches.open(CACHE_NAME);
    
    const preloadPromises = urls.map(async url => {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
                console.log('Service Worker: Preloaded', url);
            }
        } catch (error) {
            console.warn('Service Worker: Failed to preload', url, error);
        }
    });
    
    await Promise.all(preloadPromises);
}

// تنظيف الكاش الديناميكي دورياً
async function cleanupDynamicCache() {
    const cache = await caches.open(DYNAMIC_CACHE);
    const keys = await cache.keys();
    
    // الاحتفاظ بآخر 50 عنصر فقط
    if (keys.length > 50) {
        const keysToDelete = keys.slice(0, keys.length - 50);
        await Promise.all(
            keysToDelete.map(key => cache.delete(key))
        );
        console.log(`Service Worker: Cleaned ${keysToDelete.length} items from dynamic cache`);
    }
}

// تشغيل تنظيف الكاش كل ساعة
setInterval(cleanupDynamicCache, 60 * 60 * 1000);

// معالجة تحديث Service Worker
self.addEventListener('updatefound', () => {
    console.log('Service Worker: Update found');
});

// إشعار العميل بتحديث Service Worker
self.addEventListener('controllerchange', () => {
    console.log('Service Worker: Controller changed');
});

// معالجة الأخطاء
self.addEventListener('error', event => {
    console.error('Service Worker: Error occurred', event.error);
});

// معالجة الأخطاء غير المعالجة
self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker: Unhandled rejection', event.reason);
});

// تسجيل معلومات Service Worker
console.log('Service Worker: Script loaded');
console.log('Service Worker: Cache name:', CACHE_NAME);
console.log('Service Worker: Dynamic cache:', DYNAMIC_CACHE);
console.log('Service Worker: Static assets count:', STATIC_ASSETS.length);
