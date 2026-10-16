/**
 * Форматирование национальной валюты Страны писюнов (НЯСР) — писики
 * 1 писик, 2-4 писика, 5+ писиков
 */
export function formatPisikiWord(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 < 11 || mod100 > 19) {
    if (mod10 === 1) return 'писик';
    if (mod10 >= 2 && mod10 <= 4) return 'писика';
  }
  return 'писиков';
}

export function formatPisiki(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ${formatPisikiWord(amount)}`;
}
