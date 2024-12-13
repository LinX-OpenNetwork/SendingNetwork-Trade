import { useEffect, useState } from 'react';
import { AutoComplete, Input } from 'antd';
import './index.less';
import UserAvatar from '../user-avatar';
import { useSelector } from 'dva';
import { addressOmitShow, getAuthUserInfo, minusCircleIcon } from '@/utils';
import { filter } from 'lodash';
import { SelectedNode } from './index';

const AutoSelectPage = ({ toAddress, setToAddress, setToPeople, recentList, dataType, balanceType }: any) => {
  const { authedAccountInfo, accountList } = useSelector((state: any) => state.store);

  const [peopleOptions, setPeopleOptions] = useState<any>([]);
  const [visible, setVisible] = useState<boolean>(false);

  const renderItem = (data: any, isUser: boolean) => ({
    value: JSON.stringify(data),
    label: (
      <div className="wantpeople_selector_name_info">
        <UserAvatar
          name={data?.name}
          src={data?.icon}
          size="3"
          borderRadius="50%"
          className={isUser ? 'name_avatar' : ''}
        />
        <div className="name_info_content">
          <div className="name_info_value">{data?.name}</div>
          <div className="name_info_address">{addressOmitShow(data?.address)}</div>
        </div>
      </div>
    )
  });

  async function getRecentOptions() {
    let options: any = [];
    const filterAccount = filter(
      accountList,
      (o: any) => o?.walletAddress?.toUpperCase() !== authedAccountInfo?.publicKey?.toUpperCase()
    );
    if (filterAccount?.length > 0) {
      options.push({
        label: <div className="wantpeople_auto_title">Your other SendingMe linked accounts:</div>,
        options: filterAccount.map((item: any) => {
          return renderItem(
            {
              id: item?.walletAddress,
              name: item?.walletName,
              address: item?.walletAddress,
              icon: item?.verifySourceLogo
            },
            false
          );
        })
      });
    }
    if (recentList?.length > 0) {
      options.push({
        label: <div className="wantpeople_auto_title">Recent:</div>,
        options: recentList?.map((item: any) => {
          return renderItem(
            {
              id: item?.receiverUserId,
              name: item?.receiverUserName,
              address: item?.receiverAddress,
              icon: item?.receiverUserImage
            },
            true
          );
        })
      });
    }

    setPeopleOptions(options);
  }

  function getOptions() {
    const authUserInfo = getAuthUserInfo();
    const ownId = authUserInfo?.id;
    let options: any = [];
    (recentList || []).forEach((item: any) => {
      if (authUserInfo && ownId === item?.userId) {
      } else {
        options.push({
          value: JSON.stringify(item),
          label: <SelectedNode toPeople={item} balanceType={balanceType} />
        });
      }
    });
    setPeopleOptions(options);
  }

  function onOptionFilter(inputValue: string, option: any) {
    const optionNew = option?.value ? JSON.parse(option?.value) : undefined;
    if (
      optionNew?.name?.toLowerCase().indexOf(inputValue?.toLowerCase()) >= 0 ||
      optionNew?.address?.toLowerCase().indexOf(inputValue?.toLowerCase()) >= 0
    ) {
      return true;
    } else {
      return false;
    }
  }

  useEffect(() => {
    if (dataType === 'recent') {
      getRecentOptions();
    } else {
      getOptions();
    }
  }, [
    authedAccountInfo?.publicKey?.toUpperCase(),
    filter(accountList, (o: any) => o?.walletAddress?.toUpperCase() !== authedAccountInfo?.publicKey?.toUpperCase())
      ?.length,
    recentList?.length,
    dataType
  ]);

  useEffect(() => {
    document.getElementsByClassName('wantpeople_auto_select')[0]?.addEventListener('click', (e) => e.stopPropagation());
    window.addEventListener('click', () => setVisible(false));
    return () => {
      window.removeEventListener('click', () => setVisible(false));
      document
        .getElementsByClassName('wantpeople_auto_select')[0]
        ?.removeEventListener('click', (e) => e.stopPropagation());
    };
  }, []);

  // console.log('AutoSelectPage', toAddress, accountList, peopleOptions?.length);

  return (
    <AutoComplete
      style={{ width: '100%' }}
      options={peopleOptions}
      onSelect={(value: string) => {
        console.log('onSelect', value);
        setToPeople(JSON.parse(value));
        setToAddress(JSON.parse(value)?.address ?? JSON.parse(value)?.walletAddress);
      }}
      value={toAddress}
      className="wantpeople_auto_select"
      popupClassName="wantpeople_auto_select_popup"
      // @ts-ignore
      listHeight={'calc(100vh - 280px)'}
      filterOption={(inputValue, option) => onOptionFilter(inputValue, option)}
      getPopupContainer={(triggerNode) => triggerNode?.parentNode?.parentNode ?? document?.body}
      defaultOpen={false}
      open={visible}
      onFocus={() => {
        setVisible(true);
      }}
      allowClear={true}
      onClear={() => {
        setToPeople(undefined);
        setToAddress('');
      }}
    >
      <div className="auto_input_element">
        <Input.TextArea
          className="input_toAddress"
          style={toAddress?.length > 30 ? { paddingTop: '10px' } : { paddingTop: '25px' }}
          placeholder="Paste wallet address"
          value={toAddress}
          bordered={false}
          autoSize={false}
          onChange={(e) => {
            console.log('onChange', e.target.value?.length);
            setToPeople?.(undefined);
            setToAddress(e.target.value);
          }}
        />
        {/* {toAddress && (
          <div
            className="input_toAddress_action"
            onClick={(e) => {
              alert('sss');
              setToPeople(undefined);
              setToAddress('');
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            {minusCircleIcon}
          </div>
        )} */}
      </div>
    </AutoComplete>
  );
};

export default AutoSelectPage;
