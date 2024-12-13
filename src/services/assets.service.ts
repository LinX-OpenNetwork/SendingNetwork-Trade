import { TokenInfo, NftCollection, NftSelector } from '@/types';
import { ENV, NULL_ADDRESS, NULL_ADDRESS_0, WALLET_CHAIN_CONFIG } from '@/constants';
import {
  queryTokens,
  getDefaultToken,
  getDefaultTokenAndValue,
  getTokenList,
  getTokenListByApi,
  OrderService_getTokenListBySpending,
  TokenDataService_getNftsByOwnerAddress,
  getNftSpendingList,
  getUsdTokens,
  TokenDataService_getBatchToken
} from '@/services';
import { getToken, isNativeToken } from '@/utils';
import { findIndex, cloneDeep, orderBy, find, isArray, groupBy } from 'lodash';
import { getOwnerUsdTokens } from '@/pages/collection-detail/data_util';

export async function Assets_getTokenListAll(chainId: number, ownerAddress: string, dispatch: any) {
  const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId })?.chainAssetsType;
  const accessToken = getToken();
  if (ownerAddress && accessToken) {
    dispatch({
      type: 'assets/updateTokenLoading',
      payload: {
        chain: chainAssetsType,
        value: true
      }
    });
    const res = await getTokenListByApi({
      chainId,
      publicKey: ownerAddress
    })
      .catch((error) => {
        console.log('error', error);
      })
      .finally(() => {
        dispatch({
          type: 'assets/updateTokenLoading',
          payload: {
            chain: chainAssetsType,
            value: false
          }
        });
      });
    if (res) {
      dispatch({
        type: 'assets/updatePublicKey',
        payload: ownerAddress
      });
      dispatch({
        type: 'assets/updateTokenList',
        payload: {
          chain: chainAssetsType,
          value: res
        }
      });
    }
  }
}

export async function Assets_getNFTListByApi(chainId: number, ownerAddress: string, nftType: number, dispatch: any) {
  const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId })?.chainAssetsType;
  if (!ownerAddress) return;
  dispatch({
    type: 'assets/updateNftLoading',
    payload: {
      chain: chainAssetsType,
      value: true
    }
  });
  let listTemp: NftCollection[] = [];
  const nfts = await TokenDataService_getNftsByOwnerAddress(ownerAddress, nftType, chainId)
    .catch(() => {
      console.log('Failed to get NFT list');
    })
    .finally(() => {
      dispatch({
        type: 'assets/updateNftLoading',
        payload: {
          chain: chainAssetsType,
          value: false
        }
      });
    });

  (nfts || []).forEach((item) => {
    item.chainType = 'eth';
    item.chainId = chainId;
    item.balanceType = 2;
    let collectionItem = {
      isExpanded: false,
      id: item.contractAddress,
      title: item.collection || '',
      icon: item?.collectionLogo || '',
      contractAddress: item.contractAddress,
      chainId,
      children: [item],
      type: item?.type
    };
    let existIndex = findIndex(listTemp, {
      contractAddress: item.contractAddress
    });
    if (existIndex >= 0) {
      let childrenItem = cloneDeep(listTemp[existIndex].children);
      childrenItem?.push(item);
      listTemp[existIndex].children = childrenItem?.sort(function (a: NftSelector, b: NftSelector) {
        return Number(a.id) - Number(b.id);
      });
    } else {
      listTemp.push(collectionItem);
    }
  });
  // order by title
  listTemp = orderBy(
    listTemp,
    [
      function (item) {
        if (item.title && item.title !== '') {
          return item.title.substring(0, 1).toLocaleUpperCase();
        } else {
          return item.title;
        }
      }
    ],
    ['asc']
  );
  dispatch({
    type: 'assets/updatePublicKey',
    payload: ownerAddress
  });
  dispatch({
    type: 'assets/updateNftList',
    payload: {
      chain: chainAssetsType,
      value: listTemp
    }
  });
}

export async function Assets_getDefaultTokenApi(chainId: number, ownerAddress: string, dispatch: any) {
  const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId })?.chainAssetsType;
  const token = await getDefaultTokenAndValue({ chainId, publicKey: ownerAddress }, true, false, true);
  // console.log('getDefaultTokenApi', token);
  dispatch({
    type: 'assets/updateDefaultToken',
    payload: {
      chain: chainAssetsType,
      value: token
    }
  });
}

