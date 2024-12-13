import Web3 from 'web3';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { IChainData } from '@/lib/wallet-selector/types';
import { INFURA_ID, ETH_SUPPORTED_CHAINS } from '@/constants';
import { getContractErrorMsg } from '@/utils';
import { message } from 'antd';

export function initWeb3(provider: any) {
  const web3: any = new Web3(provider);
  web3.eth.extend({ methods: [{ name: 'chainId', call: 'eth_chainId', outputFormatter: web3.utils.hexToNumber }] });

  return web3;
}

export function getEthChainData(chainId: number): IChainData {
  const chainData = ETH_SUPPORTED_CHAINS.filter((o: any) => o?.chain_id === chainId)[0];
  if (!chainData) {
    throw new Error('ChainId missing or not supported');
  }
  if (chainData.rpc_url.includes('infura.io') && chainData.rpc_url.includes('%API_KEY%') && INFURA_ID) {
    const rpcUrl = chainData.rpc_url.replace('%API_KEY%', INFURA_ID);
    return { ...chainData, rpc_url: rpcUrl };
  }

  return chainData;
}

export async function switchEthChain(chainId: number, ethereum: any, successFn?: any, failedFn?: any) {
  console.log('switchEthChain-chainId', ethereum, chainId);
  try {
    await ethereum
      .request({ method: 'wallet_switchEthereumChain', params: [{ chainId: Web3.utils.numberToHex(chainId) }] })
      .then((result: any) => {
        console.log('wallet_switchEthereumChain-result', result);
        successFn?.();
      });
  } catch (switchError: any) {
    console.log('switchError', switchError);
    // This error code indicates that the chain has not been added to MetaMask.
    if (
      switchError?.code === 4902 ||
      switchError?.data?.orginalError?.code === 4902 ||
      switchError.toString().indexOf('wallet_addEthereumChain') >= 0
    ) {
      await addEthereumChain(ethereum, chainId, successFn, failedFn);
    }
    if (switchError.code === 4001) {
      failedFn?.();
    }
    // handle other "switch" errors
  }
}

export async function addEthereumChain(ethereum: any, chainId: number, successFn?: any, failedFn?: any) {
  try {
    const chainConfig: IChainData = getEthChainData(chainId);
    console.log('addEthereumChain', chainConfig);
    await ethereum
      .request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: Web3.utils.numberToHex(chainConfig.chain_id),
            chainName: chainConfig?.name,
            nativeCurrency: {
              name: chainConfig?.native_currency?.name,
              symbol: chainConfig?.native_currency?.symbol,
              decimals: chainConfig?.native_currency?.decimals
            },
            rpcUrls: [chainConfig?.rpc_url],
            blockExplorerUrls: [chainConfig?.block_explorer_url]
          }
        ]
      })
      .then((result: any) => {
        console.log('wallet_addEthereumChain-result', result);
        successFn?.();
      });
  } catch (addError: any) {
    // handle "add" error
    console.log('wallet_addEthereumChain', addError);
    const msg = getContractErrorMsg(addError);
    if (addError.code === 4001) {
      failedFn?.();
      // EIP-1193 userRejectedRequest error
      message.error(msg);
    } else {
      message.error(msg);
    }
  }
}

export function switchAccount(ethWeb3: any) {
  const isPc = getPlatformInfo()?.isPc;
  if (!isPc) return;

  ethWeb3
    .request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] })
    .then((permissions: any) => {
      const accountsPermission = permissions.find((permission: any) => permission.parentCapability === 'eth_accounts');
      if (accountsPermission) {
        console.log('eth_accounts permission successfully requested!');
      }
    })
    .catch((error: any) => {
      if (error.code === 4001) {
        // EIP-1193 userRejectedRequest error
        console.log('Permissions needed to continue.');
        const msg = getContractErrorMsg(error);
        message.error(msg);
      } else {
        console.error(error);
      }
    });
}
