import { QueryTokenByKeyReq, Response } from '@/types';
import request, { linxRequest } from './request';
import { getAuthUserInfo, getSourceType, LocalStorage_get, getToken } from '@/utils';
import { LINX_AUTH_INFO, ETH_SUPPORTED_CHAINS, LOCAL_SDN_USER, AUTH_USER_INFO } from '@/constants';
import { checkToken } from '@/services';
import { find } from 'lodash';

/** user start  **/
export async function checkUserToken(userToken: string): Promise<Response> {
  return request({
    method: 'GET',
    url: '/user/checkUserToken',
    params: {
      userToken
    }
  });
}

export async function checkUserTokenForPage(userToken: string): Promise<Response> {
  let sdmUserId = JSON.parse(LocalStorage_get(AUTH_USER_INFO) || '{}')?.id;
  if (!sdmUserId) {
    sdmUserId = JSON.parse(LocalStorage_get(LOCAL_SDN_USER) || '{}')?.userId;
  }
  return request({
    method: 'GET',
    url: '/user/checkUserTokenForPage',
    params: {
      userToken,
      sdmUserId
    }
  });
}

export async function checkUserAndGenToken(params: any): Promise<Response> {
  return request({
    method: 'POST',
    url: '/user/checkUserAndGenToken',
    data: params
  });
}

export async function queryTokens(params: QueryTokenByKeyReq): Promise<Response> {
  const accessToken = getToken(5);
  return request({
    method: 'POST',
    url: '/token/queryTokens',
    data: { accessToken, ...params }
  });
}

/** user end **/

/** linx start **/
async function getLinxRequestToken() {
  const authUserInfo = getAuthUserInfo();
  let linxAccToken = authUserInfo?.token;
  const accessToken = getToken(5);
  if (!linxAccToken && accessToken) {
    const tokenRes = await checkToken(accessToken);
    if (tokenRes.data?.accessToken) {
      linxAccToken = tokenRes.data?.accessToken;
    }
  }
  return `Bearer ${linxAccToken}`;
}

export async function sendMsgToRoom(params: any): Promise<any> {
  const auth = await getLinxRequestToken();
  return linxRequest({
    method: 'PUT',
    url: '/send/m.room.message',
    data: params,
    headers: {
      Authorization: auth
    }
  });
}

export async function getRoomMembers(roomId: string): Promise<any> {
  const auth = await getLinxRequestToken();
  return linxRequest({
    method: 'GET',
    url: '/get_room_members',
    params: {
      client_id: LINX_AUTH_INFO.clientId,
      room_id: roomId
    },
    headers: {
      Authorization: auth
    }
  });
}

export async function getUserWallets(): Promise<any> {
  const auth = await getLinxRequestToken();
  return linxRequest({
    method: 'GET',
    url: '/get_user_wallets',
    params: {
      client_id: LINX_AUTH_INFO.clientId
    },
    headers: {
      Authorization: auth
    }
  });
}

export async function pointsReport(params: any): Promise<any> {
  return linxRequest({ method: 'POST', url: '/points/report', data: params });
}

/** linx end **/

/** spending start **/

export async function getSpendingList(accessToken: string, pageNum: number, pageSize: number): Promise<Response> {
  return request({
    method: 'POST',
    url: '/spending/spending/getActiveSpendings',
    data: {
      accessToken,
      pageNum,
      pageSize,
      isSdn: getSourceType()
    }
  });
}

export async function getSpendingBalance(
  accessToken: string,
  chainType: number,
  chainId: number,
  tokenAddresses: string
): Promise<Response> {
  return request({
    method: 'POST',
    url: '/spending/spending/getSpendingsByChain',
    data: {
      accessToken,
      chainType,
      chainId,
      tokenAddresses,
      isSdn: getSourceType()
    }
  });
}

/** spending end **/

/** transfer order start  **/
export async function createInitRecord(recordData: any): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/order/create',
    data: { ...recordData, isSdn: getSourceType() }
  });
}

export async function updateTxId(args: any): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/order/updateTxId',
    data: { ...args, isSdn: getSourceType() }
  });
}

