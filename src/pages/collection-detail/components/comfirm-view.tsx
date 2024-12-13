import styles from '../index.less';
import BasePopup from '@/components/base-popup';
import { Button } from 'antd-mobile';
import { useSelector } from 'dva';
import { LOCAL_WALLET_NAME, PROJECT_NAME, WALLET_IMAGE_LIST } from '@/constants';
import { TokenSelector } from '@/types';
import TokenIcon from '@/components/token-icon';
import {
  checkedLineIcon,
  MathUtil_numberFixed,
  LocalStorage_get,
  getContractErrorMsg,
  getToken,
  MathUtil_plus,
  MathUtil_minus,
  retryIcon,
  LoadingOutlinedIcon
} from '@/utils';
import { groupBy, cloneDeep } from 'lodash';
import { useCreateContext } from '../';
import {
  payUsd,
  EthContractService,
  getTokenBigNumberAmount,
  EthWeb3Service,
  Assets_getTokenListBySpending,
  Assets_getTokenListAll,
  Assets_getDefaultTokenApi,
  Assets_getBillUsdTokenList
} from '@/services';
import { BigNumber } from '@ethersproject/bignumber';
import { getMultiAssetsFunc } from '@/pages/create/create-util';
import { finishOrder, updateOrder } from '@/pages/collection/collection-util';
import { useMultiWallet } from '@/lib/wallet-selector';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { roomNotification, getTokenIsApprove, getTokensFiterChain } from '../data_util';
import { useEffect, useState } from 'react';
import { useDispatch } from 'umi';
import { useColDetailStore, useUsdDetailStore } from '../store';

