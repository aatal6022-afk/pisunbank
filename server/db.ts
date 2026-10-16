import {
  User,
  BankCard,
  Transaction,
  CreditLoan,
  CardType,
  CardColor,
  MerchantChargeResponse,
  Invoice,
  TreasuryStats,
  CurrencyEmissionRequest,
} from '../src/types.js';
import { isFirebaseConfigured, firebaseDbService, ADMIN_EMAILS, isAdminEmail } from './firebase-db.js';


export async function isStaffEmail(email?: string): Promise<boolean> {
  if (!email) return false;
  if (isAdminEmail(email)) return true;
  const users = await dbService.getUsers();
  const user = users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
  return !!user?.isEmployee;
}

// In-Memory Storage for High Availability & Zero Hangs
class InMemoryDatabase {
  private users: Map<string, User> = new Map();
  private cards: Map<string, BankCard> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private credits: Map<string, CreditLoan> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private seeded = false;

  constructor() {
    this.seed();
  }

  private seed() {
    if (this.seeded) return;
    this.seeded = true;

    const govtUser: User = {
      id: 'usr_govt',
      email: 'aatal6022@gmail.com',
      password: 'admin',
      googleId: 'google_treasury_admin',
      name: 'Главный Казначей Пушленда',
      fullName: 'Верховный Банкир Пушленда',
      gameNickname: 'КАЗНА НЯСР',
      avatar: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      isAdmin: true,
      isEmployee: true,
    };

    const legacyGovtUser: User = {
      id: 'usr_legacy_govt',
      email: 'pinkiscammerinfo@gmail.com',
      password: 'admin',
      name: 'Главный Казначей НЯСР',
      fullName: 'Верховный Банкир НЯСР',
      gameNickname: 'КАЗНА НЯСР',
      avatar: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      isAdmin: true,
      isEmployee: true,
    };

    const ivanUser: User = {
      id: 'usr_ivan',
      email: 'ivan.nyasr@gmail.com',
      password: '123',
      googleId: 'google_ivan_demo',
      name: 'Иван Гражданин',
      gameNickname: 'ИВАН НЯСР',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      isAdmin: false,
      isEmployee: false,
    };

    const govtCard: BankCard = {
      id: 'crd_treasury',
      userId: 'usr_govt',
      cardNumber: '450000000001',
      cardHolderName: 'КАЗНА НЯСР',
      cardType: 'treasury',
      color: 'gold',
      balance: 1000000000,
      issueDate: '01/26',
      cvv: '777',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActivityDate: new Date().toISOString(),
    };

    const ivanCard: BankCard = {
      id: 'crd_ivan',
      userId: 'usr_ivan',
      cardNumber: '450088889999',
      cardHolderName: 'ИВАН НЯСР',
      cardType: 'regular',
      color: 'white',
      balance: 75000,
      issueDate: '03/26',
      cvv: '123',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActivityDate: new Date().toISOString(),
    };

    const initTx: Transaction = {
      id: 'tx_init_1',
      cardId: 'crd_ivan',
      cardNumber: '450088889999',
      fromCardNumber: '450000000001',
      toCardNumber: '450088889999',
      senderName: 'Казна Государства НЯСР',
      recipientName: 'Иван Гражданин',
      amount: 75000,
      type: 'transfer_in',
      description: 'Подъемные субсидии от Минфина Страны писюнов (НЯСР)',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    };

    this.users.set(govtUser.id, govtUser);
    this.users.set(ivanUser.id, ivanUser);
    this.cards.set(govtCard.id, govtCard);
    this.cards.set(ivanCard.id, ivanCard);
    this.transactions.set(initTx.id, initTx);
  }

  private generate12DigitCardNumber(): string {
    const existing = new Set(Array.from(this.cards.values()).map((c) => c.cardNumber));
    let num = '';
    let exists = true;
    while (exists) {
      const rand8 = Math.floor(10000000 + Math.random() * 90000000).toString();
      num = `4500${rand8}`;
      exists = existing.has(num);
    }
    return num;
  }

