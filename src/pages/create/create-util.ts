import {
  MathUtil_plus,
  getChainIdFromSdmParam,
  getContractErrorMsg,
  getGasPriceValue,
  getAuthUserInfo,
  checkSourceType,
  isNativeToken,
  useUrlParams
} from '@/utils';
import { ETH_SUPPORTED_CHAINS, SHARE_URL, LINX_WEB_URL, LINX_AUTH_INFO } from '@/constants';
import {
  finished,
  updateTxId,
  getTokenBigNumberAmount,
  getDefaultTokenAndValue,
  TokenDataService_getTokenMetadataPrice,
  TokenDataService_geERC20TokenBalance,
  TokenDataService_getNftMetadataByTokenId,
  EthWeb3Service,
  EthContractService,
  createInitRecord
  // TokenDataService_getNFTAssetsCount
} from '@/services';
import { Response, TokenInfo, TokenSelector, NftSelector, signTranscation } from '@/types';
import { find, isArray, findIndex, filter } from 'lodash';
import Web3Utils from 'web3-utils';
import { history } from 'umi';
import { BigNumber } from '@ethersproject/bignumber';

export function updateOrder(
  createResp: Response,
  accessToken: string | undefined,
  chainId: number | undefined,
  txId: string
) {
  if (createResp.success) {
    let args = {
      accessToken: accessToken,
      chainId: chainId,
      txId: txId,
      id: createResp.result?.id
    };
    updateTxId(args).then((respUpdate) => {
      console.log('updateTxId', respUpdate);
    });
  }
}

export function finishOrder(
  createResp: Response,
  accessToken: string | undefined,
  chainId: number | undefined,
  txId: string,
  successFn: any
) {
  let args = {
    accessToken: accessToken,
    chainId: chainId,
    txId: txId,
    id: createResp.result?.id
  };
  finished(args).then((respFinish) => {
    console.log('finished order, ', respFinish);
    if (respFinish && respFinish?.success) {
      successFn();
    }
  });
}

export async function sendTransferMsg(orderId: number, msg: string, msgHtml: string, roomId: string) {
  // console.log('before send msg');
  const sourceType = checkSourceType();
  const shareUrl = `${SHARE_URL}/order?id=${orderId}${sourceType === 'SDN' ? '&st=sdn' : ''}${
    roomId ? '&roomId=' + roomId : ''
  }`;
  let params = [
    {
      body: '💰 ' + msg + shareUrl,
      msgtype: 'm.text',
      format: 'org.matrix.custom.html',
      formatted_body: '💰 ' + msgHtml + shareUrl
    }
  ];
  // console.log('roomId=' + roomId);
  if (roomId) {
    TransferAccessService.shareToRoom(
      params,
      roomId,
      false,
      (res: any) => {
        if (res && res?.event_id) {
          console.log('send success');
        } else {
          console.log('send failed');
        }
      },
      (error: any) => {
        console.error(error);
      }
    );
  }
}

export function ga_gtag(eventName: string, eventParams: any) {
  try {
    // @ts-ignore
    gtag('event', eventName, eventParams);
  } catch (e) {
    console.error(eventName, e);
  }
}

export function toData64(value: string) {
  if (!value) {
    throw Error('empty value data');
  }
  if (value?.length > 64) {
    throw Error('too big value data: ' + value);
  }

  let tmp = '';
  if (value.startsWith('0x')) {
    tmp = value.substring(2);
  } else {
    tmp = value;
  }
  let len = 64 - tmp?.length;
  let data = '';
  for (let i = 0; i < len; i++) {
    data += '0';
  }
  return data + tmp;
}

export function getChainInfo(chainId: number) {
  const chainInfo = find(ETH_SUPPORTED_CHAINS, { chain_id: chainId }) || ETH_SUPPORTED_CHAINS[0];
  return chainInfo;
}

