import { recordIcon, googleIcon, discordIcon, twitterIcon, moreIcon } from '@/utils';
// routes
export const ROUTES_CONFIG = () => {
  return [
    {
      path: '/create',
      navBar: {
        showLogo: true,
        isGoBack: true
      }
    },
    {
      path: '/send',
      navBar: {
        showLogo: false,
        isGoBack: false
      }
    },
    {
      path: '/record',
      navBar: {
        isGoBack: true,
        hideWalletUser: true,
        title: 'History'
      }
    },
    {
      path: '/detail',
      navBar: {
        isGoBack: true,
        hideWalletUser: true,
        title: 'Detail'
      }
    },
    {
      path: '/order'
    },
    {
      path: '/collection',
      navBar: {
        showLogo: true
      }
    },
    {
      path: '/collection-detail',
      navBar: {
        isGoBack: true,
        // hideWalletUser: true,
        title: 'Detail'
      }
    },
    {
      path: '/collect-record',
      navBar: {
        isGoBack: true,
        hideWalletUser: true,
        title: 'My Collection'
      }
    }
  ];
};

export const NAV_MENUS = [
  {
    title: 'Transfer',
    icon: '/image/icon/tranfer.png',
    path: '/create'
  },
  {
    title: 'Split bill',
    icon: '/image/icon/collection.png',
    path: '/collection'
  },
  {
    title: 'Transfer History',
    icon: '/image/icon/icon_History.png',
    path: '/record'
  },
  {
    title: 'My split bill',
    icon: recordIcon,
    path: '/collect-record'
  }
];

export const TRANS_SEND_MENUS = [
  {
    key: 'direct',
    name: 'For Individuals',
    value: 1
  },
  {
    key: 'multiple',
    name: 'For Groups',
    value: 2
  }
];

export const TRANS_GTOUP_MENUS = [
  {
    key: 'equal',
    name: 'Equal Amount',
    value: 1,
    amountDesc: 'Amount Each'
  },
  {
    key: 'specifial',
    name: 'Specified Amount',
    value: 2,
    amountDesc: 'Token'
  }
];

export const TRANS_RECEIVE_MENUS = [
  {
    key: 'code',
    name: 'Receive Code',
    value: 'code'
  },
  {
    key: 'bill',
    name: 'Split Bill',
    value: 'bill'
  }
];

export const COLLECTION_MENUS = [
  // {
  //   key: 'signup',
  //   name: 'Sign-Up Collection',
  //   value: 1,
  //   amountDesc: 'Unit Price',
  // },
  {
    key: 'equal',
    name: 'Equal Amount',
    value: 2,
    amountDesc: 'Total Amount',
    summaryDesc: 'Identical'
  },
  {
    key: 'specifial',
    name: 'Specified Amount',
    value: 3,
    amountDesc: 'Amount',
    summaryDesc: 'Total'
  }
];

export const ORDER_TYPE_MENU = [
  {
    key: 0,
    value: 'Collection'
  },
  {
    key: 1,
    value: 'Payment'
  }
];

export const HISTORY_TYPE_MENU = [
  {
    key: 0,
    value: 'Sent'
  },
  {
    key: 1,
    value: 'Received'
  }
];

export const PARTICAL_MENUS = [
  {
    key: 'google',
    name: 'google',
    icon: googleIcon
  },
  {
    key: 'discord',
    name: 'discord',
    icon: discordIcon
  },
  {
    key: 'twitter',
    name: 'twitter',
    icon: twitterIcon
  },
  {
    key: 'Particle',
    name: 'Particle',
    icon: moreIcon
  }
];

export const WALLET_IMAGE_LIST: any = {
  MetaMask: '/image/wallet/eth_MetaMask.svg',
  walletconnect: '/image/wallet/eth_walletconnect.svg',
  walletconnectV2: '/image/wallet/eth_walletconnect.svg',
  Particle: '/image/wallet/eth_particle_1.png',
  Injected: '/image/wallet/sendingme_logo.png',
  google: '/image/wallet/google.png',
  discord: '/image/wallet/discord.png',
  twitter: '/image/wallet/twitter.png',
  apple: '/image/wallet/apple.png'
};

export const TRANS_REMIND_MENUS = [
  {
    key: 'notification',
    name: 'Notification to individuals',
    value: 1
  },
  {
    key: 'message',
    name: 'Message in this group',
    value: 2
  }
];
