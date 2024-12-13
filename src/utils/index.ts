import { history } from 'umi';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { isArray, find, findIndex, filter } from 'lodash';
import {
  ETH_NETWORK_CONFIG,
  AUTH_USER_INFO,
  ETH_SUPPORTED_CHAINS,
  LOCAL_CONNECTED_CHAIN_ID,
  LOCAL_USER_TOKEN,
  POLYGON_CHAINS,
  ARBITRUM_CHAINS,
  BNB_CHAINS,
  ETH_CHAINS,
  LOCAL_LOGIN_TYPE,
  LOCAL_USER_INFO,
  LINEA_CHAINS,
  NULL_ADDRESS,
  NULL_ADDRESS_0,
  NULL_ADDRESS_1,
  WALLET_CHAIN_CONFIG,
  LOCAL_WALLET_NAME,
  OPTIMISM_CHAINS
} from '@/constants';
import { LocalStorage_get } from '@/utils';
import { checkToken } from '@/services';
import { IChainData } from '@/lib/wallet-selector/types';
import Web3Utils from 'web3-utils';

export * from './client-util';
export * from './math-util';
export * from './local-storage';
export * from './input-util';
export * from './access-util';
export * from './icon';

export function addressOmitShow(address: string | undefined, front?: number, back?: number) {
  return address ? `${address.slice(0, front || 6)}...${address.substring(address?.length - (back || 4))}` : '';
}

export function formatRedirectUrl(query?: any, paramKey: string = 'state', delKeys?: string[]) {
  let uri = '?';
  query = query || history.location?.query;
  Object.keys(query).forEach((key) => {
    if (key === paramKey) {
      let state = query[key];
      if (state && !isArray(state)) {
        const stateArray = JSON.parse(state) || {};
        Object.keys(stateArray).forEach((sKey) => {
          if (sKey === 'path') {
            uri = stateArray[sKey] + uri;
          } else {
            uri += sKey + '=' + stateArray[sKey] + '&';
          }
        });
      }
    } else {
      if (!delKeys || delKeys.indexOf(key) < 0) {
        uri += key + '=' + query[key] + '&';
      }
    }
  });

  uri = uri.substring(0, uri?.length - 1);
  return uri;
}

export function getHistoryUrl(pathName: string, delKeysParams?: string[]) {
  const queryParams = history.location.query || {};
  const delKeys = delKeysParams ? delKeysParams : ['id'];
  delKeys.push(...['token', 'symbol', 'chainId', 'amount', 'back']);
  let url = pathName,
    query = '';
  Object.keys(queryParams).forEach((key) => {
    if (delKeys.indexOf(key) < 0) {
      query += `${key}=${queryParams[key]}&`;
    }
  });
  if (query !== '') {
    query = query.substring(0, query?.length - 1);
    if (url.indexOf('?') >= 0) {
      url += '&' + query;
    } else {
      url += '?' + query;
    }
  }

  return url;
}

export function getChainName(chainId: number = 1) {
  let chainName = 'eth';
  if (ETH_CHAINS.indexOf(chainId) >= 0) {
    chainName = 'eth';
  } else if (POLYGON_CHAINS.indexOf(chainId) >= 0) {
    chainName = 'polygon';
  } else if (ARBITRUM_CHAINS.indexOf(chainId) >= 0) {
    chainName = 'arbitrum';
  } else if (BNB_CHAINS.indexOf(chainId) >= 0) {
    chainName = 'bnb';
  } else if (LINEA_CHAINS.indexOf(chainId) >= 0) {
    chainName = 'linea';
  } else if (OPTIMISM_CHAINS.indexOf(chainId) >= 0) {
    chainName = 'optimism';
  }
  return chainName;
}

export function getToken(loginType?: number) {
  if (!loginType) {
    loginType = LocalStorage_get(LOCAL_LOGIN_TYPE) ? Number(LocalStorage_get(LOCAL_LOGIN_TYPE)) : 5;
    // return LocalStorage_get(LOCAL_USER_TOKEN + '_' + loginType) || undefined;
  }
  const walletToken = LocalStorage_get(LOCAL_USER_TOKEN + '_7') || undefined;
  const linXToken = LocalStorage_get(LOCAL_USER_TOKEN + '_5') || undefined; //sdm
  const signToken = LocalStorage_get(LOCAL_USER_TOKEN + '_6') || undefined; //walletsign
  const sdnToken = LocalStorage_get(LOCAL_USER_TOKEN + '_8') || undefined; //sdn

  const sourceType = checkSourceType();
  // console.log('getToken-loginType-params', sourceType, loginType);
  if (sourceType === 'SDN') {
    loginType = loginType === 5 ? 8 : loginType;
  }
  // console.log('getToken-loginType', loginType);
  if (loginType === 7) {
    return walletToken;
  } else if (loginType === 5) {
    return linXToken;
  } else if (loginType === 6) {
    return signToken;
  } else if (loginType === 8) {
    return sdnToken;
  } else {
    return walletToken || (sourceType === 'SDM' ? linXToken : sdnToken) || undefined;
  }
}

