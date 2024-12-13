import { BigNumber } from '@ethersproject/bignumber';
import { UserInfo } from '.';
export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainType?: string; //eth
  chainId?: number;

  type?: number; // 0 =>default 1 =>erc20, 2 => erc721, 3 => erc1155

  isDefault?: boolean;

  icon?: string;

  balance?: BigNumber;
  balanceValue?: number | string;
  price?: string | number | undefined;
  spendingValue?: number | string;
  currentBalancePrice?: number | string | undefined;

  order?: number;
  balanceType: number; // 1 =>spending, 2 => wallet

  maxAmount?: number;
  minAmount?: number;
}

export interface BuyTokenInfo {
  symbol: string;
  name: string;
  icon?: string;
  address: string;
  chainId?: number;
  payInAllowed?: boolean;
  balanceValue?: number | string;
  price?: string | number | undefined;
  currentBalancePrice?: number | string | undefined;
}

export interface TokenSelector extends TokenInfo {
  value?: string | number;
  id: string;
  isChecked?: boolean;
}
