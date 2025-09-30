export function getStartOfDayLagos(): Date {
  const now = new Date();
  const lagosTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
  lagosTime.setHours(0, 0, 0, 0);
  return lagosTime;
}

export function isToday(date: Date): boolean {
  const todayStart = getStartOfDayLagos();
  const dateInLagos = new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
  return dateInLagos >= todayStart;
}
