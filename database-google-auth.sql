-- إضافة جدول users لحفظ بيانات المستخدمين من Google OAuth
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    provider VARCHAR(50) DEFAULT 'google',
    provider_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- إضافة فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);

-- تحديث جدول students ليدعم OAuth
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_oauth_user BOOLEAN DEFAULT false;

-- إضافة فهرس لجدول students
CREATE INDEX IF NOT EXISTS idx_students_oauth ON students(oauth_provider, oauth_id);

-- دالة لتحديث timestamp عند التعديل
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إضافة trigger لتحديث updated_at تلقائياً
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- إدراج بيانات تجريبية (اختيارية)
INSERT INTO users (email, name, provider) VALUES 
('test@google.com', 'مستخدم تجريبي Google', 'google')
ON CONFLICT (email) DO NOTHING;

-- عرض البيانات للتأكد
SELECT 'Users table created successfully' as status;
SELECT * FROM users LIMIT 5;
