import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { find } from 'lodash';
import { ETH_SUPPORTED_CHAINS } from '@/constants';
import { useSelector } from 'dva';
import { showSelfAssets, closeBrowserMobile, LeftOutlinedIcon } from '@/utils';
import { message } from 'antd';
import './index.less';

const FromWalletBack = () => {
  const { authedAccountInfo } = useSelector((state: any) => state.store);

  return (
    <div className={`left_content from_wallet_left_content`}>
      <div
        className="back_btn back_text"
        onClick={() => {
          const isSdm = getPlatformInfo()?.isSdm;
          const chainInfo = find(ETH_SUPPORTED_CHAINS, {
            chain_id: authedAccountInfo?.chainId
          });
          let network = chainInfo?.sdm_wallet || 'ethereum';
          if (isSdm) {
            closeBrowserMobile();
          } else {
            if (self === top) {
              message.error('Open in Sendingme');
              return;
            } else {
              showSelfAssets('tokens', network);
            }
          }
        }}
      >
        {LeftOutlinedIcon}
        Wallet Assets
      </div>
    </div>
  );
};

export default FromWalletBack;
