import express from 'express';
import path from 'path';
import { dbService, inMemoryDb } from './server/db.js';
import { isFirebaseConfigured } from './server/firebase-db.js';
import { CardType } from './src/types.js';

export const app = express();

// Routes setup
  // 1. CORS middleware FIRST so all responses (including preflight and errors) have CORS headers
  app.use((req, res, next) => {
    const origin = req.headers.origin || '*';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-MURBANK-API-KEY, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 2. Flexible Body Parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.text({ type: '*/*' }));

  // Middleware to auto-parse stringified JSON body if sent with text/plain or other content type
  app.use((req, res, next) => {
    if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        // ignore if not valid json
      }
    }
    next();
  });

  // 3. Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-NYASR-BANK-SECURITY', 'ACTIVE-256BIT-SSL');
    next();
  });

  // 4. In-Memory Rate Limiter for Anti-DDoS / Anti-Flood
  const ipRateLimitMap = new Map<string, { count: number; resetTime: number }>();
  const failedCvvMap = new Map<string, { failedCount: number; lockUntil: number }>();

  app.use((req, res, next) => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const limitInfo = ipRateLimitMap.get(clientIp);
    if (!limitInfo || now > limitInfo.resetTime) {
      ipRateLimitMap.set(clientIp, { count: 1, resetTime: now + 60000 }); // 1 minute window
    } else {
      limitInfo.count += 1;
      if (limitInfo.count > 100) {
        return res.status(429).json({
          success: false,
          message: 'Система защиты Писюн Банка: Превышен лимит запросов (Anti-DDoS Rate Limit). Попробуйте через минуту.',
        });
      }
    }
    next();
  });

  // ------------------------------------------------------------------
  // INTERNAL APP API ROUTES
  // ------------------------------------------------------------------

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Писюн Банк',
      country: 'Страна писюнов (НЯСР)',
      shortCountry: 'НЯСР',
      database: isFirebaseConfigured ? 'Firebase Firestore (Пушленд)' : 'Built-in Cloud Storage',
    });
  });

  // Register user & issue card (Name + Password)
  app.post('/api/cards/register', async (req, res) => {
    try {
      const rawNick =
        req.body?.gameNickname ||
        req.body?.username ||
        req.body?.nickname ||
        req.body?.name ||
        req.body?.login;

      const rawPw = req.body?.password || req.body?.pass || '';
      const cardType = (req.body?.cardType || 'regular') as CardType;

      if (!rawNick || String(rawNick).trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Укажите корректный игровой никнейм (от 2 символов)',
        });
      }

      if (!rawPw || String(rawPw).trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Пароль должен быть не менее 3 символов',
        });
      }

      const cleanNick = String(rawNick).trim();
      const cleanPw = String(rawPw).trim();

      const result = await dbService.registerUserAndIssueCard(cleanNick, cardType, cleanPw);
      res.json({
        success: true,
        user: result.user,
        card: result.card,
        cards: [result.card],
      });
    } catch (err: any) {
      console.error('[v0] Registration failed, switching to local storage:', err);
      try {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const cleanNick = String(body.gameNickname || body.username || body.name || '').trim();
        const cleanPw = String(body.password || '').trim();
        const requestedCardType = String(body.cardType || 'regular');
        const cardType: CardType = ['regular', 'business', 'treasury'].includes(requestedCardType)
          ? (requestedCardType as CardType)
          : 'regular';

        if (cleanNick.length < 2 || cleanPw.length < 3) {
          return res.status(400).json({
            success: false,
            message: 'Проверьте имя и пароль: имя от 2 символов, пароль от 3 символов',
          });
        }

        const fallbackResult = await inMemoryDb.registerUserAndIssueCard(cleanNick, cardType, cleanPw);
        return res.json({
          success: true,
          user: fallbackResult.user,
          card: fallbackResult.card,
          cards: [fallbackResult.card],
        });
      } catch (innerErr: any) {
        console.error('[v0] Local card registration failed:', innerErr);
        return res.status(500).json({
          success: false,
          message: innerErr?.message || err?.message || 'Не удалось зарегистрировать карту',
        });
      }
    }
  });

  // Login via Name / Card Number / Email + Password
  app.post('/api/cards/login', async (req, res) => {
    try {
      const { username, password, gameNickname } = req.body;
      const loginName = username || gameNickname;

      if (!loginName || !password) {
        return res.status(400).json({ success: false, message: 'Укажите логин (номер карты или email) и пароль' });
      }

      const result = await dbService.loginWithPassword(loginName, password);
      if (!result) {
        return res.status(401).json({ success: false, registered: false, message: 'Неверный логин (номер карты) или пароль' });
      }

      const primaryCard = result.cards && result.cards.length > 0 ? result.cards[0] : null;

      res.json({
        success: true,
        registered: true,
        user: result.user,
        card: primaryCard,
        cards: result.cards || [],
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Google Auth Integration
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { googleUser } = req.body;
      if (!googleUser?.googleId) {
        return res.status(400).json({ success: false, message: 'Не переданы данные Google' });
      }

      const result = await dbService.loginOrRegisterWithGoogle(googleUser);
      res.json({ success: true, user: result.user, card: result.card });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Get user cards
  app.get('/api/cards/user/:userId', async (req, res) => {
    try {
      const cards = await dbService.getCardsByUserId(req.params.userId);
      res.json({ success: true, cards });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Get card by number
  app.get('/api/cards/number/:cardNumber', async (req, res) => {
    try {
      const card = await dbService.getCardByNumber(req.params.cardNumber);
      if (!card) {
        return res.status(404).json({ success: false, message: 'Карта не найдена' });
      }
      res.json({ success: true, card });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Transfer money between cards
  app.post('/api/cards/transfer', async (req, res) => {
    try {
      const { fromCardNumber, toCardNumber, amount, note } = req.body;
      if (!fromCardNumber || !toCardNumber || !amount) {
        return res.status(400).json({ success: false, message: 'Укажите карту отправителя, карту получателя и сумму' });
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Сумма перевода должна быть числом больше 0' });
      }

      const result = await dbService.transferMoney(fromCardNumber, toCardNumber, numAmount, note);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Freeze account according to Decree #2 (minimum 14 days)
  app.post('/api/cards/freeze', async (req, res) => {
    try {
      const { cardId, days } = req.body;
      if (!cardId || !days) {
        return res.status(400).json({ success: false, message: 'Укажите cardId и количество дней заморозки (от 14 дней)' });
      }

      const numDays = Number(days);
      if (isNaN(numDays) || numDays < 14) {
        return res.status(400).json({
          success: false,
          message: 'По Указу Пушленда №2 минимальный срок заморозки счета составляет 14 календарных дней!',
        });
      }

      const result = await dbService.freezeCard(cardId, numDays);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Calculate Inactivity Tax Status & countdown
  app.get('/api/cards/tax-status/:cardId', async (req, res) => {
    try {
      const card = await dbService.getCardByNumber(req.params.cardId);
      // If not by number, could be by ID
      const cardSnap = card || (await dbService.getCards()).find(c => c.id === req.params.cardId);

      if (!cardSnap) {
        return res.status(404).json({ success: false, message: 'Карта не найдена' });
      }

      const now = Date.now();
      const lastAct = cardSnap.lastActivityDate || cardSnap.createdAt;
      const lastActTime = new Date(lastAct).getTime();
      const diffMs = now - lastActTime;
      const daysInactive = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const daysUntilTax = Math.max(0, 7 - daysInactive);
      const taxRatePercent = 7;
      const estimatedTaxAmount = Math.max(1, Math.round(cardSnap.balance * 0.07));

      res.json({
        success: true,
        status: {
          lastActivityDate: lastAct,
          daysInactive,
          daysUntilTax,
          taxRatePercent,
          estimatedTaxAmount: cardSnap.balance > 0 ? estimatedTaxAmount : 0,
          isTaxDue: daysInactive >= 7 && !cardSnap.isFrozen && cardSnap.balance > 0,
          isFrozen: !!cardSnap.isFrozen,
          frozenUntil: cardSnap.frozenUntil,
          freezeDays: cardSnap.freezeDays,
          frozenAt: cardSnap.frozenAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Manually trigger tax check on demand
  app.post('/api/cards/check-tax/:cardId', async (req, res) => {
    try {
      const cards = await dbService.getCards();
      const found = cards.find(c => c.id === req.params.cardId || c.cardNumber === req.params.cardId);
      if (!found) {
        return res.status(404).json({ success: false, message: 'Карта не найдена' });
      }

      const beforeBal = found.balance;
      const updatedCard = await dbService.checkAndApplyInactivityTax(found);
      const taxDeducted = beforeBal - updatedCard.balance;

      res.json({
        success: true,
        taxDeducted,
        card: updatedCard,
        message: taxDeducted > 0
          ? `Списан налог на бездействие 7% (${taxDeducted.toLocaleString('ru-RU')} PUSH) в пользу Казны Пушленда.`
          : 'Налог не требуется (счет активен или защищен заморозкой).',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Simulate Inactivity for testing
  app.post('/api/cards/simulate-inactivity', async (req, res) => {
    try {
      const { cardId, days } = req.body;
      if (!cardId) {
        return res.status(400).json({ success: false, message: 'Не указан cardId' });
      }

      const result = await dbService.simulateInactivity(cardId, Number(days || 7));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ------------------------------------------------------------------
  // ADMIN & TREASURY API ROUTES (pinkiscammerinfo@gmail.com)
  // ------------------------------------------------------------------

  // Get Treasury Stats (Total money in circulation, Treasury balance, Citizens count and balances)
  app.get('/api/admin/treasury-stats', async (req, res) => {
    try {
      const adminEmail = (req.query.adminEmail as string) || (req.headers['x-admin-email'] as string) || '';
      const stats = await dbService.getTreasuryStats(adminEmail);
      res.json({ success: true, stats });
    } catch (err: any) {
      res.status(403).json({ success: false, message: err.message || 'Ошибка доступа к Казне' });
    }
  });

  // Emit new currency (Central Bank emission)
  app.post('/api/admin/emit-currency', async (req, res) => {
    try {
      const { adminEmail, amount, recipientCardNumber, decreeNumber, reason } = req.body;
      if (!adminEmail) {
        return res.status(401).json({ success: false, message: 'Укажите email администратора' });
      }
      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'Укажите корректную сумму эмиссии (> 0)' });
      }

      const result = await dbService.emitCurrency({
        adminEmail,
        amount: Number(amount),
        recipientCardNumber,
        decreeNumber,
        reason,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Ошибка проведения эмиссии' });
    }
  });

  // Manage bank staff
  app.post('/api/admin/toggle-employee', async (req, res) => {
    try {
      const { adminEmail, targetUserId, isEmployee } = req.body;
      if (!adminEmail) return res.status(401).json({ success: false, message: 'Укажите email администратора' });
      const result = await dbService.toggleEmployee(adminEmail, targetUserId, isEmployee);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Ошибка изменения роли' });
    }
  });

  // Admin toggle card freeze
  app.post('/api/admin/toggle-freeze', async (req, res) => {
    try {
      const { staffEmail, cardId, freeze } = req.body;
      if (!staffEmail) return res.status(401).json({ success: false, message: 'Укажите email сотрудника' });
      const result = await dbService.staffToggleFreeze(staffEmail, cardId, freeze);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Ошибка блокировки карты' });
    }
  });

  // Apply for 5% credit
  app.post('/api/cards/credit/apply', async (req, res) => {
    try {
      const { cardId, amount, termMonths } = req.body;
      if (!cardId || !amount) {
        return res.status(400).json({ success: false, message: 'Не указана карта или сумма кредита' });
      }

      const result = await dbService.applyCredit(cardId, Number(amount), Number(termMonths || 12));
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Repay credit loan
  app.post('/api/cards/credit/repay', async (req, res) => {
    try {
      const { creditId, amount } = req.body;
      if (!creditId || !amount) {
        return res.status(400).json({ success: false, message: 'Укажите ID кредита и сумму погашения' });
      }

      const result = await dbService.repayCredit(creditId, Number(amount));
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Get active loans for card
  app.get('/api/cards/credits/:cardId', async (req, res) => {
    try {
      const credits = await dbService.getCreditsByCardId(req.params.cardId);
      res.json({ success: true, credits });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Get transactions for card
  app.get('/api/cards/transactions/:cardNumber', async (req, res) => {
    try {
      const transactions = await dbService.getTransactionsByCardNumber(req.params.cardNumber);
      res.json({ success: true, transactions });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ------------------------------------------------------------------
  // INVOICING & MERCHANT BILLING API
  // ------------------------------------------------------------------

  // Create invoice
  app.post('/api/invoices/create', async (req, res) => {
    try {
      const { merchantName, recipientCardNumber, amount, description, merchantUserId } = req.body;
      if (!recipientCardNumber || !amount) {
        return res.status(400).json({ success: false, message: 'Укажите карту зачисления и сумму счёта' });
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Сумма счёта должна быть положительным числом' });
      }

      const invoice = await dbService.createInvoice(
        merchantName || 'Торговец MURBANK',
        recipientCardNumber,
        numAmount,
        description || 'Оплата услуг',
        merchantUserId || ''
      );

      res.json({ success: true, invoice });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Get invoice by ID
  app.get('/api/invoices/:invoiceId', async (req, res) => {
    try {
      const invoice = await dbService.getInvoiceById(req.params.invoiceId);
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Счёт не найден' });
      }
      res.json({ success: true, invoice });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Pay invoice
  app.post('/api/invoices/:invoiceId/pay', async (req, res) => {
    try {
      const { cardNumber, cvv } = req.body;
      if (!cardNumber || !cvv) {
        return res.status(400).json({ success: false, message: 'Укажите номер карты плательщика и CVV' });
      }

      const result = await dbService.payInvoice(req.params.invoiceId, cardNumber, cvv);
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Serve pay-widget script for external merchant sites
  const serveWidget = (req: express.Request, res: express.Response) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(`
(function() {
  var handler = {
    openCheckout: function(opts) {
      if (!opts || !opts.recipientCardNumber || !opts.amount) {
        alert('Ошибка Банка номер один в НЯСР Pay: Укажите recipientCardNumber и amount');
        return;
      }
      var host = window.location.origin;
      fetch(host + '/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts)
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success && data.invoice) {
          window.open(host + '/?invoice=' + data.invoice.id, '_blank');
        } else {
          alert('Ошибка счёта: ' + (data.message || 'Не удалось сгенерировать'));
        }
      })
      .catch(function(err) {
        alert('Сбой связи с Банком номер один в НЯСР: ' + err.message);
      });
    }
  };
  window.PisyunPay = handler;
  window.MURBANKPay = handler;
  window.NyasrPay = handler;
})();
    `);
  };

  app.get('/pisyun-pay-widget.js', serveWidget);
  app.get('/murbank-pay-widget.js', serveWidget);
  app.get('/nyasr-pay-widget.js', serveWidget);

  // Get merchant invoices & analytics stats by card number
  app.get('/api/invoices/merchant/:cardNumber', async (req, res) => {
    try {
      const invoices = await dbService.getInvoicesByMerchantCard(req.params.cardNumber);
      const paidInvoices = invoices.filter((i) => i.status === 'paid');
      const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.amount, 0);
      const paidCount = paidInvoices.length;
      const pendingCount = invoices.filter((i) => i.status === 'pending').length;
      const avgCheck = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

      res.json({
        success: true,
        invoices,
        stats: {
          totalRevenue,
          paidCount,
          pendingCount,
          avgCheck,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ------------------------------------------------------------------
  // MERCHANT ACQUIRING REST API (v1) - FOR EXTERNAL PUSHLAND SITES
  // ------------------------------------------------------------------

  app.all('/api/v1/payment/charge', async (req, res) => {
    try {
      const cardNumber = req.body?.cardNumber || req.query?.cardNumber;
      const cvv = req.body?.cvv || req.query?.cvv;
      const amount = req.body?.amount !== undefined ? req.body.amount : req.query?.amount;
      const merchantName = req.body?.merchantName || req.query?.merchantName;
      const description = req.body?.description || req.query?.description;

      if (!cardNumber || !cvv || amount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Ошибка API MURBANK: Укажите cardNumber, cvv и amount',
        });
      }

      const cleanNum = String(cardNumber).replace(/\s+/g, '');
      const now = Date.now();
      const lockInfo = failedCvvMap.get(cleanNum);

      if (lockInfo && lockInfo.lockUntil > now) {
        const remainingSec = Math.ceil((lockInfo.lockUntil - now) / 1000);
        return res.status(423).json({
          success: false,
          message: `Безопасность MURBANK: Карта заблокирована из-за частых неверных вводов CVV. Попробуйте через ${remainingSec} сек.`,
        });
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Ошибка API MURBANK: Сумма списания должна быть положительным числом',
        });
      }

      const result = await dbService.processMerchantCharge(
        cleanNum,
        String(cvv),
        numAmount,
        merchantName || 'Внешний Магазин',
        description || 'Оплата через API MURBANK'
      );

      if (!result.success) {
        // Track failed attempt
        const currentFailures = (lockInfo?.failedCount || 0) + 1;
        if (currentFailures >= 3) {
          failedCvvMap.set(cleanNum, { failedCount: currentFailures, lockUntil: now + 300000 }); // 5 mins lock
        } else {
          failedCvvMap.set(cleanNum, { failedCount: currentFailures, lockUntil: 0 });
        }
        return res.status(400).json(result);
      }

      // Reset failure counter on success
      failedCvvMap.delete(cleanNum);

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Ошибка сервера MURBANK: ' + err.message });
    }
  });

  app.all('/api/v1/payment/verify', async (req, res) => {
    try {
      const cardNumber = req.body?.cardNumber || req.query?.cardNumber;
      const cvv = req.body?.cvv || req.query?.cvv;
      const card = await dbService.getCardByNumber(String(cardNumber || '').replace(/\s+/g, ''));

      if (!card) {
        return res.status(404).json({ success: false, message: 'Карта не найдена в базе MURBANK' });
      }

      if (card.cvv !== String(cvv || '').trim()) {
        return res.status(400).json({ success: false, message: 'Неверный CVV код карты' });
      }

      res.json({
        success: true,
        valid: true,
        cardType: card.cardType,
        color: card.color,
        status: card.status,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.all('/api/v1/card/balance', async (req, res) => {
    try {
      const cardNumber = String(req.body?.cardNumber || req.query?.cardNumber || '').replace(/\s+/g, '');
      const cvv = String(req.body?.cvv || req.query?.cvv || '').trim();

      const card = await dbService.getCardByNumber(cardNumber);
      if (!card || card.cvv !== cvv) {
        return res.status(401).json({ success: false, message: 'Неверные реквизиты карты' });
      }

      res.json({
        success: true,
        cardNumber: card.cardNumber,
        balance: card.balance,
        currency: 'PUSH',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Deposit / Transfer funds between cards by card number (REST API)
  const handleDepositRequest = async (req: express.Request, res: express.Response) => {
    try {
      const fromCardNumber =
        req.body?.fromCardNumber ||
        req.body?.fromCard ||
        req.body?.sourceCardNumber ||
        req.query?.fromCardNumber ||
        req.query?.fromCard;

      const fromCvv =
        req.body?.fromCvv ||
        req.body?.cvv ||
        req.query?.fromCvv ||
        req.query?.cvv;

      const toCardNumber =
        req.body?.toCardNumber ||
        req.body?.toCard ||
        req.body?.cardNumber ||
        req.body?.recipientCardNumber ||
        req.query?.toCardNumber ||
        req.query?.toCard ||
        req.query?.cardNumber;

      const amount = req.body?.amount !== undefined ? req.body.amount : req.query?.amount;

      const senderName =
        req.body?.senderName ||
        req.body?.merchantName ||
        req.body?.from ||
        req.query?.senderName ||
        req.query?.merchantName;

      const description =
        req.body?.description ||
        req.body?.note ||
        req.query?.description ||
        req.query?.note;

      if (!fromCardNumber) {
        return res.status(400).json({
          success: false,
          message:
            'Ошибка API MURBANK: Укажите fromCardNumber (карта списания). Средства не могут создаваться из воздуха — перевод происходит с реальной карты.',
        });
      }

      if (!toCardNumber) {
        return res.status(400).json({
          success: false,
          message:
            'Ошибка API MURBANK: Укажите toCardNumber или cardNumber (карта получателя)',
        });
      }

      if (amount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Ошибка API MURBANK: Укажите amount (сумму перевода)',
        });
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Ошибка API MURBANK: Сумма перевода должна быть числом больше 0',
        });
      }

      const result = await dbService.depositToCardByNumber(
        String(fromCardNumber),
        String(toCardNumber),
        numAmount,
        fromCvv ? String(fromCvv) : undefined,
        senderName ? String(senderName) : undefined,
        description ? String(description) : undefined
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Ошибка сервера MURBANK: ' + err.message });
    }
  };

  app.post('/api/cards/deposit', handleDepositRequest);
  app.all('/api/v1/card/deposit', handleDepositRequest);
  app.all('/api/v1/card/credit', handleDepositRequest);
  app.all('/api/v1/payment/deposit', handleDepositRequest);

  // Transaction Status Endpoint (Check if payment succeeded)
  const handleTransactionStatusRequest = async (req: express.Request, res: express.Response) => {
    try {
      const txId =
        req.query?.transactionId ||
        req.query?.txId ||
        req.query?.id ||
        req.body?.transactionId ||
        req.body?.txId ||
        req.body?.id ||
        req.params?.id;

      if (!txId) {
        return res.status(400).json({
          success: false,
          status: 'error',
          paid: false,
          message: 'Ошибка API: Укажите transactionId или id платежа для проверки',
        });
      }

      const tx = await dbService.getTransactionById(String(txId));

      if (!tx) {
        return res.status(404).json({
          success: false,
          status: 'not_found',
          paid: false,
          message: `Транзакция с ID "${txId}" не найдена в системе MURBANK`,
        });
      }

      res.json({
        success: true,
        status: 'success',
        paid: true,
        transactionId: tx.id,
        amount: tx.amount,
        currency: 'PUSH',
        senderName: tx.senderName || 'Скрыт',
        recipientName: tx.recipientName || 'Получатель',
        fromCardNumber: tx.fromCardNumber,
        toCardNumber: tx.toCardNumber,
        description: tx.description,
        type: tx.type,
        createdAt: tx.createdAt,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        status: 'error',
        paid: false,
        message: 'Ошибка сервера MURBANK: ' + err.message,
      });
    }
  };

  app.all('/api/v1/transaction/status', handleTransactionStatusRequest);
  app.all('/api/v1/transaction/check', handleTransactionStatusRequest);
  app.all('/api/v1/payment/status', handleTransactionStatusRequest);
  app.get('/api/v1/transaction/:id', handleTransactionStatusRequest);

  // ------------------------------------------------------------------
  // VITE / STATIC SERVING
  // ------------------------------------------------------------------
async function startServer() {
  const PORT = 3000;
  if (process.env.NODE_ENV !== 'production') {
    const viteModuleName = 'vite';
    const { createServer: createViteServer } = await import(viteModuleName);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    if (!process.env.VERCEL) {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[MURBANK SERVER] Running on http://0.0.0.0:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
