import { Popup } from 'antd-mobile';
import { closeModalIcon } from '@/utils';
import { NftInfo, TokenInfo } from '@/types';
import NftIcon from '@/components/nft-icon';
import TokenIcon from '../token-icon';
import './index.less';
import UserAvatar from '@/components/user-avatar';
import dayjs from 'dayjs';
import EmptyBlock from '@/components/empty-block';

type IProps = {
  visible: boolean;
  setVisible: any;
  list: (NftInfo | TokenInfo)[];
  receivers: any[];
  type: number;
  createTime?: string;
};

const ViewTokenPopup = (props: IProps) => {
  const { visible, setVisible, list, type, receivers, createTime } = props;
  // console.log('ViewTokenPopup', list);
  return (
    <Popup
      visible={visible}
      onMaskClick={() => setVisible(false)}
      bodyStyle={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
      bodyClassName="base_popup_container view_token_popup_container"
      getContainer={document.getElementById('tp-wrapper')}
    >
      <div className="header">
        <div className="titleBox">
          <div className="closeBtn" onClick={() => setVisible(false)}>
            {closeModalIcon}
          </div>
          <div className="title">Transfer detail</div>
          <div className="closeBtn"></div>
        </div>
      </div>

      {type == 1 ? (
        <div className="main_content">
          {(list || [])?.length > 0 ? (
            <div className="list_content">
              {(list || []).map((item: NftInfo | TokenInfo, index: number) => {
                if (!item.hasOwnProperty('id')) {
                  item = item as TokenInfo;
                  return (
                    <div className="list_item" key={index}>
                      <div className="item_name">
                        <div className="item_icon">
                          <TokenIcon {...item} showChainIcon={true} />
                        </div>
                      </div>
                      <div className="token name_info">
                        <div className="title">
                          {item.balanceValue} {item.symbol}
                        </div>
                        <div className="value"></div>
                      </div>
                    </div>
                  );
                } else {
                  item = item as NftInfo;
                  return (
                    <div className="list_item" key={index}>
                      <div className="item_name">
                        <div className="item_icon">
                          <NftIcon {...item} showLink showChainIcon />
                        </div>
                      </div>
                      <div className="name_info">
                        <div className="value">#{item?.id}</div>
                        <div className="title">
                          {item?.symbol} · {item?.type === 1 ? 'ERC 721' : 'ERC 1155'}
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          ) : (
            <EmptyBlock />
          )}
        </div>
      ) : (
        <div className="main_content">
          {(receivers || [])?.length > 0 ? (
            <div className="container2">
              {(receivers || []).map((item: any, index: number) => {
                let token = item?.tokens[0];
                return (
                  <div className="record_item" key={index}>
                    <div className="user_container">
                      <UserAvatar
                        size={'3'}
                        borderRadius="8px"
                        name={item?.receiverUserName}
                        src={item.receiverUserImage}
                      />
                      <div className="name_info">
                        <div className="title">{item.receiverUserName}</div>
                        <div className="sub">
                          {item?.time ? dayjs(item?.time).format('MMM DD, YYYY HH:mm') : createTime}
                        </div>
                      </div>
                    </div>

                    <div className="value_container">
                      {token.tokenAmount} {token.tokenSymbol}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyBlock />
          )}
        </div>
      )}
    </Popup>
  );
};

export default ViewTokenPopup;
