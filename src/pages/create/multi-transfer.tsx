import { useEffect } from 'react';
import styles from './index.less';
import { message } from 'antd';
import { Button } from 'antd-mobile';
import {
  MathUtil_numberFixed,
  toConnectWallet,
  LocalStorage_get,
  LocalStorage_set,
  getChainRpc,
  errorArrowIcon,
  getContractErrorMsg,
  MathUtil_minus,
  MathUtil_multipliedBy,
  MathUtil_plus,
  errorTipIcon,
  getTokenFromWalletAndLinx,
  LoadingOutlinedIcon,
  getAuthUserInfo,
  isNativeToken
} from '@/utils';
import { useMultiWallet } from '@/lib/wallet-selector';
import { TRANS_GTOUP_MENUS, LOCAL_CREATED_TOKEN, WALLET_CHAIN_CONFIG } from '@/constants';
import { TokenInfo } from '@/types';
import { filter, find } from 'lodash';
import { useSelector, useDispatch } from 'dva';
import {
  getTokenBigNumberAmount,
  EthWeb3Service,
  EthContractService,
  createInitRecord,
  getDefaultToken,
  actionSdmAuth
} from '@/services';
import { sendMsgMulti, getTokenHexValue, handleTransaction } from '@/pages/create/create-util';
import { useCreateTransferContext } from '.';
import Web3 from 'web3';
import AssetsTokenChange from '@/components/create-assets/assets_change';
import AssetsTokenSelect from '@/components/create-assets/assets_select';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import AddNote from '@/components/add-note';
import MultiSelectSend from '@/components/multi-select-send';
import TitleMenu from '@/components/title-menu';
import { useCreateStore } from './store';