export async function checkTokenValid(loginType: number, dispatch?: any) {
  let result = { isValid: false, isLinx: false };
  let token;
  const tokenTemp = getToken(loginType);
  if (tokenTemp) {
    result = await checkToken(tokenTemp, dispatch);
    token = tokenTemp;
  } else {
    result.isValid = false;
  }

  return { ...result, token };
}

/**
 * linx-token===>wallet-token
 * linx-user
 * @returns
 */
export async function getTokenFromWalletAndLinx() {
  let isValidToken = false;
  let isLinxUser = false;
  let token;
  // check wallet-token
  const walletRes = await checkTokenValid(7);
  // check linx-token
  const linxRes = await checkTokenValid(5);
  if (linxRes.isValid) {
    isValidToken = true;
    isLinxUser = true;
    token = linxRes.token;
  } else {
    if (walletRes.isLinx) {
      isValidToken = true;
      isLinxUser = true;
      token = walletRes.token;
    } else if (walletRes.isValid) {
      isValidToken = true;
      isLinxUser = false;
      token = walletRes.token;
    }
  }

  return { isValidToken, isLinxUser, token };
}

export function toConnectWallet(
  dispatch: any,
  params: { isCreate?: boolean; isRecoAccount?: boolean; connectWallet?: any }
) {
  const pathName = history?.location?.pathname;
  const isPc = getPlatformInfo()?.isPc;
  const isSdm = getPlatformInfo()?.isSdm;

  const { isCreate, isRecoAccount, connectWallet } = params;
  let isCreateParam = isCreate;
  // 1. after scanning the paymentcode does not go through SDM authorization (not in SDM IOS&And)
  // 2. login with signed wallet
  if (pathName === '/create') {
    if ((isFromScaned() && isSdm) || isPc) {
      isCreateParam = false;
    } else {
      isCreateParam = true;
    }
  }
  if (isSdm && window?.ethereum) {
    connectWallet('Injected');
  } else {
    dispatch({
      type: 'store/setConnectModalVisible',
      payload: { visible: true, isCreate: isCreateParam, isRecoAccount }
    });
  }
}

export function getGasPriceValue(price?: string, chainId?: number | string) {
  let gasPriceValue;
  let chainIdValue;
  if (chainId) {
    chainIdValue = chainId;
  } else {
    chainIdValue = LocalStorage_get(LOCAL_CONNECTED_CHAIN_ID) ?? ETH_NETWORK_CONFIG.chain_id;
    if (chainIdValue.toString().indexOf('0x') >= 0) {
      chainIdValue = Web3Utils.hexToNumberString(chainIdValue.toString());
    }
  }
  chainIdValue = Number(chainIdValue);
  if (price) {
    const chainInfo: IChainData | undefined = find(ETH_SUPPORTED_CHAINS, {
      chain_id: chainIdValue
    });
    const priceRatio: number = chainInfo?.gas_price_ratio || 1;
    gasPriceValue = Math.floor(Number(price) * priceRatio);
  }

  return gasPriceValue;
}

export function getContractErrorMsg(error: any) {
  let msg = error?.message || '';
  try {
    let errMsg = '{}';
    const errMsgIndex = error?.message.indexOf('{');
    if (errMsgIndex >= 0) {
      errMsg = error?.message?.substring(errMsgIndex, error?.message?.length);
    }
    const errMsgJson = JSON.parse(errMsg);
    if (Object.keys(errMsgJson)?.length > 0) {
      msg = errMsgJson?.originalError?.message || errMsgJson?.message || error?.message;
    }
  } catch (catchError) {
    msg = error?.message;
  }

  if (msg === 'insufficient funds for transfer') {
    msg = 'Insufficient balance';
  }

  return msg;
}

export function getViewScanUrl(chainId: number) {
  let chainIndex = findIndex(ETH_SUPPORTED_CHAINS, { chain_id: chainId });
  const chainInfo = chainIndex >= 0 ? ETH_SUPPORTED_CHAINS[chainIndex] : ETH_NETWORK_CONFIG;

  return chainInfo?.block_explorer_url;
}

export function getChainRpc(chainId: number) {
  const chainInfo = find(ETH_SUPPORTED_CHAINS, { chain_id: chainId }) || ETH_NETWORK_CONFIG;

  return chainInfo?.rpc_url;
}

export function isFromScaned() {
  let result = false;
  const queryParams = history.location.query;
  const pathName = history?.location?.pathname;
  if (pathName === '/create' && (queryParams?.address || queryParams?.userId) && queryParams?.from !== 'wallet') {
    result = true;
  }

  return result;
}

