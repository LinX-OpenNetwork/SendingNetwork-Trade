import { Button, message, Checkbox } from 'antd';
import './index.less';
import UserAvatar from '../../user-avatar';
import { addressOmitShow, closeModalIcon, getAuthUserInfo, tipLineIcon } from '@/utils';
import { cloneDeep, findIndex, filter } from 'lodash';
import { Input, SearchBar } from 'antd-mobile';
import { TokenInfo } from '@/types';
import { useState } from 'react';
import FullScreenPop from '../../fullscreen-popup';

type IProps = {
  visible: boolean;
  setVisible: any;
  members: any;
  setMembers: any;
  footerExtra?: any;
  balanceType?: any;
  receiver: any;
  setReceiver: any;
  isExternal: boolean;

  onConfirmDisabled?: boolean;
  hasInput?: boolean;
  token?: TokenInfo | undefined;
};
const MemberSelectInputPopup = (props: IProps) => {
  const {
    visible,
    setVisible,
    members,
    setMembers,
    token,
    footerExtra,
    onConfirmDisabled,
    balanceType,
    hasInput,
    receiver,
    setReceiver,
    isExternal
  } = props;
  const authUserInfo = getAuthUserInfo();
  const [searchMemebers, setSearchMemebers] = useState<any>(members);

  const isReceiveInMember =
    findIndex(searchMemebers, (o: any) => o?.walletAddress?.toUpperCase() === receiver?.walletAddress?.toUpperCase()) >=
    0
      ? true
      : false;
  const showExternal = !isReceiveInMember && isExternal && receiver && !hasInput;
  const checkedLength =
    filter(members, (o) => o.isChecked)?.length + (!isReceiveInMember && isExternal && receiver?.isChecked ? 1 : 0);

  async function onSearch(value: string) {
    if (value) {
      let searchMembersTemp: any = [];
      members.forEach((item: any) => {
        if (
          item.userId.toUpperCase().indexOf(value.toUpperCase()) >= 0 ||
          item.name.toUpperCase().indexOf(value.toUpperCase()) >= 0
        ) {
          searchMembersTemp.push(item);
        }
      });
      setSearchMemebers(searchMembersTemp);
    } else {
      setSearchMemebers(members);
    }
  }

  function onCheckboxChange(item: any, value: string) {
    const membersTemp = cloneDeep(members);
    const allIndex = findIndex(membersTemp, { walletAddress: item?.walletAddress });
    membersTemp[allIndex].isChecked = value;
    setMembers(membersTemp);

    const searchMembersTemp = cloneDeep(searchMemebers);
    const seaIndex = findIndex(searchMembersTemp, { walletAddress: item?.walletAddress });
    searchMembersTemp[seaIndex].isChecked = value;
    setSearchMemebers(searchMembersTemp);
  }

  function onInputChange(item: any, value: string) {
    if (value.indexOf('.') >= 0 && value.split('.')[1]?.length > 3) {
      value = value.split('.')[0] + '.' + value.split('.')[1].substring(0, 4);
    }
    if ((Number(value) < 0.0001 && value?.length >= 6) || Number(value) < 0) {
      value = '0.0001';
    }
    const membersTemp = cloneDeep(members);
    const allIndex = findIndex(membersTemp, { walletAddress: item?.walletAddress });
    membersTemp[allIndex].value = value;
    setMembers(membersTemp);

    const searchMembersTemp = cloneDeep(searchMemebers);
    const seaIndex = findIndex(searchMembersTemp, { walletAddress: item?.walletAddress });
    searchMembersTemp[seaIndex].value = value;
    setSearchMemebers(searchMembersTemp);
  }

  console.log('isReceiveInMember', isReceiveInMember, isExternal);

  return (
    <FullScreenPop visible={visible} setVisible={setVisible}>
      <div className="participants_wrapper">
        <div className="header">
          <div className="titleBox">
            <div
              className="closeBtn"
              onClick={() => {
                setVisible(false);
              }}
            >
              {closeModalIcon}
            </div>
            <div className="title">{hasInput ? '' : 'Select '}Participants</div>
            <div className="closeBtn"></div>
          </div>
        </div>
        <div className="search_box">
          <SearchBar placeholder="Search" className="searchBarInput" onChange={onSearch} onSearch={onSearch} />
        </div>
        <div className="content">
          <div className="content_list">
            <div>
              {showExternal && (
                <ItemRender
                  item={receiver}
                  key={'receiver'}
                  hasInput={hasInput}
                  balanceType={balanceType}
                  isReceiver={true}
                  token={token?.symbol}
                  onCheckboxChange={(value) => {
                    setReceiver({ ...receiver, isChecked: value });
                  }}
                />
              )}
              {searchMemebers?.map((item: any) => {
                let isReceiver = receiver?.walletAddress?.toUpperCase() === item?.walletAddress?.toUpperCase();
                if (!isExternal) {
                  isReceiver = authUserInfo?.id === item?.userId;
                }
                if (!item || (hasInput && isReceiver)) {
                  return null;
                }
                return (
                  <ItemRender
                    item={item}
                    key={item?.userId}
                    hasInput={hasInput}
                    balanceType={balanceType}
                    isReceiver={isReceiver}
                    token={token?.symbol}
                    onCheckboxChange={(value) => {
                      onCheckboxChange(item, value);
                    }}
                    onInputChange={(value) => {
                      onInputChange(item, value);
                    }}
                  />
                );
              })}
            </div>
          </div>
          <div className="footer">
            {!hasInput ? (
              <div className="checkbox_all_btn">
                <Checkbox
                  checked={filter(searchMemebers, (o) => o.isChecked)?.length === searchMemebers?.length ? true : false}
                  onChange={(e) => {
                    const membersTemp = cloneDeep(members);
                    const searchMembersTemp = cloneDeep(searchMemebers)?.map((item: any) => {
                      let searchIndex = findIndex(membersTemp, {
                        walletAddress: item?.walletAddress
                      });
                      membersTemp[searchIndex].isChecked = e.target.checked;
                      return {
                        ...item,
                        isChecked: e.target.checked
                      };
                    });
                    setMembers(membersTemp);
                    setSearchMemebers(searchMembersTemp);
                  }}
                  className="base_checkbox"
                >
                  Select All
                </Checkbox>
                <div>All participants will receive a payment reminder</div>
              </div>
            ) : (
              footerExtra
            )}
            <Button
              className={`default_btn confirm_btn ${hasInput && onConfirmDisabled ? 'disabled' : ''}`}
              disabled={hasInput ? (onConfirmDisabled ? onConfirmDisabled : false) : false}
              onClick={() => {
                if (hasInput && !token) {
                  message.error('token error');
                  return;
                }
                setVisible(false);
              }}
            >
              {hasInput ? 'Confirm' : `Selected (${checkedLength})`}
            </Button>
          </div>
        </div>
      </div>
    </FullScreenPop>
  );
};

