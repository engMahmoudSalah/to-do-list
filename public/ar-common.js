// Arabic strings shared by the kit views (auth, plans, admin, errors) used by Orbit and Stash.
export const C = {
  "Main": "القائمة", "Plans": "الخطط", "Account": "حسابي", "Admin": "الإدارة", "Toggle dark mode": "تبديل الوضع", "Close": "إغلاق", "Escape": "إغلاق",
  "No connection. Check your internet and try again.": "لا يوجد اتصال. تحقق من الإنترنت وحاول مرة أخرى.", "Couldn't load this page": "تعذّر تحميل الصفحة",
  "Signed-in devices": "الأجهزة المسجّل دخولها", "Unknown device": "جهاز غير معروف", "this device": "هذا الجهاز", "Signed out of other devices": "تم تسجيل الخروج من الأجهزة الأخرى", "Sign out other devices": "تسجيل الخروج من الأجهزة الأخرى", "Search the log": "ابحث في السجل", "All actions": "كل الإجراءات", "Export CSV": "تصدير CSV", "just now": "الآن", "Your name": "اسمك", "Name": "الاسم", "Email": "البريد الإلكتروني", "Password": "كلمة المرور", "Current password": "كلمة المرور الحالية", "New password": "كلمة المرور الجديدة",
  "Log in": "تسجيل الدخول", "Create account": "إنشاء حساب", "Create an account": "إنشاء حساب", "Welcome back": "أهلاً بعودتك", "Create your account": "أنشئ حسابك",
  "New here? ": "جديد هنا؟ ", "Already have an account? ": "لديك حساب؟ ", "Enter your email.": "أدخل بريدك الإلكتروني.", "Enter your password.": "أدخل كلمة المرور.", "Log in or create a free account.": "سجّل الدخول أو أنشئ حساباً مجانياً.",
  "Your plan": "خطتك", "Payments are not active yet": "الدفع غير مفعّل بعد", "Coming soon": "قريباً", "Paid plans are not available yet. Everything on Free works today.": "الخطط المدفوعة غير متاحة بعد. كل ما في الخطة المجانية يعمل الآن.",
  "Free": "مجانية", "Pro": "احترافية", "$0": "٠$", "Profile": "الملف الشخصي", "Password changed": "تم تغيير كلمة المرور", "Change password": "تغيير كلمة المرور", "Log out": "تسجيل الخروج",
  "You are not an admin. If you own this site, enter the admin key to claim access.": "لست مشرفاً. إذا كنت مالك الموقع فأدخل مفتاح الإدارة للحصول على الصلاحية.",
  "Admin dashboard": "لوحة الإدارة", "Users": "المستخدمون", "Suspended": "موقوف", "suspended": "موقوف", "active": "نشط", "Updated": "تم التحديث", "User": "المستخدم", "Role": "الدور", "Plan": "الخطة", "Status": "الحالة", "Joined": "الانضمام",
  "Audit log": "سجل التدقيق", "When": "الوقت", "Who": "الفاعل", "Action": "الإجراء", "Detail": "التفاصيل", "Admin key": "مفتاح الإدارة", "Admin access granted": "تم منح صلاحية الإدارة", "Claim": "تفعيل",
  "free": "مجانية", "pro": "احترافية", "user": "مستخدم", "admin": "مشرف", "owner": "مالك", "member": "عضو", "viewer": "مشاهد",
  "Footer": "التذييل", "Portfolio": "المحفظة", "You are here": "أنت هنا", "Every project I have built, live and free to try.": "كل مشروع بنيته، يعمل الآن ومجاني للتجربة.",
  "Admins only.": "للمشرفين فقط.", "Cross-site request blocked.": "تم حظر الطلب من موقع آخر.", "Current password is wrong.": "كلمة المرور الحالية غير صحيحة.", "Enter a valid email address.": "أدخل بريداً إلكترونياً صحيحاً.",
  "Enter your name (at least 2 characters).": "أدخل اسمك (حرفان على الأقل).", "Invalid admin key.": "مفتاح الإدارة غير صحيح.", "Invalid request body.": "طلب غير صالح.", "New password must be at least 8 characters.": "يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف.",
  "Not found.": "غير موجود.", "Password must be at least 8 characters.": "يجب ألا تقل كلمة المرور عن 8 أحرف.", "Please log in to continue.": "سجّل الدخول للمتابعة.", "Request too large.": "الطلب كبير جداً.",
  "Something went wrong on our side. Please try again.": "حدث خطأ من جانبنا. حاول مرة أخرى.", "That email already has an account. Try logging in.": "هذا البريد لديه حساب بالفعل. جرّب تسجيل الدخول.",
  "This account is suspended.": "هذا الحساب موقوف.", "Too many attempts. Please wait a few minutes and try again.": "محاولات كثيرة. انتظر بضع دقائق ثم حاول مرة أخرى.", "User not found.": "المستخدم غير موجود.", "Wrong email or password.": "البريد أو كلمة المرور غير صحيحة.", "You can't lock yourself out.": "لا يمكنك إغلاق الباب على نفسك.",
  "Priority support": "دعم ذو أولوية", "Welcome": "مرحباً",
};
export const CR = [
  [/^Server error \((\d+)\)\. Please try again\.$/, (m) => `خطأ في الخادم (${m[1]}). حاول مرة أخرى.`],
  [/^(\d+) min ago$/, (m) => `منذ ${m[1]} د`], [/^(\d+) h ago$/, (m) => `منذ ${m[1]} س`], [/^(\d+) d ago$/, (m) => `منذ ${m[1]} يوم`],
  [/^(.*) · plan (.*)$/, (m, f) => `${f(m[1])} · الخطة ${f(m[2])}`], [/^\$(\d+)\/mo$/, (m) => `${m[1]}$ شهرياً`],
];
