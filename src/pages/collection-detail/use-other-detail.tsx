import {
  getToken,
  getAuthUserInfo,
  getGasPriceValue,
  toConnectWallet,
  getHistoryUrl,
  getContractErrorMsg,
  MathUtil_minus,
  isNativeToken
} from '@/utils';
import {
  getReceiveOrder,
  EthContractService,
  getTokenBigNumberAmount,
  EthWeb3Service,
  createReceiveOrder
} from '@/services';
import { message } from 'antd';
import { useColDetailStore, useOtherDetailStore } from './store';
import { useEffect } from 'react';
import { history } from 'umi';
import { find } from 'lodash';
import { useDispatch, useSelector } from 'dva';
import { WALLET_CHAIN_CONFIG } from '@/constants';
import { roomNotification, getOtherPayToken } from './data_util';
import { useMultiWallet } from '@/lib/wallet-selector';
import { finishOrder, updateOrder, updateOrderFromSpd } from '@/pages/collection/collection-util';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { useCreateContext } from '@/pages/collection-detail';

export const useOtherDetail = () => {
  const dispatch = useDispatch();
  const { authedAccountInfo } = useSelector((state: any) => state.store);
  const { assetsDefaultToken } = useSelector((state: any) => state.assets);
  const { currentWallet, ethWeb3, switchChain, onSelectConnectWallet } = useMultiWallet();
  const { getOrderInfo } = useCreateContext();
  const isMobile = getPlatformInfo()?.isMobile;
  const isPc = getPlatformInfo()?.isPc;

  const orderInfo = useColDetailStore((state) => state.orderInfo);
  const balanceType = useColDetailStore((state) => state.balanceType);
  const isWalletInsuff = useColDetailStore((state) => state.isWalletInsuff);
  const isSpdInsuff = useColDetailStore((state) => state.isSpdInsuff);
  const leavingMsg = useColDetailStore((state) => state.leavingMsg);
  const isRecever = useColDetailStore((state) => state.isRecever);
  const receiveInfo = useColDetailStore((state) => state.receiveInfo);
  const updateState = useColDetailStore((state) => state.updateState);

  const updateOtherState = useOtherDetailStore((state) => state.updateOtherState);

  async function createPaymentOrder() {
    const imUserInfo = getAuthUserInfo();
    const accessToken = getToken();
    if (!accessToken) return;
    updateOtherState({ confirmLoading: true });
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
          makerUserName: imUserInfo?.name ?? imUserInfo?.address,
          makerUserImage: imUserInfo?.avatar,
          tokenAmount: orderInfo?.amount
        }
      ],
      imAccessToken,
      spd: orderInfo?.spd
    };
    const res = await createReceiveOrder(recordData);
    console.log('createPaymentOrder', res, recordData);
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
        updateState({ orderInfo: orderRes.result, receiveInfo: orderInfo?.payDetails?.[0] });
        updateOtherState({ confirmLoading: false });
        updateState({
          isPaymentCode: true
        });
        onConfirmClick(orderRes.result);
      } else {
        updateOtherState({ confirmLoading: false });
        message.error(orderRes?.errorMsg ?? 'Query payment order error');
      }
    } else {
      updateOtherState({ confirmLoading: false });
      message.error(res?.errorMsg ?? 'Create payment order error');
    }
  }

  // pay other (not usd)
  async function onConfirmClick(orderInfoParam?: any) {
    const orderInfoTemp = orderInfoParam ? orderInfoParam : orderInfo;
    if (orderInfoTemp?.spd) {
      if (isSpdInsuff === false && isWalletInsuff === false) {
        updateOtherState({ paymentVisible: true });
      } else {
        if (isSpdInsuff === false) {
          onConfirm();
        } else if (isWalletInsuff === false) {
          onConfirm();
        }
      }
    } else {
      if (!currentWallet?.chainId) {
        toConnectWallet(dispatch, { connectWallet: onSelectConnectWallet });
      } else if (currentWallet?.chainId !== orderInfoTemp?.chainId) {
        switchChain(orderInfoTemp?.chainId, onConfirm, (e: any) => {
          // console.log('xxx', e);
          failed(e);
        });
      } else {
        onConfirm(orderInfoTemp);
      }
    }
  }

  // pay other (not usd)
  async function onConfirm(orderInfoParam?: any) {
    const orderInfoTemp = orderInfoParam ? orderInfoParam : orderInfo;
    console.log('onConfirm', balanceType, orderInfoTemp);
    const accessToken = getToken();
    if (!accessToken || !orderInfoTemp?.id) return;
    const toAddress = orderInfoTemp?.receiverAddress ?? orderInfoTemp?.userAddress;
    if (!toAddress) {
      message.error('To address is empty');
      return;
    }
    if (balanceType && balanceType === 1) {
      // spending
      updateState({
        createBtnLoading: true
      });
      const spdRes = await updateOrderFromSpd(orderInfoTemp?.historyId, accessToken, leavingMsg);
      if (spdRes && spdRes?.success && spdRes?.result?.amount !== 0) {
        afterSuccess();
      } else {
        message.error(spdRes?.errorMsg || 'Pay failed');
        failed();
      }
    } else {
      let fromAddress = currentWallet?.publicKey;
      if (!fromAddress) {
        toConnectWallet(dispatch, { isRecoAccount: true, connectWallet: onSelectConnectWallet });
        return;
      }
      if (isPc && currentWallet?.chainId != orderInfoTemp?.chainId) {
        message.info('Inconsistent chain, Please switch');
        switchChain(orderInfoTemp?.chainId);
        return;
      }
      if (fromAddress.toLowerCase() == toAddress.toLowerCase()) {
        message.error('The payment address cannot be the same as the payment address');
        return;
      }
      // wallet
      transfer(orderInfoTemp);
    }
  }

  // pay other (not usd)
  async function transfer(orderInfoParam?: any) {
    const orderInfoTemp = orderInfoParam ? orderInfoParam : orderInfo;
    const id = orderInfoTemp?.historyId;
    // console.log('token info: ', token);
    let pktTotalAmount = Number(orderInfoTemp.payAmount);
    const toAddress = orderInfoTemp?.receiverAddress ?? orderInfoTemp?.userAddress;
    const accessToken = getToken();
    if (!accessToken) return;
    if (!orderInfoTemp.tokenAddress || !pktTotalAmount || pktTotalAmount < 0.0001) {
      message.error('token amount error!');
      return;
    }
    const fromAddress = currentWallet?.publicKey;
    const fromChainId = currentWallet?.chainId;
    if (!fromAddress) {
      toConnectWallet(dispatch, { isRecoAccount: true, connectWallet: onSelectConnectWallet });
      return;
    }
    // loading
    updateState({
      createBtnLoading: true
    });
    const gasPriceCon = await ethWeb3.eth.getGasPrice();
    const service = new EthContractService(ethWeb3);
    if (isNativeToken(orderInfoTemp.tokenAddress)) {
      const amount = getTokenBigNumberAmount(pktTotalAmount, 18);
      const gasPriceValue = getGasPriceValue(gasPriceCon, fromAddress);
      const message = {
        from: fromAddress,
        to: toAddress,
        value: amount,
        gasPrice: gasPriceValue
      };

      let txId = '';
      const gasLimit =
        (await ethWeb3.eth.estimateGas(message).catch((e: any) => {
          console.log('transfer-gasLimit-error', e);
        })) * 1.2;
      console.log('transfer-gasLimit', fromAddress, gasLimit);
      if (!isNaN(gasLimit)) {
        await ethWeb3.eth.sendTransaction({ ...message, gas: gasLimit }, (err: any, hash: any) => {
          if (!err) {
            txId = hash;
            console.log('txId=', txId);
            updateOrder(id, accessToken, fromChainId, hash, leavingMsg, fromAddress);
          } else {
            failed(err);
          }
        });

        let receipt = await ethWeb3.eth.getTransactionReceipt(txId);
        while (!receipt) {
          setTimeout(function () {
            receipt = ethWeb3.eth.getTransactionReceipt(txId);
          }, 1000);
        }

        updateState({
          leavingMsg: ''
        });
        finishOrder(id, accessToken, fromChainId, txId, () => {
          afterSuccess(orderInfoTemp);
        });
      }
    } else {
      const tokenDecimals: any = await service.ERC20(orderInfoTemp?.tokenAddress).methods.decimals().call();
      const amount = getTokenBigNumberAmount(pktTotalAmount, tokenDecimals);
      const func = service
        .ERC20(orderInfoTemp.tokenAddress, gasPriceCon, fromChainId)
        .methods.transfer(toAddress, amount);
      let txId = '';
      const gasLimit = await EthWeb3Service.estimateGas(func, 0, () => {}, fromAddress);
      console.log('transfer-gasLimit', fromAddress, gasLimit);
      if (!isNaN(gasLimit)) {
        func
          .send({
            from: fromAddress,
            gas: gasLimit
          })
          .on('transactionHash', (hash: any) => {
            console.log('transfer: hash=' + hash);
            txId = hash;
            updateOrder(id, accessToken, fromChainId, hash, leavingMsg, fromAddress);
          })
          .on('error', (e: any) => {
            failed(e);
          })
          .on('receipt', () => {
            updateState({
              leavingMsg: ''
            });
            console.log('txId_finish=', txId);
            finishOrder(id, accessToken, fromChainId, txId, () => {
              afterSuccess(orderInfoTemp);
            });
          });
      }
    }
  }

  function afterSuccess(orderInfoParam?: any) {
    console.log('finished payment', orderInfoParam);
    const orderInfoTemp = orderInfoParam ? orderInfoParam : orderInfo;
    if (orderInfoTemp?.message !== 'From Payment Code') {
      roomNotification(orderInfoTemp, true);
    }
    updateState({
      createBtnLoading: false
    });
    updateOtherState({ paymentVisible: false });
    getOrderInfo(orderInfoTemp?.id);
  }

  function failed(err?: any) {
    updateState({
      createBtnLoading: false
    });
    if (err) {
      const msg = getContractErrorMsg(err);
      if (isMobile && (msg === 'User rejected the transaction' || msg === 'User rejected the request')) {
      } else {
        message.error(msg);
      }
    }
  }

  async function getPayOtherToken() {
    if (
      !orderInfo ||
      !isRecever ||
      !orderInfo?.tokenAddress ||
      !authedAccountInfo?.publicKey ||
      [0, 4].indexOf(receiveInfo?.status) < 0 ||
      orderInfo?.tokenAddress === 'USD'
    ) {
      return;
    }
    const payTokenTemp = await getOtherPayToken(orderInfo, authedAccountInfo?.publicKey);
    if (payTokenTemp) {
      if (orderInfo?.spd) {
        if (payTokenTemp?.balanceValue !== undefined && orderInfo?.payAmount <= payTokenTemp?.balanceValue) {
          payTokenTemp.balanceType = 2;
          payTokenTemp.value = orderInfo?.payAmount;
          updateState({ isWalletInsuff: false });
        } else {
          updateState({
            isWalletInsuff: true,
            shortUsd: MathUtil_minus(orderInfo?.payAmount, payTokenTemp?.balanceValue ?? 0)
          });
        }
        if (payTokenTemp?.spendingValue !== undefined && orderInfo?.payAmount <= payTokenTemp?.spendingValue) {
          payTokenTemp.balanceType = 1;
          payTokenTemp.value = orderInfo?.payAmount;
          updateState({ isSpdInsuff: false, balanceType: 1 });
        } else {
          updateState({ isSpdInsuff: true, balanceType: 2 });
        }
      } else {
        updateState({ balanceType: 2 });
        payTokenTemp.balanceType = 2;
        if (payTokenTemp?.balanceValue !== undefined && orderInfo?.payAmount <= payTokenTemp?.balanceValue) {
          payTokenTemp.value = orderInfo?.payAmount;
          updateState({ isWalletInsuff: false });
        } else {
          updateState({
            isWalletInsuff: true,
            shortUsd: MathUtil_minus(orderInfo?.payAmount, payTokenTemp?.balanceValue ?? 0)
          });
        }
      }
      updateState({ payToken: payTokenTemp });
    }
  }

  // payToken
  useEffect(() => {
    getPayOtherToken();
  }, [JSON.stringify(orderInfo), isRecever, authedAccountInfo?.publicKey?.toUpperCase()]);

  // setEthPrice
  useEffect(() => {
    if (orderInfo?.chainId) {
      const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId: orderInfo?.chainId })?.chainAssetsType;
      if (chainAssetsType && assetsDefaultToken?.[chainAssetsType] && assetsDefaultToken?.[chainAssetsType]?.price) {
        updateOtherState({ ethPrice: Number(assetsDefaultToken?.[chainAssetsType]?.price) });
      }
    }
  }, [orderInfo?.chainId]);

  return { onConfirmClick, createPaymentOrder, onConfirm };
};
