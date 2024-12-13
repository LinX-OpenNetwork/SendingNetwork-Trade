import { Modal } from 'antd-mobile';
import { Space, Button } from 'antd';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { useMultiWallet } from '@/lib/wallet-selector';
import { toConnectWallet } from '@/utils';
import { useDispatch } from 'umi';

export const useSwitchAccount = () => {
  const dispatch = useDispatch();
  const isPc = getPlatformInfo()?.isPc;
  const { isConnected, onSwitchAccount, onSelectConnectWallet } = useMultiWallet();

  function onSwitchClick() {
    if (isConnected) {
      if (isPc) {
        onSwitchAccount();
      } else {
        Modal.show({
          className: 'base_confirm_modal',
          content: (
            <div className="content">
              <div>On the mobile, you need to switch accounts in the Wallet App by yourself.</div>
              <div className="actions">
                <Space size={13}>
                  <Button
                    className="default_btn confirm_btn"
                    onClick={() => {
                      Modal.clear();
                    }}
                  >
                    OK
                  </Button>
                </Space>
              </div>
            </div>
          ),
          getContainer: () => document?.getElementById('tp-wrapper')
        });
      }
    } else {
      toConnectWallet(dispatch, { connectWallet: onSelectConnectWallet });
    }
  }
  return { isConnected, onSwitchClick };
};