export function getTokenHexValue(value: number, token: any) {
  let amount = getTokenBigNumberAmount(value, token.decimals);
  let hexValue;
  if (BigNumber.isBigNumber(amount)) {
    hexValue = amount._hex;
  } else {
    hexValue = Web3Utils.toHex(amount);
  }

  return hexValue + '';
}

export function getTokenCallObj(token: TokenInfo, from: string, to: string, hexValue: string) {
  let callObj = undefined;
  if (isNativeToken(token?.address)) {
    callObj = {
      target: token.address,
      callData: '0x' + toData64(to) + toData64(hexValue)
    };
  } else {
    callObj = {
      target: token.address,
      callData: '0x23b872dd' + toData64(from) + toData64(to) + toData64(hexValue)
    };
  }
  return callObj;
}

export function getTokenVauleAll(tokenList: TokenSelector[]) {
  let sumVaule = 0;
  tokenList.forEach((item) => {
    if (item && item.value && Number(item.value) && item.price && Number(item.price)) {
      let itemVaule = Number(item.price) * Number(item.value);
      sumVaule += MathUtil_plus(sumVaule, itemVaule);
    }
  });
  console.log('getTokenVauleAll', sumVaule, tokenList);
  return sumVaule;
}

export function checkChainIdParam(authedAccountInfo: any, dispatch: any) {
  const chainIdParam = useUrlParams().get('chainId');
  const chainParam = useUrlParams().get('chain');
  const fromParam = useUrlParams().get('from');

  let chainIdValue = chainIdParam ? Number(chainIdParam) : undefined;
  /* External call: /create?from=wallet&chain=ethereum */
  if (fromParam === 'wallet') {
    if (chainParam) {
      chainIdValue = getChainIdFromSdmParam(chainParam) ?? chainIdValue;
    }
  }
  // console.log('direct-transfer-setAuthedAccountInfo-1', chainIdValue, authedAccountInfo);
  if (
    chainIdValue &&
    authedAccountInfo &&
    authedAccountInfo?.chainId !== undefined &&
    authedAccountInfo?.chainId !== chainIdValue
  ) {
    dispatch({
      type: 'store/setAuthedAccountInfo',
      payload: { ...authedAccountInfo, chainId: chainIdValue }
    });
  }

  return { chainIdValue, isKill: false };
}

export async function getAssetsFromOrderId(orderInfo: any, ownerAddress: string) {
  // token
  const authUserInfo = getAuthUserInfo();
  let receTokens: TokenSelector[] = [],
    receNfts: NftSelector[] = [];
  const receIndex = findIndex(orderInfo?.receivers, {
    receiverUserId: authUserInfo?.id
  });
  let receiveInfo;
  if (receIndex >= 0) {
    receiveInfo = orderInfo?.receivers[receIndex];
    for (let item of receiveInfo?.tokens) {
      if (item?.type !== 2) {
        let tokenInfo: TokenInfo | undefined;
        if (isNativeToken(item?.tokenAddress)) {
          tokenInfo = await getDefaultTokenAndValue(
            {
              chainId: orderInfo?.chainId,
              publicKey: ownerAddress
            },
            true,
            true,
            true
          );
          receTokens.push({
            value: item?.tokenAmount,
            id: item?.tokenAddress,
            isChecked: true,
            ...tokenInfo,
            balanceType: 2,
            chainId: orderInfo?.chainId
          });
        } else {
          //erc20
          const ercRes = await TokenDataService_getTokenMetadataPrice(item?.tokenAddress, orderInfo?.chainId, 2);
          const balance = await TokenDataService_geERC20TokenBalance(
            ownerAddress,
            item?.tokenAddress,
            orderInfo?.chainId
          );
          console.log('ercRes', balance);
          // if (ercRes) {
          receTokens.push({
            value: item?.tokenAmount,
            id: item?.tokenAddress,
            isChecked: true,
            name: item?.tokenSymbol,
            symbol: item?.tokenSymbol,
            icon: item?.tokenIcon,
            address: item?.tokenAddress,
            balanceValue: balance,
            decimals: item?.tokenDecimal,
            price: ercRes?.price,
            balanceType: 2,
            chainId: orderInfo?.chainId
          });
          // }
        }
      } else {
        let nftInfo = await TokenDataService_getNftMetadataByTokenId(
          item?.tokenAddress,
          item?.tokenId,
          orderInfo?.chainId
        );
        // let balanceRes =await TokenDataService_getNFTAssetsCount(orderInfo?.chainId, item?.tokenAddress, ownerAddress)

        if (nftInfo) {
          receNfts.push({
            isChecked: true,
            checkedDisabled: true,
            parentId: item?.tokenAddress,
            address: item?.tokenAddress,
            ...nftInfo,
            balance: '1'
          });
        }
      }
    }
  }

  return {
    receNfts,
    receTokens
  };
}

