import { getSpendingList, getDefaultToken } from '@/services';
import { TokenInfo } from '@/types';
import { orderBy, concat } from 'lodash';
import { getToken, isNativeToken } from '@/utils';
import { ENV_ETH_CHAIN_IDS } from '@/constants';

export async function OrderService_getTokenListBySpending() {
  let result: TokenInfo[] = [];

  let accessToken = getToken();
  if (accessToken) {
    const resData = await _getAllSpendingList(accessToken, 0, []);
    // console.log('getSpendingList', res);
    let resList = [];
    if (resData) {
      resList = resData;
      resList.forEach((item: any) => {
        if (!item?.tokenSymbol || ENV_ETH_CHAIN_IDS?.indexOf(item?.chainId) < 0) return;
        let tokenObj = {
          symbol: item?.tokenSymbol,
          name: item?.tokenSymbol,
          address: item?.tokenMint,
          type: 1,
          decimals: item?.tokenDecimal,
          chainType: 'eth',
          chainId: item?.chainId,
          icon: item?.tokenIcon,
          spendingValue: item.tokenAmount ? Number(item.tokenAmount) : item.tokenAmount,
          balanceType: 1,
          order: 1
        };
        if (isNativeToken(item?.tokenMint)) {
          let defaultToken = getDefaultToken({ chainId: item?.chainId });
          defaultToken = { ...tokenObj, icon: defaultToken?.icon, type: 0, order: 2 };
          result.push(defaultToken);
        } else {
          result.push(tokenObj);
        }
      });
    }
  }
  let tokenData = orderBy(result, ['order', 'spendingValue'], ['desc', 'desc']);
  return tokenData;
}

async function _getAllSpendingList(accessToken: string, pageNum: number, data: any) {
  const res = await getSpendingList(accessToken, pageNum, 20);
  if (res && res.success && res.result && res.result?.list) {
    data = concat(data, res.result?.list);
    if (res.result?.total > data?.length) {
      pageNum += 1;
      return _getAllSpendingList(accessToken, pageNum, data);
    } else {
      return data;
    }
  }
}
