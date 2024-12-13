import { useState } from 'react';
import { Button } from 'antd';
import styles from './index.less';
import { CheckCircleFilledIcon } from '@/utils';
import EmptyBlock from '@/components/empty-block';
import PayerList from './components/payer-list';
import BillSimpleInfo from './components/bill-header';
import AssetsUsd from './components/assets-usd';
import { sendMsg, sendNotification } from './data_util';
import ReceivedPopup from './components/receive-popup';
import AssetsOther from './components/assets-other';
import { useColDetailStore } from './store';
import MenuPopup from '@/components/menu-popup';
import { TRANS_REMIND_MENUS } from '@/constants';

const EqualOrSpecialDetail = () => {
  const orderInfo = useColDetailStore((state) => state.orderInfo);
  const isMaker = useColDetailStore((state) => state.isMaker);
  const isRecever = useColDetailStore((state) => state.isRecever);
  const receiveInfo = useColDetailStore((state) => state.receiveInfo);
  const isPaymentCode = useColDetailStore((state) => state.isPaymentCode);
  const makerReceivedLoading = useColDetailStore((state) => state.makerReceivedLoading);
  const makerReceivedList = useColDetailStore((state) => state.makerReceivedList);

  const [receiveType, setReceiveType] = useState<string>('payer');
  const [receivedTabKey, setReceivedTabKey] = useState<string>('spending');
  const [receiveVisible, setReceiveVisible] = useState<boolean>(false);
  const [stltPayerRecord, setSltPayerRecord] = useState<any>();
  const [remindMenuVisible, setRemindMenuVisible] = useState<boolean>(false);

  // console.log('EqualOrSpecialDetail', orderInfo, isMaker, isRecever);

  return orderInfo ? (
    <div>
      {/* bill info */}
      <BillSimpleInfo
        setReceiveType={(type: string) => {
          setReceiveType(type);
          setSltPayerRecord(orderInfo);
        }}
        setReceiveVisible={setReceiveVisible}
        makerReceivedList={makerReceivedList}
        setReceivedTabKey={setReceivedTabKey}
      />
      {/* payer view */}
      {/* confirm staus: 0 init，1 processing，3 success， 4 failed, pay=[0,4] */}
      {[0, 3, 4].indexOf(receiveInfo?.status) >= 0 &&
        (orderInfo?.tokenAddress === 'USD' ? <AssetsUsd /> : <AssetsOther />)}
      {/* payer list */}
      {orderInfo?.id && orderInfo?.payDetails?.length > 0 && !isPaymentCode && (
        <PayerList
          setReceiveVisible={setReceiveVisible}
          setReceiveType={(type: string, value: any) => {
            setReceiveType(type);
            setSltPayerRecord(value);
          }}
        />
      )}
      {/* maker footer */}
      {isMaker && !isPaymentCode && (
        <div className={styles.maker_footer}>
          {orderInfo?.currAmount < orderInfo?.amount ? (
            <Button className="default_btn confirm_btn" onClick={() => setRemindMenuVisible(true)}>
              Remind unpaid participants
            </Button>
          ) : (
            <Button className={`default_btn ${styles.compelete_btn}`}>
              {CheckCircleFilledIcon}
              Payment Completed
            </Button>
          )}
        </div>
      )}

      {remindMenuVisible && (
        <MenuPopup
          title="Remind via"
          visible={remindMenuVisible}
          setVisible={setRemindMenuVisible}
          menus={TRANS_REMIND_MENUS}
          setMenuKey={(value) => {
            if (value === 1) {
              sendNotification(orderInfo);
            } else {
              sendMsg(orderInfo);
            }
          }}
          textColor={'var(--color-text-sw-2-3)'}
        />
      )}

      <ReceivedPopup
        visible={receiveVisible}
        setVisible={setReceiveVisible}
        receiveType={receiveType}
        sltRecord={stltPayerRecord}
        makerReceivedLoading={makerReceivedLoading}
        makerReceivedList={makerReceivedList}
        receivedTabKey={receivedTabKey}
      />
    </div>
  ) : (
    <EmptyBlock />
  );
};

export default EqualOrSpecialDetail;
