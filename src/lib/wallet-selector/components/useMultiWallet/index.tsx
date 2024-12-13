import { createContext, useContext } from 'react';
import { MultiWalletContextState } from '@/lib/wallet-selector/types';

export const MultiWalletContext = createContext<MultiWalletContextState>(
  {} as MultiWalletContextState,
);

export default function useMultiWallet(): MultiWalletContextState {
  return useContext(MultiWalletContext);
}
