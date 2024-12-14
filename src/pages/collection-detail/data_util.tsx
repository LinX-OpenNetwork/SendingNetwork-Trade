import { LINX_WEB_URL, SHARE_URL, LINX_AUTH_INFO, ENV } from '@/constants';
import { Toast } from 'antd-mobile';
import {
  TokenDataService_geERC20TokenBalance,
  TokenDataService_getTokenPrice,
  getTokenBigNumberAmount,
  EthWeb3Service,
  EthContractService,
  getDefaultTokenAndValue,
  TokenDataService_getTokenMetadataPrice,
  getSpendingBalanceByAddress,
  startNotice
} from '@/services';
import { TokenInfo, TokenSelector } from '@/types';
import {
  getChainRpc,
  MathUtil_minus,
  MathUtil_plus,
  MathUtil_numberFixed,
  CheckCircleFilledIcon,
  getToken,
  checkSourceType,
  isNativeToken
} from '@/utils';
import Web3 from 'web3';
import { concat, find, findIndex, flatMap, groupBy, orderBy } from 'lodash';
import { message } from 'antd';

export async function sendMsg(orderInfo: any) {
  if (!orderInfo?.roomId || orderInfo?.roomId === '') return;
  const sourceType = checkSourceType();
  let msg = '';
  let msgHtml = '';
  for (const selectedMember of orderInfo?.payDetails) {
    if (selectedMember.status != 3) {
      msg += '@' + selectedMember.userName + ' ';
      msgHtml += `<a href=\"${LINX_WEB_URL}/#/user/${selectedMember?.userId}\">@${selectedMember.userName}</a> `;
    }
  }
  msg += 'You have an unpaid split bill ';
  msgHtml += 'You have an unpaid split bill ';
  const shareUrl = `${SHARE_URL}/collection-detail?id=${orderInfo?.id}${sourceType === 'SDN' ? '&st=sdn' : ''}`;
  TransferAccessService.shareToRoom(
    [
      {
        body: '💰 ' + msg + '\n' + shareUrl,
        msgtype: 'm.text',
        format: 'org.matrix.custom.html',
        formatted_body: '💰 ' + msgHtml + '\n' + shareUrl
      }
    ],
    orderInfo?.roomId,
    false,
    () => {
      Toast.show({
        content: (
          <div className="toast_info">
            {CheckCircleFilledIcon}
            Message reminders have been sent
          </div>
        ),
        maskClassName: 'base_toast_mask'
      });
    },
    () => {}
  );
}

export async function sendNotification(orderInfo: any) {
  const accessToken = getToken();
  const res = await startNotice(orderInfo.id, accessToken);
  if (res && res?.success) {
    Toast.show({
      content: (
        <div className="toast_info">
          {CheckCircleFilledIcon}
          Notification reminders have been sent
        </div>
      ),
      maskClassName: 'base_toast_mask'
    });
  } else {
    message.error(res?.errorMsg || 'Notification reminder failed');
  }
}

export async function roomNotification(orderInfo: any, isOver?: boolean) {
  // console.log('roomNotification');
  const sourceType = checkSourceType();
  TransferAccessService.sendEvent(orderInfo?.roomId, {
    body: `has ${isOver ? 'paid off' : 'partially paid'} the Split Bill from ${orderInfo?.userName}`,
    icon: LINX_AUTH_INFO.redirectUri + '/logo_icon.png',
    link: `${LINX_AUTH_INFO.redirectUri}/collection-detail?id=${orderInfo?.id}${sourceType === 'SDN' ? '&st=sdn' : ''}`,
    link_text: 'Split Bill'
  });
}

export async function getOwnerUsdTokens(usdTokens: any, ownerAddress: string) {
  // console.log('getOwnerUsdTokens', usdTokens, ownerAddress);
  let payUsdTokens: TokenInfo[] = [];
  for (let item of usdTokens) {
    let itemObj: TokenInfo = {
      symbol: item?.tokenSymbol,
      address: item?.tokenAddress,
      name: item?.tokenName,
      icon: item?.tokenIcon,
      decimals: item?.tokenDecimal,
      balanceType: 2,
      chainId: item?.chainId
    };
    if (itemObj?.address && itemObj?.chainId) {
      const balanceValueRes = await TokenDataService_geERC20TokenBalance(
        ownerAddress,
        itemObj?.address,
        itemObj?.chainId
      ).catch();
      const priceRes = await TokenDataService_getTokenPrice(itemObj?.address, itemObj?.chainId);
      payUsdTokens.push({
        ...itemObj,
        balanceValue: balanceValueRes ? Number(balanceValueRes) : undefined,
        price: priceRes
      });
    }
  }

  return payUsdTokens;
}

