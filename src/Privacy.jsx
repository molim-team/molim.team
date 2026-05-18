import React from 'react';

function Privacy() {
  return (
    <div className="privacy-container">
      <h1>🔒 سياسة الخصوصية</h1>
      <p className="last-updated">آخر تحديث: مايو 2026</p>

      <div className="privacy-section">
        <h2>📌 مقدمة</h2>
        <p>مرحباً بك في منصة مُلم للمنح الدراسية. نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمع بياناتك واستخدامها وحمايتها.</p>
      </div>

      <div className="privacy-section">
        <h2>📋 البيانات التي نجمعها</h2>
        <p>عند إنشاء حساب في منصة مُلم، نجمع البيانات التالية:</p>
        <ul>
          <li>الاسم الكامل</li>
          <li>البريد الإلكتروني</li>
          <li>تاريخ إنشاء الحساب</li>
        </ul>
        <p style={{ marginTop: '12px' }}>
          بالإضافة إلى بيانات الاستخدام التي يجمعها Google Analytics مثل الصفحات التي تزورها ومدة الزيارة ونوع المتصفح والموقع الجغرافي التقريبي.
        </p>
      </div>

      <div className="privacy-section">
        <h2>🎯 كيف نستخدم بياناتك</h2>
        <ul>
          <li>تسجيل الدخول والتعرف عليك داخل المنصة</li>
          <li>إرسال إيميل تأكيد الحساب أو إعادة تعيين كلمة المرور</li>
          <li>تحسين تجربة الاستخدام على المنصة</li>
          <li>تحليل إحصائيات الزيارات عبر Google Analytics</li>
        </ul>
      </div>

      <div className="privacy-section">
        <h2>🔐 كيف نحمي بياناتك</h2>
        <ul>
          <li>يتم تخزين بياناتك بشكل آمن عبر خدمة Firebase من Google</li>
          <li>كلمات المرور مشفرة ولا يمكن لأحد الاطلاع عليها بما فينا نحن</li>
          <li>كل مستخدم لا يستطيع الوصول إلا لبياناته الخاصة فقط</li>
          <li>نستخدم اتصال HTTPS مشفر لجميع البيانات</li>
        </ul>
      </div>

      <div className="privacy-section">
        <h2>🍪 ملفات الكوكيز وGoogle Analytics</h2>
        <p>
          نستخدم Google Analytics لفهم كيفية استخدام الزوار للموقع. يقوم Google Analytics بجمع بيانات مجهولة الهوية عبر ملفات الكوكيز. يمكنك إيقاف تتبع Google Analytics عبر{' '}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
            هذا الرابط
          </a>.
        </p>
      </div>

      <div className="privacy-section">
        <h2>🌍 مشاركة البيانات مع أطراف ثالثة</h2>
        <p>نحن لا نبيع بياناتك ولا نشاركها مع أي طرف ثالث لأغراض تجارية. البيانات تُشارك فقط مع:</p>
        <ul>
          <li><strong>Google Firebase</strong> — لتخزين الحسابات وقواعد البيانات</li>
          <li><strong>Google Analytics</strong> — لتحليل إحصائيات الموقع</li>
        </ul>
      </div>

      <div className="privacy-section">
        <h2>✅ حقوقك</h2>
        <p>لديك الحق في:</p>
        <ul>
          <li>طلب حذف حسابك وجميع بياناتك</li>
          <li>الاطلاع على البيانات التي نحتفظ بها عنك</li>
          <li>تعديل بياناتك الشخصية</li>
        </ul>
        <p style={{ marginTop: '12px' }}>
          للتواصل معنا بخصوص أي من هذه الحقوق:{' '}
          <a href="mailto:molim.team@gmail.com">molim.team@gmail.com</a>
        </p>
      </div>

      <div className="privacy-section">
        <h2>📝 تحديثات السياسة</h2>
        <p>قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على الموقع.</p>
      </div>
    </div>
  );
}

export default Privacy;