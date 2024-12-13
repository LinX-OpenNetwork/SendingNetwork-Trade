import { Popup } from 'antd-mobile';
import { Button } from 'antd';
import './index.less';
import { checkedIcon, unCheckedIcon, getChainName, errorArrowIcon, LoadingOutlinedIcon, closeModalIcon } from '@/utils';
import TokenIcon from '../token-icon';
import { useDispatch } from 'umi';
import { MathUtil_numberFixed } from '@/utils';
import { getDefaultToken } from '@/services';
import { useColDetailStore } from '@/pages/collection-detail/store';

type PaymentMethodPopupProps = {
  visible: boolean;
  setVisible: any;
  onConfirm: any;
  ethPrice: any;
};
const PaymentMethodPopup = (props: PaymentMethodPopupProps) => {
  const dispatch = useDispatch();
  const { visible, setVisible, onConfirm, ethPrice } = props;

  const orderInfo = useColDetailStore((state) => state.orderInfo);
  const balanceType = useColDetailStore((state) => state.balanceType);
  const leavingMsg = useColDetailStore((state) => state.leavingMsg);
  const isWalletInsuff = useColDetailStore((state) => state.isWalletInsuff);
  const isSpdInsuff = useColDetailStore((state) => state.isSpdInsuff);
  const payToken = useColDetailStore((state) => state.payToken);
  const isInsuffGas = useColDetailStore((state) => state.isInsuffGas);
  const gasFees = useColDetailStore((state) => state.gasFees);
  const gasLoadings = useColDetailStore((state) => state.gasLoadings);
  const createBtnLoading = useColDetailStore((state) => state.createBtnLoading);
  const updateState = useColDetailStore((state) => state.updateState);

  function setBalanceType(value: number) {
    updateState({
      balanceType: value
    });
  }

  // console.log('payment', isInsuffGas, balanceType, isSpdInsuff, isWalletInsuff);

  return (
    <Popup
      visible={visible}
      onMaskClick={() => {}}
      bodyStyle={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
      bodyClassName="base_popup_container payment_method_popup_container"
      getContainer={document.getElementById('tp-wrapper')}
    >
      <div className="header">
        <div className="titleBox">
          <div
            className="closeBtn"
            onClick={() => {
              if (!createBtnLoading) {
                setVisible(false);
              }
            }}
          >
            {!createBtnLoading && closeModalIcon}
          </div>
          <div className="title">Payment method</div>
          <div className="closeBtn"></div>
        </div>
      </div>
      <div className="content">
        {orderInfo?.spd && (
          <>
            <div className="form_item_center">
              <div className="form_item_value">
                <div className="item_icon">
                  <TokenIcon {...payToken} />
                  <img
                    src={`/image/token/chain_${getChainName(payToken?.chainId)}.png`}
                    className="chain_icon"
                    width={12}
                    height={12}
                  />
                </div>
                <span>
                  {orderInfo?.payAmount}&nbsp;{payToken?.symbol}
                </span>
              </div>
            </div>
            <div className="form_item">
              <div className="form_item_title">From:</div>
            </div>
            <div
              className={`form_item_method ${balanceType === 1 ? 'active' : ''}`}
              onClick={() => {
                if (!balanceType || balanceType === 2) {
                  setBalanceType(1);
                }
              }}
            >
              <div className="method_value">{balanceType === 1 ? checkedIcon : unCheckedIcon}</div>
              <div className="method_name">
                <div className="method_name_value">Spending balance</div>
                <div className="method_value">
                  {payToken?.spendingValue} {payToken?.symbol}
                </div>
              </div>
            </div>
            <div
              className={`form_item_method ${balanceType === 2 ? 'active' : ''}`}
              onClick={() => {
                if (!balanceType || balanceType === 1) {
                  setBalanceType(2);
                }
              }}
            >
              <div className="method_value">{balanceType === 1 ? unCheckedIcon : checkedIcon}</div>
              <div className="method_name">
                <div className="method_name_value">Wallet balance</div>
                <div className="method_value">
                  {payToken?.balanceValue} {payToken?.symbol}
                </div>
              </div>
            </div>
          </>
        )}
        {balanceType === 2 && (
          <div className="gas_value">
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
        {((balanceType === 1 ? isSpdInsuff : isWalletInsuff) || isInsuffGas?.[orderInfo?.chainId]) && (
          <div
            className="gas_error_msg"
            onClick={() => {
              dispatch({
                type: 'store/setInsufficientVisible',
                payload: {
                  visible: true,
                  hideInsuffSwitch: isInsuffGas?.[orderInfo?.chainId] ? true : false
                }
              });
            }}
          >
            {(balanceType === 1 ? isSpdInsuff : isWalletInsuff) ? 'Insufficient balance' : 'Insufficient gasfee'}
            {balanceType === 2 && errorArrowIcon}
          </div>
        )}
      </div>
      <div className="footer">
        {createBtnLoading ? (
          <div className="action_loading">
            {balanceType === 2 && <div className="action_loading_text">Please process it in your wallet</div>}
            <div className="action_loading_btn">{LoadingOutlinedIcon}</div>
          </div>
        ) : (
          <Button
            className={`default_btn confirm_btn ${
              (balanceType === 1 ? isSpdInsuff : isWalletInsuff) || isInsuffGas?.[orderInfo?.chainId] ? 'disabled' : ''
            }`}
            disabled={isSpdInsuff || isInsuffGas?.[orderInfo?.chainId] ? true : false}
            onClick={() => {
              if (!((balanceType === 1 ? isSpdInsuff : isWalletInsuff) || isInsuffGas?.[orderInfo?.chainId])) {
                onConfirm(leavingMsg);
              }
            }}
          >
            <div className="confirm_btn_text">
              {createBtnLoading && LoadingOutlinedIcon}
              Pay
            </div>
          </Button>
        )}
      </div>
    </Popup>
  );
};

export default PaymentMethodPopup;
