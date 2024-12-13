import { Input } from 'antd-mobile';
import styles from './index.less';
import FullScreenPop from '../fullscreen-popup';
import { TokenInfo, TokenSelector } from '@/types';
import { message, Button } from 'antd';
import { useState } from 'react';
import { LocalStorage_get, LocalStorage_set, LeftOutlinedIcon } from '@/utils';
import { LOCAL_CREATED_TOKEN } from '@/constants';
import { CurrentWalletProps } from '@/lib/wallet-selector/types';
import { history } from 'umi';
import AssetsTokenChange from '../create-assets/assets_change';
import FromWalletBack from '@/components/page-nav-bar/from-wallet-back';
import { useSelector } from 'dva';
import { join } from 'lodash';

type IPops = {
  visible: boolean;
  setVisible: (value: boolean) => void;
  token?: TokenInfo | undefined;
  setUsdIds: any;
  setToken: (value: TokenInfo) => void;
  tokenAmount: string | undefined;
  setTokenAmount: (value: string | undefined) => void;
  leavingMsg: string;
  setLeavingMsg: (value: string) => void;
  collectionAccount: CurrentWalletProps;
};

const PaymentAmount = (props: IPops) => {
  const { authedAccountInfo } = useSelector((state: any) => state.store);
  const { usdTokenList } = useSelector((state: any) => state.assets);
  const {
    visible,
    setVisible,
    token,
    setToken,
    setUsdIds,
    tokenAmount,
    setTokenAmount,
    leavingMsg,
    setLeavingMsg,
    collectionAccount
  } = props;

  const [leavingMsgBak, setLeavingMsgBak] = useState<string>(leavingMsg);
  const [tokenBak, setTokenBak] = useState<TokenInfo | undefined>(token);
  const [tokenAmountBak, setTokenAmountBak] = useState<string | undefined>(tokenAmount);

  // console.log('PaymentAmount', token, tokenBak);

  return (
    <FullScreenPop visible={visible} setVisible={setVisible}>
      <div className={styles.wrapper}>
        <div className="header">
          <div className="titleBox">
            {history.location.query?.from === 'wallet' ? (
              <FromWalletBack />
            ) : (
              <div className="closeBtn" onClick={() => setVisible(false)}>
                {LeftOutlinedIcon}
              </div>
            )}

            <div className="title">Set Amount</div>
            <div className="closeBtn"></div>
          </div>
        </div>
        <div className={styles.content}>
          <AssetsTokenChange
            token={tokenBak ? { ...tokenBak, id: tokenBak?.address, value: tokenAmountBak } : undefined}
            presetToken={token}
            setToken={setTokenBak}
            onChangeVaule={(value: any) => {
              setTokenAmountBak(value === '' ? undefined : value);
            }}
            balanceType={2}
            setBalanceType={() => {}}
            hideBalanceTypeMenu={true}
            hideNftTab={true}
            isReceive={true}
            isSetCreateToken={true}
            createKey="receive"
            isContainUSD={true}
            classNames={styles.token_change}
          />
          <div className={styles.item_input}>
            <Input
              value={leavingMsgBak}
              onChange={(value) => setLeavingMsgBak(value)}
              onEnterPress={() => {
                if (tokenAmountBak) {
                  setVisible(false);
                } else {
                  message.error('Add Note');
                  return;
                }
              }}
              maxLength={50}
              placeholder="Add Note"
              style={{ '--text-align': 'left', '--placeholder-color': '#666666' }}
            />
          </div>
        </div>
        <div className={styles.footer}>
          <Button
            className="default_btn confirm_btn"
            onClick={() => {
              let checkedToken = tokenBak;
              if (checkedToken) {
                if (checkedToken.address === 'USD') {
                  const checkedUsdTokenList = usdTokenList?.filter((o: any) => {
                    // if (authedAccountInfo?.chainId) {
                    //   return o.chainId === authedAccountInfo?.chainId && o.isChecked;
                    // } else {
                    return o.isChecked;
                    // }
                  });
                  const checkedUsdTokenListLen = checkedUsdTokenList?.length;
                  if (checkedUsdTokenListLen <= 0) {
                    message.error('USD is empty');
                    return;
                  } else if (checkedUsdTokenListLen === 1) {
                    checkedToken = checkedUsdTokenList?.[0];
                  } else {
                    setUsdIds(
                      join(
                        checkedUsdTokenList?.map((o: TokenSelector) => o?.id),
                        ','
                      )
                    );
                  }
                }
                if (checkedToken) {
                  setToken(checkedToken);
                  // start ---set created token
                  let createdToken = JSON.parse(LocalStorage_get(LOCAL_CREATED_TOKEN) ?? '{}');
                  createdToken![`${collectionAccount?.chainId}-receive`] = {
                    symbol: checkedToken?.symbol,
                    address: checkedToken?.address,
                    name: checkedToken?.symbol,
                    decimals: checkedToken?.decimals,
                    chainType: 'eth',
                    chainId: collectionAccount?.chainId,
                    icon: checkedToken?.icon
                  };
                  LocalStorage_set(LOCAL_CREATED_TOKEN, JSON.stringify(createdToken));
                  // end ---set created token
                }
              }
              setTokenAmount(tokenAmountBak);
              setLeavingMsg(leavingMsgBak);
              setVisible(false);
            }}
          >
            OK
          </Button>
        </div>
      </div>
    </FullScreenPop>
  );
};

export default PaymentAmount;
