import {
  getToken,
  getAuthUserInfo,
  getChainRpc,
  getGasPriceValue,
  useUrlParams,
  getLocalUserInfo,
  isNativeToken
} from '@/utils';
import {
  getReceiveOrder,
  TokenDataService_getERC20TokenFromChainByAddress,
  getDefaultToken,
  Assets_getBillUsdTokenList,
  EthContractService,
  getTokenBigNumberAmount,
  EthWeb3Service,
  queryReceivedUsd,
  TokenDataService_getTokenPrice
} from '@/services';
import { message } from 'antd';
import { useColDetailStore } from './store';
import { useEffect } from 'react';
import { history } from 'umi';
import { isArray, findIndex, groupBy, find } from 'lodash';
import { useDispatch, useSelector } from 'dva';
import { UNKNOWN_TOKEN_IMG, WALLET_CHAIN_CONFIG } from '@/constants';
import { getSelectedUsdTokens, getTokenIsApprove } from './data_util';
import Web3 from 'web3';
import Web3Utils from 'web3-utils';
import { useMultiWallet } from '@/lib/wallet-selector';

export const useCollectionDetail = () => {
  const dispatch = useDispatch();
  const { ethWeb3 } = useMultiWallet();
  const { authedAccountInfo } = useSelector((state: any) => state.store);
  const { billUsdTokenList, assetsPublicKey, usdTokenList, assetsDefaultToken } = useSelector(
    (state: any) => state.assets
  );
  const orderId = useUrlParams().get('id');

  const orderInfo = useColDetailStore((state) => state.orderInfo);
  const isRecever = useColDetailStore((state) => state.isRecever);
  const isMaker = useColDetailStore((state) => state.isMaker);
  const receiveInfo = useColDetailStore((state) => state.receiveInfo);
  const payUsdTokens = useColDetailStore((state) => state.payUsdTokens);
  const gasLoadings = useColDetailStore((state) => state.gasLoadings);
  const balanceType = useColDetailStore((state) => state.balanceType);

  const updateState = useColDetailStore((state) => state.updateState);

  let gasLoadingsTemp: any = {};
  let isInsuffGasTemp: any = {};
  let gasFeesTemp: any = {};

  async function getOrderInfo(orderId: string) {
    try {
      const accessToken = getToken();
      if (!accessToken) return;
      updateState({ loading: true });
      const res = await getReceiveOrder(orderId, accessToken);
      if (res && res.success && res.result) {
        updateReceiveMaker(res.result);
      } else {
        message.error(res.errorMsg);
        return;
      }
    } catch (error) {
    } finally {
      updateState({ loading: false });
    }
  }

  async function getPaymentOrderInfo() {
    const queryParams = history.location.query;
    const chainIdParam = queryParams?.chainId;
    const spdParam = queryParams?.spd;
    const amountParam = queryParams?.amount;
    const tokenAddressParam = queryParams?.token;
    const tokenSymbolParam = queryParams?.symbol;
    const userAddressParam = queryParams?.address;
    const userIdParam = queryParams?.userId;
    const usdIdsParam = queryParams?.usdIds;
    const msgParam = queryParams?.msg;
    if (queryParams?.token === 'USD' && usdTokenList?.length <= 0) {
      return;
    }
    updateState({ loading: true });
    let userRes;
    if (userIdParam && !isArray(userIdParam)) {
      userRes = await TransferAccessService.getUserProfile(decodeURIComponent(userIdParam))?.catch(() => {});
    }
    let tokenRes: any;
    if (tokenAddressParam && !isArray(tokenAddressParam) && chainIdParam && !isArray(chainIdParam)) {
      const tokenAddress = tokenAddressParam?.toString();
      if (isNativeToken(tokenAddress)) {
        tokenRes = getDefaultToken({ chainId: Number(chainIdParam) });
      } else if (tokenAddress !== 'USD') {
        tokenRes = await TokenDataService_getERC20TokenFromChainByAddress(tokenAddress, Number(chainIdParam));
      }
    }
    const userInfo = getAuthUserInfo();
    let orderInfoTemp: any = {
      chainId: chainIdParam ? Number(chainIdParam) : 0,
      title: msgParam ?? '',
      message: 'From Payment Code',
      type: 2,
      userId: userIdParam?.toString(),
      userName: userRes?.name,
      userImage: userRes?.avatar,
      userAddress: userAddressParam?.toString(),
      tokenAddress: tokenAddressParam?.toString(),
      tokenSymbol: tokenSymbolParam?.toString(),
      tokenIcon: tokenRes?.icon ?? UNKNOWN_TOKEN_IMG,
      tokenDecimal: tokenRes?.decimals,
      amount: amountParam ? Number(amountParam) : 0,
      currAmount: 0,
      currCount: 0,
      totalCount: 1,
      payDetails: [
        {
          amount: amountParam ? Number(amountParam) : 0,
          notPaid: amountParam ? Number(amountParam) : 0,
          paid: 0,
          spd: spdParam?.toString() === '1' ? true : false,
          status: 0,
          userAddress: userInfo?.address,
          userId: userInfo?.id,
          userImage: userInfo?.avatar,
          userName: userInfo?.name
        }
      ],
      status: 0,
      payAmount: amountParam ? Number(amountParam) : 0,
      spd: spdParam?.toString() === '1' ? true : false
    };
    if (orderInfoTemp?.tokenAddress === 'USD' && usdIdsParam && !isArray(usdIdsParam)) {
      const selectedUSDList = getSelectedUsdTokens(usdTokenList, usdIdsParam.split(','));
      orderInfoTemp = {
        ...orderInfoTemp,
        usdIds: usdIdsParam,
        usdTokens: selectedUSDList
      };
    }
    updateReceiveMaker(orderInfoTemp);
  }

  async function dispatchUsdTokenList() {
    if (
      !orderInfo ||
      !isRecever ||
      !authedAccountInfo?.publicKey ||
      [0, 4].indexOf(receiveInfo?.status) < 0 ||
      orderInfo?.tokenAddress !== 'USD' ||
      orderInfo?.usdTokens?.length <= 0
    ) {
      return;
    }
    const usdTokens = orderInfo?.usdTokens;
    if (assetsPublicKey?.toUpperCase() === authedAccountInfo?.publicKey?.toUpperCase()) {
      if (billUsdTokenList?.length > 0) return;
    }
    Assets_getBillUsdTokenList(usdTokens, authedAccountInfo?.publicKey, dispatch);
  }

  async function getFeeDetailByChain() {
    const accountAddress = authedAccountInfo?.publicKey;
    const toAddress = orderInfo?.receiverAddress ?? orderInfo?.userAddress;
    if (!accountAddress || !toAddress || [0, 4].indexOf(receiveInfo?.status) < 0) {
      updateState({ gasFees: null });
      return;
    }

    const walletTokensByChain = groupBy(payUsdTokens?.walletTokens, 'chainId');
    for (let chainIdKey of Object.keys(walletTokensByChain)) {
      const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId: Number(chainIdKey) })?.chainAssetsType;
      const assetsDefault = chainAssetsType ? assetsDefaultToken?.[chainAssetsType] : undefined;
      if (assetsDefault && assetsDefault?.balanceValue !== undefined && assetsDefault?.balanceValue <= 0) {
        isInsuffGasTemp![chainIdKey] = true;
        // continue;
      }
      updateState({ gasLoadings: { ...gasLoadings, [chainIdKey]: true } });
      try {
        const rpcUrl = getChainRpc(Number(chainIdKey));
        const ethWeb3Temp: any = new Web3(new Web3.providers.HttpProvider(rpcUrl));
        const gasPriceCon = await ethWeb3Temp.eth.getGasPrice();
        const tokens = walletTokensByChain?.[chainIdKey];
        const service = new EthContractService(ethWeb3Temp);
        // console.log('getFeeDetailByChain', tokens, chainIdKey);
        if (tokens?.length > 1) {
          getMultiFeeDetail(
            { tokens: tokens, chainIdKey, accountAddress, toAddress },
            { gasPriceCon, Contract: service }
          );
        } else {
          getOneTokenFeeDetail(
            { tokens: tokens, chainIdKey, accountAddress, toAddress, pktTotalAmount: tokens?.[0]?.value },
            { ethWeb3Temp, gasPriceCon, service }
          );
        }
      } catch (error) {
        console.log('getFeeDetail-collection', error);
        updateState({ gasLoadings: { ...gasLoadings, [chainIdKey]: false } });
        gasFeesTemp![chainIdKey] = undefined;
        isInsuffGasTemp![chainIdKey] = false;
        updateGasTemp();
      }
    }
  }

  async function getMultiFeeDetail(
    { tokens, chainIdKey, accountAddress, toAddress }: any,
    { gasPriceCon, Contract }: any
  ) {
    // only erc20
    // is need approve--start
    let approveRes = [];
    // const calls: any = [];
    const contractParams = {
      tokens: [],
      recipients: [],
      amountsOrTokenIds: []
    };
    for (let token of tokens) {
      let amount = getTokenBigNumberAmount(Number(token.value), token.decimals);
      contractParams?.tokens.push(token?.address);
      contractParams?.recipients.push(toAddress);
      contractParams?.amountsOrTokenIds.push(amount);
      // let hexValue = getTokenHexValue(Number(token.value), token);
      // calls.push(getTokenCallObj(token, accountAddress, toAddress, hexValue));
      let needsApproveRes: boolean | undefined = false;
      needsApproveRes = await getTokenIsApprove(token, accountAddress);
      if (needsApproveRes) {
        approveRes.push(needsApproveRes);
      }
    }
    console.log('getMultiFeeDetail-needsApproveRes', approveRes);
    // is need approve--end
    if (approveRes?.length <= 0) {
      // const contractFunc = Contract.TransferContract(gasPriceCon).methods.transfer(calls);
      const contractFunc = Contract.TransferContract(gasPriceCon).methods.batchTransfer(
        contractParams?.tokens,
        contractParams?.recipients,
        contractParams?.amountsOrTokenIds
      );
      // console.log('estimateGasValue', estimateGasValue);
      await getGasLimit(contractFunc, accountAddress, gasPriceCon, chainIdKey);
    } else {
      updateState({ gasLoadings: { ...gasLoadings, [chainIdKey]: false } });
      gasLoadingsTemp = {
        ...gasLoadingsTemp,
        [chainIdKey]: false
      };
      gasFeesTemp = {
        ...gasFeesTemp,
        chainIdKey: -1
      };
      isInsuffGasTemp = {
        ...isInsuffGasTemp,
        [chainIdKey]: false
      };
      updateGasTemp();
    }
  }

  async function getOneTokenFeeDetail(
    { tokens, chainIdKey, accountAddress, toAddress, pktTotalAmount }: any,
    { ethWeb3Temp, gasPriceCon, service }: any
  ) {
    // console.log('getOneTokenFeeDetail', tokens?.length, new Date());
    const token = tokens[0];
    if (isNativeToken(token?.address)) {
      // default token
      let amount = Web3Utils.toBN((pktTotalAmount * 10 ** 18).toFixed(0));
      const gasPriceValue = getGasPriceValue(gasPriceCon, chainIdKey);
      const message = {
        from: accountAddress,
        to: toAddress,
        value: Web3Utils.toHex(amount),
        gasPrice: gasPriceValue
      };
      await getGasLimit(undefined, accountAddress, gasPriceCon, chainIdKey, true, ethWeb3Temp, message);
    } else {
      //erc20
      const decimals: string = await service.ERC20(token?.address).methods.decimals().call();
      const tokenDecimals = Number(decimals);
      let amount = getTokenBigNumberAmount(pktTotalAmount, tokenDecimals);
      const contractFunc = service
        .ERC20(token?.address, gasPriceCon, Number(chainIdKey))
        .methods.transfer(toAddress, amount);
      await getGasLimit(contractFunc, accountAddress, gasPriceCon, Number(chainIdKey));
    }
  }

  async function getGasLimit(
    contractFunc: any,
    accountAddress: string,
    gasPriceCon: any,
    chainIdKey: number,
    ethWei?: any,
    ethWeb3Temp?: any,
    ethWeiMsg?: any
  ) {
    let gasLimit;
    let gasError = false;
    if (ethWei) {
      gasLimit =
        (await ethWeb3Temp.eth.estimateGas(ethWeiMsg).catch((e: any) => {
          gasError = true;
          console.log('getFeeDetail-gasLimit-error', e);
          if (
            e?.message?.indexOf('insufficient funds') >= 0 ||
            e?.message?.indexOf('gas required exceeds allowance') >= 0
          ) {
            isInsuffGasTemp = {
              ...isInsuffGasTemp,
              [chainIdKey]: true
            };
          } else {
            isInsuffGasTemp = {
              ...isInsuffGasTemp,
              [chainIdKey]: false
            };
          }
          updateState({ gasLoadings: { ...gasLoadings, [chainIdKey]: false } });
          gasLoadingsTemp = {
            ...gasLoadingsTemp,
            [chainIdKey]: false
          };
        })) * 1.2;
    } else {
      gasLimit = await EthWeb3Service.estimateGas(
        contractFunc,
        0,
        (e: any) => {
          gasError = true;
          console.log('getGasLimit-gasLimit-error', e);
          if (
            e?.message?.indexOf('insufficient funds') >= 0 ||
            e?.message?.indexOf('gas required exceeds allowance') >= 0
          ) {
            isInsuffGasTemp = {
              ...isInsuffGasTemp,
              [chainIdKey]: true
            };
          } else {
            isInsuffGasTemp = {
              ...isInsuffGasTemp,
              [chainIdKey]: false
            };
          }
          updateState({ gasLoadings: { ...gasLoadings, [chainIdKey]: false } });
          gasLoadingsTemp = {
            ...gasLoadingsTemp,
            [chainIdKey]: false
          };
        },
        accountAddress
      );
    }
    updateState({ gasLoadings: { ...gasLoadings, [chainIdKey]: false } });
    gasLoadingsTemp = {
      ...gasLoadingsTemp,
      [chainIdKey]: false
    };
    // console.log('gasLimit-chainIdKey', chainIdKey, gasLimit);
    if (!gasLimit || isNaN(gasLimit)) {
      gasFeesTemp = {
        ...gasFeesTemp,
        [chainIdKey]: undefined
      };
      if (!gasError)
        isInsuffGasTemp = {
          ...isInsuffGasTemp,
          [chainIdKey]: false
        };
    } else {
      const gasPriceConEther: any = Web3Utils.fromWei(gasPriceCon, 'ether');
      const gas = gasLimit * gasPriceConEther;
      gasFeesTemp = {
        ...gasFeesTemp,
        [chainIdKey]: gas
      };
      isInsuffGasTemp = {
        ...isInsuffGasTemp,
        [chainIdKey]: false
      };
    }
    updateGasTemp();
  }

  async function getFeeDetail() {
    console.log('getFeeDetail');
    const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId: orderInfo?.chainId })?.chainAssetsType;
    const assetsDefault = chainAssetsType ? assetsDefaultToken?.[chainAssetsType] : undefined;
    const accountAddress = authedAccountInfo?.publicKey;
    const toAddress = orderInfo?.receiverAddress ?? orderInfo?.userAddress;
    if (!accountAddress || !toAddress || [0, 4].indexOf(receiveInfo?.status) < 0) {
      updateState({ gasFees: null });
      return;
    }
    if (assetsDefault && assetsDefault?.balanceValue && assetsDefault?.balanceValue <= 0) {
      isInsuffGasTemp = {
        ...isInsuffGasTemp,
        [orderInfo?.chainId]: true
      };
    }
    updateState({ gasLoadings: { [orderInfo?.chainId]: true } });
    try {
      const rpcUrl = getChainRpc(orderInfo?.chainId);
      const ethWeb3Temp: any = new Web3(new Web3.providers.HttpProvider(rpcUrl));
      const gasPriceCon = await ethWeb3Temp.eth.getGasPrice();
      const service = new EthContractService(ethWeb3Temp);
      getOneTokenFeeDetail(
        {
          tokens: [{ address: orderInfo?.tokenAddress }],
          chainIdKey: orderInfo?.chainId,
          accountAddress,
          toAddress,
          pktTotalAmount: orderInfo?.payAmount
        },
        { ethWeb3Temp, gasPriceCon, service }
      );
    } catch (error) {
      console.log('getFeeDetail-collection', error);
      updateState({ gasLoadings: { ...gasLoadings, [orderInfo?.chainId]: false } });
      gasLoadingsTemp = {
        ...gasLoadingsTemp,
        [orderInfo?.chainId]: false
      };
      gasFeesTemp = {
        ...gasFeesTemp,
        [orderInfo?.chainId]: undefined
      };
      isInsuffGasTemp = {
        ...isInsuffGasTemp,
        [orderInfo?.chainId]: false
      };
      updateGasTemp();
    }
  }

  function updateGasTemp() {
    updateState({
      isInsuffGas: isInsuffGasTemp,
      gasFees: gasFeesTemp,
      gasLoadings: gasLoadingsTemp
    });
  }

  async function getMakerReceived(id: string) {
    const accessToken = getToken();
    updateState({ makerReceivedLoading: true });
    const res = await queryReceivedUsd({ accessToken, id }).finally(() => {
      updateState({ makerReceivedLoading: false });
    });
    if (res && res?.success) {
      let listTemp: any = [];
      res?.result?.forEach((item: any) => {
        if (item?.tokenAddress !== 'USD') {
          let itemObj: any = {
            name: item?.tokenName,
            symbol: item?.tokenName,
            address: item?.tokenAddress,
            icon: item?.tokenIcon,
            spd: item?.spd,
            chainId: item?.chainId,
            balanceType: 1,
            spendingValue: item?.amount,
            price: undefined
          };
          listTemp.push(itemObj);
        }
      });
      updateState({ makerReceivedList: listTemp });
      listTemp?.forEach(async (item: any) => {
        const priceRes = await TokenDataService_getTokenPrice(item?.address, item?.chainId);
        item = {
          ...item,
          price: priceRes
        };
      });
      updateState({ makerReceivedList: listTemp.slice() });
    }
  }

  function updateReceiveMaker(result: any) {
    const userInfo = getAuthUserInfo();
    const receIndex = findIndex(result?.payDetails, {
      userId: userInfo?.id
    });
    const localUserInfo = getLocalUserInfo();
    updateState({
      loading: false,
      orderInfo: result,
      isRecever: receIndex >= 0 ? true : false,
      receiveInfo: receIndex >= 0 ? result?.payDetails?.[receIndex] : undefined,
      isMaker: localUserInfo?.id === result?.createUserId,
      isPaymentCode: result?.message === 'From Payment Code' ? true : false
    });
  }

  // getOrderInfo getPaymentOrderInfo
  useEffect(() => {
    if (orderId) {
      if (orderId !== 'paymentcode') {
        getOrderInfo(orderId);
      }
    } else {
      message.error('id error');
      updateState({ loading: false });
      return;
    }
  }, [getToken()]);

  // getPaymentOrderInfo
  useEffect(() => {
    if (orderId === 'paymentcode') {
      getPaymentOrderInfo();
    }
  }, [usdTokenList?.length]);

  // dispath usd
  useEffect(() => {
    dispatchUsdTokenList();
  }, [JSON.stringify(orderInfo), isRecever, authedAccountInfo?.publicKey?.toUpperCase()]);

  // usd gas fee
  useEffect(() => {
    if (orderInfo?.tokenAddress === 'USD' && payUsdTokens?.walletTokens?.length > 0) {
      getFeeDetailByChain();
    }
  }, [orderInfo?.userAddress, orderInfo?.tokenAddress, authedAccountInfo?.publicKey, payUsdTokens?.walletTokens]);

  // other gas fee
  useEffect(() => {
    if (orderInfo?.tokenAddress !== 'USD') {
      if (balanceType === 2) {
        getFeeDetail();
      } else {
        updateState({ isInsuffGas: null, gasFees: null, gasLoadings: null });
      }
    }
  }, [
    orderInfo?.userAddress,
    orderInfo?.tokenAddress,
    authedAccountInfo?.publicKey,
    ethWeb3,
    balanceType,
    receiveInfo
  ]);

  useEffect(() => {
    if (orderInfo?.id && isMaker) {
      getMakerReceived(orderInfo?.id);
    }
  }, [orderInfo?.id, isMaker]);

  return { getOrderInfo };
};
