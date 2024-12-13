import { useEffect, useState } from 'react';
import { Modal, Toast } from 'antd-mobile';
import { useMultiWallet } from '@/lib/wallet-selector';
import { history } from 'umi';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { ETH_SUPPORTED_CHAINS, PARTICAL_MENUS, LOCAL_WALLET_NAME } from '@/constants';
import { LocalStorage_get, addressOmitShow, LoadingOutlinedIcon, closeModalIcon } from '@/utils';
import { useDispatch, useSelector } from 'dva';
import { PassportAuth } from '@/services';
import './index.less';
import UserAvatar from '../user-avatar';

const walletConnectOptionV2 = {
  name: 'WalletConnect',
  applyName: 'walletconnectV2',
  iconPath: '/image/wallet/eth_walletconnect.svg',
  btnBg: 'bg_black'
};

const metamaskOption = {
  name: 'MetaMask',
  applyName: 'MetaMask',
  iconPath: '/image/wallet/eth_MetaMask.svg',
  btnBg: 'bg_white'
};

const injectedOption = {
  name: 'Injected Wallet',
  applyName: 'Injected',
  iconPath: '/image/wallet/sendingme_logo.png',
  btnBg: 'bg_white'
};

const ConnectModal = ({ visible }: { visible: boolean }) => {
  const dispatch = useDispatch();
  const { isCreate, isRecoAccount, authedAccountInfo, roomId } = useSelector((state: any) => state.store);
  const {
    isConnected,
    loading: connecting,
    onSelectConnectWallet,
    currentWallet,
    ethWeb3,
    onDisConnectWallet,
    switchChain
  } = useMultiWallet();
  const walletName = LocalStorage_get(LOCAL_WALLET_NAME);

  const isMobile = getPlatformInfo()?.isMobile;
  const isSdm = getPlatformInfo()?.isSdm;
  const [isSigning, setIsSigning] = useState<boolean>(false);

  function getWalletOptions() {
    const isMetaMaskBrower = navigator.userAgent?.indexOf('MetaMaskMobile') >= 0;
    let injected;
    let metamaskWallet;
    let walletConnectV2;
    if (!isMobile) {
      metamaskWallet = metamaskOption;
    }
    if (window.ethereum?.isMetaMask || isMetaMaskBrower) {
      metamaskWallet = metamaskOption;
    }
    if (isSdm && window?.ethereum) {
      injected = injectedOption;
    }
    if (!isMetaMaskBrower) {
      walletConnectV2 = walletConnectOptionV2;
    }
    console.log('connect-modal-isMetaMask', window.ethereum);

    return [injected, metamaskWallet, walletConnectV2];
  }

  function setVisible(value: boolean) {
    dispatch({
      type: 'store/setConnectModalVisible',
      payload: {
        visible: value
      }
    });
  }

  function closeWalletConnectModal() {
    const walletValue = LocalStorage_get(LOCAL_WALLET_NAME);
    if (walletValue === 'walletconnect') {
      console.log('closeWalletConnectModal-ios');
      const modal = document.getElementsByClassName('walletconnect-modal__close__wrapper')[0] as HTMLElement | null;
      if (modal) {
        modal?.click();
      }
    }
  }

  function setAuthedAccount() {
    if (isRecoAccount) {
      const dataChainName = ETH_SUPPORTED_CHAINS.find(
        (o) => o?.chain_id === authedAccountInfo?.chainId
      )?.show_chain_name;
      Toast.show({
        content: (
          <div className="base_info_toast">
            To continue the current transaction, please agree to switch the wallet network to {dataChainName}
          </div>
        ),
        maskClassName: 'base_info_toast_mask',
        position: 'top',
        duration: 3000
      });
      switchChain(
        authedAccountInfo?.chainId,
        () => {},
        () => {
          console.log('User deny');
          dispatch({
            type: 'store/setAuthedAccountInfo',
            payload: {
              walletName: currentWallet?.walletName,
              walletLogo: currentWallet?.walletLogo,
              chainId: authedAccountInfo?.chainId ?? currentWallet?.chainId,
              publicKey: currentWallet?.publicKey
            }
          });
        }
      );
    } else {
      dispatch({
        type: 'store/setAuthedAccountInfo',
        payload: {
          walletName: currentWallet?.walletName,
          walletLogo: currentWallet?.walletLogo,
          chainId: authedAccountInfo?.chainId ?? currentWallet?.chainId,
          publicKey: currentWallet?.publicKey
        }
      });
    }
  }

  useEffect(() => {
    if (isConnected) {
      const account = currentWallet?.publicKey;
      if (isCreate && account && (!roomId || roomId === '')) {
        // set wallet token
        setIsSigning(true);
        PassportAuth.signedWalletLogin(
          account,
          ethWeb3,
          () => {
            setVisible(false);
            closeWalletConnectModal();
            setIsSigning(false);
            setAuthedAccount();
          },
          () => {
            setVisible(false);
            closeWalletConnectModal();
            setIsSigning(false);
            onDisConnectWallet();
          },
          dispatch
        );
      } else {
        setVisible(false);
        closeWalletConnectModal();
      }
    }
  }, [isConnected]);

  useEffect(() => {
    const autoConnect = history.location.query?.autoConnect;
    if (autoConnect && autoConnect.toString() !== '') {
      onSelectConnectWallet(autoConnect.toString());
    }
  }, [history.location.query?.autoConnect]);

  return (
    <Modal
      visible={visible}
      bodyClassName="connect_modal"
      style={{
        zIndex: '1300'
      }}
      content={
        <div className="connect_modal_content">
          <div className="modal_close_btn">
            <div
              onClick={() => {
                setVisible(false);
              }}
            >
              {closeModalIcon}
            </div>
          </div>
          <div className="modal_title">Connect</div>
          {isRecoAccount && (
            <div className="recommend_content">
              <div className="rec_title">Need to connect your wallet account</div>
              <div className="rec_item">
                <div className="rec_logo">
                  <UserAvatar
                    name={authedAccountInfo?.walletName}
                    src={authedAccountInfo?.walletLogo}
                    size="3"
                    borderRadius="50%"
                  />
                </div>
                <div className="rec_address">{addressOmitShow(authedAccountInfo?.publicKey)}</div>
              </div>
            </div>
          )}
          <div className="connect_action">
            {getWalletOptions().map((item: any) => {
              if (!item) return null;
              return (
                <div
                  className="connect_item"
                  onClick={async () => {
                    if (item?.applyName === 'Install-MetaMask') {
                      window.location.href = item?.link;
                    } else if (item?.applyName === 'walletconnectV2') {
                      onSelectConnectWallet(item?.applyName);
                    } else {
                      await onSelectConnectWallet(item?.applyName);
                    }
                  }}
                  key={item?.name}
                >
                  <div className="connect_item_name">
                    {item?.name}
                    {(connecting || isSigning) && walletName === item?.name && LoadingOutlinedIcon}
                  </div>
                  <div className="connect_item_icon">
                    {item?.iconNode ? item?.iconNode : <img src={item?.iconPath} width={28} height={28} />}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="more_connect">
            <div className="more_title">More Login Options</div>
            <div className="more_content">
              {PARTICAL_MENUS.map((item) => {
                return (
                  <div className="more_item" key={item.key} onClick={() => onSelectConnectWallet(item?.name)}>
                    {item.icon}
                  </div>
                );
              })}
            </div>
            <div className="more_copyright">Powered by Particle Network</div>
          </div>
          {/* <div className="connect_copyright">
            © 2023 SocialSwap.com. All rights reserved.
          </div> */}
        </div>
      }
      closeOnAction
      onClose={() => {
        setVisible(false);
      }}
      actions={[]}
    />
  );
};

export default ConnectModal;
