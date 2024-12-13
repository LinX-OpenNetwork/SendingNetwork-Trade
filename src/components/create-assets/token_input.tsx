import styles from './index.less';
import TokenIcon from '@/components/token-icon';
import { useSelector, useDispatch } from 'dva';
import { useMultiWallet } from '@/lib/wallet-selector';
import { Input } from 'antd-mobile';
import { TokenSelector } from '@/types';
import {
  checkedIcon,
  unCheckedIcon,
  MathUtil_numberFixed,
  downOutIcon,
  addressOmitShow,
  LoadingOutlinedIcon,
  isNativeToken
} from '@/utils';
import { history } from 'umi';

type IProps = {
  index?: number;
  token?: TokenSelector;
  setSltIndex?: any;
  balanceType: number;
  onChangeOne: any;
  showChange?: boolean;
  hideBalance?: boolean;
  isReceive?: boolean;
  showChecked?: boolean;
  inputReadonly?: boolean;
  isActive?: boolean;
  classNames?: any;
};

const TokenInput = (props: IProps) => {
  const {
    index,
    token,
    setSltIndex,
    balanceType,
    onChangeOne,
    showChange,
    hideBalance,
    isReceive,
    showChecked,
    inputReadonly,
    isActive,
    classNames
  } = props;
  const dispatch = useDispatch();
  const { loading: walletLoading } = useMultiWallet();
  const { tokenSelectorVisible } = useSelector((state: any) => state.store);

  function setTokenSelector(value: boolean) {
    dispatch({
      type: 'store/setTokenSelectorVisible',
      payload: value
    });
  }

  // console.log('TokenInput', isReceive);

  return (
    <div className={`${styles.token_item_input_wrapper} ${classNames ?? ''}  ${isActive ? styles.active : ''}`}>
      <div className={`${styles.token_item_container}`}>
        <div className={styles.token_item_content}>
          <div className={styles.token_item_input}>
            <div className={styles.item_input_title}>
              <div
                className={styles.token_name_icon}
                onClick={() => {
                  if (showChange && !history.location.query?.returnId) {
                    setTokenSelector(true);
                    setSltIndex?.(index);
                  }
                }}
              >
                {walletLoading ? (
                  LoadingOutlinedIcon
                ) : token ? (
                  <TokenIcon {...token} showChainIcon={token?.address === 'USD' ? false : true} />
                ) : (
                  LoadingOutlinedIcon
                )}
              </div>
              <div className={styles.token_right}>
                <div className={styles.token_right_name}>
                  <div
                    className={styles.token_right_name_info}
                    onClick={() => {
                      if (showChange && !history.location.query?.returnId) {
                        setTokenSelector(true);
                        setSltIndex?.(index);
                      }
                    }}
                  >
                    <span className={styles.token_symbol}>{token?.symbol}</span>
                    {showChange && !history.location.query?.returnId && (
                      <span
                        className={`${styles.token_change} ${
                          tokenSelectorVisible ? styles.upOutArrow : styles.downOutArrow
                        }`}
                      >
                        {downOutIcon}
                      </span>
                    )}
                  </div>
                  <div className={styles.input}>
                    <Input
                      value={token?.value ? token?.value + '' : ''}
                      onChange={(value) => {
                        if (value.indexOf('.') >= 0 && value.split('.')[1]?.length > 3) {
                          value = value.split('.')[0] + '.' + value.split('.')[1].substring(0, 4);
                        }
                        if ((Number(value) < 0.0001 && value?.length >= 6) || Number(value) < 0) {
                          value = '0.0001';
                        }
                        if (!isReceive) {
                          let balance = balanceType === 1 ? token?.spendingValue : token?.balanceValue;
                          if (balance && Number(value) > Number(balance)) {
                            value = balance + '';
                          } else if (balance === 0 || Number(balance) === 0) {
                            value = '0';
                          }
                        }
                        onChangeOne(index, 'value', value);
                      }}
                      readOnly={inputReadonly ? inputReadonly : !history.location.query?.returnId ? false : true}
                      min={0}
                      type="number"
                      placeholder="0.00"
                      style={{
                        '--text-align': 'right',
                        '--placeholder-color': '#666666'
                      }}
                    />
                  </div>
                </div>
                {!hideBalance && (
                  <div className={styles.token_item_balance}>
                    {isReceive ? (
                      <div>
                        {token?.address && token?.address !== 'USD' && !isNativeToken(token?.address)
                          ? addressOmitShow(token?.address)
                          : ''}
                      </div>
                    ) : (
                      <div>
                        {balanceType === 1 && (
                          <div
                            className={`${
                              Number(token?.value) && Number(token?.value) > Number(token?.spendingValue)
                                ? styles.warning
                                : ''
                            }`}
                          >
                            {token?.spendingValue !== undefined && token?.balanceType !== 0
                              ? `Spending Balance: ${token?.spendingValue}`
                              : ''}
                          </div>
                        )}
                        {balanceType === 2 && (
                          <div
                            className={`${
                              Number(token?.value) && Number(token?.value) > Number(token?.balanceValue)
                                ? styles.warning
                                : ''
                            }`}
                          >
                            {token?.balanceValue !== undefined && token?.balanceType !== 0
                              ? `Wallet Balance: ${token?.balanceValue}`
                              : ''}
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      {token?.value && Number(token?.price) && Number(token?.value)
                        ? `$${MathUtil_numberFixed(Number(token?.price) * Number(token?.value), 2, 'floor')}`
                        : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {showChecked && !history.location.query?.returnId && (
          <div
            className={styles.delete_btn}
            onClick={() => {
              if (token?.isChecked) {
                onChangeOne(index, 'delete');
              }
            }}
          >
            {!token?.isChecked ? unCheckedIcon : checkedIcon}
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenInput;
