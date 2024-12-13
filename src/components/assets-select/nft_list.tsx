import LoadingMask from '@/components/loading-mask';
import NftCollectionList from '@/components/nft-collection';
import { NftSelector } from '@/types';
import { cloneDeep, findIndex } from 'lodash';
import EmptyBlock from '../empty-block';
import { useDispatch } from 'dva';

const NftListBlock = (props: any) => {
  const dispatch = useDispatch();
  const {
    nftType,
    loading,
    searchNftList,
    setSearchNftList,
    checkedNft,
    setCheckedNft,
    balanceType,
    setBalanceType,
    checkedToken,
    assetsTypeSwitchTip,
    assetsOnlySwitchTip,
    nftShowType,
    setCheckedToken
  } = props;

  function onExpandList(index: number) {
    let listTemp = cloneDeep(searchNftList);
    listTemp[index] = { ...listTemp[index], isExpanded: !listTemp[index].isExpanded };
    setSearchNftList(listTemp);
  }

  function closeTokenSelector() {
    dispatch({ type: 'store/setTokenSelectorVisible', payload: false });
  }

  function onChangeChild(index: number, childIndex: number, value?: any) {
    const checkedChainId = checkedNft && checkedNft?.length > 0 ? checkedNft?.[0]?.chainId : checkedToken?.[0]?.chainId;
    if (checkedChainId && value?.chainId !== checkedChainId) {
      assetsTypeSwitchTip(value, 'chainId', 'nft', () => {
        // nft list
        value = { ...value, isChecked: true };
        // checked nft
        setCheckedNft([value]);
        // checked token
        setCheckedToken([]);
        closeTokenSelector();
      });
    } else if (
      !value?.isChecked &&
      value?.balanceType !== balanceType &&
      (checkedNft?.length > 0 || checkedToken?.length > 0)
    ) {
      assetsTypeSwitchTip(value, 'balanceType', 'nft', () => {
        // nft list
        value = { ...value, isChecked: true };
        // checked nft
        setCheckedNft([value]);
        // checked token
        setCheckedToken([]);
        closeTokenSelector();
      });
    } else {
      let listTemp = cloneDeep(searchNftList);
      let checkedNftsTemp: NftSelector[] = cloneDeep(checkedNft ?? []);
      if (checkedToken?.length > 0) {
        assetsOnlySwitchTip(value, 'nft', () => {
          // nft list
          value = { ...value, isChecked: true };
          // checked nft
          setCheckedNft([value]);
          setBalanceType(value?.balanceType);
          // checked token
          setCheckedToken([]);
          closeTokenSelector();
        });
      } else {
        if (listTemp[index] && listTemp[index].children && listTemp[index].children?.[childIndex]) {
          let subChild = listTemp[index].children![childIndex];
          if (nftType === 1) {
            subChild = { ...subChild, isChecked: true };
            let checkedIndex = findIndex(checkedNftsTemp, { id: subChild.id, parentId: subChild.contractAddress });
            if (subChild.isChecked) {
              if (checkedIndex < 0) {
                checkedNftsTemp?.push(subChild);
              }
            }
          }
        }
      }

      setSearchNftList(listTemp);
      setCheckedNft(checkedNftsTemp);
      setBalanceType(checkedNftsTemp?.[0]?.balanceType);
      closeTokenSelector();
    }
  }

  return (
    <>
      {loading ? (
        <LoadingMask visible={loading} />
      ) : searchNftList?.length > 0 ? (
        <NftCollectionList
          nftType={nftType}
          list={searchNftList}
          onExpandList={onExpandList}
          onChangeChild={(index: number, childIndex: number, child: NftSelector) => {
            onChangeChild(index, childIndex, child);
          }}
          nftShowType={nftShowType}
        />
      ) : (
        <EmptyBlock />
      )}
    </>
  );
};

export default NftListBlock;
