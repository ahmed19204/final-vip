-- نظام المحفظة الإلكترونية وجداول الدعم

-- جدول محافظ الطلاب
CREATE TABLE IF NOT EXISTS student_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'EGP',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_balance CHECK (balance >= 0),
    CONSTRAINT unique_student_wallet UNIQUE (student_id)
);

-- جدول معاملات المحفظة
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'topup', 'purchase', 'refund', 'withdrawal'
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    payment_method VARCHAR(50), -- 'credit_card', 'mobile_wallet', 'bank_transfer', 'recharge_code'
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'cancelled'
    description TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    reference_data JSONB, -- بيانات إضافية للمعاملة
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_transaction_type CHECK (type IN ('topup', 'purchase', 'refund', 'withdrawal')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'))
);

-- جدول أكواد الشحن
CREATE TABLE IF NOT EXISTS recharge_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'used', 'expired'
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    used_by UUID REFERENCES students(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_recharge_status CHECK (status IN ('active', 'used', 'expired'))
);

-- جدول أكواد الخصم
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage', 'fixed'
    discount_percentage DECIMAL(5,2), -- للخصم بالنسبة المئوية
    discount_amount DECIMAL(10,2), -- للخصم بمبلغ ثابت
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_discount_type CHECK (discount_type IN ('percentage', 'fixed')),
    CONSTRAINT valid_percentage CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100)),
    CONSTRAINT positive_discount_amount CHECK (discount_amount IS NULL OR discount_amount > 0),
    CONSTRAINT valid_discount_status CHECK (status IN ('active', 'inactive', 'expired'))
);

-- جدول تسجيل الطلاب في الكورسات
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled', 'refunded'
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    completed_at TIMESTAMP WITH TIME ZONE,
    certificate_issued BOOLEAN DEFAULT FALSE,
    last_accessed TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_enrollment UNIQUE (student_id, course_id),
    CONSTRAINT valid_enrollment_status CHECK (status IN ('active', 'completed', 'cancelled', 'refunded')),
    CONSTRAINT valid_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

-- جدول تقدم الطلاب في الفيديوهات
CREATE TABLE IF NOT EXISTS video_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    watch_duration INTEGER DEFAULT 0, -- بالثواني
    total_duration INTEGER, -- المدة الكلية للفيديو
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    completed BOOLEAN DEFAULT FALSE,
    first_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_video_progress UNIQUE (student_id, video_id),
    CONSTRAINT valid_completion CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

-- جدول الشهادات
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    template_data JSONB, -- بيانات القالب والتصميم
    pdf_url TEXT, -- رابط ملف PDF للشهادة
    verification_code VARCHAR(20) UNIQUE,
    status VARCHAR(20) DEFAULT 'active',
    
    CONSTRAINT unique_certificate UNIQUE (student_id, course_id),
    CONSTRAINT valid_certificate_status CHECK (status IN ('active', 'revoked'))
);

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- يمكن أن يكون طالب أو مدرس أو مدير
    user_type VARCHAR(20) NOT NULL, -- 'student', 'teacher', 'admin'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'course_enrollment', 'payment', 'certificate', 'announcement'
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT, -- رابط للإجراء المطلوب
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_user_type CHECK (user_type IN ('student', 'teacher', 'admin')),
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- جدول سجل النشاط للطلاب
CREATE TABLE IF NOT EXISTS student_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_student_activity_student_id (student_id),
    INDEX idx_student_activity_type (activity_type),
    INDEX idx_student_activity_date (created_at)
);

-- جدول إعدادات النظام
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج إعدادات النظام الافتراضية
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category) VALUES
('platform_name', 'VIP Educational Center', 'string', 'اسم المنصة التعليمية', 'general'),
('currency', 'EGP', 'string', 'العملة المستخدمة', 'financial'),
('min_wallet_topup', '10', 'number', 'الحد الأدنى لشحن المحفظة', 'financial'),
('max_wallet_balance', '10000', 'number', 'الحد الأقصى لرصيد المحفظة', 'financial'),
('certificate_auto_issue', 'true', 'boolean', 'إصدار الشهادات تلقائياً عند إكمال الكورس', 'certificates'),
('email_notifications', 'true', 'boolean', 'تفعيل إشعارات البريد الإلكتروني', 'notifications'),
('maintenance_mode', 'false', 'boolean', 'وضع الصيانة', 'system')
ON CONFLICT (setting_key) DO NOTHING;

-- إنشاء الفهارس للأداء
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_student_id ON wallet_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_date ON wallet_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON course_enrollments(status);

CREATE INDEX IF NOT EXISTS idx_video_progress_student_id ON video_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_course_id ON video_progress(course_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_at);

-- إنشاء الدوال المساعدة

