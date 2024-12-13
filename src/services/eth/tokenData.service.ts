import { NftInfo, TokenInfo, NftSelector } from '@/types';
import {
  EthContractService,
  getNftAssets,
  getNftMetadata,
  getTokenAssets,
  getTokenBatchMetadata,
  getTokenMetadata,
  getDefaultToken
} from '@/services';
import { MathUtil_numberFixed, getChainRpc, isNativeToken } from '@/utils';
import { find } from 'lodash';
import {
  ETH_SUPPORTED_CHAINS,
  NULL_ADDRESS,
  UNKNOWN_NFT_IMG,
  NULL_ADDRESS_0,
  POLYGON_CHAINS,
  ARBITRUM_CHAINS,
  BNB_CHAINS,
  LINEA_CHAINS,
  ETH_CHAINS,
  UNKNOWN_TOKEN_IMG,
  OPTIMISM_CHAINS
} from '@/constants';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';

export async function TokenDataService_getTokenBalances(ownerAddress: string, chainId: number): Promise<TokenInfo[]> {
  const tokens: TokenInfo[] = [];
  try {
    ownerAddress = ownerAddress.toLowerCase();
    const tokenAsset: any = await getTokenAssets(ownerAddress, chainId);
    const infos = tokenAsset?.result?.infos;
    const cryptoAssets: any[] = infos?.[ownerAddress]?.crypto_assets ?? [];
    const chainInfo = find(ETH_SUPPORTED_CHAINS, { chain_id: chainId });
    const defaultToken = getDefaultToken({ chainId });
    for (let asset of cryptoAssets) {
      let tokenObj = {
        type: 1, // 1 =>erc20, 2 => erc721, 3 => erc1155
        name: asset?.symbol,
        address: asset?.contract_address,
        symbol: asset?.symbol,
        decimals: asset?.decimals,
        chainId,
        chainType: 'eth',
        balanceValue: MathUtil_numberFixed(asset.balance_val, 4, 'floor'),
        price: asset?.price?.price,
        currentBalancePrice: asset?.current_balance?.price
          ? Number(asset?.current_balance?.price)
          : asset?.current_balance?.price,
        icon: asset?.image || UNKNOWN_TOKEN_IMG,
        order: 1,
        balanceType: 2
      };
      // order
      let order: number = 1;
      if (isNativeToken(asset?.contract_address)) {
        tokenObj.type = 0;
        tokenObj.order = 2;
        tokenObj.address = NULL_ADDRESS;
        tokenObj.icon = defaultToken.icon;
        tokenObj.symbol = defaultToken.symbol;
        tokenObj.name = defaultToken.name;
        tokenObj.price = asset?.price?.price;
        tokenObj.currentBalancePrice = asset?.current_balance?.price
          ? Number(asset?.current_balance?.price)
          : asset?.current_balance?.price;
      } else if (
        asset?.contract_address === chainInfo?.wrap_token?.toLowerCase() ||
        asset?.contract_address === chainInfo?.wrap_token
      ) {
        order = 3;
      }

      tokens.push(tokenObj);
    }
  } catch (error) {}
  return tokens;
}

export async function TokenDataService_getNftsByOwnerAddress(
  ownerAddress: string,
  nftType: number,
  chainId: number
): Promise<NftSelector[]> {
  // from sdm api
  const NFTAssets: NftSelector[] = [];
  try {
    const pageNo: number = 0;
    const pageSize: number = 100;
    let nftResult: any = await getNftAssets(ownerAddress, chainId, pageNo, pageSize);
    let nftAsset: any = nftResult?.result;
    NFTAssets.push(...transNftInfo(nftAsset, chainId, nftType));
    // console.log('NFTAssets', NFTAssets);
    const count: number = nftAsset?.total_count;
    const pageTotal = count / pageSize + 1;
    for (let i = 1; i <= pageTotal - 1; i++) {
      nftResult = await getNftAssets(ownerAddress, chainId, i, pageSize);
      nftAsset = nftResult?.result;
      NFTAssets.push(...transNftInfo(nftAsset, chainId, nftType));
    }
  } catch (error) {}
  return NFTAssets;
}

function transNftInfo(nftAsset: any, chainId: number, nftType: number): NftSelector[] {
  const nftAssets: NftSelector[] = [];
  if (!nftAsset || nftAsset?.length == 0) {
    return nftAssets;
  }
  const nfts: any[] = nftAsset?.nft_assets;
  for (let nft of nfts) {
    let tokenType = nft?.token_type.toLowerCase() === 'erc721' ? 1 : 2;
    if (tokenType === nftType) {
      nftAssets.push({
        id: nft?.token_id,
        title: nft?.name,
        description: nft?.description,
        contractAddress: nft?.contract_address,
        type: tokenType,
        balance: nft?.amount + '',
        icon: nft?.image_thumbnail_url || UNKNOWN_NFT_IMG,
        collection: nft?.collection_name,
        collectionLogo: nft?.collection_image_url,
        chainType: 'eth',
        chainId,
        isChecked: false,
        parentId: nft?.contract_address,
        balanceType: 2
      });
    }
  }
  // console.log('nftAssets', nftAssets);
  return nftAssets;
}

