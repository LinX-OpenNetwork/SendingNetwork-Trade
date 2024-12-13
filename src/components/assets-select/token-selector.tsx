import { useState, useEffect } from 'react';
import { SearchBar } from 'antd-mobile';
import { TokenInfo } from '@/types';
import { TokenDataService_getERC20TokenFromChainByAddress } from '@/services';
import { WEB_URL, WALLET_CHAIN_CONFIG } from '@/constants';
import ListPanelPage from '../token-selector/list-panel';
import { useSelector, useDispatch } from 'dva';
import './index.less';
import ChainSelector from '../page-nav-bar/chain-seletor';
import { find, concat, orderBy } from 'lodash';
import { isNativeToken } from '@/utils';

const AssetsTokenSelector = (props: any) => {
  const dispatch = useDispatch();
  const { setToken, hideBalanceTypeMenu, balanceType, isReceive, isPayUSD, isContainUSD, visible } = props;
  const { authedAccountInfo } = useSelector((state: any) => state.store);
  const {
    ethTokenLoading,
    ethTokenList,
    polygonTokenLoading,
    polygonTokenList,
    arbitrumTokenLoading,
    arbitrumTokenList,
    bnbTokenLoading,
    bnbTokenList,
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
    lineaTokenLoading,
    lineaTokenList,
    lineaTopTokenLoading,
    lineaTopTokenList,
    optimismTokenLoading,
    optimismTokenList,
    optimismTopTokenLoading,
    optimismTopTokenList,
    billUsdTokenLoading,
    billUsdTokenList
  } = useSelector((state: any) => state.assets);

  const [tokenList, setTokenList] = useState<TokenInfo[]>([]);
  const [searchTokenList, setSearchTokenList] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchSpendingList, setSearchSpendingList] = useState<TokenInfo[]>([]);
  const [balanceMenuType, setBalanceMenuType] = useState<number>(balanceType ?? 2);

  async function onTokenSearch(value: string) {
    const list = balanceMenuType === 1 ? spendingTokenList : tokenList;
    if (value) {
      let searchListTemp: TokenInfo[] = [];
      list?.forEach((item: any) => {
        if (
          item?.name?.toUpperCase()?.indexOf(value?.toUpperCase()) >= 0 ||
          item?.symbol?.toUpperCase()?.indexOf(value?.toUpperCase()) >= 0
        ) {
          searchListTemp.push(item);
        }
      });
      if (balanceMenuType === 1) {
        setSearchSpendingList(searchListTemp);
      } else {
        setSearchTokenList(searchListTemp);
      }
    } else {
      if (balanceMenuType === 1) {
        setSearchSpendingList(spendingTokenList);
      } else {
        setSearchTokenList(tokenList);
      }
    }
  }

  function setTokenSelector(value: boolean) {
    dispatch({
      type: 'store/setTokenSelectorVisible',
      payload: value
    });
  }

  /**
   *
   * @param type
   * 1: tokenLoading
   * 2: tokenList
   * 3: topTokenLoading
   * 4: topTokenList
   * 5: billUsdTokenLoading
   * 6: billUsdTokenList
   * @returns
   */
  function selectTokenList(type: number, chainId: number) {
    let data;
    const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId })?.chainAssetsType;
    const USDList = isContainUSD
      ? [
          {
            id: 'USD',
            symbol: 'USD',
            name: 'USD',
            address: 'USD',
            type: 'USD',
            chainType: 'eth',
            icon: WEB_URL + '/image/token/usd.png'
          }
        ]
      : [];
    if (type === 5) {
      data = billUsdTokenLoading;
    } else if (type === 6) {
      if (chainId) {
        data = billUsdTokenList?.filter((o: any) => o?.chainId === chainId);
      } else {
        data = billUsdTokenList;
      }
    } else {
      switch (chainAssetsType) {
        case 'eth':
          if (type === 1) {
            data = ethTokenLoading;
          } else if (type === 2) {
            data = ethTokenList;
          } else if (type === 3) {
            data = ethTopTokenLoading;
          } else if (type === 4) {
            data = concat(USDList, ethTopTokenList);
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
            data = concat(USDList, polygonTopTokenList);
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
            data = concat(USDList, arbitrumTopTokenList);
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
            data = concat(USDList, bnbTopTokenList);
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
            data = concat(USDList, lineaTopTokenList);
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
            data = concat(USDList, optimismTopTokenList);
          }
          break;
        case 'all':
          if (type === 1) {
            data =
              ethTokenLoading ||
              polygonTokenLoading ||
              arbitrumTokenLoading ||
              bnbTokenLoading ||
              lineaTokenLoading ||
              optimismTokenLoading;
          } else if (type === 2) {
            data = concat(
              ethTokenList,
              polygonTokenList,
              arbitrumTokenList,
              bnbTokenList,
              lineaTokenList,
              optimismTokenList
            );
            data = orderBy(data, 'currentBalancePrice', 'desc');
          } else if (type === 3) {
            data =
              ethTopTokenLoading ||
              polygonTopTokenLoading ||
              arbitrumTopTokenLoading ||
              bnbTopTokenLoading ||
              lineaTopTokenLoading ||
              optimismTopTokenLoading;
          } else if (type === 4) {
            data = concat(
              USDList,
              ethTopTokenList,
              polygonTopTokenList,
              arbitrumTopTokenList,
              bnbTopTokenList,
              lineaTopTokenList,
              optimismTopTokenList
            );
          }
          break;
        default:
          break;
      }
    }

    return data;
  }

  // tokenList billUsdTokenList
  useEffect(() => {
    if (!isReceive) {
      const data = selectTokenList(isPayUSD ? 6 : 2, authedAccountInfo?.chainId);
      setTokenList(data);
      setSearchTokenList(data);
    }
  }, [
    visible,
    isPayUSD,
    isReceive,
    ethTokenList?.length,
    polygonTokenList?.length,
    arbitrumTokenList?.length,
    bnbTokenList?.length,
    lineaTokenList?.length,
    optimismTokenList?.length,
    billUsdTokenList?.length,
    authedAccountInfo?.chainId
  ]);

  // topTokenList
  useEffect(() => {
    if (isReceive) {
      const data = selectTokenList(4, authedAccountInfo?.chainId);
      setTokenList(data);
      setSearchTokenList(data);
    }
  }, [
    isReceive,
    ethTopTokenList?.length,
    polygonTopTokenList?.length,
    arbitrumTopTokenList?.length,
    bnbTopTokenList?.length,
    lineaTopTokenList?.length,
    optimismTopTokenList?.length,
    authedAccountInfo?.chainId
  ]);

  // spendingTokenList
  useEffect(() => {
    if (authedAccountInfo?.chainId) {
      const spdTokensByChain = spendingTokenList?.filter((o: any) => authedAccountInfo?.chainId === o?.chainId);
      if (isPayUSD) {
        setSearchSpendingList(
          spdTokensByChain?.filter((o: any) => {
            if (
              find(billUsdTokenList, function (billO) {
                return billO?.address?.toUpperCase() === o?.address?.toUpperCase();
              })
            ) {
              return true;
            } else {
              return false;
            }
          })
        );
      } else {
        setSearchSpendingList(spdTokensByChain);
      }
    } else {
      if (isPayUSD) {
        setSearchSpendingList(
          spendingTokenList?.filter((o: any) => {
            if (
              find(billUsdTokenList, function (billO) {
                return billO?.address?.toUpperCase() === o?.address?.toUpperCase();
              })
            ) {
              return true;
            } else {
              return false;
            }
          })
        );
      } else {
        setSearchSpendingList(spendingTokenList);
      }
    }
  }, [isPayUSD, spendingTokenList?.length, authedAccountInfo?.chainId, billUsdTokenList?.length]);

  // tokenLoading
  useEffect(() => {
    if (!isReceive) {
      setLoading(selectTokenList(1, authedAccountInfo?.chainId));
    }
  }, [
    ethTokenLoading,
    polygonTokenLoading,
    arbitrumTokenLoading,
    bnbTokenLoading,
    lineaTokenLoading,
    optimismTokenLoading,
    billUsdTokenLoading,
    isReceive,
    authedAccountInfo?.chainId
  ]);

  // topTokenLoading billUsdTokenLoading
  useEffect(() => {
    if (isReceive) {
      setLoading(selectTokenList(isPayUSD ? 5 : 3, authedAccountInfo?.chainId));
    }
  }, [
    isPayUSD,
    ethTopTokenLoading,
    polygonTopTokenLoading,
    arbitrumTopTokenLoading,
    bnbTopTokenLoading,
    lineaTopTokenLoading,
    optimismTopTokenLoading,
    isReceive,
    authedAccountInfo?.chainId
  ]);

  // console.log('assets-select-token', lineaTokenList);

  return (
    <div className="assets_token_select_container">
      <div className="assets_select_header">
        {!hideBalanceTypeMenu && (
          <div className="balance_type">
            <div
              className={`balance_item ${balanceMenuType === 1 ? 'active' : ''}`}
              onClick={() => {
                setBalanceMenuType?.(1);
              }}
            >
              Spending balance
            </div>
            <div
              className={`balance_item ${balanceMenuType === 2 ? 'active' : ''}`}
              onClick={() => {
                setBalanceMenuType?.(2);
              }}
            >
              Wallet balance
            </div>
          </div>
        )}
        <div className="search_box">
          {!isPayUSD && <ChainSelector />}
          <SearchBar
            placeholder="Search"
            className="searchBarInput"
            onChange={onTokenSearch}
            onSearch={onTokenSearch}
          />
        </div>
      </div>
      <div className="content">
        <ListPanelPage
          balanceType={balanceMenuType}
          loading={balanceMenuType === 1 ? spendingTokenLoading : loading}
          searchTokenList={balanceMenuType === 1 ? searchSpendingList : searchTokenList}
          setToken={async (value: TokenInfo) => {
            let valueTemp = value;
            if (valueTemp && (!valueTemp?.decimals || valueTemp?.decimals === 0)) {
              if (isNativeToken(valueTemp.address)) {
                valueTemp = { ...valueTemp, decimals: 18, type: 0, isDefault: true };
              } else if (valueTemp?.address === 'USD') {
              } else {
                if (valueTemp.chainId && !valueTemp.decimals) {
                  const res = await TokenDataService_getERC20TokenFromChainByAddress(
                    valueTemp.address,
                    valueTemp.chainId
                  );
                  valueTemp = { ...valueTemp, decimals: Number(res?.decimals) };
                }
                valueTemp = { ...valueTemp, type: 1 };
              }
            }
            // console.log('token-selector-setToken', value);
            setToken?.(valueTemp);
          }}
          isReceive={isReceive}
          setVisible={setTokenSelector}
          srcListLength={tokenList?.length}
        />
      </div>
    </div>
  );
};

export default AssetsTokenSelector;