export async function getTokenIsApprove(token: TokenSelector, fromAddress: string) {
  if (!token?.chainId) return;
  const rpcUrl = getChainRpc(token?.chainId);
  const ethWeb3Temp: any = new Web3(new Web3.providers.HttpProvider(rpcUrl));
  const service = new EthContractService(ethWeb3Temp);
  let amount = getTokenBigNumberAmount(Number(token.value), token.decimals);
  let needsApproveRes: boolean;
  if (!isNativeToken(token?.address)) {
    needsApproveRes = await EthWeb3Service.needsApprove(
      service,
      1,
      token?.address,
      amount,
      fromAddress,
      token?.chainId
    );
    console.log('needsApproveRes1=', needsApproveRes);
  } else {
    needsApproveRes = false;
    console.log('needsApproveRes2=', needsApproveRes);
  }

  return needsApproveRes;
}

export async function getOtherPayToken(orderInfo: any, ownerAddress: string) {
  let payTokenTemp: TokenSelector | undefined = undefined;
  if (isNativeToken(orderInfo?.tokenAddress)) {
    const defaultToken = await getDefaultTokenAndValue(
      { chainId: orderInfo?.chainId, publicKey: ownerAddress },
      false,
      true,
      true
    );
    payTokenTemp = { ...defaultToken, id: defaultToken?.address, isChecked: true };
  } else {
    const tokenRes = await TokenDataService_getTokenMetadataPrice(orderInfo?.tokenAddress, orderInfo?.chainId, 2);
    if (tokenRes) {
      const spendingValueRes = await getSpendingBalanceByAddress(orderInfo?.tokenAddress, orderInfo?.chainId);
      const balanceValueRes = await TokenDataService_geERC20TokenBalance(
        ownerAddress,
        orderInfo?.tokenAddress,
        orderInfo?.chainId
      );
      payTokenTemp = {
        ...tokenRes,
        id: orderInfo?.tokenAddress,
        isChecked: true,
        spendingValue: spendingValueRes,
        balanceValue: balanceValueRes
      };
    }
  }

  return payTokenTemp;
}

export function getUSDPayTokensByChain({ spendingTokenList, receiveInfo, billUsdTokenList }, chainIdParam: number) {
  let spdTokensTemp: TokenSelector[] = [];
  let walletTokensTemp: TokenSelector[] = [];
  const notPaid = receiveInfo?.notPaid;
  let diffPayAmount: number = notPaid;
  // from spd
  let spdList = spendingTokenList?.filter((o: any) => o.spendingValue > 0 && o?.chainId === chainIdParam);
  if (receiveInfo?.spd && spdList?.length > 0) {
    spdList = orderBy(spdList, 'spendingValue', 'desc');
    for (let item of spdList) {
      if (diffPayAmount > 0) {
        const obj = find(billUsdTokenList, (o) => o?.address?.toUpperCase() === item?.address?.toUpperCase());
        if (obj && item?.spendingValue) {
          if (diffPayAmount <= item?.spendingValue) {
            spdTokensTemp.push({ ...item, id: item?.address, isChecked: true, balanceType: 1, value: diffPayAmount });
            diffPayAmount = 0;
          } else {
            spdTokensTemp.push({
              ...item,
              id: item?.address,
              isChecked: true,
              balanceType: 1,
              value: item?.spendingValue
            });
            diffPayAmount = MathUtil_minus(diffPayAmount, item?.spendingValue);
          }
        }
      } else {
        break;
      }
    }
  }
  // only spd
  if (diffPayAmount === 0) {
    return {
      diffPayAmount: 0,
      walletTokensTemp: [],
      spdTokensTemp
    };
  }
  billUsdTokenList = orderBy(
    billUsdTokenList?.filter((o: any) => o?.chainId === chainIdParam),
    'balanceValue',
    'desc'
  );
  // from wallet only one token
  const oneRes = getUSDPayTokens_isOnlyOne(billUsdTokenList, notPaid);
  if (oneRes?.diffAmount === 0) {
    return {
      diffPayAmount: 0,
      walletTokensTemp: oneRes?.tokensTemp,
      spdTokensTemp: []
    };
  }
  // from wallet multi tokens
  const multiRes = getUSDPayTokens_isMulti(billUsdTokenList, notPaid);
  if (multiRes?.diffAmount === 0) {
    return {
      diffPayAmount: 0,
      walletTokensTemp: multiRes?.tokensTemp,
      spdTokensTemp: []
    };
  }
  // SPD > Wallet: multi chain multi tokens
  const multiChainRes = getUSDPayTokens_isMulti(billUsdTokenList, diffPayAmount);
  diffPayAmount = multiChainRes?.diffAmount;
  walletTokensTemp = multiChainRes?.tokensTemp;

  return { diffPayAmount, walletTokensTemp, spdTokensTemp };
}

