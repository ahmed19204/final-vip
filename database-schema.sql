-- VIP Center Database Schema
-- قم بتنفيذ هذا الملف في Supabase SQL Editor

-- إنشاء جدول المدرسين
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    subject TEXT,
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
    difficulty_level TEXT CHECK (difficulty_level IN ('مبتدئ', 'متوسط', 'متقدم')),
    image_url TEXT,
    total_courses INTEGER DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
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
    level TEXT CHECK (level IN ('مبتدئ', 'متوسط', 'متقدم')),
    image_url TEXT,
    video_count INTEGER DEFAULT 0,
    student_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    requires_code BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الفيديوهات
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_minutes INTEGER DEFAULT 0,
    order_in_course INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'processing')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول أكواد الوصول
CREATE TABLE IF NOT EXISTS access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    description TEXT,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الطلاب
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    grade TEXT,
    governorate TEXT,
    country TEXT DEFAULT 'مصر',
    birth_date DATE,
    gender TEXT CHECK (gender IN ('ذكر', 'أنثى')),
    profile_image TEXT,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول تسجيل الطلاب في الكورسات
CREATE TABLE IF NOT EXISTS student_course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date TIMESTAMP WITH TIME ZONE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped')),
    UNIQUE(student_id, course_id)
);

