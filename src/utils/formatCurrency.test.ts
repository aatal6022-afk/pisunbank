import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPisiki, formatPisikiWord, normalizeLegacyBrandText } from './formatCurrency';

test('formatPisikiWord declines Королевский Франк properly', () => {
  assert.equal(formatPisikiWord(1), 'Королевский Франк');
  assert.equal(formatPisikiWord(21), 'Королевский Франк');
  assert.equal(formatPisikiWord(101), 'Королевский Франк');

  assert.equal(formatPisikiWord(2), 'Королевских Франка');
  assert.equal(formatPisikiWord(3), 'Королевских Франка');
  assert.equal(formatPisikiWord(4), 'Королевских Франка');
  assert.equal(formatPisikiWord(22), 'Королевских Франка');

  assert.equal(formatPisikiWord(0), 'Королевских Франков');
  assert.equal(formatPisikiWord(5), 'Королевских Франков');
  assert.equal(formatPisikiWord(11), 'Королевских Франков');
  assert.equal(formatPisikiWord(12), 'Королевских Франков');
  assert.equal(formatPisikiWord(14), 'Королевских Франков');
  assert.equal(formatPisikiWord(19), 'Королевских Франков');
  assert.equal(formatPisikiWord(75000), 'Королевских Франков');
});

test('formatPisiki formats numbers with Russian locale and currency word', () => {
  assert.equal(formatPisiki(1), '1 Королевский Франк');
  assert.equal(formatPisiki(2), '2 Королевских Франка');
  assert.equal(formatPisiki(5), '5 Королевских Франков');
});

test('normalizeLegacyBrandText maps legacy country, bank, and currency names', () => {
  assert.equal(normalizeLegacyBrandText('КАЗНА НЯСР'), 'КАЗНА ЛАЙМИИ');
  assert.equal(normalizeLegacyBrandText('ИВАН НЯСР'), 'ИВАН ЛАЙМИЯ');
  assert.equal(
    normalizeLegacyBrandText('Подъемные субсидии от Минфина виртуальной страны Пушленд'),
    'Подъемные субсидии от Минфина Королевства Лаймия'
  );
  assert.equal(
    normalizeLegacyBrandText('Погашение 1 купюр(ы) на сумму 100 PUSH в банкомате'),
    'Погашение 1 купюр(ы) на сумму 100 Королевских Франков в банкомате'
  );
});