export async function Assets_getTokenListBySpending(dispatch: any) {
  const accessToken = getToken();
  if (accessToken) {
    dispatch({
      type: 'assets/updateSpendingTokenLoading',
      payload: true
    });
    const res = await OrderService_getTokenListBySpending().finally(() => {
      dispatch({
        type: 'assets/updateSpendingTokenLoading',
        payload: false
      });
    });
    dispatch({
      type: 'assets/updateSpendingTokenList',
      payload: res
    });
    //
    const spendingList = await getBatchTokenPrice(res);
    dispatch({
      type: 'assets/updateSpendingTokenList',
      payload: spendingList
    });
  }
}

export async function Assets_getNftListBySpending(chainId: number, nftType: number, dispatch: any) {
  let result: NftCollection[] = [];
  // let checkedNftsTemp: NftSelector[] = cloneDeep(checkedNfts);
  const accessToken = getToken();
  const walletChainId = chainId;
  const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId: walletChainId })?.chainAssetsType;
  if (accessToken && walletChainId) {
    const res = await getNftSpendingList({
      accessToken
    }).finally(() => {
      dispatch({
        type: 'assets/spendingNftLoading',
        payload: {
          chain: chainAssetsType,
          value: false
        }
      });
    });
    // console.log('getSpendingList', res);
    let resList = [];
    if (res && res.success && res.result) {
      if (walletChainId) {
        resList = (res.result?.rows).filter(
          (item: any) => item.chainId == walletChainId && item.tokenType === (nftType === 1 ? '721' : '1155')
        );
      } else {
        resList = (res.result?.rows).filter((item: any) => item.tokenType === (nftType === 1 ? '721' : '1155'));
      }
      (resList || []).forEach((item: any) => {
        let childs: NftSelector[] = [];
        item?.details.forEach((childItem: any) => {
          let detailItem: NftSelector = {
            id: childItem?.tokenId,
            title: item?.collectName,
            parentId: item.tokenAddress,
            contractAddress: item.tokenAddress,
            chainId: item?.chainId,
            type: item?.tokenType === '721' ? 1 : 2,
            icon: childItem.tokenIcon,
            spendingBalance: childItem?.tokenAmount,
            isChecked: false,
            collection: item?.collectName,
            collectionLogo: item?.collectIcon,
            balanceType: 1
          };
          childs.push(detailItem);
        });
        result.push({
          isExpanded: false,
          id: item?.tokenAddress,
          title: item?.collectName,
          icon: item?.collectIcon,
          contractAddress: item?.tokenAddress,
          children: orderBy(childs, ['id'], ['asc'])
        });
      });
    }
  }
  if (result?.length > 0) {
    // setCheckedNfts(checkedNftsTemp);
    // order by title
    result = orderBy(
      result,
      [
        function (item) {
          if (item.title && item.title !== '') {
            return item.title.substring(0, 1).toLocaleUpperCase();
          } else {
            return item.title;
          }
        }
      ],
      ['asc']
    );
    dispatch({
      type: 'assets/updateSpendingNftList',
      payload: result
    });
  } else {
    dispatch({
      type: 'assets/spendingNftLoading',
      payload: {
        chain: chainAssetsType,
        value: false
      }
    });
    dispatch({
      type: 'assets/updateSpendingNftList',
      payload: []
    });
  }
}

