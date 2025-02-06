export interface IntegrationTheme {
  primary: string;
  secondary: string;
}

export interface Integration {
  icon: string;
  label: string;
  description?: string;
  theme: IntegrationTheme;
}

export const INTEGRATIONS: Integration[] = [
  {
    icon: 'images/icon_trade.svg',
    label: 'Trade',
    description: 'Swap tokens on your favorite dexes.',
    theme: {
      primary: '#10B981', // Green
      secondary: '#10B981', // Green
    },
  },
  {
    icon: 'images/pump_fun.svg',
    label: 'pump.fun',
    description: 'Launch tokens.',
    theme: {
      primary: '#16A34A', // Green
      secondary: '#22C55E', // Light green
    },
  },
  {
    icon: 'images/icon_wallets.svg',
    label: 'Wallet',
    description: 'Manage your wallets.',
    theme: {
      primary: '#9333EA', // Purple
      secondary: '#A855F7', // Light purple
    },
  },
  {
    icon: 'images/icon_analyze.svg',
    label: 'Analyzer',
    description: 'Token information and price alerts.',
    theme: {
      primary: '#0EA5E9', // Blue
      secondary: '#38BDF8', // Light blue
    },
  },
];
