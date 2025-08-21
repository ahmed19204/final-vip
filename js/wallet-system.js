// نظام المحفظة الإلكترونية المتقدم

class WalletSystem {
    constructor() {
        this.currentBalance = 0;
        this.transactions = [];
        this.selectedPaymentMethod = null;
        this.selectedAmount = 0;
        
        this.init();
    }

    // تهيئة النظام
    async init() {
        await this.loadWalletData();
        this.setupEventListeners();
        this.updateWalletDisplay();
    }

    // تحميل بيانات المحفظة
    async loadWalletData() {
        try {
            const user = this.getCurrentUser();
            if (!user) return;

            // جلب رصيد المحفظة
            const { data: walletData, error: walletError } = await window.supabaseClient
                .from('student_wallets')
                .select('balance, created_at, updated_at')
                .eq('student_id', user.id)
                .single();

            if (walletError && walletError.code !== 'PGRST116') {
                console.error('Error loading wallet:', walletError);
                return;
            }

            if (walletData) {
                this.currentBalance = parseFloat(walletData.balance) || 0;
            } else {
                // إنشاء محفظة جديدة
                await this.createWallet(user.id);
            }

            // جلب سجل المعاملات
            await this.loadTransactionHistory();

        } catch (error) {
            console.error('Error initializing wallet:', error);
        }
    }

