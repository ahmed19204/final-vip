// نظام شراء الكورسات المتقدم

class CoursePurchaseSystem {
    constructor() {
        this.selectedCourse = null;
        this.appliedDiscount = null;
        this.purchaseMethod = 'wallet';
        
        this.init();
    }

    // تهيئة النظام
    init() {
        this.setupEventListeners();
        this.loadAvailableCourses();
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // فلاتر البحث
        const searchInput = document.getElementById('courseSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCourses();
            });
        }

        // فلاتر التصنيف
        ['subjectFilter', 'levelFilter', 'priceFilter'].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.filterCourses();
                });
            }
        });

        // طرق الدفع في الشراء
        document.addEventListener('change', (e) => {
            if (e.target.name === 'purchaseMethod') {
                this.purchaseMethod = e.target.value;
                this.handlePurchaseMethodChange(e.target.value);
            }
        });
    }

    // تحميل الكورسات المتاحة
    async loadAvailableCourses() {
        try {
            const { data: courses, error } = await window.supabaseClient
                .from('courses')
                .select(`
                    *,
                    subjects(name),
                    teachers(name),
                    videos(id)
                `)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.allCourses = courses || [];
            this.displayCourses(this.allCourses);
            this.populateFilters();

        } catch (error) {
            console.error('Error loading courses:', error);
            this.showToast('خطأ في تحميل الكورسات', 'error');
        }
    }

    // عرض الكورسات
    displayCourses(courses) {
        const coursesGrid = document.getElementById('catalogCoursesGrid');
        if (!coursesGrid) return;

        if (!courses.length) {
            coursesGrid.innerHTML = `
                <div class="no-courses-message">
                    <h3>لا توجد كورسات متاحة</h3>
                    <p>تحقق من الفلاتر المحددة أو جرب البحث بكلمات أخرى</p>
                </div>
            `;
            return;
        }

        const coursesHTML = courses.map(course => {
            const videosCount = course.videos?.length || 0;
            const isOwned = this.isOwnedCourse(course.id);
            
            return `
                <div class="catalog-course-card" data-course-id="${course.id}">
                    <div class="course-image-container">
                        <img src="${course.image_url || 'images/default-course.jpg'}" 
                             alt="${course.title}" class="catalog-course-image">
                        ${course.requires_code ? '<div class="requires-code-badge">🎫 يتطلب كود</div>' : ''}
                        ${isOwned ? '<div class="owned-badge">✅ مشترك</div>' : ''}
                    </div>
                    
                    <div class="catalog-course-content">
                        <div class="course-header">
                            <h3 class="catalog-course-title">${course.title}</h3>
                            <div class="course-rating">
                                <span class="stars">⭐⭐⭐⭐⭐</span>
                                <span class="rating-text">(4.8)</span>
                            </div>
                        </div>
                        
                        <p class="catalog-course-description">${course.description || 'وصف غير متوفر'}</p>
                        
                        <div class="course-details">
                            <div class="detail-item">
                                <span class="detail-icon">👨‍🏫</span>
                                <span>${course.teachers?.name || 'غير محدد'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-icon">📚</span>
                                <span>${course.subjects?.name || 'عام'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-icon">🎥</span>
                                <span>${videosCount} فيديو</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-icon">⏱️</span>
                                <span>${course.duration_hours || 0} ساعة</span>
                            </div>
                        </div>
                        
                        <div class="course-footer">
                            <div class="course-price">
                                ${course.price > 0 ? `${course.price} جنيه` : 'مجاني'}
                            </div>
                            <div class="course-actions">
                                ${isOwned ? 
                                    '<button class="btn btn-secondary" onclick="continueCourse(' + course.id + ')">متابعة</button>' :
                                    course.price > 0 ? 
                                        '<button class="btn btn-primary" onclick="purchaseCourse(' + course.id + ')">شراء الكورس</button>' :
                                        '<button class="btn btn-primary" onclick="enrollFreeCourse(' + course.id + ')">التسجيل المجاني</button>'
                                }
                                <button class="btn btn-outline" onclick="previewCourse(${course.id})">معاينة</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        coursesGrid.innerHTML = coursesHTML;
    }

    // تحديد ما إذا كان الطالب مشترك في الكورس
    isOwnedCourse(courseId) {
        // يمكن تحسين هذا بتحميل قائمة الكورسات المشتراة
        const user = this.getCurrentUser();
        if (!user || !user.enrolledCourses) return false;
        
        return user.enrolledCourses.includes(courseId);
    }

    // ملء فلاتر البحث
    populateFilters() {
        // فلتر التخصصات
        const subjectFilter = document.getElementById('subjectFilter');
        if (subjectFilter && this.allCourses) {
            const subjects = [...new Set(this.allCourses
                .map(course => course.subjects?.name)
                .filter(Boolean))];
            
            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                option.textContent = subject;
                subjectFilter.appendChild(option);
            });
        }
    }

    // فلترة الكورسات
    filterCourses() {
        if (!this.allCourses) return;

        const searchTerm = document.getElementById('courseSearch')?.value.toLowerCase() || '';
        const selectedSubject = document.getElementById('subjectFilter')?.value || '';
        const selectedLevel = document.getElementById('levelFilter')?.value || '';
        const selectedPrice = document.getElementById('priceFilter')?.value || '';

        const filteredCourses = this.allCourses.filter(course => {
            // فلتر البحث النصي
            const matchesSearch = !searchTerm || 
                course.title.toLowerCase().includes(searchTerm) ||
                course.description?.toLowerCase().includes(searchTerm) ||
                course.teachers?.name.toLowerCase().includes(searchTerm);

            // فلتر التخصص
            const matchesSubject = !selectedSubject || 
                course.subjects?.name === selectedSubject;

            // فلتر المستوى
            const matchesLevel = !selectedLevel || 
                course.level === selectedLevel;

            // فلتر السعر
            const matchesPrice = !selectedPrice ||
                (selectedPrice === 'free' && course.price === 0) ||
                (selectedPrice === 'paid' && course.price > 0);

            return matchesSearch && matchesSubject && matchesLevel && matchesPrice;
        });

        this.displayCourses(filteredCourses);
    }

    // شراء كورس
    async purchaseCourse(courseId) {
        try {
            // جلب بيانات الكورس
            const { data: course, error } = await window.supabaseClient
                .from('courses')
                .select(`
                    *,
                    subjects(name),
                    teachers(name)
                `)
                .eq('id', courseId)
                .single();

            if (error) throw error;

            this.selectedCourse = course;
            this.appliedDiscount = null;

            // عرض نافذة الشراء
            this.showPurchaseModal(course);

        } catch (error) {
            console.error('Error loading course for purchase:', error);
            this.showToast('خطأ في تحميل بيانات الكورس', 'error');
        }
    }

    // عرض نافذة الشراء
    showPurchaseModal(course) {
        const modal = document.getElementById('coursePurchaseModal');
        const courseInfo = document.getElementById('coursePurchaseInfo');
        
        if (!modal || !courseInfo) return;

        // ملء معلومات الكورس
        courseInfo.innerHTML = `
            <div class="purchase-course-card">
                <img src="${course.image_url || 'images/default-course.jpg'}" 
                     alt="${course.title}" class="purchase-course-image">
                <div class="purchase-course-details">
                    <h3>${course.title}</h3>
                    <p>${course.description || 'وصف غير متوفر'}</p>
                    <div class="course-meta">
                        <span>👨‍🏫 ${course.teachers?.name || 'غير محدد'}</span>
                        <span>📚 ${course.subjects?.name || 'عام'}</span>
                        <span>⏱️ ${course.duration_hours || 0} ساعة</span>
                    </div>
                </div>
            </div>
        `;

        // تحديث الأسعار
        this.updatePurchaseSummary();

        // إظهار النافذة
        modal.style.display = 'flex';
        modal.classList.add('show');
    }

    // تحديث ملخص الشراء
    updatePurchaseSummary() {
        if (!this.selectedCourse) return;

        const originalPrice = parseFloat(this.selectedCourse.price);
        const discountAmount = this.appliedDiscount ? 
            (originalPrice * this.appliedDiscount.percentage / 100) : 0;
        const totalPrice = originalPrice - discountAmount;

        // تحديث العناصر
        const originalPriceEl = document.getElementById('originalPrice');
        const discountAmountEl = document.getElementById('discountAmount');
        const discountRow = document.getElementById('discountRow');
        const totalPriceEl = document.getElementById('totalPrice');

        if (originalPriceEl) {
            originalPriceEl.textContent = `${originalPrice.toFixed(2)} جنيه`;
        }

        if (this.appliedDiscount && discountRow && discountAmountEl) {
            discountRow.style.display = 'flex';
            discountAmountEl.textContent = `-${discountAmount.toFixed(2)} جنيه`;
        } else if (discountRow) {
            discountRow.style.display = 'none';
        }

        if (totalPriceEl) {
            totalPriceEl.textContent = `${totalPrice.toFixed(2)} جنيه`;
        }
    }

    // معالجة تغيير طريقة الدفع
    handlePurchaseMethodChange(method) {
        const discountSection = document.getElementById('discountCodeSection');
        
        if (method === 'discount') {
            discountSection.style.display = 'block';
        } else {
            discountSection.style.display = 'none';
            this.appliedDiscount = null;
            this.updatePurchaseSummary();
        }
    }

    // تطبيق كود الخصم في الشراء
    async applyPurchaseDiscount() {
        const codeInput = document.getElementById('purchaseDiscountCode');
        if (!codeInput) return;

        const code = codeInput.value.trim();
        if (!code) {
            this.showToast('يرجى إدخال كود الخصم', 'error');
            return;
        }

        try {
            const result = await this.validateDiscountCode(code);
            
            if (result.success) {
                this.appliedDiscount = result.discount;
                this.updatePurchaseSummary();
                this.showToast('تم تطبيق كود الخصم بنجاح!', 'success');
            } else {
                this.showToast(result.error, 'error');
            }

        } catch (error) {
            console.error('Error applying discount:', error);
            this.showToast('خطأ في تطبيق كود الخصم', 'error');
        }
    }

    // التحقق من صحة كود الخصم
    async validateDiscountCode(code) {
        try {
            const { data, error } = await window.supabaseClient
                .from('discount_codes')
                .select('*')
                .eq('code', code)
                .eq('status', 'active')
                .single();

            if (error || !data) {
                return { success: false, error: 'كود الخصم غير صحيح أو منتهي الصلاحية' };
            }

            // التحقق من تاريخ الانتهاء
            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                return { success: false, error: 'كود الخصم منتهي الصلاحية' };
            }

            // التحقق من عدد الاستخدامات
            if (data.max_uses && data.current_uses >= data.max_uses) {
                return { success: false, error: 'تم استنفاذ عدد مرات استخدام هذا الكود' };
            }

            // التحقق من الحد الأدنى للطلب
            if (data.min_order_amount && this.selectedCourse.price < data.min_order_amount) {
                return { 
                    success: false, 
                    error: `الحد الأدنى للطلب ${data.min_order_amount} جنيه` 
                };
            }

            return { 
                success: true, 
                discount: {
                    id: data.id,
                    percentage: data.discount_percentage,
                    fixedAmount: data.discount_amount,
                    code: data.code
                }
            };

        } catch (error) {
            console.error('Error validating discount code:', error);
            return { success: false, error: 'حدث خطأ في التحقق من الكود' };
        }
    }

    // إتمام عملية الشراء
    async completePurchase() {
        if (!this.selectedCourse) {
            this.showToast('لم يتم اختيار كورس للشراء', 'error');
            return;
        }

        const originalPrice = parseFloat(this.selectedCourse.price);
        const discountAmount = this.appliedDiscount ? 
            (originalPrice * this.appliedDiscount.percentage / 100) : 0;
        const finalPrice = originalPrice - discountAmount;

        this.showLoading(true);

        try {
            if (this.purchaseMethod === 'wallet') {
                // الدفع من المحفظة
                const result = await window.walletSystem.deductFromBalance(
                    finalPrice,
                    `شراء كورس: ${this.selectedCourse.title}`,
                    this.selectedCourse.id
                );

                if (!result.success) {
                    throw new Error(result.error);
                }
            } else if (this.purchaseMethod === 'discount') {
                // استخدام كود الخصم المباشر
                if (!this.appliedDiscount) {
                    throw new Error('يرجى تطبيق كود الخصم أولاً');
                }
                
                if (finalPrice > 0) {
                    throw new Error('كود الخصم لا يغطي كامل قيمة الكورس');
                }
            }

            // تسجيل الطالب في الكورس
            await this.enrollStudentInCourse(this.selectedCourse.id, finalPrice);

            // تحديث استخدام كود الخصم
            if (this.appliedDiscount) {
                await this.updateDiscountCodeUsage(this.appliedDiscount.id);
            }

            // تحديث واجهة المحفظة
            if (window.walletSystem) {
                window.walletSystem.updateWalletDisplay();
            }

            this.showToast('تم شراء الكورس بنجاح! 🎉', 'success');
            this.closeModal('coursePurchaseModal');
            
            // إعادة تحميل الكورسات لتحديث الحالة
            await this.loadAvailableCourses();

        } catch (error) {
            console.error('Purchase error:', error);
            this.showToast(error.message || 'فشل في عملية الشراء', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // تسجيل الطالب في الكورس
    async enrollStudentInCourse(courseId, paidAmount) {
        try {
            const user = this.getCurrentUser();
            if (!user) throw new Error('المستخدم غير مسجل');

            // إضافة التسجيل
            const { error } = await window.supabaseClient
                .from('course_enrollments')
                .insert([{
                    student_id: user.id,
                    course_id: courseId,
                    enrolled_at: new Date().toISOString(),
                    amount_paid: paidAmount,
                    status: 'active'
                }]);

            if (error) throw error;

            console.log('Student enrolled successfully');

        } catch (error) {
            console.error('Error enrolling student:', error);
            throw error;
        }
    }

    // تحديث استخدام كود الخصم
    async updateDiscountCodeUsage(discountId) {
        try {
            const { error } = await window.supabaseClient
                .rpc('increment_discount_usage', { discount_id: discountId });

            if (error) throw error;

        } catch (error) {
            console.error('Error updating discount usage:', error);
        }
    }

    // التسجيل المجاني في كورس
    async enrollFreeCourse(courseId) {
        this.showLoading(true);

        try {
            await this.enrollStudentInCourse(courseId, 0);
            this.showToast('تم التسجيل في الكورس بنجاح! 🎉', 'success');
            await this.loadAvailableCourses();

        } catch (error) {
            console.error('Free enrollment error:', error);
            this.showToast('فشل في التسجيل بالكورس', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // معاينة الكورس
    previewCourse(courseId) {
        // يمكن إضافة نافذة معاينة للكورس
        this.showToast('ميزة المعاينة ستتوفر قريباً', 'info');
    }

    // متابعة كورس مشترك
    continueCourse(courseId) {
        // توجيه لصفحة الكورس
        window.location.href = `course-viewer.html?id=${courseId}`;
    }

    // دوال مساعدة
    getCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    showToast(message, type = 'success') {
        if (window.walletSystem) {
            window.walletSystem.showToast(message, type);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }
}

// إنشاء مثيل عام
window.coursePurchaseSystem = new CoursePurchaseSystem();

// دوال عامة للاستخدام في HTML
function showCourseCatalog() {
    const modal = document.getElementById('courseCatalogModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

function purchaseCourse(courseId) {
    window.coursePurchaseSystem.purchaseCourse(courseId);
}

function enrollFreeCourse(courseId) {
    window.coursePurchaseSystem.enrollFreeCourse(courseId);
}

function previewCourse(courseId) {
    window.coursePurchaseSystem.previewCourse(courseId);
}

function continueCourse(courseId) {
    window.coursePurchaseSystem.continueCourse(courseId);
}

function applyPurchaseDiscount() {
    window.coursePurchaseSystem.applyPurchaseDiscount();
}

function completePurchase() {
    window.coursePurchaseSystem.completePurchase();
}

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoursePurchaseSystem;
}
