import React, { useState } from 'react';
import { Code, Terminal, X, Copy, Check, Send, CheckCircle2, AlertCircle, Play, ShieldCheck } from 'lucide-react';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCardNumber?: string;
  userCvv?: string;
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({
  isOpen,
  onClose,
  userCardNumber,
  userCvv,
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'terminal'>('docs');
  const [docCategory, setDocCategory] = useState<'express' | 'deposit' | 'charge'>('express');
  const [testMode, setTestMode] = useState<'charge' | 'deposit'>('deposit');
  const [copied, setCopied] = useState<string | null>(null);

  // Terminal Test Form State
  const [testFromCardNumber, setTestFromCardNumber] = useState(userCardNumber || '450088889999');
  const [testFromCvv, setTestFromCvv] = useState(userCvv || '123');
  const [testToCardNumber, setTestToCardNumber] = useState('450011112222');
  const [testAmount, setTestAmount] = useState('1500');
  const [testMerchant, setTestMerchant] = useState('НЯСР Выплата');
  const [testDescription, setTestDescription] = useState('Перевод с карты на карту по API');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  if (!isOpen) return null;

  const appUrl = window.location.origin;

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestLoading(true);
    setTestResponse(null);

    try {
      const endpoint = testMode === 'charge' ? '/api/v1/payment/charge' : '/api/v1/card/deposit';
      const body =
        testMode === 'charge'
          ? {
              cardNumber: testFromCardNumber.replace(/\s+/g, ''),
              cvv: testFromCvv.trim(),
              amount: Number(testAmount),
              merchantName: testMerchant,
              description: testDescription,
            }
          : {
              fromCardNumber: testFromCardNumber.replace(/\s+/g, ''),
              fromCvv: testFromCvv.trim(),
              toCardNumber: testToCardNumber.replace(/\s+/g, ''),
              amount: Number(testAmount),
              senderName: testMerchant,
              description: testDescription,
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({ message: 'Non-JSON response received' }));
      setTestResponse({ status: res.status, body: data });
    } catch (err: any) {
      setTestResponse({ status: 500, body: { success: false, message: err.message } });
    } finally {
      setTestLoading(false);
    }
  };

  const chargeJsSnippet = `// Подключение списания оплаты Банка номер один в НЯСР на вашем сайте
async function payWithNyasrBank(cardNumber, cvv, amount, orderDetails) {
  try {
    const response = await fetch('${appUrl}/api/v1/payment/charge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cardNumber: cardNumber.replace(/\\s+/g, ''), // 12-значный номер карты
        cvv: cvv,                                   // 3-значный CVV код
        amount: amount,                             // Сумма списания в PUSH
        merchantName: "Ваш Магазин",                 // Название вашего сайта/магазина
        description: orderDetails || "Оплата заказа",
      }),
    });

    const result = await response.json();
    if (result.success) {
      alert("Оплата успешно прошла! ID: " + result.transactionId);
      console.log("Остаток на карте покупателя:", result.remainingBalance);
    } else {
      alert("Ошибка оплаты: " + result.message);
    }
  } catch (error) {
    console.error("Ошибка соединения с API Банка номер один в НЯСР:", error);
  }
}`;

  const chargeCurlSnippet = `curl -X POST ${appUrl}/api/v1/payment/charge \\
  -H "Content-Type: application/json" \\
  -d '{
    "cardNumber": "450088889999",
    "cvv": "123",
    "amount": 1500,
    "merchantName": "Магазин НЯСР",
    "description": "Покупка товара на сайте"
  }'`;

  const depositJsSnippet = `// Перевод денег с карты списания на карту зачисления по API Банка номер один в НЯСР
async function transferBetweenCards(fromCardNumber, fromCvv, toCardNumber, amount, note) {
  try {
    const response = await fetch('${appUrl}/api/v1/card/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromCardNumber: fromCardNumber.replace(/\\s+/g, ''), // Карта списания
        fromCvv: fromCvv.trim(),                             // CVV карты списания
        toCardNumber: toCardNumber.replace(/\\s+/g, ''),     // Карта зачисления
        amount: amount,                                       // Сумма в PUSH
        description: note || "Перевод по API между картами",  // Описание
      }),
    });

    const result = await response.json();
    if (result.success) {
      alert("Перевод успешно выполнен! Остаток карты списания: " + result.senderRemainingBalance + " PUSH");
      console.log("ID транзакции:", result.transactionId);
    } else {
      alert("Ошибка перевода: " + result.message);
    }
  } catch (error) {
    console.error("Ошибка соединения с API Банка номер один в НЯСР:", error);
  }
}`;

  const depositCurlSnippet = `curl -X POST ${appUrl}/api/v1/card/deposit \\
  -H "Content-Type: application/json" \\
  -d '{
    "fromCardNumber": "450088889999",
    "fromCvv": "123",
    "toCardNumber": "450011112222",
    "amount": 2500,
    "description": "Перевод с карты на карту по API"
  }'`;

  const checkStatusCurlSnippet = `curl -X GET "${appUrl}/api/v1/transaction/status?transactionId=tx_merch_123456789"`;

  const expressHtmlSnippet = `<a href="${appUrl}/?merchantName=${encodeURIComponent(
    'Магазин «PINKI»'
  )}&recipientCardNumber=${userCardNumber || '450071570968'}&amount=2500&description=${encodeURIComponent(
    'Оплата заказа на сайте'
  )}&returnUrl=${encodeURIComponent('https://mysite.com/thankyou')}"
   target="_blank"
   style="background: #f59e0b; color: #000000; font-weight: 800; padding: 14px 28px; border-radius: 16px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; font-family: sans-serif; border: none; cursor: pointer;">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  <span>Оплатить через Писюн Банк (2 500 PUSH)</span>
</a>`;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-3xl bg-zinc-900 text-zinc-100 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-amber-400 font-bold uppercase tracking-widest">
                СТРАНА ПИСЮНОВ (НЯСР) • ПОРТАЛ РАЗРАБОТЧИКА
              </div>
              <h2 className="text-xl font-black text-white">Писюн Банк Acquiring Payment REST API</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-6">
          <button
            onClick={() => setActiveTab('docs')}
            className={`py-3 px-4 font-bold text-xs flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'docs'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Документация и Примеры кода</span>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`py-3 px-4 font-bold text-xs flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'terminal'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Песочница Тестирования Списания</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'docs' ? (
            <div className="space-y-6">
              {/* Category Selector */}
              <div className="flex space-x-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setDocCategory('express')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${
                    docCategory === 'express'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ⚡ Экспресс-Кнопка (Редирект без ввода карты)
                </button>
                <button
                  type="button"
                  onClick={() => setDocCategory('deposit')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${
                    docCategory === 'deposit'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ➕ Зачисление / Перевод (API)
                </button>
                <button
                  type="button"
                  onClick={() => setDocCategory('charge')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${
                    docCategory === 'charge'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  💳 Прямое списание CVV (Charge API)
                </button>
              </div>

              {docCategory === 'express' ? (
                <>
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed">
                    <div className="font-bold text-amber-400 text-sm mb-1 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Экспресс Оплата через перенаправление (0 строк JS):</span>
                    </div>
                    Вставьте кнопку-ссылку на вашем сайте! При клике покупатель автоматически переходит в банк.
                    Все данные (магазин, карта зачисления, сумма, описание) подставляются прямо из URL.
                    Клиенту останется нажать лишь **одну кнопку «Подтвердить и оплатить»** без ввода номеров карт и CVV!
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-zinc-300">
                        Готовый HTML-код кнопки для вашего сайта:
                      </span>
                      <button
                        onClick={() => handleCopyCode(expressHtmlSnippet, 'html_exp')}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                      >
                        {copied === 'html_exp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied === 'html_exp' ? 'Скопировано' : 'Скопировать HTML'}</span>
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-amber-300/90 overflow-x-auto leading-relaxed">
                      {expressHtmlSnippet}
                    </pre>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <div className="text-xs font-bold text-zinc-300">
                      Проверка статуса оплаты (Проверка по API и редиректу):
                    </div>
                    <div className="text-[11px] text-zinc-400 leading-relaxed">
                      • <strong>При возврате:</strong> В указанный <code className="text-amber-400 font-mono">returnUrl</code> покупатель автоматически перенаправляется с параметрами:<br />
                      <code className="text-emerald-400 font-mono">?status=success&paid=true&transactionId=tx_xxx&amount=2500</code><br />
                      • <strong>Проверка на сервере (GET API):</strong> Вы можете в любой момент узнать, прошла ли оплата, вызвав:
                    </div>
                    <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
                      {checkStatusCurlSnippet}
                    </pre>
                  </div>
                </>
              ) : docCategory === 'deposit' ? (
                <>
                  {/* Overview Deposit */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed">
                    <div className="font-bold text-amber-400 text-sm mb-1 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Зачисление средств на карту Банка номер один в НЯСР по номеру:</span>
                    </div>
                    Используйте этот API эндпоинт для автозачислений, выплат наград, бонусов или пополнения баланса.
                    Отправьте `POST` запрос с номером карты получателя (`cardNumber`) и суммой (`amount`).
                    Баланс мгновенно пополнится в базе Банка номер один в НЯСР!
                  </div>

                  {/* Endpoint Deposit Specification */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Основной Эндпоинт Зачисления:
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs flex items-center justify-between text-emerald-400">
                      <span>POST {appUrl}/api/v1/card/deposit</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                        JSON API
                      </span>
                    </div>
                  </div>

                  {/* JS Example Deposit */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-zinc-300">
                        JavaScript / Fetch Пример Зачисления:
                      </span>
                      <button
                        onClick={() => handleCopyCode(depositJsSnippet, 'js_dep')}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                      >
                        {copied === 'js_dep' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied === 'js_dep' ? 'Скопировано' : 'Скопировать JS'}</span>
                      </button>
                    </div>
                    <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-amber-300 font-mono text-xs overflow-x-auto leading-relaxed">
                      {depositJsSnippet}
                    </pre>
                  </div>

                  {/* cURL Example Deposit */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-zinc-300">cURL Команда:</span>
                      <button
                        onClick={() => handleCopyCode(depositCurlSnippet, 'curl_dep')}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                      >
                        {copied === 'curl_dep' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied === 'curl_dep' ? 'Скопировано' : 'Скопировать cURL'}</span>
                      </button>
                    </div>
                    <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-sky-300 font-mono text-xs overflow-x-auto">
                      {depositCurlSnippet}
                    </pre>
                  </div>
                </>
              ) : (
                <>
                  {/* Overview Charge */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed">
                    <div className="font-bold text-amber-400 text-sm mb-1 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Списание средств с карты покупателя:</span>
                    </div>
                    Разместите форму ввода <strong>Номера карты (12 цифр)</strong> и <strong>CVV кода</strong> на вашем внешнем сайте.
                    При нажатии «Оплатить» отправьте `POST` запрос на <code>/api/v1/payment/charge</code>.
                  </div>

                  {/* Endpoint Charge Specification */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Основной Эндпоинт Списания:
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs flex items-center justify-between text-emerald-400">
                      <span>POST {appUrl}/api/v1/payment/charge</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                        JSON API
                      </span>
                    </div>
                  </div>

                  {/* JavaScript Fetch Code Example */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-zinc-300">
                        JavaScript / Fetch Пример Списания:
                      </span>
                      <button
                        onClick={() => handleCopyCode(chargeJsSnippet, 'js')}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                      >
                        {copied === 'js' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied === 'js' ? 'Скопировано' : 'Скопировать JS'}</span>
                      </button>
                    </div>
                    <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-amber-300 font-mono text-xs overflow-x-auto leading-relaxed">
                      {chargeJsSnippet}
                    </pre>
                  </div>

                  {/* cURL Example */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-zinc-300">cURL Команда:</span>
                      <button
                        onClick={() => handleCopyCode(chargeCurlSnippet, 'curl')}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                      >
                        {copied === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied === 'curl' ? 'Скопировано' : 'Скопировать cURL'}</span>
                      </button>
                    </div>
                    <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-sky-300 font-mono text-xs overflow-x-auto">
                      {chargeCurlSnippet}
                    </pre>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* TEST TERMINAL SANDBOX */
            <div className="space-y-6">
              <div className="flex space-x-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setTestMode('deposit');
                    setTestMerchant('Партнерская Программа');
                    setTestDescription('Выплата бонусов на карту');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    testMode === 'deposit'
                      ? 'bg-amber-500 text-zinc-950 font-extrabold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ➕ Тестировать Зачисление
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTestMode('charge');
                    setTestMerchant('Магазин НЯСР Онлайн');
                    setTestDescription('Оплата заказа #704');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    testMode === 'charge'
                      ? 'bg-amber-500 text-zinc-950 font-extrabold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  💳 Тестировать Списание
                </button>
              </div>

              <div className="text-xs text-zinc-400">
                {testMode === 'deposit'
                  ? 'Интерактивный тест перевода средств между картами по номеру через `/api/v1/card/deposit`:'
                  : 'Интерактивный тест списания средств по номеру карты и CVV через `/api/v1/payment/charge`:'}
              </div>

              <form onSubmit={handleTestSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {testMode === 'deposit' ? 'Карта списания (fromCardNumber)' : 'Номер карты покупателя'}
                  </label>
                  <input
                    type="text"
                    required
                    value={testFromCardNumber}
                    onChange={(e) => setTestFromCardNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {testMode === 'deposit' ? 'CVV карты списания (fromCvv)' : 'CVV код (3 цифры)'}
                  </label>
                  <input
                    type="text"
                    required={testMode === 'charge'}
                    value={testFromCvv}
                    onChange={(e) => setTestFromCvv(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                {testMode === 'deposit' ? (
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Карта получателя (toCardNumber)
                    </label>
                    <input
                      type="text"
                      required
                      value={testToCardNumber}
                      onChange={(e) => setTestToCardNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Название магазина
                    </label>
                    <input
                      type="text"
                      value={testMerchant}
                      onChange={(e) => setTestMerchant(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Сумма перевода (PUSH)
                  </label>
                  <input
                    type="number"
                    required
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-bold text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Описание / Назначение платежа
                  </label>
                  <input
                    type="text"
                    value={testDescription}
                    onChange={(e) => setTestDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={testLoading}
                    className="w-full py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {testLoading
                        ? 'Запрос к API Банка номер один в НЯСР...'
                        : testMode === 'deposit'
                        ? 'Выполнить Перевод через API'
                        : 'Выполнить Списание через API'}
                    </span>
                  </button>
                </div>
              </form>

              {/* API Response Output Box */}
              {testResponse && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-zinc-400">Ответ сервера Банка номер один в НЯСР API:</span>
                    <span
                      className={
                        testResponse.status === 200
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }
                    >
                      HTTP STATUS: {testResponse.status}
                    </span>
                  </div>
                  <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-amber-300 overflow-x-auto">
                    {JSON.stringify(testResponse.body, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