export function getUSDPayTokens({ spendingTokenList, receiveInfo, billUsdTokenList }: any, chainIdParam: number) {
  if (chainIdParam) {
    return getUSDPayTokensByChain({ spendingTokenList, receiveInfo, billUsdTokenList }, chainIdParam);
  } else {
    let spdTokensTemp: TokenSelector[] = [];
    let walletTokensTemp: TokenSelector[] = [];
    const notPaid = receiveInfo?.notPaid;
    let diffPayAmount: number = notPaid;
    /**** spd > Polygon > BNB > Arbitrum ****/
    // from spd
    let spdList = spendingTokenList?.filter((o: any) => o.spendingValue > 0);
    if (receiveInfo?.spd && spdList?.length > 0) {
      spdList = orderBy(spdList, 'spendingValue', 'desc');
      for (let item of spdList) {
        if (diffPayAmount > 0) {
          const obj = find(billUsdTokenList, (o) => o?.address?.toUpperCase() === item?.address?.toUpperCase());
          if (obj && item?.spendingValue) {
            if (diffPayAmount <= item?.spendingValue) {
              spdTokensTemp.push({ ...item, id: item?.address, isChecked: true, balanceType: 1, value: diffPayAmount });
              diffPayAmount = 0;
            } else {
              spdTokensTemp.push({
                ...item,
                id: item?.address,
                isChecked: true,
                balanceType: 1,
                value: item?.spendingValue
              });
              diffPayAmount = MathUtil_minus(diffPayAmount, item?.spendingValue);
            }
          }
        } else {
          break;
        }
      }
    }
    if (diffPayAmount === 0) {
      return {
        diffPayAmount: 0,
        walletTokensTemp: [],
        spdTokensTemp
      };
    }
    // from wallet
    const listByChainIds = groupBy(
      billUsdTokenList?.filter((o: any) => o?.balanceValue && o?.balanceValue > 0),
      'chainId'
    );
    // mulit chains
    // Polygon > BNB > Arbitrum : only one token balanceValue > diffPayAmount
    const pbaOneRes = getUSDPayTokens_isOnlyOneToken(
      listByChainIds,
      notPaid,
      ENV === 'test' ? [80002, 97, 421614] : [137, 56, 42161]
    );
    if (pbaOneRes?.diffAmount === 0) {
      return {
        diffPayAmount: 0,
        walletTokensTemp: pbaOneRes?.tokensTemp,
        spdTokensTemp: []
      };
    }
    // Polygon > BNB > Arbitrum: one chain multi tokens
    const pbaMultiRes = getUSDPayTokens_isMultiToken(
      listByChainIds,
      notPaid,
      ENV === 'test' ? [80002, 97, 421614] : [137, 56, 42161]
    );
    if (pbaMultiRes?.diffAmount === 0) {
      return {
        diffPayAmount: 0,
        walletTokensTemp: pbaMultiRes?.tokensTemp,
        spdTokensTemp: []
      };
    }
    // Polygon > BNB > Arbitrum: multi chain multi tokens
    // order by balanceValue multi
    const pbaMultiRes1 = getUSDPayTokens_isMultiChainToken(
      listByChainIds,
      diffPayAmount,
      ENV === 'test' ? [80002, 97, 421614] : [137, 56, 42161]
    );
    if (pbaMultiRes1?.diffAmount === 0) {
      return {
        diffPayAmount: 0,
        walletTokensTemp: pbaMultiRes1?.tokensTemp,
        spdTokensTemp
      };
    }

    /**** Spd > Polygon > BNB > Arbitrum ****/

    // Ethereum: only one token
    if (diffPayAmount > 0) {
      const ethOneRes = getUSDPayTokens_isOnlyOneToken(listByChainIds, notPaid, ENV === 'test' ? [11155111] : [1]);
      console.log('getUSDPayTokens-eth-onetoken', ethOneRes?.diffAmount, ethOneRes);
      if (ethOneRes?.diffAmount === 0) {
        return {
          diffPayAmount: 0,
          walletTokensTemp: ethOneRes?.tokensTemp,
          spdTokensTemp: []
        };
      }
    }
    // Ethereum : multi tokens
    if (diffPayAmount > 0) {
      const ethMultiRes = getUSDPayTokens_isMultiToken(listByChainIds, notPaid, ENV === 'test' ? [11155111] : [1]);
      console.log('getUSDPayTokens-eth-multitoken', ethMultiRes?.diffAmount, ethMultiRes);
      if (ethMultiRes?.diffAmount === 0) {
        return {
          diffPayAmount: 0,
          walletTokensTemp: ethMultiRes?.tokensTemp,
          spdTokensTemp: []
        };
      }
    }
    // SPD & Polygon & BNB & Arbitrum & Ethereum: multi tokens
    if (diffPayAmount > 0) {
      const allMultiRes = getUSDPayTokens_isMultiChainToken(
        listByChainIds,
        diffPayAmount,
        ENV === 'test' ? [80002, 97, 421614, 11155111] : [137, 56, 42161, 1]
      );
      console.log('getUSDPayTokens-allchain-multitoken', allMultiRes?.diffAmount, allMultiRes);
      walletTokensTemp = allMultiRes?.tokensTemp;
      diffPayAmount = allMultiRes?.diffAmount;
    }
    // TODO other account

    return { diffPayAmount, walletTokensTemp, spdTokensTemp };
  }
}

