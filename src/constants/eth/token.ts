import { TokenInfo } from '@/types';
import { BigNumber } from '@ethersproject/bignumber';

const URL = process.env.LINX_REDIRECT_URI;
const ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const ETH_INFO: TokenInfo = {
  symbol: 'ETH',
  name: 'ETH',
  address: ADDRESS,
  type: 0, //0=>eth, 1 =>erc20, 2 => erc721, 3 => erc1155,
  isDefault: true,
  decimals: 18,
  chainType: 'eth',
  icon: URL + '/image/token/eth.svg',
  balance: BigNumber.from(0),
  spendingValue: 0,
  balanceValue: 0,
  balanceType: 0
};

export const MATIC_INFO: TokenInfo = {
  symbol: 'MATIC',
  name: 'MATIC',
  address: ADDRESS,
  type: 1, //0=>eth, 1 =>erc20, 2 => erc721, 3 => erc1155
  isDefault: true,
  decimals: 18,
  chainType: 'eth',
  icon: URL + '/image/token/polygon.svg',
  balance: BigNumber.from(0),
  spendingValue: 0,
  balanceValue: 0,
  balanceType: 0
};

export const BNB_INFO: TokenInfo = {
  symbol: 'BNB',
  name: 'BNB',
  address: ADDRESS,
  type: 1, //0=>eth, 1 =>erc20, 2 => erc721, 3 => erc1155
  isDefault: true,
  decimals: 18,
  chainType: 'eth',
  icon: URL + '/image/token/bnb.svg',
  balance: BigNumber.from(0),
  spendingValue: 0,
  balanceValue: 0,
  balanceType: 0
};

