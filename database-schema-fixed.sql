-- VIP Center Database Schema - Fixed Version
-- قم بتنفيذ هذا الملف في Supabase SQL Editor

-- إنشاء جدول المدرسين
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    bio TEXT,
    image_url TEXT,
    experience_years INTEGER DEFAULT 0,
    education TEXT,
    specializations TEXT[],
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_students INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول التخصصات
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    grade_level TEXT,
    difficulty_level TEXT DEFAULT 'متوسط',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الكورسات
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    price DECIMAL(10,2) DEFAULT 0.00,
    duration_hours INTEGER DEFAULT 0,
    level TEXT DEFAULT 'متوسط',
    requires_code BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الفيديوهات
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    duration_minutes INTEGER DEFAULT 0,
    order_in_course INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول أكواد الوصول
CREATE TABLE IF NOT EXISTS access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    description TEXT,
    max_uses INTEGER DEFAULT 100,
    current_uses INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الطلاب
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('ذكر', 'أنثى')),
    governorate TEXT,
    country TEXT DEFAULT 'مصر',
    grade TEXT,
    parent_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول تسجيل الطلاب في الكورسات
CREATE TABLE IF NOT EXISTS student_course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    UNIQUE(student_id, course_id)
);

-- إنشاء جدول مشاهدات الفيديو
CREATE TABLE IF NOT EXISTS video_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    watch_duration_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false
);

-- إنشاء دالة لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- حذف Triggers القديمة (إذا وجدت) قبل إنشاء الجديدة
DROP TRIGGER IF EXISTS update_teachers_updated_at ON teachers;
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
DROP TRIGGER IF EXISTS update_access_codes_updated_at ON access_codes;
DROP TRIGGER IF EXISTS update_students_updated_at ON students;

-- إنشاء triggers لتحديث updated_at
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_access_codes_updated_at BEFORE UPDATE ON access_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_courses_subject_id ON courses(subject_id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_videos_course_id ON videos(course_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- تمكين RLS (Row Level Security)
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة (إذا وجدت)
DROP POLICY IF EXISTS "Allow public read access to teachers" ON teachers;
DROP POLICY IF EXISTS "Allow public read access to subjects" ON subjects;
DROP POLICY IF EXISTS "Allow public read access to courses" ON courses;
DROP POLICY IF EXISTS "Allow public read access to videos" ON videos;
DROP POLICY IF EXISTS "Allow public read access to access_codes" ON access_codes;
DROP POLICY IF EXISTS "Allow public read access to students" ON access_codes;
DROP POLICY IF EXISTS "Allow public read access to student_course_enrollments" ON access_codes;
DROP POLICY IF EXISTS "Allow public read access to video_views" ON access_codes;

-- حذف السياسات الجديدة (إذا وجدت) لإعادة إنشاؤها
DROP POLICY IF EXISTS "Enable all access for teachers" ON teachers;
DROP POLICY IF EXISTS "Enable all access for subjects" ON subjects;
DROP POLICY IF EXISTS "Enable all access for courses" ON courses;
DROP POLICY IF EXISTS "Enable all access for videos" ON videos;
DROP POLICY IF EXISTS "Enable all access for access_codes" ON access_codes;
DROP POLICY IF EXISTS "Enable all access for students" ON students;
DROP POLICY IF EXISTS "Enable all access for student_course_enrollments" ON student_course_enrollments;
DROP POLICY IF EXISTS "Enable all access for video_views" ON video_views;

-- إنشاء سياسات RLS جديدة تسمح بالقراءة والكتابة للجميع (للتطوير)
CREATE POLICY "Enable all access for teachers" ON teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for subjects" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for courses" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for videos" ON videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for access_codes" ON access_codes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for student_course_enrollments" ON student_course_enrollments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for video_views" ON video_views FOR ALL USING (true) WITH CHECK (true);

-- إدخال بيانات تجريبية للمدرسين (إذا لم تكن موجودة)
INSERT INTO teachers (name, email, phone, bio, experience_years, education, specializations) 
SELECT * FROM (VALUES
    ('أحمد محمد', 'ahmed.mohamed@vipcenter.com', '01012345678', 'مدرس رياضيات محترف مع خبرة 15 سنة في تدريس الثانوية العامة، متخصص في الجبر والهندسة', 15, 'ماجستير رياضيات تطبيقية', ARRAY['جبر', 'هندسة', 'تفاضل وتكامل']),
    ('فاطمة علي', 'fatima.ali@vipcenter.com', '01087654321', 'مدرسة فيزياء متخصصة في الفيزياء الحديثة والميكانيكا الكمية', 12, 'دكتوراه فيزياء', ARRAY['ميكانيكا', 'كهرباء', 'ضوء', 'فيزياء حديثة']),
    ('محمد حسن', 'mohamed.hassan@vipcenter.com', '01011223344', 'مدرس كيمياء مع خبرة في الكيمياء العضوية والتحليلية', 10, 'ماجستير كيمياء', ARRAY['كيمياء عامة', 'كيمياء عضوية', 'كيمياء تحليلية']),
    ('سارة أحمد', 'sara.ahmed@vipcenter.com', '01099887766', 'مدرسة أحياء متخصصة في علم الوراثة والتطور', 8, 'ماجستير أحياء', ARRAY['علم الوراثة', 'التطور', 'علم الخلية', 'علم البيئة']),
    ('علي محمود', 'ali.mahmoud@vipcenter.com', '01055443322', 'مدرس لغة عربية متخصص في الأدب والنصوص', 14, 'ماجستير أدب عربي', ARRAY['أدب', 'نصوص', 'بلاغة', 'نحو'])
) AS v(name, email, phone, bio, experience_years, education, specializations)
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE email = v.email);

-- إدخال بيانات تجريبية للتخصصات (إذا لم تكن موجودة)
INSERT INTO subjects (name, description, grade_level, difficulty_level)
SELECT * FROM (VALUES
    ('الرياضيات', 'تخصص شامل في الرياضيات للثانوية العامة', 'الثانوية العامة', 'متقدم'),
    ('الفيزياء', 'تخصص في الفيزياء النظرية والتطبيقية', 'الثانوية العامة', 'متقدم'),
    ('الكيمياء', 'تخصص في الكيمياء العضوية والغير عضوية', 'الثانوية العامة', 'متوسط'),
    ('الأحياء', 'تخصص في علم الأحياء والوراثة', 'الثانوية العامة', 'متوسط'),
    ('اللغة العربية', 'تخصص في الأدب العربي والبلاغة', 'الثانوية العامة', 'متوسط'),
    ('اللغة الإنجليزية', 'تخصص في اللغة الإنجليزية والأدب', 'الثانوية العامة', 'متوسط'),
    ('التاريخ', 'تخصص في التاريخ الإسلامي والعربي', 'الثانوية العامة', 'مبتدئ'),
    ('الجغرافيا', 'تخصص في الجغرافيا الطبيعية والبشرية', 'الثانوية العامة', 'مبتدئ')
) AS v(name, description, grade_level, difficulty_level)
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE name = v.name);

-- رسالة نجاح
SELECT '✅ تم إنشاء قاعدة البيانات بنجاح!' as message;
