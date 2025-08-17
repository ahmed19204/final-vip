# 🗄️ دليل ربط قاعدة البيانات Supabase

## 📋 المتطلبات الأساسية

### 1. حساب Supabase
- [إنشاء حساب على Supabase](https://supabase.com)
- [إنشاء مشروع جديد](https://app.supabase.com/projects)

### 2. معلومات المشروع
- **Project URL:** `https://hlzmijhlijnzrzzoeopf.supabase.co`
- **Anon Public Key:** `sb_publishable_HX2dsVz99s38yrTMZrbvJQ_-eEWdb4E`

## 🚀 خطوات ربط قاعدة البيانات

### الخطوة 1: إنشاء المشروع
1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اضغط "New Project"
3. اختر "Start from scratch"
4. أدخل اسم المشروع: `vip-center-db`
5. أدخل كلمة مرور قوية
6. اختر المنطقة الأقرب لك
7. اضغط "Create new project"

### الخطوة 2: نسخ معلومات الاتصال
1. اذهب إلى Project Settings > API
2. انسخ:
   - **Project URL** (مثل: `https://xxxxx.supabase.co`)
   - **anon public** key

### الخطوة 3: تحديث ملف `supabase-config.js`
```javascript
const SUPABASE_URL = 'YOUR_PROJECT_URL_HERE'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'
```

### الخطوة 4: إنشاء جداول قاعدة البيانات
1. اذهب إلى SQL Editor في Supabase
2. انسخ محتوى ملف `database-schema.sql`
3. اضغط "Run" لتنفيذ الكود

## 🗂️ هيكل قاعدة البيانات

### الجداول الرئيسية:
- **`teachers`** - المدرسين وأساتذة الكورسات
- **`subjects`** - التخصصات والمواد الدراسية
- **`courses`** - الكورسات التعليمية
- **`videos`** - الفيديوهات التعليمية
- **`access_codes`** - أكواد الوصول للمحتوى
- **`students`** - الطلاب المسجلين
- **`student_course_enrollments`** - تسجيل الطلاب في الكورسات
- **`video_views`** - مشاهدات الفيديوهات

### العلاقات:
- كل كورس ينتمي لتخصص معين
- كل كورس له مدرس واحد
- كل فيديو ينتمي لكورس معين
- كل كود وصول مرتبط بمحتوى معين

## 🔧 إعدادات الأمان

### 1. Row Level Security (RLS)
- تم تمكين RLS على جميع الجداول
- سياسات أمان محددة مسبقاً
- السماح للجميع بقراءة المحتوى العام
- تقييد الكتابة للمستخدمين المصرح لهم

### 2. سياسات الوصول:
```sql
-- السماح للجميع بقراءة المدرسين والتخصصات والكورسات
CREATE POLICY "Allow public read access" ON teachers FOR SELECT USING (true);

-- السماح للمدرسين بتعديل بياناتهم
CREATE POLICY "Allow teachers to update own data" ON teachers FOR UPDATE USING (id = auth.uid());
```

## 📊 إدخال البيانات التجريبية

### 1. بيانات المدرسين:
- أحمد محمد - مدرس رياضيات
- فاطمة علي - مدرسة فيزياء
- محمد حسن - مدرس كيمياء

### 2. بيانات التخصصات:
- الرياضيات (120 ساعة)
- الفيزياء (100 ساعة)
- الكيمياء (90 ساعة)
- الأحياء (80 ساعة)

### 3. بيانات الكورسات:
- كورس الرياضيات المتقدمة (299 جنيه)
- كورس الفيزياء الأساسية (199 جنيه)
- كورس الكيمياء العضوية (249 جنيه)

### 4. أكواد الوصول:
- `MATH101` - للرياضيات
- `PHYS101` - للفيزياء
- `CHEM101` - للكيمياء

## 🧪 اختبار الاتصال

### 1. فتح Console المتصفح:
- اضغط F12
- اذهب إلى Console
- تأكد من ظهور رسالة: "✅ Supabase client initialized successfully!"

### 2. اختبار الاتصال:
```javascript
// في console المتصفح
testSupabaseConnection()
```

### 3. اختبار جلب البيانات:
```javascript
// جلب جميع المدرسين
getAllTeachers().then(result => console.log(result))

// جلب جميع الكورسات
getAllCourses().then(result => console.log(result))
```

## 🔄 تحديث البيانات

### 1. إضافة مدرس جديد:
```javascript
const teacherData = {
    name: 'أحمد حسين',
    email: 'ahmed.hussein@example.com',
    phone: '01000000000',
    subject: 'الرياضيات',
    bio: 'مدرس رياضيات محترف',
    experience_years: 10
}

addTeacher(teacherData).then(result => {
    if (result.success) {
        console.log('تم إضافة المدرس بنجاح:', result.data)
    } else {
        console.error('خطأ في إضافة المدرس:', result.error)
    }
})
```

### 2. إضافة كورس جديد:
```javascript
const courseData = {
    title: 'كورس الجبر المتقدم',
    description: 'كورس شامل في الجبر',
    subject_id: 1,
    teacher_id: 1,
    price: 199.00,
    duration_hours: 25
}

addCourse(courseData).then(result => {
    if (result.success) {
        console.log('تم إضافة الكورس بنجاح:', result.data)
    } else {
        console.error('خطأ في إضافة الكورس:', result.error)
    }
})
```

## 🚨 حل المشاكل الشائعة

### مشكلة: خطأ في الاتصال
```javascript
// تأكد من صحة URL و API Key
console.log('URL:', SUPABASE_URL)
console.log('Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...')
```

### مشكلة: خطأ في CORS
- تأكد من إضافة `https://vip-center-1.vercel.app` في إعدادات CORS
- اذهب إلى Authentication > URL Configuration

### مشكلة: خطأ في RLS
- تأكد من تمكين RLS على الجداول
- تأكد من إنشاء السياسات الصحيحة

## 📱 استخدام قاعدة البيانات في لوحة التحكم

### 1. في صفحة إدارة المدرسين:
```javascript
// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    const result = await getAllTeachers()
    if (result.success) {
        displayTeachers(result.data)
    }
})
```

### 2. في صفحة إدارة الكورسات:
```javascript
// عند إضافة كورس جديد
async function saveCourse() {
    const courseData = collectFormData()
    const result = await addCourse(courseData)
    if (result.success) {
        showNotification('تم حفظ الكورس بنجاح!', 'success')
        refreshCoursesTable()
    } else {
        showNotification('خطأ في حفظ الكورس: ' + result.error, 'error')
    }
}
```

## 🔐 إعدادات متقدمة

### 1. إعداد Authentication:
- اذهب إلى Authentication > Settings
- أضف نطاقك: `https://vip-center-1.vercel.app`
- أضف redirect URLs

### 2. إعداد Storage:
- اذهب إلى Storage > Policies
- أنشئ bucket للصور والفيديوهات
- أضف سياسات الوصول المناسبة

### 3. إعداد Edge Functions:
- اذهب إلى Edge Functions
- أنشئ functions للعمليات المعقدة
- استخدم للعمليات التي تحتاج أمان عالي

## 📊 مراقبة الأداء

### 1. Supabase Dashboard:
- مراقبة استخدام قاعدة البيانات
- تحليل الاستعلامات البطيئة
- مراقبة استخدام التخزين

### 2. Logs:
- اذهب إلى Logs > API
- راجع طلبات API
- اكتشف الأخطاء والمشاكل

---

## 🎯 ملخص سريع

1. **أنشئ مشروع Supabase جديد**
2. **انسخ معلومات الاتصال**
3. **حدث `supabase-config.js`**
4. **نفذ `database-schema.sql`**
5. **اختبر الاتصال**
6. **ابدأ باستخدام قاعدة البيانات**

## 📞 الدعم

- **Supabase Documentation:** [supabase.com/docs](https://supabase.com/docs)
- **Supabase Community:** [github.com/supabase/supabase](https://github.com/supabase/supabase)
- **Discord Community:** [discord.gg/supabase](https://discord.gg/supabase)

---

**🎉 تهانينا! قاعدة البيانات جاهزة للاستخدام**