export async function getSignList(
  {
    checkedTokenList,
    checkedNft,
    fromAddress
  }: {
    checkedTokenList: TokenSelector[];
    checkedNft: NftSelector[];
    fromAddress: string;
  },
  ethWeb3: any,
  gasPriceCon: any
) {
  const service = new EthContractService(ethWeb3);
  let signListTemp: signTranscation[] = [];
  let map = new Map();
  if (checkedTokenList?.length > 0) {
    for (let token of checkedTokenList) {
      // console.log('token=', token);
      let value = Number(token.value);
      let amount = getTokenBigNumberAmount(value, token.decimals);
      let needsApproveRes: boolean;
      if (!isNativeToken(token?.address)) {
        needsApproveRes = await EthWeb3Service.needsApprove(
          service,
          1,
          token?.address,
          amount,
          fromAddress,
          token?.chainId,
          gasPriceCon
        );
        // console.log('needsApproveRes1=', needsApproveRes);
      } else {
        needsApproveRes = false;
        // console.log('needsApproveRes2=', needsApproveRes);
      }
      // needsApproveRes = true;
      if (needsApproveRes) {
        signListTemp.push({
          id: token.symbol,
          address: token?.address,
          // 1: waiting 2: processing 3: completed
          status: 1,
          nftInfo: token,
          type: 1
        });
      }
    }
  } else if (checkedNft?.length > 0) {
    for (let nft of checkedNft) {
      // console.log('nft=', nft);
      if (map.has(nft?.contractAddress)) {
        continue;
      }
      map.set(nft?.contractAddress, '');
      let needsApproveRes = await EthWeb3Service.needsApprove(
        service,
        2,
        nft?.contractAddress,
        undefined,
        fromAddress,
        nft?.chainId,
        gasPriceCon
      );
      // needsApproveRes = true;
      // console.log('needsApproveRes=', needsApproveRes);
      if (needsApproveRes) {
        signListTemp.push({
          id: nft?.parentId + nft?.id,
          address: nft?.contractAddress,
          // 1: waiting 2: processing 3: completed
          status: 1,
          nftInfo: { ...nft, address: nft?.contractAddress },
          type: 2
        });
      }
    }
  }

  return signListTemp;
}

export async function getEthTransMsg(
  { token, fromAddress, toAddress }: { token: TokenSelector; fromAddress: string; toAddress: string },
  ethWeb3: any,
  gasPriceCon?: any
) {
  const pktTotalAmount = Number(token.value);
  let amount = getTokenBigNumberAmount(pktTotalAmount, 18);
  const gasPriceValue = getGasPriceValue(gasPriceCon, token?.chainId);
  const message: any = {
    from: fromAddress,
    to: toAddress,
    value: amount,
    gasPrice: gasPriceValue
  };
  const gasLimit =
    (await ethWeb3.eth.estimateGas(message).catch((e: any) => {
      console.log('getEthTransMsg-gasLimit-error', e);
    })) * 1.2;
  // console.log('getEthTransMsg-gasLimit', fromAddress, gasLimit);
  if (history.location.query?.from !== 'vault') {
    message!.gas = ethWeb3.utils.BN(gasLimit);
  }
  return { message, gasLimit };
}