function getUSDPayTokens_isOnlyOneToken(listByChainIds: any, diffAmountParam: number, chains: number[]) {
  let tokensTemp: any;
  let diffAmount = diffAmountParam;
  for (let chainIdItem of chains) {
    tokensTemp = [];
    const listByChain = orderBy(listByChainIds?.[chainIdItem], 'balanceValue', 'desc');
    const res = getUSDPayTokens_isOnlyOne(listByChain, diffAmount);
    diffAmount = res?.diffAmount;
    tokensTemp = res?.tokensTemp;
    if (diffAmount <= 0) {
      break;
    }
  }

  return { diffAmount, tokensTemp };
}

function getUSDPayTokens_isMultiToken(listByChainIds: any, diffAmountParam: number, chains: number[]) {
  let tokensTemp: any = [];
  let diffAmount = diffAmountParam;
  for (let chainIdKey of chains) {
    const listByChain = orderBy(listByChainIds?.[chainIdKey], 'balanceValue', 'desc');
    const res = getUSDPayTokens_isMulti(listByChain, diffAmount);
    diffAmount = res?.diffAmount;
    tokensTemp = res?.tokensTemp;
    if (diffAmount <= 0) {
      break;
    }
  }

  return { diffAmount, tokensTemp };
}

function getUSDPayTokens_isMultiChainToken(listByChainIds: any, diffAmountParam: number, chains: number[]) {
  let tokensTemp: any = [];
  let diffAmount = diffAmountParam;
  let list: any = [];
  for (let chainIdKey of chains) {
    if (listByChainIds?.[chainIdKey]) {
      list = concat(list, listByChainIds?.[chainIdKey]);
    }
  }
  list = orderBy(list, 'balanceValue', 'desc');
  let listChains: number[] = [];
  list.forEach((item: any) => {
    if (listChains.indexOf(item?.chainId) < 0) {
      listChains.push(item?.chainId);
    }
  });
  // console.log('getUSDPayTokens_isMultiChainToken', listChains);
  for (let chainIdKey of listChains) {
    const listByChain = listByChainIds?.[chainIdKey];
    for (let chainItem of listByChain) {
      if (diffAmount > 0) {
        if (chainItem?.balanceValue >= diffAmount) {
          tokensTemp.push({
            ...chainItem,
            id: chainItem?.address,
            isChecked: true,
            balanceType: 2,
            value: diffAmount
          });
          diffAmount = 0;
          break;
        } else {
          tokensTemp.push({
            ...chainItem,
            id: chainItem?.address,
            isChecked: true,
            balanceType: 2,
            value: chainItem?.balanceValue
          });
          diffAmount = MathUtil_minus(diffAmount, chainItem?.balanceValue);
        }
      } else {
        break;
      }
    }
  }

  return { diffAmount, tokensTemp };
}

