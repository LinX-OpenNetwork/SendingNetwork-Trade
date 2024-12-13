import { useState } from 'react';
import { Dropdown, Divider } from 'antd';
import { Skeleton } from 'antd-mobile';
import {
  expandIcon,
  addressOmitShow,
  connectIcon,
  toConnectWallet,
  LocalStorage_get,
  isCanAction,
  getHistoryUrl
} from '@/utils';
import { useSelector, useDispatch } from 'dva';
import {
  STATIC_CDN,
  WALLET_CHAIN_CONFIG,
  ETH_SUPPORTED_CHAINS,
  WALLET_IMAGE_LIST,
  LOCAL_WALLET_NAME
} from '@/constants';
import SelectAccountPopup from './select_account_popup';
import { history } from 'umi';
import { find } from 'lodash';
import { useMultiWallet } from '@/lib/wallet-selector';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { useSwitchAccount } from '@/services/hooks';

const AccountPage = () => {
  const dispatch = useDispatch();
  const { authedAccountInfo, accountList, parentIframeUrl } = useSelector((state: any) => state.store);
  const { isConnected, onDisConnectWallet, onSelectConnectWallet } = useMultiWallet();
  const { onSwitchClick } = useSwitchAccount();
  const isPc = getPlatformInfo()?.isPc;
  const isMobile = getPlatformInfo()?.isMobile;
  const walletValue = LocalStorage_get(LOCAL_WALLET_NAME);
  const isCanCheck = isCanAction(parentIframeUrl);
  const isSdm = getPlatformInfo()?.isSdm;

  const connectedWalletMenus = (
    <div className="dropdown_wallet_content account_wallet">
      <div className="chain_menus">
        {WALLET_CHAIN_CONFIG.map((item) => {
          const fromParam = history.location.query?.from;
          return (
            <div
              className={`chain_menu_item ${authedAccountInfo?.chainId === item?.chainId ? 'active' : ''} ${
                fromParam && ['vault'].indexOf(fromParam?.toString()) >= 0 ? 'disabled' : ''
              }`}
              key={item.chainId}
              onClick={() => {
                dispatch({
                  type: 'store/setAuthedAccountInfo',
                  payload: { ...authedAccountInfo, chainId: item?.chainId }
                });
                setChainDropdownVisible(false);
                if (history.location.pathname === '/buy' && history.location.query?.from === 'wallet') {
                  let chainAssetsType: string | undefined = 'all';
                  if (item?.chainId) {
                    chainAssetsType = find(ETH_SUPPORTED_CHAINS, { chain_id: item?.chainId })?.sdm_wallet;
                  }
                  history.replace(getHistoryUrl(history?.location?.pathname + '?chain=' + chainAssetsType, ['chain']));
                }
              }}
            >
              <img src={item?.chainIcon} className="chain_icon" />
              {item.name}
            </div>
          );
        })}
      </div>
      <Divider className="wallet_divider" />
      {isConnected ? (
        <>
          {(walletValue === 'MetaMask' || isMobile) && !isSdm && (
            <div
              className="chain_menu_item"
              onClick={() => {
                if (isPc) {
                  setChainDropdownVisible(false);
                }
                onSwitchClick();
              }}
            >
              <img src={'/image/icon/switch_icon_nav.png'} width={20} height={20} />
              Switch account
            </div>
          )}
          <div
            className="chain_menu_item"
            onClick={() => {
              onDisConnectWallet();
              setChainDropdownVisible(false);
            }}
          >
            <img src={STATIC_CDN + '/image/icon/icon_Disconnect.png'} width={20} height={20} />
            Disconnect
          </div>
        </>
      ) : (
        <>
          {!isSdm && accountList?.length > 1 && (
            <div
              className="chain_menu_item"
              onClick={() => {
                setSelectAccountModalVisible(true);
                setChainDropdownVisible(false);
              }}
            >
              <img src={'/image/icon/switch_icon_nav.png'} width={20} height={20} />
              Switch account
            </div>
          )}
          <div
            className="chain_menu_item"
            onClick={() => {
              toConnectWallet(dispatch, { connectWallet: onSelectConnectWallet });
              setChainDropdownVisible(false);
            }}
          >
            {connectIcon}
            Connect wallet
          </div>
        </>
      )}
    </div>
  );

  const [selectAccountModalVisible, setSelectAccountModalVisible] = useState<boolean>(false);
  const [chainDropdownVisible, setChainDropdownVisible] = useState<boolean>(false);

  // console.log('account', authedAccountInfo, accountList);

  return (
    <div className="wallet_element_wrapper">
      <Dropdown
        // overlay={connectedWalletMenus}
        dropdownRender={() => {
          return connectedWalletMenus;
        }}
        placement="bottomRight"
        trigger={['click']}
        open={chainDropdownVisible}
        onOpenChange={setChainDropdownVisible}
        getPopupContainer={(triggerNode: any) => triggerNode?.parentNode}
      >
        <div className="connected_info">
          <div className="connected_chain">
            <img
              src={isConnected && walletValue ? WALLET_IMAGE_LIST?.[walletValue] : `/image/wallet/sendingme_logo.png`}
              className="chain_icon"
              width={12}
              height={12}
            />
            {authedAccountInfo?.chainId > 0 && (
              <div className="wallet_icon">
                <img
                  src={find(ETH_SUPPORTED_CHAINS, { chain_id: authedAccountInfo?.chainId })?.chain_icon}
                  className="chain_icon"
                  width={12}
                  height={12}
                />
              </div>
            )}
          </div>
          {authedAccountInfo?.publicKey ? (
            <div className="connected_wallet">{addressOmitShow(authedAccountInfo?.publicKey)}</div>
          ) : isCanCheck ? (
            <Skeleton animated className="connected_loading" />
          ) : (
            <div></div>
          )}
          <div className="connect_expand">{expandIcon}</div>
        </div>
      </Dropdown>
      {selectAccountModalVisible && (
        <SelectAccountPopup
          visible={selectAccountModalVisible}
          setVisible={setSelectAccountModalVisible}
          currentAccount={authedAccountInfo}
        />
      )}
    </div>
  );
};

export default AccountPage;