export async function sendMsg(
  {
    sentUser,
    toPeople,
    orderId,
    balanceType,
    checkedToken,
    checkedNft,
    pktMsg
  }: {
    sentUser: any;
    toPeople: any;
    orderId: number;
    balanceType: number;
    checkedToken: TokenSelector[];
    checkedNft: NftSelector[];
    pktMsg?: string;
  },
  roomId: string
) {
  if (!sentUser && !toPeople) {
    return;
  }
  // console.log('before send msg');
  const toName = sentUser?.name ?? toPeople?.name;
  const toUserId = sentUser?.id ?? toPeople?.id ?? toPeople?.userId;

  let msg = balanceType === 2 ? `@${toName} I sent ` : 'I am going to send ';
  let msgHtml =
    balanceType === 2 ? `<a href=\"${LINX_WEB_URL}/#/user/${toUserId}\">@${toName}</a> I sent ` : 'I am going to send ';
  const checkedTokenList = checkedToken.filter((o) => o.value && Number(o.value) > 0);
  for (let token of checkedTokenList) {
    msg += `${token.value} ${token?.name} and `;
    msgHtml += `${token.value} ${token?.name} and `;
  }
  let nftNum = checkedNft?.length;
  if (nftNum > 0) {
    msg += `${nftNum} NFT${nftNum > 1 ? 's' : ''}`;
    msgHtml += `${nftNum} NFT${nftNum > 1 ? 's' : ''}`;
  }
  if (msg.endsWith(' and ')) {
    msg = msg.substring(0, msg?.length - 5);
    msgHtml = msgHtml.substring(0, msgHtml?.length - 5);
  }
  msg += balanceType === 2 ? ' to your wallet \n' : ` to your spending account, please accept @${toName} \n`;
  msgHtml +=
    balanceType === 2
      ? ' to your wallet \n'
      : ` to your spending account, please accept <a href=\"${LINX_WEB_URL}/#/user/${toUserId}\">@${toName}</a> \n`;
  if (pktMsg) {
    msg += pktMsg && pktMsg !== '' ? pktMsg + '\n' : '';
    msgHtml += pktMsg && pktMsg !== '' ? pktMsg + '\n' : '';
  }
  // console.log('msg=', msg);
  await sendTransferMsg(orderId, msg, msgHtml, roomId);
}

export async function createOrder(
  {
    fromAddress,
    checkedToken,
    checkedNft,
    balanceType,
    roomId,
    pktMsg,
    toAddress,
    toPeople
  }: {
    fromAddress: string;
    checkedToken: TokenSelector[];
    checkedNft: NftSelector[];
    balanceType: number;
    roomId?: string;
    pktMsg?: string;
    toAddress: string;
    toPeople?: any;
  },
  accessToken: string | undefined
): Promise<Response> {
  const authUserInfo = getAuthUserInfo();
  const tokens: any = [];
  const checkedTokenList = checkedToken.filter((o) => o.value && Number(o.value) > 0);
  for (let token of checkedTokenList) {
    // console.log('to push token: ', token);
    tokens.push({
      type: isNativeToken(token.address) ? 0 : 1,
      tokenAddress: token.address,
      tokenSymbol: token.symbol,
      tokenId: token.address,
      tokenIcon: token.icon,
      tokenAmount: token.value,
      tokenDecimal: token.decimals
    });
  }
  for (let nft of checkedNft) {
    tokens.push({
      type: nft.type == 1 ? 2 : 3,
      tokenAddress: nft.contractAddress,
      tokenSymbol: nft.collection,
      tokenId: nft.id,
      tokenIcon: nft.icon,
      tokenAmount: Number(nft.balance || '1'),
      tokenDecimal: 0
    });
  }
  let needReceive = true;
  if (balanceType === 2) {
    needReceive = false;
  } else {
    if (history.location.query?.paycode && history.location.query?.spd?.toString() === '1') {
      needReceive = false;
    } else {
      needReceive = true;
    }
  }

  const recordData: any = {
    accessToken: accessToken,
    chainId: checkedTokenList?.length > 0 ? checkedTokenList?.[0]?.chainId : checkedNft?.[0]?.chainId,
    roomId: roomId && roomId !== '' ? roomId : '',
    message: pktMsg,
    makerAddress: fromAddress,
    makerUserId: authUserInfo?.id,
    makerUserName: authUserInfo?.name,
    makerUserImage: authUserInfo?.avatar,
    receivers: [
      {
        receiverAddress: toAddress,
        receiverUserId: toPeople?.id ?? toPeople?.userId,
        receiverUserName: toPeople?.name,
        receiverUserImage: toPeople?.icon,
        tokens
      }
    ],
    imAccessToken: authUserInfo?.token,
    spd: balanceType === 1 ? true : false,
    needReceive
  };
  if (history.location.query?.returnId && !isArray(history.location.query?.returnId)) {
    recordData.originId = history.location.query?.returnId;
  }
  return await createInitRecord(recordData);
}