function getUSDPayTokens_isOnlyOne(tokenList: any, paidAmount: number) {
  // only one token
  let tokensTemp: any = [];
  let diffAmount;
  for (let tokenItem of tokenList) {
    if (tokenItem?.balanceValue >= paidAmount) {
      tokensTemp = [
        {
          ...tokenItem,
          id: tokenItem?.address,
          isChecked: true,
          balanceType: 2,
          value: paidAmount
        }
      ];
      diffAmount = 0;
      break;
    }
  }

  return { tokensTemp, diffAmount };
}

function getUSDPayTokens_isMulti(tokenList: any, paidAmount: number) {
  let tokensTemp: any = [];
  let diffAmount = paidAmount;
  for (let tokenItem of tokenList) {
    if (diffAmount > 0) {
      if (tokenItem?.balanceValue >= diffAmount) {
        tokensTemp.push({
          ...tokenItem,
          id: tokenItem?.address,
          isChecked: true,
          balanceType: 2,
          value: diffAmount
        });
        diffAmount = 0;
        break;
      } else {
        tokensTemp.push({
          ...tokenItem,
          id: tokenItem?.address,
          isChecked: true,
          balanceType: 2,
          value: tokenItem?.balanceValue
        });
        diffAmount = MathUtil_minus(diffAmount, tokenItem?.balanceValue);
      }
    } else {
      break;
    }
  }

  return { diffAmount, tokensTemp };
}

export function getTokensFiterChain(walletTokens: any, chainIdKey: string) {
  let chainTokens: any = [];
  const walletTokensByChain = groupBy(walletTokens, 'chainId');
  const tokensFiterChain = walletTokensByChain?.[chainIdKey];
  tokensFiterChain?.forEach((tokenItem: TokenSelector) => {
    chainTokens.push({
      tokenAddress: tokenItem?.address,
      tokenSymbol: tokenItem?.symbol,
      tokenIcon: tokenItem?.icon,
      tokenAmount: tokenItem?.value,
      spd: false,
      chainId: chainIdKey
    });
  });

  return chainTokens;
}

export function getProcess(payUsdTokens: any) {
  let process: any = {};
  if (payUsdTokens?.spdTokens?.length > 0) {
    process._spd = { id: 'spdTokens', type: 'spdTokens', status: 1, tokens: payUsdTokens?.spdTokens };
  }
  if (payUsdTokens?.walletTokens?.length > 0) {
    const walletTokensByChain = groupBy(payUsdTokens?.walletTokens, 'chainId');
    for (let chainIdKey of Object.keys(walletTokensByChain)) {
      process = {
        ...process,
        ['_' + chainIdKey]: {
          id: chainIdKey + '-walletTokens',
          type: 'walletTokens',
          status: 1,
          tokens: walletTokensByChain[chainIdKey]
        }
      };
    }
  }

  return process;
}

export function getPayTokens(payUsdTokens: any, isInsuffGas: any) {
  let data: any = [];
  payUsdTokens?.walletTokens?.forEach((item: TokenSelector) => {
    if (item?.chainId && !isInsuffGas?.[item?.chainId]) {
      data.push(item);
    }
  });

  return {
    ...payUsdTokens,
    walletTokens: data
  };
}

export function getSelectedUsdTokens(usdTokenList: any, usdIdsArray: string[]) {
  const data: any = [];
  (usdTokenList || [])?.forEach((item: any) => {
    if (usdIdsArray?.indexOf(item?.id + '') >= 0) {
      data.push({
        tokenSymbol: item?.symbol,
        tokenAddress: item?.address,
        tokenName: item?.name,
        tokenIcon: item?.icon,
        tokenDecimal: item?.decimals,
        balanceType: 2,
        chainId: item?.chainId
      });
    }
  });

  return data;
}