-- دالة لزيادة استخدام كود الخصم
CREATE OR REPLACE FUNCTION increment_discount_usage(discount_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE discount_codes 
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = discount_id;
END;
$$ LANGUAGE plpgsql;

-- دالة لحساب تقدم الطالب في الكورس
CREATE OR REPLACE FUNCTION calculate_course_progress(p_student_id UUID, p_course_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_videos INTEGER;
    completed_videos INTEGER;
    progress_percentage DECIMAL;
BEGIN
    -- عدد الفيديوهات الكلي في الكورس
    SELECT COUNT(*) INTO total_videos
    FROM videos 
    WHERE course_id = p_course_id AND status = 'active';
    
    -- عدد الفيديوهات المكتملة
    SELECT COUNT(*) INTO completed_videos
    FROM video_progress vp
    JOIN videos v ON vp.video_id = v.id
    WHERE vp.student_id = p_student_id 
      AND v.course_id = p_course_id 
      AND vp.completed = true;
    
    -- حساب النسبة المئوية
    IF total_videos > 0 THEN
        progress_percentage := (completed_videos::DECIMAL / total_videos::DECIMAL) * 100;
    ELSE
        progress_percentage := 0;
    END IF;
    
    -- تحديث تقدم الطالب في الكورس
    UPDATE course_enrollments 
    SET progress_percentage = progress_percentage,
        completed_at = CASE WHEN progress_percentage = 100 THEN NOW() ELSE completed_at END,
        status = CASE WHEN progress_percentage = 100 THEN 'completed' ELSE status END
    WHERE student_id = p_student_id AND course_id = p_course_id;
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- دالة لإنشاء رقم شهادة فريد
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
    cert_number TEXT;
BEGIN
    cert_number := 'VIP-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                   LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    
    -- التأكد من عدم تكرار الرقم
    WHILE EXISTS (SELECT 1 FROM certificates WHERE certificate_number = cert_number) LOOP
        cert_number := 'VIP-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                       LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    END LOOP;
    
    RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- إنشاء الـ Triggers

-- Trigger لتحديث تاريخ التعديل في المحافظ
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_wallets_timestamp
    BEFORE UPDATE ON student_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_timestamp();

-- Trigger لتحديث تقدم الكورس عند إكمال فيديو
CREATE OR REPLACE FUNCTION update_course_progress_on_video_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- إذا تم إكمال الفيديو
    IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
        PERFORM calculate_course_progress(NEW.student_id, NEW.course_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_progress_trigger
    AFTER UPDATE ON video_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_course_progress_on_video_completion();

-- إنشاء سياسات الأمان (RLS)

-- تفعيل RLS للجداول الحساسة
ALTER TABLE student_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- سياسات أمان المحافظ
CREATE POLICY "Students can view own wallet" ON student_wallets
    FOR SELECT USING (auth.uid()::text = student_id::text);

CREATE POLICY "Students can view own transactions" ON wallet_transactions
    FOR SELECT USING (auth.uid()::text = student_id::text);

-- سياسات أمان التسجيل في الكورسات
CREATE POLICY "Students can view own enrollments" ON course_enrollments
    FOR SELECT USING (auth.uid()::text = student_id::text);

-- سياسات أمان تقدم الفيديوهات
CREATE POLICY "Students can view own progress" ON video_progress
    FOR SELECT USING (auth.uid()::text = student_id::text);

CREATE POLICY "Students can update own progress" ON video_progress
    FOR UPDATE USING (auth.uid()::text = student_id::text);

-- سياسات أمان الشهادات
CREATE POLICY "Students can view own certificates" ON certificates
    FOR SELECT USING (auth.uid()::text = student_id::text);

-- سياسات أمان الإشعارات
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- منح الصلاحيات للمديرين
CREATE POLICY "Admins can manage all data" ON student_wallets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- تطبيق نفس السياسة على باقي الجداول
CREATE POLICY "Admins can manage all transactions" ON wallet_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can manage all enrollments" ON course_enrollments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- إنشاء Views مفيدة

-- عرض إحصائيات المحافظ
CREATE OR REPLACE VIEW wallet_statistics AS
SELECT 
    COUNT(*) as total_wallets,
    SUM(balance) as total_balance,
    AVG(balance) as average_balance,
    COUNT(CASE WHEN balance > 0 THEN 1 END) as active_wallets,
    COUNT(CASE WHEN balance = 0 THEN 1 END) as empty_wallets
FROM student_wallets
WHERE status = 'active';

-- عرض إحصائيات المعاملات
CREATE OR REPLACE VIEW transaction_statistics AS
SELECT 
    DATE(created_at) as transaction_date,
    type,
    COUNT(*) as transaction_count,
    SUM(ABS(amount)) as total_amount,
    AVG(ABS(amount)) as average_amount
FROM wallet_transactions
WHERE status = 'completed'
GROUP BY DATE(created_at), type
ORDER BY transaction_date DESC;

-- عرض الكورسات الأكثر مبيعاً
CREATE OR REPLACE VIEW popular_courses AS
SELECT 
    c.id,
    c.title,
    COUNT(ce.id) as enrollment_count,
    SUM(ce.amount_paid) as total_revenue,
    AVG(ce.amount_paid) as average_price
FROM courses c
LEFT JOIN course_enrollments ce ON c.id = ce.course_id
WHERE ce.status = 'active'
GROUP BY c.id, c.title
ORDER BY enrollment_count DESC, total_revenue DESC;

COMMENT ON TABLE student_wallets IS 'جدول محافظ الطلاب الإلكترونية';
COMMENT ON TABLE wallet_transactions IS 'جدول معاملات المحفظة المالية';
COMMENT ON TABLE recharge_codes IS 'جدول أكواد شحن الرصيد';
COMMENT ON TABLE discount_codes IS 'جدول أكواد الخصم والعروض';
COMMENT ON TABLE course_enrollments IS 'جدول تسجيل الطلاب في الكورسات';
COMMENT ON TABLE video_progress IS 'جدول تتبع تقدم الطلاب في مشاهدة الفيديوهات';
COMMENT ON TABLE certificates IS 'جدول شهادات إتمام الكورسات';
COMMENT ON TABLE notifications IS 'جدول إشعارات النظام';
COMMENT ON TABLE student_activity_log IS 'جدول سجل نشاط الطلاب';
COMMENT ON TABLE system_settings IS 'جدول إعدادات النظام العامة';
