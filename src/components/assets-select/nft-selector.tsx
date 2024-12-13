import { useState, useEffect } from 'react';
import { SearchBar } from 'antd-mobile';
import { useSelector } from 'dva';
import './index.less';
import ChainSelector from '../page-nav-bar/chain-seletor';
import { NftSelector, NftCollection } from '@/types';
import { cloneDeep, findIndex, find, concat } from 'lodash';
import { LocalStorage_get, LocalStorage_set, nftShowTypeIcon1, nftShowTypeIcon2 } from '@/utils';
import { LOCAL_NFT_SHOW_TYPE, WALLET_CHAIN_CONFIG } from '@/constants';
import NftListBlock from './nft_list';

const AssetsNftSelector = (props: any) => {
  const nftType = 1;
  const { balanceType, hideBalanceTypeMenu } = props;

  const { authedAccountInfo } = useSelector((state: any) => state.store);
  const {
    ethNftLoading,
    ethNftList,
    polygonNftLoading,
    polygonNftList,
    arbitrumNftLoading,
    arbitrumNftList,
    bnbNftLoading,
    bnbNftList,
    lineaNftLoading,
    lineaNftList,
    spendingNftLoading,
    spendingNftList
  } = useSelector((state: any) => state.assets);

  const [loading, seLoading] = useState<NftCollection[]>([]);
  const [nftList, setNftList] = useState<NftCollection[]>([]);
  const [searchNftList, setSearchNftList] = useState<NftCollection[]>([]);
  const [searchSpendingNftList, setSearchSpendingNftList] = useState<NftCollection[]>([]);
  const [balanceMenuType, setBalanceMenuType] = useState<number>(balanceType ?? 2);
  const [nftShowType, setNftShowType] = useState<string | null>(LocalStorage_get(LOCAL_NFT_SHOW_TYPE) ?? '1');

  function onNftSearch(value: string) {
    const searched = (children: NftSelector[] | undefined) => {
      let isSearched = false;
      (children || [])?.forEach((child) => {
        if (
          child?.title.toUpperCase().indexOf(value.toUpperCase()) >= 0 ||
          child?.id.toUpperCase().indexOf(value.toUpperCase()) >= 0 ||
          (child?.collection && child?.collection.toUpperCase()?.indexOf(value.toUpperCase()) >= 0)
        ) {
          isSearched = true;
        }
      });

      return isSearched;
    };
    const updatedExpandChecked = (parentItem: NftCollection) => {
      // update expand
      let parentIndex = findIndex(searchNftList, { contractAddress: parentItem.contractAddress });
      if (parentIndex >= 0) {
        parentItem = { ...parentItem, isExpanded: searchNftList[parentIndex].isExpanded };
      }
    };

    if (value && value !== '') {
      let searchNftListTemp: NftCollection[] = [];
      cloneDeep(nftList).forEach((parentItem) => {
        updatedExpandChecked(parentItem);
        let isSearchedItem = searched(parentItem?.children);
        if (isSearchedItem) {
          searchNftListTemp.push(parentItem);
        }
      });
      setSearchNftList(searchNftListTemp);
    } else {
      const nftListTemp = cloneDeep(nftList);
      nftListTemp.forEach((parentItem) => {
        updatedExpandChecked(parentItem);
      });

      setSearchNftList(nftListTemp.slice());
    }
  }

  /**
   *
   * @param type
   * 1: nftLoading
   * 2: nftList
   * @returns
   */
  function selectNftList(type: number, chainId: number) {
    let data;
    const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId })?.chainAssetsType;
    switch (chainAssetsType) {
      case 'eth':
        if (type === 1) {
          data = ethNftLoading;
        } else if (type === 2) {
          data = ethNftList;
        }
        break;
      case 'polygon':
        if (type === 1) {
          data = polygonNftLoading;
        } else if (type === 2) {
          data = polygonNftList;
        }
        break;
      case 'arbitrum':
        if (type === 1) {
          data = arbitrumNftLoading;
        } else if (type === 2) {
          data = arbitrumNftList;
        }
        break;
      case 'bnb':
        if (type === 1) {
          data = bnbNftLoading;
        } else if (type === 2) {
          data = bnbNftList;
        }
        break;
      case 'linea':
        if (type === 1) {
          data = lineaNftLoading;
        } else if (type === 2) {
          data = lineaNftList;
        }
        break;
      case 'all':
        if (type === 1) {
          data = ethNftLoading || polygonNftLoading || arbitrumNftLoading || bnbNftLoading || lineaNftLoading;
        } else if (type === 2) {
          data = concat(ethNftList, polygonNftList, arbitrumNftList, bnbNftList, lineaNftList);
        }
        break;
      default:
        break;
    }

    return data;
  }

  useEffect(() => {
    const data = selectNftList(2, authedAccountInfo?.chainId);
    setNftList(data);
    setSearchNftList(data);
  }, [
    ethNftList?.length,
    polygonNftList?.length,
    arbitrumNftList?.length,
    bnbNftList?.length,
    lineaNftList?.length,
    authedAccountInfo?.chainId
  ]);

  useEffect(() => {
    seLoading(selectNftList(1, authedAccountInfo?.chainId));
  }, [
    ethNftLoading,
    polygonNftLoading,
    arbitrumNftLoading,
    bnbNftLoading,
    lineaNftLoading,
    authedAccountInfo?.chainId
  ]);

  useEffect(() => {
    setSearchSpendingNftList(spendingNftList);
  }, [spendingNftList?.length]);

  // console.log('assets-nft', lineaNftList);

  return (
    <div className="assets_nft_select_container">
      <div className="assets_select_header">
        {false && !hideBalanceTypeMenu && (
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
          <ChainSelector />
          <SearchBar placeholder="Search" className="searchBarInput" onChange={onNftSearch} onSearch={onNftSearch} />
          <div className="nft_show_type">
            <div
              className={`list_type_btn ${!nftShowType || nftShowType === '1' ? 'active' : ''}`}
              onClick={() => {
                LocalStorage_set(LOCAL_NFT_SHOW_TYPE, '1');
                setNftShowType('1');
              }}
            >
              {nftShowTypeIcon1}
            </div>
            <div
              className={`list_type_btn  ${nftShowType === '2' ? 'active' : ''}`}
              onClick={() => {
                LocalStorage_set(LOCAL_NFT_SHOW_TYPE, '2');
                setNftShowType('2');
              }}
            >
              {nftShowTypeIcon2}
            </div>
          </div>
        </div>
      </div>
      <div className="content">
        <NftListBlock
          {...props}
          nftType={nftType}
          loading={balanceMenuType === 1 ? spendingNftLoading : loading}
          nftList={balanceMenuType === 1 ? spendingNftList : nftList}
          searchNftList={balanceMenuType === 2 ? searchNftList : searchSpendingNftList}
          setSearchNftList={balanceMenuType === 2 ? setSearchNftList : setSearchSpendingNftList}
          nftShowType={nftShowType}
        />
      </div>
    </div>
  );
};

export default AssetsNftSelector;
