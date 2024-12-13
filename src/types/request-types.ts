export type AddTokenByKeyReq = {
  address: string;
  decimals: number;
  type: number;
  logo?: string;
  name: string;
  symbol: string;
  chainId?: number;
  accessToken: string;
};

export type QueryTokenReq = {
  type: number;
  chainId: number;
  accessToken: string;
};

export type QueryTokenByKeyReq = {
  key: string;
  chainId: number;
  limit?: number;
};