    // إنشاء محفظة جديدة
    async createWallet(studentId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('student_wallets')
                .insert([{
                    student_id: studentId,
                    balance: 0.00
                }])
                .select()
                .single();

            if (error) throw error;
            
            this.currentBalance = 0;
            console.log('New wallet created');
            
        } catch (error) {
            console.error('Error creating wallet:', error);
        }
    }

    // تحميل سجل المعاملات
    async loadTransactionHistory() {
        try {
            const user = this.getCurrentUser();
            if (!user) return;

            const { data, error } = await window.supabaseClient
                .from('wallet_transactions')
                .select(`
                    *,
                    courses(title)
                `)
                .eq('student_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            this.transactions = data || [];
            
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // أزرار طرق الدفع
        document.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const method = e.currentTarget.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.selectPaymentMethod(method);
            });
        });

        // أزرار المبالغ
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseFloat(e.currentTarget.textContent.match(/\d+/)[0]);
                this.selectAmount(amount);
            });
        });

        // مبلغ مخصص
        const customAmountInput = document.getElementById('customAmount');
        if (customAmountInput) {
            customAmountInput.addEventListener('input', (e) => {
                const amount = parseFloat(e.target.value);
                if (!isNaN(amount) && amount > 0) {
                    this.selectAmount(amount);
                }
            });
        }

        // طرق الدفع في الشراء
        document.querySelectorAll('input[name="purchaseMethod"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handlePurchaseMethodChange(e.target.value);
            });
        });
    }

    // اختيار طريقة الدفع
    selectPaymentMethod(method) {
        this.selectedPaymentMethod = method;
        
        // تحديث UI
        document.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        event.currentTarget.classList.add('selected');
        
        // إظهار نموذج الدفع المناسب
        this.showPaymentForm(method);
    }

    // اختيار المبلغ
    selectAmount(amount) {
        this.selectedAmount = amount;
        
        // تحديث UI
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // تحديد الزر المناسب
        const targetBtn = Array.from(document.querySelectorAll('.amount-btn'))
            .find(btn => parseInt(btn.textContent.match(/\d+/)[0]) === amount);
        
        if (targetBtn) {
            targetBtn.classList.add('selected');
        }
        
        // تحديث حقل المبلغ المخصص
        const customInput = document.getElementById('customAmount');
        if (customInput) {
            customInput.value = amount;
        }
    }

    // إظهار نموذج الدفع
    showPaymentForm(method) {
        const paymentForm = document.getElementById('paymentForm');
        if (!paymentForm) return;

        let formHTML = '';

        switch (method) {
            case 'card':
                formHTML = this.getCardPaymentForm();
                break;
            case 'wallet':
                formHTML = this.getWalletPaymentForm();
                break;
            case 'bank':
                formHTML = this.getBankTransferForm();
                break;
            case 'code':
                formHTML = this.getRechargeCodeForm();
                break;
        }

        paymentForm.innerHTML = formHTML;
        paymentForm.style.display = 'block';
    }

    // نموذج دفع البطاقة الائتمانية
    getCardPaymentForm() {
        return `
            <div class="payment-form-section">
                <h4>بيانات البطاقة الائتمانية</h4>
                <div class="form-group">
                    <label>رقم البطاقة</label>
                    <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19" class="form-input">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>تاريخ الانتهاء</label>
                        <input type="text" id="cardExpiry" placeholder="MM/YY" maxlength="5" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>CVV</label>
                        <input type="text" id="cardCVV" placeholder="123" maxlength="4" class="form-input">
                    </div>
                </div>
                <div class="form-group">
                    <label>اسم حامل البطاقة</label>
                    <input type="text" id="cardHolder" placeholder="الاسم كما هو مكتوب على البطاقة" class="form-input">
                </div>
                <div class="security-notice">
                    🔒 جميع بياناتك محمية بتشفير SSL 256-bit
                </div>
            </div>
        `;
    }

    // نموذج المحفظة الإلكترونية
    getWalletPaymentForm() {
        return `
            <div class="payment-form-section">
                <h4>محفظة إلكترونية</h4>
                <div class="wallet-options">
                    <label class="wallet-option">
                        <input type="radio" name="walletType" value="vodafone">
                        <span class="wallet-logo">📱</span>
                        <span>فودافون كاش</span>
                    </label>
                    <label class="wallet-option">
                        <input type="radio" name="walletType" value="orange">
                        <span class="wallet-logo">🟠</span>
                        <span>أورانج موني</span>
                    </label>
                    <label class="wallet-option">
                        <input type="radio" name="walletType" value="etisalat">
                        <span class="wallet-logo">💚</span>
                        <span>اتصالات فلوسي</span>
                    </label>
                    <label class="wallet-option">
                        <input type="radio" name="walletType" value="we">
                        <span class="wallet-logo">💜</span>
                        <span>WE Pay</span>
                    </label>
                </div>
                <div class="form-group">
                    <label>رقم المحفظة</label>
                    <input type="text" id="walletNumber" placeholder="01xxxxxxxxx" class="form-input">
                </div>
            </div>
        `;
    }

    // نموذج التحويل البنكي
    getBankTransferForm() {
        return `
            <div class="payment-form-section">
                <h4>بيانات التحويل البنكي</h4>
                <div class="bank-info">
                    <div class="bank-details">
                        <h5>بيانات الحساب البنكي:</h5>
                        <p><strong>اسم البنك:</strong> البنك الأهلي المصري</p>
                        <p><strong>رقم الحساب:</strong> 1234567890123456</p>
                        <p><strong>اسم المستفيد:</strong> VIP Educational Center</p>
                        <p><strong>كود SWIFT:</strong> NBEAEGCX</p>
                    </div>
                    <div class="transfer-instructions">
                        <h5>تعليمات التحويل:</h5>
                        <ol>
                            <li>قم بتحويل المبلغ المطلوب إلى الحساب أعلاه</li>
                            <li>احتفظ بإيصال التحويل</li>
                            <li>أرفق صورة الإيصال أدناه</li>
                            <li>سيتم تفعيل رصيدك خلال 24 ساعة</li>
                        </ol>
                    </div>
                </div>
                <div class="form-group">
                    <label>إيصال التحويل</label>
                    <input type="file" id="transferReceipt" accept="image/*,.pdf" class="form-input">
                </div>
                <div class="form-group">
                    <label>رقم العملية (اختياري)</label>
                    <input type="text" id="transferReference" placeholder="رقم مرجع التحويل" class="form-input">
                </div>
            </div>
        `;
    }

    // نموذج كود الشحن
    getRechargeCodeForm() {
        return `
            <div class="payment-form-section">
                <h4>كود شحن الرصيد</h4>
                <div class="form-group">
                    <label>كود الشحن</label>
                    <input type="text" id="rechargeCode" placeholder="أدخل كود الشحن" class="form-input">
                    <small>يمكنك الحصول على كود الشحن من أحد منافذ البيع المعتمدة</small>
                </div>
                <div class="code-validation" id="codeValidation" style="display: none;">
                    <!-- نتيجة التحقق من الكود -->
                </div>
            </div>
        `;
    }

    // معالجة الدفع
    async processPayment() {
        if (!this.selectedPaymentMethod || !this.selectedAmount) {
            this.showToast('يرجى اختيار طريقة الدفع والمبلغ', 'error');
            return;
        }

        this.showLoading(true);

        try {
            let result;

            switch (this.selectedPaymentMethod) {
                case 'card':
                    result = await this.processCardPayment();
                    break;
                case 'wallet':
                    result = await this.processWalletPayment();
                    break;
                case 'bank':
                    result = await this.processBankTransfer();
                    break;
                case 'code':
                    result = await this.processRechargeCode();
                    break;
            }

            if (result.success) {
                await this.addToBalance(this.selectedAmount, result.transactionId);
                this.showToast('تم شحن الرصيد بنجاح!', 'success');
                this.closeModal('addFundsModal');
                this.updateWalletDisplay();
            } else {
                this.showToast(result.error || 'فشل في عملية الدفع', 'error');
            }

        } catch (error) {
            console.error('Payment processing error:', error);
            this.showToast('حدث خطأ في عملية الدفع', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // معالجة دفع البطاقة الائتمانية
    async processCardPayment() {
        const cardNumber = document.getElementById('cardNumber')?.value;
        const cardExpiry = document.getElementById('cardExpiry')?.value;
        const cardCVV = document.getElementById('cardCVV')?.value;
        const cardHolder = document.getElementById('cardHolder')?.value;

        // التحقق من البيانات
        if (!cardNumber || !cardExpiry || !cardCVV || !cardHolder) {
            return { success: false, error: 'يرجى إدخال جميع بيانات البطاقة' };
        }

        // محاكاة عملية الدفع (في الواقع ستتم عبر gateway دفع حقيقي)
        return new Promise((resolve) => {
            setTimeout(() => {
                // محاكاة نجاح العملية 90% من الوقت
                const success = Math.random() > 0.1;
                if (success) {
                    resolve({
                        success: true,
                        transactionId: 'CARD_' + Date.now(),
                        method: 'credit_card'
                    });
                } else {
                    resolve({
                        success: false,
                        error: 'تم رفض البطاقة. يرجى التأكد من البيانات أو المحاولة بطاقة أخرى'
                    });
                }
            }, 2000);
        });
    }

    // معالجة دفع المحفظة الإلكترونية
    async processWalletPayment() {
        const walletType = document.querySelector('input[name="walletType"]:checked')?.value;
        const walletNumber = document.getElementById('walletNumber')?.value;

        if (!walletType || !walletNumber) {
            return { success: false, error: 'يرجى اختيار نوع المحفظة ورقم المحفظة' };
        }

        // محاكاة عملية الدفع
        return new Promise((resolve) => {
            setTimeout(() => {
                const success = Math.random() > 0.05;
                if (success) {
                    resolve({
                        success: true,
                        transactionId: `${walletType.toUpperCase()}_${Date.now()}`,
                        method: 'mobile_wallet'
                    });
                } else {
                    resolve({
                        success: false,
                        error: 'فشل في الدفع. يرجى التأكد من رصيد المحفظة'
                    });
                }
            }, 1500);
        });
    }

    // معالجة التحويل البنكي
    async processBankTransfer() {
        const receipt = document.getElementById('transferReceipt')?.files[0];
        const reference = document.getElementById('transferReference')?.value;

        if (!receipt) {
            return { success: false, error: 'يرجى رفع إيصال التحويل' };
        }

        // رفع الإيصال وحفظ بيانات التحويل
        try {
            const receiptUrl = await this.uploadReceipt(receipt);
            
            return {
                success: true,
                transactionId: 'BANK_' + Date.now(),
                method: 'bank_transfer',
                status: 'pending', // في انتظار المراجعة
                receiptUrl,
                reference
            };
        } catch (error) {
            return { success: false, error: 'فشل في رفع الإيصال' };
        }
    }

    // معالجة كود الشحن
    async processRechargeCode() {
        const code = document.getElementById('rechargeCode')?.value;

        if (!code) {
            return { success: false, error: 'يرجى إدخال كود الشحن' };
        }

        try {
            // التحقق من صحة الكود
            const { data, error } = await window.supabaseClient
                .from('recharge_codes')
                .select('*')
                .eq('code', code)
                .eq('status', 'active')
                .single();

            if (error || !data) {
                return { success: false, error: 'كود الشحن غير صحيح أو مستخدم مسبقاً' };
            }

            // تحديث حالة الكود
            await window.supabaseClient
                .from('recharge_codes')
                .update({ 
                    status: 'used',
                    used_at: new Date().toISOString(),
                    used_by: this.getCurrentUser().id
                })
                .eq('id', data.id);

            return {
                success: true,
                transactionId: 'CODE_' + data.id,
                method: 'recharge_code',
                amount: data.amount
            };

        } catch (error) {
            return { success: false, error: 'حدث خطأ في التحقق من الكود' };
        }
    }

    // إضافة مبلغ للرصيد
    async addToBalance(amount, transactionId, method = null, status = 'completed') {
        try {
            const user = this.getCurrentUser();
            if (!user) throw new Error('المستخدم غير مسجل');

            // تحديث رصيد المحفظة
            const newBalance = this.currentBalance + amount;
            
            const { error: walletError } = await window.supabaseClient
                .from('student_wallets')
                .update({ 
                    balance: newBalance,
                    updated_at: new Date().toISOString()
                })
                .eq('student_id', user.id);

            if (walletError) throw walletError;

            // إضافة معاملة جديدة
            const { error: transactionError } = await window.supabaseClient
                .from('wallet_transactions')
                .insert([{
                    student_id: user.id,
                    type: 'topup',
                    amount: amount,
                    balance_after: newBalance,
                    transaction_id: transactionId,
                    payment_method: method || this.selectedPaymentMethod,
                    status: status,
                    description: `شحن رصيد - ${amount} جنيه`
                }]);

            if (transactionError) throw transactionError;

            // تحديث الرصيد المحلي
            this.currentBalance = newBalance;

            // إعادة تحميل سجل المعاملات
            await this.loadTransactionHistory();

        } catch (error) {
            console.error('Error adding to balance:', error);
            throw error;
        }
    }

    // خصم مبلغ من الرصيد
    async deductFromBalance(amount, description, courseId = null) {
        try {
            const user = this.getCurrentUser();
            if (!user) throw new Error('المستخدم غير مسجل');

            if (this.currentBalance < amount) {
                throw new Error('الرصيد غير كافي');
            }

            const newBalance = this.currentBalance - amount;
            
            // تحديث رصيد المحفظة
            const { error: walletError } = await window.supabaseClient
                .from('student_wallets')
                .update({ 
                    balance: newBalance,
                    updated_at: new Date().toISOString()
                })
                .eq('student_id', user.id);

            if (walletError) throw walletError;

            // إضافة معاملة جديدة
            const { error: transactionError } = await window.supabaseClient
                .from('wallet_transactions')
                .insert([{
                    student_id: user.id,
                    type: 'purchase',
                    amount: -amount,
                    balance_after: newBalance,
                    transaction_id: 'PURCHASE_' + Date.now(),
                    status: 'completed',
                    description: description,
                    course_id: courseId
                }]);

            if (transactionError) throw transactionError;

            // تحديث الرصيد المحلي
            this.currentBalance = newBalance;

            // إعادة تحميل سجل المعاملات
            await this.loadTransactionHistory();

            return { success: true, newBalance };

        } catch (error) {
            console.error('Error deducting from balance:', error);
            return { success: false, error: error.message };
        }
    }

    // رفع إيصال التحويل
    async uploadReceipt(file) {
        try {
            const fileName = `receipts/${Date.now()}_${file.name}`;
            
            const { data, error } = await window.supabaseClient.storage
                .from('documents')
                .upload(fileName, file);

            if (error) throw error;

            const { data: urlData } = window.supabaseClient.storage
                .from('documents')
                .getPublicUrl(fileName);

            return urlData.publicUrl;

        } catch (error) {
            console.error('Error uploading receipt:', error);
            throw error;
        }
    }

    // تحديث عرض المحفظة
    updateWalletDisplay() {
        const walletAmountElement = document.getElementById('walletAmount');
        const currentBalanceElements = document.querySelectorAll('#currentBalance');
        
        if (walletAmountElement) {
            walletAmountElement.textContent = `${this.currentBalance.toFixed(2)} جنيه`;
        }
        
        currentBalanceElements.forEach(element => {
            element.textContent = this.currentBalance.toFixed(2);
        });
    }

    // عرض سجل المعاملات
    displayTransactionHistory() {
        const transactionsList = document.getElementById('transactionsList');
        if (!transactionsList || !this.transactions.length) return;

        const transactionsHTML = this.transactions.map(transaction => {
            const isPositive = transaction.amount > 0;
            const amountClass = isPositive ? 'positive' : 'negative';
            const amountSign = isPositive ? '+' : '';
            
            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-title">${transaction.description}</div>
                        <div class="transaction-date">${new Date(transaction.created_at).toLocaleDateString('ar-EG')}</div>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${amountSign}${Math.abs(transaction.amount).toFixed(2)} جنيه
                    </div>
                </div>
            `;
        }).join('');

        transactionsList.innerHTML = transactionsHTML;
    }

    // معالجة تغيير طريقة الدفع في الشراء
    handlePurchaseMethodChange(method) {
        const discountSection = document.getElementById('discountCodeSection');
        
        if (method === 'discount') {
            discountSection.style.display = 'block';
        } else {
            discountSection.style.display = 'none';
        }
    }

    // الحصول على المستخدم الحالي
    getCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    }

    // عرض التحميل
    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    // عرض رسالة
    showToast(message, type = 'success') {
        const toast = document.getElementById('notificationToast');
        const icon = document.getElementById('toastIcon');
        const messageEl = document.getElementById('toastMessage');

        if (!toast || !icon || !messageEl) return;

        // تحديد الأيقونة حسب النوع
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        icon.textContent = icons[type] || icons.success;
        messageEl.textContent = message;

        // إظهار الرسالة
        toast.classList.add('show');

        // إخفاء الرسالة بعد 3 ثوان
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // إغلاق النافذة المنبثقة
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }
}

// إنشاء مثيل عام من نظام المحفظة
window.walletSystem = new WalletSystem();

// دوال عامة للاستخدام في HTML
function showAddFundsModal() {
    const modal = document.getElementById('addFundsModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

function selectPaymentMethod(method) {
    window.walletSystem.selectPaymentMethod(method);
}

function selectAmount(amount) {
    window.walletSystem.selectAmount(amount);
}

function processPayment() {
    window.walletSystem.processPayment();
}

function showTransactionHistory() {
    const modal = document.getElementById('transactionHistoryModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        window.walletSystem.displayTransactionHistory();
    }
}

function closeModal(modalId) {
    window.walletSystem.closeModal(modalId);
}

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletSystem;
}
