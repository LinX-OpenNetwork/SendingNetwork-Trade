import styles from '../index.less';
import {
  MathUtil_plus,
  addressOmitShow,
  getViewScanUrl,
  linkJupIcon,
  changeIframeSrc,
  MathUtil_numberFixed,
  checkSourceType
} from '@/utils';
import TokenIcon from '@/components/token-icon';
import { groupBy, unionBy, reduce, findIndex } from 'lodash';
import { getDefaultToken } from '@/services';
import { SPD_WEB_URL } from '@/constants';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';

const PaymentRecord = ({ sltRecord }: any) => {
  const transferDetails = sltRecord?.transferDetails?.filter((o: any) => o.status !== 0 && !o.markpay);
  const spdList = transferDetails?.filter((o: any) => o.spd);
  const spdTokenList: any = [];
  spdList?.forEach((item: any) => {
    if (
      findIndex(spdTokenList, (o: any) => {
        return o?.chainId === item?.chainId && o?.tokenAddress === item?.tokenAddress;
      }) < 0
    ) {
      spdTokenList.push(item);
    }
  });
  const walletList = transferDetails?.filter((o: any) => !o.spd);

  return (
    <div className={styles.payment_record_list}>
      {/* spending */}
      {spdTokenList?.length > 0 && (
        <div className={`${styles.payer_payment_item} payer_payment_item`}>
          <div className={styles.payment_item_left}>
            <div className={styles.payment_item_title}>Payment 1</div>
            <div className={styles.payment_item_from}>From: Spending account</div>
          </div>
          <div
            className={styles.payment_item_right}
            onClick={(e) => {
              const sourceType = checkSourceType();
              let url = `${SPD_WEB_URL}/transaction?type=0&${sourceType === 'SDN' ? 'st=sdn' : 'st=sdm'}`;
              const isSdm = getPlatformInfo()?.isSdm;
              if (sourceType === 'SDN' && !isSdm) {
                changeIframeSrc(url);
              } else {
                window.location.href = url;
              }
              e.stopPropagation();
            }}
          >
            <div className={styles.payment_item_token}>
              <div className={styles.payment_stack_token}>
                {spdTokenList?.map((item: any, index: number) => {
                  return (
                    <TokenIcon
                      symbol={item?.tokenSymbol}
                      icon={item?.tokenIcon}
                      chainId={item?.chainId}
                      showChainIcon
                      key={item?.tokenAddress + index}
                    />
                  );
                })}
              </div>
              {reduce(
                spdList,
                function (sum, n) {
                  return MathUtil_plus(sum, n?.tokenAmount);
                },
                0
              )}
              <div className={styles.link}>{linkJupIcon}</div>
            </div>
          </div>
        </div>
      )}
      {/* wallet by txid */}
      {Object.keys(groupBy(walletList, 'txId'))?.map((txIdKey, index) => {
        const detailsByTxId = groupBy(walletList, 'txId')?.[txIdKey];
        let total = 0;
        detailsByTxId?.forEach((item) => {
          total = MathUtil_plus(total, item?.tokenAmount);
        });
        const detailItem = detailsByTxId[0];
        return (
          <div className={`${styles.payer_payment_item} payer_payment_item`} key={txIdKey}>
            <div className={styles.payment_item_left}>
              <div className={styles.payment_item_title}>Payment {(spdTokenList?.length > 0 ? 1 : 0) + index + 1}</div>
              <div className={styles.payment_item_from}>{'From: ' + addressOmitShow(detailItem?.payerAddress)}</div>
              {detailItem?.txFee ? (
                <div className={styles.payment_item_from}>
                  {`Gas fee: ${MathUtil_numberFixed(detailItem?.txFee, 6, 'floor')} ${
                    getDefaultToken({ chainId: detailItem?.chainId })?.symbol
                  } ($${MathUtil_numberFixed(detailItem?.txFeeUsd, 2, 'floor')})`}
                </div>
              ) : null}
            </div>
            <div
              className={styles.payment_item_right}
              onClick={(e) => {
                if (detailItem?.txId) {
                  const url = getViewScanUrl(detailItem.chainId || 1);
                  window.open(`${url}tx/${detailItem?.txId}`);
                }
                e.stopPropagation();
              }}
            >
              <div className={styles.payment_item_token}>
                <div className={styles.payment_stack_token}>
                  {unionBy(detailsByTxId, 'tokenAddress')?.map((item) => {
                    return (
                      <TokenIcon
                        symbol={item?.tokenSymbol}
                        icon={item?.tokenIcon}
                        chainId={item?.chainId}
                        showChainIcon
                        key={item?.tokenAddress}
                      />
                    );
                  })}
                </div>
                {total}
                {detailItem?.txId && <div className={styles.link}>{linkJupIcon}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PaymentRecord;
