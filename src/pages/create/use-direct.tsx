import { useEffect } from 'react';
import { AUTH_USER_INFO, ETH_NETWORK_CONFIG, LOCAL_CREATED_TOKEN } from '@/constants';
import {
  getContractErrorMsg,
  getTokenFromWalletAndLinx,
  LocalStorage_get,
  LocalStorage_set,
  toConnectWallet,
  getToken,
  MathUtil_minus,
  isCanAction,
  MathUtil_numberFixed,
  getAuthUserInfo,
  isNativeToken
} from '@/utils';
import { signTranscation, Response, TokenSelector } from '@/types';
import { isArray, findIndex } from 'lodash';
import { history } from 'umi';
import {
  EthWeb3Service,
  getTokenBigNumberAmount,
  EthContractService,
  TokenDataService_getERC20TokenFromChainByAddress,
  getDefaultToken,
  getTransferOrder,
  actionSdmAuth
} from '@/services';
import { useSelector, useDispatch } from 'dva';
import { useMultiWallet } from '@/lib/wallet-selector';
import { message } from 'antd';
import {
  finishOrder,
  updateOrder,
  getTokenVauleAll,
  checkChainIdParam,
  getAssetsFromOrderId,
  getEthTransMsg,
  sendMsg,
  createOrder,
  roomNotification,
  getMultiAssetsFunc,
  handleTransaction
} from '@/pages/create/create-util';
import { useCreateTransferContext } from '.';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import Web3 from 'web3';
import { useCreateStore } from './store';

