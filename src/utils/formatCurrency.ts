/**
 * Форматирование национальной валюты Королевства Лаймия — Королевский Франк
 * 1 Королевский Франк, 2-4 Королевских Франка, 5+ Королевских Франков
 */
export function formatPisikiWord(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 < 11 || mod100 > 19) {
    if (mod10 === 1) return 'Королевский Франк';
    if (mod10 >= 2 && mod10 <= 4) return 'Королевских Франка';
  }
  return 'Королевских Франков';
}

export function formatPisiki(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ${formatPisikiWord(amount)}`;
}

export function normalizeLegacyBrandText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/КАЗНА НЯСР/g, 'КАЗНА ЛАЙМИИ')
    .replace(/ИВАН НЯСР/g, 'ИВАН ЛАЙМИЯ')
    .replace(/ivan\.nyasr@gmail\.com/gi, 'ivan.laimia@gmail.com')
    .replace(/Главный Казначей Пушленда/gi, 'Главный Казначей Королевства Лаймия')
    .replace(/Верховный Банкир Пушленда/gi, 'Верховный Банкир Королевства Лаймия')
    .replace(/Казна Государства Пушленд/gi, 'Казна Королевства Лаймия')
    .replace(/виртуальной страны Пушленд/gi, 'Королевства Лаймия')
    .replace(/Пушленда/gi, 'Королевства Лаймия')
    .replace(/Пушленде/gi, 'Королевстве Лаймия')
    .replace(/Пушленд/gi, 'Королевство Лаймия')
    .replace(/Писюн Банк/gi, 'Банк Королевства Лаймия')
    .replace(/НЯСР/g, 'Лаймии')
    .replace(/(\d+(?:\s+\d+)*)\s*PUSH\b/g, '$1 Королевских Франков')
    .replace(/\bPUSH\b/g, 'Королевских Франков')
    .replace(/пис[ию]к[а-я]*/gi, 'Королевских Франков');
}

