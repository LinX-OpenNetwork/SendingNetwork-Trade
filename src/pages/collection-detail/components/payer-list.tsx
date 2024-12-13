import styles from '../index.less';
import { Popover, Space, Button, message } from 'antd';
import UserAvatar from '@/components/user-avatar';
import dayjs from 'dayjs';
import { moreDotIcon, getToken, CheckCircleFilledIcon, CheckOutlinedIcon, checkSourceType } from '@/utils';
import { Modal, Toast } from 'antd-mobile';
import { updatePaid } from '@/services';
import { useCreateContext } from '../';
import { useRef } from 'react';
import { unionBy } from 'lodash';
import { LINX_AUTH_INFO } from '@/constants';
import { useColDetailStore } from '../store';

const PayerList = ({ setReceiveVisible, setReceiveType }: any) => {
  const { getOrderInfo } = useCreateContext();
  const orderInfo = useColDetailStore((state) => state.orderInfo);
  const isMaker = useColDetailStore((state) => state.isMaker);
  const updatePayDetailItem = useColDetailStore((state) => state.updatePayDetailItem);

  let asPaidLoading = useRef<boolean>(false);

  async function onAsPaid(sltRecord: any) {
    if (asPaidLoading.current) return;
    asPaidLoading.current = true;
    const accessToken = getToken();
    if (!accessToken) {
      asPaidLoading.current = false;
      return;
    }
    const res = await updatePaid({ accessToken, id: sltRecord?.id }).finally(() => {
      asPaidLoading.current = false;
    });
    if (res && res?.success) {
      // A marked B as having paid the Split Bill
      const sourceType = checkSourceType();
      TransferAccessService.sendEvent(orderInfo?.roomId, {
        body: `marked ${sltRecord?.userName ?? sltRecord?.userAddress} as having paid the Split Bill`,
        icon: LINX_AUTH_INFO.redirectUri + '/logo_icon.png',
        link: `${LINX_AUTH_INFO.redirectUri}/collection-detail?id=${orderInfo?.id}${
          sourceType === 'SDN' ? '&st=sdn' : ''
        }`,
        link_text: 'Split Bill'
      });
      getOrderInfo(orderInfo?.id);
      Toast.show({
        content: (
          <div className="toast_content_success">
            {CheckCircleFilledIcon}
            Succeeded
          </div>
        ),
        maskClassName: 'base_toast_mask'
      });
    } else {
      message.error(res?.errorMsg ?? 'error');
    }
  }

  function onMaskAsPaid(value: any) {
    Modal.show({
      className: 'base_confirm_modal',
      content: (
        <div className={`${styles.mark_paid_content} content`}>
          <div className={styles.title}>Mark as paid</div>
          <div className={styles.desc}>Are you sure the payment has been settled?</div>
          <div className="actions">
            <Space size={13}>
              <Button
                className="default_btn cancel_btn"
                onClick={() => {
                  Modal.clear();
                }}
              >
                Cancel
              </Button>
              <Button
                className={`default_btn confirm_btn ${asPaidLoading.current ? 'disabled' : ''}`}
                disabled={asPaidLoading.current}
                onClick={() => {
                  Modal.clear();
                  onAsPaid(value);
                }}
              >
                Confirm
              </Button>
            </Space>
          </div>
        </div>
      ),
      getContainer: () => document?.getElementById('tp-wrapper')
    });
  }

  const makerActions = (value: any, index: any) => {
    return (
      <div className={styles.more_action_content}>
        {value?.status !== 3 && (
          <div
            className={styles.action_content_item}
            onClick={() => {
              onMaskAsPaid(value);
            }}
          >
            Mark as paid
          </div>
        )}
        <div
          className={styles.action_content_item}
          onClick={() => {
            let receiveInfoTemp = value;
            if (
              orderInfo?.tokenAddress !== 'USD' &&
              receiveInfoTemp &&
              receiveInfoTemp?.status === 3 &&
              receiveInfoTemp!.transferDetails?.length <= 0 &&
              receiveInfoTemp?.userId !== orderInfo?.userId &&
              !receiveInfoTemp?.markpay
            ) {
              const transferDetails = [
                {
                  chainId: orderInfo?.chainId,
                  markpay: receiveInfoTemp?.markpay,
                  payerAddress: receiveInfoTemp?.userAddress,
                  receiverAddress: receiveInfoTemp?.receiverAddress,
                  spd: receiveInfoTemp?.paySpd,
                  status: receiveInfoTemp?.status,
                  tokenAddress: orderInfo?.tokenAddress,
                  tokenAmount: receiveInfoTemp?.amount,
                  tokenDecimal: orderInfo?.tokenDecimal,
                  tokenIcon: orderInfo?.tokenIcon,
                  tokenSymbol: orderInfo?.tokenSymbol,
                  txId: receiveInfoTemp?.txId,
                  updateTime: receiveInfoTemp?.updateTime,
                  userId: receiveInfoTemp?.userId
                }
              ];
              updatePayDetailItem(index, transferDetails);
            }
            setReceiveType('payer', value);
            setReceiveVisible(true);
          }}
        >
          Payment record
        </div>
      </div>
    );
  };

  return (
    <div className={styles.payer_list} style={isMaker ? { marginBottom: '100px' } : {}}>
      <div className={styles.coll_list_title}>
        <div className={styles.list_sum}>
          <span>
            {isNaN((orderInfo?.payDetails || [])?.length - Number(orderInfo?.currCount))
              ? ''
              : (orderInfo?.payDetails || [])?.length - Number(orderInfo?.currCount)}
          </span>{' '}
          Participant(s) unpaid
        </div>
        <div className={styles.list_sum_value}>{/* Total {orderInfo?.amount} {orderInfo?.tokenSymbol} */}</div>
      </div>
      {unionBy(orderInfo?.payDetails || [], 'id').map((item: any, index: number) => {
        let markpayAmount = 0;
        let hasPaidAmount = 0;
        let unPaidAmount = 0;
        if (orderInfo?.tokenSymbol === 'USD') {
          hasPaidAmount = item?.paid;
          unPaidAmount = item?.notPaid;
        } else {
          if (item?.markpay) {
            markpayAmount = item?.amount;
          }
          hasPaidAmount = item?.status === 3 && !item?.markpay ? item?.amount : 0;
          unPaidAmount = item?.status !== 3 ? item?.amount : 0;
        }
        const isReceiver =
          orderInfo?.userId === ''
            ? item?.userAddress?.toUpperCase() === orderInfo?.userAddress?.toUpperCase()
            : item?.userId === orderInfo?.userId;
        return (
          <div className={styles.list_content} key={item?.id + index}>
            <div className={styles.list_item}>
              <div className={styles.item_name_info}>
                <UserAvatar size="2.625" borderRadius="50%" name={item?.userName} src={item?.userImage} />
                <div className={styles.item_name_value}>
                  <div className={styles.item_name}>{item?.userName}</div>
                  <div className={styles.item_time}>
                    {item?.updateTime ? dayjs(item?.updateTime).format('MMM DD, YYYY HH:mm') : ''}
                  </div>
                </div>
              </div>
              <div className={styles.item_value}>
                <div style={{ color: 'var(--color-primary)' }} className={styles.item_unit}>
                  {item?.status === 3 && CheckOutlinedIcon}
                  <div className={styles.item_value_paid}>
                    {markpayAmount ? (
                      <div className={styles.item_value_paid_mark}>
                        {markpayAmount} {orderInfo?.tokenSymbol} Marked as Paid
                      </div>
                    ) : (
                      ''
                    )}
                    <div className={styles.item_value_paid_value}>
                      {`${
                        isReceiver ? 'Receiver' : hasPaidAmount ? `${hasPaidAmount} ${orderInfo?.tokenSymbol} Paid` : ''
                      }`}
                    </div>
                  </div>
                </div>
                <div className={styles.item_uint_value}>
                  {item?.status !== 3 ? (
                    <>
                      {unPaidAmount} {orderInfo?.tokenSymbol} Unpaid
                    </>
                  ) : (
                    ''
                  )}
                </div>
              </div>
              {isMaker && item?.userId !== orderInfo?.userId && (
                <Popover
                  content={() => makerActions(item, index)}
                  overlayClassName={styles.more_action_popup}
                  trigger={['hover', 'click']}
                  getPopupContainer={(triggerNode: any) => triggerNode?.parentNode}
                >
                  <div className={styles.item_action}>{moreDotIcon}</div>
                </Popover>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PayerList;
