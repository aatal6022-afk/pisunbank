import { supabase } from './supabase.js';
import {
  User,
  BankCard,
  Transaction,
  CreditLoan,
  CardType,
  CardColor,
  MerchantChargeResponse,
  Invoice,
} from '../src/types.js';

export const ADMIN_EMAIL = 'pinkiscammerinfo@gmail.com';

export function isAdminEmail(email?: string): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function mapUserFromRow(row: any): User {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    googleId: row.google_id || row.googleId,
    name: row.name,
    fullName: row.full_name || row.fullName,
    gameNickname: row.game_nickname || row.gameNickname,
    avatar: row.avatar,
    createdAt: row.created_at || row.createdAt,
    isAdmin: Boolean(row.is_admin || row.isAdmin || isAdminEmail(row.email)),
    isEmployee: Boolean(row.is_employee || row.isEmployee),
  };
}

function mapCardFromRow(row: any): BankCard {
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    cardNumber: row.card_number || row.cardNumber,
    cardHolderName: row.card_holder_name || row.cardHolderName,
    cardType: row.card_type || row.cardType || 'regular',
    color: row.color || 'white',
    balance: Number(row.balance) || 0,
    issueDate: row.issue_date || row.issueDate,
    cvv: String(row.cvv),
    status: row.status || 'active',
    createdAt: row.created_at || row.createdAt,
    lastActivityDate: row.last_activity_date || row.lastActivityDate,
    isFrozen: Boolean(row.is_frozen || row.isFrozen),
    frozenUntil: row.frozen_until || row.frozenUntil,
    frozenAt: row.frozen_at || row.frozenAt,
    freezeDays: row.freeze_days || row.freezeDays,
  };
}

function mapTxFromRow(row: any): Transaction {
  return {
    id: row.id,
    cardId: row.card_id || row.cardId,
    cardNumber: row.card_number || row.cardNumber,
    fromCardNumber: row.from_card_number || row.fromCardNumber,
    toCardNumber: row.to_card_number || row.toCardNumber,
    senderName: row.sender_name || row.senderName,
    recipientName: row.recipient_name || row.recipientName,
    amount: Number(row.amount) || 0,
    type: row.type,
    description: row.description,
    createdAt: row.created_at || row.createdAt,
  };
}

function mapCreditFromRow(row: any): CreditLoan {
  return {
    id: row.id,
    cardId: row.card_id || row.cardId,
    principal: Number(row.principal) || 0,
    interestRate: Number(row.interest_rate || row.interestRate) || 5,
    totalRepayAmount: Number(row.total_repay_amount || row.totalRepayAmount) || 0,
    remainingAmount: Number(row.remaining_amount || row.remainingAmount) || 0,
    monthlyPayment: Number(row.monthly_payment || row.monthlyPayment) || 0,
    termMonths: Number(row.term_months || row.termMonths) || 12,
    status: row.status || 'active',
    createdAt: row.created_at || row.createdAt,
  };
}

function mapInvoiceFromRow(row: any): Invoice {
  return {
    id: row.id,
    merchantUserId: row.merchant_user_id || row.merchantUserId || '',
    merchantName: row.merchant_name || row.merchantName,
    recipientCardNumber: row.recipient_card_number || row.recipientCardNumber,
    amount: Number(row.amount) || 0,
    description: row.description,
    status: row.status || 'pending',
    paidByCardNumber: row.paid_by_card_number || row.paidByCardNumber,
    paidAt: row.paid_at || row.paidAt,
    createdAt: row.created_at || row.createdAt,
  };
}

async function isStaffEmail(email?: string): Promise<boolean> {
  if (!email) return false;
  if (isAdminEmail(email)) return true;
  if (!supabase) return false;
  const { data } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  return Boolean(data?.is_employee);
}

