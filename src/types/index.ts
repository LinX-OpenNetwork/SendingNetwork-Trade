import { NftSelector } from './nft-types';
import { TokenSelector } from './token-types';

export * from './request-types';
export * from './response-types';
export * from './token-types';
export * from './nft-types';

export type RoomMember = {
  name: string;
  userId: string;
  icon: string;
  walletAddress: string;
  userLevel?: any;
};

export type RoomInfo = {
  members: RoomMember[];
  total: number;
  name?: string;
  avatar?: string;
  topic?: string;
};

export interface UserInfo {
  id?: string | undefined;
  name: string;
  avatar: string | undefined;
  address: string;
}

export type SDNUserInfo = {
  name: string;
  userId: string;
  walletAddress?: string;
  avatarUrl: string;
};

export type UserIndexInfo = {
  id?: string;
  icon: string;
  name: string;
  isOnline?: boolean;
  address: string;
};

export type TransferRecord = {
  id: number;
  makerAddress: string;
  makerUserName: string;
  makerUserId: string;
  makerUserImage: string;
  type: number;
  tokenAddress: string;
  tokenId: string;
  tokenAmount: string;
  roomId: string;
  status: number;
  txId: string;
  chainId: number;
  createTime: number;
  tokenSymbol: string;
  receiverAddress: string;
  receiverUserId: string;
  receiverUserName: string;
  receiverUserImage: string;
  tokens: any[];
};

export type signTranscation = {
  id: string;
  address?: string;
  txId?: string;
  status: number;
  nftInfo: NftSelector | TokenSelector;
  type: number;
};

export type ProcessType = {
  id: string;
  type: string;
  status: number;
  tokenInfo: TokenSelector;
  signed?: boolean;
  errorMsg?: string;
};

export type SelectorItem = {
  name: string;
  value: string;
};

export type AccountWallet = {
  verifySource?: string;
  walletAddress: string;
  walletName?: string;
  ens?: string;
  verifySourceLogo?: string;
  isChecked?: boolean;

  balance?: any;
  chainId?: number;
};
