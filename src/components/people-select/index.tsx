import { useState, useEffect } from 'react';
import UserNode from '@/components/user-node';
import { addressOmitShow, getToken, minusCircleIcon, useUrlParams } from '@/utils';
import './index.less';
import { history } from 'umi';
import AutoSelectPage from './auto_select';
import { queryRecent } from '@/services';
import { uniqBy } from 'lodash';
import { CloseCircleFilled } from '@ant-design/icons';

const WantPeopleSelect = (prop: {
  toAddress: any;
  setToAddress: any;
  toPeople?: any;
  setToPeople?: any;
  roomId?: any;
  roomInfo?: any;
  byAddress?: boolean;
  balanceType?: number;
}) => {
  const { toAddress, setToAddress, toPeople, setToPeople, roomInfo, balanceType } = prop;
  const from = useUrlParams().get('from');

  const [recentList, setRecentList] = useState<any>([]);

  async function getRecentList() {
    const accessToken = getToken();
    if (!accessToken || recentList?.length > 0 || history.location.query?.from?.toString() !== 'wallet') {
      return;
    }
    const res = await queryRecent({ accessToken }).catch();
    if (res && res?.success && res?.result) {
      setRecentList(uniqBy(res?.result, 'receiverAddress'));
    }
  }

  useEffect(() => {
    getRecentList();
  }, [getToken()]);

  return toPeople ? (
    <div className="wantpeople_select_container">
      <SelectedPeople
        toPeople={toPeople}
        setToPeople={setToPeople}
        setToAddress={setToAddress}
        balanceType={balanceType}
      />
    </div>
  ) : (
    <AutoSelectPage
      toAddress={toAddress}
      setToAddress={setToAddress}
      toPeople={toPeople}
      setToPeople={setToPeople}
      recentList={from === 'wallet' ? recentList : roomInfo?.members}
      balanceType={balanceType}
      dataType={from === 'wallet' ? 'recent' : 'room'}
    />
  );
};

export default WantPeopleSelect;

const SelectedPeople = ({ toPeople, setToPeople, setToAddress, balanceType }: any) => {
  return (
    <div className="selected_item">
      <SelectedNode toPeople={toPeople} balanceType={balanceType} />
      <div
        className="name_action"
        onClick={(e) => {
          setToPeople(undefined);
          setToAddress('');
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {/* {minusCircleIcon} */}
        <CloseCircleFilled />
      </div>
    </div>
  );
};

export const SelectedNode = ({ toPeople, balanceType }: any) => {
  return (
    <div className="wantpeople_selector_name_info" key={toPeople?.userId}>
      <UserNode userName={toPeople?.name} userImage={toPeople?.icon} borderRadius="50%" size="3" />
      <div className="name_info_content">
        <div className="name_info_value">{toPeople?.name}</div>
        <div className="name_info_address">
          {balanceType === 1 ? 'Spending account' : addressOmitShow(toPeople?.address)}
        </div>
      </div>
    </div>
  );
};
