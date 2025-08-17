// VIP Center Educational Platform - JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Video Code Validation
    const videoCodeForm = document.getElementById('videoCodeForm');
    if (videoCodeForm) {
        const validCodes = ['VIP2025', 'PHYSICS101', 'CHEMISTRY202', 'BIOLOGY303', 'GEOLOGY404'];
        
        videoCodeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const codeInput = document.getElementById('videoCode');
            const errorMessage = document.getElementById('codeError');
            const successMessage = document.getElementById('codeSuccess');
            const videoPlayer = document.getElementById('videoPlayer');
            
            const enteredCode = codeInput.value.trim().toUpperCase();
            
            // Hide previous messages
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
            
            if (validCodes.includes(enteredCode)) {
                // Valid code - show success message and video player
                successMessage.style.display = 'block';
                
                setTimeout(() => {
                    successMessage.style.display = 'none';
                    videoPlayer.classList.add('active');
                    initializeVideoPlayer();
                }, 2000);
            } else {
                // Invalid code - show error message
                errorMessage.style.display = 'block';
                codeInput.value = '';
                codeInput.focus();
            }
        });
    }

    // Video Player Functionality
    function initializeVideoPlayer() {
        const playBtn = document.querySelector('.play-btn');
        const pauseBtn = document.querySelector('.pause-btn');
        const fullscreenBtn = document.querySelector('.fullscreen-btn');
        const progressFill = document.querySelector('.progress-fill');
        const videoTime = document.querySelector('.video-time');
        
        let isPlaying = false;
        let currentTime = 0;
        let duration = 3600; // 60 minutes in seconds
        let playInterval;

        if (playBtn) {
            playBtn.addEventListener('click', function() {
                isPlaying = true;
                playBtn.style.display = 'none';
                pauseBtn.style.display = 'inline-block';
                
                playInterval = setInterval(() => {
                    currentTime += 1;
                    updateProgress();
                    
                    if (currentTime >= duration) {
                        pauseVideo();
                        currentTime = 0;
                        updateProgress();
                    }
                }, 1000);
            });
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', pauseVideo);
        }

        function pauseVideo() {
            isPlaying = false;
            if (playBtn) playBtn.style.display = 'inline-block';
            if (pauseBtn) pauseBtn.style.display = 'none';
            clearInterval(playInterval);
        }

        function updateProgress() {
            const progress = (currentTime / duration) * 100;
            if (progressFill) progressFill.style.width = progress + '%';
            
            const currentMinutes = Math.floor(currentTime / 60);
            const currentSeconds = currentTime % 60;
            const durationMinutes = Math.floor(duration / 60);
            const durationSeconds = duration % 60;
            
            if (videoTime) {
                videoTime.textContent = 
                    `${currentMinutes.toString().padStart(2, '0')}:${currentSeconds.toString().padStart(2, '0')} / ` +
                    `${durationMinutes.toString().padStart(2, '0')}:${durationSeconds.toString().padStart(2, '0')}`;
            }
        }

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', function() {
                const videoPlayer = document.getElementById('videoPlayer');
                if (videoPlayer) {
                    if (videoPlayer.requestFullscreen) {
                        videoPlayer.requestFullscreen();
                    } else if (videoPlayer.webkitRequestFullscreen) {
                        videoPlayer.webkitRequestFullscreen();
                    } else if (videoPlayer.msRequestFullscreen) {
                        videoPlayer.msRequestFullscreen();
                    }
                }
            });
        }

        // Initialize progress display
        updateProgress();
    }

    // Login Form Validation
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (email && password) {
                // Simulate login process
                showNotification('تم تسجيل الدخول بنجاح!', 'success');
                
                // Redirect to home page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 2000);
            }
        });
    }

    // Registration Form Validation
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const grade = document.getElementById('grade').value;
            const governorate = document.getElementById('governorate').value;
            const country = document.getElementById('country').value;
            
            // Validation
            if (!fullName || !email || !password || !confirmPassword || !grade || !governorate || !country) {
                showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showNotification('كلمة المرور وتأكيد كلمة المرور غير متطابقتان', 'error');
                return;
            }
            
            if (password.length < 6) {
                showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
                return;
            }
            
            // Simulate registration process
            showNotification('تم إنشاء الحساب بنجاح!', 'success');
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        });
    }

    // Notification System
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background-color: ${type === 'success' ? '#51cf66' : type === 'error' ? '#ff6b6b' : '#339af0'};
            color: #ffffff;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-weight: 600;
            max-width: 300px;
            word-wrap: break-word;
            animation: slideInRight 0.3s ease-out;
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

    // Add CSS animations for notifications
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
    `;
    document.head.appendChild(style);

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add fade-in animation to page elements
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const elementsToAnimate = document.querySelectorAll('.course-card, .subject-card, .teacher-card, .section');
    elementsToAnimate.forEach(element => {
        observer.observe(element);
    });

    // Course card hover effects
    const courseCards = document.querySelectorAll('.course-card');
    courseCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Subject card click effects
    const subjectCards = document.querySelectorAll('.subject-card');
    subjectCards.forEach(card => {
        card.addEventListener('click', function() {
            showNotification(`تم اختيار تخصص ${this.querySelector('.subject-title').textContent}`, 'info');
        });
    });

    // Teacher card click effects
    const teacherCards = document.querySelectorAll('.teacher-card');
    teacherCards.forEach(card => {
        card.addEventListener('click', function() {
            const teacherName = this.querySelector('.teacher-name').textContent;
            showNotification(`عرض ملف ${teacherName}`, 'info');
        });
    });

    // Forgot password functionality
    const forgotPasswordLink = document.getElementById('forgotPassword');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            const email = prompt('أدخل بريدك الإلكتروني لاستعادة كلمة المرور:');
            if (email) {
                showNotification('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني', 'success');
            }
        });
    }

    // Loading animation for forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'جاري التحميل...';
                submitBtn.disabled = true;
                
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 2000);
            }
        });
    });

    // Console welcome message
    console.log(`
    🎓 مرحباً بك في VIP Center
    📚 منصة تعليمية متكاملة مع لوحة تحكم إدارية
    🚀 تم التطوير بواسطة فريق VIP Center
    `);
});
