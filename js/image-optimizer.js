// Image Optimizer - VIP Center
// Automatically optimizes and resizes images for better performance

class ImageOptimizer {
    constructor() {
        this.maxWidth = 800;
        this.maxHeight = 300;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.optimizeAllImages());
        } else {
            this.optimizeAllImages();
        }

        // Also optimize images that load later
        this.setupImageObserver();
        
        console.log('🖼️ Image Optimizer initialized');
    }

    // Optimize all existing images
    optimizeAllImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => this.optimizeImage(img));
    }

    // Optimize a single image
    optimizeImage(img) {
        // Skip if already optimized
        if (img.dataset.optimized === 'true') return;

        // Apply size constraints
        this.applySizeConstraints(img);
        
        // Add loading optimization
        this.addLoadingOptimization(img);
        
        // Add error handling
        this.addErrorHandling(img);
        
        // Mark as optimized
        img.dataset.optimized = 'true';
    }

    // Apply size constraints to image
    applySizeConstraints(img) {
        // Force reasonable max dimensions
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        
        // Determine appropriate max height based on context
        let maxHeight = this.maxHeight;
        
        if (img.closest('.course-card, .course-image')) {
            maxHeight = 180;
        } else if (img.closest('.teacher-card, .teacher-image')) {
            maxHeight = 120;
        } else if (img.closest('.hero, .hero-section')) {
            maxHeight = 350;
        } else if (img.closest('.logo, .navbar')) {
            maxHeight = 60;
        } else if (img.closest('.video-thumbnail, .video-card')) {
            maxHeight = 200;
        }
        
        img.style.maxHeight = maxHeight + 'px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
    }

    // Add loading optimization
    addLoadingOptimization(img) {
        // Add lazy loading if not already present
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }

        // Add loading placeholder
        if (!img.complete) {
            img.style.background = 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)';
            img.style.backgroundSize = '200% 100%';
            img.style.animation = 'loading 1.5s infinite';
            
            img.addEventListener('load', () => {
                img.style.background = '';
                img.style.animation = '';
            });
        }
    }

    // Add error handling
    addErrorHandling(img) {
        img.addEventListener('error', () => {
            // Replace with placeholder if image fails to load
            this.replaceWithPlaceholder(img);
        });
    }

    // Replace failed image with placeholder
    replaceWithPlaceholder(img) {
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.style.cssText = `
            width: ${img.offsetWidth || 200}px;
            height: ${img.offsetHeight || 150}px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2rem;
            border-radius: 8px;
            max-height: ${img.style.maxHeight || '300px'};
        `;
        placeholder.innerHTML = '🖼️';
        
        if (img.parentNode) {
            img.parentNode.replaceChild(placeholder, img);
        }
    }

    // Setup observer for dynamically added images
    setupImageObserver() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.optimizeImage(img);
                        observer.unobserve(img);
                    }
                });
            });

            // Observe new images
            const mutationObserver = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            if (node.tagName === 'IMG') {
                                observer.observe(node);
                            } else {
                                const images = node.querySelectorAll('img');
                                images.forEach(img => observer.observe(img));
                            }
                        }
                    });
                });
            });

            mutationObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    // Resize image to specific dimensions
    resizeImage(img, maxWidth, maxHeight) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        let { width, height } = this.calculateDimensions(
            img.naturalWidth, 
            img.naturalHeight, 
            maxWidth, 
            maxHeight
        );
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Replace original with resized version
        img.src = canvas.toDataURL('image/jpeg', 0.8);
    }

    // Calculate optimal dimensions
    calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let width = originalWidth;
        let height = originalHeight;
        
        // Scale down if too wide
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        
        // Scale down if too tall
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }
        
        return { width: Math.round(width), height: Math.round(height) };
    }

    // Force optimize all images (manual trigger)
    forceOptimizeAll() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.dataset.optimized = 'false';
            this.optimizeImage(img);
        });
        console.log(`🔧 Force optimized ${images.length} images`);
    }

    // Get image statistics
    getImageStats() {
        const images = document.querySelectorAll('img');
        const optimized = document.querySelectorAll('img[data-optimized="true"]');
        
        return {
            total: images.length,
            optimized: optimized.length,
            pending: images.length - optimized.length
        };
    }
}

// Add CSS for loading animation
const style = document.createElement('style');
style.textContent = `
    @keyframes loading {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }
    
    .image-placeholder {
        transition: all 0.3s ease;
        cursor: default;
    }
    
    .image-placeholder:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
`;
document.head.appendChild(style);

// Initialize image optimizer
const imageOptimizer = new ImageOptimizer();

// Make it globally available
window.imageOptimizer = imageOptimizer;

// Add console commands for debugging
window.optimizeImages = () => imageOptimizer.forceOptimizeAll();
window.imageStats = () => {
    const stats = imageOptimizer.getImageStats();
    console.log('📊 Image Statistics:', stats);
    return stats;
};

// Export for use in other files
window.ImageOptimizer = ImageOptimizer;
