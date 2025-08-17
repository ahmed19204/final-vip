// supabase-config.js
const SUPABASE_URL = 'https://hlzmijhlijnzrzzoeopf.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_HX2dsVz99s38yrTMZrbvJQ_-eEWdb4E'

// إنشاء عميل Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// تصدير للاستخدام في الملفات الأخرى
window.supabaseClient = supabase

console.log('✅ Supabase client initialized successfully!')
console.log('🔗 URL:', SUPABASE_URL)
console.log('🔑 Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...')

// دالة اختبار الاتصال
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase
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

// اختبار الاتصال عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    testSupabaseConnection()
})

// تصدير الدالة للاستخدام الخارجي
window.testSupabaseConnection = testSupabaseConnection
