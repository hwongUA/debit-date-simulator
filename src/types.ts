export type DebitMode = 'four-weekly' | 'monthly';

export interface DebitEvent {
  date: Date;
  label: string;
}

export interface FulfilmentEvent {
  date: Date;
  label: string;
  kind: 'welcome' | 'monthly-pack';
  packNumber?: number;
}

export interface FulfilmentSchedule {
  welcomePackDate: Date;
  monthlyPackDates: FulfilmentEvent[];
}

export interface DayEvents {
  debits: DebitEvent[];
  fulfilments: FulfilmentEvent[];
}

export interface MonthSummary {
  debits: DebitEvent[];
  fulfilments: FulfilmentEvent[];
  isDoubleDebitMonth: boolean;
}