function formatIssueDate(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${year}`;
}

function generateCVV(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

async function generate12DigitCardNumber(): Promise<string> {
  const fallbackNum = `4500${Math.floor(10000000 + Math.random() * 90000000)}`;
  if (!supabase) return fallbackNum;
  try {
    for (let i = 0; i < 3; i++) {
      const random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
      const num = `4500${random8}`;
      const { data } = await supabase.from('cards').select('card_number').eq('card_number', num).maybeSingle();
      if (!data) return num;
    }
  } catch (err) {
    console.warn('Error checking card number uniqueness in Supabase:', err);
  }
  return fallbackNum;
}

export const supabaseDbService = {
  async getUsers(): Promise<User[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('*');
    if (error) console.error('Supabase getUsers error:', error);
    return (data || []).map(mapUserFromRow);
  },

  async getUserByNickname(nickname: string): Promise<User | undefined> {
    if (!supabase) return undefined;
    const cleanNick = nickname.trim().toUpperCase();
    const { data } = await supabase.from('users').select('*');
    const found = (data || []).find((u: any) => {
      const g = (u.game_nickname || u.name || '').toUpperCase();
      const n = (u.name || '').toUpperCase();
      const e = (u.email || '').toLowerCase();
      return g === cleanNick || n === cleanNick || e === nickname.trim().toLowerCase();
    });
    return found ? mapUserFromRow(found) : undefined;
  },

  async loginWithPassword(username: string, password: string): Promise<{ user: User; cards: BankCard[] } | null> {
    if (!supabase) return null;
    const cleanInput = username.trim();
    if (!cleanInput) return null;

    let user: User | undefined;
    if (/^\d{12}$/.test(cleanInput.replace(/\s+/g, ''))) {
      const card = await this.getCardByNumber(cleanInput);
      if (card) {
        user = await this.getUserById(card.userId);
      }
    }

    if (!user) {
      user = await this.getUserByNickname(cleanInput);
    }

    if (!user) return null;

    if (user.password && user.password !== password) {
      return null;
    }

    if (!user.password && password) {
      user.password = password;
      await supabase.from('users').update({ password }).eq('id', user.id);
    }

    if (isAdminEmail(user.email)) {
      user.isAdmin = true;
      await supabase.from('users').update({ is_admin: true }).eq('id', user.id);
    }

    const cards = await this.getCardsByUserId(user.id);
    return { user, cards };
  },

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    if (!supabase) return undefined;
    const { data } = await supabase.from('users').select('*').eq('google_id', googleId).maybeSingle();
    return data ? mapUserFromRow(data) : undefined;
  },

  async loginGoogleUser(googleUser: { googleId: string; email: string; name: string; avatar?: string }): Promise<{ user: User; cards: BankCard[] } | null> {
    if (!supabase) return null;
    let user = await this.getUserByGoogleId(googleUser.googleId);
    if (!user) return null;
    if (isAdminEmail(user.email) || isAdminEmail(googleUser.email)) {
      user.isAdmin = true;
      await supabase.from('users').update({ is_admin: true }).eq('id', user.id);
    }
    const cards = await this.getCardsByUserId(user.id);
    return { user, cards };
  },

  async getUserById(id: string): Promise<User | undefined> {
    if (!supabase) return undefined;
    const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    return data ? mapUserFromRow(data) : undefined;
  },

  async getCards(): Promise<BankCard[]> {
    if (!supabase) return [];
    const { data } = await supabase.from('cards').select('*');
    return (data || []).map(mapCardFromRow);
  },

  async getCardsByUserId(userId: string): Promise<BankCard[]> {
    if (!supabase) return [];
    const user = await this.getUserById(userId);
    const isAdmin = user && isAdminEmail(user.email);

    if (isAdmin) {
      const { data: treasuryDoc } = await supabase
        .from('cards')
        .select('*')
        .eq('card_number', '450000000001')
        .maybeSingle();

      if (treasuryDoc) {
        if (treasuryDoc.user_id !== userId) {
          await supabase.from('cards').update({ user_id: userId }).eq('id', treasuryDoc.id);
        }
      } else {
        await supabase.from('cards').insert({
          id: 'crd_treasury',
          user_id: userId,
          card_number: '450000000001',
          card_holder_name: 'КАЗНА НЯСР',
          card_type: 'treasury',
          color: 'gold',
          balance: 1000000000,
          issue_date: '01/26',
          cvv: '777',
          status: 'active',
          created_at: new Date().toISOString(),
          last_activity_date: new Date().toISOString(),
        });
      }
    }

    const { data } = await supabase.from('cards').select('*').eq('user_id', userId);
    const cards = (data || []).map(mapCardFromRow);

    const updatedCards: BankCard[] = [];
    for (const card of cards) {
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
  },

  async getCardByNumber(cardNumber: string): Promise<BankCard | undefined> {
    if (!supabase) return undefined;
    const cleanNum = cardNumber.replace(/\s+/g, '');
    const { data } = await supabase.from('cards').select('*').eq('card_number', cleanNum).maybeSingle();
    if (!data) return undefined;
    const card = mapCardFromRow(data);
    return await this.checkAndApplyInactivityTax(card);
  },

  async checkAndApplyInactivityTax(card: BankCard): Promise<BankCard> {
    if (!supabase) return card;
    const now = Date.now();
    let updated = false;

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
          toCardNumber: 'KAZNA_NYASR',
          senderName: card.cardHolderName,
          recipientName: 'Казна Государства НЯСР',
          amount: actualTax,
          type: 'tax_inactivity',
          description: `Налог на бездействие средств (7%) по Закону Страны писюнов (НЯСР)`,
          createdAt: new Date().toISOString(),
        };

        await supabase.from('transactions').insert({
          id: taxTx.id,
          card_id: taxTx.cardId,
          card_number: taxTx.cardNumber,
          from_card_number: taxTx.fromCardNumber,
          to_card_number: taxTx.toCardNumber,
          sender_name: taxTx.senderName,
          recipient_name: taxTx.recipientName,
          amount: taxTx.amount,
          type: taxTx.type,
          description: taxTx.description,
          created_at: taxTx.createdAt,
        });
      }
    }

    if (updated) {
      await supabase
        .from('cards')
        .update({
          balance: card.balance,
          status: card.status,
          is_frozen: card.isFrozen || false,
          frozen_until: card.frozenUntil || null,
          last_activity_date: card.lastActivityDate || new Date().toISOString(),
        })
        .eq('id', card.id);
    }

    return card;
  },

  async freezeCard(
    cardId: string,
    days: number
  ): Promise<{ success: boolean; message: string; updatedCard?: BankCard }> {
    if (!supabase) return { success: false, message: 'База данных не подключена' };

    if (isNaN(days) || days < 14) {
      return {
        success: false,
        message: 'По Указу НЯСР №2 заморозка игрового счета возможна только на срок от 14 календарных дней!',
      };
    }

    const { data: rawCard } = await supabase.from('cards').select('*').eq('id', cardId).maybeSingle();
    if (!rawCard) {
      return { success: false, message: 'Карта не найдена в системе Банка номер один в НЯСР' };
    }

    let card = mapCardFromRow(rawCard);

    if (card.isFrozen || card.status === 'frozen') {
      const untilDateStr = card.frozenUntil
        ? new Date(card.frozenUntil).toLocaleDateString('ru-RU')
        : 'установленного срока';
      return {
        success: false,
        message: `Счет уже заморожен до ${untilDateStr}. По правилам Указа №2 досрочная разморозка строго запрещена.`,
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

    await supabase
      .from('cards')
      .update({
        is_frozen: card.isFrozen,
        status: card.status,
        frozen_at: card.frozenAt,
        freeze_days: card.freezeDays,
        frozen_until: card.frozenUntil,
        last_activity_date: card.lastActivityDate,
      })
      .eq('id', card.id);

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

    await supabase.from('transactions').insert({
      id: freezeTx.id,
      card_id: freezeTx.cardId,
      card_number: freezeTx.cardNumber,
      from_card_number: freezeTx.fromCardNumber,
      to_card_number: freezeTx.toCardNumber,
      sender_name: freezeTx.senderName,
      recipient_name: freezeTx.recipientName,
      amount: freezeTx.amount,
      type: freezeTx.type,
      description: freezeTx.description,
      created_at: freezeTx.createdAt,
    });

    return {
      success: true,
      message: `Счет успешно заморожен на ${days} дней (до ${freezeUntil.toLocaleDateString('ru-RU')}). Все операции заблокированы, налог на бездействие отключен. Досрочная разморозка запрещена по Указу №2.`,
      updatedCard: card,
    };
  },

  async simulateInactivity(
    cardId: string,
    days: number = 7
  ): Promise<{ success: boolean; message: string; updatedCard?: BankCard; taxApplied?: boolean; taxAmount?: number }> {
    if (!supabase) return { success: false, message: 'База данных не подключена' };

    const { data: rawCard } = await supabase.from('cards').select('*').eq('id', cardId).maybeSingle();
    if (!rawCard) return { success: false, message: 'Карта не найдена' };

    let card = mapCardFromRow(rawCard);
    if (card.isFrozen || card.status === 'frozen') {
      return {
        success: false,
        message: 'Счет заморожен по Указу №2. Налог на бездействие не начисляется!',
        updatedCard: card,
      };
    }

    const simulatedDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    card.lastActivityDate = simulatedDate;
    await supabase.from('cards').update({ last_activity_date: simulatedDate }).eq('id', card.id);

    const beforeBal = card.balance;
    card = await this.checkAndApplyInactivityTax(card);
    const taxAmount = beforeBal - card.balance;

    return {
      success: true,
      message: taxAmount > 0
        ? `Симуляция ${days} дней бездействия: списан налог 7% (${taxAmount.toLocaleString('ru-RU')} PUSH) в пользу Казны НЯСР!`
        : `Симуляция ${days} дней бездействия: баланс 0 PUSH, налог не списан.`,
      updatedCard: card,
      taxApplied: taxAmount > 0,
      taxAmount: taxAmount,
    };
  },

  async getTransactionsByCardNumber(cardNumber: string): Promise<Transaction[]> {
    if (!supabase) return [];
    const cleanNum = cardNumber.replace(/\s+/g, '');
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .or(`card_number.eq.${cleanNum},from_card_number.eq.${cleanNum},to_card_number.eq.${cleanNum}`)
      .order('created_at', { ascending: false });

    return (data || []).map(mapTxFromRow);
  },

  async getCreditsByCardId(cardId: string): Promise<CreditLoan[]> {
    if (!supabase) return [];
    const { data } = await supabase.from('credits').select('*').eq('card_id', cardId);
    return (data || []).map(mapCreditFromRow);
  },

  async loginOrRegisterWithGoogle(googleData: any): Promise<{ user: User; card: BankCard }> {
    if (!supabase) throw new Error('Supabase не подключен');
    const googleId = googleData.googleId;
    const email = googleData.email || '';
    const name = googleData.name || 'Гражданин НЯСР';
    const avatar = googleData.avatar || '';

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .or(`google_id.eq.${googleId},email.eq.${email}`)
      .maybeSingle();

    let user: User;
    if (!existingUser) {
      user = {
        id: `usr_g_${Date.now()}`,
        email: email,
        googleId: googleId,
        name: name,
        fullName: name,
        gameNickname: isAdminEmail(email) ? 'КАЗНА НЯСР' : name.toUpperCase(),
        avatar: avatar,
        createdAt: new Date().toISOString(),
        isAdmin: isAdminEmail(email),
      };
      await supabase.from('users').insert({
        id: user.id,
        email: user.email,
        google_id: user.googleId,
        name: user.name,
        full_name: user.fullName,
        game_nickname: user.gameNickname,
        avatar: user.avatar,
        created_at: user.createdAt,
        is_admin: user.isAdmin,
      });
    } else {
      user = mapUserFromRow(existingUser);
      let needsUpdate = false;
      const updateData: any = {};
      if (!user.googleId) {
        user.googleId = googleId;
        updateData.google_id = googleId;
        needsUpdate = true;
      }
      if (isAdminEmail(email) && !user.isAdmin) {
        user.isAdmin = true;
        updateData.is_admin = true;
        needsUpdate = true;
      }
      if (needsUpdate) {
        await supabase.from('users').update(updateData).eq('id', user.id);
      }
    }

    const cards = await this.getCardsByUserId(user.id);
    let card = cards[0];

    if (!card) {
      const cardNumber = await generate12DigitCardNumber();
      card = {
        id: `crd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
        cardNumber: cardNumber,
        cardHolderName: name.toUpperCase(),
        cardType: 'regular',
        color: 'white',
        balance: 0,
        issueDate: formatIssueDate(),
        cvv: generateCVV(),
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      await supabase.from('cards').insert({
        id: card.id,
        user_id: card.userId,
        card_number: card.cardNumber,
        card_holder_name: card.cardHolderName,
        card_type: card.cardType,
        color: card.color,
        balance: card.balance,
        issue_date: card.issueDate,
        cvv: card.cvv,
        status: card.status,
        created_at: card.createdAt,
      });
    }

    return { user, card };
  },

  async registerUserAndIssueCard(
    gameNickname: string,
    cardType: CardType,
    password?: string
  ): Promise<{ user: User; card: BankCard }> {
    if (!supabase) throw new Error('Supabase не подключен');

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
      const { error: userInsertError } = await supabase.from('users').insert({
        id: user.id,
        password: user.password,
        email: user.email,
        name: user.name,
        game_nickname: user.gameNickname,
        avatar: user.avatar,
        created_at: user.createdAt,
      });
      if (userInsertError) {
        console.error('[v0] Card registration user insert failed:', userInsertError);
        throw new Error('Не удалось создать профиль пользователя в базе данных');
      }
    } else {
      user.gameNickname = cleanNick.toUpperCase();
      const updatePayload = password
        ? { game_nickname: user.gameNickname, password }
        : { game_nickname: user.gameNickname };
      const { error: userUpdateError } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', user.id);
      if (userUpdateError) {
        console.error('[v0] Card registration user update failed:', userUpdateError);
        throw new Error('Не удалось обновить профиль пользователя в базе данных');
      }
    }

    const color: CardColor = cardType === 'business' ? 'black' : 'white';
    const initialBalance = 0;
    const cardNumber = await generate12DigitCardNumber();

    const card: BankCard = {
      id: `crd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      cardNumber: cardNumber,
      cardHolderName: gameNickname.toUpperCase(),
      cardType: cardType,
      color: color,
      balance: initialBalance,
      issueDate: formatIssueDate(),
      cvv: generateCVV(),
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const { error: cardInsertError } = await supabase.from('cards').insert({
      id: card.id,
      user_id: card.userId,
      card_number: card.cardNumber,
      card_holder_name: card.cardHolderName,
      card_type: card.cardType,
      color: card.color,
      balance: card.balance,
      issue_date: card.issueDate,
      cvv: card.cvv,
      status: card.status,
      created_at: card.createdAt,
    });
    if (cardInsertError) {
      console.error('[v0] Card registration card insert failed:', cardInsertError);
      throw new Error('Не удалось сохранить карту в базе данных');
    }

    return { user, card };
  },

  async transferMoney(
    fromCardNumRaw: string,
    toCardNumRaw: string,
    amount: number,
    note?: string
  ): Promise<{ success: boolean; message: string; senderCard?: BankCard; recipientCard?: BankCard }> {
    if (!supabase) return { success: false, message: 'База данных не подключена' };

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

    if (!senderCard) {
      return { success: false, message: 'Карта отправителя не найдена' };
    }

    if (!recipientCard) {
      return { success: false, message: 'Карта получателя с таким номером не найдена в системе Банка номер один в НЯСР' };
    }

    if (senderCard.isFrozen || senderCard.status === 'frozen') {
      const untilStr = senderCard.frozenUntil ? new Date(senderCard.frozenUntil).toLocaleDateString('ru-RU') : 'установленного срока';
      return {
        success: false,
        message: `Операция отклонена: Счет списания заморожен до ${untilStr} по Указу НЯСР №2. Все операции заблокированы.`,
      };
    }

    if (recipientCard.isFrozen || recipientCard.status === 'frozen') {
      const untilStr = recipientCard.frozenUntil ? new Date(recipientCard.frozenUntil).toLocaleDateString('ru-RU') : 'установленного срока';
      return {
        success: false,
        message: `Операция отклонена: Счет получателя заморожен до ${untilStr} по Указу НЯСР №2. Поступления заблокированы.`,
      };
    }

    if (senderCard.status !== 'active') {
      return { success: false, message: 'Карта отправителя заблокирована или неактивна' };
    }

    if (recipientCard.status !== 'active') {
      return { success: false, message: 'Карта получателя заблокирована или неактивна' };
    }

    if (senderCard.balance < amount) {
      return { success: false, message: 'Недостаточно средств на карте' };
    }

    const timestamp = new Date().toISOString();
    senderCard.balance -= amount;
    senderCard.lastActivityDate = timestamp;
    recipientCard.balance += amount;
    recipientCard.lastActivityDate = timestamp;

    await supabase.from('cards').update({ balance: senderCard.balance, last_activity_date: senderCard.lastActivityDate }).eq('id', senderCard.id);
    await supabase.from('cards').update({ balance: recipientCard.balance, last_activity_date: recipientCard.lastActivityDate }).eq('id', recipientCard.id);

    const txIdSender = `tx_${Date.now()}_out`;
    const txIdRecip = `tx_${Date.now()}_in`;
    const description = note || `Перевод средств между картами НЯСР`;

    const txSender: Transaction = {
      id: txIdSender,
      cardId: senderCard.id,
      cardNumber: senderCard.cardNumber,
      fromCardNumber: senderCard.cardNumber,
      toCardNumber: recipientCard.cardNumber,
      senderName: senderCard.cardHolderName,
      recipientName: recipientCard.cardHolderName,
      amount: amount,
      type: 'transfer_out',
      description: description,
      createdAt: timestamp,
    };

    const txRecip: Transaction = {
      id: txIdRecip,
      cardId: recipientCard.id,
      cardNumber: recipientCard.cardNumber,
      fromCardNumber: senderCard.cardNumber,
      toCardNumber: recipientCard.cardNumber,
      senderName: senderCard.cardHolderName,
      recipientName: recipientCard.cardHolderName,
      amount: amount,
      type: 'transfer_in',
      description: description,
      createdAt: timestamp,
    };

    await supabase.from('transactions').insert([
      {
        id: txSender.id,
        card_id: txSender.cardId,
        card_number: txSender.cardNumber,
        from_card_number: txSender.fromCardNumber,
        to_card_number: txSender.toCardNumber,
        sender_name: txSender.senderName,
        recipient_name: txSender.recipientName,
        amount: txSender.amount,
        type: txSender.type,
        description: txSender.description,
        created_at: txSender.createdAt,
      },
      {
        id: txRecip.id,
        card_id: txRecip.cardId,
        card_number: txRecip.cardNumber,
        from_card_number: txRecip.fromCardNumber,
        to_card_number: txRecip.toCardNumber,
        sender_name: txRecip.senderName,
        recipient_name: txRecip.recipientName,
        amount: txRecip.amount,
        type: txRecip.type,
        description: txRecip.description,
        created_at: txRecip.createdAt,
      },
    ]);

    return {
      success: true,
      message: `Успешный перевод ${amount.toLocaleString('ru-RU')} PUSH на карту ${recipientCard.cardNumber}`,
      senderCard,
      recipientCard,
    };
  },

  async applyCredit(
    cardId: string,
    amount: number,
    termMonths: number = 12
  ): Promise<{ success: boolean; message: string; loan?: CreditLoan; updatedCard?: BankCard }> {
    if (!supabase) return { success: false, message: 'База данных не подключена' };

    if (amount < 1000) {
      return { success: false, message: 'Минимальная сумма кредита 1 000 PUSH' };
    }

    const { data: rawCard } = await supabase.from('cards').select('*').eq('id', cardId).maybeSingle();
    if (!rawCard) {
      return { success: false, message: 'Карта не найдена' };
    }

    const card = mapCardFromRow(rawCard);

    if (card.isFrozen || card.status === 'frozen') {
      return {
        success: false,
        message: 'Нельзя взять кредит: счет заморожен по Указу НЯСР №2.',
      };
    }

    if (card.status !== 'active') {
      return { success: false, message: 'Карта неактивна или заблокирована' };
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
      interestRate: interestRate,
      totalRepayAmount: totalRepayAmount,
      remainingAmount: totalRepayAmount,
      monthlyPayment: monthlyPayment,
      termMonths: termMonths,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const timestamp = new Date().toISOString();
    card.balance += amount;
    card.lastActivityDate = timestamp;

    await supabase.from('cards').update({ balance: card.balance, last_activity_date: card.lastActivityDate }).eq('id', card.id);
    await supabase.from('credits').insert({
      id: loan.id,
      card_id: loan.cardId,
      principal: loan.principal,
      interest_rate: loan.interestRate,
      total_repay_amount: loan.totalRepayAmount,
      remaining_amount: loan.remainingAmount,
      monthly_payment: loan.monthlyPayment,
      term_months: loan.termMonths,
      status: loan.status,
      created_at: loan.createdAt,
    });

    const creditTx: Transaction = {
      id: `tx_credit_${Date.now()}`,
      cardId: card.id,
      cardNumber: card.cardNumber,
      fromCardNumber: 'NYASR_CREDIT_GOVT',
      toCardNumber: card.cardNumber,
      senderName: 'Банк номер один в НЯСР (Кредитный отдел)',
      recipientName: card.cardHolderName,
      amount: amount,
      type: 'credit_draw',
      description: `Зачисление государственного кредита 5% годовых на ${termMonths} мес.`,
      createdAt: timestamp,
    };

    await supabase.from('transactions').insert({
      id: creditTx.id,
      card_id: creditTx.cardId,
      card_number: creditTx.cardNumber,
      from_card_number: creditTx.fromCardNumber,
      to_card_number: creditTx.toCardNumber,
      sender_name: creditTx.senderName,
      recipient_name: creditTx.recipientName,
      amount: creditTx.amount,
      type: creditTx.type,
      description: creditTx.description,
      created_at: creditTx.createdAt,
    });

    return {
      success: true,
      message: `Кредит на сумму ${amount.toLocaleString('ru-RU')} PUSH под 5% годовых зачислен на карту!`,
      loan,
      updatedCard: card,
    };
  },

  async repayCredit(
    creditId: string,
    repayAmount: number
  ): Promise<{ success: boolean; message: string; updatedCard?: BankCard; updatedCredit?: CreditLoan }> {
    if (!supabase) return { success: false, message: 'База данных не подключена' };

    const { data: rawCredit } = await supabase.from('credits').select('*').eq('id', creditId).maybeSingle();
    if (!rawCredit) return { success: false, message: 'Кредит не найден' };

    const credit = mapCreditFromRow(rawCredit);
    if (credit.status === 'paid') return { success: false, message: 'Этот кредит уже полностью погашен' };

    const { data: rawCard } = await supabase.from('cards').select('*').eq('id', credit.cardId).maybeSingle();
    if (!rawCard) return { success: false, message: 'Связанная карта не найдена' };

    const card = mapCardFromRow(rawCard);
    if (card.isFrozen || card.status === 'frozen') {
      return { success: false, message: 'Нельзя погасить кредит: счет заморожен по Указу НЯСР №2.' };
    }

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

    await supabase.from('cards').update({ balance: card.balance, last_activity_date: card.lastActivityDate }).eq('id', card.id);
    await supabase.from('credits').update({ remaining_amount: credit.remainingAmount, status: credit.status }).eq('id', credit.id);

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
      description: `Погашение кредита ID ${credit.id.slice(-6)} (Остаток: ${credit.remainingAmount.toLocaleString('ru-RU')} PUSH)`,
      createdAt: timestamp,
    };

    await supabase.from('transactions').insert({
      id: repayTx.id,
      card_id: repayTx.cardId,
      card_number: repayTx.cardNumber,
      from_card_number: repayTx.fromCardNumber,
      to_card_number: repayTx.toCardNumber,
      sender_name: repayTx.senderName,
      recipient_name: repayTx.recipientName,
      amount: repayTx.amount,
      type: repayTx.type,
      description: repayTx.description,
      created_at: repayTx.createdAt,
    });

    return {
      success: true,
      message: `Погашение на сумму ${actualRepay.toLocaleString('ru-RU')} PUSH успешно выполнено!`,
      updatedCard: card,
      updatedCredit: credit,
    };
  },

  async processMerchantCharge(
    cardNumberRaw: string,
    cvv: string,
    amount: number,
    merchantName: string = 'Внешний Магазин НЯСР',
    description: string = 'Оплата на сайте партнера'
  ): Promise<MerchantChargeResponse> {
    if (!supabase) return { success: false, message: 'База данных не подключена' };

    const cleanNum = cardNumberRaw.replace(/\s+/g, '');
    const card = await this.getCardByNumber(cleanNum);

    if (!card) {
      return { success: false, message: 'Ошибка оплаты: Карта с таким номером не найдена в Банке номер один в НЯСР' };
    }

    if (card.isFrozen || card.status === 'frozen') {
      const untilStr = card.frozenUntil ? new Date(card.frozenUntil).toLocaleDateString('ru-RU') : 'установленного срока';
      return { success: false, message: `Ошибка оплаты: Счет плательщика заморожен до ${untilStr} по Указу НЯСР №2.` };
    }

    if (card.status !== 'active') {
      return { success: false, message: 'Ошибка оплаты: Карта заблокирована или неактивна' };
    }

    if (card.cvv !== cvv.trim()) {
      return { success: false, message: 'Ошибка оплаты: Неверный CVV код карты' };
    }

    if (amount <= 0) {
      return { success: false, message: 'Ошибка оплаты: Некорректная сумма списания' };
    }

    if (card.balance < amount) {
      return {
        success: false,
        message: `Ошибка оплаты: Недостаточно средств на карте (Баланс: ${card.balance.toLocaleString('ru-RU')} PUSH)`,
      };
    }

    const timestamp = new Date().toISOString();
    card.balance -= amount;
    card.lastActivityDate = timestamp;
    await supabase.from('cards').update({ balance: card.balance, last_activity_date: card.lastActivityDate }).eq('id', card.id);

    const txId = `tx_merch_${Date.now()}`;
    const tx: Transaction = {
      id: txId,
      cardId: card.id,
      cardNumber: card.cardNumber,
      fromCardNumber: card.cardNumber,
      toCardNumber: 'MERCHANT_GATEWAY',
      senderName: card.cardHolderName,
      recipientName: merchantName,
      amount: amount,
      type: 'merchant_payment',
      description: `${merchantName}: ${description}`,
      createdAt: timestamp,
    };

    await supabase.from('transactions').insert({
      id: tx.id,
      card_id: tx.cardId,
      card_number: tx.cardNumber,
      from_card_number: tx.fromCardNumber,
      to_card_number: tx.toCardNumber,
      sender_name: tx.senderName,
      recipient_name: tx.recipientName,
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
      created_at: tx.createdAt,
    });

    return {
      success: true,
      message: `Оплата на сумму ${amount.toLocaleString('ru-RU')} PUSH прошла успешно`,
      transactionId: txId,
      remainingBalance: card.balance,
      cardNumber: card.cardNumber,
    };
  },

  async createInvoice(
    merchantName: string,
    recipientCardNumber: string,
    amount: number,
    description: string,
    merchantUserId: string = ''
  ): Promise<Invoice> {
    if (!supabase) throw new Error('Supabase не подключен');

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

    await supabase.from('invoices').insert({
      id: invoice.id,
      merchant_user_id: invoice.merchantUserId,
      merchant_name: invoice.merchantName,
      recipient_card_number: invoice.recipientCardNumber,
      amount: invoice.amount,
      description: invoice.description,
      status: invoice.status,
      created_at: invoice.createdAt,
    });

    return invoice;
  },

  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    if (!supabase) return null;
    const { data } = await supabase.from('invoices').select('*').eq('id', invoiceId).maybeSingle();
    return data ? mapInvoiceFromRow(data) : null;
  },

  async payInvoice(
    invoiceId: string,
    payerCardNumberRaw: string,
    cvv: string
  ): Promise<{ success: boolean; message: string; invoice?: Invoice; remainingBalance?: number }> {
    if (!supabase) return { success: false, message: 'База данных не подключена' };

    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) return { success: false, message: 'Счёт на оплату не найден в базе Банка номер один в НЯСР' };
    if (invoice.status === 'paid') return { success: false, message: 'Этот счёт уже оплачен', invoice };
    if (invoice.status === 'cancelled') return { success: false, message: 'Этот счёт аннулирован', invoice };

    const cleanPayerNum = payerCardNumberRaw.replace(/\s+/g, '');
    const payerCard = await this.getCardByNumber(cleanPayerNum);
    if (!payerCard) return { success: false, message: 'Карта плательщика не найдена' };

    if (payerCard.isFrozen || payerCard.status === 'frozen') {
      const untilStr = payerCard.frozenUntil ? new Date(payerCard.frozenUntil).toLocaleDateString('ru-RU') : 'установленного срока';
      return { success: false, message: `Ошибка оплаты: Счет плательщика заморожен до ${untilStr} по Указу НЯСР №2.` };
    }

    if (payerCard.status !== 'active') return { success: false, message: 'Карта плательщика заблокирована или неактивна' };
    if (payerCard.cvv !== cvv.trim()) return { success: false, message: 'Неверный CVV код карты' };

    if (payerCard.balance < invoice.amount) {
      return {
        success: false,
        message: `Недостаточно средств на карте (Баланс: ${payerCard.balance.toLocaleString('ru-RU')} PUSH, Требуется: ${invoice.amount.toLocaleString('ru-RU')} PUSH)`,
      };
    }

    const recipientCard = await this.getCardByNumber(invoice.recipientCardNumber);
    if (!recipientCard) return { success: false, message: 'Карта зачисления продавца не найдена' };

    if (recipientCard.isFrozen || recipientCard.status === 'frozen') {
      const untilStr = recipientCard.frozenUntil ? new Date(recipientCard.frozenUntil).toLocaleDateString('ru-RU') : 'установленного срока';
      return { success: false, message: `Ошибка оплаты: Счет продавца заморожен до ${untilStr} по Указу НЯСР №2.` };
    }

    const timestamp = new Date().toISOString();
    payerCard.balance -= invoice.amount;
    payerCard.lastActivityDate = timestamp;
    recipientCard.balance += invoice.amount;
    recipientCard.lastActivityDate = timestamp;

    invoice.status = 'paid';
    invoice.paidByCardNumber = payerCard.cardNumber;
    invoice.paidAt = timestamp;

    await supabase.from('cards').update({ balance: payerCard.balance, last_activity_date: payerCard.lastActivityDate }).eq('id', payerCard.id);
    await supabase.from('cards').update({ balance: recipientCard.balance, last_activity_date: recipientCard.lastActivityDate }).eq('id', recipientCard.id);
    await supabase.from('invoices').update({ status: invoice.status, paid_by_card_number: invoice.paidByCardNumber, paid_at: invoice.paidAt }).eq('id', invoice.id);

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
      description: `Оплата счёта №${invoice.id.slice(-6)}: ${invoice.description}`,
      createdAt: timestamp,
    };

    const recipientTx: Transaction = {
      id: `tx_inv_in_${Date.now()}`,
      cardId: recipientCard.id,
      cardNumber: recipientCard.cardNumber,
      fromCardNumber: payerCard.cardNumber,
      toCardNumber: recipientCard.cardNumber,
      senderName: payerCard.cardHolderName,
      recipientName: invoice.merchantName,
      amount: invoice.amount,
      type: 'transfer_in',
      description: `Оплата по счёту №${invoice.id.slice(-6)}: ${invoice.description}`,
      createdAt: timestamp,
    };

    await supabase.from('transactions').insert([
      {
        id: payerTx.id,
        card_id: payerTx.cardId,
        card_number: payerTx.cardNumber,
        from_card_number: payerTx.fromCardNumber,
        to_card_number: payerTx.toCardNumber,
        sender_name: payerTx.senderName,
        recipient_name: payerTx.recipientName,
        amount: payerTx.amount,
        type: payerTx.type,
        description: payerTx.description,
        created_at: payerTx.createdAt,
      },
      {
        id: recipientTx.id,
        card_id: recipientTx.cardId,
        card_number: recipientTx.cardNumber,
        from_card_number: recipientTx.fromCardNumber,
        to_card_number: recipientTx.toCardNumber,
        sender_name: recipientTx.senderName,
        recipient_name: recipientTx.recipientName,
        amount: recipientTx.amount,
        type: recipientTx.type,
        description: recipientTx.description,
        created_at: recipientTx.createdAt,
      },
    ]);

    return {
      success: true,
      message: `Счёт на сумму ${invoice.amount.toLocaleString('ru-RU')} PUSH успешно оплачен!`,
      invoice,
      remainingBalance: payerCard.balance,
    };
  },

  async getInvoicesByMerchantCard(recipientCardNumber: string): Promise<Invoice[]> {
    if (!supabase) return [];
    const cleanNum = recipientCardNumber.replace(/\s+/g, '');
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('recipient_card_number', cleanNum)
      .order('created_at', { ascending: false });

    return (data || []).map(mapInvoiceFromRow);
  },

  async depositToCardByNumber(
    fromCardNumRaw: string,
    toCardNumRaw: string,
    amount: number,
    fromCvvRaw?: string,
    senderName?: string,
    description?: string
  ): Promise<any> {
    if (!supabase) return { success: false, message: 'База данных не подключена' };

    if (isNaN(amount) || amount <= 0) {
      return { success: false, message: 'Ошибка перевода: Сумма должна быть числом больше 0 PUSH' };
    }

    const fromNum = fromCardNumRaw?.replace(/\s+/g, '') || '';
    const toNum = toCardNumRaw?.replace(/\s+/g, '') || '';

    if (!fromNum) return { success: false, message: 'Ошибка перевода: Не указана карта списания (fromCardNumber)' };
    if (!toNum) return { success: false, message: 'Ошибка пе��евода: Не указана карта получателя (toCardNumber)' };
    if (fromNum === toNum) return { success: false, message: 'Ошибка перевода: Карта списания и карта зачисления совпадают' };

    const senderCard = await this.getCardByNumber(fromNum);
    if (!senderCard) return { success: false, message: `Ошибка перевода: Карта списания (${fromNum}) не найдена` };

    if (senderCard.isFrozen || senderCard.status === 'frozen') {
      return { success: false, message: `Ошибка перевода: Карта списания (${fromNum}) заморожена по Указу НЯСР №2.` };
    }

    if (senderCard.status !== 'active') return { success: false, message: `Ошибка перевода: Карта списания (${fromNum}) неактивна` };

    if (fromCvvRaw && fromCvvRaw.trim() !== '') {
      if (senderCard.cvv !== fromCvvRaw.trim()) {
        return { success: false, message: 'Ошибка перевода: Неверный CVV код карты списания' };
      }
    }

    let fee = 0;
    if (senderCard.cardType !== 'business') {
      fee = Math.max(1, Math.floor(amount * 0.01));
      if (fee > 500) fee = 500;
    }

    const totalDeduction = amount + fee;
    if (senderCard.balance < totalDeduction) {
      return {
        success: false,
        message: `Ошибка перевода: Недостаточно средств на карте списания с учетом комиссии 1% (${fee} PUSH). Требуется: ${totalDeduction.toLocaleString('ru-RU')} PUSH`,
      };
    }

    const recipientCard = await this.getCardByNumber(toNum);
    if (!recipientCard) return { success: false, message: `Ошибка перевода: Карта зачисления (${toNum}) не найдена` };

    if (recipientCard.isFrozen || recipientCard.status === 'frozen') {
      return { success: false, message: `Ошибка перевода: Карта зачисления (${toNum}) заморожена по Указу НЯСР №2.` };
    }

    if (recipientCard.status !== 'active') return { success: false, message: `Ошибка перевода: Карта зачисления (${toNum}) неактивна` };

    const timestamp = new Date().toISOString();
    senderCard.balance -= totalDeduction;
    senderCard.lastActivityDate = timestamp;
    recipientCard.balance += amount;
    recipientCard.lastActivityDate = timestamp;

    await supabase.from('cards').update({ balance: senderCard.balance, last_activity_date: senderCard.lastActivityDate }).eq('id', senderCard.id);
    await supabase.from('cards').update({ balance: recipientCard.balance, last_activity_date: recipientCard.lastActivityDate }).eq('id', recipientCard.id);

    const txIdSender = `tx_${Date.now()}_api_out`;
    const txIdRecip = `tx_${Date.now()}_api_in`;
    const senderDisplayName = senderName?.trim() || senderCard.cardHolderName;
    const descText = description?.trim() || 'Перевод по API между картами Банка номер один в НЯСР';

    await supabase.from('transactions').insert([
      {
        id: txIdSender,
        card_id: senderCard.id,
        card_number: senderCard.cardNumber,
        from_card_number: senderCard.cardNumber,
        to_card_number: recipientCard.cardNumber,
        sender_name: senderDisplayName,
        recipient_name: recipientCard.cardHolderName,
        amount: totalDeduction,
        type: 'transfer_out',
        description: fee > 0 ? `[API Перевод] ${descText} (вкл. комиссию ${fee} PUSH)` : `[API Перевод] ${descText}`,
        created_at: timestamp,
      },
      {
        id: txIdRecip,
        card_id: recipientCard.id,
        card_number: recipientCard.cardNumber,
        from_card_number: senderCard.cardNumber,
        to_card_number: recipientCard.cardNumber,
        sender_name: senderDisplayName,
        recipient_name: recipientCard.cardHolderName,
        amount: amount,
        type: 'transfer_in',
        description: `[API Перевод] ${descText}`,
        created_at: timestamp,
      },
    ]);

    return {
      success: true,
      status: 'success',
      paid: true,
      message: `Успешно переведено ${amount.toLocaleString('ru-RU')} PUSH с карты ${senderCard.cardNumber} на карту ${recipientCard.cardNumber}`,
      transactionId: txIdRecip,
      amount: amount,
      senderCardNumber: senderCard.cardNumber,
      senderRemainingBalance: senderCard.balance,
      recipientCardNumber: recipientCard.cardNumber,
      recipientCardHolderName: recipientCard.cardHolderName,
      recipientNewBalance: recipientCard.balance,
    };
  },

  async getTransactionById(txId: string): Promise<Transaction | null> {
    if (!supabase) return null;
    const { data } = await supabase.from('transactions').select('*').eq('id', txId.trim()).maybeSingle();
    return data ? mapTxFromRow(data) : null;
  },

  async getTreasuryStats(requesterEmail?: string): Promise<any> {
    if (!supabase) throw new Error('База данных не подключена');
    if (!(await isStaffEmail(requesterEmail))) {
      throw new Error('Доступ запрещен. Требуются права сотрудника банка или верховного администратора.');
    }

    const [usersRes, cardsRes, txRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('cards').select('*'),
      supabase.from('transactions').select('*'),
    ]);

    const allUsers = (usersRes.data || []).map(mapUserFromRow);
    const allCards = (cardsRes.data || []).map(mapCardFromRow);
    const allTxs = (txRes.data || []).map(mapTxFromRow);

    let treasuryBalance = 0;
    let citizensTotalBalance = 0;
    const citizenMap = new Map<string, { user: User; cards: BankCard[]; totalBalance: number }>();

    for (const card of allCards) {
      const isTreasury =
        card.cardType === 'treasury' ||
        card.cardNumber === '450000000001' ||
        card.cardHolderName.toUpperCase().includes('КАЗНА') ||
        card.cardHolderName.toUpperCase().includes('ГОСХРАНИЛИЩЕ');

      if (isTreasury) {
        treasuryBalance += Number(card.balance) || 0;
      } else {
        const bal = Number(card.balance) || 0;
        citizensTotalBalance += bal;

        const user = allUsers.find((u) => u.id === card.userId) || {
          id: card.userId,
          name: card.cardHolderName,
          gameNickname: card.cardHolderName,
          createdAt: card.createdAt,
        };

        if (!citizenMap.has(card.userId)) {
          citizenMap.set(card.userId, {
            user,
            cards: [card],
            totalBalance: bal,
          });
        } else {
          const item = citizenMap.get(card.userId)!;
          item.cards.push(card);
          item.totalBalance += bal;
        }
      }
    }

    const taxTransactions = allTxs.filter((t) => t.type === 'tax_inactivity');
    const totalTaxCollected = taxTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    const emissionTransactions = allTxs
      .filter((t) => t.type === 'currency_emission')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const citizensList = Array.from(citizenMap.values())
      .map((c) => ({
        userId: c.user.id,
        name: c.user.fullName || c.user.name || c.user.gameNickname,
        gameNickname: c.user.gameNickname || c.user.name,
        email: c.user.email,
        cards: c.cards,
        totalBalance: c.totalBalance,
        isEmployee: c.user.isEmployee,
        isAdmin: isAdminEmail(c.user.email) || c.user.isAdmin,
      }))
      .sort((a, b) => b.totalBalance - a.totalBalance);

    return {
      totalCitizens: citizensList.length,
      citizensTotalBalance,
      treasuryBalance,
      totalMonetarySupply: citizensTotalBalance + treasuryBalance,
      totalTaxCollected,
      totalEmissionsCount: emissionTransactions.length,
      citizens: citizensList,
      recentEmissions: emissionTransactions.slice(0, 50),
    };
  },

  async emitCurrency(req: {
    adminEmail: string;
    amount: number;
    recipientCardNumber?: string;
    decreeNumber?: string;
    reason?: string;
  }): Promise<any> {
    if (!supabase) throw new Error('База данных не подключена');
    if (!isAdminEmail(req.adminEmail)) {
      return {
        success: false,
        message: 'Доступ отклонен: Эмиссия доступна только Верховному Администратору (pinkiscammerinfo@gmail.com)',
      };
    }

    const amount = Number(req.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, message: 'Сумма эмиссии должна быть строго больше нуля' };
    }

    const targetCardNum = req.recipientCardNumber?.replace(/\s+/g, '') || '450000000001';
    let targetCard = await this.getCardByNumber(targetCardNum);

    if (!targetCard && targetCardNum === '450000000001') {
      const allCards = await this.getCards();
      targetCard = allCards.find((c) => c.cardType === 'treasury' || c.cardNumber === '450000000001');
    }

    if (!targetCard) {
      return {
        success: false,
        message: `Карта зачисления эмиссии (${targetCardNum}) не найдена в системе Банка номер один в НЯСР`,
      };
    }

    targetCard.balance += amount;
    targetCard.lastActivityDate = new Date().toISOString();

    await supabase
      .from('cards')
      .update({ balance: targetCard.balance, last_activity_date: targetCard.lastActivityDate })
      .eq('id', targetCard.id);

    const decreeStr = req.decreeNumber ? `Указ №${req.decreeNumber}` : 'Государственный акт эмиссии';
    const reasonStr = req.reason?.trim() ? `: ${req.reason.trim()}` : '';

    const tx: Transaction = {
      id: `tx_emit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cardId: targetCard.id,
      cardNumber: targetCard.cardNumber,
      fromCardNumber: 'ГОСЗНАК_НЯСР',
      toCardNumber: targetCard.cardNumber,
      senderName: 'Центральный Эмиссионный Центр Минфина Страны писюнов (НЯСР)',
      recipientName: targetCard.cardHolderName,
      amount: amount,
      type: 'currency_emission',
      description: `🏛️ [Эмиссия Валюты] ${decreeStr}${reasonStr}. Выпущено ${amount.toLocaleString('ru-RU')} PUSH в обращение.`,
      createdAt: new Date().toISOString(),
    };

    await supabase.from('transactions').insert({
      id: tx.id,
      card_id: tx.cardId,
      card_number: tx.cardNumber,
      from_card_number: tx.fromCardNumber,
      to_card_number: tx.toCardNumber,
      sender_name: tx.senderName,
      recipient_name: tx.recipientName,
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
      created_at: tx.createdAt,
    });

    return {
      success: true,
      message: `Государственная эмиссия успешно проведена! Выпущено ${amount.toLocaleString('ru-RU')} PUSH на карту ${targetCard.cardNumber} (${targetCard.cardHolderName}). Новый баланс карты: ${targetCard.balance.toLocaleString('ru-RU')} PUSH`,
      newBalance: targetCard.balance,
      recipientCardNumber: targetCard.cardNumber,
      transaction: tx,
    };
  },

  async toggleEmployee(adminEmail: string, targetUserId: string, makeEmployee: boolean) {
    if (!supabase) throw new Error('База данных не подключена');
    if (!isAdminEmail(adminEmail)) throw new Error('Только верховный администратор может управлять персоналом');
    await supabase.from('users').update({ is_employee: makeEmployee }).eq('id', targetUserId);
    return { success: true };
  },

  async staffToggleFreeze(staffEmail: string, cardId: string, freeze: boolean) {
    if (!supabase) throw new Error('База данных не подключена');
    if (!(await isStaffEmail(staffEmail))) throw new Error('Нет прав для изменения статуса карты');

    if (freeze) {
      const until = new Date();
      until.setFullYear(until.getFullYear() + 100);
      await supabase.from('cards').update({
        is_frozen: true,
        frozen_until: until.toISOString(),
        status: 'frozen',
        frozen_at: new Date().toISOString(),
      }).eq('id', cardId);
    } else {
      await supabase.from('cards').update({
        is_frozen: false,
        frozen_until: null,
        status: 'active',
      }).eq('id', cardId);
    }
    return { success: true };
  },
};
