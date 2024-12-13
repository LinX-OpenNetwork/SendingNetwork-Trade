import { useEffect } from 'react';
import { useSelector, useDispatch } from 'dva';
import { WALLET_CHAIN_CONFIG } from '@/constants';
import {
  Assets_getTokenListAll,
  Assets_getNFTListByApi,
  Assets_getDefaultTokenApi,
  Assets_getTokenListBySpending,
  Assets_getTopTokenList,
  Assets_getUSDTokenList
} from '@/services';
import { find } from 'lodash';
import { history } from 'umi';
import { getToken } from '@/utils';

const useFetchAssets = () => {
  const dispatch = useDispatch();
  const { authedAccountInfo } = useSelector((state: any) => state.store);
  const {
    assetsPublicKey,
    ethTokenLoading,
    ethTokenList,
    ethNftLoading,
    ethNftList,
    assetsDefaultToken,
    polygonTokenLoading,
    polygonTokenList,
    polygonNftLoading,
    polygonNftList,
    arbitrumTokenLoading,
    arbitrumTokenList,
    arbitrumNftLoading,
    arbitrumNftList,
    bnbTokenLoading,
    bnbTokenList,
    lineaTokenLoading,
    lineaTokenList,
    spendingTokenLoading,
    spendingTokenList,
    ethTopTokenLoading,
    ethTopTokenList,
    polygonTopTokenLoading,
    polygonTopTokenList,
    arbitrumTopTokenLoading,
    arbitrumTopTokenList,
    bnbTopTokenLoading,
    bnbTopTokenList,
    bnbNftLoading,
    bnbNftList,
    lineaTopTokenLoading,
    lineaTopTokenList,
    lineaNftLoading,
    lineaNftList,
    optimismTokenLoading,
    optimismTokenList,
    optimismTopTokenLoading,
    optimismTopTokenList,
    optimismNftLoading,
    optimismNftList,
    usdTokenList
  } = useSelector((state: any) => state.assets);
  const nftType = 1;

  /**
   *
   * @param type
   * 1: tokenLoading
   * 2: tokenList
   * 3: topTokenLoading
   * 4: topTokenList
   * 5: nftLoading
   * 6: nftList
   * 7: defaultToken
   * @returns
   */
  function selectAssetsList(type: number, chainId: number) {
    let data;
    const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId })?.chainAssetsType;
    switch (chainAssetsType) {
      case 'eth':
        if (type === 1) {
          data = ethTokenLoading;
        } else if (type === 2) {
          data = ethTokenList;
        } else if (type === 3) {
          data = ethTopTokenLoading;
        } else if (type === 4) {
          data = ethTopTokenList;
        } else if (type === 5) {
          data = ethNftLoading;
        } else if (type === 6) {
          data = ethNftList;
        } else if (type === 7) {
          data = assetsDefaultToken?.[chainAssetsType];
        }
        break;
      case 'polygon':
        if (type === 1) {
          data = polygonTokenLoading;
        } else if (type === 2) {
          data = polygonTokenList;
        } else if (type === 3) {
          data = polygonTopTokenLoading;
        } else if (type === 4) {
          data = polygonTopTokenList;
        } else if (type === 5) {
          data = polygonNftLoading;
        } else if (type === 6) {
          data = polygonNftList;
        } else if (type === 7) {
          data = assetsDefaultToken?.[chainAssetsType];
        }
        break;
      case 'arbitrum':
        if (type === 1) {
          data = arbitrumTokenLoading;
        } else if (type === 2) {
          data = arbitrumTokenList;
        } else if (type === 3) {
          data = arbitrumTopTokenLoading;
        } else if (type === 4) {
          data = arbitrumTopTokenList;
        } else if (type === 5) {
          data = arbitrumNftLoading;
        } else if (type === 6) {
          data = arbitrumNftList;
        } else if (type === 7) {
          data = assetsDefaultToken?.[chainAssetsType];
        }
        break;
      case 'bnb':
        if (type === 1) {
          data = bnbTokenLoading;
        } else if (type === 2) {
          data = bnbTokenList;
        } else if (type === 3) {
          data = bnbTopTokenLoading;
        } else if (type === 4) {
          data = bnbTopTokenList;
        } else if (type === 5) {
          data = bnbNftLoading;
        } else if (type === 6) {
          data = bnbNftList;
        } else if (type === 7) {
          data = assetsDefaultToken?.[chainAssetsType];
        }
        break;
      case 'linea':
        if (type === 1) {
          data = lineaTokenLoading;
        } else if (type === 2) {
          data = lineaTokenList;
        } else if (type === 3) {
          data = lineaTopTokenLoading;
        } else if (type === 4) {
          data = lineaTopTokenList;
        } else if (type === 5) {
          data = lineaNftLoading;
        } else if (type === 6) {
          data = lineaNftList;
        } else if (type === 7) {
          data = assetsDefaultToken?.[chainAssetsType];
        }
        break;
      case 'optimism':
        if (type === 1) {
          data = optimismTokenLoading;
        } else if (type === 2) {
          data = optimismTokenList;
        } else if (type === 3) {
          data = optimismTopTokenLoading;
        } else if (type === 4) {
          data = optimismTopTokenList;
        } else if (type === 5) {
          data = optimismNftLoading;
        } else if (type === 6) {
          data = optimismNftList;
        } else if (type === 7) {
          data = assetsDefaultToken?.[chainAssetsType];
        }
        break;
      default:
        break;
    }

    return data;
  }

  async function getTopTokenList(chainId: number) {
    if (selectAssetsList(4, chainId)?.length > 0) return;
    Assets_getTopTokenList(chainId, dispatch);
  }

  async function getTokenListAll(chainId: number) {
    if (assetsPublicKey?.toUpperCase() === authedAccountInfo?.publicKey?.toUpperCase()) {
      if (selectAssetsList(2, chainId)?.length > 0) return;
    }
    Assets_getTokenListAll(chainId, authedAccountInfo?.publicKey, dispatch);
  }

  async function getNFTListByApi(chainId: number) {
    if (assetsPublicKey?.toUpperCase() === authedAccountInfo?.publicKey?.toUpperCase()) {
      if (selectAssetsList(6, chainId)?.length > 0) return;
    }
    Assets_getNFTListByApi(chainId, authedAccountInfo?.publicKey, nftType, dispatch);
  }

  async function getDefaultTokenApi(chainId: number) {
    if (assetsPublicKey?.toUpperCase() === authedAccountInfo?.publicKey?.toUpperCase()) {
      if (selectAssetsList(7, chainId)) return;
    }
    Assets_getDefaultTokenApi(chainId, authedAccountInfo?.publicKey, dispatch);
  }

  async function getUSDTokensAll() {
    if (usdTokenList?.length > 0) {
      return;
    }
    Assets_getUSDTokenList(dispatch);
  }

  async function refreshTopTokenList() {
    if (authedAccountInfo?.chainId) {
      getTopTokenList(authedAccountInfo?.chainId);
    } else {
      WALLET_CHAIN_CONFIG.forEach((item) => {
        if (item?.chainId) {
          getTopTokenList(item?.chainId);
        }
      });
    }
  }

  async function refreshTokenList() {
    if (authedAccountInfo?.chainId) {
      getTokenListAll(authedAccountInfo?.chainId);
    } else {
      WALLET_CHAIN_CONFIG.forEach((item) => {
        if (item?.chainId) {
          getTokenListAll(item?.chainId);
        }
      });
    }
  }

  async function refreshNftList() {
    if (authedAccountInfo?.chainId) {
      getNFTListByApi(authedAccountInfo?.chainId);
    } else {
      WALLET_CHAIN_CONFIG.forEach((item) => {
        if (item?.chainId) {
          getNFTListByApi(item?.chainId);
        }
      });
    }
  }

  async function refreshDefaultToken() {
    if (authedAccountInfo?.chainId) {
      getDefaultTokenApi(authedAccountInfo?.chainId);
    } else {
      WALLET_CHAIN_CONFIG.forEach((item) => {
        if (item?.chainId) {
          getDefaultTokenApi(item?.chainId);
        }
      });
    }
  }

  // DefaultToken
  useEffect(() => {
    if (
      (history.location?.pathname === '/collection-detail' ||
        (history.location?.pathname === '/create' && history.location.query?.type?.toString() !== 'receive')) &&
      authedAccountInfo?.publicKey
    ) {
      refreshDefaultToken();
    }
  }, [history.location?.pathname, authedAccountInfo?.publicKey?.toUpperCase()]);

  // TopTokenList
  useEffect(() => {
    // TopTokenList
    if (
      (history.location?.pathname === '/payment-code' ||
        history.location?.pathname === '/collection' ||
        history.location.query?.type?.toString() === 'receive') &&
      authedAccountInfo?.publicKey
    ) {
      refreshTopTokenList();
    }
  }, [authedAccountInfo?.chainId, history.location?.pathname, getToken()]);

  // TokenListBySpending
  useEffect(() => {
    // Spending
    if (['/create', '/collection-detail'].indexOf(history.location?.pathname) >= 0) {
      Assets_getTokenListBySpending(dispatch);
      // getNftListBySpending();
    }
  }, [history.location?.pathname, getToken()]);

  // USDList
  useEffect(() => {
    if (
      ['/collection', '/collection-detail', '/payment-code'].indexOf(history.location?.pathname) >= 0 ||
      (history.location.pathname === '/create' && history.location.query?.type?.toString() === 'receive')
    ) {
      getUSDTokensAll();
    }
  }, [history.location?.pathname, getToken()]);

  return {
    refreshTokenList,
    refreshNftList
  };
};

export default useFetchAssets;