const MultipleTransferPage = () => {
  const dispatch = useDispatch();
  const { roomId, authedAccountInfo } = useSelector((state: any) => state.store);
  const { assetsDefaultToken } = useSelector((state: any) => state.assets);
  const { currentWallet, ethWeb3, switchChain, onSelectConnectWallet } = useMultiWallet();
  const { afterSuccess } = useCreateTransferContext();
  const isMobile = getPlatformInfo()?.isMobile;

  const members = useCreateStore((state) => state.members);
  const participants = useCreateStore((state) => state.participants);
  const createBtnLoading = useCreateStore((state) => state.createBtnLoading);
  const resultContent = useCreateStore((state) => state.resultContent);
  const balanceType = useCreateStore((state) => state.balanceType);
  const partiPopupVisible = useCreateStore((state) => state.partiPopupVisible);
  const membersVisible = useCreateStore((state) => state.membersVisible);
  const totalAmount = useCreateStore((state) => state.totalAmount);
  const amountType = useCreateStore((state) => state.amountType);
  const tokenAmount = useCreateStore((state) => state.tokenAmount);
  const token = useCreateStore((state) => state.token);
  const descTitle = useCreateStore((state) => state.descTitle);
  const gasLoading = useCreateStore((state) => state.gasLoading);
  const gasFee = useCreateStore((state) => state.gasFee);
  const ethPrice = useCreateStore((state) => state.ethPrice);
  const isInsuffGas = useCreateStore((state) => state.isInsuffGas);
  const isInsuffBalance = useCreateStore((state) => state.isInsuffBalance);
  const updateState = useCreateStore((state) => state.updateState);

  function failedFun(resultValue?: any) {
    //failed
    updateState({ createBtnLoading: false });
    if (isMobile && (resultValue === 'User rejected the transaction' || resultValue === 'User rejected the request')) {
    } else {
      updateState({ resultContent: resultValue });
    }
  }

  async function onConfirmMulti() {
    const fromAddress = authedAccountInfo?.publicKey;
    updateState({ resultContent: undefined, createBtnLoading: true });
    if (balanceType === 2 && !currentWallet?.publicKey) {
      toConnectWallet(dispatch, { isRecoAccount: true, connectWallet: onSelectConnectWallet });
      updateState({ createBtnLoading: false });
      return;
    }
    if (balanceType === 2 && token?.chainId && currentWallet?.chainId !== token?.chainId) {
      switchChain(token?.chainId);
      updateState({ createBtnLoading: false });
      return;
    }
    if (!token) {
      message.error('Transfer token is empty');
      updateState({ createBtnLoading: false });
      return null;
    }
    if (amountType === 1 && !tokenAmount) {
      message.error('Transfer token amount is empty');
      updateState({ createBtnLoading: false });
      return;
    }
    const tokenRes = await getTokenFromWalletAndLinx();
    const accessToken = tokenRes?.token;
    if (!accessToken) {
      actionSdmAuth(dispatch);
      message.error('Please re-authorize');
      updateState({ createBtnLoading: false });
      return;
    }
    const authUserInfo = getAuthUserInfo();
    // 1. create order
    const { receivers, contractParams, totalAmountValue } = getReceiver(fromAddress, token);
    if (receivers?.length === 0) {
      message.error('No receiver');
      updateState({ createBtnLoading: false });
      return;
    }
    if (isInsuffBalance) {
      message.error('Insufficient balance');
      updateState({ createBtnLoading: false });
      return;
    }
    const recordData = {
      accessToken,
      chainId: token?.chainId,
      roomId,
      message: descTitle,
      makerAddress: fromAddress,
      makerUserId: authUserInfo?.id,
      makerUserName: authUserInfo?.name,
      makerUserImage: authUserInfo?.avatar,
      receivers,
      imAccessToken: authUserInfo?.token,
      spd: balanceType === 1 ? true : false
    };
    const createResp = await createInitRecord(recordData);
    // console.log('createResp1=', createResp);
    if (!createResp?.success) {
      failedFun(createResp?.errorMsg);
      return;
    }
    // start ---set created token
    let createdToken = JSON.parse(LocalStorage_get(LOCAL_CREATED_TOKEN) ?? '{}');
    createdToken![`${authedAccountInfo?.chainId}-send`] = {
      symbol: token?.symbol,
      address: token?.address,
      name: token?.symbol,
      decimals: token?.decimals,
      chainType: 'eth',
      chainId: token?.chainId,
      icon: token?.icon,
      balanceType
    };
    LocalStorage_set(LOCAL_CREATED_TOKEN, JSON.stringify(createdToken));
    // end ---set created token
    if (createResp?.result?.spending) {
      // spending
      updateState({ descTitle: '' });
      afterSuccess(createResp.result?.id);
      sendMsgMulti(
        {
          orderId: createResp.result?.id,
          tokenSymbol: token?.symbol,
          balanceType: 1,
          amountType,
          descTitle,
          tokenAmount,
          members,
          participants
        },
        roomId
      );
    } else {
      // wallet
      // 2. approve
      try {
        const service = new EthContractService(ethWeb3);
        const gasPriceCon = await ethWeb3.eth.getGasPrice();
        await approveToken(totalAmountValue, service, gasPriceCon);
        // 3. send transaction
        let hexTotal = '';
        if (isNativeToken(token.address)) {
          hexTotal = getTokenHexValue(totalAmountValue, token);
        }
        // console.log('send transaction', fromAddress, calls, hexTotal);
        // const func = service.TransferContract(gasPriceCon).methods.transfer(calls);
        // batchTransfer(address[] tokens, address[] recipients, uint256[] amounts)
        const func = service
          .TransferContract(gasPriceCon)
          .methods.batchTransfer(contractParams?.tokens, contractParams?.recipients, contractParams?.amounts);
        await handleTransaction(
          { func, ethWei: hexTotal, chainId: token?.chainId, fromAddress },
          accessToken,
          createResp,
          (e: any) => {
            failedFun(e);
          },
          () => {
            updateState({ descTitle: '' });
            afterSuccess(createResp.result?.id);
            sendMsgMulti(
              {
                orderId: createResp.result?.id,
                tokenSymbol: token?.symbol,
                balanceType: 2,
                amountType,
                descTitle,
                tokenAmount,
                members,
                participants
              },
              roomId
            );
          }
        );
      } catch (error) {
        failedFun(error);
      }
    }
  }

  async function approveToken(tokenValue: number, service: any, gasPriceCon: any) {
    if (!currentWallet?.publicKey) {
      toConnectWallet(dispatch, { isRecoAccount: true, connectWallet: onSelectConnectWallet });
      return;
    }
    if (!isNativeToken(token?.address)) {
      const equalTotalAmount = getTokenBigNumberAmount(tokenValue, token.decimals);
      let needsApproveRes = await EthWeb3Service.needsApprove(
        service,
        1,
        token?.address,
        equalTotalAmount,
        currentWallet?.publicKey,
        currentWallet?.chainId,
        gasPriceCon
      );
      console.log('contract needsApproveRes1222=', needsApproveRes);
      if (needsApproveRes) {
        await EthWeb3Service.approve(
          service,
          1,
          token?.address,
          currentWallet?.publicKey,
          currentWallet?.chainId,
          gasPriceCon,
          equalTotalAmount,
          async (e: any) => {
            const errorMsg = await getContractErrorMsg(e);
            failedFun(errorMsg);
          }
        );
      }
    }
  }

  function getReceiver(fromAddress: string, tokenParam: TokenInfo) {
    const receivers: any = [];
    // const calls: any = [];
    const contractParams = {
      tokens: [],
      recipients: [],
      amounts: []
    };
    let total = 0;
    const data = amountType === 1 ? filter(members, (o) => o?.isChecked) : filter(participants, (o) => o.value > 0);
    for (const item of data) {
      let value;
      if (amountType === 1) {
        value = Number(tokenAmount);
        total = MathUtil_multipliedBy(Number(tokenAmount), data?.length);
      } else {
        value = item?.value ? Number(item?.value) : 0;
        total = MathUtil_plus(total, value);
      }
      let amount = getTokenBigNumberAmount(Number(value), token.decimals);
      contractParams?.recipients.push(item?.walletAddress);
      contractParams?.tokens.push(token?.address);
      contractParams?.amounts.push(amount);
      receivers.push({
        receiverAddress: item?.walletAddress,
        receiverUserId: item?.userId,
        receiverUserName: item?.name,
        receiverUserImage: item?.icon,
        tokens: [
          {
            type: isNativeToken(token?.address) ? 0 : 1,
            tokenAddress: token?.address,
            tokenSymbol: token?.symbol,
            tokenId: token?.address,
            tokenIcon: token?.icon,
            tokenAmount: value,
            tokenDecimal: token?.decimals
          }
        ]
      });
      //
      // const hexValue = getTokenHexValue(value, tokenParam);
      // const obj = getTokenCallObj(tokenParam, fromAddress, item.walletAddress, hexValue);
      // // console.log('cx', item.walletAddress, obj);
      // calls.push(obj);
    }

    return {
      receivers,
      contractParams,
      totalAmountValue: total
    };
  }

  function updateTotalAmount() {
    const selMembers =
      amountType === 1 ? filter(members, (o) => o?.isChecked) : filter(participants, (o) => o.value > 0);
    let totalAmountValue = 0;
    if (amountType === 1) {
      const avgAmount = tokenAmount ? Number(tokenAmount) : 0;
      totalAmountValue = avgAmount && selMembers?.length > 0 ? MathUtil_multipliedBy(avgAmount, selMembers?.length) : 0;
      updateState({ totalAmount: totalAmountValue });
    } else {
      (selMembers || []).forEach((item) => {
        totalAmountValue = MathUtil_plus(totalAmountValue, item?.value ? Number(item?.value) : 0);
      });
      updateState({ totalAmount: totalAmountValue });
    }
  }

  async function getFeeDetail() {
    const data = amountType === 1 ? filter(members, (o) => o?.isChecked) : filter(participants, (o) => o.value > 0);
    if (!token || data?.length <= 0 || balanceType === 1 || !token?.chainId) {
      updateState({ gasFee: undefined, isInsuffGas: false });
      return;
    }
    updateState({ gasLoading: true });
    const rpcUrl = getChainRpc(token?.chainId);
    const ethWeb3Temp: any = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    if (amountType === 1) {
      //equal
      if (!tokenAmount || !Number(tokenAmount)) {
        updateState({ gasFee: undefined, isInsuffGas: false });
        return;
      }
    }
    try {
      updateState({ resultContent: undefined });
      const accountAddress = authedAccountInfo?.publicKey;
      const { contractParams, totalAmountValue } = getReceiver(accountAddress, token);
      if (!Number(totalAmountValue)) {
        updateState({ gasFee: undefined, isInsuffGas: false });
        return;
      }
      const Contract = new EthContractService(ethWeb3Temp);
      let contractAmount = getTokenBigNumberAmount(Number(totalAmountValue), token?.decimals);
      const gasPriceCon = await ethWeb3Temp.eth.getGasPrice();
      let needsApproveRes: boolean;
      // check isApproved
      if (!isNativeToken(token.address)) {
        needsApproveRes = await EthWeb3Service.needsApprove(
          Contract,
          1,
          token?.address,
          contractAmount,
          accountAddress,
          token?.chainId,
          gasPriceCon
        );
        console.log('needsApproveRes-check', needsApproveRes);
      } else {
        needsApproveRes = false;
      }
      console.log('needsApproveRes', needsApproveRes, totalAmountValue);
      // setNeedApproved(needsApproveRes);
      if (!needsApproveRes) {
        // get gas
        updateState({ gasLoading: true });
        // const contractFunc = Contract.TransferContract(gasPriceCon).methods.transfer(calls);
        const contractFunc = Contract.TransferContract(gasPriceCon).methods.batchTransfer(
          contractParams?.tokens,
          contractParams?.recipients,
          contractParams?.amounts
        );
        const estimateGasValue = isNativeToken(token?.address) ? contractAmount : 0;
        console.log('estimateGasValue', estimateGasValue);
        const gasLimit = await EthWeb3Service.estimateGas(
          contractFunc,
          estimateGasValue,
          (e: any) => {
            console.log('multi-getFeeDetail-gasLimit-error', e);
            if (
              e?.message?.indexOf('insufficient funds') >= 0 ||
              e?.message?.indexOf('gas required exceeds allowance') >= 0
            ) {
              updateState({ gasLoading: false, isInsuffGas: true });
            } else {
              updateState({ gasLoading: false, isInsuffGas: false });
            }
          },
          accountAddress
        );
        console.log('gasLimit', gasLimit);
        if (isNaN(gasLimit)) {
          updateState({ gasLoading: false, gasFee: undefined });
        } else {
          const gasPriceConEther = ethWeb3Temp?.utils.fromWei(gasPriceCon, 'ether');
          const gas = gasLimit * gasPriceConEther;

          updateState({ gasLoading: false, gasFee: gas, isInsuffGas: false });
        }
      } else {
        updateState({ gasLoading: false });
      }
    } catch (error) {
      console.log('getFeeDetail-multi', error);
      updateState({ gasLoading: false, gasFee: undefined, isInsuffGas: false });
    }
  }

  function checkIsInsuffBalance() {
    let result = false;
    if (totalAmount && token?.chainId) {
      if (balanceType === 1) {
        //spending
        if (!token?.spendingValue || Number(token?.spendingValue) <= 0) {
          result = true;
        } else if (MathUtil_minus(token?.spendingValue, totalAmount) < 0) {
          result = true;
        }
      } else {
        // wallet
        if (!token?.balanceValue || Number(token?.balanceValue) <= 0) {
          result = true;
        } else if (MathUtil_minus(token?.balanceValue, totalAmount) < 0) {
          result = true;
        }
        const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId: token?.chainId })?.chainAssetsType;
        const assetsDefault = chainAssetsType ? assetsDefaultToken?.[chainAssetsType] : undefined;
        if (assetsDefault && assetsDefault?.balanceValue && assetsDefault?.balanceValue <= 0) {
          updateState({ isInsuffGas: true, gasLoading: false, gasFee: undefined });
        }
      }
    }

    return result;
  }

  useEffect(() => {
    getFeeDetail();
  }, [
    amountType,
    tokenAmount,
    token?.address,
    JSON.stringify(members),
    JSON.stringify(participants),
    balanceType,
    authedAccountInfo?.publicKey?.toUpperCase()
  ]);

  useEffect(() => {
    if (token?.chainId) {
      const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId: token?.chainId })?.chainAssetsType;
      if (chainAssetsType && assetsDefaultToken?.[chainAssetsType] && assetsDefaultToken?.[chainAssetsType]?.price) {
        updateState({ ethPrice: Number(assetsDefaultToken?.[chainAssetsType]?.price) });
      }
    }
  }, [token?.chainId]);

  useEffect(() => {
    updateTotalAmount();
  }, [amountType, tokenAmount, JSON.stringify(members), JSON.stringify(participants)]);

  useEffect(() => {
    const res = checkIsInsuffBalance();
    updateState({ isInsuffBalance: res });
  }, [balanceType, totalAmount, token]);

  // console.log('multi-transfer', currentWallet);

  return (
    <div className={styles.multi_container}>
      <div className={styles.multi_content}>
        <TitleMenu
          menus={TRANS_GTOUP_MENUS}
          activeKey={amountType}
          setActiveKey={(value) => {
            updateState({ amountType: value });
          }}
          extraNode={
            <div className={styles.amount_desc}>{find(TRANS_GTOUP_MENUS, { value: amountType })?.amountDesc}</div>
          }
          menuPopTextColor={'var(--color-text-sw-2-3)'}
        />
        {amountType === 2 ? (
          // Specified Amount
          <AssetsTokenSelect
            token={token && token?.address ? { ...token, id: token?.address } : undefined}
            setToken={(value) => {
              updateState({ token: value });
            }}
            balanceType={balanceType}
            setBalanceType={(value) => {
              updateState({ balanceType: value });
            }}
            isSetCreateToken={true}
            hideBalanceTypeMenu={false}
            createKey="send"
          />
        ) : (
          // Equal Amount
          <AssetsTokenChange
            token={token ? { ...token, id: token?.address, value: tokenAmount } : undefined}
            setToken={(value) => {
              updateState({ token: value });
            }}
            onChangeVaule={(value: any) => {
              updateState({ tokenAmount: value === '' ? undefined : value });
            }}
            balanceType={balanceType}
            setBalanceType={(value) => {
              updateState({ balanceType: value });
            }}
            isSetCreateToken={true}
            hideBalanceTypeMenu={false}
            hideNftTab={true}
          />
        )}
        <AddNote
          pktMsg={descTitle}
          setPktMsg={(value) => {
            updateState({ descTitle: value });
          }}
        />
        <MultiSelectSend
          title="To"
          members={amountType === 2 ? participants : members}
          setMembers={(value) => {
            if (amountType === 2) {
              updateState({ participants: value });
            } else {
              updateState({ members: value });
            }
          }}
          balanceType={balanceType}
          memberPopupVisible={amountType === 2 ? partiPopupVisible : membersVisible}
          setMemberPopupVisible={(value) => {
            if (amountType === 2) {
              updateState({ partiPopupVisible: value });
            } else {
              updateState({ membersVisible: value });
            }
          }}
          token={token}
          hasInput={amountType === 2 ? true : false}
          onConfirmDisabled={
            amountType === 2
              ? totalAmount &&
                (balanceType === 1 ? token?.spendingValue : token?.balanceValue) &&
                Number(totalAmount) > (balanceType === 1 ? Number(token?.spendingValue) : Number(token?.balanceValue))
                ? true
                : false
              : false
          }
          footerExtra={
            amountType === 2 ? (
              <div className={styles.participants_footer_summary}>
                <div className={styles.summary_title}>{balanceType === 1 ? 'Spending' : 'Wallet'}:</div>
                <div
                  className={`${styles.summary_value} ${
                    totalAmount &&
                    (balanceType === 1 ? token?.spendingValue : token?.balanceValue) &&
                    Number(totalAmount) >
                      (balanceType === 1 ? Number(token?.spendingValue) : Number(token?.balanceValue))
                      ? styles.warning
                      : ''
                  }`}
                >
                  <span>
                    {totalAmount} {token?.symbol}
                  </span>
                  &nbsp;/&nbsp;
                  {balanceType === 1 ? token?.spendingValue : token?.balanceValue} {token?.symbol}
                </div>
              </div>
            ) : null
          }
        />
      </div>
      <div className={styles.create_action}>
        <div className={styles.total_content}>
          <div className={styles.title}>Total</div>
          <div className={styles.value}>
            {MathUtil_numberFixed(totalAmount, 4)}&nbsp;
            <span>{token?.symbol}</span>
          </div>
        </div>
        {balanceType === 2 ? (
          <div className={styles.gas_content}>
            {(gasFee || gasLoading) && (
              <>
                <div>Estimated gas fee:</div>
                <div>
                  {gasLoading && LoadingOutlinedIcon}
                  {gasFee ? MathUtil_numberFixed(gasFee, 6) : ''} {getDefaultToken({ chainId: token?.chainId })?.symbol}{' '}
                  {ethPrice && gasFee ? `($${MathUtil_numberFixed(gasFee * ethPrice, 2, 'floor')})` : ''}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={styles.spending_content}>
            <div>
              Recipient needs to accept.
              <span
                className={styles.value}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  updateState({ recipientTipVisible: true });
                }}
              >
                Learn more
              </span>
            </div>
            <div></div>
          </div>
        )}
        {(isInsuffGas || isInsuffBalance) && (
          <div
            className={styles.gas_error_msg}
            onClick={() => {
              if (balanceType === 2) {
                dispatch({
                  type: 'store/setInsufficientVisible',
                  payload: { visible: true, hideInsuffSwitch: isInsuffGas ? true : false }
                });
              }
            }}
          >
            Insufficient {isInsuffBalance ? 'balance' : 'gas'} {balanceType === 2 && errorArrowIcon}
          </div>
        )}
        {resultContent && (
          <div className={styles.error_msg}>
            {errorTipIcon}
            {resultContent}
          </div>
        )}
        {createBtnLoading ? (
          <div className={styles.action_loading}>
            {balanceType === 2 && <div className={styles.action_loading_text}>Please process it in your wallet</div>}
            <div className={styles.action_loading_btn}>{LoadingOutlinedIcon}</div>
          </div>
        ) : (
          <Button
            className="default_btn confirm_btn"
            onClick={() => {
              onConfirmMulti();
            }}
            disabled={isInsuffBalance || isInsuffGas ? true : false}
          >
            Confirm
          </Button>
        )}
      </div>
    </div>
  );
};

export default MultipleTransferPage;