export async function TokenDataService_getNftMetadataByTokenId(
  address: string,
  tokenId: string,
  chainId: number
): Promise<NftInfo | undefined> {
  const nftMetadataReuslt = await getNftMetadata(chainId, address, tokenId);
  const nft = nftMetadataReuslt?.result?.metadata;
  return {
    id: nft?.token_id,
    title: nft?.name,
    description: nft?.description,
    contractAddress: nft?.contract_address,
    type: nft?.token_type.toLowerCase() === 'erc721' ? 1 : 2,
    balance: nft?.amount + '',
    icon: nft?.image_url || UNKNOWN_NFT_IMG,
    collection: nft?.collection_name,
    collectionLogo: nft?.collection_image_url,
    chainId,
    balanceType: 2
  };
}

export async function TokenDataService_getTokenMetadataPrice(
  address: string,
  chainId: number,
  balanceType: number
): Promise<TokenInfo | undefined> {
  if (find(ETH_SUPPORTED_CHAINS, (o) => o?.chain_id === chainId)?.is_test) {
    // test chainId
    try {
      const rpcUrl = getChainRpc(chainId);
      const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
      const contractService = new EthContractService(web3);
      const decimal: string = await contractService.ERC20(address).methods.decimals().call();
      const symbol: string = await contractService.ERC20(address).methods.symbol().call();
      return {
        type: 1, // 1 =>erc20, 2 => erc721, 3 => erc1155
        name: symbol,
        address: address,
        symbol: symbol,
        decimals: decimal ? Number(decimal) : 18,
        chainId,
        chainType: 'eth',
        icon: UNKNOWN_TOKEN_IMG,
        balanceType
      };
    } catch (error) {}
  } else {
    const nftMetadataResult = await getTokenMetadata(chainId, address);
    if (nftMetadataResult && nftMetadataResult.result && nftMetadataResult?.result?.metadata) {
      const token = nftMetadataResult?.result?.metadata;
      return {
        type: 1, // 1 =>erc20, 2 => erc721, 3 => erc1155
        name: token?.name,
        address: token?.contract_address,
        symbol: token?.symbol,
        decimals: token?.decimals,
        chainId,
        chainType: 'eth',
        price: token?.current_price?.price,
        icon: token?.image_url || UNKNOWN_TOKEN_IMG,
        balanceType
      };
    }
  }
}

export async function TokenDataService_getTokenPrice(address: string, chainId: number): Promise<string | undefined> {
  const nftMetadataResult = await getTokenMetadata(chainId, address).catch();
  const token = nftMetadataResult?.result?.metadata;
  return token?.current_price?.price;
}

export async function TokenDataService_getBatchToken(takenAddress: string, chainId: number) {
  const batchMetadataResult = await getTokenBatchMetadata(chainId, takenAddress);
  return batchMetadataResult?.result;
}

export async function TokenDataService_getETHPrice(chainId: number): Promise<string | undefined> {
  if (ETH_CHAINS.indexOf(chainId) >= 0) {
    chainId = 1;
  }
  if (BNB_CHAINS.indexOf(chainId) >= 0) {
    chainId = 56;
  }
  if (POLYGON_CHAINS.indexOf(chainId) >= 0) {
    chainId = 137;
  }
  if (ARBITRUM_CHAINS.indexOf(chainId) >= 0) {
    chainId = 42161;
  }
  if (LINEA_CHAINS.indexOf(chainId) >= 0) {
    chainId = 59144;
  }
  if (OPTIMISM_CHAINS.indexOf(chainId) >= 0) {
    chainId = 10;
  }
  const nftMetadataResult = await getTokenMetadata(chainId, NULL_ADDRESS_0);
  const token = nftMetadataResult?.result?.metadata;
  // console.log('getETHPrice-token', token?.current_price?.price);
  return token?.current_price?.price;
}

export async function TokenDataService_getEthBalance(ownerAddress: string, chainId: number): Promise<string> {
  try {
    const rpcUrl = getChainRpc(chainId);
    const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    const balance: string = await web3.eth.getBalance(ownerAddress);
    return MathUtil_numberFixed(web3.utils.fromWei(balance, 'ether'), 4, 'floor') + '';
  } catch (error) {}
}

export async function TokenDataService_geERC20TokenBalance(
  ownerAddress: string,
  takenAddress: string,
  chainId: number,
  ethWeb3?: any
): Promise<string | undefined> {
  try {
    let web3Temp;
    if (ethWeb3) {
      web3Temp = ethWeb3;
    } else {
      const rpcUrl = getChainRpc(chainId);
      web3Temp = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    }
    const contractService = new EthContractService(web3Temp);
    const balance: string = await contractService.ERC20(takenAddress).methods.balanceOf(ownerAddress).call();
    const decimal: string = await contractService.ERC20(takenAddress).methods.decimals().call();
    const result = new BigNumber(balance).div(new BigNumber(10).pow(decimal)).toString();
    return MathUtil_numberFixed(result, 4, 'floor') + '';
  } catch (error) {}
}

export async function TokenDataService_getERC20TokenFromChainByAddress(
  address: string,
  chainId: number,
  ethWeb3?: any
) {
  try {
    const rpcUrl = getChainRpc(chainId);
    let contractService;
    if (ethWeb3) {
      contractService = new EthContractService(ethWeb3);
    } else {
      const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
      contractService = new EthContractService(web3);
    }
    const decimals: string = await contractService.ERC20(address).methods.decimals().call();
    const symbol: string = await contractService.ERC20(address).methods.symbol().call();
    return { decimals, symbol };
  } catch (error) {}
}