export async function finished(args: any): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/order/updateStatus',
    data: { ...args, isSdn: getSourceType() }
  });
}

export async function getTransferDetail(accessToken: string, id: number): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/order/queryDetail',
    data: { accessToken, id, isSdn: getSourceType() }
  });
}

export async function getTransferOrder(accessToken: string, id: string): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/order/queryById',
    data: { accessToken, id, isSdn: getSourceType() }
  });
}

// accessToken, direction, chainId, roomId, userId, relatedUserId, page, rows,
export async function getTransferRecord(params: any): Promise<Response> {
  console.log('getTransferRecord', params);
  return request({
    method: 'POST',
    url: '/transfer/order/queryHistory',
    data: {
      ...params,
      isSdn: getSourceType()
    }
  });
}

export async function createReceiveOrder(recordData: any): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/receive/create',
    data: { ...recordData, isSdn: getSourceType() }
  });
}

export async function getReceiveOrder(id: any, accessToken: string): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/receive/queryDetail',
    data: {
      accessToken,
      id,
      isSdn: getSourceType()
    }
  });
}

export async function getReceiveOrders(
  accessToken: string,
  userId: string,
  direction: number,
  page?: number,
  rows?: number
): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/receive/query',
    data: {
      accessToken,
      userId,
      direction,
      page,
      rows,
      isSdn: getSourceType()
    }
  });
}

export async function getUsdTokens(accessToken: string): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/receive/getUsdTokens',
    data: {
      accessToken,
      isSdn: getSourceType()
    }
  });
}

export async function setPaymentCodePic(params: any): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/order/createPaymentCode',
    data: { ...params, isSdn: getSourceType() }
  });
}

export async function getNftSpendingList(params: any): Promise<Response> {
  return request({
    method: 'POST',
    url: '/spdnft/spending/listnft',
    data: { ...params, isSdn: getSourceType() }
  });
}

export async function receiveOrder(id: string, accessToken: string): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/order/receive',
    data: {
      id,
      accessToken,
      isSdn: getSourceType()
    }
  });
}

export async function returnOrder(detailId: string, accessToken: string): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/order/return',
    data: {
      detailId,
      accessToken,
      isSdn: getSourceType()
    }
  });
}

export async function updateStatusSpd(params: any): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/order/updateStatusSpd',
    data: {
      ...params,
      isSdn: getSourceType()
    }
  });
}

export async function queryRecent(params: any): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/address/queryRecent',
    data: {
      ...params,
      isSdn: getSourceType()
    }
  });
}

export async function payUsd(params: any): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/receive/payUsd',
    data: {
      ...params,
      isSdn: getSourceType()
    }
  });
}

export async function queryReceivedUsd(params: any): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/receive/queryReceivedUsd',
    data: {
      ...params,
      isSdn: getSourceType()
    }
  });
}

export async function updatePaid(params: any): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/receive/updatePaid',
    data: {
      ...params,
      isSdn: getSourceType()
    }
  });
}

/** transfer order end  **/

/** date linx api start **/
export async function getTokenList(chainId: number): Promise<any> {
  const chainInfo = find(ETH_SUPPORTED_CHAINS, { chain_id: chainId });
  const chain = chainInfo?.data_chain;
  const accessToken = getToken(5);
  if (!chain || !accessToken) {
    return;
  }
  return request({
    method: 'GET',
    url: '/token/getTokenList',
    params: { accessToken, chain }
  });
}

export async function getTokenAssets(walletAddress: string, chainId: number): Promise<any> {
  const chainInfo = find(ETH_SUPPORTED_CHAINS, { chain_id: chainId });
  const chain = chainInfo?.data_chain;
  const accessToken = getToken(5);
  if (!chain || !walletAddress || !accessToken) {
    return;
  }
  return request({
    method: 'GET',
    url: '/token/getTokenForOwner',
    params: { accessToken, chain, wallet: walletAddress, refresh: true }
  });
}

