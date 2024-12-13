import { find } from 'lodash';
import { ETH_SUPPORTED_CHAINS } from '@/constants';
import { IChainData } from '@/lib/wallet-selector/types';
import { checkSourceType } from '@/utils';
import { INFURA_ID } from './eth/chains';

export * from './eth/token';
export * from './eth/contract';
export * from './eth/chains';
export * from './routes-config';

export const PROJECT_NAME = 'Transfer';

export const ENV = process.env.ENV;
export const SHARE_URL_CSR = window.location.protocol + '//' + window.location.host; //csr
export const SHARE_URL = ENV === 'test' ? 'https://share.web3-tp.net/trans' : 'https://share.socialswap.com/trans'; //ssr
export const STATIC_CDN = 'https://cdn.sending.me/sw/transfer';
export const UNKNOWN_TOKEN_IMG = STATIC_CDN + '/image/token/unknown_dark.png';
export const UNKNOWN_NFT_IMG = STATIC_CDN + '/image/nfts/default.png';
export const WEB_URL = ENV !== 'test' ? 'https://transfer.socialswap.com' : 'https://transfer.web3-tp.net';
export const SPD_WEB_URL = ENV === 'test' ? `https://spd.web3-tp.net` : `https://spd.socialswap.com`;
export const BOX_WEB_URL = ENV === 'test' ? `https://red3.web3-tp.net` : `https://luckbox.socialswap.com`;
export const LOCAL_USER_TOKEN = PROJECT_NAME + '_User_Token';
export const LOCAL_USER_INFO = PROJECT_NAME + '_Local_User';
export const AUTH_USER_INFO = PROJECT_NAME + '_Auth_User';
export const CLIENT_PRE_PATH = PROJECT_NAME + '_PRE_PATH';
export const LOCAL_SDN_USER = PROJECT_NAME + '_USER';
export const LOCAL_ETH_CHAIN_ID = PROJECT_NAME + '_ETH_CHAIN_ID';
export const LOCAL_CONNECTED_CHAIN_ID = PROJECT_NAME + '_CONNECTED_CHAIN_ID';
export const LOCAL_NFT_SHOW_TYPE = PROJECT_NAME + '_NFT_SHOW_TYPE';
export const LOCAL_LOGIN_TYPE = PROJECT_NAME + '_LOGIN_TYPE';
export const LOCAL_AUTH_ACCOUNT_ADDRESS = PROJECT_NAME + '_AUTH_ACCOUNT';
export const LOCAL_CREATED_TOKEN = PROJECT_NAME + '_CREATED_TOKEN';
export const LOCAL_BUY_CURRENCY = PROJECT_NAME + '_BUY_CURRENCY';
export const LOCAL_SELL_CURRENCY = PROJECT_NAME + '_SELL_CURRENCY';
export const LOCAL_USER_WALLETS = PROJECT_NAME + '_MULTI_WALLETS';
export const LOCAL_WALLET_NAME = PROJECT_NAME + '_WALLET';

export const NULL_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const NULL_ADDRESS_0 = '0x0000000000000000000000000000000000000000';
export const NULL_ADDRESS_1 = '0x0000000000000000000000000000000000001010';

// linx
export const IS_LINX_AUTH = false;
export const SDN_URL = process.env.LINX_WEB_URL;
export const SDM_URL = ENV === 'test' ? 'https://app-alpha.sending.me' : 'https://app.sending.me';
export const LINX_WEB_URL = checkSourceType() === 'SDN' ? SDN_URL : SDM_URL;
export const LINX_SERVER_URL = process.env.LINX_SERVER_URL;
export const LINX_AUTH_INFO = {
  clientId: process.env.LINX_CLIENT_ID,
  redirectUri: process.env.LINX_REDIRECT_URI,
  marketName: process.env.LINX_MARKET_NAME
};

// eth network
// @ts-ignore
export const ENV_ETH_CHAIN_IDS: number[] = process.env.ETH_CHAIN_IDS || [1];
const findNetwork: IChainData | undefined = find(ETH_SUPPORTED_CHAINS, { chain_id: ENV_ETH_CHAIN_IDS[0] });
export const ETH_NETWORK_CONFIG: IChainData = findNetwork || ETH_SUPPORTED_CHAINS[0];
export const DEFAULT_CHAIN_ID = ENV === 'test' ? 97 : 56;
// wallet chain selector list
export const WALLET_CHAIN_CONFIG = [
  {
    chainId: 0,
    name: 'All Chains',
    chainIcon: `/image/token/chain_all.png`,
    chainIconBg: undefined,
    chainAssetsType: 'all',
    sdmWallet: undefined
  },
  ...ENV_ETH_CHAIN_IDS.map((item) => {
    const chainInfo = find(ETH_SUPPORTED_CHAINS, { chain_id: item });
    return {
      chainId: item,
      chainIcon: chainInfo?.chain_icon,
      chainIconBg: chainInfo?.chain_icon_bg,
      chainType: 'eth',
      chainAssetsType: chainInfo?.assets_type,
      name: chainInfo?.show_chain_name,
      sdmWallet: chainInfo?.sdm_wallet
    };
  })
];

export const ETH_CHAINS = [1, 5, 11155111];
export const POLYGON_CHAINS = [137, 80001, 80002];
export const ARBITRUM_CHAINS = [42161, 421613, 421614];
export const BNB_CHAINS = [56, 97];
export const LINEA_CHAINS = [59140, 59141, 59144];
export const OPTIMISM_CHAINS = [10, 11155420];
export const TEST_CHAINS = [11155111, 5, 97, 80001, 80002, 421613, 421614, 11155420];

export const PARTICLE_AUTH_TYPES: string[] = ['twitter', 'google', 'apple', 'discord'];
export const PATICLE_CONFIG = {
  REACT_APP_PROJECT_ID: '57a46f00-4bc8-4c55-9e1b-89406ff546c4',
  REACT_APP_CLIENT_KEY: 'cTtPRIvZKbmBVqUeYT3eTF2ZMCl6KjUsOJUxejwy',
  REACT_APP_APP_ID: '962fbbb4-ed05-48e9-b03c-7f9c4f526284'
};

// WALLETCONNECT_V2
export const WALLETCONNECT_V2_NAME = 'Transfer';
export const WALLETCONNECT_V2_PROJECT_ID = 'a7ced483b016406fb0cc4545b09e430f';
export const WALLETCONNECT_V2_RPC = {
  // eth
  1: `https://mainnet.infura.io/v3/${INFURA_ID}`,
  5: `https://goerli.infura.io/v3/${INFURA_ID}`,
  11155111: `https://sepolia.infura.io/v3/${INFURA_ID}`,
  // ply
  137: `https://polygon-mainnet.infura.io/v3/${INFURA_ID}`,
  80001: `https://polygon-mumbai.infura.io/v3/${INFURA_ID}`,
  80002: `https://polygon-amoy.infura.io/v3/${INFURA_ID}`,
  // bnb
  56: `https://bsc-dataseed.binance.org/`,
  97: `https://data-seed-prebsc-1-s2.binance.org:8545/`,
  // arb
  42161: `https://arbitrum-mainnet.infura.io/v3/${INFURA_ID}`,
  421613: `https://sepolia-rollup.arbitrum.io/rpc`,
  421614: `https://arbitrum-goerli.infura.io/v3/${INFURA_ID}`,
  // linea
  59140: `https://rpc.goerli.linea.build/`,
  59141: `https://rpc.sepolia.linea.build/`,
  59144: `https://rpc.linea.build`,
  // optimism
  10: `https://mainnet.optimism.io`,
  11155420: `https://sepolia.optimism.io`
};
