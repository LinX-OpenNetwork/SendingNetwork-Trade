import { useEffect, useState } from 'react';
import styles from './index.less';
import './index.less';
import { Button } from 'antd-mobile';
import { useDispatch, useSelector } from 'dva';
import { getDefaultToken, EthContractService, EthWeb3Service, getTokenBigNumberAmount } from '@/services';
import { WALLET_CHAIN_CONFIG } from '@/constants';
import { getTokenHexValue } from '@/pages/create/create-util';
import Web3 from 'web3';
import Web3Utils from 'web3-utils';
import { history } from 'umi';
import { TokenSelector } from '@/types';
import BasePopup from '@/components/base-popup';
import NftIcon from '@/components/nft-icon';
import TokenIcon from '@/components/token-icon';
import {
  getGasPriceValue,
  getChainRpc,
  errorArrowIcon,
  addressOmitShow,
  tipIcon,
  getChainName,
  errorTipIcon,
  MathUtil_numberFixed,
  tipLineIcon,
  checkedLineIcon,
  retryIcon,
  LoadingOutlinedIcon,
  isNativeToken
} from '@/utils';
import { find } from 'lodash';
import UserAvatar from '@/components/user-avatar';
import { useMultiWallet } from '@/lib/wallet-selector';
import { getSignList } from '@/pages/create/create-util';
// import { BigNumber } from '@ethersproject/bignumber';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { useCreateStore } from '../../store';

type IProps = {
  checkedToken: TokenSelector[];
  onConfirm: () => void;
  onContinue: any;
};

