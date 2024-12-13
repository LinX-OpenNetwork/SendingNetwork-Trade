import { useState } from 'react';
import { Dropdown } from 'antd';
import { WALLET_CHAIN_CONFIG, ETH_SUPPORTED_CHAINS } from '@/constants';
import { history } from 'umi';
import { find } from 'lodash';
import { useSelector, useDispatch } from 'dva';
import { expandIcon, getHistoryUrl } from '@/utils';

const ChainSelector = () => {
  const dispatch = useDispatch();
  const { authedAccountInfo } = useSelector((state: any) => state.store);

  const [chainDropdownVisible, setChainDropdownVisible] = useState<boolean>(false);

  const connectedWalletMenus = (
    <div className="dropdown_wallet_content account_wallet">
      <div className="chain_menus">
        {WALLET_CHAIN_CONFIG.map((item) => {
          const fromParam = history.location.query?.from;
          return (
            <div
              className={`chain_menu_item ${authedAccountInfo?.chainId === item?.chainId ? 'active' : ''} ${
                fromParam && ['vault'].indexOf(fromParam?.toString()) >= 0 ? 'disabled' : ''
              }`}
              key={item.chainId}
              onClick={() => {
                dispatch({
                  type: 'store/setAuthedAccountInfo',
                  payload: {
                    ...authedAccountInfo,
                    chainId: item?.chainId
                  }
                });
                setChainDropdownVisible(false);
                if (history.location.pathname === '/buy' && history.location.query?.from === 'wallet') {
                  let chainAssetsType: string | undefined = 'all';
                  if (item?.chainId) {
                    chainAssetsType = find(ETH_SUPPORTED_CHAINS, { chain_id: item?.chainId })?.sdm_wallet;
                  }
                  history.replace(getHistoryUrl(history?.location?.pathname + '?chain=' + chainAssetsType, ['chain']));
                }
              }}
            >
              <img src={item?.chainIcon} className="chain_icon" width={20} height={20} />
              {item.name}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Dropdown
      // overlay={connectedWalletMenus}
      dropdownRender={() => {
        return connectedWalletMenus;
      }}
      placement="bottomRight"
      trigger={['click']}
      open={chainDropdownVisible}
      onOpenChange={setChainDropdownVisible}
      getPopupContainer={(triggerNode: any) => triggerNode?.parentNode}
    >
      <div className={`chain_selector_info ${chainDropdownVisible ? 'active' : ''}`}>
        <div className="chain_text">{find(WALLET_CHAIN_CONFIG, { chainId: authedAccountInfo?.chainId })?.name}</div>
        <div className={`chain_expand ${chainDropdownVisible ? 'rotate180' : ''}`}>{expandIcon}</div>
      </div>
    </Dropdown>
  );
};

export default ChainSelector;
