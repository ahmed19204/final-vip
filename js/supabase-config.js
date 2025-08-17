// supabase-config.js
const SUPABASE_URL = 'https://hlzmijhlijnzrzzoeopf.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_HX2dsVz99s38yrTMZrbvJQ_-eEWdb4E'

// إنشاء عميل Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// تصدير للاستخدام في الملفات الأخرى
window.supabaseClient = supabaseClient

console.log('✅ Supabase client initialized successfully!')
console.log('🔗 URL:', SUPABASE_URL)
console.log('🔑 Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...')

// دالة اختبار الاتصال
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabaseClient
            .from('teachers')
            .select('count', { count: 'exact', head: true })
        
        if (error) {
            console.error('❌ Supabase connection error:', error)
            return false
        } else {
            console.log('✅ Supabase connection successful!')
            return true
        }
    } catch (error) {
        console.error('❌ Supabase connection failed:', error)
        return false
    }
}

// دالة إضافة مدرس جديد
async function addTeacher(teacherData) {
    try {
        const { data, error } = await supabaseClient
            .from('teachers')
            .insert([teacherData])
            .select()
        
        if (error) {
            console.error('❌ Error adding teacher:', error)
            return { success: false, error: error.message }
        } else {
            console.log('✅ Teacher added successfully:', data)
            return { success: true, data: data[0] }
        }
    } catch (error) {
        console.error('❌ Exception adding teacher:', error)
        return { success: false, error: error.message }
    }
}

// دالة جلب جميع المدرسين
async function getAllTeachers() {
    try {
        const { data, error } = await supabaseClient
            .from('teachers')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (error) {
            console.error('❌ Error fetching teachers:', error)
            return { success: false, error: error.message }
        } else {
            console.log('✅ Teachers fetched successfully:', data)
            return { success: true, data: data }
        }
    } catch (error) {
        console.error('❌ Exception fetching teachers:', error)
        return { success: false, error: error.message }
    }
}

// دالة إضافة كورس جديد
async function addCourse(courseData) {
    try {
        const { data, error } = await supabaseClient
            .from('courses')
            .insert([courseData])
            .select()
        
        if (error) {
            console.error('❌ Error adding course:', error)
            return { success: false, error: error.message }
        } else {
            console.log('✅ Course added successfully:', data)
            return { success: true, data: data[0] }
        }
    } catch (error) {
        console.error('❌ Exception adding course:', error)
        return { success: false, error: error.message }
    }
}

// دالة جلب جميع الكورسات
async function getAllCourses() {
    try {
        const { data, error } = await supabaseClient
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (error) {
            console.error('❌ Error fetching courses:', error)
            return { success: false, error: error.message }
        } else {
            console.log('✅ Courses fetched successfully:', data)
            return { success: true, data: data }
        }
    } catch (error) {
        console.error('❌ Exception fetching courses:', error)
        return { success: false, error: error.message }
    }
}

// اختبار الاتصال عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    testSupabaseConnection()
})

// تصدير الدوال للاستخدام الخارجي
window.testSupabaseConnection = testSupabaseConnection
window.addTeacher = addTeacher
window.getAllTeachers = getAllTeachers
window.addCourse = addCourse
window.getAllCourses = getAllCourses