export const STABLE_CURRENCY_LIST: any = {
  // Mainnet
  1: [
    {
      symbol: 'USDT',
      name: 'USDT',
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      type: 1,
      decimals: 6,
      chainType: 'eth',
      chainId: 1,
      icon: 'https://etherscan.io/token/images/tethernew_32.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'USDC',
      name: 'USDC',
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      type: 1,
      decimals: 6,
      chainType: 'eth',
      chainId: 1,
      icon: 'https://etherscan.io/token/images/centre-usdc_28.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'DAI',
      name: 'DAI',
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      type: 1,
      decimals: 18,
      chainType: 'eth',
      chainId: 1,
      icon: 'https://etherscan.io/token/images/MCDDai_32.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'BUSD',
      name: 'BUSD',
      address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
      type: 1,
      decimals: 18,
      chainType: 'eth',
      chainId: 1,
      icon: 'https://etherscan.io/token/images/binanceusd_32.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    }
  ],
  // Goerli (test)
  5: [
    {
      symbol: 'SPD',
      name: 'SPD',
      address: '0x85d9bf0755cff17c20a46e018c0879d1cbcc892a',
      type: 1,
      decimals: 18,
      chainType: 'eth',
      chainId: 5,
      icon: null,
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'TP',
      name: 'TP',
      address: '0x9c5de48f5726b4a27bbd4d4c7a54719a027884b0',
      type: 1,
      decimals: 18,
      chainType: 'eth',
      chainId: 5,
      icon: null,
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'USDC',
      name: 'USDC',
      address: '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
      type: 1,
      decimals: 6,
      chainType: 'eth',
      chainId: 5,
      icon: null,
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    }
  ],
  // eth-sepolia
  11155111: [],
  // BNB
  56: [
    {
      symbol: 'USDT',
      name: 'USDT',
      address: '0x55d398326f99059ff775485246999027b3197955',
      type: 1,
      decimals: 18,
      chainType: 'eth',
      chainId: 56,
      icon: 'https://bscscan.com/token/images/busdt_32.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'USDC',
      name: 'USDC',
      address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      type: 1,
      decimals: 18,
      chainType: 'eth',
      chainId: 56,
      icon: 'https://bscscan.com/token/images/centre-usdc_28.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'DAI',
      name: 'DAI',
      address: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
      type: 1,
      decimals: 18,
      chainType: 'eth',
      chainId: 56,
      icon: 'https://bscscan.com/token/images/dai_32.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'BUSD',
      name: 'BUSD',
      address: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
      type: 1,
      decimals: 18,
      chainType: 'eth',
      chainId: 56,
      icon: 'https://bscscan.com/token/images/busd_32_2.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    }
  ],
  // BNB (test)
  97: [],
  // Polygon
  137: [
    {
      symbol: 'USDT',
      name: 'USDT',
      address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      type: 1,
      decimals: 6,
      chainType: 'eth',
      chainId: 137,
      icon: 'https://polygonscan.com/token/images/tether_32.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'USDC.e',
      name: 'USDC.e',
      address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      type: 1,
      decimals: 6,
      chainType: 'eth',
      chainId: 137,
      icon: 'https://polygonscan.com/token/images/centre-usdc_32.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'USDC',
      name: 'USDC',
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      type: 1,
      decimals: 6,
      chainType: 'eth',
      chainId: 137,
      icon: 'https://polygonscan.com/token/images/centre-usdc_32.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'DAI',
      name: 'DAI',
      address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      type: 1,
      decimals: 18,
      chainType: 'eth',
      chainId: 137,
      icon: 'https://polygonscan.com/token/images/mcdDai_32.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'BUSD',
      name: 'BUSD',
      address: '0x9C9e5fD8bbc25984B178FdCE6117Defa39d2db39',
      type: 1,
      decimals: 18,
      chainType: 'eth',
      chainId: 137,
      icon: 'https://polygonscan.com/token/images/busdnew_32.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    }
  ],
  // Mumbai (test)
  80001: [
    {
      symbol: 'SPD',
      name: 'SPD',
      address: '0x88d1071c2dfe9d15e6d338a48415b33bfc8536d8',
      type: 1,
      decimals: 18,
      chainType: 'eth',
      chainId: 80001,
      icon: null,
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'USDC',
      name: 'USDC',
      address: '0x9999f7fea5938fd3b1e26a12c3f2fb024e194f97',
      type: 1,
      decimals: 6,
      chainType: 'eth',
      chainId: 80001,
      icon: null,
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    }
  ],
  // Amoy (test)
  80002: [],
  // Arbitrum
  42161: [
    {
      symbol: 'USDT',
      name: 'USDT',
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      type: 1,
      decimals: 6,
      chainType: 'eth',
      chainId: 42161,
      icon: 'https://arbiscan.io/token/images/tether_32.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'USDC',
      name: 'USDC',
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      type: 1,
      decimals: 6,
      chainType: 'eth',
      chainId: 42161,
      icon: 'https://arbiscan.io/token/images/centre-usdc_28.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'DAI',
      name: 'DAI',
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      type: 1,
      decimals: 18,
      chainType: 'eth',
      chainId: 42161,
      icon: 'https://arbiscan.io/token/images/MCDDai_32.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    }
  ],
  // Arbitrum-goerli (test)
  421613: [],
  // Arbitrum-sepolia (test)
  421614: [],
  // Linea-goerli (test)
  59140: [
    {
      symbol: 'SPD',
      name: 'SPD',
      address: '0xeB0Fe8b6Ff5BC99913c260ed02D386ac83a4f061',
      type: 1,
      decimals: 18,
      chainType: 'eth',
      chainId: 59140,
      icon: null,
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    }
  ],
  // Linea-sepolia (test)
  59141: [],
  // Linea
  59144: [
    {
      symbol: 'USDT',
      name: 'USDT',
      address: '0xa219439258ca9da29e9cc4ce5596924745e12b93',
      type: 1,
      decimals: 6,
      chainType: 'eth',
      chainId: 59144,
      icon: 'https://lineascan.build/token/images/usdtlogo_32.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    },
    {
      symbol: 'USDC.e',
      name: 'USDC.e',
      address: '0x176211869ca2b568f2a7d4ee941e073a821ee1ff',
      type: 1,
      decimals: 6,
      chainType: 'eth',
      chainId: 59144,
      icon: 'https://lineascan.build/token/images/centre-usdc_28.png',
      spendingValue: 0,
      balanceValue: 0,
      balanceType: 0
    }
  ],
  // Optimism
  10: [],
  // Optimism-sepolia (test)
  11155420: []
};