export async function roomNotification({ sentUser, toPeople }: { sentUser: any; toPeople: any }, roomId: string) {
  // xxx has rejected/accepted the Transfer from xxx
  console.log('roomNotification');
  const sourceType = checkSourceType();
  TransferAccessService.sendEvent(roomId, {
    body: `has returned the Transfer from ${sentUser?.name ?? toPeople?.name}`,
    icon: LINX_AUTH_INFO.redirectUri + '/logo_icon.png',
    link: `${LINX_AUTH_INFO.redirectUri}/order?id=${history.location.query?.returnId}&roomId=${roomId}${
      sourceType === 'SDN' ? '&st=sdn' : ''
    }`,
    link_text: 'Transfer'
  });
}

export function getMultiAssetsFunc(
  {
    checkedToken,
    checkedNft,
    fromAddress,
    toAddress
  }: {
    checkedToken: TokenSelector[];
    checkedNft: NftSelector[];
    fromAddress: string;
    toAddress: string;
  },
  ethWeb3: any,
  gasPriceCon: any
) {
  const service = new EthContractService(ethWeb3);
  // wallet
  // 2. send
  const checkedTokenList = checkedToken.filter((o) => o.value && Number(o.value) > 0);
  // const calls: any[] = [];
  const contractParams = {
    tokens: [],
    recipients: [],
    amountsOrTokenIds: []
  };
  let ethWei;
  let func;
  if (checkedTokenList?.length > 1) {
    for (let token of checkedTokenList) {
      let value = token.value ? Number(token.value) : 0;
      let amount = getTokenBigNumberAmount(value, token.decimals);
      contractParams?.tokens.push(token?.address);
      contractParams?.recipients.push(toAddress);
      contractParams?.amountsOrTokenIds.push(amount);
      // let hexValue = getTokenHexValue(value, token);
      // calls.push(getTokenCallObj(token, fromAddress, toAddress, hexValue));
      if (isNativeToken(token.address)) {
        ethWei = getTokenHexValue(value, token);
      }
    }
    console.log('getMultiAssetsFunc', contractParams);
    // batchTransfer(address[] tokens, address[] recipients, uint256[] amounts)
    func = service
      .TransferContract(gasPriceCon, checkedTokenList?.[0]?.chainId)
      ?.methods?.batchTransfer(contractParams?.tokens, contractParams?.recipients, contractParams?.amountsOrTokenIds);
  }
  if (checkedNft?.length > 1) {
    for (let nft of checkedNft) {
      // console.log('nft=', nft);
      let amount = ethWeb3.utils.BN(nft.id);
      contractParams?.tokens.push(nft?.contractAddress);
      contractParams?.recipients.push(toAddress);
      contractParams?.amountsOrTokenIds.push(amount);

      // let amountHex;
      // if (BigNumber.isBigNumber(amount)) {
      //   amountHex = amount._hex;
      // } else {
      //   amountHex = Web3Utils.toHex(amount);
      // }
      // calls.push({
      //   target: nft.contractAddress,
      //   callData: '0x42842e0e' + toData64(fromAddress) + toData64(toAddress) + toData64(amountHex + '')
      // });
    }
    // batchTransferERC721(address[] tokens, address[] recipients, uint256[] tokenIds)
    func = service
      .TransferContract(gasPriceCon, checkedNft?.[0]?.chainId)
      ?.methods?.batchTransferERC721(
        contractParams?.tokens,
        contractParams?.recipients,
        contractParams?.amountsOrTokenIds
      );
  }
  // console.log('length=', calls?.length, checkedTokenList?.[0]?.chainId);
  // let func = service.TransferContract(gasPriceCon, checkedTokenList?.[0]?.chainId).methods.transfer(calls);
  return {
    func,
    ethWei
  };
}