const CollectionConfirmView = ({ visible }: any) => {
  const dispatch = useDispatch();
  const { authedAccountInfo } = useSelector((state: any) => state.store);
  const walletValue = LocalStorage_get(LOCAL_WALLET_NAME);
  const { getOrderInfo } = useCreateContext();
  const { currentWallet, ethWeb3, switchChain } = useMultiWallet();
  const isMobile = getPlatformInfo()?.isMobile;
  const isPc = getPlatformInfo()?.isPc;
  let pendingTime = 0;
  let _pengindTimeSet: any = null;

  const orderInfo = useColDetailStore((state) => state.orderInfo);
  const createBtnLoading = useColDetailStore((state) => state.createBtnLoading);
  const processList = useColDetailStore((state) => state.processList);
  const processIndex = useColDetailStore((state) => state.processIndex);
  const receiveInfo = useColDetailStore((state) => state.receiveInfo);
  const isPaymentCode = useColDetailStore((state) => state.isPaymentCode);
  const confirmedPayTokens = useColDetailStore((state) => state.confirmedPayTokens);
  const updateProcessItem = useColDetailStore((state) => state.updateProcessItem);
  const updateState = useColDetailStore((state) => state.updateState);

  const payUsdTotal = useUsdDetailStore((state) => state.payUsdTotal);

  const [paidTotal, setPaidTotal] = useState<number>(0);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);

  console.log('sss', processList);

  function clearSpendingTime(isTimeoutParam: boolean) {
    setIsTimeout(isTimeoutParam);
    clearInterval(_pengindTimeSet);
    pendingTime = 0;
    _pengindTimeSet = null;
  }

  function setPendingTime() {
    pendingTime = 0;
    _pengindTimeSet = setInterval(() => {
      pendingTime += 1;
      if (pendingTime >= 8) {
        clearSpendingTime(true);
      }
    }, 1000);
  }

  async function onContinue(processListParam?: any, processIndexParam?: number) {
    const accessToken = getToken();
    if (!accessToken) return;
    updateState({
      createBtnLoading: true
    });
    clearSpendingTime(false);
    const processListTemp = processListParam !== undefined ? processListParam : processList;
    const processIndexTemp = processIndexParam !== undefined ? processIndexParam : processIndex;
    // console.log('onContinue', processListTemp, processIndexTemp);
    const processListTempKeysLen = Object.keys(processListTemp)?.length;
    if (processListTempKeysLen <= 0) {
      updateState({
        createBtnLoading: false
      });
      clearSpendingTime(false);
      return;
    }
    // pass and continue
    if (processIndexTemp < processListTempKeysLen - 1) {
      if (processListTemp[Object.keys(processListTemp)[processIndexTemp]]?.status === 3) {
        // set next
        updateState({
          processList: cloneDeep(processListTemp),
          processIndex: processIndexTemp + 1
        });
        await onContinue(processListTemp, processIndexTemp + 1);
        return;
      }
    }
    const _chainIdKey = Object.keys(processListTemp)[processIndexTemp];
    if (_chainIdKey === '_spd') {
      await payFromSpd(processListTemp, processIndexTemp);
    } else {
      setPendingTime();
      const chainIdKey = _chainIdKey.replace('_', '');
      const tokensFiterChain = groupBy(confirmedPayTokens?.walletTokens, 'chainId')?.[chainIdKey];
      // console.log('switchChain', chainIdKey, currentWallet?.chainId);
      if (currentWallet?.chainId !== Number(chainIdKey)) {
        switchChain(
          Number(chainIdKey),
          () => {
            // console.log('switchChain-onContinue');
            clearSpendingTime(false);
            updateState({
              createBtnLoading: false
            });
            // reset
            // processListTemp[Object.keys(processListTemp)[processIndexTemp]]!.status = 1;
            // updateState({
            //   processList: cloneDeep(processListTemp)
            // });
            updateProcessItem(Object.keys(processListTemp)[processIndexTemp], { status: 1 });
          },
          (e: any) => {
            failedFun(e);
            return;
          }
        );
        return;
      }
      if (tokensFiterChain?.length > 1) {
        await payMultiTokenFromWallet(processListTemp, processIndexTemp);
      } else {
        await payOneTokenFromWallet(processListTemp, processIndexTemp);
      }
    }
  }

  async function payFromSpd(processListParam: any, processIndexParam: number) {
    const accessToken = getToken();
    if (!accessToken) return;
    const _chainIdKey = Object.keys(processListParam)[processIndexParam];
    // pending
    // processListParam[_chainIdKey]!.status = 2;
    // updateState({
    //   processList: cloneDeep(processListParam)
    // });
    updateProcessItem(_chainIdKey, { status: 2 });
    // chainTokens
    let chainTokens: any = [];
    confirmedPayTokens?.spdTokens?.forEach((tokenItem: TokenSelector) => {
      chainTokens.push({
        tokenAddress: tokenItem?.address,
        tokenSymbol: tokenItem?.symbol,
        tokenIcon: tokenItem?.icon,
        tokenAmount: tokenItem?.value,
        spd: true,
        chainId: tokenItem?.chainId
      });
    });
    const res = await payUsd({
      accessToken,
      receiveId: orderInfo?.id,
      transferId: receiveInfo?.id,
      transferDetails: chainTokens
    });
    if (!res?.success) {
      failedFun({ message: res?.errorMsg }, processListParam, processIndexParam);
      return;
    } else {
      afterSuccess(processListParam, processIndexParam);
    }
  }

  async function failedFun(err: any, processListParam?: any, processIndexParam?: number) {
    // console.log('confirm-view-failedFun', err, processListParam, processIndexParam);
    //failed
    let msg = '';
    let showMsg = true;
    const _chainIdKey = Object.keys(processListParam)[processIndexParam];
    if (err) {
      msg = getContractErrorMsg(err);
      if (isMobile && (msg === 'User rejected the transaction' || msg === 'User rejected the request')) {
        showMsg = false;
      }
    }
    clearSpendingTime(false);
    updateState({
      createBtnLoading: false
    });
    if (processListParam && processIndexParam !== undefined) {
      // processListParam[_chainIdKey].status = 4;
      // processListParam[_chainIdKey].errorMsg = showMsg ? msg : '';
      updateState({
        // processList: cloneDeep(processListParam),
        processIndex: processIndexParam + 1
      });
      updateProcessItem(_chainIdKey, { status: 4, errorMsg: showMsg ? msg : '' });
      // set next
      if (processIndexParam < Object.keys(processListParam)?.length - 1) {
        await onContinue(processListParam, processIndexParam + 1);
      }
    }
  }

  async function afterSuccess(processListParam: any, processIndexParam: number) {
    clearSpendingTime(false);
    let isOver = false;
    let paidTotalTemp = paidTotal;
    const _chainIdKey = Object.keys(processListParam)[processIndexParam];
    processListParam[_chainIdKey]?.tokens?.forEach((item: any) => {
      paidTotalTemp = MathUtil_plus(paidTotalTemp, item?.value);
    });
    setPaidTotal(paidTotalTemp);
    if (MathUtil_minus(receiveInfo?.notPaid, paidTotalTemp) <= 0) {
      isOver = true;
    }
    if (processIndexParam === Object.keys(processListParam)?.length - 1) {
      // console.log('finished payment', isOver, receiveInfo?.notPaid, paidTotalTemp);
      // success
      // reset
      updateState({
        processList: [],
        processIndex: 0,
        confirmVisible: false
      });
      if (!isPaymentCode) {
        roomNotification(orderInfo, isOver);
      }
      updateState({
        createBtnLoading: false
      });
      getOrderInfo(orderInfo?.id);
      // update wallet balance
      // console.log('update wallet balance');
      Object.keys(processList)?.forEach((processKey) => {
        if (processKey === '_spd') {
          Assets_getTokenListBySpending(dispatch);
        } else {
          let chainIdParam = processKey.replace('_', '');
          Assets_getTokenListAll(Number(chainIdParam), authedAccountInfo?.publicKey, dispatch);
          Assets_getDefaultTokenApi(Number(chainIdParam), authedAccountInfo?.publicKey, dispatch);
          Assets_getBillUsdTokenList(orderInfo?.usdTokens, authedAccountInfo?.publicKey, dispatch);
        }
      });
    } else {
      // processListParam[_chainIdKey].status = 3;
      updateProcessItem(_chainIdKey, { status: 3 });
      // set next
      updateState({
        // processList: cloneDeep(processListParam),
        processIndex: processIndexParam + 1
      });
      await onContinue(processListParam, processIndexParam + 1);
    }
  }

  async function payOneTokenFromWallet(processListParam: any, processIndexParam: number) {
    const accessToken = getToken();
    if (!accessToken) {
      clearSpendingTime(false);
      return;
    }
    const _chainIdKey = Object.keys(processListParam)[processIndexParam];
    const chainIdKey = _chainIdKey.replace('_', '');
    // pending
    // processListParam[_chainIdKey].status = 2;
    // updateState({
    //   processList: cloneDeep(processListParam)
    // });
    updateProcessItem(_chainIdKey, { status: 2 });
    // chainTokens
    const chainTokens = getTokensFiterChain(confirmedPayTokens?.walletTokens, chainIdKey);
    const res = await payUsd({
      accessToken,
      receiveId: orderInfo?.id,
      transferId: receiveInfo?.id,
      transferDetails: chainTokens
    });
    if (!res?.success) {
      failedFun({ message: res?.errorMsg }, processListParam, processIndexParam);
      return;
    }
    let detailIdList: any = [];
    res?.result?.map((item: any) => {
      detailIdList.push(item?.id);
    });
    const tokensFiterChain = groupBy(confirmedPayTokens?.walletTokens, 'chainId')?.[chainIdKey];
    const token = chainTokens?.[0];
    const fromAddress = authedAccountInfo?.publicKey;
    const toAddress = orderInfo?.receiverAddress ?? orderInfo?.userAddress;
    const service = new EthContractService(ethWeb3);
    const gasPriceCon = await ethWeb3.eth.getGasPrice();
    // console.log('2222', token, chainTokens, confirmedPayTokens?.walletTokens, chainIdKey);
    const amount = getTokenBigNumberAmount(Number(token.tokenAmount), tokensFiterChain?.[0]?.decimals);
    //approve
    // let isNeedApproved = await EthWeb3Service.needsApprove(
    //   service,
    //   1,
    //   token.tokenAddress,
    //   amount,
    //   fromAddress,
    //   token?.chainId,
    //   gasPriceCon
    // );
    // if (isNeedApproved) {
    //   let approveRes;
    //   try {
    //     approveRes = await EthWeb3Service.approve(
    //       service,
    //       1,
    //       token.tokenAddress,
    //       fromAddress,
    //       token?.chainId,
    //       gasPriceCon,
    //       amount,
    //       () => {}
    //     );
    //   } catch (error) {
    //     failedFun(error, processListParam, processIndexParam);
    //     return;
    //   }
    // }
    //pay
    const func = service.ERC20(token.tokenAddress, gasPriceCon, token?.chainId).methods.transfer(toAddress, amount);
    let txId = '';
    const gasLimit = await EthWeb3Service.estimateGas(func, 0, () => {}, fromAddress);
    // console.log('payOneTokenFromWallet-gasLimit', fromAddress, gasLimit);
    if (!isNaN(gasLimit)) {
      func
        .send({
          from: fromAddress,
          gas: gasLimit
        })
        .on('transactionHash', (hash: any) => {
          // console.log('transfer: hash=' + hash);
          clearSpendingTime(false);
          txId = hash;
          updateOrder(orderInfo?.historyId, accessToken, Number(chainIdKey), hash, '', fromAddress, detailIdList);
        })
        .on('error', (e: any) => {
          // console.log('11111111-error', e);
          failedFun(e, processListParam, processIndexParam);
        })
        .on('receipt', () => {
          clearSpendingTime(false);
          // console.log('txId_finish=', txId);
          finishOrder(
            orderInfo?.historyId,
            accessToken,
            Number(chainIdKey),
            txId,
            () => {
              afterSuccess(processListParam, processIndexParam);
            },
            true,
            (e: any) => {
              failedFun(e, processListParam, processIndexParam);
            }
          );
        });
    }
  }

  async function payMultiTokenFromWallet(processListParam: any, processIndexParam: number) {
    const accessToken = getToken();
    if (!accessToken) {
      clearSpendingTime(false);
      return;
    }
    const _chainIdKey = Object.keys(processListParam)[processIndexParam];
    const chainIdKey = _chainIdKey.replace('_', '');
    // pending
    // processListParam[_chainIdKey].status = 2;
    // updateState({
    //   processList: cloneDeep(processListParam)
    // });
    updateProcessItem(_chainIdKey, { status: 2 });
    const fromAddress = authedAccountInfo?.publicKey;
    const toAddress = orderInfo?.receiverAddress ?? orderInfo?.userAddress;
    const gasPriceCon = await ethWeb3.eth.getGasPrice();

    // chainTokens
    const tokensFiterChain = groupBy(confirmedPayTokens?.walletTokens, 'chainId')?.[chainIdKey];
    const chainTokens = getTokensFiterChain(confirmedPayTokens?.walletTokens, chainIdKey);
    const service = new EthContractService(ethWeb3);
    //approve
    for (let item of tokensFiterChain) {
      const isNeedApproved = await getTokenIsApprove(item, fromAddress);
      if (isNeedApproved) {
        let tradeAmount = getTokenBigNumberAmount(Number(item?.value), item.decimals);
        try {
          await EthWeb3Service.approve(
            service,
            1,
            item?.address,
            fromAddress,
            currentWallet?.chainId,
            gasPriceCon,
            tradeAmount,
            () => {}
          );
        } catch (error) {
          failedFun(error, processListParam, processIndexParam);
          return;
        }
      }
    }
    const res = await payUsd({
      accessToken,
      receiveId: orderInfo?.id,
      transferId: receiveInfo?.id,
      transferDetails: chainTokens
    });
    if (!res?.success) {
      failedFun({ message: res?.errorMsg }, processListParam, processIndexParam);
      return;
    }
    let detailIdList: any = [];
    res?.result?.map((item: any) => {
      detailIdList.push(item?.id);
    });
    try {
      // pay
      const { func, ethWei } = getMultiAssetsFunc(
        { checkedToken: tokensFiterChain, checkedNft: [], fromAddress, toAddress },
        ethWeb3,
        gasPriceCon
      );
      let txId = '';
      let gasLimit;

      gasLimit = await EthWeb3Service.estimateGas(
        func,
        ethWei && ethWei !== '' ? ethWei : BigNumber.from(0),
        () => {},
        fromAddress
      );

      // console.log('payMultiTokenFromWallet-gasLimit', fromAddress, func, gasLimit);
      func
        .send({
          from: fromAddress,
          value: ethWei,
          gas: gasLimit && !isNaN(gasLimit) ? gasLimit : undefined
        })
        .on('transactionHash', (hash: any) => {
          clearSpendingTime(false);
          // console.log('transfer: hash=' + hash);
          txId = hash;
          updateOrder(orderInfo?.historyId, accessToken, Number(chainIdKey), hash, '', fromAddress, detailIdList);
        })
        .on('error', (e: any) => {
          failedFun(e, processListParam, processIndexParam);
        })
        .on('receipt', () => {
          clearSpendingTime(false);
          finishOrder(
            orderInfo?.historyId,
            accessToken,
            Number(chainIdKey),
            txId,
            () => {
              afterSuccess(processListParam, processIndexParam);
            },
            true,
            (e: any) => {
              failedFun(e, processListParam, processIndexParam);
            }
          );
        });
    } catch (error) {
      clearSpendingTime(false);
      failedFun(error, processListParam, processIndexParam);
      return;
    }
  }

  useEffect(() => {
    if (visible && Object.keys(processList)?.length > 0) {
      console.log('auto-onContinue', processList);
      onContinue(processList, 0);
    }
  }, [visible]);

  // console.log('CollectionConfirmView', processList, processIndex, currentWallet?.chainId);

  return (
    <BasePopup
      visible={visible}
      setVisible={() => {
        updateState({
          confirmVisible: false,
          createBtnLoading: false
        });
      }}
      title="Paying..."
      bodyClassName={styles.confirm_view_popup}
    >
      <div className={styles.coll_confirm_view_wrapper}>
        <div className={styles.coll_confirm_token}>
          {/* spd tokens */}
          {confirmedPayTokens?.spdTokens?.length > 0 && (
            <div className={styles.view_spd}>
              <div className={styles.coll_payer_title}>
                <span>From</span>
                <img src={`/image/icon/spd_icon.png`} width={18} height={18} />
                Spending account
              </div>
              {confirmedPayTokens?.spdTokens?.map((tokenItem: TokenSelector) => {
                let processItem = processList['_spd'];
                return (
                  <div className={styles.record_item} key={tokenItem?.address}>
                    <div className={styles.record_item_icon}>
                      <TokenIcon {...tokenItem} showChainIcon />
                    </div>
                    <div className={styles.record_item_info}>
                      <div className={styles.record_value}>
                        {tokenItem?.value}&nbsp;
                        {tokenItem?.symbol}
                      </div>
                      <div className={styles.record_price}>
                        <div className={styles.record_price_value}>
                          {tokenItem?.price && tokenItem?.price !== '0' && tokenItem?.value
                            ? MathUtil_numberFixed(Number(tokenItem?.price) * Number(tokenItem?.value), 4, 'floor')
                            : ''}
                        </div>
                        <ProcessItem processItem={processItem} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* wallet tokens */}
          <div>
            {Object.keys(confirmedPayTokens?.walletTokens)?.length > 0 && (
              <div className={styles.coll_payer_title}>
                <span>From</span>
                <img
                  src={walletValue ? WALLET_IMAGE_LIST?.[walletValue] : `/image/wallet/sendingme_logo.png`}
                  width={18}
                  height={18}
                />
                Wallet account
              </div>
            )}
            {Object.keys(groupBy(confirmedPayTokens?.walletTokens, 'chainId'))?.map((chainIdKey) => {
              return confirmedPayTokens?.walletTokens
                ?.filter((o: any) => o.chainId === Number(chainIdKey))
                .map((tokenItem: TokenSelector) => {
                  if (tokenItem?.chainId) {
                    let processItem = processList['_' + tokenItem?.chainId];
                    return (
                      <div className={styles.record_item} key={tokenItem?.address}>
                        <div className={styles.record_item_icon}>
                          <TokenIcon {...tokenItem} showChainIcon />
                        </div>
                        <div className={styles.record_item_info}>
                          <div className={styles.record_value}>
                            {tokenItem?.value}&nbsp;
                            {tokenItem?.symbol}
                          </div>
                          <div className={styles.record_price}>
                            <div className={styles.record_price_value}>
                              {tokenItem?.price && tokenItem?.price !== '0' && tokenItem?.value
                                ? MathUtil_numberFixed(Number(tokenItem?.price) * Number(tokenItem?.value), 4, 'floor')
                                : ''}
                            </div>
                            <ProcessItem processItem={processItem} />
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return null;
                  }
                });
            })}
          </div>
        </div>
      </div>
      <div className={styles.action_wrapper}>
        <div className={styles.summary}>
          Total:<span>{payUsdTotal} USD</span>
        </div>
        <div className={styles.action}>
          {createBtnLoading ? (
            <div className={styles.action_loading}>
              {
                <div className={styles.action_loading_text}>
                  Please process it in your wallet
                  {isTimeout && !isPc && (
                    <div
                      className={styles.retry_btn}
                      onClick={() => {
                        onContinue(processList, 0);
                      }}
                    >
                      {retryIcon}Retry
                    </div>
                  )}
                </div>
              }
              <div className={styles.action_loading_btn}>{LoadingOutlinedIcon}</div>
            </div>
          ) : (
            <Button
              className={`default_btn confirm_btn`}
              onClick={() => {
                onContinue(processList, 0);
              }}
            >
              <div className="create_btn_text">Confirm</div>
            </Button>
          )}
        </div>
      </div>
    </BasePopup>
  );
};

export default CollectionConfirmView;

const ProcessItem = ({ processItem }: any) => {
  // console.log('ProcessItem', processItem);
  return (
    <div className={styles.record_item_approve}>
      {/* {processItem?.status === 1 && <>{tipLineIcon}Wait</>} */}
      {processItem?.status === 2 && (
        <div>
          {LoadingOutlinedIcon}
          Pending...
        </div>
      )}
      {processItem?.status === 3 && (
        <div className={styles.authed}>
          {checkedLineIcon}
          Paid
        </div>
      )}
      {processItem?.status === 4 && (
        <div className={styles.error}>{processItem?.errorMsg?.replace('MetaMask Tx Signature: ', '')}</div>
      )}
    </div>
  );
};