export const useDirectCreate = () => {
  const dispatch = useDispatch();
  const { roomId, authedAccountInfo, parentIframeUrl } = useSelector((state: any) => state.store);
  const { currentWallet, ethWeb3, switchChain, onSelectConnectWallet } = useMultiWallet();
  const { afterSuccess } = useCreateTransferContext();
  const isMobile = getPlatformInfo()?.isMobile;
  let pendingTime = 0;
  let _pengindTimeSet: any = null;
  let gasPriceCon: string | undefined;

  const toAddress = useCreateStore((state) => state.toAddress);
  const toPeople = useCreateStore((state) => state.toPeople);
  const pktMsg = useCreateStore((state) => state.pktMsg);
  const balanceType = useCreateStore((state) => state.balanceType);
  const sentUser = useCreateStore((state) => state.sentUser);
  const checkedToken = useCreateStore((state) => state.checkedToken);
  const checkedNft = useCreateStore((state) => state.checkedNft);
  const checkedChainId = useCreateStore((state) => state.checkedChainId);
  const signList = useCreateStore((state) => state.signList);
  const signIndex = useCreateStore((state) => state.signIndex);
  const resetState = useCreateStore((state) => state.resetState);
  const updateSignItemStatus = useCreateStore((state) => state.updateSignItemStatus);
  const updateState = useCreateStore((state) => state.updateState);

  async function initUrlSearch() {
    const queryParams = history.location.query;
    const userIdParam = queryParams?.userId;
    const addressParam = queryParams?.address;
    const tokenAddressParam = queryParams?.token;
    const amountParam = queryParams?.amount;
    const msgParam = queryParams?.msg;
    const spdParam = queryParams?.spd;
    const fromParam = queryParams?.from;
    if (queryParams?.paycode) {
      updateState({ hideBalanceTypeMenu: spdParam?.toString() === '1' ? false : true });
    }
    /* External call: 
      /create?from=wallet&chain=ethereum 
      /create?from=vault&address=xxx&chainId=5
    */
    if (fromParam && ['vault', 'wallet'].indexOf(fromParam?.toString()) >= 0) {
      updateState({ hideBalanceTypeMenu: true, balanceType: 2 });
    }
    const isCanCheck = isCanAction(parentIframeUrl);
    if (userIdParam && !isArray(userIdParam) && isCanCheck) {
      const user = await TransferAccessService.getUserProfile(decodeURIComponent(userIdParam)).catch(() => {});
      // console.log('userProfile', user);
      if (user && user?.userId) {
        let userInfo = {
          id: user?.userId,
          icon: user.avatar && user.avatar !== '' ? user.avatar : null,
          name: user.name ?? addressParam,
          address: user?.walletAddress ?? addressParam
        };
        updateState({
          byAddress: false,
          toAddress:
            addressParam && !isArray(addressParam) && addressParam != 'undefined' ? addressParam : userInfo?.address,
          sentUser: userInfo,
          toPeople: userInfo,
          isPrivate: true
        });
      } else {
        if (addressParam && !isArray(addressParam) && addressParam != 'undefined') {
          updateState({ byAddress: true, toAddress: addressParam, isPrivate: true });
        }
      }
    } else if (addressParam && !isArray(addressParam) && addressParam != 'undefined') {
      updateState({ byAddress: true, toAddress: addressParam, isPrivate: true });
    }
    // chainId
    const { chainIdValue } = checkChainIdParam(authedAccountInfo, dispatch);
    // token
    const tokenChainId = chainIdValue ?? ETH_NETWORK_CONFIG?.chain_id;
    let ethWeb3Temp = ethWeb3;
    let tokenSymbol = '';
    if (tokenAddressParam && !isArray(tokenAddressParam)) {
      let tokenAddress = tokenAddressParam?.toString();
      let tokenDecimal = 0;
      if (isNativeToken(tokenAddress)) {
        const defaultToken = getDefaultToken({ chainId: tokenChainId });
        tokenSymbol = defaultToken?.symbol;
        tokenDecimal = defaultToken?.decimals;
      } else {
        const res = await TokenDataService_getERC20TokenFromChainByAddress(tokenAddress, tokenChainId, ethWeb3Temp);
        tokenDecimal = Number(res?.decimals);
        tokenSymbol = res?.symbol;
      }
      updateState({
        presetToken: {
          value: amountParam ? amountParam?.toString() : 0,
          id: tokenAddressParam?.toString(),
          name: tokenSymbol,
          symbol: tokenSymbol,
          chainId: tokenChainId,
          address: tokenAddressParam?.toString(),
          decimals: tokenDecimal,
          balanceType: 1
        }
      });
    } else {
      updateState({ presetToken: undefined });
    }
    // note
    if (msgParam && !isArray(msgParam)) {
      updateState({ pktMsg: decodeURIComponent(msgParam) });
    }
  }

  async function initReturnInfo(id: string) {
    const accessToken = getToken();
    const authUserInfo = getAuthUserInfo();
    if (!accessToken || !authedAccountInfo || !authUserInfo?.id) return;
    updateState({ initLoading: true });
    const res = await getTransferOrder(accessToken, id);
    if (res && res?.success && res.result) {
      const orderInfo = res.result[0];
      const receIndex = findIndex(orderInfo?.receivers, {
        receiverUserId: authUserInfo?.id
      });
      if (receIndex >= 0) {
        // check isReturned
        if (orderInfo?.receivers[receIndex]?.status === 3 || orderInfo?.originId) {
          updateState({ initLoading: false });
          message.info('Returned');
          return;
        }
      } else {
        updateState({ initLoading: false });
        return;
      }
      // user
      const userInfo = {
        id: orderInfo?.makerUserId,
        icon: orderInfo?.makerUserImage,
        name: orderInfo?.makerUserName,
        address: orderInfo?.makerAddress
      };
      updateState({
        byAddress: false,
        toAddress: userInfo?.address,
        sentUser: userInfo,
        toPeople: userInfo,
        isPrivate: true
      });
      const { receTokens, receNfts } = await getAssetsFromOrderId(orderInfo, authedAccountInfo?.publicKey);
      // console.log('receNfts', receNfts);
      updateState({
        initLoading: false,
        checkedToken: receTokens,
        checkedNft: receNfts
      });
      // chainId
      const chainIdOrderParam = orderInfo?.chainId;
      if (chainIdOrderParam) {
        if (authedAccountInfo?.chainId !== chainIdOrderParam) {
          // console.log('direct-transfer-setAuthedAccountInfo-2');
          dispatch({
            type: 'store/setAuthedAccountInfo',
            payload: { ...authedAccountInfo, chainId: chainIdOrderParam }
          });
        }
      }
    } else {
      updateState({ initLoading: false });
    }
  }

  function checkIsInsuffBalance() {
    let result = false;
    const tokenList = (checkedToken || []).filter((o) => o.value && Number(o.value) > 0);
    for (let item of tokenList) {
      item = item as TokenSelector;
      if (balanceType === 1) {
        //spending
        if (!item?.spendingValue || !item?.value) {
          result = true;
          break;
        } else {
          if (Number(item?.spendingValue) <= 0) {
            result = true;
            break;
          } else if (item?.spendingValue && MathUtil_minus(item?.spendingValue, item?.value) < 0) {
            result = true;
            break;
          }
        }
      } else {
        // wallet
        if (!item?.balanceValue || !item?.value) {
          result = true;
          break;
        } else {
          if (Number(item?.balanceValue) <= 0) {
            result = true;
            dispatch({ type: 'store/setBuyToken', payload: { buyToken: item } });
            break;
          } else if (item?.balanceValue && MathUtil_minus(item?.balanceValue, item?.value) < 0) {
            result = true;
            dispatch({ type: 'store/setBuyToken', payload: { buyToken: item } });
            break;
          }
        }
      }
    }

    return result;
  }

  async function onConfirm() {
    clearSpendingTime(false);
    updateState({ resultContent: undefined, createBtnLoading: true });
    let fromAddress = authedAccountInfo?.publicKey;
    if (balanceType === 2) {
      if (!currentWallet?.publicKey) {
        updateState({ createBtnLoading: false });
        toConnectWallet(dispatch, { isRecoAccount: true, connectWallet: onSelectConnectWallet });
        return;
      } else {
        fromAddress = currentWallet?.publicKey;
      }
      if (fromAddress?.toUpperCase() === toAddress?.toUpperCase()) {
        updateState({ createBtnLoading: false });
        message.error('Cannot be the same address');
        return;
      }
      gasPriceCon = await ethWeb3.eth.getGasPrice();
    }
    const accessToken = await checkAuthToken();
    if (!accessToken) {
      updateState({ createBtnLoading: false });
      return;
    }
    const checkedTokenList = checkedToken.filter((o) => o.value && Number(o.value) > 0);
    const checkedNftLen = checkedNft?.length;
    const checkedTokenListLen = checkedTokenList?.length;
    if (checkedNftLen == 1 && checkedTokenListLen == 0) {
      transferOneNFT(fromAddress, accessToken).then();
    } else if (checkedNftLen == 0 && checkedTokenListLen == 1) {
      transferOneToken(fromAddress, accessToken).then();
    } else {
      if (balanceType === 1) {
        transferMultiToken(fromAddress, accessToken).then();
      } else {
        setPendingTime();
        await onHandleMultiTokenContinue(fromAddress, signList, 0, accessToken);
      }
    }
  }

  function onConfirmClick() {
    updateState({ nextLoading: true });
    if (!authedAccountInfo) {
      toConnectWallet(dispatch, { connectWallet: onSelectConnectWallet });
      updateState({ nextLoading: false });
      return;
    }
    // const { isKill } = checkChainIdParam(authedAccountInfo, dispatch);
    // if (isKill) {
    //   updateState({ nextLoading: false });
    //   return;
    // }
    if (!authedAccountInfo?.publicKey) {
      message.error('address invalid');
      updateState({ nextLoading: false });
      return;
    }
    if (pktMsg && pktMsg?.length > 50) {
      message.error('Leaving message too long!');
      updateState({ nextLoading: false });
      return;
    }
    if (!toAddress) {
      message.error('Please choose who to send');
      updateState({ nextLoading: false });
      return;
    }
    // console.log('toAddress', toAddress);
    if (toAddress?.length !== 42) {
      message.error('Invalid wallet address');
      updateState({ nextLoading: false });
      return;
    } else {
      const toA = Web3.utils.toChecksumAddress(toAddress);
      if (!Web3.utils.checkAddressChecksum(toA)) {
        message.error('Invalid wallet address');
        updateState({ nextLoading: false });
        return;
      }
    }
    const checkedTokenList = checkedToken.filter((o) => o.value && Number(o.value) > 0);
    const checkedNftLen = checkedNft?.length;
    const checkedTokenListLen = checkedTokenList?.length;
    if (checkedNftLen == 0 && checkedTokenListLen == 0) {
      message.error('Please select token!');
      updateState({ nextLoading: false });
      return;
    }
    if (balanceType === 2 && !currentWallet?.publicKey) {
      toConnectWallet(dispatch, { isRecoAccount: true, connectWallet: onSelectConnectWallet });
      updateState({ nextLoading: false });
      return;
    }
    let isLargeAmountTemp = false;
    const tokenVaule = getTokenVauleAll(checkedToken);
    if (tokenVaule >= 500) {
      isLargeAmountTemp = true;
      updateState({
        largeAmount: MathUtil_numberFixed(tokenVaule, 4) + ''
      });
    }

    if (balanceType === 2 && currentWallet?.chainId && checkedChainId && currentWallet?.chainId !== checkedChainId) {
      switchChain(checkedChainId, () => {
        if (isLargeAmountTemp) {
          updateState({ largeAmountVisible: true });
        } else {
          updateState({ confirmViewVisible: true });
        }
      });
      updateState({ nextLoading: false });
      return;
    }

    // one nft
    if (checkedNftLen == 1 && checkedTokenListLen == 0) {
      if (checkedNft[0].type != 1) {
        message.error('Only support ERC721');
        updateState({ nextLoading: false });
        return;
      }
    }
    // one token
    if (checkedNftLen == 0 && checkedTokenListLen == 1) {
      const token = checkedToken.filter((o) => o.value && Number(o.value) > 0)?.[0];
      const pktTotalAmount = Number(token.value);
      if (
        balanceType === 2 ? pktTotalAmount > Number(token.balanceValue) : pktTotalAmount > Number(token.spendingValue)
      ) {
        message.error('value > balance');
        updateState({ nextLoading: false });
        return;
      }
      if (!token || !pktTotalAmount || pktTotalAmount < 0.0001) {
        message.error(token?.symbol + ' token amount invalid!');
        updateState({ nextLoading: false });
        return;
      }
    }
    updateState({ nextLoading: false });
    if (isLargeAmountTemp) {
      updateState({ largeAmountVisible: true });
    } else {
      updateState({ confirmViewVisible: true });
    }
  }

  async function transferOneToken(fromAddress: string, accessToken: string) {
    const createResp = await createOrder(
      {
        fromAddress,
        checkedToken,
        checkedNft,
        balanceType,
        roomId,
        pktMsg,
        toAddress,
        toPeople
      },
      accessToken
    );
    if (!createResp?.success) {
      failedFun(createResp?.errorMsg);
      return;
    }
    // start ---set created token
    let createdToken = JSON.parse(LocalStorage_get(LOCAL_CREATED_TOKEN) ?? '{}');
    const checkedTokenList = checkedToken.filter((o) => o.value && Number(o.value) > 0);
    createdToken![`${authedAccountInfo?.chainId}-send`] = {
      symbol: checkedTokenList?.[0]?.symbol,
      address: checkedTokenList?.[0]?.address,
      name: checkedTokenList?.[0]?.symbol,
      decimals: checkedTokenList?.[0]?.decimals,
      chainType: 'eth',
      chainId: checkedTokenList?.[0]?.chainId,
      icon: checkedTokenList?.[0]?.icon,
      balanceType
    };
    LocalStorage_set(LOCAL_CREATED_TOKEN, JSON.stringify(createdToken));
    // end ---set created token
    if (createResp?.result?.spending) {
      // spending
      updateState({ pktMsg: '' });
      onAfterSuccess(createResp.result?.id);
    } else {
      // wallet
      payOneTokenFromWallet(accessToken, createResp);
    }
  }

  async function payOneTokenFromWallet(accessToken: string, createResp: Response) {
    const token = checkedToken.filter((o) => o.value && Number(o.value) > 0)?.[0];
    if (!currentWallet?.publicKey) {
      toConnectWallet(dispatch, { isRecoAccount: true, connectWallet: onSelectConnectWallet });
      return;
    }
    setPendingTime();
    const fromAddress = currentWallet?.publicKey;
    const service = new EthContractService(ethWeb3);
    const pktTotalAmount = Number(token.value);
    if (isNativeToken(token?.address)) {
      const { message, gasLimit } = await getEthTransMsg({ token, fromAddress, toAddress }, ethWeb3, gasPriceCon);
      try {
        if (!isNaN(gasLimit)) {
          let txId = '';
          await ethWeb3.eth.sendTransaction(message, (err: any, hash: any) => {
            if (!err) {
              txId = hash;
              // console.log('txId=', txId);
              updateOrder(createResp, accessToken, currentWallet?.chainId, hash);
            } else {
              // output = "Error";
              const errorMsg = getContractErrorMsg(err);
              failedFun(errorMsg);
            }
          });

          let receipt = await ethWeb3.eth.getTransactionReceipt(txId);
          while (!receipt) {
            setTimeout(function () {
              receipt = ethWeb3.eth.getTransactionReceipt(txId);
            }, 1000);
          }

          updateState({ pktMsg: '' });
          finishOrder(createResp, accessToken, currentWallet?.chainId, txId, () => {
            onAfterSuccess(createResp.result?.id);
          });
        }
      } catch (error) {
        const errorMsg = getContractErrorMsg(error);
        failedFun(errorMsg);
      }
    } else {
      const amount = getTokenBigNumberAmount(pktTotalAmount, token?.decimals);
      const func = service
        .ERC20(token.address, gasPriceCon, currentWallet?.chainId)
        .methods.transfer(toAddress, amount);
      await handleTransaction(
        { func, chainId: currentWallet?.chainId, fromAddress },
        accessToken,
        createResp,
        (e: any) => {
          failedFun(e);
        },
        () => {
          updateState({ pktMsg: '' });
          onAfterSuccess(createResp.result?.id);
        }
      );
    }
  }

  async function checkAuthToken() {
    const tokenRes = await getTokenFromWalletAndLinx();
    const accessToken = tokenRes?.token;
    if (!accessToken) {
      actionSdmAuth(dispatch);
      message.error('Please re-authorize');
      return false;
    } else {
      return accessToken;
    }
  }

  async function transferOneNFT(fromAddress: string, accessToken: string) {
    // console.log('transferOneNFT: ' + pktMsg);
    const nft = checkedNft[0];
    const createResp = await createOrder(
      { fromAddress, checkedToken, checkedNft, balanceType, roomId, pktMsg, toAddress, toPeople },
      accessToken
    );
    if (!createResp?.success) {
      failedFun(createResp?.errorMsg);
      return;
    }
    if (createResp?.result?.spending) {
      // spending
      updateState({ pktMsg: '' });
      onAfterSuccess(createResp.result?.id);
    } else {
      const service = new EthContractService(ethWeb3);
      // wallet
      let contract;
      if (nft.type === 1) {
        contract = service.ERC721(nft.contractAddress, gasPriceCon, nft?.chainId);
      } else if (nft.type === 2) {
        contract = service.ERC1155(nft.contractAddress, gasPriceCon, nft?.chainId);
      } else {
        message.error('Invalid NFT type');
        return;
      }
      setPendingTime();
      const func = contract.methods.safeTransferFrom(fromAddress, toAddress, ethWeb3.utils.BN(nft.id));
      await handleTransaction(
        { func, chainId: currentWallet?.chainId, fromAddress },
        accessToken,
        createResp,
        (e: any) => {
          failedFun(e);
        },
        () => {
          updateState({ pktMsg: '' });
          onAfterSuccess(createResp.result?.id);
        }
      );
    }
  }

  function failedFun(resultValue?: any) {
    //failed
    clearSpendingTime(false);
    updateState({ createBtnLoading: false });
    if (isMobile && (resultValue === 'User rejected the transaction' || resultValue === 'User rejected the request')) {
    } else {
      updateState({ resultContent: resultValue });
    }
  }

  function clearSpendingTime(isTimeoutParam: boolean) {
    updateState({ isTimeout: isTimeoutParam });
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

  function onAfterSuccess(orderId: number) {
    clearSpendingTime(false);
    if (history.location.query?.returnId) {
      roomNotification({ sentUser, toPeople }, roomId);
    }
    if (history.location.query?.from === 'wallet') {
    } else {
      sendMsg({ sentUser, toPeople, orderId, balanceType, checkedToken, checkedNft, pktMsg }, roomId);
    }
    resetState();
    afterSuccess(orderId);
  }

  async function transferMultiToken(fromAddress: string, accessToken: string) {
    const createResp = await createOrder(
      { fromAddress, checkedToken, checkedNft, balanceType, roomId, pktMsg, toAddress, toPeople },
      accessToken
    );
    if (!createResp?.success) {
      failedFun(createResp?.errorMsg);
      return;
    }
    if (createResp?.result?.spending) {
      // spending
      updateState({ pktMsg: '' });
      onAfterSuccess(createResp.result?.id);
    } else {
      setPendingTime();
      try {
        const { func, ethWei } = getMultiAssetsFunc(
          { checkedToken, checkedNft, fromAddress, toAddress },
          ethWeb3,
          gasPriceCon
        );
        await handleTransaction(
          { func, ethWei, chainId: currentWallet?.chainId, fromAddress },
          accessToken,
          createResp,
          (e: any) => {
            failedFun(e);
          },
          () => {
            updateState({ pktMsg: '' });
            onAfterSuccess(createResp.result?.id);
          }
        );
      } catch (error) {
        failedFun(error);
      }
    }
  }

  async function onHandleMultiTokenContinue(
    fromAddress: string,
    signListParam: signTranscation[],
    signIndexParam: number,
    accessToken: string
  ) {
    const signListTemp = signListParam !== undefined ? signListParam : signList;
    const signIndexTemp = signIndexParam !== undefined ? signIndexParam : signIndex;
    console.log('onHandleMultiTokenContinue', signListTemp, signListTemp?.length, signIndexTemp);
    if (signIndexTemp === signListTemp?.length) {
      await transferMultiToken(fromAddress, accessToken).then();
    } else {
      await handleApproval(signListTemp, signIndexTemp, fromAddress, accessToken);
    }
  }

  async function handleApproval(
    signListParam: signTranscation[],
    signIndexParam: number,
    fromAddress: string,
    accessToken: string
  ) {
    console.log('handleApproval-signIndex', signIndexParam);
    let signListTemp = signListParam;
    if (signListTemp?.[signIndexParam]) {
      let type = signListTemp?.[signIndexParam]?.type;
      let tradeAmount;
      if (type === 1 && (signListTemp[signIndexParam]?.nftInfo as TokenSelector)?.value) {
        const signListParamIndexValue = Number((signListTemp[signIndexParam]?.nftInfo as TokenSelector)?.value);
        tradeAmount = getTokenBigNumberAmount(signListParamIndexValue, signListTemp[signIndexParam]?.nftInfo?.decimals);
      }
      // signListParam[signIndexParam].status = 2;
      // setSignList(signListParam.slice());
      updateSignItemStatus(signIndexParam, 2);

      const service = new EthContractService(ethWeb3);
      let contractAddress: string = signListTemp[signIndexParam]?.nftInfo?.address || '';
      if (!contractAddress) {
        clearSpendingTime(false);
        updateState({ createBtnLoading: false });
        message.error('contract address is empty!');
        return;
      }

      let approveRes;
      try {
        approveRes = await EthWeb3Service.approve(
          service,
          type,
          contractAddress,
          fromAddress,
          currentWallet?.chainId,
          gasPriceCon,
          tradeAmount,
          () => {
            updateState({ createBtnLoading: false });
          }
        );
      } catch (error) {
        console.log('handleApproval-approve-error', error);
        clearSpendingTime(false);
        updateState({ createBtnLoading: false });
        const errorMsg = getContractErrorMsg(error);
        if (isMobile && (errorMsg === 'User rejected the transaction' || errorMsg === 'User rejected the request')) {
        } else {
          message.error(errorMsg || 'Approve error');
        }
        // change status=1
        // signListParam[signIndexParam].status = 1;
        // setSignList(signListParam.slice());
        updateSignItemStatus(signIndexParam, 1);
        return;
      }
      // signListParam[signIndexParam].status = 3;
      // setSignList(signListParam);
      // setSignIndex(signIndexParam + 1);
      updateSignItemStatus(signIndexParam, 3);
      updateState({
        signIndex: signIndexParam + 1
      });
    }
    await onHandleMultiTokenContinue(fromAddress, signListTemp, signIndexParam + 1, accessToken);
  }

  useEffect(() => {
    initUrlSearch();
  }, [LocalStorage_get(AUTH_USER_INFO)]);

  useEffect(() => {
    const returnIdParam = history.location.query?.returnId;
    if (returnIdParam && !isArray(returnIdParam)) {
      initReturnInfo(returnIdParam);
    }
  }, [
    history.location.query?.returnId,
    authedAccountInfo?.publicKey?.toUpperCase(),
    authedAccountInfo?.chainId,
    LocalStorage_get(AUTH_USER_INFO)
  ]);

  useEffect(() => {
    // 1. scaned
    const queryParams = history.location.query;
    if (queryParams?.paycode) {
      if (queryParams?.spd?.toString() === '0') {
        updateState({ balanceType: 2 });
      }
      // 2. support spending balance
      if (
        queryParams?.spd?.toString() === '1' &&
        checkedToken?.length === 1 &&
        checkedToken[0]?.spendingValue &&
        Number(checkedToken[0]?.spendingValue) > 0
      ) {
        updateState({ balanceType: 1 });
      }
      updateState({ balanceType: 2 });
      // 3. spending balance > value
      const amountParam = queryParams?.amount;
      const checkedTokenList = checkedToken.filter((o) => o.value && Number(o.value) > 0);
      const tokenAddressParam = queryParams?.token;
      if (
        queryParams?.spd?.toString() === '1' &&
        tokenAddressParam &&
        !isArray(tokenAddressParam) &&
        amountParam &&
        amountParam?.toString() &&
        checkedTokenList?.length === 1 &&
        checkedTokenList[0]?.spendingValue &&
        Number(checkedTokenList[0]?.spendingValue) > 0 &&
        checkedTokenList[0]?.value &&
        MathUtil_minus(checkedTokenList[0]?.spendingValue, checkedTokenList[0]?.value) >= 0
      ) {
        updateState({ balanceType: 1 });
      }
    }
  }, [JSON.stringify(history.location.query), JSON.stringify(checkedToken)]);

  useEffect(() => {
    updateState({
      checkedChainId:
        checkedNft?.length > 0
          ? checkedNft?.[0]?.chainId
          : checkedToken.filter((o) => o.value && Number(o.value) > 0)?.[0]?.chainId
    });
  }, [JSON.stringify(checkedToken), JSON.stringify(checkedNft)]);

  useEffect(() => {
    if (checkedToken.filter((o) => o.value && Number(o.value) > 0)?.length > 0) {
      const res = checkIsInsuffBalance();
      updateState({ isInsuffBalance: res });
    } else {
      updateState({ isInsuffBalance: false });
    }
  }, [JSON.stringify(checkedToken)]);

  // console.log('direct-transfer', currentWallet);

  return {
    onConfirm,
    onConfirmClick,
    onHandleMultiTokenContinue
  };
};
