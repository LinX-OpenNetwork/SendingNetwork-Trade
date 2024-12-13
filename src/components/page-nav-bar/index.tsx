import { useState, useEffect } from 'react';
import { Dropdown } from 'antd';
import { history } from 'umi';
import { find, isArray, orderBy, findIndex } from 'lodash';
import {
  ROUTES_CONFIG,
  NAV_MENUS,
  LOCAL_ETH_CHAIN_ID,
  LOCAL_AUTH_ACCOUNT_ADDRESS,
  AUTH_USER_INFO,
  LOCAL_USER_WALLETS,
  DEFAULT_CHAIN_ID
} from '@/constants';
import {
  addressOmitShow,
  getHistoryUrl,
  LocalStorage_get,
  LocalStorage_set,
  isCanAction,
  expandIcon,
  getChainIdFromSdmParam,
  LeftOutlinedIcon,
  getAuthUserInfo
} from '@/utils';
import './index.less';
import { useMultiWallet } from '@/lib/wallet-selector';
import UserAvatar from '../user-avatar';
import { useSelector, useDispatch } from 'dva';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { getUserWallets } from '@/services';
import AccountPage from './account';
import { AccountWallet } from '@/types';
import FromWalletBack from './from-wallet-back';

const PageNavBar = () => {
  const dispatch = useDispatch();
  const { currentWallet } = useMultiWallet();
  const authUserInfo = getAuthUserInfo();
  const { parentIframeUrl, sdnUser, themeMode, authedAccountInfo, localUserInfo } = useSelector(
    (state: any) => state.store
  );

  const [isShowBack, setIsShowBack] = useState<boolean>(true);
  const [menuDropdownVisible, setMenuDropdownVisible] = useState<boolean>(false);
  const [defaultAccount, setDefaultAccount] = useState<any>(undefined);
  const routerInfo: any = getRouterInfo();

  function getRouterInfo() {
    const pathName = history?.location?.pathname;
    const obj = find(ROUTES_CONFIG(), { path: pathName });
    if (pathName === '/create' && history.location.query?.returnId) {
      obj!.navBar!.title = 'Return';
    }
    return obj;
  }

  async function getMultiAccount() {
    let accountRes: any = [];
    const res = await getUserWallets();
    // console.log('getMultiAccount', res);
    if (!res?.response) {
      accountRes = res;
    }
    const accountResLen = accountRes?.length;
    if (accountRes && accountResLen <= 0 && authUserInfo?.address) {
      accountRes = [
        {
          verify_source: 'login',
          wallet_address: authUserInfo?.address,
          verify_source_logo: ''
        }
      ];
    }
    if (accountRes && isArray(accountRes) && accountResLen > 0) {
      let accountListTemp: AccountWallet[] = [];
      accountRes.forEach((item: any) => {
        let itemObj = {
          verifySource: item?.verify_source,
          walletAddress: item?.wallet_address.replace('sdn_', ''),
          walletName: item?.verify_source === 'login' ? 'SendingMe login' : item?.wallet_name,
          ens: item?.ens,
          verifySourceLogo: item?.verify_source_logo ?? '/image/icon/icon_Multiple_Wallets.png',
          isChecked: false,
          netWorth: Number(item?.net_worth)
        };
        accountListTemp.push(itemObj);
      });
      accountListTemp = orderBy(accountListTemp, 'netWorth', 'desc');
      dispatch({ type: 'store/setAccountList', payload: accountListTemp });
      LocalStorage_set(LOCAL_USER_WALLETS, JSON.stringify(accountListTemp));
      getDefaultAccount(accountListTemp);
    }
  }

  async function getDefaultAccount(accountListTemp: AccountWallet[]) {
    let defaultAccountTemp = defaultAccount;
    if (!defaultAccountTemp) {
      defaultAccountTemp = accountListTemp?.[0];
    } else {
      return;
    }
    if (!defaultAccountTemp) return;
    // storage data from local
    const authAccountAdd = LocalStorage_get(LOCAL_AUTH_ACCOUNT_ADDRESS);
    if (authAccountAdd) {
      const existIndex = findIndex(accountListTemp, {
        walletAddress: authAccountAdd
      });
      if (existIndex < 0) {
        defaultAccountTemp = defaultAccountTemp ?? accountListTemp[0];
      } else {
        defaultAccountTemp = accountListTemp[existIndex];
      }
    } else {
      defaultAccountTemp = defaultAccountTemp ?? accountListTemp[0];
    }
    let chainIdValue = Number(LocalStorage_get(LOCAL_ETH_CHAIN_ID) ?? DEFAULT_CHAIN_ID);
    /* External call: 
      /create?from=wallet&chain=ethereum 
      /create?from=vault&address=xxx&chainId=5
    */
    const fromParam = history.location.query?.from;
    const chainParam = history.location.query?.chain;
    const chainIdParam = history.location.query?.chainId;
    if (fromParam?.toString() === 'wallet' && chainParam) {
      chainIdValue = getChainIdFromSdmParam(chainParam?.toString()) ?? chainIdValue;
    } else if (fromParam?.toString() === 'vault' && chainIdParam) {
      chainIdValue = chainIdParam && !isArray(chainIdParam) ? Number(chainIdParam?.toString()) : chainIdValue;
    }
    defaultAccountTemp!.chainId = chainIdValue;
    setDefaultAccount(defaultAccountTemp);
  }

  const connectedUserMenus = (
    <div className="dropdown_user_content">
      <div className="dropdown_content_user">
        <UserAvatar name={localUserInfo?.name} src={localUserInfo?.avatar} size="2.125" borderRadius="50%" />
        <div className="user_info">
          <div className="user_name">{localUserInfo?.name}</div>
          <div className="user_address">
            <div>{addressOmitShow(localUserInfo?.address)}</div>
            <div className="user_address_copy"></div>
          </div>
        </div>
      </div>
      <div className="dropdown_content_menus">
        {NAV_MENUS.map((item) => {
          return (
            <div
              className="menu_item"
              key={item.title}
              onClick={async () => {
                const url = getHistoryUrl(item.path, ['type', 'id', 'path', 'returnId', 'sub']);
                if (item.path === history?.location?.pathname) {
                  history.replace(url);
                } else {
                  history.push(url);
                }
                setMenuDropdownVisible(false);
              }}
            >
              <div className="menu_item_icon">
                {typeof item.icon == 'string' ? <img src={item.icon} width={20} height={20} /> : item.icon}
              </div>
              <div className="menu_item_title">{item.title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  useEffect(() => {
    const pathName = history?.location?.pathname;
    if (pathName === '/create') {
      setIsShowBack(history.location.query?.returnId ? true : false);
    } else {
      if (['/order', '/collection-detail'].indexOf(pathName) >= 0) {
        setIsShowBack(history.location.query?.back ? true : false);
      } else {
        setIsShowBack(true);
      }
    }
  }, [history?.location?.pathname, history.location.query?.returnId, history.location.query?.back]);

  // get default account from local
  useEffect(() => {
    const localMultiAccount = LocalStorage_get(LOCAL_USER_WALLETS);
    let multiAccount;
    if (!localMultiAccount) {
      if (sdnUser?.walletAddress) {
        multiAccount = [
          {
            walletName: 'SendingMe login',
            verifySourceLogo: '/image/icon/icon_Multiple_Wallets.png',
            walletAddress: sdnUser?.walletAddress,
            chainId: DEFAULT_CHAIN_ID
          }
        ];
      }
    } else {
      multiAccount = JSON.parse(localMultiAccount);
    }
    // console.log('multiAccount', multiAccount);
    getDefaultAccount(multiAccount);
  }, [sdnUser]);

  useEffect(() => {
    // setLocalUserInfo(getLocalUserInfo());
    const isCanCheck = isCanAction(parentIframeUrl);
    if (LocalStorage_get(AUTH_USER_INFO) && isCanCheck) {
      getMultiAccount();
    }
  }, [LocalStorage_get(AUTH_USER_INFO), parentIframeUrl]);

  useEffect(() => {
    let payload: any;
    if (currentWallet?.publicKey) {
      // console.log('page-nav-setAuthedAccountInfo-2', defaultAccount?.walletAddress, currentWallet?.publicKey);
      payload = {
        walletName: currentWallet?.walletName,
        walletLogo: currentWallet?.walletLogo,
        chainId: Number(LocalStorage_get(LOCAL_ETH_CHAIN_ID) ?? DEFAULT_CHAIN_ID),
        publicKey: currentWallet?.publicKey
      };
      dispatch({ type: 'store/setAuthedAccountInfo', payload });
    } else if (defaultAccount) {
      // console.log('page-nav-setAuthedAccountInfo-1');
      LocalStorage_set(LOCAL_AUTH_ACCOUNT_ADDRESS, defaultAccount?.walletAddress);
      payload = {
        walletName: defaultAccount?.walletName,
        walletLogo: defaultAccount?.verifySourceLogo,
        chainId: defaultAccount?.chainId,
        publicKey: defaultAccount?.walletAddress
      };
      dispatch({ type: 'store/setAuthedAccountInfo', payload });
    }
  }, [currentWallet?.publicKey?.toUpperCase(), defaultAccount]);

  console.log('PageNavBar-setAuthedAccountInfo', authedAccountInfo, localUserInfo);

  return routerInfo?.navBar ? (
    <div className={`layout_header`}>
      {history.location.query?.from === 'wallet' ? (
        <FromWalletBack />
      ) : (
        <div className={`left_content`}>
          {routerInfo?.navBar?.isGoBack && isShowBack && (
            <div
              className="back_btn"
              onClick={() => {
                const isSdm = getPlatformInfo()?.isSdm;
                if (history?.length <= 2) {
                  history.push(getHistoryUrl('/create'));
                } else {
                  history.goBack();
                }
              }}
            >
              {LeftOutlinedIcon}
            </div>
          )}
          {routerInfo?.navBar?.showLogo && history?.location?.query?.from !== 'wallet' && themeMode && (
            <div className="logo">
              <img src={`/image/${themeMode}/transfer_logo.png`} width={120} height={24} />
            </div>
          )}
          <div className="header_title">
            <div className="header_title_node">{routerInfo?.navBar?.title}</div>
            <div className="header_sub_title">{routerInfo?.navBar?.subTitle}</div>
          </div>
        </div>
      )}
      <div className="right_content">
        {!routerInfo?.navBar?.hideWalletUser && (
          <div className="connected_content">
            {!routerInfo?.navBar?.hideWallet && <AccountPage />}
            {(localUserInfo?.name ?? localUserInfo?.address) && (
              <Dropdown
                // overlay={connectedUserMenus}
                dropdownRender={() => {
                  return connectedUserMenus;
                }}
                placement="bottomRight"
                trigger={['click']}
                open={menuDropdownVisible}
                onOpenChange={setMenuDropdownVisible}
                getPopupContainer={(triggerNode: any) => triggerNode?.parentNode}
              >
                <div className="user_icon">
                  <UserAvatar
                    name={localUserInfo?.name ?? localUserInfo?.address}
                    src={localUserInfo?.avatar}
                    size="1.56"
                    borderRadius="50%"
                  />
                  <div className="user_expand">{expandIcon}</div>
                </div>
              </Dropdown>
            )}
          </div>
        )}
      </div>
    </div>
  ) : null;
};

export default PageNavBar;
