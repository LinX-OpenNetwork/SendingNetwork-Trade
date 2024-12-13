import LoadingMask from '@/components/loading-mask';
import TokenIcon from '@/components/token-icon';
import { TokenInfo } from '@/types';
import { MathUtil_numberFixed, addressOmitShow, getChainName, isNativeToken } from '@/utils';
import { ETH_SUPPORTED_CHAINS } from '@/constants';
import { findIndex } from 'lodash';
import EmptyPanel from './empty-panel';
import './index.less';
import USDItemRender from './usd-selector';
import { useState } from 'react';

type ListPanelPageProps = {
  balanceType?: number;
  loading: boolean;
  searchTokenList: TokenInfo[];
  setToken?: any;
  setVisible: any;
  isReceive?: boolean;
  srcListLength?: any;
  hideEmptyAction?: boolean;
};

const ListPanelPage = (props: ListPanelPageProps) => {
  // console.log('ListPanelPage', balanceType, searchTokenList);
  const { balanceType, loading, searchTokenList, setToken, setVisible, isReceive, srcListLength, hideEmptyAction } =
    props;

  const [usdSelectorVisible, setUsdSelectorVisible] = useState<boolean>(false);

  return (
    <>
      {loading ? (
        <LoadingMask visible={loading} />
      ) : searchTokenList?.length > 0 ? (
        searchTokenList.map((item: TokenInfo, index: number) => {
          if (item?.symbol === 'USD') {
            return (
              <USDItemRender
                data={item}
                visible={usdSelectorVisible}
                setVisible={setUsdSelectorVisible}
                setSelectorVisible={setVisible}
                setToken={setToken}
                key={index}
              />
            );
          }
          return (
            <div
              className="list_token_item"
              key={item?.address + index}
              onClick={() => {
                setToken?.(item);
                setVisible?.(false);
              }}
            >
              <div className="list_token_item_content">
                <div className="token_item_name">
                  <div className="item_icon">
                    <TokenIcon {...item} />
                    <img
                      src={`/image/token/chain_${getChainName(item?.chainId)}.png`}
                      className="chain_icon"
                      width={16}
                      height={16}
                    />
                  </div>
                  <div>
                    <div className="value">{item.symbol}</div>
                    <div
                      className="address_value"
                      onClick={(e) => {
                        if (isNativeToken(item.address)) {
                          return;
                        }
                        let objIndex = findIndex(ETH_SUPPORTED_CHAINS, {
                          chain_id: item.chainId
                        });
                        window.open(`${ETH_SUPPORTED_CHAINS[objIndex].block_explorer_url}token/${item.address}`);
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    >
                      {!isNativeToken(item.address) ? addressOmitShow(item.address) : ''}
                    </div>
                  </div>
                </div>
                {isReceive ? (
                  <div className="token_item_price_value">{item.price ? `$${item.price}` : ''}</div>
                ) : (
                  <div className="token_item_balance_value">
                    <div className="value">{balanceType === 1 ? item.spendingValue : item.balanceValue}</div>
                    <div className="price_value">
                      {balanceType === 1
                        ? item.price && item.spendingValue
                          ? `$${MathUtil_numberFixed(Number(item.price) * Number(item.spendingValue), 2, 'floor')}`
                          : ''
                        : item?.currentBalancePrice
                        ? `$${MathUtil_numberFixed(item?.currentBalancePrice, 4, 'floor')}`
                        : item.price && item?.balanceValue
                        ? `$${MathUtil_numberFixed(Number(item.price) * Number(item.balanceValue), 2, 'floor')}`
                        : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <EmptyPanel setVisible={setVisible} srcListLength={srcListLength} hideEmptyAction={hideEmptyAction} />
      )}
    </>
  );
};

export default ListPanelPage;
