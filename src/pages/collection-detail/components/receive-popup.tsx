import { closeModalIcon } from '@/utils';
import { Popup } from 'antd-mobile';
import { useEffect, useState } from 'react';
import BorderRadiusTab from '@/components/border-radius-tab';
import ListPanelPage from '@/components/token-selector/list-panel';
import '../index.less';
import PaymentRecord from './payment-record';
import SkeletonLoading from '@/components/skelet-loading';
import EmptyPanel from '@/components/token-selector/empty-panel';

const ReceivedPopup = ({
  receivedTabKey,
  visible,
  setVisible,
  sltRecord,
  receiveType,
  makerReceivedLoading,
  makerReceivedList
}: any) => {
  const [tab, setTab] = useState<string>(receivedTabKey);

  useEffect(() => {
    setTab(receivedTabKey);
  }, [receivedTabKey]);

  return (
    <Popup
      visible={visible}
      onMaskClick={() => {
        setVisible(false);
      }}
      bodyStyle={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
      bodyClassName={`base_popup_container receive_popup_container`}
      getContainer={document.getElementById('tp-wrapper')}
    >
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
          <div className="title">{receiveType === 'maker' ? 'Subtotal of Assets Received' : 'Payment record'}</div>
          <div className="closeBtn"></div>
        </div>
      </div>
      {/* receiveType === 'maker'  */}
      {receiveType === 'maker' && (
        <>
          <BorderRadiusTab
            menus={[
              { name: 'Spending', value: 'spending' },
              { name: 'Wallet', value: 'wallet' }
            ]}
            tab={tab}
            setTab={setTab}
          />
          <div className="content">
            {makerReceivedLoading ? (
              <SkeletonLoading />
            ) : (
              <ListPanelPage
                loading={makerReceivedLoading}
                searchTokenList={
                  tab === 'spending'
                    ? makerReceivedList?.filter((o: any) => o.spd)
                    : makerReceivedList?.filter((o: any) => !o.spd)
                }
                setVisible={() => {}}
                balanceType={1}
                hideEmptyAction={true}
              />
            )}
          </div>
        </>
      )}
      {/* receiveType === 'payer' */}
      {receiveType === 'payer' && (
        <div className="payer_record">
          {sltRecord?.transferDetails?.filter((o: any) => o.status !== 0 && !o.markpay)?.length > 0 ? (
            <PaymentRecord sltRecord={sltRecord} />
          ) : (
            <EmptyPanel hideEmptyAction={true} />
          )}
        </div>
      )}
    </Popup>
  );
};

export default ReceivedPopup;
