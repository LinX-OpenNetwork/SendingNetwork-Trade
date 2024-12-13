import { useState, useEffect } from 'react';
import BorderRadiusTab from '@/components/border-radius-tab';
import styles from './index.less';
import { Popup } from 'antd-mobile';
import AssetsTokenSelect from './token-selector';
import { TokenInfo, TokenSelector, NftSelector } from '@/types';
import AssetsNftSelector from './nft-selector';
import { useSelector } from 'dva';
import { STABLE_CURRENCY_LIST, LOCAL_CREATED_TOKEN, ENV_ETH_CHAIN_IDS, ENV, WEB_URL } from '@/constants';
import {
  TokenDataService_getETHPrice,
  TokenDataService_geERC20TokenBalance,
  TokenDataService_getTokenPrice,
  getSpendingBalanceByAddress,
  getTokenBalanceFromChain,
  TokenDataService_getTokenMetadataPrice,
  TokenDataService_getEthBalance,
  getDefaultToken
} from '@/services';
import { LocalStorage_get, closeModalIcon, getAuthUserInfo, isNativeToken } from '@/utils';
import { cloneDeep, concat } from 'lodash';
import { history } from 'umi';
import useFetchAssets from '@/layouts/hooks';

type IProps = {
  visible: boolean;
  setVisible: any;
  token?: TokenInfo | undefined;
  balanceType: number;
  setBalanceType: any;
  isReceive?: boolean;
  setToken: (value: TokenInfo | TokenSelector, isRePlace?: boolean) => void;
  checkedTokenList?: TokenSelector[];
  checkedNft?: NftSelector[];
  setCheckedNft?: any;
  hideBalanceTypeMenu?: boolean;
  presetToken?: TokenSelector;
  isSetCreateToken?: boolean;
  createKey?: string;
  hideNftTab?: boolean;
  setInitTokenLoading?: any;
  assetsTypeSwitchTip?: any;
  isPayUSD?: boolean;
  isContainUSD?: boolean;
};
const AssetsSelect = (props: IProps) => {
  const {
    visible,
    setVisible,
    isReceive,
    balanceType,
    setToken,
    presetToken,
    isSetCreateToken,
    createKey,
    hideNftTab,
    setInitTokenLoading,
    checkedNft,
    setCheckedNft,
    isPayUSD,
    isContainUSD
  } = props;
  const { authedAccountInfo } = useSelector((state: any) => state.store);
  const { refreshTokenList, refreshNftList } = useFetchAssets();

  const [tab, setTab] = useState<string>('token');

  async function setPresetToken() {
    const authUserInfo = getAuthUserInfo();
    const walletAddress = authedAccountInfo?.publicKey ?? authUserInfo?.address;
    let presetTokenTemp = presetToken;
    if (!presetTokenTemp || isNativeToken(presetTokenTemp?.address)) {
      presetTokenTemp = { ...presetTokenTemp, balanceType };
      setDefaultToken(presetTokenTemp?.value, presetTokenTemp);
    } else {
      setToken?.(presetTokenTemp, true);
      setInitTokenLoading?.(false);
      const chainId = presetTokenTemp?.chainId ?? authedAccountInfo?.chainId ?? ENV_ETH_CHAIN_IDS[0];
      const searchedPresetToken = await TokenDataService_getTokenMetadataPrice(presetTokenTemp?.address, chainId, 1);
      // console.log('searchedPresetToken', searchedPresetToken);
      if (searchedPresetToken) {
        presetTokenTemp = {
          ...presetTokenTemp,
          icon: searchedPresetToken?.icon ?? '',
          decimals: searchedPresetToken?.decimals ?? 0,
          name: searchedPresetToken?.name ? searchedPresetToken?.name : presetTokenTemp.name,
          price: searchedPresetToken?.price,
          chainId: searchedPresetToken?.chainId,
          type: searchedPresetToken?.type
        };
        if (walletAddress) {
          const balanceValueRes = await TokenDataService_geERC20TokenBalance(
            walletAddress,
            presetTokenTemp?.address,
            chainId
          );
          presetTokenTemp = { ...presetTokenTemp, balanceValue: balanceValueRes };
        }
        const spendingData = await getSpendingBalanceByAddress(presetTokenTemp?.address, chainId);
        presetTokenTemp = { ...presetTokenTemp, spendingValue: spendingData };
        console.log('setCreatedToken', spendingData, presetTokenTemp);
      }

      if (!presetTokenTemp?.price) {
        const priceRes = await TokenDataService_getTokenPrice(presetTokenTemp?.address, chainId);
        presetTokenTemp = { ...presetTokenTemp, price: priceRes };
      }
      presetTokenTemp = { ...presetTokenTemp, balanceType };
      setToken?.(presetTokenTemp, true);
    }
  }

  function setDefaultTokenTemp(createToken?: TokenInfo) {
    let defaultChainId = authedAccountInfo?.chainId;
    if (!authedAccountInfo?.chainId) {
      defaultChainId = createToken?.chainId ?? ENV_ETH_CHAIN_IDS[0];
    }
    let tokenTemp = getDefaultToken({ chainId: defaultChainId, publicKey: authedAccountInfo?.publicKey });
    tokenTemp = {
      ...tokenTemp,
      spendingValue: undefined,
      balanceValue: undefined,
      balanceType: balanceType || 2
    };
    setToken?.(tokenTemp, true);
    setInitTokenLoading?.(false);
    console.log('setDefaultTokenTemp', tokenTemp);
    return { tokenTemp, defaultChainId };
  }

  async function setDefaultToken(value?: number | string, createToken?: TokenInfo) {
    if (authedAccountInfo) {
      const { tokenTemp, defaultChainId } = setDefaultTokenTemp(createToken);
      let newTokenTemp = cloneDeep(tokenTemp);
      // async
      const priceRes = await TokenDataService_getETHPrice(defaultChainId);
      newTokenTemp = {
        ...tokenTemp,
        price: priceRes
      };
      if (!isReceive) {
        const spendingValueRes = await getSpendingBalanceByAddress(tokenTemp.address, defaultChainId);
        const balanceValueRes = await TokenDataService_getEthBalance(authedAccountInfo?.publicKey, defaultChainId);
        newTokenTemp = {
          ...newTokenTemp,
          spendingValue: spendingValueRes,
          balanceValue: balanceValueRes
        };
      }
      if (value && value !== '') {
        (newTokenTemp as TokenSelector).value = value;
      }
      setToken?.(newTokenTemp, true);
    }
  }

  async function setDefaultStableToken() {
    if (authedAccountInfo) {
      let stableList: any = [];
      if (authedAccountInfo?.chainId) {
        stableList = STABLE_CURRENCY_LIST?.[authedAccountInfo?.chainId] ?? [];
      } else {
        ENV_ETH_CHAIN_IDS.forEach((chainIdItem) => {
          stableList = concat(stableList, STABLE_CURRENCY_LIST?.[chainIdItem] ?? []);
        });
      }
      let tokenTemp;
      // console.log('setDefaultStableToken-stableList', authedAccountInfo?.chainId, stableList, isReceive);
      if (!isReceive) {
        setDefaultTokenTemp();
        // balanceValue start
        for (let item of stableList) {
          item.balanceValue = await TokenDataService_geERC20TokenBalance(
            authedAccountInfo?.publicKey,
            item.address,
            item?.chainId
          );
          if (item.balanceValue > 0) {
            tokenTemp = { ...item, balanceType: 2 };
            // console.log('setDefaultStableToken-1', tokenTemp);
            setToken?.(tokenTemp, true);
            setInitTokenLoading?.(false);
            const priceRes = await TokenDataService_getTokenPrice(tokenTemp.address, tokenTemp?.chainId);
            const spendingValueRes = await getSpendingBalanceByAddress(tokenTemp?.address, tokenTemp?.chainId);
            tokenTemp = {
              ...tokenTemp,
              price: priceRes,
              spendingValue: spendingValueRes
            };
            setToken?.(tokenTemp, true);
            // console.log('setDefaultStableToken', tokenTemp?.symbol, item.balanceValue);
            break;
          } else {
            continue;
          }
        }
        // balanceValue end
        if (!tokenTemp) {
          // default token
          setDefaultToken();
        }
      } else {
        if (isContainUSD) {
          setToken?.(
            {
              id: 'USD',
              symbol: 'USD',
              name: 'USD',
              address: 'USD',
              type: 1,
              chainType: 'eth',
              decimals: 1,
              balanceType: 2,
              icon: WEB_URL + '/image/token/usd.png'
            },
            true
          );
          setInitTokenLoading?.(false);
        } else {
          if (stableList?.length <= 0) {
            setDefaultToken();
          } else {
            tokenTemp = stableList[0];
            setToken?.(tokenTemp, true);
            setInitTokenLoading?.(false);
          }
        }
      }
    }
  }

  async function setCreatedToken(createdToken: TokenInfo | undefined) {
    if (
      !createdToken ||
      isNativeToken(createdToken?.address) ||
      (!createdToken?.chainId && createdToken?.address !== 'USD')
    ) {
      setDefaultToken('', createdToken);
    } else {
      setToken?.(createdToken, true);
      setInitTokenLoading?.(false);
      if (!isReceive) {
        const authUserInfo = getAuthUserInfo();
        const walletAddress = authedAccountInfo?.publicKey ?? authUserInfo?.address;
        const balanceValueRes = await getTokenBalanceFromChain(createdToken, walletAddress, createdToken?.chainId);
        const spendingValueRes = await getSpendingBalanceByAddress(createdToken?.address, createdToken?.chainId);
        createdToken = {
          ...createdToken,
          spendingValue: spendingValueRes
        };
        // console.log('setCreatedToken', createdToken);
        if (!createdToken?.price && createdToken?.chainId) {
          const priceRes = await TokenDataService_getTokenPrice(createdToken?.address, createdToken?.chainId);
          createdToken = { ...createdToken, price: priceRes };
        }
        createdToken = { ...createdToken, balanceValue: balanceValueRes };
        setToken?.(createdToken, true);
      }
    }
  }

  // setDefaultStableToken setCreatedToken
  useEffect(() => {
    if (!isPayUSD && !presetToken && !history.location.query?.returnId) {
      const createdTokenStr = JSON.parse(LocalStorage_get(LOCAL_CREATED_TOKEN) || '{}');
      const chainId = authedAccountInfo?.chainId;
      let createdToken: TokenInfo | undefined = createdTokenStr?.[chainId + '-' + createKey];
      /* External call: /create?from=wallet&chain=ethereum */
      // console.log('createdToken', authedAccountInfo?.chainId, chainId, createdToken);
      setInitTokenLoading?.(true);
      if (history.location.query?.from === 'wallet') {
        if (isSetCreateToken && createdToken && createdToken?.balanceType === 2) {
          setCreatedToken(createdToken);
        } else {
          setDefaultStableToken();
        }
      } else {
        if (isSetCreateToken && createdToken) {
          setCreatedToken(createdToken);
        } else {
          setDefaultStableToken();
        }
      }
    }
  }, [isPayUSD, presetToken, authedAccountInfo?.chainId, authedAccountInfo?.publicKey?.toUpperCase()]);

  // setPresetToken
  useEffect(() => {
    if (!isPayUSD && presetToken) {
      // console.log('setPresetToken', presetToken);
      setInitTokenLoading?.(true);
      setPresetToken();
    }
  }, [isPayUSD, presetToken, authedAccountInfo?.publicKey?.toUpperCase()]);

  useEffect(() => {
    if (
      authedAccountInfo?.chainId &&
      checkedNft &&
      checkedNft?.length > 0 &&
      checkedNft?.[0]?.chainId !== authedAccountInfo?.chainId
    ) {
      setCheckedNft([]);
    }
  }, [authedAccountInfo?.chainId]);

  // TokenList NFTList DefaultToken
  useEffect(() => {
    if (visible) {
      if (
        history.location?.pathname === '/create' &&
        history.location.query?.type?.toString() !== 'receive' &&
        authedAccountInfo?.publicKey
      ) {
        if (tab === 'token') {
          refreshTokenList();
        } else {
          refreshNftList();
        }
      }
    }
  }, [
    visible,
    tab,
    authedAccountInfo?.publicKey?.toUpperCase(),
    authedAccountInfo?.chainId,
    history.location?.pathname
  ]);

  // console.log('assets-select', !isPayUSD, presetToken, balanceType);

  return (
    <Popup
      visible={visible}
      onMaskClick={() => {
        setVisible(false);
      }}
      bodyStyle={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
      bodyClassName={`base_popup_container ${styles.assets_select_container}`}
      getContainer={document.getElementById('tp-wrapper')}
      style={{ '--z-index': '1200' }}
    >
      <div className={styles.assets_select_wrapper}>
        <div className="header">
          <div className="titleBox">
            <div
              className="closeBtn"
              onClick={() => {
                setVisible(false);
              }}
            >
              {closeModalIcon}
            </div>
            <div className="title">Select {isPayUSD ? 'USD' : ''}</div>
            <div className="closeBtn"></div>
          </div>
        </div>
        {!hideNftTab && (
          <BorderRadiusTab
            menus={[
              { name: 'TOKEN', value: 'token' },
              { name: 'NFT', value: 'nft' }
            ]}
            tab={tab}
            setTab={setTab}
          />
        )}
        <div className={styles.content}>
          {/* Token Block */}
          {tab === 'token' && (
            <div className={tab === 'token' ? styles.show : styles.hiden}>
              <AssetsTokenSelect {...props} />
            </div>
          )}

          {/* Nft Block */}
          {!hideNftTab && tab === 'nft' && (
            <div className={tab === 'nft' ? styles.show : styles.hiden}>
              <AssetsNftSelector {...props} />
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
};

export default AssetsSelect;
