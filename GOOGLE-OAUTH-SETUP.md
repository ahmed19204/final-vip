# دليل إعداد Google OAuth في Supabase

## 📋 المتطلبات
- حساب Google Cloud Console
- مشروع Supabase
- الموقع مرفوع على Vercel أو أي خدمة hosting

## 🔧 الخطوة 1: إعداد Google Cloud Console

### 1.1 إنشاء مشروع جديد
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. انقر على "Select a project" ثم "New Project"
3. أدخل اسم المشروع: `VIP-Center-Auth`
4. انقر "Create"

### 1.2 تفعيل Google+ API
1. في القائمة الجانبية، اذهب إلى "APIs & Services" > "Library"
2. ابحث عن "Google+ API"
3. انقر عليها ثم "Enable"

### 1.3 إنشاء OAuth 2.0 Credentials
1. اذهب إلى "APIs & Services" > "Credentials"
2. انقر "Create Credentials" > "OAuth 2.0 Client IDs"
3. إذا لم تكن قد أنشأت OAuth consent screen، ستحتاج لإنشائها أولاً:

#### إعداد OAuth Consent Screen:
- **User Type**: External
- **App name**: VIP Center
- **User support email**: بريدك الإلكتروني
- **App domain**: نطاق موقعك
- **Authorized domains**: 
  - `yourdomain.com` (نطاقك)
  - `vercel.app` (إذا كنت تستخدم Vercel)
- **Developer contact information**: بريدك الإلكتروني

4. بعد إعداد Consent Screen، ارجع إلى Credentials
5. انقر "Create Credentials" > "OAuth 2.0 Client IDs"
6. اختر "Web application"
7. أدخل المعلومات:

#### للتطوير المحلي (localhost):
```
Name: VIP Center - Local Development
Authorized JavaScript origins:
- http://localhost:3000
- http://localhost:8000
- http://127.0.0.1:3000
- http://127.0.0.1:8000

Authorized redirect URIs:
- http://localhost:3000/auth/callback
- http://localhost:8000/auth/callback
- https://jiwxilwzqmnwtusysdok.supabase.co/auth/v1/callback
```

#### للإنتاج (Production):
```
Name: VIP Center - Production
Authorized JavaScript origins:
- https://yourdomain.com
- https://your-project.vercel.app

Authorized redirect URIs:
- https://yourdomain.com/auth/callback
- https://your-project.vercel.app/auth/callback
- https://jiwxilwzqmnwtusysdok.supabase.co/auth/v1/callback
```

8. انقر "Create"
9. احفظ `Client ID` و `Client Secret`

## 🔧 الخطوة 2: إعداد Supabase