export function getPriceBalance(payUsdTokens: any) {
  const allTokenLength = flatMap(payUsdTokens)?.length;
  let isSpdExpand = true;
  let spdTotal: number = 0;
  payUsdTokens?.spdTokens?.forEach((item: TokenSelector) => {
    if (item?.price && item?.value) {
      let itemPriceBalance = MathUtil_numberFixed(Number(item?.price) * Number(item?.value), 4);
      if (itemPriceBalance) {
        spdTotal = MathUtil_plus(spdTotal, Number(item?.price) * Number(item?.value));
      }
    }
  });
  if (allTokenLength > 3 && payUsdTokens?.spdTokens?.length > 2) {
    isSpdExpand = false;
  }
  let isWalletExpand = true;
  let walletTotal: number = 0;
  payUsdTokens?.walletTokens?.forEach((item: TokenSelector) => {
    if (item?.price && item?.value) {
      let itemPriceBalance = MathUtil_numberFixed(Number(item?.price) * Number(item?.value), 4);
      if (itemPriceBalance) {
        walletTotal = MathUtil_plus(walletTotal, itemPriceBalance);
      }
    }
  });
  if (allTokenLength > 3 && payUsdTokens?.walletTokens?.length > 2) {
    isWalletExpand = false;
  }

  return {
    isSpdExpand,
    spdTotal,
    isWalletExpand,
    walletTotal
  };
}

export function getShortSwapUSDToken(payUsdTokens: any, billTokens: any, shortNumber: number) {
  const chains = ENV === 'test' ? [80002, 97, 421614, 11155111] : [137, 56, 42161, 1];
  const payTokenGroupByChains = groupBy(payUsdTokens?.walletTokens, 'chainId');
  const payTokenChains = Object.keys(payTokenGroupByChains);
  const billTokenGroupByChains = groupBy(billTokens, 'chainId');
  let inputToken;
  let outputToken;
  let outputAmount = shortNumber;
  // method a
  // get inputToken: Polygon>BNB>Arbitrum>Ethereum(in payUsdTokens chains), not in payUsdTokens, balanceValue > shortNumber
  // get outputToken: payUsdTokens in inputToken's chainId max balanceValue
  for (let chainKeyStr of chains) {
    let chainKey = chainKeyStr + '';
    if (payTokenChains?.indexOf(chainKey + '') >= 0) {
      const billTokenByChain = orderBy(billTokenGroupByChains[chainKey], 'balanceValue', 'desc');
      for (let billChainItem of billTokenByChain) {
        if (
          billChainItem?.balanceValue &&
          billChainItem?.balanceValue > shortNumber &&
          findIndex(payTokenGroupByChains[chainKey], { address: billChainItem?.address }) < 0
        ) {
          inputToken = billChainItem;
          break;
        }
      }
    } else {
      continue;
    }
  }
  if (inputToken) {
    outputToken = orderBy(payTokenGroupByChains[inputToken?.chainId + ''], 'balanceValue', 'desc')[0];
    return {
      inputToken,
      outputToken,
      outputAmount
    };
  }
  // method b
  // get inputToken: Polygon>BNB>Arbitrum>Ethereum(not in payUsdTokens chains), not in payUsdTokens, balanceValue > shortNumber
  // get outputToken: payUsdTokens in inputToken's chainId
  for (let chainKeyStr of chains) {
    let chainKey = chainKeyStr + '';
    if (payTokenChains?.indexOf(chainKey + '') < 0) {
      const billTokenByChain = orderBy(billTokenGroupByChains[chainKey], 'balanceValue', 'desc');
      for (let billChainItem of billTokenByChain) {
        if (
          billChainItem?.balanceValue &&
          billChainItem?.balanceValue > shortNumber &&
          findIndex(payTokenGroupByChains[chainKey], { address: billChainItem?.address }) < 0
        ) {
          inputToken = billChainItem;
          break;
        }
      }
    } else {
      continue;
    }
  }
  if (inputToken) {
    outputToken = payTokenGroupByChains[inputToken?.chainId + ''][0];
    return {
      inputToken,
      outputToken,
      outputAmount
    };
  }

  return {
    inputToken,
    outputToken,
    outputAmount
  };
}
