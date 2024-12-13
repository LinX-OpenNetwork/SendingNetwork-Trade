import { useEffect, useMemo, useRef, useState } from 'react';
import { MultiWalletContext } from '@/lib/wallet-selector/components/useMultiWallet';
import { initWeb3, switchEthChain, switchAccount, addEthereumChain } from '@/lib/wallet-selector/services/ethModel';
import { LocalStorage_get, LocalStorage_set, LocalStorage_remove } from '@/utils';
import {
  ETH_NETWORK_CONFIG,
  LOCAL_CONNECTED_CHAIN_ID,
  ENV_ETH_CHAIN_IDS,
  PARTICLE_AUTH_TYPES,
  WALLETCONNECT_V2_PROJECT_ID,
  WALLETCONNECT_V2_RPC,
  SHARE_URL_CSR,
  WALLET_IMAGE_LIST,
  PATICLE_CONFIG,
  WALLETCONNECT_V2_NAME,
  LOCAL_WALLET_NAME
} from '@/constants';
import { MultiWalletProviderProps, CurrentWalletProps } from '@/lib/wallet-selector/types';
import Web3Utils from 'web3-utils';
import { ParticleNetwork, SettingOption, WalletEntryPosition } from '@particle-network/auth';
import { ParticleProvider } from '@particle-network/provider';
import { chains as ParticleChains } from '@particle-network/common';
import { useDispatch } from 'dva';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import ConnnectTimeoutModal from './connect-timeout';
import { useSyncProviders } from '../../hooks/useSyncProviders';