export async function handleTransaction(
  { func, ethWei, chainId, fromAddress }: { func: any; ethWei?: any; chainId?: number; fromAddress: string },
  accessToken: string,
  createResp: Response,
  onError: any,
  onSuccess: any
) {
  let txId = '';
  let gasLimit;
  try {
    gasLimit = await EthWeb3Service.estimateGas(
      func,
      ethWei && ethWei !== '' ? ethWei : BigNumber.from(0),
      () => {},
      fromAddress
    );
  } catch (error) {
    const errorMsg = getContractErrorMsg(error);
    onError(errorMsg);
  }
  // console.log('handleTransaction-gasLimit', fromAddress, func, gasLimit);
  func
    .send({
      from: fromAddress,
      value: ethWei,
      gas: gasLimit && !isNaN(gasLimit) ? gasLimit : undefined
    })
    .on('transactionHash', (hash: any) => {
      console.log('transfer: hash=' + hash);
      txId = hash;
      updateOrder(createResp, accessToken, chainId, hash);
    })
    .on('error', (e: any) => {
      const errorMsg = getContractErrorMsg(e);
      onError(errorMsg);
    })
    .on('receipt', () => {
      finishOrder(createResp, accessToken, chainId, txId, () => {
        onSuccess(createResp.result?.id);
      });
    });
}

export async function sendMsgMulti(
  {
    orderId,
    tokenSymbol,
    balanceType,
    amountType,
    descTitle,
    tokenAmount,
    members,
    participants
  }: {
    orderId: number;
    tokenSymbol: string;
    balanceType: number;
    amountType: number;
    descTitle: string;
    tokenAmount: any;
    members: any;
    participants: any;
  },
  roomId: string
) {
  let msg = '';
  let msgHtml = '';
  const data = amountType === 1 ? filter(members, (o) => o?.isChecked) : filter(participants, (o) => o.value > 0);
  if (amountType === 2) {
    // speci
    msg +=
      balanceType === 2
        ? `I sent ${tokenSymbol} to your wallet \n`
        : `I am going to send ${tokenSymbol} to your spending accounts, please accept \n`;
    msgHtml = msg;
    for (const item of data) {
      msg += `@${item?.name} ${item?.value} ${tokenSymbol} \n`;
      msgHtml += `<a href=\"${LINX_WEB_URL}/#/user/${item?.userId}\">@${item?.name}</a> ${item?.value} ${tokenSymbol} \n`;
    }
  } else {
    // equal
    msg +=
      balanceType === 2
        ? `I sent ${tokenAmount} ${tokenSymbol} to each of your wallet \n`
        : `I am going to send ${tokenAmount} ${tokenSymbol} to your spending accounts, please accept \n`;
    msgHtml = msg;
    for (const item of data) {
      msg += `@${item?.name} `;
      msgHtml += `<a href=\"${LINX_WEB_URL}/#/user/${item?.userId}\">@${item?.name}</a> `;
    }
    msg += ` \n`;
    msgHtml += ` \n`;
  }
  msg += ` ${descTitle && descTitle !== '' ? descTitle + '\n' : ''}`;
  msgHtml += ` ${descTitle && descTitle !== '' ? descTitle + '\n' : ''}`;
  // console.log('msg=', msg);
  await sendTransferMsg(orderId, msg, msgHtml, roomId);
}
