import styles from '../index.less';
import {
  addressOmitShow,
  MathUtil_numberFixed,
  errorArrowIcon,
  getViewScanUrl,
  payRecordIcon,
  buyHistoryIcon,
  linkJupIcon,
  changeIframeSrc,
  LoadingOutlinedIcon,
  checkSourceType
} from '@/utils';
import { useDispatch } from 'dva';
import { getDefaultToken } from '@/services';
import { Button } from 'antd';
import TokenInput from '@/components/create-assets/token_input';
import TokenIcon from '@/components/token-icon';
import { SPD_WEB_URL } from '@/constants';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import PaymentMethodPopup from '@/components/payment-method-popup';
import { useColDetailStore, useOtherDetailStore } from '../store';
import { useOtherDetail } from '../use-other-detail';

const AssetsOther = ({}: any) => {
  const dispatch = useDispatch();
  const { onConfirmClick, createPaymentOrder, onConfirm } = useOtherDetail();

  const orderInfo = useColDetailStore((state) => state.orderInfo);
  const balanceType = useColDetailStore((state) => state.balanceType);
  const receiveInfo = useColDetailStore((state) => state.receiveInfo);
  const isWalletInsuff = useColDetailStore((state) => state.isWalletInsuff);
  const isSpdInsuff = useColDetailStore((state) => state.isSpdInsuff);
  const payToken = useColDetailStore((state) => state.payToken);
  const shortUsd = useColDetailStore((state) => state.shortUsd);
  const isInsuffGas = useColDetailStore((state) => state.isInsuffGas);
  const gasFees = useColDetailStore((state) => state.gasFees);
  const gasLoadings = useColDetailStore((state) => state.gasLoadings);
  const createBtnLoading = useColDetailStore((state) => state.createBtnLoading);
  const updateState = useColDetailStore((state) => state.updateState);

  const ethPrice = useOtherDetailStore((state) => state.ethPrice);
  const paymentVisible = useOtherDetailStore((state) => state.paymentVisible);
  const confirmLoading = useOtherDetailStore((state) => state.confirmLoading);
  const updateOtherState = useOtherDetailStore((state) => state.updateOtherState);

  function onShortClick() {
    dispatch({
      type: 'store/setBuyToken',
      payload: {
        buyToken: {
          address: orderInfo?.tokenAddress,
          symbol: orderInfo?.tokenSymbol,
          name: orderInfo?.tokenSymbol,
          chainId: orderInfo?.chainId
        }
      }
    });
    dispatch({
      type: 'store/setInsufficientVisible',
      payload: {
        visible: true,
        hideInsuffSwitch: false,
        insuffInfo: {
          address: orderInfo?.tokenAddress,
          amount: shortUsd,
          spd: orderInfo?.spd,
          chainId: orderInfo?.chainId,
          usdIds: orderInfo?.usdIds
        }
      }
    });
  }

  function onInsuffGasClick(chaiIdKey: string) {
    dispatch({
      type: 'store/setBuyToken',
      payload: {
        buyToken: getDefaultToken({
          chainId: Number(chaiIdKey)
        })
      }
    });
    dispatch({
      type: 'store/setInsufficientVisible',
      payload: {
        visible: true,
        hideInsuffSwitch: true
      }
    });
  }

  // console.log('assets-other', orderInfo);

  return (
    <>
      {/* Payment record */}
      {receiveInfo?.status === 3 && !receiveInfo?.markpay && (
        <div className={styles.payer_view}>
          {/* title */}
          <div className={styles.payer_title}>
            <div className={styles.payer_item_title}>{buyHistoryIcon}Payment record</div>
          </div>
          {/* Payment */}
          <div className={styles.payment_record_list}>
            <div className={`${styles.payer_payment_item} payer_payment_item`}>
              <div className={styles.payment_item_left}>
                <div className={styles.payment_item_title}>Payment</div>
                <div className={styles.payment_item_from}>
                  {receiveInfo?.spd && (receiveInfo?.txId === '' || !receiveInfo?.txId)
                    ? 'From: Spending account'
                    : 'From: ' + addressOmitShow(receiveInfo?.userAddress)}
                </div>
                {receiveInfo?.txFee ? (
                  <div className={styles.payment_item_from}>
                    {`Gas fee: ${MathUtil_numberFixed(receiveInfo?.txFee, 6, 'floor')} ${
                      getDefaultToken({ chainId: receiveInfo?.chainId })?.symbol
                    } ($${MathUtil_numberFixed(receiveInfo?.txFeeUsd, 2, 'floor')})`}
                  </div>
                ) : null}
              </div>
              <div
                className={styles.payment_item_right}
                onClick={(e) => {
                  if (receiveInfo?.txId) {
                    const url = getViewScanUrl(orderInfo.chainId || 1);
                    window.open(`${url}tx/${receiveInfo?.txId}`);
                  } else {
                    const sourceType = checkSourceType();
                    let url = `${SPD_WEB_URL}/transaction?type=0&${sourceType === 'SDN' ? 'st=sdn' : 'st=sdm'}`;
                    const isSdm = getPlatformInfo()?.isSdm;
                    if (sourceType === 'SDN' && !isSdm) {
                      changeIframeSrc(url);
                    } else {
                      window.location.href = url;
                    }
                  }
                  e.stopPropagation();
                }}
              >
                <div className={styles.payment_item_token}>
                  <div className={styles.payment_stack_token}>
                    <TokenIcon
                      symbol={orderInfo?.tokenSymbol}
                      icon={orderInfo?.tokenIcon}
                      chainId={orderInfo?.chainId}
                      showChainIcon
                    />
                  </div>
                  {receiveInfo?.amount}
                  {<div className={styles.link}>{linkJupIcon}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {[0, 4].indexOf(receiveInfo?.status) >= 0 && (
        <div className={styles.payer_view}>
          {/* title */}
          <div className={styles.payer_title}>
            <div className={styles.payer_item_title}>{payRecordIcon}Payment method</div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <TokenInput
              token={payToken}
              balanceType={payToken?.balanceType ?? 2}
              onChangeOne={() => {}}
              inputReadonly={true}
            />
          </div>
          {/* gas */}
          {!isWalletInsuff &&
            gasLoadings?.[orderInfo?.chainId] !== undefined &&
            gasFees?.[orderInfo?.chainId] !== undefined &&
            !isInsuffGas?.[orderInfo?.chainId] && (
              <div className={styles.gas_value}>
                <div>Estimated gas fee:</div>
                <div>
                  {gasLoadings?.[orderInfo?.chainId] && LoadingOutlinedIcon}
                  {gasFees?.[orderInfo?.chainId] === -1 ? (
                    'Cannot be estimated'
                  ) : (
                    <>
                      {gasFees?.[orderInfo?.chainId] ? MathUtil_numberFixed(gasFees?.[orderInfo?.chainId], 6) : ''}{' '}
                      {
                        getDefaultToken({
                          chainId: orderInfo?.chainId
                        })?.symbol
                      }{' '}
                      {ethPrice && gasFees?.[orderInfo?.chainId]
                        ? `($${MathUtil_numberFixed(gasFees?.[orderInfo?.chainId] * ethPrice, 2, 'floor')})`
                        : ''}
                    </>
                  )}
                </div>
              </div>
            )}
          {!orderInfo?.spd && isInsuffGas?.[orderInfo?.chainId] && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <div
                className={styles.gas_error_msg}
                onClick={() => {
                  onInsuffGasClick(orderInfo?.chainId);
                }}
              >
                <div>Insufficient gas fee: A minimum of $30 in</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {
                    getDefaultToken({
                      chainId: orderInfo?.chainId
                    })?.symbol
                  }{' '}
                  is recommended, click to solve {errorArrowIcon}
                </div>
              </div>
            </div>
          )}
          {/* Pay Btn */}
          {createBtnLoading ? (
            <div className={styles.action_loading}>
              {balanceType === 2 && <div className={styles.action_loading_text}>Please process it in your wallet</div>}
              <div className={styles.action_loading_btn}>{LoadingOutlinedIcon}</div>
            </div>
          ) : (
            <Button
              className={`default_btn confirm_btn ${
                createBtnLoading ||
                confirmLoading ||
                (!orderInfo?.spd && isWalletInsuff) ||
                (orderInfo?.spd && isWalletInsuff && isSpdInsuff)
                  ? styles.disabled
                  : ''
              }`}
              disabled={
                createBtnLoading ||
                confirmLoading ||
                (!orderInfo?.spd && isWalletInsuff) ||
                (orderInfo?.spd && isWalletInsuff && isSpdInsuff)
              }
              onClick={() => {
                if (orderInfo?.id) {
                  onConfirmClick();
                } else {
                  createPaymentOrder();
                }
              }}
            >
              <div className="confirm_btn_text">
                {(createBtnLoading || confirmLoading) && LoadingOutlinedIcon}
                Pay
              </div>
            </Button>
          )}
          {/* Insufficient Balance */}
          {((!orderInfo?.spd && isWalletInsuff) || (orderInfo?.spd && isWalletInsuff && isSpdInsuff)) && (
            <div
              className={`${styles.maker_receive_detail} ${styles.error_usd_msg}`}
              onClick={() => {
                onShortClick();
              }}
            >
              {shortUsd} {orderInfo?.tokenSymbol} short, click to solve{errorArrowIcon}
            </div>
          )}
        </div>
      )}

      <PaymentMethodPopup
        visible={paymentVisible}
        setVisible={() => {
          updateOtherState({ paymentVisible: false });
        }}
        ethPrice={ethPrice}
        onConfirm={(value: string) => {
          updateState({
            leavingMsg: value
          });
          onConfirm();
        }}
      />
    </>
  );
};

export default AssetsOther;