export default MemberSelectInputPopup;

const ItemRender = ({ item, hasInput, balanceType, isReceiver, tokenSymbol, onCheckboxChange, onInputChange }: any) => {
  return (
    <div className="member_item">
      {!hasInput && (
        <div className="member_item_checkbox">
          <Checkbox
            checked={item?.isChecked}
            onChange={(e) => {
              onCheckboxChange(e.target.checked);
            }}
            className="base_checkbox"
          ></Checkbox>
        </div>
      )}
      <div
        className="member_item_content"
        style={isReceiver ? { flexDirection: 'column', alignItems: 'flex-start' } : {}}
      >
        <div className="item_content_container">
          <UserAvatar size="2.625" borderRadius="50%" name={item?.name} src={item?.icon} />
          <div className="item_content_name">
            <div className="name_title">
              <div className="title_value">{item?.name}</div>
              {isReceiver && <div className="external_tag">Receiver</div>}
            </div>
            <div className="name_sub">
              {balanceType === 1 ? 'Spending account' : addressOmitShow(item?.walletAddress)}
            </div>
          </div>
        </div>
        {isReceiver && (
          <div className="member_item_tip">{tipLineIcon}The amount allocated to the receiver is considered paid</div>
        )}
        {hasInput && (
          <div className="member_item_input">
            <Input
              value={item.value ? item.value : ''}
              onChange={onInputChange}
              type="number"
              placeholder="0.00"
              style={{
                '--placeholder-color': '#666666'
              }}
            />
            <div className="item_input_extra">{tokenSymbol}</div>
          </div>
        )}
      </div>
    </div>
  );
};