export async function getNftAssets(
  walletAddress: string,
  chainId: number,
  pageNo: number,
  pageSize: number
): Promise<any> {
  const chainInfo = find(ETH_SUPPORTED_CHAINS, { chain_id: chainId });
  const chain = chainInfo?.data_chain;
  const accessToken = getToken(5);
  if (!chain || !walletAddress || !accessToken) {
    return;
  }
  return request({
    method: 'GET',
    url: '/token/getNftForOwner',
    params: { accessToken, chain, wallet: walletAddress, pageNo: pageNo, pageSize: pageSize, refresh: true }
  });
}

export async function getNftMetadata(chainId: number, collectionAddress: string, tokenId: string): Promise<any> {
  const chainInfo = find(ETH_SUPPORTED_CHAINS, { chain_id: chainId });
  const chain = chainInfo?.data_chain;
  const accessToken = getToken(5);
  if (!chain || !collectionAddress || !tokenId || !accessToken) {
    return;
  }
  return request({
    method: 'GET',
    url: '/token/getNftMetadata',
    params: { accessToken, chain, contractAddress: collectionAddress, tokenId: tokenId }
  });
}

export async function getTokenMetadata(chainId: number, tokenAddress: string): Promise<any> {
  const chainInfo = find(ETH_SUPPORTED_CHAINS, { chain_id: chainId });
  const chain = chainInfo?.data_chain;
  const accessToken = getToken(5);
  if (!chain || !tokenAddress || !accessToken) {
    return;
  }
  return request({
    method: 'GET',
    url: '/token/getTokenMetadata',
    params: { accessToken, chain, tokenAddress }
  });
}

export async function getTokenBatchMetadata(chainId: number, tokenAddress: string): Promise<any> {
  const chainInfo = find(ETH_SUPPORTED_CHAINS, { chain_id: chainId });
  const chain = chainInfo?.data_chain;
  const accessToken = getToken(5);
  if (!chain || !tokenAddress || !accessToken) {
    return;
  }
  return request({
    method: 'GET',
    url: '/token/getTokenBatchMetadata',
    params: { accessToken, chain, tokenAddress }
  });
}

/** date linx api end **/

/** transtoken api start **/
export async function getCurrencyOptions(accessToken: string): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transtoken/getCurrencyOptions',
    data: { accessToken }
  });
}

export async function getTokenOptions(accessToken: string, chainId?: number): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transtoken/getTokenOptions',
    data: { accessToken, chainId }
  });
}

export async function getBuyPrice(params: {
  accessToken: string;
  chainId: string | number;
  fiatCurrency: string;
  fiatAmount: string;
  tokenSymbol: string;
  walletAddress: string;
}): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transtoken/getBuyPrice',
    data: params
  });
}

export async function saveRecordUser(accessToken: string, walletAddress: string): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transtoken/saveRecordUser',
    data: {
      accessToken,
      walletAddress
    }
  });
}

export async function allowBuy(accessToken: string, chainId: number, tokenSymbol: string): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transtoken/allowBuy',
    data: {
      accessToken,
      chainId,
      tokenSymbol
    }
  });
}

export async function getSellPrice(params: {
  accessToken: string;
  chainId: string | number;
  fiatCurrency: string;
  tokenAmount: string | undefined;
  tokenSymbol: string;
  walletAddress: string;
}): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transtoken/getSellPrice',
    data: params
  });
}

export async function queryTransRecordPage(accessToken: string, pageSize: number, pageNum: number): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transtoken/queryTransRecordPage',
    data: { accessToken, pageSize, pageNum }
  });
}

export async function queryProviderOrder(orderId: string): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transtoken/queryProviderOrder',
    data: { orderId }
  });
}

export async function saveUserWalletAddress(userWalletAddress: string, orderId: string): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transtoken/saveUserWalletAddress',
    data: { userWalletAddress, orderId }
  });
}

export async function savePay(orderId: string): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transtoken/savePay',
    data: { orderId }
  });
}

export async function getIsPay(orderId: string): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transtoken/getIsPay',
    data: { orderId }
  });
}

/** transtoken api end **/

export async function startNotice(id: string, accessToken: string): Promise<Response> {
  return request({
    method: 'POST',
    url: '/transfer/receive/startNotice',
    data: { id, accessToken }
  });
}
