import axios, { AxiosInstance } from 'axios';
import { ENV, STATIC_CDN, UNKNOWN_NFT_IMG, UNKNOWN_TOKEN_IMG } from '@/constants';
import { NftCollection, TokenInfo } from '@/types';
import { MathUtil_numberFixed } from '@/utils';
import BigNumber from 'bignumber.js';
import { orderBy } from 'lodash';

export class CoalenService {
  private instance: AxiosInstance;
  // linea-mainnet
  // linea-testnet
  private baseUrl = `https://api.covalenthq.com/v1/${ENV === 'test' ? 'linea-testnet' : 'linea-mainnet'}`;
  private API_KEY = 'cqt_rQCFQj4GWgDk4V6DwF3DrmPcqWWX';
  constructor() {
    this.instance = axios.create({});
  }

  public async getTokenBalance(ownerAddress: string, nftTypeParam?: number) {
    const tokens: TokenInfo[] = [];
    let nfts: NftCollection[] = [];
    const response = await this.instance.request({
      method: 'GET',
      url: this.baseUrl + '/address/' + ownerAddress + '/balances_v2/',
      params: {
        key: this.API_KEY,
        nft: ENV === 'test' ? true : false
      }
    });

    // console.log('CoalenService-getTokenBalance', response, response?.data?.data?.items);
    const balances = response?.data?.data;
    balances?.items?.forEach((item: any) => {
      if (item?.type !== 'nft') {
        // token
        const balanceValue = new BigNumber(item?.balance)
          .div(new BigNumber(10).pow(item?.contract_decimals))
          .toString();
        if (item?.native_token) {
          tokens?.push({
            type: 0, // 1 =>erc20, 2 => erc721, 3 => erc1155
            name: item?.contract_name,
            address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            symbol: item?.contract_ticker_symbol,
            decimals: item?.contract_decimals,
            chainType: 'eth',
            chainId: balances?.chain_id,
            balanceValue: MathUtil_numberFixed(balanceValue, 4, 'floor'),
            price: item?.quote_rate,
            currentBalancePrice: item?.quote,
            icon: '/image/token/eth.svg',
            order: 2,
            balanceType: 2
          });
        } else {
          tokens?.push({
            type: 1, // 1 =>erc20, 2 => erc721, 3 => erc1155,
            name: item?.contract_name,
            address: item?.contract_address,
            symbol: item?.contract_ticker_symbol,
            decimals: item?.contract_decimals,
            chainType: 'eth',
            chainId: balances?.chain_id,
            balanceValue: MathUtil_numberFixed(balanceValue, 4, 'floor'),
            price: item?.quote_rate,
            currentBalancePrice: item?.quote,
            icon: item?.logo_url || UNKNOWN_TOKEN_IMG,
            order: 1,
            balanceType: 2
          });
        }
      } else {
        // nft
        let nftType = 1;
        if (item?.supports_erc?.indexOf('erc1155') >= 0) {
          // nft-1155
          nftType = 2;
        } else if (item?.supports_erc?.indexOf('erc721') >= 0) {
          // nft-721
          nftType = 1;
        }
        if (nftTypeParam === nftType) {
          let collChildren: any = [];
          item?.nft_data?.forEach((child: any) => {
            collChildren.push({
              id: child?.token_id,
              title: item.contract_name || '',
              description: child?.external_data?.description,
              contractAddress: item.contract_address,
              type: nftType,
              balance: child?.token_balance + '',
              icon: child?.external_data?.image || UNKNOWN_NFT_IMG,
              collection: item.contract_name || '',
              collectionLogo: ENV === 'test' ? null : item?.logo_url || UNKNOWN_NFT_IMG,
              chainType: 'eth',
              chainId: balances?.chain_id,
              isChecked: false,
              parentId: item.contract_address,
              balanceType: 2
            });
          });
          nfts.push({
            isExpanded: false,
            id: item.contract_address,
            title: item.contract_name || '',
            icon: ENV === 'test' ? null : item?.logo_url || UNKNOWN_NFT_IMG,
            contractAddress: item.contract_address,
            chainId: balances?.chain_id,
            children: collChildren,
            type: nftType
          });
        }
      }
    });
    console.log('getTokenBalance', nfts);
    // order by title
    nfts = orderBy(
      nfts,
      [
        function (item) {
          if (item.title && item.title !== '') {
            return item.title.substring(0, 1).toLocaleUpperCase();
          } else {
            return item.title;
          }
        }
      ],
      ['asc']
    );
    return { tokens, nfts };
  }
}
