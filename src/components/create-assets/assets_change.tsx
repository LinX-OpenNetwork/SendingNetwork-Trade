import { forwardRef, useState } from 'react';
import { TokenInfo, TokenSelector } from '@/types';
import TokenInput from './token_input';
import AssetsCommonPage from './common';
import AssetsLoading from './assets_loading';

type IProps = {
  token?: TokenSelector;
  setToken: (value: TokenInfo) => void;
  balanceType: number;
  setBalanceType: (value: number) => void;
  onChangeVaule: (value: string) => void;
  isReceive?: boolean;
  hideBalanceTypeMenu?: boolean;
  hideBalance?: boolean;
  isSetCreateToken?: boolean;
  createKey?: string;
  hideNftTab?: boolean;
  isContainUSD?: boolean;
  presetToken?: any;
  classNames?: any;
};
const AssetsTokenChange = forwardRef((props: IProps, ref: any) => {
  const { token, setToken, balanceType, setBalanceType, onChangeVaule, isReceive, hideBalance, classNames } = props;

  const [initTokenLoading, setInitTokenLoading] = useState<boolean>(false);

  return (
    <>
      {initTokenLoading ? (
        <AssetsLoading style={{ marginBottom: '15px' }} />
      ) : (
        <TokenInput
          token={token}
          balanceType={balanceType}
          showChange={true}
          onChangeOne={(index: number, key: string, value?: any) => onChangeVaule(value)}
          hideBalance={hideBalance}
          isReceive={isReceive}
          classNames={classNames}
        />
      )}
      <AssetsCommonPage
        {...props}
        setToken={(value: any) => {
          setToken(value);
          if (value.balanceType) {
            setBalanceType(value.balanceType);
          }
        }}
        setInitTokenLoading={setInitTokenLoading}
      />
    </>
  );
});

export default AssetsTokenChange;
