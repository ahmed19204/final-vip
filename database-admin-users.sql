-- إنشاء جدول المستخدمين الإداريين
-- يجب تنفيذ هذا في Supabase SQL Editor

-- إنشاء جدول admin_users
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'content_admin', 'teacher')),
    permissions JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id)
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- إدراج مستخدم إداري افتراضي
-- ملاحظة: يجب تغيير البريد الإلكتروني وإنشاء المستخدم في Supabase Auth أولاً
INSERT INTO admin_users (email, name, role, permissions, status) 
VALUES (
    'admin@vip-center.com',
    'المدير العام',
    'super_admin',
    '{
        "dashboard": true,
        "teachers": {"view": true, "add": true, "edit": true, "delete": true},
        "students": {"view": true, "add": true, "edit": true, "delete": true},
        "courses": {"view": true, "add": true, "edit": true, "delete": true},
        "videos": {"view": true, "add": true, "edit": true, "delete": true},
        "subjects": {"view": true, "add": true, "edit": true, "delete": true},
        "codes": {"view": true, "add": true, "edit": true, "delete": true},
        "settings": {"view": true, "edit": true}
    }',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- إنشاء جدول سجل العمليات الإدارية
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT, -- 'teacher', 'student', 'course', etc.
    target_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس لجدول السجل
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_target ON admin_activity_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);

-- إنشاء دالة لتسجيل العمليات
CREATE OR REPLACE FUNCTION log_admin_activity(
    p_admin_id UUID,
    p_action TEXT,
    p_target_type TEXT DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details)
    VALUES (p_admin_id, p_action, p_target_type, p_target_id, p_details)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء Row Level Security (RLS) للحماية
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول admin_users
CREATE POLICY "Admins can view all admin users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.id = auth.uid()::uuid 
            AND au.status = 'active'
        )
    );

CREATE POLICY "Super admins can manage admin users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.id = auth.uid()::uuid 
            AND au.role = 'super_admin' 
            AND au.status = 'active'
        )
    );

-- سياسات الأمان لجدول admin_activity_log
CREATE POLICY "Admins can view activity logs" ON admin_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.id = auth.uid()::uuid 
            AND au.status = 'active'
        )
    );

CREATE POLICY "System can insert activity logs" ON admin_activity_log
    FOR INSERT WITH CHECK (true);

-- منح الصلاحيات
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON admin_users TO authenticated;
GRANT SELECT, INSERT ON admin_activity_log TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_activity TO authenticated;
