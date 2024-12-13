import { Popup } from 'antd-mobile';
import TokenIcon from '@/components/token-icon';
import { TokenInfo, TokenSelector } from '@/types';
import { addressOmitShow, downOutIcon, getChainName, checkedIcon, unCheckedIcon } from '@/utils';
import { ETH_SUPPORTED_CHAINS, WALLET_CHAIN_CONFIG } from '@/constants';
import './index.less';
import { findIndex, filter, find } from 'lodash';
import { Button, Checkbox } from 'antd';
import { useSelector } from 'dva';
import { useDispatch } from 'umi';
import SkeletonLoading from '../skelet-loading';

const USDItemRender = ({ data, visible, setVisible, setToken, setSelectorVisible }: any) => {
  const { usdTokenList } = useSelector((state: any) => state.assets);

  const checkedTokenList = usdTokenList?.filter((o: any) => o.isChecked);
  // console.log('USDItemRender', usdTokenList, checkedTokenList);

  return (
    <div className="usd_item" key="usd">
      <div className="usd_item_content">
        <div
          className="token_item_name"
          onClick={() => {
            setToken?.(data);
            setSelectorVisible(false);
          }}
        >
          <div className="item_icon">
            <TokenIcon {...data} />
          </div>
          <div>
            <div>{data.symbol}</div>
            <div className="address_value">Acceptable Stablecoins</div>
          </div>
        </div>
        <div
          className="usd_item_children"
          onClick={(e) => {
            setVisible(true);
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          {checkedTokenList?.map((childItem: TokenInfo, index: number) => {
            if (index === 2) {
              return (
                <div className="usd_child_item_more" key={index}>
                  +{checkedTokenList?.length}
                </div>
              );
            } else if (index <= 2) {
              return (
                <div className="usd_child_item" key={index}>
                  <TokenIcon {...childItem} />
                  <img
                    src={`/image/token/chain_${getChainName(childItem?.chainId)}.png`}
                    className="chain_icon"
                    width={12}
                    height={12}
                  />
                </div>
              );
            } else {
              return null;
            }
          })}
          <div className="usd_item_expand">{downOutIcon}</div>
        </div>
      </div>
      <USDSelector
        visible={visible}
        setVisible={setVisible}
        setSelectorVisible={setSelectorVisible}
        setToken={setToken}
        parentItem={data}
      />
    </div>
  );
};

const USDSelector = ({ visible, setVisible, setSelectorVisible, setToken, parentItem }: any) => {
  const dispatch = useDispatch();
  const { usdTokenLoading, usdTokenList } = useSelector((state: any) => state.assets);
  const { authedAccountInfo } = useSelector((state: any) => state.store);

  function setUsdTokenList(value: TokenSelector[]) {
    dispatch({
      type: 'assets/updateUsdTokenList',
      payload: value
    });
  }

  return (
    <Popup
      visible={visible}
      onMaskClick={() => {
        setVisible(false);
        setSelectorVisible(false);
      }}
      bodyStyle={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
      bodyClassName={`base_popup_container usd_selector_container`}
      getContainer={document.getElementById('tp-wrapper')}
      style={{
        '--z-index': '1200'
      }}
    >
      <div className="header">
        <div className="titleBox">
          <div
            className="closeBtn"
            onClick={() => {
              setVisible(false);
              setSelectorVisible(false);
            }}
          >
            {downOutIcon}
          </div>
          <div className="title">Acceptable Stablecoins</div>
          <div className="closeBtn"></div>
        </div>
      </div>
      <div className="content">
        {usdTokenLoading ? (
          <SkeletonLoading />
        ) : (
          <div className="usd_children_list">
            {usdTokenList?.map((item: TokenSelector, index: number) => {
              const chainAssetsType = find(ETH_SUPPORTED_CHAINS, { chain_id: item?.chainId })?.assets_type;
              return (
                <div
                  className="list_token_item"
                  key={item?.address + index}
                  onClick={() => {
                    item.isChecked = !item.isChecked;
                    setUsdTokenList(usdTokenList?.slice());
                  }}
                >
                  <div className="list_token_item_content">
                    <div className="token_checkbox">{item?.isChecked ? checkedIcon : unCheckedIcon}</div>
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
                            let objIndex = findIndex(ETH_SUPPORTED_CHAINS, {
                              chain_id: item.chainId
                            });
                            window.open(`${ETH_SUPPORTED_CHAINS[objIndex].block_explorer_url}token/${item.address}`);
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          {chainAssetsType}: {addressOmitShow(item.address)}
                        </div>
                      </div>
                    </div>
                    <div className="token_item_price_value">{item.price ? `$${item.price}` : ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="footer">
        <div className="checkbox_all_btn">
          <Checkbox
            checked={filter(usdTokenList, (o) => o.isChecked)?.length === usdTokenList?.length ? true : false}
            onChange={(e) => {
              const uSDTokenListTemp = usdTokenList.map((item: any) => {
                return {
                  ...item,
                  isChecked: e.target.checked
                };
              });
              setUsdTokenList(uSDTokenListTemp);
            }}
            className="base_checkbox"
          >
            Select All
          </Checkbox>
        </div>

        <Button
          className="default_btn confirm_btn"
          onClick={() => {
            setVisible(false);
            setSelectorVisible(false);
            setToken?.(parentItem);
          }}
        >
          Selected ({filter(usdTokenList, (o) => o.isChecked)?.length}/{usdTokenList?.length})
        </Button>
      </div>
    </Popup>
  );
};

export default USDItemRender;
