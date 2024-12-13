import { getToken, getAuthUserInfo, toConnectWallet, getHistoryUrl, MathUtil_plus } from '@/utils';
import { getReceiveOrder, createReceiveOrder } from '@/services';
import { message } from 'antd';
import { useColDetailStore, useUsdDetailStore } from './store';
import { useEffect } from 'react';
import { history } from 'umi';
import { groupBy, find, cloneDeep, flatMap, orderBy, concat } from 'lodash';
import { useDispatch, useSelector } from 'dva';
import { ENV } from '@/constants';
import { getShortSwapUSDToken, getPayTokens, getProcess, getPriceBalance, getUSDPayTokens } from './data_util';
import { useMultiWallet } from '@/lib/wallet-selector';
import { TokenSelector } from '@/types';

export const useUsdDetail = () => {
  const dispatch = useDispatch();
  const { currentWallet, onSelectConnectWallet } = useMultiWallet();
  const { authedAccountInfo } = useSelector((state: any) => state.store);
  const {
    spendingTokenList,
    billUsdTokenLoading,
    assetsDefaultToken,
    billUsdTokenList,
    ethTokenList,
    polygonTokenList,
    arbitrumTokenList,
    bnbTokenList
  } = useSelector((state: any) => state.assets);

  const orderInfo = useColDetailStore((state) => state.orderInfo);
  const isInsuffGas = useColDetailStore((state) => state.isInsuffGas);
  const payUsdTokens = useColDetailStore((state) => state.payUsdTokens);
  const payUsdTokensLoading = useColDetailStore((state) => state.payUsdTokensLoading);
  const shortUsd = useColDetailStore((state) => state.shortUsd);
  const isRecever = useColDetailStore((state) => state.isRecever);
  const receiveInfo = useColDetailStore((state) => state.receiveInfo);
  const updateState = useColDetailStore((state) => state.updateState);

  const isCustom = useUsdDetailStore((state) => state.isCustom);
  const checkedToken = useUsdDetailStore((state) => state.checkedToken);
  const payUsdTotal = useUsdDetailStore((state) => state.payUsdTotal);
  const updateUsdState = useUsdDetailStore((state) => state.updateUsdState);

  function setTokenSelectorVisible(value: boolean) {
    dispatch({
      type: 'store/setTokenSelectorVisible',
      payload: value
    });
  }

  function onTokenChangeOne(type: string, index: number, key: string, value?: any) {
    // console.log('onChangeOne', checkedToken, index, key);
    let listTemp = cloneDeep(checkedToken?.[type]);
    let item = listTemp[index];
    if (key === 'isChecked') {
      if (!item.value || item.value === '' || Number(item.value) <= 0) {
        message.error(`The value cannot be empty, please input`);
        return;
      }
      if (Number(item.value) > Number(item.balanceValue)) {
        message.error(`You don't have enough ${item.symbol}`);
        return;
      }
      // @ts-ignore
      item[key] = value;
      updateUsdState({ checkedToken: { ...checkedToken, [type]: listTemp } });
    } else if (key === 'token') {
      listTemp[index] = {
        ...value,
        value: item?.value
      };
      updateUsdState({ checkedToken: { ...checkedToken, [type]: listTemp.slice() } });
    } else if (key === 'delete') {
      //console.log('delete', listTemp.splice(index, 1));
      listTemp.splice(index, 1);
      updateUsdState({ checkedToken: { ...checkedToken, [type]: listTemp } });
    } else {
      // @ts-ignore
      item[key] = value;
      updateUsdState({ checkedToken: { ...checkedToken, [type]: listTemp } });
    }
    updateUsdState({ sltIndex: undefined });
  }

  function onComfirm() {
    if (payUsdTokens?.walletTokens?.length > 0 && !currentWallet?.publicKey) {
      toConnectWallet(dispatch, { connectWallet: onSelectConnectWallet });
      return;
    }
    const fromAddress = authedAccountInfo?.publicKey;
    const toAddress = orderInfo?.receiverAddress ?? orderInfo?.userAddress;
    if (fromAddress.toLowerCase() == toAddress.toLowerCase()) {
      message.error('The payment address cannot be the same as the payment address');
      return;
    }
    updateState({ confirmVisible: true });
  }

  async function createPaymentOrder() {
    const imUserInfo = getAuthUserInfo();
    const accessToken = getToken();
    if (!accessToken) return;
    updateUsdState({ confirmLoading: true });
    const imAccessToken = imUserInfo?.token;
    let recordData: any = {
      accessToken,
      chainId: orderInfo?.chainId,
      title: orderInfo?.title,
      message: 'From Payment Code',
      receiverAddress: orderInfo?.userAddress,
      receiverUserId: orderInfo?.userId,
      receiverUserName: orderInfo?.userName,
      receiverUserImage: orderInfo?.userImage,
      type: 2,
      totalAmount: orderInfo?.amount,
      unitAmount: orderInfo?.amount,
      tokenAddress: orderInfo?.tokenAddress,
      tokenSymbol: orderInfo?.tokenSymbol,
      tokenIcon: orderInfo?.tokenIcon,
      tokenDecimal: orderInfo?.tokenDecimal,
      totalCount: 1,
      makers: [
        {
          makerAddress: imUserInfo?.address,
          makerUserId: imUserInfo?.id,
          makerUserName: imUserInfo?.name,
          makerUserImage: imUserInfo?.avatar,
          tokenAmount: orderInfo?.amount
        }
      ],
      imAccessToken,
      spd: orderInfo?.spd,
      usdIds: orderInfo?.usdIds
    };
    const res = await createReceiveOrder(recordData);
    console.log('createPaymentOrder', res);
    if (res && res?.success) {
      history.replace(
        getHistoryUrl(history?.location?.pathname + '?id=' + res?.result, [
          'id',
          'userId',
          'paycode',
          'spd',
          'address',
          'chainId',
          'token',
          'symbol',
          'amount',
          'usdIds',
          'msg'
        ])
      );
      const orderRes = await getReceiveOrder(res?.result, accessToken);
      if (orderRes && orderRes.success && orderRes.result) {
        updateState({
          orderInfo: orderRes.result,
          receiveInfo: orderInfo?.payDetails?.[0],
          isPaymentCode: true
        });
        updateUsdState({ confirmLoading: false });
        onComfirm();
      } else {
        updateUsdState({ confirmLoading: false });
        message.error(orderRes?.errorMsg ?? 'Query payment order error');
      }
    } else {
      updateUsdState({ confirmLoading: false });
      message.error(res?.errorMsg ?? 'Create payment order error');
    }
  }

  function updateConfirmBtn() {
    let allGroupLength = 0;
    if (checkedToken?.spdTokens?.length > 0) {
      allGroupLength += 1;
    }
    if (checkedToken?.walletTokens?.length > 0) {
      allGroupLength += Object.keys(groupBy(checkedToken?.walletTokens, 'chainId'))?.length;
    }
    let isInsuffGasLength = 0;
    if (Object.keys(isInsuffGas)?.length > 0) {
      for (let insufChain of Object.keys(isInsuffGas)) {
        if (isInsuffGas[insufChain] === true) {
          isInsuffGasLength += 1;
        }
      }
    }
    if (
      allGroupLength <= isInsuffGasLength ||
      (payUsdTotal && (payUsdTotal <= 0 || payUsdTotal > orderInfo?.payAmount)) ||
      isCustom ||
      (checkedToken?.spdTokens?.length === 0 && checkedToken?.walletTokens?.length === 0)
    ) {
      updateUsdState({ confirmDisabled: true });
    } else {
      updateUsdState({ confirmDisabled: false });
    }
  }

  function getBuyUSDToken() {
    // LINXSW-2968
    let buyTokenTemp;
    let walletList = billUsdTokenList;
    let buyChainId = authedAccountInfo?.chainId;
    if (authedAccountInfo?.chainId === 0) {
      const tokenChains = Object.keys(groupBy(payUsdTokens?.walletTokens, 'chainId'));
      const assetsDefaultTokenTemp: any = [];
      if (tokenChains?.length > 0) {
        tokenChains?.forEach((chainIdItem) => {
          assetsDefaultTokenTemp.push(find(flatMap(assetsDefaultToken), { chainId: Number(chainIdItem) }));
        });
      } else {
        Object.keys(groupBy(billUsdTokenList, 'chainId'))?.forEach((chainIdItem) => {
          assetsDefaultTokenTemp.push(find(flatMap(assetsDefaultToken), { chainId: Number(chainIdItem) }));
        });
      }
      if (assetsDefaultTokenTemp?.filter((o: any) => o?.balanceValue && Number(o?.balanceValue) > 0)?.length > 0) {
        // defaultToken balanceValue max
        const orderedDefaultTokenTemp: any = orderBy(assetsDefaultTokenTemp, 'balanceValue', 'desc');
        buyChainId = orderedDefaultTokenTemp?.[0]?.chainId;
      } else {
        // all defaultToken balanceValue = 0;
        // Polygon > BNB > Arbitrum > ETH
        for (let chainIdItem of ENV === 'test' ? [80002, 97, 421614, 11155111] : [137, 56, 42161, 1]) {
          if (assetsDefaultTokenTemp?.filter((o: any) => o?.chainId === chainIdItem)?.length > 0) {
            buyChainId = chainIdItem;
            break;
          }
        }
      }
    }
    walletList = orderBy(
      walletList?.filter((o: any) => o?.chainId === buyChainId),
      'balanceValue',
      'desc'
    );
    if (walletList?.length <= 0) {
      walletList = billUsdTokenList;
    }
    buyTokenTemp = walletList?.[0];
    console.log('getBuyUSDToken', buyChainId, walletList, buyTokenTemp);
    dispatch({
      type: 'store/setBuyToken',
      payload: { buyToken: buyTokenTemp, buyTokenList: walletList }
    });
  }

  function getSwapUSDToken() {
    // LINXSW-2976
    if (shortUsd) {
      const all = concat(ethTokenList, polygonTokenList, arbitrumTokenList, bnbTokenList);
      const { inputToken, outputToken, outputAmount } = getShortSwapUSDToken(checkedToken, all, shortUsd);
      console.log('getSwapUSDToken', inputToken, outputToken, outputAmount);
      dispatch({
        type: 'store/setSwapToken',
        payload: {
          inputToken,
          outputToken,
          outputAmount
        }
      });
    }
  }

  function getTotalUsd() {
    let payAmount: number = 0;
    checkedToken?.spdTokens?.forEach((item: TokenSelector) => {
      if (item?.value) {
        payAmount = MathUtil_plus(payAmount, item?.value);
      }
    });
    checkedToken?.walletTokens?.forEach((item: TokenSelector) => {
      if (item?.chainId && !isInsuffGas?.[item?.chainId]) {
        if (item?.value) {
          payAmount = MathUtil_plus(payAmount, item?.value);
        }
      }
    });
    updateUsdState({
      payUsdTotal: payAmount
    });
  }

  function getPayUsdTokenList() {
    if (!isRecever || billUsdTokenList?.length <= 0 || [0, 4].indexOf(receiveInfo?.status) < 0) {
      return;
    }
    // console.log('getPayUsdTokenList', authedAccountInfo?.chainId);
    updateState({ payUsdTokensLoading: true });
    const { diffPayAmount, walletTokensTemp, spdTokensTemp } = getUSDPayTokens(
      {
        spendingTokenList,
        receiveInfo,
        billUsdTokenList
      },
      authedAccountInfo?.chainId
    );
    // console.log('getPayUsdTokenList', walletTokensTemp, spdTokensTemp);
    updateState({
      payUsdTokensLoading: false,
      shortUsd: diffPayAmount,
      payUsdTokens: {
        spdTokens: spdTokensTemp,
        walletTokens: walletTokensTemp
      }
    });
  }

  // usdPayToken
  useEffect(() => {
    getPayUsdTokenList();
  }, [
    JSON.stringify(billUsdTokenList),
    isRecever,
    receiveInfo?.status,
    receiveInfo?.spd,
    receiveInfo?.notPaid,
    spendingTokenList?.length,
    authedAccountInfo?.chainId,
    authedAccountInfo?.publicKey?.toUpperCase()
  ]);

  useEffect(() => {
    if (payUsdTokensLoading || billUsdTokenLoading) {
    } else {
      updateUsdState({ checkedToken: payUsdTokens, isCustom: false });
    }
  }, [payUsdTokensLoading, billUsdTokenLoading, payUsdTokens]);

  useEffect(() => {
    updateConfirmBtn();
  }, [
    isInsuffGas,
    payUsdTotal,
    isCustom,
    orderInfo?.payAmount,
    checkedToken?.spdTokens?.length,
    checkedToken?.walletTokens?.length
  ]);

  useEffect(() => {
    const payTokensTemp = getPayTokens(payUsdTokens, isInsuffGas);
    updateState({ confirmedPayTokens: payTokensTemp });
    // console.log('payTokensTemp', payTokensTemp);
    const process = getProcess(payTokensTemp);
    updateState({ processList: process, processIndex: 0 });
  }, [JSON.stringify(payUsdTokens), JSON.stringify(isInsuffGas)]);

  useEffect(() => {
    const { isSpdExpand, spdTotal, isWalletExpand, walletTotal } = getPriceBalance(payUsdTokens);
    updateUsdState({ checkedAttr: { isSpdExpand, spdTotal, isWalletExpand, walletTotal } });
  }, [JSON.stringify(payUsdTokens)]);

  useEffect(() => {
    if (orderInfo?.tokenAddress === 'USD') {
      getTotalUsd();
    }
  }, [orderInfo?.tokenAddress, checkedToken?.walletTokens, checkedToken?.spdTokens, JSON.stringify(isInsuffGas)]);

  return {
    setTokenSelectorVisible,
    onTokenChangeOne,
    createPaymentOrder,
    getBuyUSDToken,
    onComfirm
  };
};