### 2.1 تسجيل الدخول إلى Supabase Dashboard
1. اذهب إلى [Supabase Dashboard](https://app.supabase.com/)
2. اختر مشروعك

### 2.2 إعداد Google Provider
1. في القائمة الجانبية، اذهب إلى "Authentication" > "Providers"
2. ابحث عن "Google" وانقر عليه
3. فعل "Enable sign in with Google"
4. أدخل البيانات:
   - **Client ID**: من Google Cloud Console
   - **Client Secret**: من Google Cloud Console
5. انقر "Save"

### 2.3 إعداد Site URL
1. اذهب إلى "Settings" > "General"
2. في قسم "API Settings":
   - **Site URL**: `https://yourdomain.com` (أو رابط Vercel)
3. في "Redirect URLs" أضف:
   - `https://yourdomain.com/home.html`
   - `https://your-project.vercel.app/home.html`
   - `http://localhost:3000/home.html` (للتطوير)
   - `http://localhost:8000/home.html` (للتطوير)

## 🔧 الخطوة 3: إعداد قاعدة البيانات

### 3.1 تنفيذ SQL Script
1. اذهب إلى "SQL Editor" في Supabase Dashboard
2. انسخ والصق محتويات ملف `database-google-auth.sql`
3. انقر "Run"

### 3.2 تحقق من الجداول
```sql
-- تحقق من إنشاء جدول users
SELECT * FROM users LIMIT 5;

-- تحقق من تحديث جدول students
\d students
```

## 🧪 الخطوة 4: الاختبار المحلي

### 4.1 تشغيل الخادم المحلي
```bash
# استخدم أي من هذه الطرق:

# Python
python -m http.server 8000

# Node.js (إذا كان لديك live-server)
npx live-server --port=3000

# PHP
php -S localhost:8000
```

### 4.2 اختبار تسجيل الدخول
1. اذهب إلى `http://localhost:8000/login-simple.html`
2. انقر "تسجيل الدخول بـ Google"
3. تأكد من:
   - ظهور نافذة Google OAuth
   - إمكانية اختيار الحساب
   - التوجيه إلى `home.html` بعد النجاح
   - ظهور اسم المستخدم وصورته في Navigation

## 🚀 الخطوة 5: النشر على Vercel

### 5.1 رفع الكود
```bash
# إذا لم تكن قد ربطت GitHub بـ Vercel
git add .
git commit -m "Add Google OAuth integration"
git push origin main
```

### 5.2 إعداد Vercel
1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. انقر "Import Project"
3. اختر مستودع GitHub الخاص بك
4. انقر "Deploy"

### 5.3 تحديث Google Cloud Console للإنتاج
1. ارجع إلى Google Cloud Console
2. اذهب إلى Credentials
3. حدث OAuth 2.0 Client:
   - أضف رابط Vercel الجديد إلى Authorized origins
   - أضف redirect URIs الجديدة

### 5.4 تحديث Supabase للإنتاج
1. في Supabase Dashboard > Settings > General
2. حدث Site URL إلى رابط Vercel
3. أضف redirect URLs الجديدة

## 🔍 استكشاف الأخطاء

### مشاكل شائعة وحلولها:

#### 1. "redirect_uri_mismatch"
**السبب**: الـ redirect URI غير مطابق في Google Console
**الحل**: 
- تأكد من إضافة جميع الروابط الصحيحة
- تأكد من عدم وجود `/` في النهاية

#### 2. "OAuth consent screen verification required"
**السبب**: التطبيق يحتاج موافقة Google
**الحل**:
- في OAuth consent screen، أضف نفسك كـ Test User
- أو اطلب مراجعة التطبيق من Google

#### 3. "User not found in database"
**السبب**: جدول users غير موجود أو خطأ في الكود
**الحل**:
- تأكد من تنفيذ `database-google-auth.sql`
- تحقق من أن الكود يحفظ المستخدم الجديد

#### 4. "CORS errors"
**السبب**: إعدادات CORS في Supabase
**الحل**:
- في Supabase Dashboard > Settings > API
- تأكد من إضافة نطاقك في Additional domains

## 📊 مراقبة النظام

### 1. مراقبة المستخدمين
```sql
-- عرض جميع المستخدمين الجدد
SELECT * FROM users WHERE provider = 'google' ORDER BY created_at DESC;

-- إحصائيات تسجيل الدخول
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_users
FROM users 
WHERE provider = 'google'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 2. مراقبة الأخطاء
- تحقق من Console في المتصفح
- راجع Supabase Dashboard > Logs
- تحقق من Google Cloud Console > Logs

## 🔒 أمان إضافي

### 1. تقييد النطاقات
```javascript
// في Google Console، قيد النطاقات المسموحة
const allowedDomains = [
    'yourdomain.com',
    'your-project.vercel.app'
];
```

### 2. Session Management
```javascript
// إضافة انتهاء صلاحية للجلسة
const sessionDuration = 24 * 60 * 60 * 1000; // 24 ساعة
const expiryTime = new Date(Date.now() + sessionDuration);
localStorage.setItem('sessionExpiry', expiryTime.toISOString());
```

## ✅ قائمة التحقق النهائية

- [ ] تم إنشاء مشروع Google Cloud
- [ ] تم تفعيل Google+ API
- [ ] تم إنشاء OAuth 2.0 Credentials
- [ ] تم إعداد OAuth Consent Screen
- [ ] تم إعداد Google Provider في Supabase
- [ ] تم إعداد Site URL و Redirect URLs
- [ ] تم تنفيذ SQL Script لقاعدة البيانات
- [ ] تم اختبار النظام محلياً
- [ ] تم رفع الموقع على Vercel
- [ ] تم تحديث إعدادات الإنتاج
- [ ] تم اختبار النظام في الإنتاج

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من Console في المتصفح للأخطاء
2. راجع Supabase Logs
3. تأكد من صحة جميع الروابط والإعدادات
4. جرب في وضع Incognito للتأكد من عدم وجود cache issues

---

**ملاحظة مهمة**: احرص على عدم مشاركة Client Secret مع أي شخص، واحتفظ به في مكان آمن.