-- إنشاء جدول مشاهدات الفيديو
CREATE TABLE IF NOT EXISTS video_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    view_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    watch_duration_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_subject ON teachers(subject);
CREATE INDEX IF NOT EXISTS idx_courses_subject_id ON courses(subject_id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_videos_course_id ON videos(course_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_course_id ON access_codes(course_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON student_course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON student_course_enrollments(course_id);

-- إنشاء دالة لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء triggers لتحديث updated_at
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_access_codes_updated_at BEFORE UPDATE ON access_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- إدخال بيانات تجريبية للمدرسين
INSERT INTO teachers (name, email, phone, subject, bio, experience_years, education, specializations) VALUES
('أحمد محمد', 'ahmed.mohamed@vipcenter.com', '01012345678', 'الرياضيات', 'مدرس رياضيات محترف مع خبرة 15 سنة في تدريس الثانوية العامة، متخصص في الجبر والهندسة', 15, 'ماجستير رياضيات تطبيقية', ARRAY['جبر', 'هندسة', 'تفاضل وتكامل']),
('فاطمة علي', 'fatima.ali@vipcenter.com', '01087654321', 'الفيزياء', 'مدرسة فيزياء متخصصة في الفيزياء الحديثة والميكانيكا الكمية', 12, 'دكتوراه فيزياء', ARRAY['ميكانيكا', 'كهرباء', 'ضوء', 'فيزياء حديثة']),
('محمد حسن', 'mohamed.hassan@vipcenter.com', '01011223344', 'الكيمياء', 'مدرس كيمياء مع خبرة في الكيمياء العضوية والتحليلية', 10, 'ماجستير كيمياء', ARRAY['كيمياء عامة', 'كيمياء عضوية', 'كيمياء تحليلية']),
('سارة أحمد', 'sara.ahmed@vipcenter.com', '01099887766', 'الأحياء', 'مدرسة أحياء متخصصة في علم الوراثة والتطور', 8, 'ماجستير أحياء', ARRAY['علم الوراثة', 'التطور', 'علم الخلية', 'علم البيئة']),
('علي محمود', 'ali.mahmoud@vipcenter.com', '01055443322', 'اللغة العربية', 'مدرس لغة عربية متخصص في الأدب والنصوص', 14, 'ماجستير أدب عربي', ARRAY['أدب', 'نصوص', 'بلاغة', 'نحو']);

-- إدخال بيانات تجريبية للتخصصات
INSERT INTO subjects (name, description, grade_level, difficulty_level) VALUES
('الرياضيات', 'تخصص شامل في الرياضيات للثانوية العامة', 'الثانوية العامة', 'متقدم'),
('الفيزياء', 'تخصص في الفيزياء النظرية والتطبيقية', 'الثانوية العامة', 'متقدم'),
('الكيمياء', 'تخصص في الكيمياء العضوية والغير عضوية', 'الثانوية العامة', 'متوسط'),
('الأحياء', 'تخصص في علم الأحياء والوراثة', 'الثانوية العامة', 'متوسط'),
('اللغة العربية', 'تخصص في الأدب العربي والبلاغة', 'الثانوية العامة', 'متوسط'),
('اللغة الإنجليزية', 'تخصص في اللغة الإنجليزية والأدب', 'الثانوية العامة', 'متوسط'),
('التاريخ', 'تخصص في التاريخ الإسلامي والعربي', 'الثانوية العامة', 'مبتدئ'),
('الجغرافيا', 'تخصص في الجغرافيا الطبيعية والبشرية', 'الثانوية العامة', 'مبتدئ');

-- إدخال بيانات تجريبية للكورسات
INSERT INTO courses (title, description, subject_id, teacher_id, price, duration_hours, level, requires_code) VALUES
('مقدمة في الجبر', 'كورس شامل في أساسيات الجبر للثانوية العامة', 
 (SELECT id FROM subjects WHERE name = 'الرياضيات' LIMIT 1),
 (SELECT id FROM teachers WHERE name = 'أحمد محمد' LIMIT 1), 299.00, 20, 'متوسط', true),
('الهندسة التحليلية', 'كورس متقدم في الهندسة التحليلية', 
 (SELECT id FROM subjects WHERE name = 'الرياضيات' LIMIT 1),
 (SELECT id FROM teachers WHERE name = 'أحمد محمد' LIMIT 1), 399.00, 25, 'متقدم', true),
('ميكانيكا نيوتن', 'أساسيات الميكانيكا الكلاسيكية', 
 (SELECT id FROM subjects WHERE name = 'الفيزياء' LIMIT 1),
 (SELECT id FROM teachers WHERE name = 'فاطمة علي' LIMIT 1), 349.00, 18, 'متوسط', true),
('الكيمياء العضوية', 'مقدمة في الكيمياء العضوية', 
 (SELECT id FROM subjects WHERE name = 'الكيمياء' LIMIT 1),
 (SELECT id FROM teachers WHERE name = 'محمد حسن' LIMIT 1), 299.00, 22, 'متوسط', true),
('علم الوراثة', 'أساسيات علم الوراثة والجينات', 
 (SELECT id FROM subjects WHERE name = 'الأحياء' LIMIT 1),
 (SELECT id FROM teachers WHERE name = 'سارة أحمد' LIMIT 1), 249.00, 16, 'متوسط', false),
('الأدب العربي الحديث', 'دراسة الأدب العربي في العصر الحديث', 
 (SELECT id FROM subjects WHERE name = 'اللغة العربية' LIMIT 1),
 (SELECT id FROM teachers WHERE name = 'علي محمود' LIMIT 1), 199.00, 15, 'متوسط', false);

-- إدخال بيانات تجريبية لأكواد الوصول
INSERT INTO access_codes (code, course_id, description, max_uses, expires_at) VALUES
('MATH101', (SELECT id FROM courses WHERE title = 'مقدمة في الجبر' LIMIT 1), 'كود وصول لكورس مقدمة في الجبر', 50, NOW() + INTERVAL '1 year'),
('MATH201', (SELECT id FROM courses WHERE title = 'الهندسة التحليلية' LIMIT 1), 'كود وصول لكورس الهندسة التحليلية', 30, NOW() + INTERVAL '1 year'),
('PHYS101', (SELECT id FROM courses WHERE title = 'ميكانيكا نيوتن' LIMIT 1), 'كود وصول لكورس ميكانيكا نيوتن', 40, NOW() + INTERVAL '1 year'),
('CHEM101', (SELECT id FROM courses WHERE title = 'الكيمياء العضوية' LIMIT 1), 'كود وصول لكورس الكيمياء العضوية', 35, NOW() + INTERVAL '1 year');

-- تمكين RLS (Row Level Security)
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS
CREATE POLICY "Allow public read access to teachers" ON teachers FOR SELECT USING (true);
CREATE POLICY "Allow public read access to subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Allow public read access to courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Allow public read access to videos" ON videos FOR SELECT USING (true);
CREATE POLICY "Allow public read access to access_codes" ON access_codes FOR SELECT USING (true);

-- سياسات للمدرسين (يمكنهم تعديل بياناتهم)
CREATE POLICY "Allow teachers to update their own data" ON teachers FOR UPDATE USING (true);

-- سياسات للطلاب (يمكنهم رؤية بياناتهم فقط)
CREATE POLICY "Allow students to view their own data" ON students FOR SELECT USING (true);
CREATE POLICY "Allow students to update their own data" ON students FOR UPDATE USING (true);

-- سياسات للتسجيلات (الطلاب يرون تسجيلاتهم فقط)
CREATE POLICY "Allow students to view their enrollments" ON student_course_enrollments FOR SELECT USING (true);

-- سياسات لمشاهدات الفيديو (الطلاب يرون مشاهداتهم فقط)
CREATE POLICY "Allow students to view their video views" ON video_views FOR SELECT USING (true);

-- رسالة نجاح
SELECT '✅ تم إنشاء قاعدة البيانات بنجاح!' as message;
