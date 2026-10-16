import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Firestore,
} from 'firebase/firestore';
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

export const ADMIN_EMAILS = [
  'aatal6022@gmail.com',
  'pinkiscammerinfo@gmail.com',
];

export function isAdminEmail(email?: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((adm) => adm.toLowerCase() === clean);
}

// Load Firebase Config
let firebaseConfig: any = null;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn('[Firebase] Could not read firebase-applet-config.json:', e);
}

const firebaseApp = firebaseConfig
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firestore: Firestore | null = firebaseApp && firebaseConfig?.firestoreDatabaseId
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : firebaseApp
  ? getFirestore(firebaseApp)
  : null;

export const isFirebaseConfigured = Boolean(firestore && firebaseConfig?.apiKey);

if (isFirebaseConfigured) {
  console.log(`[Firebase] Firestore initialized on project: ${firebaseConfig.projectId}, db: ${firebaseConfig.firestoreDatabaseId}`);
} else {
  console.warn('[Firebase] Firestore not fully configured, fallback active');
}

class FirebaseDatabaseService {
  private seeded = false;

  constructor() {
    this.seedInitialData();
  }

  async seedInitialData() {
    if (!firestore || this.seeded) return;
    this.seeded = true;

    try {
      const treasuryDoc = await getDoc(doc(firestore, 'cards', 'crd_treasury'));
      if (treasuryDoc.exists()) {
        return; // Already initialized
      }

      console.log('[Firebase] Seeding initial Treasury and demo accounts into Firestore...');

      // 1. Supreme Admin user (for current user account aatal6022@gmail.com)
      const adminUser: User = {
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

      // 2. Secondary Admin (legacy pinkiscammerinfo@gmail.com)
      const legacyAdminUser: User = {
        id: 'usr_legacy_admin',
        email: 'pinkiscammerinfo@gmail.com',
        password: 'admin',
        name: 'Главный Казначей НЯСР',
        gameNickname: 'КАЗНА НЯСР',
        avatar: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=100&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
        isAdmin: true,
        isEmployee: true,
      };

      // 3. Demo citizen user Ivan
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

      // 4. Treasury Card (1,000,000,000 PUSH, Gold, CVV 777)
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

      // 5. Citizen Card (75,000 PUSH, White, CVV 123)
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

      // 6. Initial subsidy transaction
      const initTx: Transaction = {
        id: 'tx_init_1',
        cardId: 'crd_ivan',
        cardNumber: '450088889999',
        fromCardNumber: '450000000001',
        toCardNumber: '450088889999',
        senderName: 'Казна Государства Пушленд',
        recipientName: 'Иван Гражданин',
        amount: 75000,
        type: 'transfer_in',
        description: 'Подъемные субсидии от Минфина виртуальной страны Пушленд',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      };

      await setDoc(doc(firestore, 'users', adminUser.id), adminUser);
      await setDoc(doc(firestore, 'users', legacyAdminUser.id), legacyAdminUser);
      await setDoc(doc(firestore, 'users', ivanUser.id), ivanUser);
      await setDoc(doc(firestore, 'cards', govtCard.id), govtCard);
      await setDoc(doc(firestore, 'cards', ivanCard.id), ivanCard);
      await setDoc(doc(firestore, 'transactions', initTx.id), initTx);

      console.log('[Firebase] Seed data successfully committed to Firestore.');
    } catch (e: any) {
      console.warn('[Firebase] Seeding error (non-fatal):', e.message);
    }
  }

  private generate12DigitCardNumber(existingNumbers: Set<string>): string {
    let num = '';
    let exists = true;
    while (exists) {
      const rand8 = Math.floor(10000000 + Math.random() * 90000000).toString();
      num = `4500${rand8}`;
      exists = existingNumbers.has(num);
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
    if (!firestore) return [];
    const snapshot = await getDocs(collection(firestore, 'users'));
    return snapshot.docs.map((d) => d.data() as User);
  }

  async getUserById(id: string): Promise<User | undefined> {
    if (!firestore) return undefined;
    const docSnap = await getDoc(doc(firestore, 'users', id));
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
    return undefined;
  }

  async getUserByNickname(nickname: string): Promise<User | undefined> {
    if (!firestore) return undefined;
    const clean = nickname.trim().toUpperCase();
    const allUsers = await this.getUsers();
    return allUsers.find(
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

    // 1. Check if input is a 12-digit card number
    if (/^\d{12}$/.test(cleanInput.replace(/\s+/g, ''))) {
      const card = await this.getCardByNumber(cleanInput);
      if (card && firestore) {
        const uDoc = await getDoc(doc(firestore, 'users', card.userId));
        if (uDoc.exists()) {
          user = uDoc.data() as User;
        }
      }
    }

    // 2. Check by nickname/email
    if (!user) {
      user = await this.getUserByNickname(cleanInput);
    }

    if (!user) return null;

    // Check password
    if (user.password && user.password !== password) {
      return null;
    }

    // Grant admin if matches
    if (isAdminEmail(user.email)) {
      user.isAdmin = true;
      user.isEmployee = true;
    }

    const cards = await this.getCardsByUserId(user.id);
    return { user, cards };
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    if (!firestore) return undefined;
    const q = query(collection(firestore, 'users'), where('googleId', '==', googleId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as User;
    }
    return undefined;
  }

  async loginGoogleUser(googleUser: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<{ user: User; cards: BankCard[] } | null> {
    if (!firestore) return null;

    let user = await this.getUserByGoogleId(googleUser.googleId);
    if (!user && googleUser.email) {
      const allUsers = await this.getUsers();
      user = allUsers.find((u) => u.email?.toLowerCase() === googleUser.email.toLowerCase());
    }

    if (!user) return null;

    if (isAdminEmail(user.email) || isAdminEmail(googleUser.email)) {
      user.isAdmin = true;
      user.isEmployee = true;
    }

    const cards = await this.getCardsByUserId(user.id);
    return { user, cards };
  }

  async loginOrRegisterWithGoogle(googleUser: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<{ user: User; card: BankCard }> {
    const existing = await this.loginGoogleUser(googleUser);
    if (existing && existing.user && existing.cards.length > 0) {
      return { user: existing.user, card: existing.cards[0] };
    }

    // If user exists without cards, issue a card
    if (existing && existing.user) {
      const allCards = await this.getCards();
      const existingNums = new Set(allCards.map((c) => c.cardNumber));
      const isAd = isAdminEmail(existing.user.email);
      const cardType: CardType = isAd ? 'treasury' : 'regular';
      const color: CardColor = isAd ? 'gold' : 'white';

      const newCard: BankCard = {
        id: `crd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: existing.user.id,
        cardNumber: this.generate12DigitCardNumber(existingNums),
        cardHolderName: existing.user.gameNickname || existing.user.name,
        cardType,
        color,
        balance: isAd ? 1000000000 : 50000,
        issueDate: this.formatIssueDate(),
        cvv: this.generateCVV(),
        status: 'active',
        createdAt: new Date().toISOString(),
        lastActivityDate: new Date().toISOString(),
      };

      if (firestore) {
        await setDoc(doc(firestore, 'cards', newCard.id), newCard);
      }
      return { user: existing.user, card: newCard };
    }

    // Register fresh user
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isAd = isAdminEmail(googleUser.email);
    const newUser: User = {
      id: userId,
      email: googleUser.email,
      googleId: googleUser.googleId,
      name: googleUser.name,
      gameNickname: googleUser.name.toUpperCase(),
      avatar:
        googleUser.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      isAdmin: isAd,
      isEmployee: isAd,
    };

    const allCards = await this.getCards();
    const existingNums = new Set(allCards.map((c) => c.cardNumber));
    const cardType: CardType = isAd ? 'treasury' : 'regular';
    const color: CardColor = isAd ? 'gold' : 'white';

    const newCard: BankCard = {
      id: `crd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: newUser.id,
      cardNumber: this.generate12DigitCardNumber(existingNums),
      cardHolderName: newUser.gameNickname,
      cardType,
      color,
      balance: isAd ? 1000000000 : 50000,
      issueDate: this.formatIssueDate(),
      cvv: this.generateCVV(),
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActivityDate: new Date().toISOString(),
    };

    if (firestore) {
      await setDoc(doc(firestore, 'users', newUser.id), newUser);
      await setDoc(doc(firestore, 'cards', newCard.id), newCard);
    }

    return { user: newUser, card: newCard };
  }

  async registerUserAndIssueCard(
    gameNickname: string,
    cardType: CardType = 'regular',
    password?: string
  ): Promise<{ user: User; card: BankCard }> {
    const cleanNick = gameNickname.trim();
    if (!cleanNick) {
      throw new Error('Имя игрока обязательно для регистрации карты');
    }

    const existingUser = await this.getUserByNickname(cleanNick);
    let user = existingUser;

    const allCards = await this.getCards();
    const existingNums = new Set(allCards.map((c) => c.cardNumber));

    if (!user) {
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      user = {
        id: userId,
        name: cleanNick,
        gameNickname: cleanNick,
        password: password || undefined,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
        isAdmin: false,
        isEmployee: false,
      };

      if (firestore) {
        await setDoc(doc(firestore, 'users', user.id), user);
      }
    } else if (password && !user.password) {
      user.password = password;
      if (firestore) {
        await updateDoc(doc(firestore, 'users', user.id), { password });
      }
    }

    let color: CardColor = 'white';
    let balance = 50000;

    if (cardType === 'business') {
      color = 'black';
      balance = 100000;
    } else if (cardType === 'treasury') {
      color = 'gold';
      balance = 1000000000;
      user.isAdmin = true;
      user.isEmployee = true;
      if (firestore) {
        await updateDoc(doc(firestore, 'users', user.id), { isAdmin: true, isEmployee: true });
      }
    }

    const newCard: BankCard = {
      id: `crd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      cardNumber: this.generate12DigitCardNumber(existingNums),
      cardHolderName: cleanNick.toUpperCase(),
      cardType,
      color,
      balance,
      issueDate: this.formatIssueDate(),
      cvv: this.generateCVV(),
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActivityDate: new Date().toISOString(),
    };

    if (firestore) {
      await setDoc(doc(firestore, 'cards', newCard.id), newCard);
    }

    return { user, card: newCard };
  }

  async getCards(): Promise<BankCard[]> {
    if (!firestore) return [];
    const snapshot = await getDocs(collection(firestore, 'cards'));
    return snapshot.docs.map((d) => d.data() as BankCard);
  }

  async getCardsByUserId(userId: string): Promise<BankCard[]> {
    if (!firestore) return [];
    const q = query(collection(firestore, 'cards'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as BankCard);
  }

  async getCardByNumber(cardNumber: string): Promise<BankCard | undefined> {
    if (!firestore) return undefined;
    const clean = cardNumber.replace(/\s+/g, '');
    const q = query(collection(firestore, 'cards'), where('cardNumber', '==', clean));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as BankCard;
    }
    return undefined;
  }

  async transferMoney(
    fromCardNumber: string,
    toCardNumber: string,
    amount: number,
    note?: string
  ): Promise<{ success: boolean; message: string; fromCard?: BankCard; toCard?: BankCard }> {
    if (!firestore) return { success: false, message: 'База данных недоступна' };

    const fromClean = fromCardNumber.replace(/\s+/g, '');
    const toClean = toCardNumber.replace(/\s+/g, '');

    if (fromClean === toClean) {
      return { success: false, message: 'Нельзя перевести средства на ту же самую карту' };
    }

    if (amount <= 0) {
      return { success: false, message: 'Сумма перевода должна быть больше нуля' };
    }

    const fromCard = await this.getCardByNumber(fromClean);
    const toCard = await this.getCardByNumber(toClean);

    if (!fromCard) {
      return { success: false, message: 'Карта отправителя не найдена' };
    }
    if (!toCard) {
      return { success: false, message: 'Карта получателя не найдена' };
    }

    if (fromCard.status === 'frozen' || fromCard.isFrozen) {
      return { success: false, message: 'Карта отправителя заморожена в соответствии с Указом №2' };
    }
    if (toCard.status === 'frozen' || toCard.isFrozen) {
      return { success: false, message: 'Карта получателя заморожена в соответствии с Указом №2' };
    }

    if (fromCard.balance < amount) {
      return {
        success: false,
        message: `Недостаточно средств. Ваш баланс: ${fromCard.balance.toLocaleString('ru-RU')} PUSH`,
      };
    }

    const updatedFromBalance = fromCard.balance - amount;
    const updatedToBalance = toCard.balance + amount;
    const nowIso = new Date().toISOString();

    fromCard.balance = updatedFromBalance;
    fromCard.lastActivityDate = nowIso;
    toCard.balance = updatedToBalance;
    toCard.lastActivityDate = nowIso;

    await updateDoc(doc(firestore, 'cards', fromCard.id), {
      balance: updatedFromBalance,
      lastActivityDate: nowIso,
    });

    await updateDoc(doc(firestore, 'cards', toCard.id), {
      balance: updatedToBalance,
      lastActivityDate: nowIso,
    });

    // Create transactions for sender and receiver
    const txOut: Transaction = {
      id: `tx_${Date.now()}_out`,
      cardId: fromCard.id,
      cardNumber: fromCard.cardNumber,
      fromCardNumber: fromCard.cardNumber,
      toCardNumber: toCard.cardNumber,
      senderName: fromCard.cardHolderName,
      recipientName: toCard.cardHolderName,
      amount,
      type: 'transfer_out',
      description: note || `Перевод на карту ${toCard.cardNumber}`,
      createdAt: nowIso,
    };

    const txIn: Transaction = {
      id: `tx_${Date.now()}_in`,
      cardId: toCard.id,
      cardNumber: toCard.cardNumber,
      fromCardNumber: fromCard.cardNumber,
      toCardNumber: toCard.cardNumber,
      senderName: fromCard.cardHolderName,
      recipientName: toCard.cardHolderName,
      amount,
      type: 'transfer_in',
      description: note || `Перевод от ${fromCard.cardHolderName}`,
      createdAt: nowIso,
    };

    await setDoc(doc(firestore, 'transactions', txOut.id), txOut);
    await setDoc(doc(firestore, 'transactions', txIn.id), txIn);

    return {
      success: true,
      message: `Успешно переведено ${amount.toLocaleString('ru-RU')} PUSH на карту ${toCard.cardNumber}`,
      fromCard,
      toCard,
    };
  }

  async depositToCardByNumber(
    fromCardNumber: string,
    toCardNumber: string,
    amount: number,
    cvv?: string,
    senderName?: string,
    description?: string
  ): Promise<{ success: boolean; message: string; card?: BankCard; transactionId?: string; balance?: number }> {
    if (!firestore) return { success: false, message: 'База данных недоступна' };

    const fromClean = fromCardNumber.replace(/\s+/g, '');
    const toClean = toCardNumber.replace(/\s+/g, '');

    const fromCard = await this.getCardByNumber(fromClean);
    const toCard = await this.getCardByNumber(toClean);

    if (!fromCard) {
      return { success: false, message: `Карта списания ${fromClean} не существует в Банке Пушленда` };
    }
    if (!toCard) {
      return { success: false, message: `Карта получателя ${toClean} не найдена в Банке Пушленда` };
    }

    if (cvv && fromCard.cvv !== String(cvv).trim()) {
      return { success: false, message: 'Неверный CVV код карты списания' };
    }

    if (fromCard.balance < amount) {
      return {
        success: false,
        message: `Недостаточно средств на карте списания. Баланс: ${fromCard.balance.toLocaleString('ru-RU')} PUSH`,
      };
    }

    const nowIso = new Date().toISOString();
    const updatedFromBal = fromCard.balance - amount;
    const updatedToBal = toCard.balance + amount;

    await updateDoc(doc(firestore, 'cards', fromCard.id), {
      balance: updatedFromBal,
      lastActivityDate: nowIso,
    });

    await updateDoc(doc(firestore, 'cards', toCard.id), {
      balance: updatedToBal,
      lastActivityDate: nowIso,
    });

    toCard.balance = updatedToBal;

    const txId = `tx_${Date.now()}_api`;
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
      description: description || `Пополнение через API от ${fromCard.cardHolderName}`,
      createdAt: nowIso,
    };

    await setDoc(doc(firestore, 'transactions', tx.id), tx);

    return {
      success: true,
      message: `Успешно переведено ${amount.toLocaleString('ru-RU')} PUSH на карту ${toCard.cardNumber}`,
      card: toCard,
      transactionId: txId,
      balance: updatedToBal,
    };
  }

  async processMerchantCharge(
    cardNumber: string,
    cvv: string,
    amount: number,
    merchantName: string,
    description: string
  ): Promise<MerchantChargeResponse> {
    if (!firestore) return { success: false, message: 'База данных недоступна' };

    const card = await this.getCardByNumber(cardNumber);
    if (!card) {
      return { success: false, message: 'Карта плательщика не найдена' };
    }

    if (card.cvv !== String(cvv).trim()) {
      return { success: false, message: 'Неверный CVV код карты' };
    }

    if (card.status === 'frozen' || card.isFrozen) {
      return { success: false, message: 'Карта заморожена. Операции заблокированы' };
    }

    if (card.balance < amount) {
      return {
        success: false,
        message: `Недостаточно средств. Баланс: ${card.balance.toLocaleString('ru-RU')} PUSH`,
      };
    }

    const newBal = card.balance - amount;
    const nowIso = new Date().toISOString();
    card.balance = newBal;
    card.lastActivityDate = nowIso;

    await updateDoc(doc(firestore, 'cards', card.id), {
      balance: newBal,
      lastActivityDate: nowIso,
    });

    const txId = `tx_charge_${Date.now()}`;
    const tx: Transaction = {
      id: txId,
      cardId: card.id,
      cardNumber: card.cardNumber,
      fromCardNumber: card.cardNumber,
      toCardNumber: 'MERCHANT_ACQ',
      senderName: card.cardHolderName,
      recipientName: merchantName,
      amount,
      type: 'transfer_out',
      description: `Оплата в «${merchantName}»: ${description}`,
      createdAt: nowIso,
    };

    await setDoc(doc(firestore, 'transactions', tx.id), tx);

    return {
      success: true,
      transactionId: txId,
      message: `Оплата на сумму ${amount.toLocaleString('ru-RU')} PUSH успешно проведена`,
      remainingBalance: newBal,
      cardNumber: card.cardNumber,
    };
  }

  async freezeCard(cardId: string, days: number): Promise<{ success: boolean; message: string; card?: BankCard }> {
    if (!firestore) return { success: false, message: 'База данных недоступна' };

    const cards = await this.getCards();
    const card = cards.find((c) => c.id === cardId || c.cardNumber === cardId);
    if (!card) {
      return { success: false, message: 'Карта не найдена' };
    }

    if (days < 14) {
      return {
        success: false,
        message: 'По Указу Пушленда №2 минимальный срок заморозки счета составляет 14 дней!',
      };
    }

    const now = Date.now();
    const frozenUntil = new Date(now + days * 86400000).toISOString();
    const frozenAt = new Date(now).toISOString();

    card.isFrozen = true;
    card.status = 'frozen';
    card.freezeDays = days;
    card.frozenAt = frozenAt;
    card.frozenUntil = frozenUntil;

    await updateDoc(doc(firestore, 'cards', card.id), {
      isFrozen: true,
      status: 'frozen',
      freezeDays: days,
      frozenAt,
      frozenUntil,
    });

    return {
      success: true,
      message: `Счет карты ${card.cardNumber} заморожен на ${days} дней (до ${new Date(frozenUntil).toLocaleDateString('ru-RU')}). Налог на бездействие приостановлен.`,
      card,
    };
  }

  async checkAndApplyInactivityTax(card: BankCard): Promise<BankCard> {
    if (!firestore) return card;
    if (card.isFrozen || card.cardType === 'treasury' || card.balance <= 0) {
      return card;
    }

    const now = Date.now();
    const lastAct = new Date(card.lastActivityDate || card.createdAt).getTime();
    const diffDays = Math.floor((now - lastAct) / 86400000);

    if (diffDays >= 7) {
      const tax = Math.max(1, Math.round(card.balance * 0.07));
      card.balance = Math.max(0, card.balance - tax);
      card.lastActivityDate = new Date(now).toISOString();

      await updateDoc(doc(firestore, 'cards', card.id), {
        balance: card.balance,
        lastActivityDate: card.lastActivityDate,
      });

      // Transfer tax into Treasury card
      const treasury = (await this.getCards()).find((c) => c.cardType === 'treasury');
      if (treasury) {
        treasury.balance += tax;
        await updateDoc(doc(firestore, 'cards', treasury.id), {
          balance: treasury.balance,
        });
      }

      const tx: Transaction = {
        id: `tx_tax_${Date.now()}`,
        cardId: card.id,
        cardNumber: card.cardNumber,
        fromCardNumber: card.cardNumber,
        toCardNumber: '450000000001',
        senderName: card.cardHolderName,
        recipientName: 'Казна Пушленда',
        amount: tax,
        type: 'tax_inactivity',
        description: `Списание налога на бездействие 7% (${diffDays} дней неактивности)`,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(firestore, 'transactions', tx.id), tx);
    }

    return card;
  }

  async simulateInactivity(cardId: string, days: number): Promise<{ success: boolean; message: string; card?: BankCard }> {
    if (!firestore) return { success: false, message: 'База данных недоступна' };

    const cards = await this.getCards();
    const card = cards.find((c) => c.id === cardId || c.cardNumber === cardId);
    if (!card) {
      return { success: false, message: 'Карта не найдена' };
    }

    const simulatedDate = new Date(Date.now() - days * 86400000).toISOString();
    card.lastActivityDate = simulatedDate;

    await updateDoc(doc(firestore, 'cards', card.id), {
      lastActivityDate: simulatedDate,
    });

    return {
      success: true,
      message: `Установлена неактивность ${days} дней для карты ${card.cardNumber}`,
      card,
    };
  }

  async applyCredit(cardId: string, amount: number, termMonths: number = 12): Promise<{ success: boolean; message: string; loan?: CreditLoan; updatedBalance?: number }> {
    if (!firestore) return { success: false, message: 'База данных недоступна' };

    const cards = await this.getCards();
    const card = cards.find((c) => c.id === cardId || c.cardNumber === cardId);
    if (!card) {
      return { success: false, message: 'Карта не найдена' };
    }

    if (card.isFrozen) {
      return { success: false, message: 'Нельзя оформить кредит на замороженную карту' };
    }

    const interestRate = 5;
    const totalRepay = Math.round(amount * (1 + interestRate / 100));
    const monthlyPayment = Math.round(totalRepay / termMonths);

    const loan: CreditLoan = {
      id: `loan_${Date.now()}`,
      cardId: card.id,
      principal: amount,
      interestRate,
      totalRepayAmount: totalRepay,
      remainingAmount: totalRepay,
      monthlyPayment,
      termMonths,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const newBal = card.balance + amount;
    card.balance = newBal;
    card.lastActivityDate = new Date().toISOString();

    await updateDoc(doc(firestore, 'cards', card.id), {
      balance: newBal,
      lastActivityDate: card.lastActivityDate,
    });

    await setDoc(doc(firestore, 'credits', loan.id), loan);

    const tx: Transaction = {
      id: `tx_loan_${Date.now()}`,
      cardId: card.id,
      cardNumber: card.cardNumber,
      fromCardNumber: '450000000001',
      toCardNumber: card.cardNumber,
      senderName: 'Кредитный фонд ПИСЮН БАНКА',
      recipientName: card.cardHolderName,
      amount,
      type: 'credit_draw',
      description: `Выдача льготного госкредита 5% годовых на срок ${termMonths} мес.`,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(firestore, 'transactions', tx.id), tx);

    return {
      success: true,
      message: `Кредит на сумму ${amount.toLocaleString('ru-RU')} PUSH одобрен и зачислен на карту!`,
      loan,
      updatedBalance: newBal,
    };
  }

  async repayCredit(creditId: string, amount: number): Promise<{ success: boolean; message: string; remainingAmount?: number; updatedBalance?: number }> {
    if (!firestore) return { success: false, message: 'База данных недоступна' };

    const loanDoc = await getDoc(doc(firestore, 'credits', creditId));
    if (!loanDoc.exists()) {
      return { success: false, message: 'Кредит не найден' };
    }

    const loan = loanDoc.data() as CreditLoan;
    if (loan.status === 'paid' || loan.remainingAmount <= 0) {
      return { success: false, message: 'Кредит уже полностью погашен' };
    }

    const cards = await this.getCards();
    const card = cards.find((c) => c.id === loan.cardId);
    if (!card) {
      return { success: false, message: 'Карта заемщика не найдена' };
    }

    if (card.balance < amount) {
      return {
        success: false,
        message: `Недостаточно средств на карте. Баланс: ${card.balance.toLocaleString('ru-RU')} PUSH`,
      };
    }

    const actualPayment = Math.min(amount, loan.remainingAmount);
    loan.remainingAmount -= actualPayment;
    if (loan.remainingAmount <= 0) {
      loan.remainingAmount = 0;
      loan.status = 'paid';
    }

    const newBal = card.balance - actualPayment;
    card.balance = newBal;
    card.lastActivityDate = new Date().toISOString();

    await updateDoc(doc(firestore, 'credits', loan.id), {
      remainingAmount: loan.remainingAmount,
      status: loan.status,
    });

    await updateDoc(doc(firestore, 'cards', card.id), {
      balance: newBal,
      lastActivityDate: card.lastActivityDate,
    });

    const tx: Transaction = {
      id: `tx_repay_${Date.now()}`,
      cardId: card.id,
      cardNumber: card.cardNumber,
      fromCardNumber: card.cardNumber,
      toCardNumber: '450000000001',
      senderName: card.cardHolderName,
      recipientName: 'Казна Пушленда',
      amount: actualPayment,
      type: 'credit_repay',
      description: `Погашение кредита ID ${loan.id}`,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(firestore, 'transactions', tx.id), tx);

    return {
      success: true,
      message: `Внесено ${actualPayment.toLocaleString('ru-RU')} PUSH в счет погашения кредита`,
      remainingAmount: loan.remainingAmount,
      updatedBalance: newBal,
    };
  }

  async getCreditsByCardId(cardId: string): Promise<CreditLoan[]> {
    if (!firestore) return [];
    const q = query(collection(firestore, 'credits'), where('cardId', '==', cardId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as CreditLoan);
  }

  async getTransactionsByCardNumber(cardNumber: string): Promise<Transaction[]> {
    if (!firestore) return [];
    const clean = cardNumber.replace(/\s+/g, '');
    const q1 = query(collection(firestore, 'transactions'), where('fromCardNumber', '==', clean));
    const q2 = query(collection(firestore, 'transactions'), where('toCardNumber', '==', clean));
    const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const map = new Map<string, Transaction>();
    s1.docs.forEach((d) => map.set(d.id, d.data() as Transaction));
    s2.docs.forEach((d) => map.set(d.id, d.data() as Transaction));

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTransactionById(txId: string): Promise<Transaction | undefined> {
    if (!firestore) return undefined;
    const snap = await getDoc(doc(firestore, 'transactions', txId));
    if (snap.exists()) {
      return snap.data() as Transaction;
    }
    return undefined;
  }

  async createInvoice(
    merchantName: string,
    recipientCardNumber: string,
    amount: number,
    description: string,
    merchantUserId: string
  ): Promise<Invoice> {
    const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const invoice: Invoice = {
      id: invId,
      merchantName: merchantName || 'Торговец Пушленда',
      recipientCardNumber: recipientCardNumber.replace(/\s+/g, ''),
      amount,
      description: description || 'Оплата счёта',
      merchantUserId: merchantUserId || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (firestore) {
      await setDoc(doc(firestore, 'invoices', invoice.id), invoice);
    }
    return invoice;
  }

  async getInvoiceById(invoiceId: string): Promise<Invoice | undefined> {
    if (!firestore) return undefined;
    const snap = await getDoc(doc(firestore, 'invoices', invoiceId));
    if (snap.exists()) {
      return snap.data() as Invoice;
    }
    return undefined;
  }

  async getInvoicesByMerchantCard(cardNumber: string): Promise<Invoice[]> {
    if (!firestore) return [];
    const clean = cardNumber.replace(/\s+/g, '');
    const q = query(collection(firestore, 'invoices'), where('recipientCardNumber', '==', clean));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as Invoice)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async payInvoice(
    invoiceId: string,
    payerCardNumber: string,
    payerCvv: string
  ): Promise<{ success: boolean; message: string; invoice?: Invoice; newBalance?: number }> {
    if (!firestore) return { success: false, message: 'База данных недоступна' };

    const inv = await this.getInvoiceById(invoiceId);
    if (!inv) {
      return { success: false, message: 'Счёт не найден' };
    }

    if (inv.status === 'paid') {
      return { success: false, message: 'Этот счёт уже был успешно оплачен ранее' };
    }

    const payerCard = await this.getCardByNumber(payerCardNumber);
    if (!payerCard) {
      return { success: false, message: 'Карта плательщика не найдена' };
    }

    if (payerCard.cvv !== String(payerCvv).trim()) {
      return { success: false, message: 'Неверный CVV код карты' };
    }

    if (payerCard.isFrozen) {
      return { success: false, message: 'Карта плательщика заморожена' };
    }

    if (payerCard.balance < inv.amount) {
      return {
        success: false,
        message: `Недостаточно средств. Баланс: ${payerCard.balance.toLocaleString('ru-RU')} PUSH`,
      };
    }

    const recipientCard = await this.getCardByNumber(inv.recipientCardNumber);
    const nowIso = new Date().toISOString();

    const newPayerBal = payerCard.balance - inv.amount;
    payerCard.balance = newPayerBal;
    payerCard.lastActivityDate = nowIso;

    await updateDoc(doc(firestore, 'cards', payerCard.id), {
      balance: newPayerBal,
      lastActivityDate: nowIso,
    });

    if (recipientCard) {
      const newRecipBal = recipientCard.balance + inv.amount;
      recipientCard.balance = newRecipBal;
      recipientCard.lastActivityDate = nowIso;
      await updateDoc(doc(firestore, 'cards', recipientCard.id), {
        balance: newRecipBal,
        lastActivityDate: nowIso,
      });
    }

    inv.status = 'paid';
    inv.paidByCardNumber = payerCard.cardNumber;
    inv.paidAt = nowIso;

    await updateDoc(doc(firestore, 'invoices', inv.id), {
      status: 'paid',
      paidByCardNumber: payerCard.cardNumber,
      paidAt: nowIso,
    });

    const tx: Transaction = {
      id: `tx_inv_${Date.now()}`,
      cardId: payerCard.id,
      cardNumber: payerCard.cardNumber,
      fromCardNumber: payerCard.cardNumber,
      toCardNumber: inv.recipientCardNumber,
      senderName: payerCard.cardHolderName,
      recipientName: inv.merchantName,
      amount: inv.amount,
      type: 'transfer_out',
      description: `Оплата счёта #${inv.id}: ${inv.description}`,
      createdAt: nowIso,
    };

    await setDoc(doc(firestore, 'transactions', tx.id), tx);

    return {
      success: true,
      message: `Счёт #${inv.id} успешно оплачен!`,
      invoice: inv,
      newBalance: newPayerBal,
    };
  }

  async getTreasuryStats(adminEmail: string): Promise<TreasuryStats> {
    if (!isAdminEmail(adminEmail)) {
      throw new Error('Доступ запрещен: требуется статус Администратора Казны');
    }

    const cards = await this.getCards();
    const users = await this.getUsers();

    const treasuryCard = cards.find(
      (c) => c.cardType === 'treasury' || c.color === 'gold' || c.cardNumber === '450000000001'
    );
    const treasuryBalance = treasuryCard?.balance || 0;

    const citizenCards = cards.filter((c) => c.cardType !== 'treasury' && c.cardNumber !== '450000000001');
    const citizensTotalBalance = citizenCards.reduce((sum, c) => sum + (c.balance || 0), 0);

    let allTxs: Transaction[] = [];
    if (firestore) {
      const snap = await getDocs(collection(firestore, 'transactions'));
      allTxs = snap.docs.map((d) => d.data() as Transaction);
    }

    const taxTxs = allTxs.filter((t) => t.type === 'tax_inactivity');
    const totalTaxCollected = taxTxs.reduce((sum, t) => sum + t.amount, 0);

    const emissionTxs = allTxs
      .filter((t) => t.type === 'currency_emission')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const citizenList = users
      .filter((u) => !isAdminEmail(u.email))
      .map((u) => {
        const uCards = cards.filter((c) => c.userId === u.id);
        const totalBal = uCards.reduce((sum, c) => sum + (c.balance || 0), 0);
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
      citizens: citizenList,
      recentEmissions: emissionTxs.slice(0, 20),
    };
  }

  async emitCurrency(req: CurrencyEmissionRequest): Promise<{ success: boolean; message: string; stats?: TreasuryStats }> {
    if (!firestore) return { success: false, message: 'База данных недоступна' };

    if (!isAdminEmail(req.adminEmail)) {
      return { success: false, message: 'Только Верховный Администратор имеет право на эмиссию валюты' };
    }

    if (req.amount <= 0) {
      return { success: false, message: 'Сумма эмиссии должна быть больше 0' };
    }

    const cards = await this.getCards();
    let targetCard: BankCard | undefined;

    if (req.recipientCardNumber) {
      targetCard = cards.find((c) => c.cardNumber === req.recipientCardNumber?.replace(/\s+/g, ''));
      if (!targetCard) {
        return { success: false, message: `Карта получателя ${req.recipientCardNumber} не найдена` };
      }
    } else {
      targetCard = cards.find(
        (c) => c.cardType === 'treasury' || c.color === 'gold' || c.cardNumber === '450000000001'
      );
      if (!targetCard) {
        return { success: false, message: 'Карта Казны не найдена' };
      }
    }

    targetCard.balance += req.amount;
    const nowIso = new Date().toISOString();

    await updateDoc(doc(firestore, 'cards', targetCard.id), {
      balance: targetCard.balance,
      lastActivityDate: nowIso,
    });

    const tx: Transaction = {
      id: `tx_emit_${Date.now()}`,
      cardId: targetCard.id,
      cardNumber: targetCard.cardNumber,
      fromCardNumber: 'EMISSION_CENTRAL_BANK',
      toCardNumber: targetCard.cardNumber,
      senderName: 'Центробанк Пушленда (Эмиссия)',
      recipientName: targetCard.cardHolderName,
      amount: req.amount,
      type: 'currency_emission',
      description: `Государственная эмиссия: ${req.amount.toLocaleString('ru-RU')} PUSH. Указ: ${req.decreeNumber || 'Без номера'}. Причина: ${req.reason || 'Пополнение резервов'}`,
      createdAt: nowIso,
    };

    await setDoc(doc(firestore, 'transactions', tx.id), tx);

    const stats = await this.getTreasuryStats(req.adminEmail);
    return {
      success: true,
      message: `Эмиссия ${req.amount.toLocaleString('ru-RU')} PUSH успешно проведена и зачислена на карту ${targetCard.cardNumber}!`,
      stats,
    };
  }

  async toggleEmployee(
    adminEmail: string,
    targetUserId: string,
    makeEmployee: boolean
  ): Promise<{ success: boolean; message: string }> {
    if (!firestore) return { success: false, message: 'База данных недоступна' };

    if (!isAdminEmail(adminEmail)) {
      return { success: false, message: 'Недостаточно прав' };
    }

    const userDoc = await getDoc(doc(firestore, 'users', targetUserId));
    if (!userDoc.exists()) {
      return { success: false, message: 'Пользователь не найден' };
    }

    await updateDoc(doc(firestore, 'users', targetUserId), {
      isEmployee: makeEmployee,
    });

    return {
      success: true,
      message: makeEmployee ? 'Пользователь назначен сотрудником банка' : 'Пользователь снят с должности сотрудника',
    };
  }

  async staffToggleFreeze(
    staffEmail: string,
    cardId: string,
    freeze: boolean
  ): Promise<{ success: boolean; message: string; card?: BankCard }> {
    if (!firestore) return { success: false, message: 'База данных недоступна' };

    const users = await this.getUsers();
    const staff = users.find((u) => u.email?.toLowerCase() === staffEmail.trim().toLowerCase());
    const isAd = isAdminEmail(staffEmail);

    if (!isAd && !staff?.isEmployee) {
      return { success: false, message: 'Недостаточно прав сотрудника банка' };
    }

    const cards = await this.getCards();
    const card = cards.find((c) => c.id === cardId || c.cardNumber === cardId);
    if (!card) {
      return { success: false, message: 'Карта не найдена' };
    }

    if (card.cardType === 'treasury') {
      return { success: false, message: 'Карту Казны невозможно заблокировать' };
    }

    card.isFrozen = freeze;
    card.status = freeze ? 'frozen' : 'active';
    if (!freeze) {
      card.frozenUntil = undefined;
      card.freezeDays = undefined;
    }

    await updateDoc(doc(firestore, 'cards', card.id), {
      isFrozen: freeze,
      status: card.status,
      frozenUntil: card.frozenUntil || null,
      freezeDays: card.freezeDays || null,
    });

    return {
      success: true,
      message: freeze ? `Карта ${card.cardNumber} заморожена решением администрации` : `Карта ${card.cardNumber} разблокирована`,
      card,
    };
  }
}

export const firebaseDbService = new FirebaseDatabaseService();