const MultiWalletProvider = ({ children }: MultiWalletProviderProps) => {
  const [loading, setLoading] = useState(false);
  const [currentWallet, setCurrentWallet] = useState<CurrentWalletProps | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ethWeb3, setEthWeb3] = useState<any>(null);
  const [connectTimeoutVisible, setConnectTimeoutVisible] = useState<boolean>(false);
  const ethereumProvider = useRef<any>();
  const dispatch = useDispatch();
  let connectingTime = 0;
  let _connectingTimeSet: any = null;
  let walletConnectProvider: any;
  const providers = useSyncProviders();
  const metamaskProvider = providers.find((o) => o?.info?.name === 'MetaMask')?.provider;
  const isSdm = getPlatformInfo()?.isSdm;

  const particle: ParticleNetwork = useMemo(() => {
    const particle = new ParticleNetwork({
      projectId: PATICLE_CONFIG.REACT_APP_PROJECT_ID,
      clientKey: PATICLE_CONFIG.REACT_APP_CLIENT_KEY,
      appId: PATICLE_CONFIG.REACT_APP_APP_ID,
      chainId: ETH_NETWORK_CONFIG?.chain_id,
      chainName: 'Ethereum',
      securityAccount: {
        promptSettingWhenSign: SettingOption.Once,
        promptMasterPasswordSettingWhenLogin: SettingOption.Always
      },
      wallet: {
        displayWalletEntry: true,
        uiMode: 'dark',
        defaultWalletEntryPosition: WalletEntryPosition.TR,
        customStyle: {}
      }
    });

    return particle;
  }, []);

  async function walletCollectInit() {
    try {
      if (walletConnectProvider) {
        return walletConnectProvider;
      } else {
        const chainId = ENV_ETH_CHAIN_IDS[0];
        walletConnectProvider = await EthereumProvider.init({
          projectId: WALLETCONNECT_V2_PROJECT_ID || '',
          chains: [chainId],
          optionalChains: [ENV_ETH_CHAIN_IDS[1], ENV_ETH_CHAIN_IDS[2], ENV_ETH_CHAIN_IDS[3], ENV_ETH_CHAIN_IDS[4]],
          showQrModal: true,
          optionalMethods: [
            'eth_signTypedData',
            'eth_signTypedData_v3',
            'eth_sign',
            'wallet_addEthereumChain',
            'wallet_switchEthereumChain'
          ],
          events: ['chainChanged', 'accountsChanged', 'display_uri', 'connect', 'session_update', 'session_delete'],
          rpcMap: WALLETCONNECT_V2_RPC,
          metadata: {
            name: WALLETCONNECT_V2_NAME,
            description: WALLETCONNECT_V2_NAME,
            url: SHARE_URL_CSR,
            icons: [SHARE_URL_CSR + '/logo.png']
          }
        });
        walletConnectProvider.on('display_uri', () => {
          setVisible(false);
        });
        walletConnectProvider.on('session_delete', (param: any) => {
          console.log('session_delete');
          resetEthWallet();
        });

        return walletConnectProvider;
      }
    } catch (err) {
      console.error('init wallet client error', err);
    }
  }

  function setVisible(value: boolean) {
    dispatch({ type: 'store/setConnectModalVisible', payload: { visible: value } });
  }

  async function setEthInfo(provider: any, walletName: string) {
    const web3 = initWeb3(provider);
    setEthWeb3(web3);
    try {
      if (provider) {
        let accounts, chainId;
        if (walletName === 'walletconnectV2') {
          accounts = provider?.accounts;
          chainId = provider?.chainId;
        } else if ([...PARTICLE_AUTH_TYPES, 'Particle'].indexOf(walletName) >= 0) {
          accounts = await web3.eth.requestAccounts();
          chainId = await web3.eth.chainId();
        } else {
          // Injected Metamask
          console.log('setEthInfo Injected Metamask', provider);
          accounts = await provider.request({ method: 'eth_requestAccounts' })?.catch((e) => {
            console.log('eth_requestAccounts-error', e);
            setLoading(false);
            clearConnectingTime();
          });
          console.log('setEthInfo accounts', accounts);
          const chainIdHex = await provider.request({ method: 'eth_chainId' })?.catch((e) => {
            console.log('eth_chainId-error', e);
            setLoading(false);
            clearConnectingTime();
          });
          console.log('setEthInfo chainId', chainIdHex);
          chainId = Number(Web3Utils.hexToNumber(chainIdHex));
        }
        setCurrentWallet({
          chainId,
          publicKey: accounts?.[0],
          walletName: walletName,
          walletLogo: WALLET_IMAGE_LIST[walletName]
        });
        LocalStorage_set(LOCAL_CONNECTED_CHAIN_ID, chainId);
        LocalStorage_set(LOCAL_WALLET_NAME, walletName);
        setLoading(false);
        clearConnectingTime();
      } else {
        setLoading(false);
        clearConnectingTime();
      }
    } catch (error: any) {
      console.log('setEthInfoFromWeb3', error);
      setLoading(false);
      clearConnectingTime();
      if (error?.code === -32002) {
        setConnectTimeoutVisible(true);
      }
    }
  }

  async function onSelectConnectWallet(walletName: any, notAutoConnect?: boolean) {
    try {
      let provider;
      setLoading(true);
      if (walletName === 'Injected') {
        provider = window?.ethereum;
        if (!provider) {
          console.error('Do you have multiple wallets installed?');
          setLoading(false);
          return;
        }
      } else if (walletName === 'MetaMask') {
        // connect time start
        setConnectingTime();
        // connect time end
        provider = metamaskProvider;
        // provider = await detectEthereumProvider();
        if (!provider) {
          setLoading(false);
          clearConnectingTime();
          return;
        }
      } else if ([...PARTICLE_AUTH_TYPES, 'Particle'].indexOf(walletName) >= 0) {
        if (particle.auth.isLogin()) {
          particle.auth.getUserSimpleInfo().catch((error: any) => {
            if (error.code === 10005 || error.code === 8005) {
              resetEthWallet();
              particle.auth.logout();
            }
          });
          provider = new ParticleProvider(particle.auth);
        } else {
          if (!notAutoConnect) {
            if (walletName === 'Particle') {
              await particle.auth.login();
            } else {
              await particle.auth.login({ preferredAuthType: walletName });
            }
            provider = new ParticleProvider(particle.auth);
          }
        }
        console.log('particle login success');
        setLoading(false);
        clearConnectingTime();
      } else if (walletName === 'walletconnectV2') {
        if (!ethereumProvider.current) {
          provider = await walletCollectInit();
          if (!provider) {
            setLoading(false);
            clearConnectingTime();
            return;
          }
          ethereumProvider.current = provider;
        } else {
          provider = ethereumProvider.current;
        }
        await provider.enable();
      }
      await subscribeEthProvider(provider, walletName);
      setEthInfo(provider, walletName);
    } catch (error) {
      setLoading(false);
      clearConnectingTime();
      return;
    }
  }

  async function onDisConnectWallet() {
    setCurrentWallet(null);
    resetEthWallet();
  }

  async function subscribeEthProvider(provider: any, walletName: string) {
    if (!provider.on) {
      return;
    }
    provider.on('connect', async () => {});
    provider.on('close', () => resetEthWallet());
    provider.on('accountsChanged', async (accounts: string[]) => {
      console.log('accountsChanged', accounts, provider);
      if (accounts?.length > 0) {
        setEthInfo(provider, walletName);
      } else {
        onDisConnectWallet();
      }
    });
    provider.on('chainChanged', async (chainId: string) => {
      LocalStorage_set(LOCAL_CONNECTED_CHAIN_ID, Web3Utils.hexToNumberString(chainId));
      setEthInfo(provider, walletName);
    });
  }

  async function resetEthWallet() {
    if (ethWeb3 && ethWeb3.currentProvider && ethWeb3.currentProvider?.close) {
      await ethWeb3.currentProvider?.close();
    }
    if (ethWeb3 && ethWeb3.currentProvider && ethWeb3.currentProvider?.disconnect) {
      await ethWeb3.currentProvider.disconnect();
    }
    if ([...PARTICLE_AUTH_TYPES, 'Particle'].indexOf(currentWallet?.walletName || '') >= 0) {
      particle.auth.logout();
    }
    setCurrentWallet(null);
    LocalStorage_remove(LOCAL_WALLET_NAME);
  }

  async function switchChain(chainId?: number, successFn?: any, failedFn?: any) {
    if (!chainId) return;
    if (ethWeb3?.currentProvider?.isParticleNetwork) {
      // particle
      const chain = ParticleChains.getEVMChainInfoById(chainId);
      if (chain && particle.auth.isLogin()) {
        const res = await particle.auth.switchChain(chain);
        console.log('switchChain-particle', res);
        if (res) {
          successFn?.();
        } else {
          failedFn?.();
        }
      }
      return;
    } else if (ethWeb3?.currentProvider?.isWalletConnect) {
      // walletconnectV2
      let isAvailableSwitch =
        ethWeb3?.currentProvider.session.namespaces.eip155.chains.indexOf('eip155:' + chainId) > -1;
      if (isAvailableSwitch) {
        switchEthChain(chainId, ethWeb3?.currentProvider, successFn, failedFn);
      } else {
        addEthereumChain(ethWeb3?.currentProvider, chainId, successFn, failedFn);
      }
      return;
    } else {
      // MetaMask or Injected
      let ethereum = ethWeb3.currentProvider || window.ethereum;
      const walletValue = LocalStorage_get(LOCAL_WALLET_NAME);
      if (walletValue === 'MetaMask') {
        ethereum = metamaskProvider;
      } else if (walletValue === 'Injected') {
        ethereum = window.ethereum;
      }
      switchEthChain(chainId, ethereum, successFn, failedFn);
    }
  }

  function onSwitchAccount() {
    const walletValue = LocalStorage_get(LOCAL_WALLET_NAME);
    let ethereum: any = window.ethereum;
    if (walletValue === 'MetaMask') {
      ethereum = metamaskProvider;
    } else if (walletValue === 'walletconnectV2') {
      ethereum = ethWeb3.currentProvider;
    }
    switchAccount(ethereum);
  }

  function setConnectingTime() {
    connectingTime = 0;
    _connectingTimeSet = setInterval(() => {
      connectingTime += 1;
      console.log('setConnectingTime', connectingTime);
      if (connectingTime >= 20) {
        setConnectTimeoutVisible(true);
        setLoading(false);
        clearConnectingTime();
      }
    }, 1000);
  }

  function clearConnectingTime() {
    clearInterval(_connectingTimeSet);
    connectingTime = 0;
    _connectingTimeSet = null;
  }

  useEffect(() => {
    // auto-connect
    console.log('auto-connect', isSdm, window?.ethereum);
    if (isSdm && window?.ethereum) {
      onSelectConnectWallet('Injected');
    } else {
      const lastWallet = LocalStorage_get(LOCAL_WALLET_NAME);
      if (lastWallet) {
        if (lastWallet !== 'Injected') {
          const notAutoConnect: boolean = PARTICLE_AUTH_TYPES.indexOf(lastWallet) > -1 || lastWallet == 'Particle';
          onSelectConnectWallet(lastWallet, notAutoConnect);
        } else {
          if (isSdm && window?.ethereum) {
            onSelectConnectWallet(lastWallet);
          }
        }
      }
    }
  }, [metamaskProvider]);

  useEffect(() => {
    setIsConnected(currentWallet?.chainId ? true : false);
    if (currentWallet && currentWallet?.chainId && ENV_ETH_CHAIN_IDS.indexOf(currentWallet?.chainId) < 0) {
      switchChain();
    }
  }, [currentWallet?.chainId]);

  // console.log('window.ethereum', currentWallet?.chainId);
  // console.log('ee', currentWallet);

  return (
    <MultiWalletContext.Provider
      value={{
        loading,
        isConnected,
        currentWallet,
        ethWeb3,
        onSelectConnectWallet,
        onDisConnectWallet,
        switchChain,
        onSwitchAccount
      }}
    >
      {children}
      {connectTimeoutVisible && (
        <ConnnectTimeoutModal visible={connectTimeoutVisible} setVisible={setConnectTimeoutVisible} />
      )}
    </MultiWalletContext.Provider>
  );
};

export default MultiWalletProvider;
