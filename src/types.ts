export type CardType = 'regular' | 'business' | 'treasury';
export type CardColor = 'white' | 'black' | 'gold';

export interface User {
  id: string;
  email?: string;
  password?: string;
  googleId?: string;
  name: string;
  fullName?: string;
  gameNickname: string;
  avatar?: string;
  createdAt: string;
  isAdmin?: boolean;
  isEmployee?: boolean;
}

export interface BankCard {
  id: string;
  userId: string;
  cardNumber: string; // 12 digits (e.g. "450012345678")
  cardHolderName: string;
  cardType: CardType;
  color: CardColor;
  balance: number;
  issueDate: string; // "MM/YY"
  cvv: string; // 3 digits
  status: 'active' | 'blocked' | 'frozen';
  createdAt: string;
  lastActivityDate?: string; // ISO string of last financial movement or tax calculation
  isFrozen?: boolean; // Account freeze according to Decree #2
  frozenUntil?: string; // ISO string of freeze expiration
  frozenAt?: string; // ISO string of when freeze was applied
  freezeDays?: number; // Days of freeze (>= 14)
}

export type TransactionType =
  | 'transfer_in'
  | 'transfer_out'
  | 'credit_draw'
  | 'credit_repay'
  | 'merchant_payment'
  | 'tax_inactivity'
  | 'account_freeze'
  | 'currency_emission';

export interface FreezeCardRequest {
  cardId: string;
  days: number; // minimum 14
}

export interface InactivityTaxStatus {
  lastActivityDate: string;
  daysInactive: number;
  daysUntilTax: number;
  taxRatePercent: number; // 7%
  estimatedTaxAmount: number;
  isTaxDue: boolean;
  isFrozen: boolean;
  frozenUntil?: string;
}

export interface TreasuryStats {
  totalCitizens: number;
  citizensTotalBalance: number;
  treasuryBalance: number;
  totalMonetarySupply: number;
  totalTaxCollected: number;
  totalEmissionsCount: number;
  citizens: Array<{
    userId: string;
    name: string;
    gameNickname: string;
    email?: string;
    cards: BankCard[];
    totalBalance: number;
    isEmployee?: boolean;
    isAdmin?: boolean;
  }>;
  recentEmissions: Transaction[];
}

export interface CurrencyEmissionRequest {
  adminEmail: string;
  amount: number;
  recipientCardNumber?: string;
  decreeNumber?: string;
  reason?: string;
}

export interface Transaction {
  id: string;
  cardId: string;
  cardNumber: string;
  fromCardNumber: string;
  toCardNumber: string;
  senderName?: string;
  recipientName?: string;
  amount: number;
  type: TransactionType;
  description: string;
  createdAt: string;
}

export type CreditStatus = 'active' | 'paid';

export interface CreditLoan {
  id: string;
  cardId: string;
  principal: number;
  interestRate: number; // 5%
  totalRepayAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  termMonths: number;
  status: CreditStatus;
  createdAt: string;
}

export interface CardRegistrationRequest {
  gameNickname: string;
  password?: string;
  cardType: CardType;
}

export interface TransferRequest {
  fromCardNumber: string;
  toCardNumber: string;
  amount: number;
  note?: string;
}

export interface CreditApplyRequest {
  cardId: string;
  amount: number;
  termMonths: number;
}

export interface CreditRepayRequest {
  creditId: string;
  amount: number;
}

export interface MerchantChargeRequest {
  cardNumber: string;
  cvv: string;
  amount: number;
  description?: string;
  merchantName?: string;
}

export interface Invoice {
  id: string;
  merchantUserId: string;
  merchantName: string;
  recipientCardNumber: string;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'cancelled';
  paidByCardNumber?: string;
  paidAt?: string;
  createdAt: string;
}

export interface CreateInvoiceRequest {
  recipientCardNumber: string;
  amount: number;
  description: string;
  merchantName: string;
}

export interface PayInvoiceRequest {
  cardNumber: string;
  cvv: string;
}

export interface MerchantStats {
  totalRevenue: number;
  paidCount: number;
  pendingCount: number;
  avgCheck: number;
}

export interface MerchantChargeResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  remainingBalance?: number;
  cardNumber?: string;
}

