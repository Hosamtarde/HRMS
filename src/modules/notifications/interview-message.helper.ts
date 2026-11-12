export function formatInterviewTime(
  date: Date,
  timeZone = 'Asia/Hebron',
): string {
  return new Intl.DateTimeFormat('ar-u-nu-latn', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
