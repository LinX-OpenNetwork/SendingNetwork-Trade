export type MultiWalletProviderProps = {
  children: any;
};
export interface IChainData {
  name: string;
  // chain: string;
  chain_icon?: string;
  chain_icon_bg?: string;
  // network: string;
  chain_id: number;
  // network_id: number;
  rpc_url: string;
  native_currency: {
    symbol: string;
    name: string;
    decimals: string | number;
  };
  block_explorer_url?: string;
  show_chain_name?: string;
  gas_price_ratio?: number;
  transfer_network?: string;
  // zapper_service?: string;
  wrap_token?: string;
  data_chain?: string;
  sdm_wallet?: string;
  is_test?: boolean;
  assets_type?: string;
}

export interface CurrentWalletProps {
  chain?: string;
  chainId: number;
  publicKey: string;
  walletName: string;
  walletLogo: string;
  // balance: number;
}

export interface MultiWalletContextState {
  loading: boolean;
  isConnected: boolean;
  currentWallet: CurrentWalletProps | null;
  ethWeb3: any;
  onSelectConnectWallet: (value: string, value2?: boolean) => void;
  onDisConnectWallet: () => void;
  switchChain: (value?: number, successFn?: any, failedFn?: any) => void;
  onSwitchAccount: () => void;
}
