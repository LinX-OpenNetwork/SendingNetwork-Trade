import styles from '../index.less';
import UserNode from '@/components/user-node';
import { addressOmitShow, errorArrowIcon, smallWalletIcon, copyIcon, paidSealIcon, MathUtil_plus } from '@/utils';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Toast } from 'antd-mobile';
import { groupBy, reduce, findIndex } from 'lodash';
import { useColDetailStore } from '../store';

const BillSimpleInfo = ({ setReceiveType, setReceiveVisible, makerReceivedList, setReceivedTabKey }: any) => {
  const orderInfo = useColDetailStore((state) => state.orderInfo);
  const isMaker = useColDetailStore((state) => state.isMaker);
  const isRecever = useColDetailStore((state) => state.isRecever);
  const receiveInfo = useColDetailStore((state) => state.receiveInfo);
  const isPaymentCode = useColDetailStore((state) => state.isPaymentCode);

  const makerReceivedLength = Object.keys(groupBy(makerReceivedList, 'address'))?.length;
  const hasReceiver =
    orderInfo?.userId === ''
      ? findIndex(
          orderInfo?.payDetails,
          (o: any) => o?.userAddress?.toUpperCase() === orderInfo?.userAddress?.toUpperCase()
        ) >= 0
      : findIndex(orderInfo?.payDetails, { userId: orderInfo?.userId }) >= 0;
  const dueAmount = reduce(
    orderInfo?.payDetails,
    (result, item) => {
      if (orderInfo?.userId === '') {
        if (item?.userAddress?.toUpperCase() !== orderInfo?.userAddress?.toUpperCase()) {
          return MathUtil_plus(result, item?.amount);
        } else {
          return result;
        }
      } else {
        if (item?.userId !== orderInfo?.userId) {
          return MathUtil_plus(result, item?.amount);
        } else {
          return result;
        }
      }
    },
    0
  );
  const otherSpdReceived = reduce(
    makerReceivedList,
    (result, item) => {
      return item?.spd ? MathUtil_plus(result, item?.spendingValue) : result;
    },
    0
  );
  const otherWalletReceived = reduce(
    makerReceivedList,
    (result, item) => {
      return !item?.spd ? MathUtil_plus(result, item?.spendingValue) : result;
    },
    0
  );

  // console.log('BillSimpleInfo', makerReceivedList);

  return (
    <div className={styles.bill_simple_info_wrapper}>
      <div className={styles.bill_simple_content}>
        <div className={styles.coll_name}>
          <div className={styles.name_icon}>
            <UserNode userName={orderInfo?.userName} userImage={orderInfo?.userImage} borderRadius="50%" size="3" />
          </div>
          <div className={styles.name_info}>
            <div className={styles.name_info_value}>
              {orderInfo?.userName}'s {!isPaymentCode ? 'Split Bill' : 'Payment Request'}
            </div>
            <div className={styles.name_info_address_title}>
              {isPaymentCode ? '' : 'Total'} {orderInfo?.amount} {orderInfo?.tokenSymbol}
              {hasReceiver && dueAmount > 0 ? `, Due ${dueAmount} ${orderInfo?.tokenSymbol}` : ''}
            </div>
          </div>
        </div>
        {/* <div className={styles.coll_name_item}>
          <div className={styles.coll_name_item_title}>Create time</div>
          <div className={styles.coll_name_item_value}>{dayjs(orderInfo?.createTime).format('MMM DD, YYYY HH:mm')}</div>
        </div> */}
        <div className={styles.coll_name_item}>
          <div className={styles.coll_name_item_title}>Pay to</div>
          <div className={styles.coll_name_item_value}>
            <div className={styles.sub}>
              {smallWalletIcon}
              <div className={styles.name_info_address}>
                {addressOmitShow(orderInfo?.receiverAddress ?? orderInfo?.userAddress)}
              </div>
              <CopyToClipboard
                text={orderInfo?.receiverAddress ?? orderInfo?.userAddress}
                onCopy={() => {
                  Toast.show({ content: 'Address has been copied', maskClassName: 'copy_toast_mask' });
                }}
              >
                <div className={styles.copy_btn}>{copyIcon}</div>
              </CopyToClipboard>
            </div>
          </div>
        </div>
        {orderInfo?.title && (
          <div className={styles.coll_name_item}>
            <div className={styles.coll_name_item_title}>Note</div>
            <div className={styles.coll_name_item_value}>{orderInfo?.title}</div>
          </div>
        )}
        {/* isRecever */}
        {isRecever && (!isMaker || isPaymentCode || [0, 3, 4].indexOf(receiveInfo?.status) >= 0) ? (
          <>
            <div className={styles.coll_name_item}>
              <div className={styles.coll_name_item_title}>You need to pay</div>
              <div className={`${styles.coll_name_item_value} ${styles.coll_pay}`}>
                {receiveInfo?.status === 3 && paidSealIcon}
                <span className={styles.coll_pay_value}>
                  {receiveInfo?.amount} {orderInfo?.tokenSymbol}
                </span>
              </div>
            </div>
          </>
        ) : (
          ''
        )}
        {/* isMaker */}
        {isMaker && !isRecever && !isPaymentCode && (
          <>
            <div className={styles.coll_name_item}>
              <div className={styles.coll_name_item_title}>Received</div>
              <div className={styles.coll_name_item_value}>
                <span>
                  {orderInfo?.currAmount} {orderInfo?.tokenSymbol}
                </span>
              </div>
            </div>
            {orderInfo?.currAmount > 0 &&
              (orderInfo?.tokenAddress === 'USD' && makerReceivedLength > 0 ? (
                <div
                  className={styles.maker_receive_detail}
                  onClick={() => {
                    setReceiveType('maker');
                    setReceiveVisible(true);
                    if (makerReceivedList?.filter((o: any) => o.spd)?.length > 0) {
                      setReceivedTabKey('spending');
                    } else {
                      setReceivedTabKey('wallet');
                    }
                  }}
                >
                  {makerReceivedLength} stablecoins, check details{errorArrowIcon}
                </div>
              ) : otherSpdReceived > 0 || otherWalletReceived > 0 ? (
                <div
                  className={styles.maker_receive_detail}
                  onClick={() => {
                    setReceiveType('maker');
                    setReceiveVisible(true);
                    if (otherSpdReceived > 0) {
                      setReceivedTabKey('spending');
                    } else {
                      setReceivedTabKey('wallet');
                    }
                  }}
                >
                  <div className={styles.maker_other}>
                    {otherSpdReceived ? (
                      <div>
                        Spending account: {otherSpdReceived} {orderInfo?.tokenSymbol}
                      </div>
                    ) : (
                      ''
                    )}
                    {otherWalletReceived ? (
                      <div>
                        Wallet account: {otherWalletReceived} {orderInfo?.tokenSymbol}
                      </div>
                    ) : (
                      ''
                    )}
                  </div>
                  {errorArrowIcon}
                </div>
              ) : (
                ''
              ))}
          </>
        )}
      </div>
    </div>
  );
};

export default BillSimpleInfo;
