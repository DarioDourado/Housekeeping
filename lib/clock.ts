// - Hoje (ou hoje + offsetDays) às HH:mm, hora local, em ISO-8601; usado nas seeds e nos testes
export const todayAt = (hhmm: string, offsetDays = 0): string => {
  const [hours = 0, minutes = 0] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};