export async function Assets_getTopTokenList(chainId: number, dispatch: any) {
  const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId })?.chainAssetsType;
  dispatch({
    type: 'assets/updateTopTokenLoading',
    payload: {
      chain: chainAssetsType,
      value: true
    }
  });
  let tokens: TokenInfo[] = [];
  if (ENV === 'test') {
    const resp = await queryTokens({
      key: '',
      chainId,
      limit: 20
    })
      .catch(() => {})
      .finally(() => {
        dispatch({
          type: 'assets/updateTopTokenLoading',
          payload: {
            chain: chainAssetsType,
            value: false
          }
        });
      });
    if (resp && resp?.result) {
      tokens = resp?.result?.map((item: any) => {
        item!.icon = item?.logo;
        return item;
      });
    }
    if (chainId) {
      let tokenTemp = getDefaultToken({
        chainId
      });
      delete tokenTemp.balanceValue;
      tokens.unshift(tokenTemp);
    }
  } else {
    const resp = await getTokenList(chainId).finally(() => {
      dispatch({
        type: 'assets/updateTopTokenLoading',
        payload: {
          chain: chainAssetsType,
          value: false
        }
      });
    });
    tokens = resp?.result?.crypto_list?.map((item: any) => {
      return {
        symbol: item?.symbol,
        name: item?.name,
        address: item?.contract_address,
        decimals: item?.decimals, //
        icon: item?.image_url,
        price: item?.current_price?.price,
        chainType: 'eth',
        chainId
      };
    });
  }

  // console.log('isReceive, tokens=', tokens);
  dispatch({
    type: 'assets/updateTopTokenList',
    payload: {
      chain: chainAssetsType,
      value: tokens
    }
  });
}

export async function Assets_getBillUsdTokenList(usdTokens: any, ownerAddress: string, dispatch: any) {
  if (!isArray(usdTokens) || usdTokens?.length <= 0) {
    return;
  }
  dispatch({
    type: 'assets/updateBillUsdTokenLoading',
    payload: true
  });
  const payUsdTokens: TokenInfo[] = await getOwnerUsdTokens(usdTokens, ownerAddress);
  console.log('dispatchUsdTokenList', payUsdTokens, ownerAddress);
  dispatch({
    type: 'assets/updateBillUsdTokenList',
    payload: payUsdTokens
  });
  dispatch({
    type: 'assets/updateBillUsdTokenLoading',
    payload: false
  });
}

export async function Assets_getUSDTokenList(dispatch: any) {
  const accessToken = getToken();
  if (!accessToken) {
    return;
  }
  dispatch({
    type: 'assets/updateUsdTokenLoading',
    payload: true
  });
  const res = await getUsdTokens(accessToken).finally(() => {
    dispatch({
      type: 'assets/updateUsdTokenLoading',
      payload: false
    });
  });
  if (res && res?.success && res?.result) {
    const result = res?.result?.map((item: any) => {
      return {
        id: item?.id,
        isChecked: item?.used,
        symbol: item?.tokenSymbol,
        name: item?.tokenName,
        address: item?.tokenAddress,
        type: 1,
        decimals: item?.tokenDecimal,
        chainType: 'eth',
        chainId: item?.chainId,
        icon: item?.tokenIcon,
        spendingValue: 0,
        balanceValue: 0,
        balanceType: 0
      };
    });
    dispatch({
      type: 'assets/updateUsdTokenList',
      payload: result
    });
    //
    const usdList = await getBatchTokenPrice(result);
    dispatch({
      type: 'assets/updateUsdTokenList',
      payload: usdList
    });
  }
}

async function getBatchTokenPrice(res: any) {
  const resGroup = groupBy(res, 'chainId');
  const resGroupKeys = Object.keys(resGroup);
  // console.log('getBatchTokenPrice', res, resGroupKeys);
  for (let i = 0; i < resGroupKeys?.length; i++) {
    let chainIdkey = Number(resGroupKeys[i]);
    let tokenStr = '';
    resGroup?.[chainIdkey].forEach((item) => {
      tokenStr += (isNativeToken(item?.address) ? NULL_ADDRESS_0 : item?.address) + ',';
    });
    if (tokenStr !== '') {
      tokenStr = tokenStr.substring(0, tokenStr?.length - 1);
    }
    // console.log('getBatchTokenPrice-token', tokenStr, chainIdkey);
    const resChainMeta = await TokenDataService_getBatchToken(tokenStr, chainIdkey);
    // console.log('getBatchTokenPrice-resChainMeta', tokenStr, resChainMeta, chainIdkey);
    if (resChainMeta) {
      for (let resItemAddress of Object.keys(resChainMeta)) {
        let spdItem = find(
          res,
          (o) =>
            chainIdkey === o.chainId && (isNativeToken(resItemAddress) ? NULL_ADDRESS : resItemAddress) === o.address
        );
        if (spdItem) {
          spdItem!.price = resChainMeta[resItemAddress]?.current_price?.price;
        }
      }
    }
  }

  return res;
}
