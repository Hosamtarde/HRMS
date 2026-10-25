require('dotenv').config();
const mysql = require('mysql2/promise');

const ASSIGNER = 1;
const USERS = [3, 4, 5];

const TITLES = [
  'إعداد خطة الحملة التسويقية',
  'مراجعة عروض الموردين',
  'تحديث قاعدة بيانات العملاء',
  'تقرير أداء الربع الثالث',
  'تنسيق فعالية الإطلاق',
  'تحليل نتائج استبيان الرضا',
  'إعادة تصميم النشرة البريدية',
  'متابعة طلبات الدعم المتأخرة',
  'إعداد عرض تقديمي للإدارة',
  'أرشفة ملفات المشاريع المنتهية',
];

const PRIORITIES = ['low', 'medium', 'high'];

function dateAfter(days) {
  const date = new Date('2026-09-01');
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  let created = 0;

  for (let index = 0; index < TITLES.length; index += 1) {
    const deadline = dateAfter(5 + index * 6);
    const priority = PRIORITIES[index % PRIORITIES.length];

    const [result] = await connection.query(
      'INSERT INTO tasks (assigned_by, task_title, description, deadline, task_priority, task_status) VALUES (?, ?, ?, ?, ?, ?)',
      [
        ASSIGNER,
        TITLES[index],
        'مهمة تجريبية لاختبار تقارير المهام',
        deadline,
        priority,
        'to-do',
      ],
    );

    const taskId = result.insertId;
    const assignees = USERS.filter(() => Math.random() < 0.6);
    const finalAssignees = assignees.length ? assignees : [USERS[index % USERS.length]];

    for (const userId of finalAssignees) {
      const roll = Math.random();
      const completion = roll < 0.45 ? 100 : roll < 0.8 ? Math.floor(Math.random() * 9) * 10 + 10 : 0;

      await connection.query(
        'INSERT INTO assigned_tasks (user_id, task_id, completion_percentage) VALUES (?, ?, ?)',
        [userId, taskId, completion],
      );
    }

    created += 1;
  }

  console.log(`inserted ${created} tasks`);
  await connection.end();
})();