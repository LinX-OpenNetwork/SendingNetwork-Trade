import { TokenSelector, TokenInfo } from '@/types';
import styles from '../index.less';
import TokenInput from '@/components/create-assets/token_input';
import { cloneDeep, groupBy, uniqBy, find, flatMap } from 'lodash';
import { message, Button } from 'antd';
import { useDispatch, useSelector } from 'dva';
import {
  LocalStorage_get,
  payRecordIcon,
  MathUtil_numberFixed,
  buyHistoryIcon,
  errorArrowIcon,
  expandIcon,
  LoadingOutlinedIcon,
  PlusOutlinedIcon,
  MathUtil_minus
} from '@/utils';
import AssetsLoading from '@/components/create-assets/assets_loading';
import { WALLET_IMAGE_LIST, WALLET_CHAIN_CONFIG, LOCAL_WALLET_NAME } from '@/constants';
import { useMultiWallet } from '@/lib/wallet-selector';
import AssetsSelect from '@/components/assets-select';
import { getDefaultToken } from '@/services';
import PaymentRecord from './payment-record';
import { useColDetailStore, useUsdDetailStore } from '../store';
import { useUsdDetail } from '../use-usd-detail';

const AssetsUsd = ({}: any) => {
  const dispatch = useDispatch();
  const { isConnected } = useMultiWallet();
  const { tokenSelectorVisible } = useSelector((state: any) => state.store);
  const { billUsdTokenLoading, assetsDefaultToken } = useSelector((state: any) => state.assets);
  const walletValue = LocalStorage_get(LOCAL_WALLET_NAME);
  const { setTokenSelectorVisible, onTokenChangeOne, createPaymentOrder, onComfirm, getBuyUSDToken } = useUsdDetail();

  const orderInfo = useColDetailStore((state) => state.orderInfo);
  const shortUsd = useColDetailStore((state) => state.shortUsd);
  const payUsdTokensLoading = useColDetailStore((state) => state.payUsdTokensLoading);
  const receiveInfo = useColDetailStore((state) => state.receiveInfo);
  const isInsuffGas = useColDetailStore((state) => state.isInsuffGas);
  const gasLoadings = useColDetailStore((state) => state.gasLoadings);
  const gasFees = useColDetailStore((state) => state.gasFees);
  const updateState = useColDetailStore((state) => state.updateState);

  const isCustom = useUsdDetailStore((state) => state.isCustom);
  const sltIndex = useUsdDetailStore((state) => state.sltIndex);
  const checkedToken = useUsdDetailStore((state) => state.checkedToken);
  const confirmLoading = useUsdDetailStore((state) => state.confirmLoading);
  const confirmDisabled = useUsdDetailStore((state) => state.confirmDisabled);
  const checkedAttr = useUsdDetailStore((state) => state.checkedAttr);
  const payUsdTotal = useUsdDetailStore((state) => state.payUsdTotal);
  const updateUsdState = useUsdDetailStore((state) => state.updateUsdState);

  function onShortUsdClick() {
    getBuyUSDToken();
    // getSwapUSDToken();
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

  function onInsuffGasClick(chainIdKey: string) {
    dispatch({
      type: 'store/setBuyToken',
      payload: { buyToken: getDefaultToken({ chainId: Number(chainIdKey) }) }
    });
    dispatch({
      type: 'store/setInsufficientVisible',
      payload: { visible: true, hideInsuffSwitch: true }
    });
  }

  // console.log('AssetsUsd-processList', payUsdTotal);

  return (
    <>
      {/* Payment record */}
      {receiveInfo?.transferDetails?.filter((o: any) => o.status !== 0 && !o.markpay)?.length > 0 && (
        <div className={styles.payer_view}>
          {/* title */}
          <div className={styles.payer_title}>
            <div className={styles.payer_item_title}>{buyHistoryIcon}Payment record</div>
          </div>
          {/* Payment */}
          <PaymentRecord sltRecord={receiveInfo} />
          {receiveInfo?.status !== 3 && (
            <div className={styles.payer_payment_unpaid}>
              <div className={styles.payer_payment_unpaid_title}>Unpaid</div>
              <div className={styles.payer_payment_unpaid_value}>{receiveInfo?.notPaid} USD</div>
            </div>
          )}
        </div>
      )}
      {[0, 4].indexOf(receiveInfo?.status) >= 0 && (
        <div className={styles.payer_view}>
          {/* title */}
          <div className={styles.payer_title}>
            <div className={styles.payer_item_title}>{payRecordIcon}Payment method</div>
            {!payUsdTokensLoading && !billUsdTokenLoading && (
              <div className={styles.payer_item_action}>
                {isCustom ? (
                  <div className={styles.assets_custom_btn}>
                    <div className={styles.assets_add} onClick={() => setTokenSelectorVisible(true)}>
                      {PlusOutlinedIcon}Add
                    </div>
                    <div
                      className={styles.assets_done}
                      onClick={() => {
                        const flatTokens = flatMap(checkedToken);
                        if (
                          flatTokens?.filter((o: any) => !o.value || o.value === '' || Number(o.value) <= 0)?.length > 0
                        ) {
                          message.error('Please input the amount or remove the item');
                          return;
                        }
                        updateState({ payUsdTokens: checkedToken });
                        updateUsdState({ isCustom: false });
                      }}
                    >
                      Done
                    </div>
                  </div>
                ) : (
                  <div
                    className={styles.assets_custom_btn}
                    onClick={() => {
                      updateUsdState({ isCustom: true });
                    }}
                  >
                    Custom
                  </div>
                )}
              </div>
            )}
          </div>
          {/* content */}
          {payUsdTokensLoading || billUsdTokenLoading ? (
            <AssetsLoading style={{ marginBottom: '16px' }} />
          ) : (
            <>
              <div className={styles.payer_input_list}>
                {/* from spd */}
                {checkedToken?.spdTokens?.length > 0 && (
                  <div className={styles.payer_spd}>
                    <div
                      className={`${styles.payer_input_title} ${styles.flex_space_between}`}
                      onClick={() => {
                        updateUsdState({ checkedAttr: { ...checkedAttr, isSpdExpand: !checkedAttr?.isSpdExpand } });
                      }}
                    >
                      <div>
                        <span>From</span>
                        <img src={`/image/icon/spd_icon.png`} width={18} height={18} />
                        Spending account
                      </div>
                      <div
                        className={`${styles.payer_input_expand} ${checkedAttr?.isSpdExpand ? styles.up_expand : ''}`}
                      >
                        {checkedAttr?.spdTotal ? `$${checkedAttr?.spdTotal}` : ''}
                        {expandIcon}
                      </div>
                    </div>
                    {checkedAttr?.isSpdExpand &&
                      checkedToken?.spdTokens?.map((item: TokenSelector, index: number) => {
                        return (
                          <div key={item?.address}>
                            <TokenInput
                              index={index}
                              token={item}
                              setSltIndex={(value) => {
                                updateUsdState({ sltIndex: value });
                              }}
                              balanceType={1}
                              onChangeOne={(index: number, key: string, value?: any) => {
                                onTokenChangeOne('spdTokens', index, key, value);
                              }}
                              showChecked={isCustom}
                              showChange={isCustom}
                              inputReadonly={!isCustom}
                              isActive={isCustom && checkedAttr?.isSpdExpand}
                            />
                          </div>
                        );
                      })}
                  </div>
                )}
                {/* from wallet */}
                {checkedToken?.walletTokens?.length > 0 && (
                  <div>
                    <div
                      className={`${styles.payer_input_title} ${styles.flex_space_between}`}
                      onClick={() => {
                        updateUsdState({
                          checkedAttr: { ...checkedAttr, isWalletExpand: !checkedAttr?.isWalletExpand }
                        });
                      }}
                    >
                      <div>
                        <span>From</span>
                        <img
                          src={
                            isConnected && walletValue
                              ? WALLET_IMAGE_LIST?.[walletValue]
                              : `/image/wallet/sendingme_logo.png`
                          }
                          width={18}
                          height={18}
                        />
                        Wallet account
                      </div>
                      <div
                        className={`${styles.payer_input_expand} ${
                          checkedAttr?.isWalletExpand ? styles.up_expand : ''
                        }`}
                      >
                        {checkedAttr?.walletTotal ? `$${checkedAttr?.walletTotal}` : ''}
                        {expandIcon}
                      </div>
                    </div>
                    {checkedAttr?.isWalletExpand &&
                      Object.keys(groupBy(checkedToken?.walletTokens, 'chainId'))?.map((chainIdKey) => {
                        const chainAssetsType = find(WALLET_CHAIN_CONFIG, {
                          chainId: Number(chainIdKey)
                        })?.chainAssetsType;
                        let ethPrice;
                        if (
                          chainAssetsType &&
                          assetsDefaultToken?.[chainAssetsType] &&
                          assetsDefaultToken?.[chainAssetsType]?.price
                        ) {
                          ethPrice = Number(assetsDefaultToken?.[chainAssetsType]?.price);
                        }
                        return (
                          <div className={styles.payer_input_list_chain} key={chainIdKey}>
                            <div
                              className={`${
                                !isCustom && isInsuffGas?.[chainIdKey] ? styles.payer_insuffgas_disabled : ''
                              }`}
                            >
                              {checkedToken?.walletTokens?.map((item: TokenSelector, index: number) => {
                                if (Number(item?.chainId) === Number(chainIdKey)) {
                                  return (
                                    <div className={styles.payer_input_token} key={item?.address}>
                                      <TokenInput
                                        index={index}
                                        token={item}
                                        setSltIndex={(value) => {
                                          updateUsdState({ sltIndex: value });
                                        }}
                                        balanceType={2}
                                        onChangeOne={(index: number, key: string, value?: any) => {
                                          onTokenChangeOne('walletTokens', index, key, value);
                                        }}
                                        showChecked={isCustom}
                                        showChange={isCustom}
                                        inputReadonly={!isCustom}
                                        isActive={isCustom && checkedAttr?.isWalletExpand}
                                      />
                                    </div>
                                  );
                                } else {
                                  return null;
                                }
                              })}
                            </div>
                            {/* Estimated gas fee */}
                            {gasLoadings?.[chainIdKey] !== undefined &&
                              gasFees?.[chainIdKey] !== undefined &&
                              !isInsuffGas?.[chainIdKey] && (
                                <div className={styles.payer_input_token_gas}>
                                  <div>Estimated gas fee:&nbsp;</div>
                                  {gasLoadings?.[chainIdKey] && LoadingOutlinedIcon}
                                  {gasFees?.[chainIdKey] === -1 ? (
                                    <div>Cannot be estimated</div>
                                  ) : (
                                    <div>
                                      {gasFees?.[chainIdKey] ? MathUtil_numberFixed(gasFees?.[chainIdKey], 6) : ''}{' '}
                                      {getDefaultToken({ chainId: Number(chainIdKey) })?.symbol}{' '}
                                      {ethPrice && gasFees?.[chainIdKey]
                                        ? `($${MathUtil_numberFixed(gasFees?.[chainIdKey] * ethPrice, 2, 'floor')})`
                                        : ''}
                                    </div>
                                  )}
                                </div>
                              )}
                            {/* Insufficient gas fee */}
                            {isInsuffGas?.[chainIdKey] && (
                              <div className={styles.payer_input_token_insuffgas}>
                                <div
                                  className={styles.gas_error_msg}
                                  onClick={() => {
                                    onInsuffGasClick(chainIdKey);
                                  }}
                                >
                                  <div>Insufficient gas fee: A minimum of $30 in</div>
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    {getDefaultToken({ chainId: Number(chainIdKey) })?.symbol} is recommended, click to
                                    solve {errorArrowIcon}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
              {/* action */}
              {[0, 4].indexOf(receiveInfo?.status) >= 0 && (
                <>
                  <Button
                    className={`default_btn confirm_btn ${confirmDisabled || confirmLoading ? 'disabled' : ''}`}
                    // disabled={confirmDisabled || confirmLoading}
                    onClick={() => {
                      if (!confirmDisabled && !confirmLoading) {
                        if (orderInfo?.id) {
                          onComfirm();
                        } else {
                          createPaymentOrder();
                        }
                      }
                    }}
                  >
                    {confirmLoading && LoadingOutlinedIcon}
                    Pay {payUsdTotal ? payUsdTotal : ''} USD
                  </Button>

                  {shortUsd && shortUsd > 0 ? (
                    <div
                      className={`${styles.maker_receive_detail} ${styles.error_usd_msg}`}
                      onClick={() => {
                        onShortUsdClick();
                      }}
                    >
                      {shortUsd} USD short, click to solve{errorArrowIcon}
                    </div>
                  ) : (
                    ''
                  )}
                </>
              )}
            </>
          )}

          {/* selector */}
          <AssetsSelect
            visible={tokenSelectorVisible}
            setVisible={setTokenSelectorVisible}
            checkedTokenList={checkedToken || undefined}
            token={sltIndex !== undefined ? checkedToken[sltIndex] : undefined}
            setToken={(token: TokenInfo, isRePlace?: boolean) => {
              const type = token?.balanceType === 2 ? 'walletTokens' : 'spdTokens';
              if (sltIndex !== undefined) {
                // console.log('xsxs-onChangeOne', token);
                if (!isRePlace) {
                  onTokenChangeOne(type, sltIndex, 'token', {
                    ...token,
                    id: token.symbol,
                    value: (token as TokenSelector)?.value ?? '',
                    isChecked: true
                  });
                }
              } else {
                let tokenListTemp = isRePlace ? [] : cloneDeep(checkedToken?.[type]);
                let tokenPaid;
                const undiff = MathUtil_minus(receiveInfo?.notPaid, payUsdTotal);
                if (Number(token?.balanceValue) > undiff) {
                  tokenPaid = undiff;
                } else {
                  tokenPaid = token?.balanceValue;
                }
                tokenListTemp.push({
                  ...token,
                  id: token.symbol,
                  value: tokenPaid ?? '',
                  isChecked: true
                });
                // console.log('xsxs', tokenListTemp);
                tokenListTemp = uniqBy(tokenListTemp, (o: TokenInfo) => {
                  return o?.address + o?.chainId;
                });
                updateUsdState({ checkedToken: { ...checkedToken, [type]: tokenListTemp } });
              }
            }}
            hideBalanceTypeMenu={!orderInfo?.spd}
            hideNftTab={true}
            isPayUSD={true}
            balanceType={2}
            setBalanceType={() => {}}
          />
        </div>
      )}
    </>
  );
};

export default AssetsUsd;
