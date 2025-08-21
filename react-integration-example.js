// مثال على دمج Google OAuth مع React/Next.js
// هذا الملف للمرجع فقط - ليس جزء من المشروع الحالي

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

// إعداد Supabase Client
const supabaseUrl = 'https://jiwxilwzqmnwtusysdok.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3hpbHd6cW1ud3R1c3lzZG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0Njk3NTUsImV4cCI6MjA3MTA0NTc1NX0.lvOW9haq2OsSu3tX38QQlfx5bavx-K_Qsv4zl_I6vdU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Hook للمصادقة
export function useAuth() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // الحصول على الجلسة الحالية
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // الاستماع لتغييرات المصادقة
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null)
                
                if (event === 'SIGNED_IN' && session?.user) {
                    await handleUserSignIn(session.user)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    return { user, loading }
}

// معالجة تسجيل دخول المستخدم
async function handleUserSignIn(user) {
    try {
        // التحقق من وجود المستخدم في جدول users
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single()

        if (fetchError && fetchError.code === 'PGRST116') {
            // إنشاء مستخدم جديد
            const newUser = {
                email: user.email,
                name: user.user_metadata.full_name || user.user_metadata.name || 'مستخدم جديد',
                avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture,
                provider: 'google',
                provider_id: user.id,
                last_login: new Date().toISOString()
            }

            const { error: createError } = await supabase
                .from('users')
                .insert([newUser])

            if (createError) {
                console.error('Error creating user:', createError)
            }
        } else if (existingUser) {
            // تحديث آخر تسجيل دخول
            const { error: updateError } = await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', existingUser.id)

            if (updateError) {
                console.error('Error updating user:', updateError)
            }
        }
    } catch (error) {
        console.error('Error handling user sign in:', error)
    }
}

// مكون تسجيل الدخول
export function LoginComponent() {
    const { user, loading } = useAuth()

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            })

            if (error) {
                console.error('Error logging in:', error)
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                console.error('Error logging out:', error)
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    if (loading) {
        return <div>جاري التحميل...</div>
    }

    if (user) {
        return (
            <div>
                <p>مرحباً، {user.user_metadata.full_name}</p>
                <img 
                    src={user.user_metadata.avatar_url} 
                    alt="صورة المستخدم" 
                    width={50} 
                    height={50} 
                />
                <button onClick={handleLogout}>تسجيل الخروج</button>
            </div>
        )
    }

    return (
        <div>
            <h2>تسجيل الدخول</h2>
            <button onClick={handleGoogleLogin}>
                تسجيل الدخول بـ Google
            </button>
        </div>
    )
}

// مكون الحماية للصفحات
export function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return <div>جاري التحميل...</div>
    }

    if (!user) {
        return <LoginComponent />
    }

    return children
}

// Hook للحصول على بيانات المستخدم من قاعدة البيانات
export function useUserData() {
    const { user } = useAuth()
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchUserData()
        } else {
            setUserData(null)
            setLoading(false)
        }
    }, [user])

    const fetchUserData = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', user.email)
                .single()

            if (error) {
                console.error('Error fetching user data:', error)
            } else {
                setUserData(data)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    return { userData, loading, refetch: fetchUserData }
}

// استخدام في Next.js
// في _app.js أو layout.js
export function AuthProvider({ children }) {
    return (
        <div>
            {children}
        </div>
    )
}

// مثال على صفحة محمية
export function DashboardPage() {
    const { userData, loading } = useUserData()

    if (loading) {
        return <div>جاري تحميل بيانات المستخدم...</div>
    }

    return (
        <ProtectedRoute>
            <div>
                <h1>لوحة التحكم</h1>
                <p>مرحباً، {userData?.name}</p>
                <img src={userData?.avatar_url} alt="صورة المستخدم" />
                <p>البريد الإلكتروني: {userData?.email}</p>
                <p>آخر تسجيل دخول: {userData?.last_login}</p>
            </div>
        </ProtectedRoute>
    )
}

// تصدير الدوال المفيدة
export const authUtils = {
    signInWithGoogle: async () => {
        return await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        })
    },
    
    signOut: async () => {
        return await supabase.auth.signOut()
    },
    
    getCurrentUser: async () => {
        const { data: { user } } = await supabase.auth.getUser()
        return user
    },
    
    isAuthenticated: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        return !!session
    }
}