const ConfirmView = (props: IProps) => {
  const dispatch = useDispatch();
  const { checkedToken, onConfirm } = props;
  const { authedAccountInfo } = useSelector((state: any) => state.store);
  const { assetsDefaultToken } = useSelector((state: any) => state.assets);
  const { currentWallet, ethWeb3 } = useMultiWallet();
  const isPc = getPlatformInfo()?.isPc;

  const confirmViewVisible = useCreateStore((state) => state.confirmViewVisible);
  const balanceType = useCreateStore((state) => state.balanceType);
  const checkedNft = useCreateStore((state) => state.checkedNft);
  const toAddress = useCreateStore((state) => state.toAddress);
  const resultContent = useCreateStore((state) => state.resultContent);
  const toPeople = useCreateStore((state) => state.toPeople);
  const createBtnLoading = useCreateStore((state) => state.createBtnLoading);
  const signList = useCreateStore((state) => state.signList);
  const checkedChainId = useCreateStore((state) => state.checkedChainId);
  const isInsuffBalance = useCreateStore((state) => state.isInsuffBalance);
  const isTimeout = useCreateStore((state) => state.isTimeout);
  const ethPrice = useCreateStore((state) => state.ethPrice);
  const updateState = useCreateStore((state) => state.updateState);

  const [isInsuffGas, setIsInsuffGas] = useState<boolean>(false);
  const [gasLoading, setGasLoading] = useState<boolean>(false);
  const [gasFee, setGasFee] = useState<number | undefined>(undefined);

  async function getMultiFeeDetail() {
    const accountAddress = authedAccountInfo?.publicKey;
    const checkedTokenList = checkedToken.filter((o) => o.value && Number(o.value) > 0);
    if (
      balanceType === 1 ||
      (checkedTokenList?.length <= 0 && checkedNft?.length <= 0) ||
      !toAddress ||
      !accountAddress ||
      !checkedChainId
    ) {
      setGasFee(undefined);
      setIsInsuffGas(false);
      return;
    }
    setGasLoading(true);
    const rpcUrl = getChainRpc(checkedChainId);
    const ethWeb3Temp: any = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    try {
      const gasPriceCon = await ethWeb3Temp.eth.getGasPrice();
      const Contract = new EthContractService(ethWeb3Temp);
      console.log('getMultiFeeDetail', gasPriceCon, rpcUrl);
      // get gas
      setGasLoading(true);
      // check isApproved
      let needsApproveRes: boolean = false;
      // const calls: any = [];
      const contractParams = {
        tokens: [],
        recipients: [],
        amountsOrTokenIds: []
      };
      let ethWei;
      let contractFunc;
      if (checkedTokenList?.length > 1) {
        for (let token of checkedTokenList) {
          // console.log('token=', token);
          let value = Number(token.value);
          let amount = getTokenBigNumberAmount(value, token.decimals);
          contractParams?.tokens.push(token?.address);
          contractParams?.recipients.push(toAddress);
          contractParams?.amountsOrTokenIds.push(amount);

          // let hexValue = getTokenHexValue(value, token);
          // calls.push(getTokenCallObj(token, accountAddress, toAddress, hexValue));
          if (isNativeToken(token.address)) {
            ethWei = getTokenHexValue(value, token);
          }
          if (!isNativeToken(token?.address)) {
            console.log('needsApprove', token, checkedChainId);
            needsApproveRes = await EthWeb3Service.needsApprove(
              Contract,
              1,
              token?.address,
              amount,
              accountAddress,
              checkedChainId,
              gasPriceCon
            );
          } else {
            needsApproveRes = false;
          }
        }
        console.log('needsApproveRes', needsApproveRes);
        if (!needsApproveRes) {
          // batchTransfer(address[] tokens, address[] recipients, uint256[] amounts)
          contractFunc = Contract.TransferContract(gasPriceCon).methods.batchTransfer(
            contractParams?.tokens,
            contractParams?.recipients,
            contractParams?.amountsOrTokenIds
          );
        }
      } else if (checkedNft?.length > 1) {
        for (let nft of checkedNft) {
          let amount = getTokenBigNumberAmount(Number(nft.id), 0);
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
          //   callData: '0x42842e0e' + toData64(accountAddress) + toData64(toAddress) + toData64(amountHex + '')
          // });
          needsApproveRes = await EthWeb3Service.needsApprove(
            Contract,
            2,
            nft?.contractAddress,
            undefined,
            accountAddress,
            checkedChainId,
            gasPriceCon
          );
        }
        console.log('needsApproveRes', needsApproveRes);
        if (!needsApproveRes) {
          contractFunc = Contract.TransferContract(gasPriceCon).methods.batchTransferERC721(
            contractParams?.tokens,
            contractParams?.recipients,
            contractParams?.amountsOrTokenIds
          );
        }
      }
      if (contractFunc) {
        await getGasLimit(contractFunc, accountAddress, gasPriceCon, ethWei);
      } else {
        setGasLoading(false);
        setGasFee(-1);
      }
    } catch (error) {
      console.log('getFeeDetail-1', error);
      setGasLoading(false);
      setGasFee(undefined);
      setIsInsuffGas(false);
    }
  }

  async function getOneTokenFeeDetail() {
    const accountAddress = authedAccountInfo?.publicKey;
    if (
      balanceType === 1 ||
      !toAddress ||
      checkedToken.filter((o) => o.value && Number(o.value) > 0)?.length !== 1 ||
      checkedNft?.length !== 0 ||
      !accountAddress ||
      !checkedChainId
    ) {
      setGasFee(undefined);
      setIsInsuffGas(false);
      return;
    }
    setGasLoading(true);
    const rpcUrl = getChainRpc(checkedChainId);
    const ethWeb3Temp: any = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    try {
      const token = checkedToken.filter((o) => o.value && Number(o.value) > 0)?.[0];
      const pktTotalAmount = Number(token.value);
      const gasPriceCon = await ethWeb3Temp.eth.getGasPrice();
      const service = new EthContractService(ethWeb3Temp);
      if (isNativeToken(token.address)) {
        // default token
        let amount = Web3Utils.toBN((pktTotalAmount * 10 ** 18).toFixed(0));
        const gasPriceValue = getGasPriceValue(gasPriceCon, checkedChainId);
        const message = {
          from: accountAddress,
          to: toAddress,
          value: Web3Utils.toHex(amount),
          gasPrice: gasPriceValue
        };
        const gasLimit =
          (await ethWeb3Temp.eth.estimateGas(message).catch((e: any) => {
            console.log('getOneTokenFeeDetail-gasLimit-error', e);
            if (
              e?.message?.indexOf('insufficient funds') >= 0 ||
              e?.message?.indexOf('gas required exceeds allowance') >= 0
            ) {
              setIsInsuffGas(true);
              const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId: checkedChainId })?.chainAssetsType;
              if (chainAssetsType) {
                dispatch({
                  type: 'store/setBuyToken',
                  payload: { buyToken: assetsDefaultToken?.[chainAssetsType] }
                });
              }
            } else {
              setIsInsuffGas(false);
            }
            setGasLoading(false);
          })) * 1.2;
        console.log('gasLimit', gasLimit);
        if (isNaN(gasLimit)) {
          setGasLoading(false);
          setGasFee(undefined);
        } else {
          const gasPriceConEther: any = Web3Utils.fromWei(gasPriceCon, 'ether');
          const gas = gasLimit * gasPriceConEther;
          setGasLoading(false);
          setGasFee(gas);
          setIsInsuffGas(false);
        }
      } else {
        //erc20
        let amount = Web3Utils.toBN((pktTotalAmount * 10 ** token.decimals).toFixed(0));
        const contractFunc = service
          .ERC20(token.address, gasPriceCon, checkedChainId)
          .methods.transfer(toAddress, amount);
        await getGasLimit(contractFunc, accountAddress, gasPriceCon);
      }
    } catch (error) {
      console.log('getFeeDetail-2', error);
      setGasLoading(false);
      setGasFee(undefined);
      setIsInsuffGas(false);
    }
  }

  async function getOneNftFeeDetail() {
    const accountAddress = authedAccountInfo?.publicKey;
    if (
      balanceType === 1 ||
      !toAddress ||
      checkedToken.filter((o) => o.value && Number(o.value) > 0)?.length !== 0 ||
      checkedNft?.length !== 1 ||
      !checkedNft[0] ||
      !accountAddress ||
      !checkedChainId
    ) {
      setGasFee(undefined);
      setIsInsuffGas(false);
      return;
    }
    setGasLoading(true);
    const rpcUrl = getChainRpc(checkedChainId);
    const ethWeb3Temp: any = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    try {
      const nft = checkedNft[0];
      let contract;
      setGasLoading(true);
      const gasPriceCon = await ethWeb3Temp.eth.getGasPrice();
      const service = new EthContractService(ethWeb3Temp);
      if (nft.type === 1) {
        contract = service.ERC721(nft.contractAddress, gasPriceCon, checkedChainId);
      } else {
        contract = service.ERC1155(nft.contractAddress, gasPriceCon, checkedChainId);
      }
      const contractFunc = contract.methods.safeTransferFrom(accountAddress, toAddress, ethWeb3Temp.utils.BN(nft.id));
      await getGasLimit(contractFunc, accountAddress, gasPriceCon);
    } catch (error) {
      console.log('getFeeDetail-3', error, checkedNft);
      setGasLoading(false);
      setGasFee(undefined);
      setIsInsuffGas(false);
    }
  }

  async function getGasLimit(contractFunc: any, accountAddress: string, gasPriceCon: any, ethWei?: any) {
    let gasError = false;
    const gasLimit = await EthWeb3Service.estimateGas(
      contractFunc,
      ethWei ? ethWei : 0,
      (e: any) => {
        gasError = true;
        console.log('getGasLimit-gasLimit-error', e);
        if (
          e?.message?.indexOf('insufficient funds') >= 0 ||
          e?.message?.indexOf('gas required exceeds allowance') >= 0
        ) {
          setIsInsuffGas(true);
        } else {
          setIsInsuffGas(false);
        }
        setGasLoading(false);
      },
      accountAddress
    );
    console.log('gasLimit', gasLimit);
    if (isNaN(gasLimit)) {
      setGasLoading(false);
      setGasFee(undefined);
      if (!gasError) setIsInsuffGas(false);
    } else {
      const gasPriceConEther: any = Web3Utils.fromWei(gasPriceCon, 'ether');
      const gas = gasLimit * gasPriceConEther;
      setGasLoading(false);
      setGasFee(gas);
      setIsInsuffGas(false);
    }
  }

  async function getMultiSignList() {
    // multi assets
    if (checkedNft?.length == 1 && checkedToken?.length == 0) {
    } else if (checkedNft?.length == 0 && checkedToken?.length == 1) {
    } else {
      if (balanceType === 2 && currentWallet?.publicKey) {
        const gasPriceCon = await ethWeb3.eth.getGasPrice();
        const signListTemp = await getSignList(
          { checkedNft, checkedTokenList: checkedToken, fromAddress: currentWallet?.publicKey },
          ethWeb3,
          gasPriceCon
        );
        if (signListTemp?.length != 0) {
          // setSignIndex(0);
          // setSignList(signListTemp);
          updateState({
            signIndex: 0,
            signList: signListTemp
          });
        }
      }
    }
  }

  // update ethPrice
  useEffect(() => {
    if (checkedChainId) {
      const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId: checkedChainId })?.chainAssetsType;
      if (chainAssetsType && assetsDefaultToken?.[chainAssetsType] && assetsDefaultToken?.[chainAssetsType]?.price) {
        updateState({
          ethPrice: Number(assetsDefaultToken?.[chainAssetsType]?.price)
        });
      }
    }
  }, [checkedChainId, assetsDefaultToken]);

  useEffect(() => {
    const checkedTokenList = checkedToken.filter((o) => o.value && Number(o.value) > 0);
    if (checkedNft?.length == 1 && checkedTokenList?.length == 0) {
      getOneNftFeeDetail();
    } else if (checkedNft?.length == 0 && checkedTokenList?.length == 1) {
      getOneTokenFeeDetail();
    } else {
      getMultiFeeDetail();
      getMultiSignList();
    }
  }, [toAddress, JSON.stringify(checkedToken), JSON.stringify(checkedNft), checkedChainId, balanceType]);

  console.log('ConfirmView', assetsDefaultToken, signList);

  return (
    <BasePopup
      visible={confirmViewVisible}
      setVisible={(value) => {
        updateState({
          nextLoading: false,
          resultContent: undefined,
          createBtnLoading: false,
          confirmViewVisible: value
        });
      }}
      title="Review"
      hideClose={isTimeout && !isPc ? false : createBtnLoading}
    >
      <div className={styles.confirm_view_wrapper}>
        <div className={styles.selected_header}>
          <div className={styles.title_item}>
            <div className={styles.title_text}>From</div>
            <div className={styles.wallet_value}>
              {balanceType === 1 ? (
                <>
                  <img src={`/image/icon/spd_icon.png`} className={styles.chain_icon} width={22} height={22} />
                  Spending balance
                </>
              ) : (
                <>
                  <img
                    src={`/image/token/chain_${getChainName(checkedChainId)}.png`}
                    className={styles.chain_icon}
                    width={22}
                    height={22}
                  />
                  {addressOmitShow(authedAccountInfo?.publicKey)}
                </>
              )}
            </div>
          </div>
          <div className={`${styles.title_item} ${styles.send_to_item}`}>
            <div className={styles.title_text}>Send to</div>
            <div className={styles.wallet_value}>
              <UserAvatar
                name={toPeople?.name}
                src={toPeople?.icon}
                size="1.375"
                borderRadius="50%"
                className={styles.chain_icon}
              />
              {balanceType === 1 ? 'Spending account' : addressOmitShow(toAddress)}
            </div>
          </div>
          {balanceType === 1 ? (
            history.location.query?.paycode && history.location.query?.spd?.toString() === '1' ? (
              <></>
            ) : (
              <div className={styles.selected_title}>
                {tipIcon}Recipient needs to accept.{' '}
                <span
                  className={styles.value}
                  onClick={() => {
                    updateState({ recipientTipVisible: true });
                  }}
                >
                  Learn more
                </span>
              </div>
            )
          ) : (
            <>
              {(gasFee || gasLoading) && (
                <div className={styles.title_item}>
                  <div className={styles.title_value}>{tipIcon}Estimated gas fee:</div>
                  <div className={styles.title_value}>
                    {gasLoading && LoadingOutlinedIcon}
                    {gasFee === -1 ? (
                      'Cannot be estimated'
                    ) : (
                      <>
                        {gasFee ? MathUtil_numberFixed(gasFee, 6) : ''}{' '}
                        {getDefaultToken({ chainId: checkedChainId })?.symbol}{' '}
                        {ethPrice && gasFee ? `($${MathUtil_numberFixed(gasFee * ethPrice, 2, 'floor')})` : ''}
                      </>
                    )}
                  </div>
                </div>
              )}
              <div className={styles.title_item}>
                {(isInsuffBalance || isInsuffGas) && (
                  <div
                    className={styles.in_error_msg}
                    onClick={() => {
                      if (balanceType === 2) {
                        const chainAssetsType = find(WALLET_CHAIN_CONFIG, { chainId: checkedChainId })?.chainAssetsType;
                        if (isInsuffGas && chainAssetsType) {
                          dispatch({
                            type: 'store/setBuyToken',
                            payload: { buyToken: assetsDefaultToken?.[chainAssetsType] }
                          });
                        }
                        dispatch({
                          type: 'store/setInsufficientVisible',
                          payload: { visible: true, hideInsuffSwitch: isInsuffGas ? true : false }
                        });
                      }
                    }}
                  >
                    {isInsuffGas ? 'Insufficient gasfee' : 'Insufficient balance'}
                    {balanceType === 2 && errorArrowIcon}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className={styles.selected_content}>
          <div className={styles.title_item}>
            <div className={styles.title_text}>Selected</div>
            <div className={styles.title_value}>
              {checkedToken?.length > 0 ? (
                <>
                  <span>{checkedToken?.length}</span>&nbsp;Token
                </>
              ) : (
                ''
              )}
              {checkedToken?.length > 0 && checkedNft?.length > 0 ? ' and ' : ''}
              {checkedNft?.length > 0 ? (
                <>
                  <span>&nbsp;{checkedNft?.length}</span>&nbsp;NFT
                </>
              ) : (
                ''
              )}
            </div>
          </div>
          <div className={styles.list}>
            {checkedToken?.map((tokenItem: any) => {
              let signItem = find(signList, (o) => o?.address?.toUpperCase() === tokenItem?.address?.toUpperCase());
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
                    {tokenItem?.price && tokenItem?.price !== 0 && tokenItem?.price !== '0' ? (
                      <div className={styles.record_price_value}>
                        {tokenItem?.price && tokenItem?.value
                          ? `$${MathUtil_numberFixed(Number(tokenItem?.price) * Number(tokenItem?.value), 2, 'floor')}`
                          : ''}
                      </div>
                    ) : (
                      ''
                    )}
                  </div>
                  <SignedItem signItem={signItem} />
                </div>
              );
            })}
            {checkedNft?.map((nftItem: any) => {
              let signItem = find(
                signList,
                (o) => o?.address?.toUpperCase() === nftItem?.contractAddress?.toUpperCase()
              );
              return (
                <div className={styles.record_item} key={nftItem?.contractAddress + nftItem?.id}>
                  <div className={styles.record_item_icon}>
                    <NftIcon {...nftItem} />
                  </div>
                  <div className={styles.record_item_info}>
                    <div className={styles.record_value}>#{nftItem?.id}</div>
                    <div className={styles.record_price_value}>
                      {nftItem?.collection}&nbsp;·&nbsp;{nftItem?.type === 1 ? 'ERC 721' : 'ERC 1155'}
                    </div>
                  </div>
                  <SignedItem signItem={signItem} />
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.action}>
          {resultContent && (
            <div className={styles.error_msg}>
              {errorTipIcon}
              {resultContent}
            </div>
          )}
          {createBtnLoading ? (
            <div className={styles.action_loading}>
              {balanceType === 2 && (
                <div className={styles.action_loading_text}>
                  Please process it in your wallet
                  {isTimeout && !isPc && (
                    <div className={styles.retry_btn} onClick={onConfirm}>
                      {retryIcon}Retry
                    </div>
                  )}
                </div>
              )}
              <div className={styles.action_loading_btn}>{LoadingOutlinedIcon}</div>
            </div>
          ) : (
            <Button
              className={`default_btn confirm_btn ${
                checkedToken?.length + checkedNft?.length > 0 && !(isInsuffBalance || isInsuffGas) ? '' : 'disabled'
              }`}
              onClick={onConfirm}
              disabled={
                checkedToken?.length + checkedNft?.length > 0 && !(isInsuffBalance || isInsuffGas) ? false : true
              }
            >
              <div className="create_btn_text">{!authedAccountInfo ? 'Connect Wallet' : 'Confirm'}</div>
            </Button>
          )}
        </div>
      </div>
    </BasePopup>
  );
};

export default ConfirmView;

const SignedItem = ({ signItem }: any) => {
  return (
    <div className={styles.record_item_approve}>
      {signItem?.status === 1 && <>{tipLineIcon}Unauthorized</>}
      {signItem?.status === 2 && (
        <div>
          {LoadingOutlinedIcon}
          Pending approval
        </div>
      )}
      {signItem?.status === 3 && (
        <div className={styles.authed}>
          {checkedLineIcon}
          Approved
        </div>
      )}
    </div>
  );
};
