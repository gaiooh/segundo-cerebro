const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const shortDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });

/** "agora", "há 5 min", "há 3 h", "ontem", "há 4 dias", "12 de out." */
export function formatRelativeDate(iso: string, now: number = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  if (diff < MINUTE) return 'agora';
  if (diff < HOUR) return `há ${Math.floor(diff / MINUTE)} min`;
  if (diff < DAY) return `há ${Math.floor(diff / HOUR)} h`;
  if (diff < 2 * DAY) return 'ontem';
  if (diff < 7 * DAY) return `há ${Math.floor(diff / DAY)} dias`;
  return shortDate.format(new Date(iso));
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
