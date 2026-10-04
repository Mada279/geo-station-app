export interface PaymentMethodsConfig {
  wallets: {
    number: string;
    networks: string;
    isActive: boolean;
  };
  instapay: {
    handle: string;
    link: string;
    isActive: boolean;
  };
}

export const DEFAULT_PAYMENT_CONFIG: PaymentMethodsConfig = {
  wallets: {
    number: '01147554019',
    networks: 'Vodafone, Etisalat, Orange, WE',
    isActive: true,
  },
  instapay: {
    handle: 'ahmed.elsayed.74@instapay',
    link: 'https://ipn.eg/S/ahmed.elsayed.74/instapay/0YEQtW',
    isActive: true,
  },
};
