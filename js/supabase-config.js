// Supabase Configuration
const SUPABASE_URL = 'https://hlzmijhlijnzrzzoeopf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsem1pamhsaWpuenJ6em9lb3BmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQyNTgsImV4cCI6MjA3MDUzMDI1OH0.hRfEZeQE_yuvIZWhh3wYvXyDt6w9HHh4I67EJU4xg-g';

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

// Database interaction functions
async function addTeacher(teacherData) {
    try {
        const { data, error } = await supabaseClient
            .from('teachers')
            .insert([teacherData])
            .select();
        
        if (error) throw error;
        return { success: true, data };
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

async function addCourse(courseData) {
    try {
        const { data, error } = await supabaseClient
            .from('courses')
            .insert([courseData])
            .select();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error adding course:', error);
        return { success: false, error: error.message };
    }
}

async function getAllCourses() {
    try {
        const { data, error } = await supabaseClient
            .from('courses')
            .select('*')
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
        return { success: true, data };
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
        return { success: true, data };
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
        const { data, error } = await supabaseClient
            .from('videos')
            .insert([videoData])
            .select();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error adding video:', error);
        return { success: false, error: error.message };
    }
}

async function getAllVideos() {
    try {
        const { data, error } = await supabaseClient
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching videos:', error);
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
        return { success: true, data };
    } catch (error) {
        console.error('Error adding access code:', error);
        return { success: false, error: error.message };
    }
}

async function getAllAccessCodes() {
    try {
        const { data, error } = await supabaseClient
            .from('access_codes')
            .select('*')
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
            .eq('is_active', true)
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error validating access code:', error);
        return { success: false, error: error.message };
    }
}

// Export functions for use in other files
window.supabaseFunctions = {
    testSupabaseConnection,
    addTeacher,
    getAllTeachers,
    addCourse,
    getAllCourses,
    addSubject,
    getAllSubjects,
    addStudent,
    getAllStudents,
    addVideo,
    getAllVideos,
    addAccessCode,
    getAllAccessCodes,
    validateAccessCode
};

// Test connection on load
document.addEventListener('DOMContentLoaded', function() {
    testSupabaseConnection();
});
