import { TokenSelector, NftSelector, TokenInfo } from '@/types';
import styles from './index.less';
import TokenInput from './token_input';
import AssetsCommonPage from './common';
import { useState } from 'react';
import { cloneDeep, uniqBy } from 'lodash';
import { Toast } from 'antd-mobile';
import { message } from 'antd';
import { useDispatch } from 'dva';
import NftIcon from '../nft-icon';
import { history } from 'umi';
import { unCheckedIcon, checkedIcon, errorArrowIcon, PlusOutlinedIcon } from '@/utils';
import AssetsLoading from './assets_loading';

type IPorps = {
  checkedToken: TokenSelector[];
  setCheckedToken: any;
  checkedNft: NftSelector[];
  setCheckedNft: any;
  balanceType: number;
  setBalanceType: any;
  hideBalanceTypeMenu: boolean;
  presetToken?: TokenSelector;
  isSetCreateToken: boolean;
  isInsuffBalance: boolean;
  createKey: string;
};

const CreateAssets = (props: IPorps) => {
  const dispatch = useDispatch();
  const { checkedToken, checkedNft, setCheckedToken, balanceType, setCheckedNft, isInsuffBalance } = props;

  const [initTokenLoading, setInitTokenLoading] = useState<boolean>(false);
  const [sltIndex, setSltIndex] = useState<number | undefined>(undefined);

  function onTokenChangeOne(index: number, key: string, value?: any) {
    // console.log('onChangeOne', checkedToken, index, key);
    let listTemp = cloneDeep(checkedToken);
    let item = listTemp[index];
    if (key === 'isChecked') {
      if (!item.value || item.value === '' || Number(item.value) <= 0) {
        Toast.show({ content: `The value cannot be empty, please input`, maskClassName: 'copy_toast_mask' });
        return;
      }
      if (!value) {
        // @ts-ignore
        item[key] = value;
        setCheckedToken(listTemp);
      } else {
        // addSelectedToken
        if (Number(item.value) > Number(item.balanceValue)) {
          message.error("You don't have enough " + item.symbol);
          return;
        }
        // @ts-ignore
        item[key] = value;
        setCheckedToken(listTemp);
      }
    } else if (key === 'token') {
      listTemp[index] = { ...value, value: item?.value };
      setCheckedToken(listTemp.slice());
    } else if (key === 'delete') {
      //console.log('delete', listTemp.splice(index, 1));
      listTemp.splice(index, 1);
      setCheckedToken(listTemp);
    } else {
      // @ts-ignore
      item[key] = value;
      setCheckedToken(listTemp);
    }
    setSltIndex(undefined);
  }

  function onNftChangeOne(index: number, key: string, value?: any) {
    let listTemp = cloneDeep(checkedNft);
    if (key === 'delete') {
      //console.log('delete', listTemp.splice(index, 1));
      listTemp.splice(index, 1);
      setCheckedNft(listTemp);
    }
  }

  function setTokenSelector(value: boolean) {
    dispatch({ type: 'store/setTokenSelectorVisible', payload: value });
  }

  // console.log('CreateAssets', sltIndex);

  return (
    <div className={styles.create_assets_wrapper}>
      {/* title */}
      <div className={styles.assets_title}>
        <div>ASSETS</div>
        <div className={styles.assets_add} onClick={() => setTokenSelector(true)}>
          {PlusOutlinedIcon}
          Add
        </div>
      </div>
      {/* content */}
      <div className={styles.assets_content}>
        {initTokenLoading ? (
          <AssetsLoading style={{ margin: '0 16px 16px 16px' }} />
        ) : checkedToken?.length > 0 ? (
          <>
            <div className={`${styles.token_list} `}>
              {checkedToken?.map((token, index) => {
                return (
                  <TokenInput
                    index={index}
                    token={token}
                    setSltIndex={setSltIndex}
                    balanceType={balanceType}
                    showChange={true}
                    showChecked={true}
                    onChangeOne={onTokenChangeOne}
                    key={index}
                  />
                );
              })}
            </div>
            <div className={styles.error_item}>
              {isInsuffBalance && (
                <div
                  className={styles.in_error_msg}
                  onClick={() => {
                    if (balanceType === 2) {
                      dispatch({
                        type: 'store/setInsufficientVisible',
                        payload: {
                          visible: true,
                          hideInsuffSwitch: false
                        }
                      });
                    }
                  }}
                >
                  Insufficient balance{balanceType === 2 && errorArrowIcon}
                </div>
              )}
            </div>
          </>
        ) : (
          initTokenLoading && <AssetsLoading style={{ margin: '0 16px 16px 16px' }} />
        )}
        {checkedNft?.length > 0 && (
          <div className={styles.nft_list}>
            {checkedNft?.map((nftItem, index) => {
              return (
                <div className={styles.list_item} key={nftItem.id + index}>
                  <div className={styles.list_item_info}>
                    <NftIcon
                      icon={nftItem?.icon}
                      className={styles.list_item_img}
                      chainId={nftItem?.chainId}
                      showChainIcon
                    />
                    <div className={styles.list_item_detail}>
                      <div className={styles.info_name_tag}>{nftItem.collection}</div>
                      <div className={styles.info_name}>#{nftItem.id}</div>
                      <div className={styles.info_contract_value}>{nftItem.contractAddress}</div>
                    </div>
                  </div>
                  {!history.location.query?.returnId && (
                    <div
                      className={styles.delete_btn}
                      onClick={() => {
                        if (nftItem?.isChecked) {
                          onNftChangeOne(index, 'delete');
                        }
                      }}
                    >
                      {!nftItem?.isChecked ? unCheckedIcon : checkedIcon}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* selector */}
      <AssetsCommonPage
        {...props}
        token={sltIndex !== undefined ? checkedToken[sltIndex] : undefined}
        setToken={(token: TokenInfo | TokenSelector, isRePlace?: boolean) => {
          if (sltIndex !== undefined) {
            // console.log('xsxs-onChangeOne', token);
            if (isRePlace) {
              setCheckedToken([
                { ...token, id: token.symbol, value: (token as TokenSelector)?.value ?? '', isChecked: true }
              ]);
            } else {
              onTokenChangeOne(sltIndex, 'token', {
                ...token,
                id: token.symbol,
                value: (token as TokenSelector)?.value ?? '',
                isChecked: true
              });
            }
          } else {
            let tokenListTemp = isRePlace ? [] : cloneDeep(checkedToken);
            tokenListTemp.push({
              ...token,
              id: token.symbol,
              value: (token as TokenSelector)?.value ?? '',
              isChecked: true
            });
            // console.log('xsxs', tokenListTemp);
            setCheckedToken(uniqBy(tokenListTemp, 'address'));
          }
        }}
        hideNftTab={false}
        setInitTokenLoading={setInitTokenLoading}
      />
    </div>
  );
};

export default CreateAssets;