  private formatIssueDate(): string {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${year}`;
  }

  private generateCVV(): string {
    return String(Math.floor(100 + Math.random() * 900));
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByNickname(nickname: string): Promise<User | undefined> {
    const clean = nickname.trim().toUpperCase();
    return Array.from(this.users.values()).find(
      (u) =>
        u.gameNickname?.toUpperCase() === clean ||
        u.name?.toUpperCase() === clean ||
        u.email?.toLowerCase() === nickname.trim().toLowerCase()
    );
  }

  async loginWithPassword(
    username: string,
    password: string
  ): Promise<{ user: User; cards: BankCard[] } | null> {
    const cleanInput = username.trim();
    if (!cleanInput) return null;

    let user: User | undefined;

    // Check if input is a 12-digit card number
    if (/^\d{12}$/.test(cleanInput.replace(/\s+/g, ''))) {
      const card = await this.getCardByNumber(cleanInput);
      if (card) {
        user = this.users.get(card.userId);
      }
    }

    if (!user) {
      user = await this.getUserByNickname(cleanInput);
    }

    if (!user) return null;

    // Check password if set
    if (user.password && user.password !== password) {
      return null;
    }

    // Set password if not set
    if (!user.password && password) {
      user.password = password;
      this.users.set(user.id, user);
    }

    if (isAdminEmail(user.email)) {
      user.isAdmin = true;
    }

    const cards = await this.getCardsByUserId(user.id);
    return { user, cards };
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.googleId === googleId);
  }

  async loginGoogleUser(googleUser: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<{ user: User; cards: BankCard[] } | null> {
    const user = await this.getUserByGoogleId(googleUser.googleId);
    if (!user) return null;
    if (isAdminEmail(user.email) || isAdminEmail(googleUser.email)) {
      user.isAdmin = true;
    }
    const cards = await this.getCardsByUserId(user.id);
    return { user, cards };
  }

  async getUserById(id: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user && isAdminEmail(user.email)) {
      user.isAdmin = true;
    }
    return user;
  }

  async getCards(): Promise<BankCard[]> {
    return Array.from(this.cards.values());
  }

  async getCardsByUserId(userId: string): Promise<BankCard[]> {
    const user = await this.getUserById(userId);
    const isAdmin = user && isAdminEmail(user.email);

    if (isAdmin) {
      let tCard = Array.from(this.cards.values()).find(
        (c) => c.cardType === 'treasury' || c.cardNumber === '450000000001'
      );
      if (tCard) {
        if (tCard.userId !== userId) {
          tCard.userId = userId;
          this.cards.set(tCard.id, tCard);
        }
      } else {
        const govtCard: BankCard = {
          id: 'crd_treasury',
          userId: userId,
          cardNumber: '450000000001',
          cardHolderName: 'КАЗНА НЯСР',
          cardType: 'treasury',
          color: 'gold',
          balance: 1000000000,
          issueDate: '01/26',
          cvv: '777',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastActivityDate: new Date().toISOString(),
        };
        this.cards.set(govtCard.id, govtCard);
      }
    }

    const userCards = Array.from(this.cards.values()).filter((c) => c.userId === userId);
    const updatedCards: BankCard[] = [];

    for (const card of userCards) {
      if (card.cardType === 'treasury' || card.cardNumber === '450000000001') {
        updatedCards.push(card);
      } else {
        const processed = await this.checkAndApplyInactivityTax(card);
        updatedCards.push(processed);
      }
    }

    updatedCards.sort((a, b) => {
      if (a.cardType === 'treasury' || a.cardNumber === '450000000001') return -1;
      if (b.cardType === 'treasury' || b.cardNumber === '450000000001') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return updatedCards;
  }

  async getCardByNumber(cardNumber: string): Promise<BankCard | undefined> {
    const cleanNum = cardNumber.replace(/\s+/g, '');
    const card = Array.from(this.cards.values()).find((c) => c.cardNumber === cleanNum);
    if (!card) return undefined;
    return await this.checkAndApplyInactivityTax(card);
  }

  async checkAndApplyInactivityTax(card: BankCard): Promise<BankCard> {
    const now = Date.now();
    let updated = false;

    // Check freeze expiration
    if (card.isFrozen || card.status === 'frozen') {
      if (card.frozenUntil) {
        const freezeExpiry = new Date(card.frozenUntil).getTime();
        if (now >= freezeExpiry) {
          card.isFrozen = false;
          card.status = 'active';
          card.frozenUntil = undefined;
          card.lastActivityDate = new Date().toISOString();
          updated = true;
        }
      }
    }

    // Inactivity tax 7%
    if (!card.isFrozen && card.status !== 'frozen' && card.status === 'active' && card.balance > 0) {
      const lastAct = card.lastActivityDate || card.createdAt;
      const lastActTime = new Date(lastAct).getTime();
      const diffMs = now - lastActTime;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays >= 7) {
        const taxAmount = Math.max(1, Math.round(card.balance * 0.07));
        const actualTax = Math.min(taxAmount, card.balance);

        card.balance -= actualTax;
        card.lastActivityDate = new Date().toISOString();
        updated = true;

        const taxTx: Transaction = {
          id: `tx_tax_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          cardId: card.id,
          cardNumber: card.cardNumber,
          fromCardNumber: card.cardNumber,
          toCardNumber: 'KAZNA_PUSHLAND',
          senderName: card.cardHolderName,
          recipientName: 'Казна Государства НЯСР',
          amount: actualTax,
          type: 'tax_inactivity',
          description: `Налог на бездействие средств (7%) по Закону об экономической ответственности`,
          createdAt: new Date().toISOString(),
        };
        this.transactions.set(taxTx.id, taxTx);
      }
    }

    if (updated) {
      this.cards.set(card.id, card);
    }
    return card;
  }

  async freezeCard(
    cardId: string,
    days: number
  ): Promise<{ success: boolean; message: string; updatedCard?: BankCard }> {
    if (isNaN(days) || days < 14) {
      return {
        success: false,
        message: 'По Указу №2 заморозка игрового счета возможна только на срок от 14 календарных дней!',
      };
    }

    const card = this.cards.get(cardId);
    if (!card) {
      return { success: false, message: 'Карта не найдена в системе Банка номер один в НЯСР' };
    }

    if (card.isFrozen || card.status === 'frozen') {
      const untilDateStr = card.frozenUntil
        ? new Date(card.frozenUntil).toLocaleDateString('ru-RU')
        : 'установленного срока';
      return {
        success: false,
        message: `Счет уже заморожен до ${untilDateStr}. Досрочная разморозка запрещена по Указу №2.`,
        updatedCard: card,
      };
    }

    const now = new Date();
    const freezeUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    card.isFrozen = true;
    card.status = 'frozen';
    card.frozenAt = now.toISOString();
    card.freezeDays = days;
    card.frozenUntil = freezeUntil.toISOString();
    card.lastActivityDate = now.toISOString();

    this.cards.set(card.id, card);

    const freezeTx: Transaction = {
      id: `tx_freeze_${Date.now()}`,
      cardId: card.id,
      cardNumber: card.cardNumber,
      fromCardNumber: card.cardNumber,
      toCardNumber: 'NYASR_SECURITY',
      senderName: card.cardHolderName,
      recipientName: 'Служба Заморозки Банка номер один в НЯСР',
      amount: 0,
      type: 'account_freeze',
      description: `Заморозка счета на ${days} дн. (до ${freezeUntil.toLocaleDateString('ru-RU')}) по Указу НЯСР №2`,
      createdAt: now.toISOString(),
    };
    this.transactions.set(freezeTx.id, freezeTx);

    return {
      success: true,
      message: `Счет успешно заморожен на ${days} дней (до ${freezeUntil.toLocaleDateString('ru-RU')}). Все операции заблокированы, налог на бездействие отключен.`,
      updatedCard: card,
    };
  }

  async simulateInactivity(
    cardId: string,
    days: number = 7
  ): Promise<{
    success: boolean;
    message: string;
    updatedCard?: BankCard;
    taxApplied?: boolean;
    taxAmount?: number;
  }> {
    const card = this.cards.get(cardId);
    if (!card) {
      return { success: false, message: 'Карта не найдена' };
    }

    if (card.isFrozen || card.status === 'frozen') {
      return {
        success: false,
        message: 'Счет заморожен по Указу №2. Налог на бездействие не начисляется!',
        updatedCard: card,
      };
    }

    const simulatedDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    card.lastActivityDate = simulatedDate;

    const beforeBal = card.balance;
    const updatedCard = await this.checkAndApplyInactivityTax(card);
    const taxAmount = beforeBal - updatedCard.balance;

    return {
      success: true,
      message:
        taxAmount > 0
          ? `Симуляция ${days} дней бездействия: списан налог 7% (${taxAmount.toLocaleString('ru-RU')} PUSH) в пользу Казны НЯСР!`
          : `Симуляция ${days} дней бездействия: баланс 0 PUSH, налог не списан.`,
      updatedCard,
      taxApplied: taxAmount > 0,
      taxAmount,
    };
  }

  async getTransactionsByCardNumber(cardNumber: string): Promise<Transaction[]> {
    const cleanNum = cardNumber.replace(/\s+/g, '');
    return Array.from(this.transactions.values())
      .filter((t) => t.cardNumber === cleanNum || t.fromCardNumber === cleanNum || t.toCardNumber === cleanNum)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getCreditsByCardId(cardId: string): Promise<CreditLoan[]> {
    return Array.from(this.credits.values()).filter((c) => c.cardId === cardId);
  }

  async loginOrRegisterWithGoogle(googleData: any): Promise<{ user: User; card: BankCard }> {
    const googleId = googleData.googleId;
    const email = googleData.email || '';
    const name = googleData.name || 'Гражданин НЯСР';
    const avatar = googleData.avatar || '';

    let user = Array.from(this.users.values()).find(
      (u) => u.googleId === googleId || (email && u.email === email)
    );

    if (!user) {
      user = {
        id: `usr_g_${Date.now()}`,
        email,
        googleId,
        name,
        fullName: name,
        gameNickname: isAdminEmail(email) ? 'КАЗНА НЯСР' : name.toUpperCase(),
        avatar,
        createdAt: new Date().toISOString(),
        isAdmin: isAdminEmail(email),
      };
      this.users.set(user.id, user);
    } else {
      if (!user.googleId) user.googleId = googleId;
      if (isAdminEmail(email) && !user.isAdmin) user.isAdmin = true;
      this.users.set(user.id, user);
    }

    const cards = await this.getCardsByUserId(user.id);
    let card = cards[0];

    if (!card) {
      const cardNumber = this.generate12DigitCardNumber();
      card = {
        id: `crd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
        cardNumber,
        cardHolderName: name.toUpperCase(),
        cardType: 'regular',
        color: 'white',
        balance: 0,
        issueDate: this.formatIssueDate(),
        cvv: this.generateCVV(),
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      this.cards.set(card.id, card);
    }

    return { user, card };
  }

  async registerUserAndIssueCard(
    gameNickname: string,
    cardType: CardType,
    password?: string
  ): Promise<{ user: User; card: BankCard }> {
    const cleanNick = gameNickname.trim();
    let user = await this.getUserByNickname(cleanNick);

    if (!user) {
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        password: password || undefined,
        email: `${cleanNick.toLowerCase().replace(/[^a-z0-9]/g, '') || 'citizen'}@nyasr.bank`,
        name: cleanNick,
        gameNickname: cleanNick.toUpperCase(),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      };
      this.users.set(user.id, user);
    } else {
      user.gameNickname = cleanNick.toUpperCase();
      if (password) user.password = password;
      this.users.set(user.id, user);
    }

    const color: CardColor = cardType === 'business' ? 'black' : 'white';
    const cardNumber = this.generate12DigitCardNumber();

    const card: BankCard = {
      id: `crd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      cardNumber,
      cardHolderName: gameNickname.toUpperCase(),
      cardType,
      color,
      balance: 0,
      issueDate: this.formatIssueDate(),
      cvv: this.generateCVV(),
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    this.cards.set(card.id, card);
    return { user, card };
  }

  async transferMoney(
    fromCardNumRaw: string,
    toCardNumRaw: string,
    amount: number,
    note?: string
  ): Promise<{ success: boolean; message: string; senderCard?: BankCard; recipientCard?: BankCard }> {
    if (amount <= 0) {
      return { success: false, message: 'Сумма перевода должна быть больше нуля' };
    }

    const fromNum = fromCardNumRaw.replace(/\s+/g, '');
    const toNum = toCardNumRaw.replace(/\s+/g, '');

    if (fromNum === toNum) {
      return { success: false, message: 'Нельзя перевести деньги на ту же самую карту' };
    }

    const senderCard = await this.getCardByNumber(fromNum);
    const recipientCard = await this.getCardByNumber(toNum);

    if (!senderCard) return { success: false, message: 'Карта отправителя не найдена' };
    if (!recipientCard)
      return { success: false, message: 'Карта получателя с таким номером не найдена в системе Банка номер один в НЯСР' };

    if (senderCard.isFrozen || senderCard.status === 'frozen') {
      return { success: false, message: 'Операция отклонена: Счет списания заморожен по Указу НЯСР №2.' };
    }

    if (recipientCard.isFrozen || recipientCard.status === 'frozen') {
      return { success: false, message: 'Операция отклонена: Счет получателя заморожен по Указу НЯСР №2.' };
    }

    if (senderCard.status !== 'active') return { success: false, message: 'Карта отправителя неактивна' };
    if (recipientCard.status !== 'active') return { success: false, message: 'Карта получателя неактивна' };

    if (senderCard.balance < amount) {
      return { success: false, message: 'Недостаточно средств на карте' };
    }

    const timestamp = new Date().toISOString();
    senderCard.balance -= amount;
    senderCard.lastActivityDate = timestamp;
    recipientCard.balance += amount;
    recipientCard.lastActivityDate = timestamp;

    this.cards.set(senderCard.id, senderCard);
    this.cards.set(recipientCard.id, recipientCard);

    const description = note || `Перевод средств между картами НЯСР`;

    const txSender: Transaction = {
      id: `tx_${Date.now()}_out`,
      cardId: senderCard.id,
      cardNumber: senderCard.cardNumber,
      fromCardNumber: senderCard.cardNumber,
      toCardNumber: recipientCard.cardNumber,
      senderName: senderCard.cardHolderName,
      recipientName: recipientCard.cardHolderName,
      amount,
      type: 'transfer_out',
      description,
      createdAt: timestamp,
    };

    const txRecip: Transaction = {
      id: `tx_${Date.now()}_in`,
      cardId: recipientCard.id,
      cardNumber: recipientCard.cardNumber,
      fromCardNumber: senderCard.cardNumber,
      toCardNumber: recipientCard.cardNumber,
      senderName: senderCard.cardHolderName,
      recipientName: recipientCard.cardHolderName,
      amount,
      type: 'transfer_in',
      description,
      createdAt: timestamp,
    };

    this.transactions.set(txSender.id, txSender);
    this.transactions.set(txRecip.id, txRecip);

    return {
      success: true,
      message: `Успешный перевод ${amount.toLocaleString('ru-RU')} PUSH на карту ${recipientCard.cardNumber}`,
      senderCard,
      recipientCard,
    };
  }

  async applyCredit(
    cardId: string,
    amount: number,
    termMonths: number = 12
  ): Promise<{ success: boolean; message: string; loan?: CreditLoan; updatedCard?: BankCard }> {
    if (amount < 1000) {
      return { success: false, message: 'Минимальная сумма кредита 1 000 PUSH' };
    }

    const card = this.cards.get(cardId);
    if (!card) return { success: false, message: 'Карта не найдена' };
    if (card.isFrozen || card.status === 'frozen') {
      return { success: false, message: 'Нельзя взять кредит: счет заморожен по Указу НЯСР №2.' };
    }

    const interestRate = 5;
    const years = termMonths / 12;
    const interestTotal = amount * (interestRate / 100) * years;
    const totalRepayAmount = Math.round(amount + interestTotal);
    const monthlyPayment = Math.round(totalRepayAmount / termMonths);

    const loan: CreditLoan = {
      id: `crdt_${Date.now()}`,
      cardId: card.id,
      principal: amount,
      interestRate,
      totalRepayAmount,
      remainingAmount: totalRepayAmount,
      monthlyPayment,
      termMonths,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const timestamp = new Date().toISOString();
    card.balance += amount;
    card.lastActivityDate = timestamp;

    this.cards.set(card.id, card);
    this.credits.set(loan.id, loan);

    const creditTx: Transaction = {
      id: `tx_credit_${Date.now()}`,
      cardId: card.id,
      cardNumber: card.cardNumber,
      fromCardNumber: 'NYASR_CREDIT_GOVT',
      toCardNumber: card.cardNumber,
      senderName: 'Банк номер один в НЯСР (Кредитный отдел)',
      recipientName: card.cardHolderName,
      amount,
      type: 'credit_draw',
      description: `Зачисление государственного кредита 5% годовых на ${termMonths} мес.`,
      createdAt: timestamp,
    };
    this.transactions.set(creditTx.id, creditTx);

    return {
      success: true,
      message: `Кредит на сумму ${amount.toLocaleString('ru-RU')} PUSH под 5% годовых зачислен на карту!`,
      loan,
      updatedCard: card,
    };
  }

  async repayCredit(
    creditId: string,
    repayAmount: number
  ): Promise<{ success: boolean; message: string; updatedCard?: BankCard; updatedCredit?: CreditLoan }> {
    const credit = this.credits.get(creditId);
    if (!credit) return { success: false, message: 'Кредит не найден' };
    if (credit.status === 'paid') return { success: false, message: 'Этот кредит уже полностью погашен' };

    const card = this.cards.get(credit.cardId);
    if (!card) return { success: false, message: 'Связанная карта не найдена' };

    const actualRepay = Math.min(repayAmount, credit.remainingAmount);
    if (card.balance < actualRepay) {
      return { success: false, message: 'Недостаточно средств на карте для погашения кредита' };
    }

    const timestamp = new Date().toISOString();
    card.balance -= actualRepay;
    card.lastActivityDate = timestamp;
    credit.remainingAmount -= actualRepay;

    if (credit.remainingAmount <= 0) {
      credit.status = 'paid';
      credit.remainingAmount = 0;
    }

    this.cards.set(card.id, card);
    this.credits.set(credit.id, credit);

    const repayTx: Transaction = {
      id: `tx_repay_${Date.now()}`,
      cardId: card.id,
      cardNumber: card.cardNumber,
      fromCardNumber: card.cardNumber,
      toCardNumber: 'NYASR_CREDIT_GOVT',
      senderName: card.cardHolderName,
      recipientName: 'Банк номер один в НЯСР (Погашение кредита)',
      amount: actualRepay,
      type: 'credit_repay',
      description: `Погашение кредита ID ${credit.id.slice(-6)}`,
      createdAt: timestamp,
    };
    this.transactions.set(repayTx.id, repayTx);

    return {
      success: true,
      message: `Погашение на сумму ${actualRepay.toLocaleString('ru-RU')} PUSH успешно выполнено!`,
      updatedCard: card,
      updatedCredit: credit,
    };
  }

  async processMerchantCharge(
    cardNumberRaw: string,
    cvv: string,
    amount: number,
    merchantName: string = 'Внешний Магазин НЯСР',
    description: string = 'Оплата на сайте партнера'
  ): Promise<MerchantChargeResponse> {
    const cleanNum = cardNumberRaw.replace(/\s+/g, '');
    const card = await this.getCardByNumber(cleanNum);

    if (!card) return { success: false, message: 'Карта с таким номером не найдена в Банке номер один в НЯСР' };
    if (card.isFrozen || card.status === 'frozen') return { success: false, message: 'Счет плательщика заморожен' };
    if (card.status !== 'active') return { success: false, message: 'Карта заблокирована или неактивна' };
    if (card.cvv !== cvv.trim()) return { success: false, message: 'Неверный CVV код карты' };
    if (amount <= 0) return { success: false, message: 'Некорректная сумма списания' };
    if (card.balance < amount) {
      return { success: false, message: `Недостаточно средств (Баланс: ${card.balance.toLocaleString('ru-RU')} PUSH)` };
    }

    const timestamp = new Date().toISOString();
    card.balance -= amount;
    card.lastActivityDate = timestamp;
    this.cards.set(card.id, card);

    const txId = `tx_merch_${Date.now()}`;
    const tx: Transaction = {
      id: txId,
      cardId: card.id,
      cardNumber: card.cardNumber,
      fromCardNumber: card.cardNumber,
      toCardNumber: 'MERCHANT_GATEWAY',
      senderName: card.cardHolderName,
      recipientName: merchantName,
      amount,
      type: 'merchant_payment',
      description: `${merchantName}: ${description}`,
      createdAt: timestamp,
    };
    this.transactions.set(tx.id, tx);

    return {
      success: true,
      message: `Оплата на сумму ${amount.toLocaleString('ru-RU')} PUSH прошла успешно`,
      transactionId: txId,
      remainingBalance: card.balance,
      cardNumber: card.cardNumber,
    };
  }

  async createInvoice(
    merchantName: string,
    recipientCardNumber: string,
    amount: number,
    description: string,
    merchantUserId: string = ''
  ): Promise<Invoice> {
    const cleanCardNum = recipientCardNumber.replace(/\s+/g, '');
    const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const invoice: Invoice = {
      id,
      merchantUserId,
      merchantName: merchantName.trim() || 'Торговец НЯСР',
      recipientCardNumber: cleanCardNum,
      amount: Math.abs(Number(amount)),
      description: description.trim() || 'Оплата услуг / товаров',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    return this.invoices.get(invoiceId) || null;
  }

  async payInvoice(
    invoiceId: string,
    payerCardNumberRaw: string,
    cvv: string
  ): Promise<{ success: boolean; message: string; invoice?: Invoice; remainingBalance?: number }> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return { success: false, message: 'Счёт на оплату не найден' };
    if (invoice.status === 'paid') return { success: false, message: 'Этот счёт уже оплачен', invoice };
    if (invoice.status === 'cancelled') return { success: false, message: 'Этот счёт аннулирован', invoice };

    const payerCard = await this.getCardByNumber(payerCardNumberRaw);
    if (!payerCard) return { success: false, message: 'Карта плательщика не найдена' };
    if (payerCard.cvv !== cvv.trim()) return { success: false, message: 'Неверный CVV код карты' };
    if (payerCard.balance < invoice.amount) return { success: false, message: 'Недостаточно средств на карте' };

    const recipientCard = await this.getCardByNumber(invoice.recipientCardNumber);
    if (!recipientCard) return { success: false, message: 'Карта зачисления продавца не найдена' };

    const timestamp = new Date().toISOString();
    payerCard.balance -= invoice.amount;
    payerCard.lastActivityDate = timestamp;
    recipientCard.balance += invoice.amount;
    recipientCard.lastActivityDate = timestamp;

    invoice.status = 'paid';
    invoice.paidByCardNumber = payerCard.cardNumber;
    invoice.paidAt = timestamp;

    this.cards.set(payerCard.id, payerCard);
    this.cards.set(recipientCard.id, recipientCard);
    this.invoices.set(invoice.id, invoice);

    const payerTx: Transaction = {
      id: `tx_inv_out_${Date.now()}`,
      cardId: payerCard.id,
      cardNumber: payerCard.cardNumber,
      fromCardNumber: payerCard.cardNumber,
      toCardNumber: recipientCard.cardNumber,
      senderName: payerCard.cardHolderName,
      recipientName: invoice.merchantName,
      amount: invoice.amount,
      type: 'merchant_payment',
      description: `Оплата счета: ${invoice.description}`,
      createdAt: timestamp,
    };
    this.transactions.set(payerTx.id, payerTx);

    return {
      success: true,
      message: `Счёт на ${invoice.amount.toLocaleString('ru-RU')} PUSH успешно оплачен!`,
      invoice,
      remainingBalance: payerCard.balance,
    };
  }

  async getInvoicesByMerchantCard(cardNumber: string): Promise<Invoice[]> {
    const cleanNum = cardNumber.replace(/\s+/g, '');
    return Array.from(this.invoices.values())
      .filter((i) => i.recipientCardNumber === cleanNum)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async depositToCardByNumber(
    fromCardNumber: string,
    toCardNumber: string,
    amount: number,
    cvv?: string,
    senderName?: string,
    description?: string
  ): Promise<{ success: boolean; message: string; txId?: string; balance?: number }> {
    const fromCard = await this.getCardByNumber(fromCardNumber);
    const toCard = await this.getCardByNumber(toCardNumber);

    if (!fromCard) return { success: false, message: 'Карта списания не найдена' };
    if (!toCard) return { success: false, message: 'Карта зачисления не найдена' };

    if (cvv && fromCard.cvv !== cvv.trim()) {
      return { success: false, message: 'Неверный CVV код карты списания' };
    }

    if (fromCard.balance < amount) {
      return { success: false, message: 'Недостаточно средств на карте списания' };
    }

    const timestamp = new Date().toISOString();
    fromCard.balance -= amount;
    fromCard.lastActivityDate = timestamp;
    toCard.balance += amount;
    toCard.lastActivityDate = timestamp;

    this.cards.set(fromCard.id, fromCard);
    this.cards.set(toCard.id, toCard);

    const txId = `tx_dep_${Date.now()}`;
    const tx: Transaction = {
      id: txId,
      cardId: toCard.id,
      cardNumber: toCard.cardNumber,
      fromCardNumber: fromCard.cardNumber,
      toCardNumber: toCard.cardNumber,
      senderName: senderName || fromCard.cardHolderName,
      recipientName: toCard.cardHolderName,
      amount,
      type: 'transfer_in',
      description: description || 'Пополнение счета',
      createdAt: timestamp,
    };
    this.transactions.set(tx.id, tx);

    return {
      success: true,
      message: `Успешно переведено ${amount.toLocaleString('ru-RU')} PUSH`,
      txId,
      balance: toCard.balance,
    };
  }

  async getTransactionById(txId: string): Promise<Transaction | undefined> {
    return this.transactions.get(txId);
  }

  async getTreasuryStats(adminEmail: string): Promise<TreasuryStats> {
    const isMaster = isAdminEmail(adminEmail);
    const users = Array.from(this.users.values());
    const cards = Array.from(this.cards.values());

    const treasuryCard = cards.find((c) => c.cardType === 'treasury' || c.cardNumber === '450000000001');
    const treasuryBalance = treasuryCard ? treasuryCard.balance : 0;

    const citizenCards = cards.filter((c) => c.cardType !== 'treasury' && c.cardNumber !== '450000000001');
    const citizensTotalBalance = citizenCards.reduce((sum, c) => sum + c.balance, 0);

    const txs = Array.from(this.transactions.values());
    const taxTxs = txs.filter((t) => t.type === 'tax_inactivity');
    const totalTaxCollected = taxTxs.reduce((sum, t) => sum + t.amount, 0);

    const emissionTxs = txs
      .filter((t) => t.type === 'currency_emission')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const citizenList = users
      .filter((u) => !isAdminEmail(u.email))
      .map((u) => {
        const uCards = cards.filter((c) => c.userId === u.id);
        const totalBal = uCards.reduce((sum, c) => sum + c.balance, 0);
        return {
          userId: u.id,
          name: u.name,
          gameNickname: u.gameNickname,
          email: u.email,
          cards: uCards,
          totalBalance: totalBal,
          isEmployee: !!u.isEmployee,
          isAdmin: !!u.isAdmin,
        };
      })
      .sort((a, b) => b.totalBalance - a.totalBalance);

    return {
      totalCitizens: citizenList.length,
      citizensTotalBalance,
      treasuryBalance,
      totalMonetarySupply: treasuryBalance + citizensTotalBalance,
      totalTaxCollected,
      totalEmissionsCount: emissionTxs.length,
      citizens: isMaster ? citizenList : [],
      recentEmissions: isMaster ? emissionTxs.slice(0, 20) : [],
    };
  }

  async emitCurrency(req: CurrencyEmissionRequest) {
    if (!isAdminEmail(req.adminEmail)) {
      throw new Error('Только верховный администратор (Казначей) имеет право эмиссии валюты');
    }

    const amount = Number(req.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Сумма эмиссии должна быть больше 0');
    }

    let targetCard: BankCard | undefined;
    if (req.recipientCardNumber) {
      targetCard = await this.getCardByNumber(req.recipientCardNumber);
    }
    if (!targetCard) {
      targetCard = Array.from(this.cards.values()).find(
        (c) => c.cardType === 'treasury' || c.cardNumber === '450000000001'
      );
    }
    if (!targetCard) throw new Error('Карта для зачисления эмиссии не найдена');

    targetCard.balance += amount;
    targetCard.lastActivityDate = new Date().toISOString();
    this.cards.set(targetCard.id, targetCard);

    const tx: Transaction = {
      id: `tx_emit_${Date.now()}`,
      cardId: targetCard.id,
      cardNumber: targetCard.cardNumber,
      fromCardNumber: 'EMISSION_MINFIN_NYASR',
      toCardNumber: targetCard.cardNumber,
      senderName: 'Государственная Эмиссия (Минфин НЯСР)',
      recipientName: targetCard.cardHolderName,
      amount,
      type: 'currency_emission',
      description: `[Эмиссия Валюты] Выпущено ${amount.toLocaleString('ru-RU')} PUSH в обращение.`,
      createdAt: new Date().toISOString(),
    };
    this.transactions.set(tx.id, tx);

    return {
      success: true,
      message: `Государственная эмиссия успешно проведена! Выпущено ${amount.toLocaleString('ru-RU')} PUSH на карту ${targetCard.cardNumber}`,
      newBalance: targetCard.balance,
      recipientCardNumber: targetCard.cardNumber,
      transaction: tx,
    };
  }

  async toggleEmployee(adminEmail: string, targetUserId: string, makeEmployee: boolean) {
    if (!isAdminEmail(adminEmail)) throw new Error('Только администратор может управлять персоналом');
    const user = this.users.get(targetUserId);
    if (!user) throw new Error('Пользователь не найден');
    user.isEmployee = makeEmployee;
    this.users.set(user.id, user);
    return { success: true };
  }

  async staffToggleFreeze(staffEmail: string, cardId: string, freeze: boolean) {
    if (!(await isStaffEmail(staffEmail))) throw new Error('Нет прав для изменения статуса карты');
    const card = this.cards.get(cardId);
    if (!card) throw new Error('Карта не найдена');

    if (freeze) {
      const until = new Date();
      until.setFullYear(until.getFullYear() + 100);
      card.isFrozen = true;
      card.frozenUntil = until.toISOString();
      card.status = 'frozen';
      card.frozenAt = new Date().toISOString();
    } else {
      card.isFrozen = false;
      card.frozenUntil = undefined;
      card.status = 'active';
    }
    this.cards.set(card.id, card);
    return { success: true };
  }
}

export const inMemoryDb = new InMemoryDatabase();

// Helper to run with timeout
async function withTimeout<T>(promise: Promise<T>, ms: number = 3000): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Database operation timed out')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Resilient Composite DB Service with automatic fallback to inMemoryDb
export const dbService = {
  async getUsers(): Promise<User[]> {
    if (isFirebaseConfigured) {
      try {
        const res = await withTimeout(firebaseDbService.getUsers());
        if (res && res.length > 0) return res;
      } catch (err) {
        console.warn('[Database] Supabase getUsers error, using built-in storage:', err);
      }
    }
    return inMemoryDb.getUsers();
  },

  async getUserByNickname(nickname: string): Promise<User | undefined> {
    if (isFirebaseConfigured) {
      try {
        const res = await withTimeout(firebaseDbService.getUserByNickname(nickname));
        if (res) return res;
      } catch (err) {
        console.warn('[Database] Supabase getUserByNickname error, using built-in storage:', err);
      }
    }
    return inMemoryDb.getUserByNickname(nickname);
  },

  async loginWithPassword(
    username: string,
    password: string
  ): Promise<{ user: User; cards: BankCard[] } | null> {
    if (isFirebaseConfigured) {
      try {
        const res = await withTimeout(firebaseDbService.loginWithPassword(username, password));
        if (res && res.user) return res;
      } catch (err) {
        console.warn('[Database] Supabase loginWithPassword error, using built-in storage:', err);
      }
    }
    return inMemoryDb.loginWithPassword(username, password);
  },

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    if (isFirebaseConfigured) {
      try {
        const res = await withTimeout(firebaseDbService.getUserByGoogleId(googleId));
        if (res) return res;
      } catch (err) {
        console.warn('[Database] Supabase getUserByGoogleId error, using built-in storage:', err);
      }
    }
    return inMemoryDb.getUserByGoogleId(googleId);
  },

  async loginGoogleUser(googleUser: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<{ user: User; cards: BankCard[] } | null> {
    if (isFirebaseConfigured) {
      try {
        const res = await withTimeout(firebaseDbService.loginGoogleUser(googleUser));
        if (res && res.user) return res;
      } catch (err) {
        console.warn('[Database] Supabase loginGoogleUser error, using built-in storage:', err);
      }
    }
    return inMemoryDb.loginGoogleUser(googleUser);
  },

  async getUserById(id: string): Promise<User | undefined> {
    if (isFirebaseConfigured) {
      try {
        const res = await withTimeout(firebaseDbService.getUserById(id));
        if (res) return res;
      } catch (err) {
        console.warn('[Database] Supabase getUserById error, using built-in storage:', err);
      }
    }
    return inMemoryDb.getUserById(id);
  },

  async getCards(): Promise<BankCard[]> {
    if (isFirebaseConfigured) {
      try {
        const res = await withTimeout(firebaseDbService.getCards());
        if (res && res.length > 0) return res;
      } catch (err) {
        console.warn('[Database] Supabase getCards error, using built-in storage:', err);
      }
    }
    return inMemoryDb.getCards();
  },

  async getCardsByUserId(userId: string): Promise<BankCard[]> {
    if (isFirebaseConfigured) {
      try {
        const res = await withTimeout(firebaseDbService.getCardsByUserId(userId));
        if (res && res.length > 0) return res;
      } catch (err) {
        console.warn('[Database] Supabase getCardsByUserId error, using built-in storage:', err);
      }
    }
    return inMemoryDb.getCardsByUserId(userId);
  },

  async getCardByNumber(cardNumber: string): Promise<BankCard | undefined> {
    if (isFirebaseConfigured) {
      try {
        const res = await withTimeout(firebaseDbService.getCardByNumber(cardNumber));
        if (res) return res;
      } catch (err) {
        console.warn('[Database] Supabase getCardByNumber error, using built-in storage:', err);
      }
    }
    return inMemoryDb.getCardByNumber(cardNumber);
  },

  async checkAndApplyInactivityTax(card: BankCard): Promise<BankCard> {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.checkAndApplyInactivityTax(card));
      } catch (err) {
        console.warn('[Database] Supabase checkAndApplyInactivityTax error, using built-in storage:', err);
      }
    }
    return inMemoryDb.checkAndApplyInactivityTax(card);
  },

  async freezeCard(
    cardId: string,
    days: number
  ): Promise<{ success: boolean; message: string; updatedCard?: BankCard }> {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.freezeCard(cardId, days));
      } catch (err) {
        console.warn('[Database] Supabase freezeCard error, using built-in storage:', err);
      }
    }
    return inMemoryDb.freezeCard(cardId, days);
  },

  async simulateInactivity(
    cardId: string,
    days: number = 7
  ): Promise<{
    success: boolean;
    message: string;
    updatedCard?: BankCard;
    taxApplied?: boolean;
    taxAmount?: number;
  }> {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.simulateInactivity(cardId, days));
      } catch (err) {
        console.warn('[Database] Supabase simulateInactivity error, using built-in storage:', err);
      }
    }
    return inMemoryDb.simulateInactivity(cardId, days);
  },

  async getTransactionsByCardNumber(cardNumber: string): Promise<Transaction[]> {
    if (isFirebaseConfigured) {
      try {
        const res = await withTimeout(firebaseDbService.getTransactionsByCardNumber(cardNumber));
        if (res) return res;
      } catch (err) {
        console.warn('[Database] Supabase getTransactionsByCardNumber error, using built-in storage:', err);
      }
    }
    return inMemoryDb.getTransactionsByCardNumber(cardNumber);
  },

  async getCreditsByCardId(cardId: string): Promise<CreditLoan[]> {
    if (isFirebaseConfigured) {
      try {
        const res = await withTimeout(firebaseDbService.getCreditsByCardId(cardId));
        if (res) return res;
      } catch (err) {
        console.warn('[Database] Supabase getCreditsByCardId error, using built-in storage:', err);
      }
    }
    return inMemoryDb.getCreditsByCardId(cardId);
  },

  async loginOrRegisterWithGoogle(googleData: any): Promise<{ user: User; card: BankCard }> {
    if (isFirebaseConfigured) {
      try {
        const res = await withTimeout(firebaseDbService.loginOrRegisterWithGoogle(googleData));
        if (res && res.user && res.card) return res;
      } catch (err) {
        console.warn('[Database] Supabase loginOrRegisterWithGoogle error, using built-in storage:', err);
      }
    }
    return inMemoryDb.loginOrRegisterWithGoogle(googleData);
  },

  async registerUserAndIssueCard(
    gameNickname: string,
    cardType: CardType,
    password?: string
  ): Promise<{ user: User; card: BankCard }> {
    if (isFirebaseConfigured) {
      try {
        const res = await withTimeout(firebaseDbService.registerUserAndIssueCard(gameNickname, cardType, password));
        if (res && res.user && res.card) return res;
      } catch (err) {
        console.warn('[Database] Supabase registerUserAndIssueCard error, using built-in storage:', err);
      }
    }
    return inMemoryDb.registerUserAndIssueCard(gameNickname, cardType, password);
  },

  async transferMoney(
    fromCardNumRaw: string,
    toCardNumRaw: string,
    amount: number,
    note?: string
  ): Promise<{ success: boolean; message: string; senderCard?: BankCard; recipientCard?: BankCard }> {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.transferMoney(fromCardNumRaw, toCardNumRaw, amount, note));
      } catch (err) {
        console.warn('[Database] Supabase transferMoney error, using built-in storage:', err);
      }
    }
    return inMemoryDb.transferMoney(fromCardNumRaw, toCardNumRaw, amount, note);
  },

  async applyCredit(
    cardId: string,
    amount: number,
    termMonths: number = 12
  ): Promise<{ success: boolean; message: string; loan?: CreditLoan; updatedCard?: BankCard }> {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.applyCredit(cardId, amount, termMonths));
      } catch (err) {
        console.warn('[Database] Supabase applyCredit error, using built-in storage:', err);
      }
    }
    return inMemoryDb.applyCredit(cardId, amount, termMonths);
  },

  async repayCredit(
    creditId: string,
    repayAmount: number
  ): Promise<{ success: boolean; message: string; updatedCard?: BankCard; updatedCredit?: CreditLoan }> {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.repayCredit(creditId, repayAmount));
      } catch (err) {
        console.warn('[Database] Supabase repayCredit error, using built-in storage:', err);
      }
    }
    return inMemoryDb.repayCredit(creditId, repayAmount);
  },

  async processMerchantCharge(
    cardNumberRaw: string,
    cvv: string,
    amount: number,
    merchantName: string = 'Внешний Магазин НЯСР',
    description: string = 'Оплата на сайте партнера'
  ): Promise<MerchantChargeResponse> {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.processMerchantCharge(cardNumberRaw, cvv, amount, merchantName, description));
      } catch (err) {
        console.warn('[Database] Supabase processMerchantCharge error, using built-in storage:', err);
      }
    }
    return inMemoryDb.processMerchantCharge(cardNumberRaw, cvv, amount, merchantName, description);
  },

  async createInvoice(
    merchantName: string,
    recipientCardNumber: string,
    amount: number,
    description: string,
    merchantUserId: string = ''
  ): Promise<Invoice> {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.createInvoice(merchantName, recipientCardNumber, amount, description, merchantUserId));
      } catch (err) {
        console.warn('[Database] Supabase createInvoice error, using built-in storage:', err);
      }
    }
    return inMemoryDb.createInvoice(merchantName, recipientCardNumber, amount, description, merchantUserId);
  },

  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.getInvoiceById(invoiceId));
      } catch (err) {
        console.warn('[Database] Supabase getInvoiceById error, using built-in storage:', err);
      }
    }
    return inMemoryDb.getInvoiceById(invoiceId);
  },

  async payInvoice(
    invoiceId: string,
    payerCardNumberRaw: string,
    cvv: string
  ): Promise<{ success: boolean; message: string; invoice?: Invoice; remainingBalance?: number }> {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.payInvoice(invoiceId, payerCardNumberRaw, cvv));
      } catch (err) {
        console.warn('[Database] Supabase payInvoice error, using built-in storage:', err);
      }
    }
    return inMemoryDb.payInvoice(invoiceId, payerCardNumberRaw, cvv);
  },

  async getInvoicesByMerchantCard(cardNumber: string): Promise<Invoice[]> {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.getInvoicesByMerchantCard(cardNumber));
      } catch (err) {
        console.warn('[Database] Supabase getInvoicesByMerchantCard error, using built-in storage:', err);
      }
    }
    return inMemoryDb.getInvoicesByMerchantCard(cardNumber);
  },

  async depositToCardByNumber(
    fromCardNumber: string,
    toCardNumber: string,
    amount: number,
    cvv?: string,
    senderName?: string,
    description?: string
  ): Promise<{ success: boolean; message: string; txId?: string; balance?: number }> {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.depositToCardByNumber(fromCardNumber, toCardNumber, amount, cvv, senderName, description));
      } catch (err) {
        console.warn('[Database] Supabase depositToCardByNumber error, using built-in storage:', err);
      }
    }
    return inMemoryDb.depositToCardByNumber(fromCardNumber, toCardNumber, amount, cvv, senderName, description);
  },

  async getTransactionById(txId: string): Promise<Transaction | undefined> {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.getTransactionById(txId));
      } catch (err) {
        console.warn('[Database] Supabase getTransactionById error, using built-in storage:', err);
      }
    }
    return inMemoryDb.getTransactionById(txId);
  },

  async getTreasuryStats(adminEmail: string): Promise<TreasuryStats> {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.getTreasuryStats(adminEmail));
      } catch (err) {
        console.warn('[Database] Supabase getTreasuryStats error, using built-in storage:', err);
      }
    }
    return inMemoryDb.getTreasuryStats(adminEmail);
  },

  async emitCurrency(req: CurrencyEmissionRequest) {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.emitCurrency(req));
      } catch (err) {
        console.warn('[Database] Supabase emitCurrency error, using built-in storage:', err);
      }
    }
    return inMemoryDb.emitCurrency(req);
  },

  async toggleEmployee(adminEmail: string, targetUserId: string, makeEmployee: boolean) {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.toggleEmployee(adminEmail, targetUserId, makeEmployee));
      } catch (err) {
        console.warn('[Database] Supabase toggleEmployee error, using built-in storage:', err);
      }
    }
    return inMemoryDb.toggleEmployee(adminEmail, targetUserId, makeEmployee);
  },

  async staffToggleFreeze(staffEmail: string, cardId: string, freeze: boolean) {
    if (isFirebaseConfigured) {
      try {
        return await withTimeout(firebaseDbService.staffToggleFreeze(staffEmail, cardId, freeze));
      } catch (err) {
        console.warn('[Database] Supabase staffToggleFreeze error, using built-in storage:', err);
      }
    }
    return inMemoryDb.staffToggleFreeze(staffEmail, cardId, freeze);
  },
};

