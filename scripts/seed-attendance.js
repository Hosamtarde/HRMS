require('dotenv').config();
const mysql = require('mysql2/promise');

const USERS = [3, 4, 5];
const FROM = new Date('2026-09-01');
const TO = new Date('2026-10-24');

function pickStatus() {
  const roll = Math.random();
  if (roll < 0.78) return 'present';
  if (roll < 0.9) return 'late';
  if (roll < 0.96) return 'absent';
  return 'on_leave';
}

function toTime(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const rows = [];

  for (const date = new Date(FROM); date <= TO; date.setDate(date.getDate() + 1)) {
    const day = date.getDay();
    if (day === 5 || day === 6) continue;

    const isoDate = date.toISOString().slice(0, 10);

    for (const userId of USERS) {
      const status = pickStatus();

      if (status === 'absent' || status === 'on_leave') {
        rows.push([userId, null, null, null, status, isoDate]);
        continue;
      }

      const checkInMinute = status === 'late' ? 25 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 12);
      const checkIn = toTime(8, checkInMinute);
      const hours = Math.round((7.5 + Math.random() * 1.5) * 10) / 10;
      const endMinutes = 8 * 60 + checkInMinute + Math.round(hours * 60);
      const checkOut = toTime(Math.floor(endMinutes / 60), endMinutes % 60);

      rows.push([userId, checkIn, checkOut, hours, status, isoDate]);
    }
  }

  await connection.query(
    'INSERT INTO attendance_records (user_id, check_in_time, check_out_time, working_hours, attendance_status, attendance_date) VALUES ?',
    [rows],
  );

  console.log(`inserted ${rows.length} attendance records`);
  await connection.end();
})();