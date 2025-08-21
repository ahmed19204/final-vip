// Supabase Configuration
const SUPABASE_URL = 'https://jiwxilwzqmnwtusysdok.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3hpbHd6cW1ud3R1c3lzZG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0Njk3NTUsImV4cCI6MjA3MTA0NTc1NX0.lvOW9haq2OsSu3tX38QQlfx5bavx-K_Qsv4zl_I6vdU';

// Create Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make it globally available
window.supabaseClient = supabaseClient;

// Test connection function
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabaseClient
            .from('teachers')
            .select('count')
            .limit(1);

        if (error) {
            console.log('Supabase connection test:', error.message);
            return false;
        }

        console.log('✅ Supabase connection successful!');
        return true;
    } catch (err) {
        console.error('❌ Supabase connection failed:', err);
        return false;
    }
}

// Google OAuth Functions
async function signInWithGoogle() {
    try {
        // تحديد البيئة (تطوير أم إنتاج)
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        const baseUrl = isProduction ? 'https://vip-center-1.vercel.app' : window.location.origin;
        
        console.log('🌐 OAuth Environment:', isProduction ? 'Production' : 'Development');
        console.log('🔗 Redirect URL:', `${baseUrl}/auth-callback.html`);
        
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${baseUrl}/auth-callback.html`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Google OAuth error:', error);
        return { success: false, error: error.message };
    }
}

async function handleOAuthCallback() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        
        if (error) throw error;
        if (!user) return { success: false, error: 'No user found' };

        // Check if user exists in our users table
        const { data: existingUser, error: fetchError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

        let userData;

        if (fetchError && fetchError.code === 'PGRST116') {
            // User doesn't exist, create new user
            const newUser = {
                email: user.email,
                name: user.user_metadata.full_name || user.user_metadata.name || 'مستخدم جديد',
                avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture,
                provider: 'google',
                provider_id: user.id,
                last_login: new Date().toISOString()
            };

            const { data: createdUser, error: createError } = await supabaseClient
                .from('users')
                .insert([newUser])
                .select()
                .single();

            if (createError) throw createError;
            userData = createdUser;
        } else if (existingUser) {
            // User exists, update last login
            const { data: updatedUser, error: updateError } = await supabaseClient
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', existingUser.id)
                .select()
                .single();

            if (updateError) throw updateError;
            userData = updatedUser;
        } else {
            throw fetchError;
        }

        return { success: true, user: userData, supabaseUser: user };
    } catch (error) {
        console.error('OAuth callback error:', error);
        return { success: false, error: error.message };
    }
}

async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        
        if (error) throw error;
        if (!user) return { success: false, error: 'Not authenticated' };

        // Get user data from our users table
        const { data: userData, error: fetchError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

        if (fetchError) throw fetchError;

        return { success: true, user: userData, supabaseUser: user };
    } catch (error) {
        console.error('Get current user error:', error);
        return { success: false, error: error.message };
    }
}

async function signOut() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
    }
}

// Database interaction functions
async function addTeacher(teacherData) {
    try {
        const { data, error } = await supabaseClient
            .from('teachers')
            .insert([teacherData])
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error adding teacher:', error);
        return { success: false, error: error.message };
    }
}

async function getAllTeachers() {
    try {
        const { data, error } = await supabaseClient
            .from('teachers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching teachers:', error);
        return { success: false, error: error.message };
    }
}

async function updateTeacher(id, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('teachers')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating teacher:', error);
        return { success: false, error: error.message };
    }
}

async function deleteTeacher(id) {
    try {
        const { error } = await supabaseClient
            .from('teachers')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting teacher:', error);
        return { success: false, error: error.message };
    }
}

async function addCourse(courseData) {
    try {
        // Clean and validate data - Keep UUIDs as strings
        const cleanData = {
            ...courseData,
            // Keep IDs as strings for UUID compatibility, set null if empty
            subject_id: courseData.subject_id && courseData.subject_id.trim() !== '' ? courseData.subject_id : null,
            teacher_id: courseData.teacher_id && courseData.teacher_id.trim() !== '' ? courseData.teacher_id : null,
            // Ensure numeric fields are properly typed
            price: parseFloat(courseData.price) || 0,
            duration_hours: parseInt(courseData.duration_hours) || 0
        };

        const { data, error } = await supabaseClient
            .from('courses')
            .insert([cleanData])
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error adding course:', error);
        return { success: false, error: error.message };
    }
}

async function getAllCourses() {
    try {
        const { data, error } = await supabaseClient
            .from('courses')
            .select('*, subjects(name), teachers(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching courses:', error);
        return { success: false, error: error.message };
    }
}

async function addSubject(subjectData) {
    try {
        const { data, error } = await supabaseClient
            .from('subjects')
            .insert([subjectData])
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error adding subject:', error);
        return { success: false, error: error.message };
    }
}

async function getAllSubjects() {
    try {
        const { data, error } = await supabaseClient
            .from('subjects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching subjects:', error);
        return { success: false, error: error.message };
    }
}

async function addStudent(studentData) {
    try {
        const { data, error } = await supabaseClient
            .from('students')
            .insert([studentData])
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error adding student:', error);
        return { success: false, error: error.message };
    }
}

async function getAllStudents() {
    try {
        const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching students:', error);
        return { success: false, error: error.message };
    }
}

async function addVideo(videoData) {
    try {
        // Clean and validate data - Keep UUIDs as strings
        const cleanData = {
            ...videoData,
            // Keep IDs as strings for UUID compatibility, set null if empty
            course_id: videoData.course_id && videoData.course_id.trim() !== '' ? videoData.course_id : null,
            teacher_id: videoData.teacher_id && videoData.teacher_id.trim() !== '' ? videoData.teacher_id : null,
            // Ensure numeric fields are properly typed
            duration_minutes: parseInt(videoData.duration_minutes) || 0,
            order_in_course: parseInt(videoData.order_in_course) || 0
        };

        const { data, error } = await supabaseClient
            .from('videos')
            .insert([cleanData])
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error adding video:', error);
        return { success: false, error: error.message };
    }
}

async function getAllVideos() {
    try {
        const { data, error } = await supabaseClient
            .from('videos')
            .select('*, courses(title), subjects(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching videos:', error);
        return { success: false, error: error.message };
    }
}

async function updateVideo(id, videoData) {
    try {
        // Validate UUID format
        if (!id || typeof id !== 'string' || id.trim() === '') {
            throw new Error('Invalid video ID');
        }

        // Clean and validate data - Keep UUIDs as strings
        const cleanData = {
            ...videoData,
            // Keep IDs as strings for UUID compatibility, set null if empty
            course_id: videoData.course_id && videoData.course_id.trim() !== '' ? videoData.course_id : null,
            teacher_id: videoData.teacher_id && videoData.teacher_id.trim() !== '' ? videoData.teacher_id : null,
            // Ensure numeric fields are properly typed
            duration_minutes: parseInt(videoData.duration_minutes) || 0,
            order_in_course: parseInt(videoData.order_in_course) || 0
        };

        const { data, error } = await supabaseClient
            .from('videos')
            .update(cleanData)
            .eq('id', id)
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating video:', error);
        return { success: false, error: error.message };
    }
}

async function deleteVideo(id) {
    try {
        // Validate UUID format
        if (!id || typeof id !== 'string' || id.trim() === '') {
            throw new Error('Invalid video ID');
        }

        const { error } = await supabaseClient
            .from('videos')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting video:', error);
        return { success: false, error: error.message };
    }
}

async function updateCourse(id, courseData) {
    try {
        // Validate UUID format
        if (!id || typeof id !== 'string' || id.trim() === '') {
            throw new Error('Invalid course ID');
        }

        // Clean and validate data - Keep UUIDs as strings
        const cleanData = {
            ...courseData,
            // Keep IDs as strings for UUID compatibility, set null if empty
            subject_id: courseData.subject_id && courseData.subject_id.trim() !== '' ? courseData.subject_id : null,
            teacher_id: courseData.teacher_id && courseData.teacher_id.trim() !== '' ? courseData.teacher_id : null,
            // Ensure numeric fields are properly typed
            price: parseFloat(courseData.price) || 0,
            duration_hours: parseInt(courseData.duration_hours) || 0
        };

        const { data, error } = await supabaseClient
            .from('courses')
            .update(cleanData)
            .eq('id', id)
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating course:', error);
        return { success: false, error: error.message };
    }
}

async function deleteCourse(id) {
    try {
        // Validate UUID format
        if (!id || typeof id !== 'string' || id.trim() === '') {
            throw new Error('Invalid course ID');
        }

        const { error } = await supabaseClient
            .from('courses')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting course:', error);
        return { success: false, error: error.message };
    }
}

async function addAccessCode(codeData) {
    try {
        const { data, error } = await supabaseClient
            .from('access_codes')
            .insert([codeData])
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error adding access code:', error);
        return { success: false, error: error.message };
    }
}

async function getAllAccessCodes() {
    try {
        const { data, error } = await supabaseClient
            .from('access_codes')
            .select('*, courses(title)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching access codes:', error);
        return { success: false, error: error.message };
    }
}

async function validateAccessCode(code) {
    try {
        const { data, error } = await supabaseClient
            .from('access_codes')
            .select('*, courses(*)')
            .eq('code', code)
            .eq('status', 'active')
            .single();

        if (error) throw error;

        // Check if code is expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            return { success: false, error: 'كود الوصول منتهي الصلاحية' };
        }

        // Check if code usage limit reached
        if (data.max_uses && data.current_uses >= data.max_uses) {
            return { success: false, error: 'تم استنفاذ عدد مرات استخدام الكود' };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error validating access code:', error);
        return { success: false, error: 'كود الوصول غير صحيح' };
    }
}

async function updateCodeUsage(codeId) {
    try {
        // First get current usage
        const { data: currentCode, error: fetchError } = await supabaseClient
            .from('access_codes')
            .select('current_uses')
            .eq('id', codeId)
            .single();

        if (fetchError) throw fetchError;

        // Update with incremented value
        const { error: updateError } = await supabaseClient
            .from('access_codes')
            .update({ current_uses: (currentCode.current_uses || 0) + 1 })
            .eq('id', codeId);

        if (updateError) throw updateError;

        return { success: true };
    } catch (error) {
        console.error('Error updating code usage:', error);
        return { success: false, error: error.message };
    }
}

// Export functions for use in other files
window.supabaseFunctions = {
    testSupabaseConnection,
    // Google OAuth functions
    signInWithGoogle,
    handleOAuthCallback,
    getCurrentUser,
    signOut,
    // Database functions
    addTeacher,
    getAllTeachers,
    updateTeacher,
    deleteTeacher,
    addCourse,
    getAllCourses,
    updateCourse,
    deleteCourse,
    addSubject,
    getAllSubjects,
    addStudent,
    getAllStudents,
    addVideo,
    getAllVideos,
    updateVideo,
    deleteVideo,
    addAccessCode,
    getAllAccessCodes,
    validateAccessCode,
    updateCodeUsage
};

// Test connection on load
document.addEventListener('DOMContentLoaded', function() {
    testSupabaseConnection();
});
