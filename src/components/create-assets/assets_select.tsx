import { useDispatch, useSelector } from 'dva';
import TokenIcon from '@/components/token-icon';
import { useMultiWallet } from '@/lib/wallet-selector';
import { TokenSelector } from '@/types';
import './index.less';
import styles from './index.less';
import AssetsCommonPage from './common';
import { downOutIcon, addressOmitShow, LoadingOutlinedIcon, isNativeToken } from '@/utils';

type IProps = {
  token?: TokenSelector;
  setToken: (value: TokenSelector) => void;
  balanceType: number;
  setBalanceType: (value: number) => void;
  isReceive?: boolean;
  hideBalanceTypeMenu?: boolean;
  hideBalance?: boolean;
  isSetCreateToken?: boolean;
  createKey?: string;
  isContainUSD?: boolean;
};
const AssetsTokenSelect = (props: IProps) => {
  const dispatch = useDispatch();
  const { token, setToken, balanceType, setBalanceType, hideBalance, isReceive } = props;
  const { loading: walletLoading } = useMultiWallet();
  const { tokenSelectorVisible } = useSelector((state: any) => state.store);

  function setTokenSelector(value: boolean) {
    dispatch({
      type: 'store/setTokenSelectorVisible',
      payload: value
    });
  }

  return (
    <>
      <div className={styles.token_item_select} onClick={() => setTokenSelector(true)}>
        <div className={styles.token_item_content}>
          <div className={styles.item_input_title}>
            <div className={styles.token_name_icon}>
              {walletLoading ? (
                LoadingOutlinedIcon
              ) : token ? (
                <TokenIcon {...token} showChainIcon={token?.address === 'USD' ? false : true} />
              ) : (
                LoadingOutlinedIcon
              )}
            </div>
            <div className={styles.token_right}>
              <div className={styles.token_symbol}>{token?.symbol}</div>
              {!hideBalance && (
                <div className={styles.token_item_balance}>
                  {balanceType === 1 && <>Spending Balance: {token?.spendingValue}</>}
                  {balanceType === 2 && <>Wallet Balance: {token?.balanceValue}</>}
                </div>
              )}
              {isReceive && (
                <div className={styles.token_item_balance}>
                  {token?.address && token?.address !== 'USD' && !isNativeToken(token?.address)
                    ? addressOmitShow(token?.address)
                    : ''}
                </div>
              )}
            </div>
          </div>
        </div>
        <div
          className={`${styles.token_item_change} ${tokenSelectorVisible ? styles.upOutArrow : styles.downOutArrow}`}
        >
          {downOutIcon}
        </div>
      </div>
      <AssetsCommonPage
        {...props}
        setToken={(value: any) => {
          setToken(value);
          if (value.balanceType) {
            setBalanceType(value.balanceType);
          }
        }}
        hideNftTab={true}
      />
    </>
  );
};

export default AssetsTokenSelect;
