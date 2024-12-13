export interface NftInfo {
  id: string;
  title: string;
  description?: string;
  contractAddress: string;
  inputBalance?: number;
  balance?: string;
  spendingBalance?: number;
  chainType?: string; //eth
  chainId?: number;
  // 1 => erc721, 2 => erc1155
  type?: number;

  icon?: string;
  collection?: string;
  collectionLogo?: string;
  symbol?: string;
  ranking?: string;
  decimals?: number;

  balanceType: number; // 1 =>spending, 2 => wallet, 3 => unknown
}

export interface NftSelector extends NftInfo {
  isChecked?: boolean;
  checkedDisabled?: boolean;
  parentId?: string;
  address?: string;
}

export interface NftCollection {
  id?: string;
  icon?: string;
  contractAddress?: string;
  contracts?: string[];
  title: string;
  children?: NftSelector[];
  floorPrice?: string;
  isExpanded: boolean;
  chainType?: string;
  chainId?: number;
  // 1 => erc721, 2 => erc1155
  type?: number;
}