export function isScanedResult() {
  let result = false;
  const queryParams = history.location.query;
  const pathName = history?.location?.pathname;
  if (pathName === '/order' && queryParams?.from === 'scancode') {
    result = true;
  }

  return result;
}

export function getSourceType() {
  let type = 0;
  const sourceType = checkSourceType();
  switch (sourceType) {
    case 'SDN':
      type = 1;
      break;
    default:
      break;
  }

  return type;
}

export function checkIsInLinx(url?: string) {
  const isSdm = getPlatformInfo()?.isSdm;
  const isLinxIframe = self !== top && url && url.indexOf('sending.me') >= 0 ? true : false;
  // console.log('checkIsInLinx', url, isSdm, isLinxIframe);
  if (isSdm || isLinxIframe) {
    return true;
  } else {
    return false;
  }
}

export function isCanAction(url?: string) {
  // true: inlinx or sdm
  // false: sdn and is not linx
  if (checkSourceType() === 'SDN') {
    const isInLinx = checkIsInLinx(url);
    return isInLinx;
  } else {
    return true;
  }
}

export function particleWalletUIDisplay() {
  const walletValue = LocalStorage_get(LOCAL_WALLET_NAME);
  if (walletValue && ['google', 'discord', 'twitter', 'Particle'].indexOf(walletValue) < 0) {
    const parEle: any = document.getElementsByClassName('particle-pwe-btn')?.[0];
    if (parEle) {
      parEle.style.display = 'none';
    }
  } else {
    const parEle: any = document.getElementsByClassName('particle-pwe-btn')?.[0];
    if (parEle) {
      parEle.style.zIndex = 3;
    }
  }
}

export function getChainIdFromSdmParam(chainParam: string) {
  let chainIdValue;
  if (chainParam?.toLocaleLowerCase() === 'all') {
    chainIdValue = 0;
  } else {
    const findChain = filter(WALLET_CHAIN_CONFIG, (o) => o?.sdmWallet === chainParam?.toString());
    if (findChain && findChain?.length > 0) {
      chainIdValue = findChain[0]?.chainId;
    }
  }

  return chainIdValue;
}

export function getNftLink(contractAddress?: string, id?: string, chainId?: number, link?: string) {
  let nftLink = link ?? '';
  // POLYGON_CHAINS
  if ((!nftLink || nftLink === '') && chainId && contractAddress && id) {
    // nftLink = `https://opensea.io/assets/${isEth ? 'ethereum' : 'matic'}/${contractAddress}/${id}`;
    if (ETH_CHAINS.indexOf(chainId) >= 0) {
      nftLink = `https://opensea.io/assets/ethereum/${contractAddress}/${id}`;
    } else if (POLYGON_CHAINS.indexOf(chainId) >= 0) {
      nftLink = `https://opensea.io/assets/matic/${contractAddress}/${id}`;
    } else if (ARBITRUM_CHAINS.indexOf(chainId) >= 0) {
      nftLink = `https://opensea.io/assets/arbitrum/${contractAddress}/${id}`;
    } else if (BNB_CHAINS.indexOf(chainId) >= 0) {
      nftLink = `https://opensea.io/assets/bsc/${contractAddress}/${id}`;
    } else if (LINEA_CHAINS.indexOf(chainId) >= 0) {
      nftLink = ``;
    } else if (OPTIMISM_CHAINS.indexOf(chainId) >= 0) {
      nftLink = `https://opensea.io/assets/optimism/${contractAddress}/${id}`;
    } else {
      nftLink = `https://opensea.io/assets/ethereum/${contractAddress}/${id}`;
    }
  }

  return nftLink;
}

export function getAuthUserInfo() {
  return JSON.parse(LocalStorage_get(AUTH_USER_INFO) || '{}');
}

export function getLocalUserInfo() {
  return JSON.parse(LocalStorage_get(LOCAL_USER_INFO) || '{}');
}

export function checkSourceType() {
  let sourceType = 'SDM';
  const queryParams = history?.location?.query;
  if (queryParams?.st && queryParams?.st === 'sdn') {
    sourceType = 'SDN';
  }
  if (queryParams?.state && !isArray(queryParams?.state)) {
    const stateArray = JSON.parse(queryParams?.state) || {};
    if (stateArray?.st && stateArray?.st === 'sdn') {
      sourceType = 'SDN';
    }
  }
  return sourceType;
}

export const useUrlParams = (): URLSearchParams => {
  try {
    const url = new URL(location.href);
    return (url.searchParams || {}) as any;
  } catch (error) {
    return new URLSearchParams();
  }
};

export const isNativeToken = (address: string) => {
  return [NULL_ADDRESS, NULL_ADDRESS_0, NULL_ADDRESS_1].indexOf(address) >= 0;
};
