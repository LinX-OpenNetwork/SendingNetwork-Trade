import { getSpendingBalance } from '@/services';
import { TokenInfo } from '@/types';
import {
  ETH_INFO,
  MATIC_INFO,
  BNB_INFO,
  ENV_ETH_CHAIN_IDS,
  ETH_CHAINS,
  ARBITRUM_CHAINS,
  POLYGON_CHAINS,
  BNB_CHAINS,
  LINEA_CHAINS,
  OPTIMISM_CHAINS
} from '@/constants';
import { orderBy } from 'lodash';
import { BigNumber } from '@ethersproject/bignumber';
import { getToken, MathUtil_numberFixed, isNativeToken } from '@/utils';
import {
  TokenDataService_getTokenBalances,
  TokenDataService_getETHPrice,
  TokenDataService_getEthBalance,
  TokenDataService_geERC20TokenBalance
} from '@/services/eth/tokenData.service';
import Web3Utils, { Mixed } from 'web3-utils';

export async function getSpendingBalanceByAddress(address: string, chainId: number = 1) {
  let data = 0;
  const accessToken = getToken();
  if (accessToken && address) {
    const res = await getSpendingBalance(accessToken, 0, chainId, address);
    if (res && res.success && res.result && res.result[0]) {
      data = res.result[0]?.tokenAmount;
    }
  }

  return data;
}

export function getDefaultToken(params: { chainId?: number; publicKey?: string } | null) {
  const chainId = params?.chainId || ENV_ETH_CHAIN_IDS[0];

  let defaultToken: TokenInfo = ETH_INFO;
  if ([...ETH_CHAINS, ...ARBITRUM_CHAINS, ...LINEA_CHAINS, ...OPTIMISM_CHAINS].indexOf(chainId) >= 0) {
    defaultToken = ETH_INFO;
  } else if (POLYGON_CHAINS.indexOf(chainId) >= 0) {
    defaultToken = MATIC_INFO;
  } else if (BNB_CHAINS.indexOf(chainId) >= 0) {
    defaultToken = BNB_INFO;
  }

  return { ...defaultToken, chainId };
}

export async function getDefaultTokenAndValue(
  params: { chainId?: number; publicKey?: string } | null,
  isUpdatePrice?: boolean,
  isUpdateSpendingValue?: boolean,
  isUpdateWalletValue?: boolean
) {
  const chainId = params?.chainId || 1;
  let defaultToken = getDefaultToken(params);
  if (isUpdatePrice) {
    const res = await TokenDataService_getETHPrice(chainId);
    defaultToken.price = res;
  }
  // update spending balance
  if (isUpdateSpendingValue) {
    const spendingRes = await getSpendingBalanceByAddress(defaultToken.address, chainId);
    defaultToken.spendingValue = spendingRes;
  }
  if (isUpdateWalletValue && params?.publicKey && params?.chainId) {
    defaultToken!.balanceValue = await TokenDataService_getEthBalance(params?.publicKey, params?.chainId);
    defaultToken!.balanceValue = Number(defaultToken!.balanceValue);
  }
  return defaultToken;
}

export function getTokenBigNumberAmount(totalAmount: number | undefined, tokenDecimals: number = 18) {
  let res: BigNumber | Mixed;
  const decimalIndex = String(totalAmount).indexOf('.');
  if (!totalAmount) {
    res = BigNumber.from(0);
  } else {
    if (decimalIndex >= 0) {
      let decimalLength = String(totalAmount)?.length - decimalIndex - 1;
      if (tokenDecimals - decimalLength > 0) {
        res = BigNumber.from((totalAmount * 10 ** decimalLength).toFixed(0)).mul(
          BigNumber.from(10).pow(tokenDecimals - decimalLength)
        );
      } else {
        // res = FixedNumber.from(totalAmount);
        res = Web3Utils.toBN((totalAmount * 10 ** tokenDecimals).toFixed(0));
      }
    } else {
      if (totalAmount < 1000) {
        res = BigNumber.from(totalAmount ? totalAmount * 10 ** tokenDecimals + '' : 0);
      } else {
        res = BigNumber.from(totalAmount + '').mul(BigNumber.from(10).pow(tokenDecimals));
      }
    }
  }

  return res;
}

export async function getTokenListByApi(params?: { chainId: number; publicKey: string; balance?: number }) {
  // console.log('getTokenListByApi', params);
  if (params?.publicKey && params?.chainId) {
    const tokens = await TokenDataService_getTokenBalances(params?.publicKey, params?.chainId);
    // order by balanceValue
    return orderBy(tokens, ['order', 'price'], ['desc', 'desc']);
  } else {
    return [];
  }
}

export async function getTokenBalanceFromChain(token: TokenInfo, account?: string, chainId?: number, ethWeb3?: any) {
  let data: number | string | undefined = 0;
  if (isNativeToken(token?.address)) {
    if (ethWeb3 && account) {
      let balance = 0;
      try {
        const balanceRes = await ethWeb3.eth.getBalance(account);
        balance = ethWeb3?.utils.fromWei(balanceRes ? balanceRes : 0, 'ether');
      } catch (error) {}
      data = MathUtil_numberFixed(balance, 4, 'floor');
    } else {
      if (account && chainId) {
        data = await TokenDataService_getEthBalance(account, chainId);
      }
    }
  } else {
    if (token?.address && account && chainId) {
      data = await TokenDataService_geERC20TokenBalance(account, token?.address, chainId, ethWeb3);
    }
  }
  return data;
}
