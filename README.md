<div align="center">

<img src="docs/screenshots/logo.png" width="110" alt="Palestine Polytechnic University" />

# Human Resource Management System (HRMS)

**Graduation Project — Palestine Polytechnic University**
College of Information Technology and Computer Engineering · Department of IT and Computer Science

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![TypeORM](https://img.shields.io/badge/TypeORM-FE0902?style=for-the-badge&logo=typeorm&logoColor=white)](https://typeorm.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)

[![Progress](https://img.shields.io/badge/modules-9%2F12%20completed-brightgreen?style=flat-square)]()
[![Routes](https://img.shields.io/badge/API%20routes-76%20mapped-blue?style=flat-square)]()
[![Tables](https://img.shields.io/badge/DB%20tables-17%20migrations-orange?style=flat-square)]()
[![Screens](https://img.shields.io/badge/UI%20screens-44%20designed-9146FF?style=flat-square)]()
[![Status](https://img.shields.io/badge/status-in%20development-yellow?style=flat-square)]()
[![License](https://img.shields.io/badge/license-private-lightgrey?style=flat-square)]()

</div>

---

## 📖 عن المشروع

**HRMS** هو نظام إدارة موارد بشرية حديث، مصمم ليكون بديلاً بسيطاً وفعّالاً وبأسعار معقولة عن الأنظمة العالمية المعقدة (Workday, SAP SuccessFactors) للشركات الصغيرة والمتوسطة.

النظام بيغطي دورة الموظف الكاملة: من التقديم على الوظيفة، لإدارة الحضور والانصراف، الإجازات والسلف، المهام، تقييم الأداء، وحتى احتساب الرواتب — بواجهة بسيطة وسهلة الاستخدام.

| | |
|---|---|
| **المستودع** | <https://github.com/Hosamtarde/HRMS> |
| **الواجهة الخلفية** | NestJS + TypeScript · MySQL · TypeORM Migrations |
| **عدد الـ Endpoints الحالية** | 76 route |
| **عدد الـ Migrations** | 17 |
| **عدد شاشات التصميم** | 44 شاشة (4 أدوار + نسخة موبايل + نسخة عربية RTL) |
| **لغات الواجهة** | إنجليزي (LTR) + عربي (RTL) — كل شاشة فيها مفتاح تبديل |

---

## 👥 فريق العمل

| الاسم | الرقم الجامعي | الدور |
|---|---|---|
| **Hosam Tarade** | 231102 | Backend Developer |
| **Mohammed Tarade** | 231101 | Backend Developer |
| **Bahaa Zahedah** | 231114 | Backend Developer |

**المشرف:** Dr. Hani Salah

---

## 🖼️ لقطات من الواجهات (UI / UX)

> كل اللقطات أدناه مأخوذة من ملفات التصميم الفعلية للمشروع، وكل شاشة فيها مفتاح `EN / ع` يقلب اللغة والاتجاه والخط.

### 🔐 تسجيل الدخول

<div align="center">
<img src="docs/screenshots/login.png" width="820" alt="Login screen" />
</div>

---

### 🧑‍💼 HR Admin — الصلاحية الكاملة

<div align="center">
<img src="docs/screenshots/dashboard-hr.png" width="860" alt="HR Admin dashboard" />
<p><em>لوحة التحكم — المؤشرات اليومية، الطلبات المعلّقة، وسجل النشاط</em></p>
</div>

<table>
<tr>
<td width="50%"><img src="docs/screenshots/employees.png" alt="Employees list" /><p align="center"><em>إدارة الموظفين</em></p></td>
<td width="50%"><img src="docs/screenshots/departments.png" alt="Departments" /><p align="center"><em>إدارة الأقسام</em></p></td>
</tr>
<tr>
<td><img src="docs/screenshots/employee-profile.png" alt="Employee profile" /><p align="center"><em>ملف الموظف</em></p></td>
<td><img src="docs/screenshots/attendance.png" alt="Attendance" /><p align="center"><em>الحضور والانصراف</em></p></td>
</tr>
<tr>
<td><img src="docs/screenshots/requests.png" alt="Requests" /><p align="center"><em>الطلبات (إجازة / سلفة / استئذان)</em></p></td>
<td><img src="docs/screenshots/request-review.png" alt="Request review" /><p align="center"><em>مراجعة طلب والموافقة عليه</em></p></td>
</tr>
<tr>
<td><img src="docs/screenshots/leave-types.png" alt="Leave types" /><p align="center"><em>أنواع الإجازات وسياساتها</em></p></td>
<td><img src="docs/screenshots/leave-balances.png" alt="Leave balances" /><p align="center"><em>أرصدة الإجازات السنوية</em></p></td>
</tr>
<tr>
<td><img src="docs/screenshots/payroll.png" alt="Payroll" /><p align="center"><em>توليد الرواتب الشهرية</em></p></td>
<td><img src="docs/screenshots/payslip.png" alt="Payslip" /><p align="center"><em>كشف الراتب التفصيلي</em></p></td>
</tr>
<tr>
<td><img src="docs/screenshots/loan-repayments.png" alt="Loan repayments" /><p align="center"><em>جدول أقساط السلفة</em></p></td>
<td><img src="docs/screenshots/recruitment.png" alt="Recruitment" /><p align="center"><em>طلبات التوظيف</em></p></td>
</tr>
<tr>
<td><img src="docs/screenshots/application-detail.png" alt="Application detail" /><p align="center"><em>تفاصيل طلب التوظيف والسيرة الذاتية</em></p></td>
<td><img src="docs/screenshots/tasks.png" alt="Tasks" /><p align="center"><em>إدارة المهام</em></p></td>
</tr>
</table>

---

### 📈 تقييم الأداء

<table>
<tr>
<td width="50%"><img src="docs/screenshots/performance-plan.png" alt="Build an evaluation plan" /><p align="center"><em>بناء خطة تقييم: المعايير وأوزانها ونافذة التسليم</em></p></td>
<td width="50%"><img src="docs/screenshots/performance-reviews.png" alt="Reviews list" /><p align="center"><em>متابعة التقييمات: مين سلّم ومين لسا</em></p></td>
</tr>
<tr>
<td colspan="2"><img src="docs/screenshots/performance-submit.png" alt="Submit a review" /><p align="center"><em>تعبئة تقييم موظف — المدير يعطي درجة لكل معيار</em></p></td>
</tr>
</table>

---

### 👔 Manager — مدير القسم

<div align="center">
<img src="docs/screenshots/dashboard-manager.png" width="860" alt="Manager dashboard" />
<p><em>لوحة تحكم المدير — ما ينتظر قراره، وحالة فريقه اليوم</em></p>
</div>

<table>
<tr>
<td width="50%"><img src="docs/screenshots/manager-approvals.png" alt="Manager approvals" /><p align="center"><em>الطلبات المنتظرة للموافقة</em></p></td>
<td width="50%"><img src="docs/screenshots/manager-review.png" alt="Manager review" /><p align="center"><em>قرار على طلب موظف من قسمه</em></p></td>
</tr>
<tr>
<td><img src="docs/screenshots/manager-team.png" alt="Manager team" /><p align="center"><em>فريق القسم</em></p></td>
<td><img src="docs/screenshots/manager-attendance.png" alt="Manager attendance" /><p align="center"><em>حضور الفريق</em></p></td>
</tr>
<tr>
<td colspan="2"><img src="docs/screenshots/manager-tasks.png" alt="Manager tasks" /><p align="center"><em>توزيع المهام ومتابعة نسب الإنجاز</em></p></td>
</tr>
</table>

---

### 👤 Employee — الخدمة الذاتية للموظف

<div align="center">
<img src="docs/screenshots/dashboard-employee.png" width="860" alt="Employee dashboard" />
<p><em>لوحة الموظف — تسجيل الحضور، رصيد الإجازات، ومهامه</em></p>
</div>

<table>
<tr>
<td width="50%"><img src="docs/screenshots/new-request.png" alt="New request" /><p align="center"><em>تقديم طلب جديد</em></p></td>
<td width="50%"><img src="docs/screenshots/my-requests.png" alt="My requests" /><p align="center"><em>طلباتي وحالتها</em></p></td>
</tr>
<tr>
<td><img src="docs/screenshots/my-attendance.png" alt="My attendance" /><p align="center"><em>سجل حضوري</em></p></td>
<td><img src="docs/screenshots/my-leave-balance.png" alt="My leave balance" /><p align="center"><em>رصيد إجازاتي</em></p></td>
</tr>
<tr>
<td colspan="2"><img src="docs/screenshots/my-payslips.png" alt="My payslips" /><p align="center"><em>كشوف رواتبي</em></p></td>
</tr>
</table>

---

### 🌐 Applicant — المتقدّم للوظيفة (بدون تسجيل دخول)

<div align="center">
<img src="docs/screenshots/careers.png" width="820" alt="Careers page" />
<p><em>صفحة الوظائف العامة — التقديم ورفع السيرة الذاتية بدون حساب</em></p>
</div>

---

### 📱 نسخة الموبايل · 🌍 النسخة العربية (RTL)

<table>
<tr>
<td width="25%"><img src="docs/screenshots/mobile-home.png" alt="Mobile home" /><p align="center"><em>الرئيسية — موبايل</em></p></td>
<td width="25%"><img src="docs/screenshots/mobile-checkin.png" alt="Mobile check-in" /><p align="center"><em>تسجيل الحضور — موبايل</em></p></td>
<td width="50%"><img src="docs/screenshots/dashboard-hr-rtl.png" alt="Arabic RTL dashboard" /><p align="center"><em>نفس اللوحة بالعربية (RTL)</em></p></td>
</tr>
</table>

---

### 🎨 نظام التصميم (Design System)

<div align="center">
<img src="docs/screenshots/components.png" width="700" alt="Component library" />
<p><em>مكتبة المكوّنات: الألوان، الخطوط، الأزرار، الحقول، الجداول، والشارات</em></p>
</div>

---

### 📊 موديولات قادمة (تصميم جاهز)

<table>
<tr>
<td width="50%"><img src="docs/screenshots/notifications.png" alt="Notifications" /><p align="center"><em>الإشعارات (Module 10)</em></p></td>
<td width="50%"><img src="docs/screenshots/reports.png" alt="Reports" /><p align="center"><em>التقارير والتحليلات (Module 11)</em></p></td>
</tr>
</table>

---

## 🏗️ التقنيات المستخدمة (Tech Stack)

| الطبقة | التقنية |
|---|---|
| **Backend** | NestJS + TypeScript |
| **Database** | MySQL + TypeORM (Migrations) |
| **Authentication** | JWT (Access + Refresh Tokens) |
| **Authorization** | Role-Based Access Control (RBAC) |
| **API Documentation** | Swagger / OpenAPI |
| **File Uploads** | Multer (CV uploads with type/size validation) |
| **Security** | Helmet, Rate Limiting (Throttler) |
| **Containerization** | Docker + Docker Compose |
| **API Testing** | Postman |
| **Frontend** *(مخطط له)* | ReactJS + Bootstrap |

---

## 👤 أدوار المستخدمين

النظام بيدعم 4 أدوار بصلاحيات متدرجة:

```
Applicant  →  Employee  →  Manager  →  HR Admin
```

| الدور | الصلاحيات |
|---|---|
| **Applicant** | يقدّم على وظائف ويتابع حالة طلبه — بدون تسجيل دخول |
| **Employee** | بياناته الشخصية، الحضور والانصراف، تقديم الطلبات، رصيد إجازاته، كشوف رواتبه، مهامه، ونتائج تقييمه |
| **Manager** | كل صلاحيات Employee + الموافقة/الرفض على طلبات موظفيه، متابعة حضور الفريق، إدارة المهام، وتقييم أداء موظفي قسمه |
| **HR Admin** | صلاحية كاملة: الموظفون، الأقسام، أنواع الإجازات والأرصدة، الرواتب، التوظيف، خطط التقييم، والأدوار |

---

## 🗄️ تصميم قاعدة البيانات (ERD)

<div align="center">
<img src="docs/screenshots/erd.png" width="600" alt="Database ERD" />
</div>

---

## 📦 الموديولات (حسب خطة العمل)

| # | الموديول | الحالة | أهم ما فيه |
|---|---|---|---|
| 0 | **Setup** | ✅ | NestJS, MySQL, TypeORM, Docker, Auth Base |
| 1 | **Authentication & Users** | ✅ | JWT + Refresh Tokens، Guards، Roles، Rate Limiting |
| 2 | **Department Management** | ✅ | CRUD + ربط مدير لكل قسم |
| 3 | **Attendance Management** | ✅ | Check-in/out، حساب ساعات العمل تلقائياً، منع التكرار اليومي |
| 4 | **Employee Management** | ✅ | إنشاء موظف (User + Profile) بـ Transaction واحدة، Soft Delete |
| 5 | **Requests** | ✅ | جدول موحّد (Leave/Loan/Permission/Custom) + مراجعة + حذف الطلب المعلّق |
| 5.1 | **Leave Types & Balances** | ✅ | سياسات الإجازات، احتساب الرصيد السنوي، خصم تلقائي عند الموافقة |
| 5.2 | **Loan Repayments** | ✅ | توليد جدول أقساط تلقائي لحظة الموافقة على السلفة |
| 6 | **Recruitment** | ✅ | تقديم عام بدون تسجيل + رفع CV مع تحقق من النوع والحجم |
| 7 | **Task Management** | ✅ | علاقة Many-to-Many، تعيين متعدد، نسبة إنجاز لكل موظف |
| 8 | **Payroll Management** | ✅ | راتب صافٍ تلقائي من 4 مصادر خصم مربوطة بـ 3 موديولات |
| 9 | **Performance Evaluation** | ✅ | 5 جداول، خطط بمعايير وأوزان مجموعها 100، نسبة نهائية موزونة |
| 10 | **Notifications** | ⏳ | — |
| 11 | **Reports & Analytics** | ⏳ | — |
| 12 | **RBAC — مراجعة نهائية** | ⏳ | — |

---

## 🧮 أهم القواعد المنطقية في النظام

هاي القواعد هي جوهر النظام، ومش مجرد CRUD:

### 1️⃣ الغياب لا يُخزَّن — يُستنتج

جدول `attendance_records` ما بيحتوي صف إلا لما الموظف يسجّل حضور فعلاً. يعني **الغياب ما إله سجل**. عشان هيك موديول الرواتب بيحسبه حساب:

```
لكل يوم في الشهر:
   ❌ تجاهل إذا كان عطلة أسبوعية (جمعة / سبت)
   ❌ تجاهل إذا كان قبل تاريخ تعيين الموظف  (hire_date)
   ❌ تجاهل إذا كان بعد تاريخ اليوم           (شهر لسا ما خلص)
   ❌ تجاهل إذا في سجل حضور لهذا اليوم
   ❌ تجاهل إذا في إجازة موافق عليها تغطي هذا اليوم
   ✅ غير هيك → يوم غياب
```

> **ملاحظة مهمة:** الإجازة المحتسبة هنا بتشمل **كل أنواع الدفع** (مدفوعة / نص مدفوعة / غير مدفوعة) — لأنه لو استثنينا المدفوعة، رح تنخصم مرتين: مرة كإجازة ومرة كغياب.

### 2️⃣ الراتب الصافي = الأساسي + البدلات − أربعة مصادر خصم

```
net_salary = basic_salary + bonuses
           − ( قسط السلفة الشهري
             + خصم الإجازات غير المدفوعة
             + خصم الإجازات نصف المدفوعة
             + خصم أيام الغياب )
```

التقريب بيصير **مرة واحدة** على مجموع الخصومات، مش على كل بند لحاله، تفادياً لفروقات الأعشار.

### 3️⃣ جدول أقساط السلفة يتولّد تلقائياً — ولا أحد يكتبه بيده

لما مدير أو HR Admin يوافق على طلب سلفة عبر `PUT /requests/:id/review`، بنفس الـ **Transaction** بيتولّد جدول الأقساط كاملاً:

```typescript
if (dto.status === RequestStatus.APPROVED && request.request_type === RequestType.LOAN) {
  await this.loanRepaymentsService.generateSchedule(manager, request);
}
```

جدول `loan_repayments` **للقراءة فقط** — فش POST ولا PUT ولا DELETE. والأقساط لاحقاً **تُستهلك** (مش تُنشأ) من `POST /payroll/generate`.

### 4️⃣ رصيد الإجازة يُحجز قبل الموافقة، ويُخصم بعدها

عند تقديم طلب إجازة بيتم التحقق من الرصيد المتاح فوراً:

```
400 Insufficient balance. Requested 40 days, available 14.
```

وبعد الموافقة بينتقل من `available_days` إلى `used_days` — ضمن Transaction مع قفل (`pessimistic_write`) يمنع الموافقة المتزامنة على طلبين لنفس الموظف.

### 5️⃣ معايير التقييم تُثبَّت مع الخطة، لا مع النظام

المعايير **ما بتنكتب بالكود** — الـ HR بيحددها. وبتنتمي لـ **خطة تقييم** مش للنظام عامةً، عشان لو عدّل المعايير بعد ربع سنة، نتائج الربع الماضي تضل مفهومة.

```
final_percentage = Σ ( score ÷ max_score × weight )
```

مثال على خطة بتلات معايير (`max_score = 5` لكل واحد):

| المعيار | الوزن | الدرجة | الحساب | الناتج |
|---|---|---|---|---|
| جودة العمل | 40 | 4 / 5 | 4 ÷ 5 × 40 | 32.00 |
| التعاون | 30 | 5 / 5 | 5 ÷ 5 × 30 | 30.00 |
| الالتزام بالمواعيد | 30 | 3 / 5 | 3 ÷ 5 × 30 | 18.00 |
| **المجموع** | **100** | — | — | **80.00** |

بنخزّن الاتنين: الدرجة الخام (12 من 15) للمراجعة، والنسبة الموزونة (80.00) للمقارنة بين الموظفين.

**دورة حياة الخطة:** `draft` → `active` → `closed`

- **`draft`** — الـ HR لسا بيبني. تعديل وحذف مسموح. ولا ورقة تقييم موجودة
- **`active`** — المعايير تجمّدت، وانولدت ورقة `pending` لكل موظف بالنطاق
- **`closed`** — سجل للقراءة فقط

**فحص الأوزان بيصير عند التفعيل، مش عند الحفظ** — عشان الـ HR يقدر يحفظ مسودة ناقصة ويكمّلها بكرا. والمقارنة بتصير بالمئات:

```typescript
if (Math.round(total * 100) !== TOTAL_WEIGHT * 100)
```

لأنه الـ `decimal` بيرجع من TypeORM كنص، ولأنه `33.33 + 33.33 + 33.34` ما بتساوي `100` بالضبط بالفاصلة العائمة.

### 6️⃣ المدير يُقيَّم، لكن ليس بيده

المدير بينولدله ورقة تقييم زي أي موظف — بس **الـ HR هو الي بيعبّيها**:

```
إذا كان المُقيَّم هو مدير القسم  →  المُقيِّم لازم يكون HR Admin
غير هيك                        →  المُقيِّم لازم يكون مدير قسم الموظف
```

والمقارنة بتصير مع `departments.manager_id` مش مع "قسم المدير" — عشان لو كان في مدير سابق لسا موظف بالقسم، ما يقدر يقيّم.

### 7️⃣ التسليم باتجاه واحد

بعد ما المدير يسلّم، ما بيقدر يعدّل. **الـ HR وحده** بيقدر يعيد الفتح عبر `PATCH /performance/reviews/:id/reopen` — والي بيصير وقتها:

- الحالة بترجع `pending` والنتيجة المحسوبة بتنمسح
- **بس الدرجات بتضل معبّاية** — المدير بيصلّح الغلط بدل ما يعيد تعبئة كل المعايير
- ومرفوض لو الخطة `closed` أو النافذة سكّرت

تقييم بيتعدّل متى ما بدّه المدير ما إله قيمة.

### 8️⃣ التحقق من الملكية قبل التحقق من الحالة

عند حذف طلب أو تسليم تقييم، الترتيب مقصود: الكود بيفحص **الصلاحية أولاً** ثم الحالة — لأنه العكس بيسرّب معلومة عن وجود وحالة سجل شخص تاني عبر رسالة الخطأ.

---

## 🛡️ ممارسات الجودة والأمان (Best Practices)

| الميزة | الوصف |
|---|---|
| **TypeORM Migrations** | تتبع تغييرات قاعدة البيانات بملفات مرقّمة بدل الاعتماد على `synchronize` التلقائي |
| **Global Exception Filter** | كل الأخطاء ترجع بشكل موحّد: `statusCode`, `message`, `path`, `timestamp` |
| **Global Validation Pipe** | تحقق تلقائي وصارم من كل البيانات الواردة عبر DTOs مع `forbidNonWhitelisted` |
| **Nested Validation** | المصفوفات المتداخلة (معايير الخطة، درجات التقييم) محمية بـ `@ValidateNested` + `@Type` معاً |
| **Response Interceptor** | كل الردود الناجحة موحّدة الشكل: `{ success, data, timestamp }` |
| **Swagger / OpenAPI** | توثيق تفاعلي كامل لكل الـ Endpoints |
| **Helmet** | رؤوس أمان HTTP قياسية لحماية من الهجمات الشائعة |
| **Rate Limiting** | حد عام 10 طلبات/دقيقة، وحد أشد (5 طلبات/دقيقة) على `/auth/login` لمنع Brute Force |
| **RBAC** | حماية كل Endpoint حساس بالدور المناسب عبر `@Roles()` + `RolesGuard` |
| **Transactional Operations** | العمليات الحساسة (إنشاء موظف، موافقة على سلفة، تفعيل خطة، تسليم تقييم) ضمن Transaction |
| **Pessimistic Locking** | قفل على رصيد الإجازة وعلى الخطة والتقييم، لمنع التفعيل أو التسليم المزدوج |
| **Database-level Constraints** | `UNIQUE(plan_id, reviewed_user_id)` و Composite PK — القواعد محروسة من قاعدة البيانات مش من الكود وحده |
| **Composite Indexes** | إندكسات مركّبة على استعلامات القوائم المتكررة بدل Full Table Scan |
| **Soft Delete** | تعطيل الحسابات والفئات بدل الحذف الفعلي، للحفاظ على البيانات التاريخية المرتبطة |
| **Ownership-based Filtering** | كل مستخدم يشوف بياناته الخاصة بس (ما لم يكن Manager/HR Admin) |
| **Cross-Module Integration** | Payroll يقرأ من Employees و Requests و Attendance لحساب الراتب الصافي تلقائياً |
| **Centralized Enums** | كل الـ enums في ملف واحد `common/enums/enums.ts` — مصدر واحد للحقيقة |
| **Bilingual UI (EN/AR)** | كل شاشة تدعم الإنجليزية (LTR) والعربية (RTL) بتبديل فوري |

---

## 🚀 التشغيل محلياً

### المتطلبات
- [Node.js](https://nodejs.org/) (v18 أو أحدث)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### الخطوات

```bash
# 1. استنساخ المشروع
git clone https://github.com/Hosamtarde/HRMS.git
cd HRMS/backend

# 2. تركيب الحزم
npm install

# 3. إعداد متغيرات البيئة
cp .env.example .env

# 4. تشغيل قاعدة البيانات (MySQL + phpMyAdmin)
docker compose up -d

# 5. تشغيل الـ Migrations (بناء الجداول)
npm run migration:run

# 6. إضافة بيانات أولية (مستخدمين + فئات معايير التقييم)
npm run seed

# 7. تشغيل السيرفر
npm run start:dev
```

| الخدمة | الرابط |
|---|---|
| **API** | `http://localhost:3000` |
| **توثيق Swagger التفاعلي** | `http://localhost:3000/api/docs` |
| **phpMyAdmin** | `http://localhost:8080` |

### 🔑 حسابات تجريبية (بعد `npm run seed`)

| الدور | Email | Password |
|---|---|---|
| HR Admin | `admin@hrms.com` | `admin123` |
| Employee | `employee@hrms.com` | `employee123` |

الـ seed بيضيف كمان **5 فئات معايير** جاهزة (جودة العمل، الالتزام بالمواعيد، التعاون، المبادرة، الانضباط) — وقابل لإعادة التشغيل بدون تعارض.

---

## 🗃️ التعامل مع قاعدة البيانات (Migrations)

المشروع يستخدم **TypeORM Migrations** بدل التوليد التلقائي للجداول:

```bash
# بعد إضافة/تعديل أي Entity
npm run migration:generate -- src/database/migrations/DescriptiveName

# لتطبيق الـ Migration على قاعدة البيانات
npm run migration:run

# لعرض حالة كل الـ Migrations
npm run migration:show

# للتراجع عن آخر Migration (عند الحاجة)
npm run migration:revert
```

**نسخة احتياطية من قاعدة البيانات** (مع ضمان ترميز العربية):

```bash
docker exec hrms_mysql mysqldump -u hrms_user -phrms_pass --default-character-set=utf8mb4 hrms_db > backup.sql
```

---

## 🔑 نقاط الوصول (API Endpoints)

> 📘 التوثيق الكامل والتفاعلي متاح على `/api/docs` بعد تشغيل المشروع. المجموع الحالي: **76 route**.

### Authentication
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| `POST` | `/auth/login` | تسجيل الدخول *(محدود بـ 5 محاولات/دقيقة)* | عام |
| `POST` | `/auth/refresh` | تجديد الـ Access Token | عام |
| `GET` | `/auth/me` | بيانات المستخدم الحالي | 🔒 مسجل دخول |
| `POST` | `/auth/logout` | تسجيل الخروج | 🔒 مسجل دخول |

### Users
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| `GET` | `/users/me` | ملفي الشخصي | 🔒 مسجل دخول |
| `PUT` | `/users/me` | تعديل بياناتي | 🔒 مسجل دخول |
| `PATCH` | `/users/me/password` | تغيير كلمة المرور | 🔒 مسجل دخول |

### Departments
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| `GET` | `/departments` | عرض كل الأقسام | 🔒 مسجل دخول |
| `GET` | `/departments/:id` | عرض قسم واحد | 🔒 مسجل دخول |
| `POST` | `/departments` | إضافة قسم | 🔒 HR Admin |
| `PUT` | `/departments/:id` | تعديل قسم (بما فيه تعيين مدير) | 🔒 HR Admin |
| `DELETE` | `/departments/:id` | حذف قسم | 🔒 HR Admin |

### Attendance
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| `POST` | `/attendance/check-in` | تسجيل حضور (مرة واحدة يومياً) | 🔒 مسجل دخول |
| `POST` | `/attendance/check-out` | تسجيل انصراف + حساب ساعات العمل | 🔒 مسجل دخول |
| `GET` | `/attendance` | عرض كل سجلات الحضور | 🔒 Manager / HR Admin |
| `GET` | `/attendance/employee/:id` | سجلات حضور موظف محدد | 🔒 Manager / HR Admin |

### Employees
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| `GET` | `/employees` | عرض كل الموظفين | 🔒 HR Admin |
| `GET` | `/employees/:id` | عرض موظف واحد | 🔒 HR Admin |
| `POST` | `/employees` | إنشاء موظف جديد (User + Profile في Transaction) | 🔒 HR Admin |
| `PUT` | `/employees/:id` | تعديل بيانات موظف | 🔒 HR Admin |
| `DELETE` | `/employees/:id` | تعطيل حساب موظف (Soft Delete) | 🔒 HR Admin |

### Requests (Leave / Loan / Permission / Custom)
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| `POST` | `/requests` | تقديم طلب جديد (مع فحص الرصيد للإجازات) | 🔒 مسجل دخول |
| `GET` | `/requests` | عرض الطلبات (الخاصة بالمستخدم، أو الكل لـ Manager/HR) | 🔒 مسجل دخول |
| `GET` | `/requests/:id` | عرض طلب واحد | 🔒 صاحب الطلب أو Manager/HR |
| `PUT` | `/requests/:id/review` | الموافقة أو الرفض *(يولّد جدول الأقساط للسلف)* | 🔒 Manager / HR Admin |
| `DELETE` | `/requests/:id` | حذف طلب **معلّق فقط** | 🔒 صاحب الطلب أو Manager/HR |

### Leave Types & Balances
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| `GET` | `/leave-types` | عرض أنواع الإجازات وسياساتها | 🔒 مسجل دخول |
| `GET` | `/leave-types/:id` | عرض نوع إجازة | 🔒 مسجل دخول |
| `POST` | `/leave-types` | إضافة نوع إجازة | 🔒 HR Admin |
| `PUT` | `/leave-types/:id` | تعديل نوع إجازة | 🔒 HR Admin |
| `DELETE` | `/leave-types/:id` | حذف نوع إجازة | 🔒 HR Admin |
| `GET` | `/leave-balances/me` | رصيدي | 🔒 مسجل دخول |
| `GET` | `/leave-balances` | عرض أرصدة الإجازات *(بفلتر `?year=`)* | 🔒 HR Admin |
| `GET` | `/leave-balances/:id` | عرض رصيد واحد | 🔒 HR Admin |
| `PUT` | `/leave-balances/:id` | تعديل رصيد يدوياً | 🔒 HR Admin |
| `POST` | `/leave-balances/calculate` | احتساب/تجديد الأرصدة السنوية لكل الموظفين | 🔒 HR Admin |

### Loan Repayments *(للقراءة فقط)*
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| `GET` | `/loan-repayments/loan/:id` | جدول أقساط سلفة معيّنة | 🔒 صاحب السلفة أو HR Admin |

### Recruitment
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| `POST` | `/recruitment/apply` | تقديم طلب توظيف + رفع CV | 🌐 **عام (بدون تسجيل)** |
| `GET` | `/recruitment` | عرض كل طلبات التوظيف | 🔒 HR Admin |
| `GET` | `/recruitment/:id` | عرض طلب توظيف واحد | 🔒 HR Admin |
| `PUT` | `/recruitment/:id/status` | تحديث حالة الطلب | 🔒 HR Admin |
| `DELETE` | `/recruitment/:id` | حذف طلب توظيف | 🔒 HR Admin |

### Tasks
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| `POST` | `/tasks` | إنشاء مهمة وتعيينها لعدة موظفين | 🔒 Manager / HR Admin |
| `GET` | `/tasks` | عرض المهام (مهام المستخدم، أو الكل لـ Manager/HR) | 🔒 مسجل دخول |
| `GET` | `/tasks/:id` | عرض مهمة واحدة | 🔒 مسجل دخول |
| `PUT` | `/tasks/:id` | تعديل تفاصيل المهمة | 🔒 Manager / HR Admin |
| `PUT` | `/tasks/:id/status` | تحديث حالة المهمة | 🔒 Manager / HR Admin |
| `PUT` | `/tasks/:id/completion` | تحديث نسبة إنجاز الموظف نفسه | 🔒 الموظف المكلّف |
| `DELETE` | `/tasks/:id` | حذف مهمة | 🔒 Manager / HR Admin |

### Payroll
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| `POST` | `/payroll/generate` | توليد راتب (لموظف واحد أو لكل الموظفين) | 🔒 HR Admin |
| `GET` | `/payroll` | عرض كل سجلات الرواتب | 🔒 HR Admin |
| `GET` | `/payroll/me` | كشوف رواتبي | 🔒 مسجل دخول |
| `GET` | `/payroll/employee/:id` | سجلات راتب موظف محدد | 🔒 HR Admin |
| `GET` | `/payroll/:id` | كشف راتب واحد | 🔒 HR Admin |
| `PUT` | `/payroll/:id` | تعديل كشف راتب | 🔒 HR Admin |
| `DELETE` | `/payroll/:id` | حذف كشف راتب | 🔒 HR Admin |

### Performance — فئات المعايير
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| `GET` | `/performance/categories` | عرض الفئات المفعّلة *(بفلتر `?includeInactive=true`)* | 🔒 مسجل دخول |
| `GET` | `/performance/categories/:id` | عرض فئة واحدة | 🔒 HR Admin |
| `POST` | `/performance/categories` | إضافة فئة | 🔒 HR Admin |
| `PUT` | `/performance/categories/:id` | تعديل فئة | 🔒 HR Admin |
| `DELETE` | `/performance/categories/:id` | **تعطيل** فئة (`is_active = false`) | 🔒 HR Admin |

### Performance — خطط التقييم
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| `GET` | `/performance/plans` | قائمة الخطط | 🔒 Manager / HR Admin |
| `GET` | `/performance/plans/:id` | خطة مع معاييرها مرتّبة | 🔒 Manager / HR Admin |
| `POST` | `/performance/plans` | إنشاء خطة + معاييرها في Transaction واحدة | 🔒 HR Admin |
| `PUT` | `/performance/plans/:id` | تعديل — **بحالة `draft` فقط** | 🔒 HR Admin |
| `PATCH` | `/performance/plans/:id/activate` | تفعيل — فحص الأوزان + توليد أوراق التقييم | 🔒 HR Admin |
| `PATCH` | `/performance/plans/:id/close` | إغلاق الخطة | 🔒 HR Admin |
| `DELETE` | `/performance/plans/:id` | حذف — **بحالة `draft` فقط** | 🔒 HR Admin |

### Performance — التقييمات
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| `GET` | `/performance/reviews/pending` | ما زال بانتظار التعبئة | 🔒 Manager / HR Admin |
| `GET` | `/performance/reviews/me` | نتائجي **المسلَّمة فقط** | 🔒 مسجل دخول |
| `GET` | `/performance/reviews/employee/:userId` | سجل تقييمات موظف عبر الخطط | 🔒 Manager / HR Admin |
| `GET` | `/performance/reviews/:id` | تقييم واحد بتفاصيل درجاته | 🔒 صاحبه أو مديره أو HR Admin |
| `PUT` | `/performance/reviews/:id/submit` | تسليم الدرجات + الحساب في Transaction | 🔒 Manager / HR Admin |
| `PATCH` | `/performance/reviews/:id/reopen` | إعادة فتح تقييم مسلَّم | 🔒 HR Admin |

### Activity Log
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| `GET` | `/activity-logs` | سجل النشاط | 🔒 HR Admin |

---

## 🌳 هيكل المشروع (Backend)

```
src/
├── common/
│   ├── decorators/      # @Roles(), @CurrentUser()
│   ├── dto/             # PaginationDto
│   ├── enums/           # كل الـ enums بملف واحد مركزي
│   ├── filters/         # HttpExceptionFilter (شكل موحّد للأخطاء)
│   ├── guards/          # JwtAuthGuard, RolesGuard
│   └── interceptors/    # ResponseInterceptor (شكل موحّد للردود)
├── database/
│   ├── data-source.ts   # إعدادات TypeORM CLI (للـ Migrations)
│   ├── migrations/      # 17 ملف Migration مرقّمة بالتاريخ
│   └── seeds/           # بيانات تجريبية أولية
├── modules/
│   ├── auth/            # تسجيل الدخول، JWT، Rate Limiting
│   ├── users/           # إدارة بيانات المستخدمين
│   ├── departments/     # إدارة الأقسام
│   ├── attendance/      # الحضور والانصراف
│   ├── employees/       # إدارة الموظفين (Transaction + Soft Delete)
│   ├── requests/        # طلبات الإجازة/السلفة/الاستئذان
│   ├── leave-types/     # سياسات أنواع الإجازات
│   ├── leave-balances/  # الأرصدة السنوية والاحتساب
│   ├── loan-repayments/ # جداول أقساط السلف (قراءة فقط)
│   ├── recruitment/     # التوظيف ورفع السير الذاتية
│   ├── tasks/           # إدارة المهام (Many-to-Many)
│   ├── payroll/         # احتساب الرواتب
│   ├── activity-logs/   # سجل النشاط
│   └── performance/     # تقييم الأداء — مقسّم حسب الوظيفة
│       ├── categories/     # entity · dto/ · service · controller
│       ├── plans/          # الخطة والمعايير · dto/ · service · controller
│       ├── reviews/        # التقييم والدرجات · dto/ · service · controller
│       ├── performance.constants.ts
│       └── performance.module.ts
├── app.module.ts
└── main.ts              # Helmet, Validation, Swagger, Filters, Interceptors
```

```
docs/
└── screenshots/         # لقطات واجهات التصميم المستخدمة في هذا الملف
```

> **ملاحظة على التنظيم:** معظم الموديولات ملفاتها مسطّحة لأنها 4-6 ملفات. موديول `performance` وحده مقسوم لمجلدات حسب الوظيفة (فئات / خطط / تقييمات) لأنه 15+ ملف وثلاث مجموعات راوتات مستقلة.

---

## 🔄 أسلوب العمل الجماعي (Git Workflow)

كل موديول بيتطور على فرع (branch) مستقل، ثم يُفتح Pull Request للمراجعة قبل الدمج على `main`:

```
main
 └── feature/auth              → merged
 └── feature/departments       → merged
 └── feature/attendance        → merged
 └── feature/employees         → merged
 └── feature/requests          → merged
 └── feature/leave-management  → merged
 └── feature/recruitment       → merged
 └── feature/tasks             → merged
 └── feature/payroll           → merged
 └── feature/performance       → merged
 └── (الموديولات القادمة)
```

نظام تسمية الـ Commits يتبع [Conventional Commits](https://www.conventionalcommits.org/):
`feat:` ميزة جديدة · `fix:` إصلاح · `chore:` إعدادات · `docs:` توثيق · `test:` اختبار موثّق

---

## 🧭 الخطوات القادمة

- [ ] **Module 10 — Notifications**: إشعار الموظف عند قرار على طلبه، تعيين مهمة، أو صدور نتيجة تقييمه
- [ ] **Module 11 — Reports & Analytics**: تقارير الحضور، الرواتب، وملخصات الأداء لكل قسم
- [ ] **Module 12 — RBAC**: مراجعة نهائية شاملة + ربط التحقق من القسم في `requests.review()` + راوت تعيين الأدوار
- [ ] **توحيد الـ Pagination وإضافة الإندكسات** على كل الموديولات
- [ ] **قياس الأداء**: تعبئة قاعدة البيانات ببيانات ضخمة ثم قياس بـ k6 قبل أي تحسين
- [ ] **Redis**: طابور للعمليات الثقيلة (توليد الرواتب)، Rate Limiting موزّع، وتخزين الـ Refresh Tokens
- [ ] **Testing**: تنفيذ مجموعة اختبارات Postman الكاملة بعد اكتمال الواجهة الخلفية
- [ ] **Frontend**: ReactJS + Bootstrap بناءً على ملفات التصميم المرفقة

---

<div align="center">

**Palestine Polytechnic University © 2026**

</div>