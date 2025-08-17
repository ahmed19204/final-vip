-- VIP Center Database Schema
-- قم بتنفيذ هذا الملف في Supabase SQL Editor

-- إنشاء جدول المدرسين
CREATE TABLE IF NOT EXISTS teachers (
    id BIGSERIAL PRIMARY KEY,
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
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    category TEXT,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_hours INTEGER DEFAULT 0,
    prerequisites TEXT[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الكورسات
CREATE TABLE IF NOT EXISTS courses (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject_id BIGINT REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
    price DECIMAL(10,2) DEFAULT 0.00,
    duration_hours INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    prerequisites TEXT[],
    materials_included TEXT[],
    cover_image_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    enrollment_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الفيديوهات
CREATE TABLE IF NOT EXISTS videos (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    file_size_mb DECIMAL(10,2) DEFAULT 0.00,
    quality TEXT DEFAULT 'HD' CHECK (quality IN ('SD', 'HD', 'FullHD', '4K')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'processing')),
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول أكواد الوصول
CREATE TABLE IF NOT EXISTS access_codes (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    code_type TEXT NOT NULL CHECK (code_type IN ('video', 'course', 'subject', 'teacher')),
    content_id BIGINT NOT NULL,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_by BIGINT, -- يمكن أن يكون admin_id في المستقبل
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الطلاب
CREATE TABLE IF NOT EXISTS students (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    birth_date DATE,
    grade_level TEXT,
    governorate TEXT,
    country TEXT DEFAULT 'مصر',
    profile_image_url TEXT,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول تسجيل الطلاب في الكورسات
CREATE TABLE IF NOT EXISTS student_course_enrollments (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date TIMESTAMP WITH TIME ZONE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped')),
    UNIQUE(student_id, course_id)
);

-- إنشاء جدول مشاهدات الفيديوهات
CREATE TABLE IF NOT EXISTS video_views (
    id BIGSERIAL PRIMARY KEY,
    video_id BIGINT REFERENCES videos(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    access_code_id BIGINT REFERENCES access_codes(id) ON DELETE SET NULL,
    view_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    watch_duration_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_teachers_subject ON teachers(subject);
CREATE INDEX IF NOT EXISTS idx_courses_subject_id ON courses(subject_id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_videos_course_id ON videos(course_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_content_id ON access_codes(content_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course ON student_course_enrollments(student_id, course_id);

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
('أحمد محمد', 'ahmed.mohamed@example.com', '01012345678', 'الرياضيات', 'مدرس رياضيات محترف مع خبرة 15 سنة في تدريس الثانوية العامة', 15, 'ماجستير رياضيات تطبيقية', ARRAY['جبر', 'هندسة', 'تفاضل وتكامل']),
('فاطمة علي', 'fatima.ali@example.com', '01087654321', 'الفيزياء', 'مدرسة فيزياء متخصصة في الفيزياء الحديثة', 12, 'دكتوراه فيزياء', ARRAY['ميكانيكا', 'كهرباء', 'ضوء']),
('محمد حسن', 'mohamed.hassan@example.com', '01011223344', 'الكيمياء', 'مدرس كيمياء مع خبرة في الكيمياء العضوية', 10, 'ماجستير كيمياء', ARRAY['كيمياء عامة', 'كيمياء عضوية', 'كيمياء تحليلية']);

-- إدخال بيانات تجريبية للتخصصات
INSERT INTO subjects (name, description, category, difficulty_level, estimated_hours) VALUES
('الرياضيات', 'دراسة شاملة للرياضيات من الأساسيات إلى المتقدم', 'علوم أساسية', 'intermediate', 120),
('الفيزياء', 'فهم قوانين الطبيعة والكون', 'علوم أساسية', 'intermediate', 100),
('الكيمياء', 'دراسة المادة وتفاعلاتها', 'علوم أساسية', 'intermediate', 90),
('الأحياء', 'دراسة الكائنات الحية', 'علوم أساسية', 'intermediate', 80);

-- إدخال بيانات تجريبية للكورسات
INSERT INTO courses (title, description, subject_id, teacher_id, price, duration_hours, total_lessons) VALUES
('كورس الرياضيات المتقدمة', 'كورس شامل في الرياضيات للثانوية العامة', 1, 1, 299.00, 40, 25),
('كورس الفيزياء الأساسية', 'أساسيات الفيزياء للمبتدئين', 2, 2, 199.00, 30, 20),
('كورس الكيمياء العضوية', 'مقدمة في الكيمياء العضوية', 3, 3, 249.00, 35, 22);

-- إدخال بيانات تجريبية لأكواد الوصول
INSERT INTO access_codes (code, code_type, content_id, max_uses, expires_at) VALUES
('MATH101', 'course', 1, 50, '2025-12-31 23:59:59+00'),
('PHYS101', 'course', 2, 30, '2025-12-31 23:59:59+00'),
('CHEM101', 'course', 3, 25, '2025-12-31 23:59:59+00');

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
-- السماح للجميع بقراءة المدرسين والتخصصات والكورسات
CREATE POLICY "Allow public read access to teachers" ON teachers FOR SELECT USING (true);
CREATE POLICY "Allow public read access to subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Allow public read access to courses" ON courses FOR SELECT USING (true);

-- السماح للمدرسين بتعديل بياناتهم
CREATE POLICY "Allow teachers to update their own data" ON teachers FOR UPDATE USING (id = auth.uid());

-- السماح للمدرسين بإضافة كورسات
CREATE POLICY "Allow teachers to insert courses" ON courses FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- السماح للمدرسين بتعديل كورساتهم
CREATE POLICY "Allow teachers to update their courses" ON courses FOR UPDATE USING (teacher_id = auth.uid());

-- السماح للطلاب بتسجيل الدخول في الكورسات
CREATE POLICY "Allow students to enroll in courses" ON student_course_enrollments FOR INSERT WITH CHECK (student_id = auth.uid());

-- السماح للطلاب بمشاهدة الفيديوهات
CREATE POLICY "Allow students to view videos" ON video_views FOR INSERT WITH CHECK (student_id = auth.uid());

COMMENT ON TABLE teachers IS 'جدول المدرسين وأساتذة الكورسات';
COMMENT ON TABLE subjects IS 'جدول التخصصات والمواد الدراسية';
COMMENT ON TABLE courses IS 'جدول الكورسات التعليمية';
COMMENT ON TABLE videos IS 'جدول الفيديوهات التعليمية';
COMMENT ON TABLE access_codes IS 'جدول أكواد الوصول للمحتوى';
COMMENT ON TABLE students IS 'جدول الطلاب المسجلين';
COMMENT ON TABLE student_course_enrollments IS 'جدول تسجيل الطلاب في الكورسات';
COMMENT ON TABLE video_views IS 'جدول مشاهدات الفيديوهات';
