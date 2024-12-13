import { TokenInfo, NftSelector } from '@/types';
import { useSelector, useDispatch } from 'dva';
import { Modal } from 'antd-mobile';
import { Space, Button } from 'antd';
import AssetsSelect from '@/components/assets-select';

const AssetsCommonPage = (props: any) => {
  const dispatch = useDispatch();
  const { checkedToken, setToken, balanceType, setBalanceType, setCheckedNft, checkedNft } = props;
  const changeToken = props?.token;

  const { tokenSelectorVisible } = useSelector((state: any) => state.store);

  function assetsTypeSwitchTip(value: TokenInfo | NftSelector, type: string, from: string, onConfirm?: any) {
    Modal.show({
      className: 'base_confirm_modal',
      content: (
        <div className="content">
          <div>
            Not support sending assets from{' '}
            {type === 'balanceType' ? 'spending account and wallet account' : 'multi-chain'} at the same time.
          </div>
          <br />
          <div>
            If you 'confirm', what you have selected will be cleared. If necessary, please send in two transfers.
          </div>
          <div className="actions">
            <Space size={13}>
              <Button
                className="default_btn cancel_btn"
                onClick={() => {
                  Modal.clear();
                }}
              >
                Cancel
              </Button>
              <Button
                className="default_btn confirm_btn"
                onClick={() => {
                  Modal.clear();
                  // console.log('value', value);
                  if (type === 'balanceType') {
                    setBalanceType(value?.balanceType);
                  }
                  if (from === 'token') {
                    setToken(value, true);
                    setCheckedNft([]);
                  } else {
                    onConfirm?.();
                  }
                }}
              >
                Confirm
              </Button>
            </Space>
          </div>
        </div>
      ),
      getContainer: () => document?.getElementById('tp-wrapper')
    });
  }

  function assetsOnlySwitchTip(value: TokenInfo | NftSelector, from: string, onConfirm?: any) {
    Modal.show({
      className: 'base_confirm_modal',
      content: (
        <div className="content">
          <div>Not support sending tokens and nfts at the same time.</div>
          <br />
          <div>
            If you 'confirm', what you have selected will be cleared. If necessary, please send in two transfers.
          </div>
          <div className="actions">
            <Space size={13}>
              <Button
                className="default_btn cancel_btn"
                onClick={() => {
                  Modal.clear();
                }}
              >
                Cancel
              </Button>
              <Button
                className="default_btn confirm_btn"
                onClick={() => {
                  Modal.clear();
                  if (from === 'token') {
                    setToken(value, true);
                    setBalanceType(value?.balanceType);
                    setCheckedNft([]);
                  } else {
                    onConfirm?.();
                  }
                }}
              >
                Confirm
              </Button>
            </Space>
          </div>
        </div>
      ),
      getContainer: () => document?.getElementById('tp-wrapper')
    });
  }

  function setTokenSelector(value: boolean) {
    dispatch({ type: 'store/setTokenSelectorVisible', payload: value });
  }

  // console.log('assets-common', changeToken);

  return (
    <AssetsSelect
      {...props}
      visible={tokenSelectorVisible}
      setVisible={setTokenSelector}
      checkedTokenList={checkedToken || undefined}
      setToken={(token: TokenInfo, isRePlace?: boolean) => {
        if (isRePlace) {
          setToken(token, isRePlace);
          setCheckedNft?.([]);
          if (balanceType !== token.balanceType) {
            setBalanceType?.(token.balanceType);
          }
        } else {
          const checkedChainId =
            checkedNft && checkedNft?.length > 0 ? checkedNft?.[0]?.chainId : checkedToken?.[0]?.chainId;
          if (changeToken && checkedToken?.length === 1 && checkedNft?.length === 0) {
            // change
            setToken(token, isRePlace);
            if (balanceType !== token.balanceType) {
              setBalanceType(token.balanceType);
            }
          } else {
            if (
              checkedChainId &&
              (checkedNft?.length > 0 || checkedToken?.length > 0) &&
              token?.chainId !== checkedChainId
            ) {
              assetsTypeSwitchTip(token, 'chainId', 'token');
            } else if (
              token?.balanceType !== balanceType &&
              (checkedNft?.length > 0 || checkedToken?.filter((o: any) => o.value && Number(o.value) > 0)?.length > 0)
            ) {
              assetsTypeSwitchTip(token, 'balanceType', 'token');
            } else {
              if (checkedNft?.length > 0) {
                assetsOnlySwitchTip(token, 'token');
              } else {
                setToken(token, isRePlace);
                if (balanceType !== token.balanceType) {
                  setBalanceType(token.balanceType);
                }
              }
            }
          }
        }
      }}
      assetsTypeSwitchTip={assetsTypeSwitchTip}
      assetsOnlySwitchTip={assetsOnlySwitchTip}
    />
  );
};

export default AssetsCommonPage;
