import { useEffect, useState } from 'react';
import { history } from 'umi';
import { isArray, find, findIndex, uniq, filter } from 'lodash';
import styles from './index.less';
import {
  getHistoryUrl,
  LocalStorage_get,
  getViewScanUrl,
  sdmOpenWallet,
  showSelfAssets,
  getToken,
  getChainName,
  linkJupIcon,
  downOutIcon,
  changeIframeSrc,
  LoadingOutlinedIcon,
  CheckOutlinedIcon,
  getAuthUserInfo,
  MathUtil_numberFixed,
  checkSourceType,
  LeftOutlinedIcon
} from '@/utils';
import { getTransferOrder, receiveOrder, returnOrder, getDefaultToken } from '@/services';
import { AUTH_USER_INFO, ETH_SUPPORTED_CHAINS, LINX_AUTH_INFO, SPD_WEB_URL } from '@/constants';
import dayjs from 'dayjs';
import StackTokenIcon from '@/components/stack-token-icon/detail-stack';
import { TokenInfo, NftInfo } from '@/types';
import { Button, Space, message } from 'antd';
import LoadingMask from '@/components/loading-mask';
import ContactNode from '@/components/contact-node';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import RecipientTipPopup from '@/components/recipientTipPopup';
import MultiTokenIcon from './multi-token-icon';
import SuccessAnimation from './success-animation';

const DetailPage = () => {
  const isSdm = getPlatformInfo()?.isSdm;

  const [loading, setLoading] = useState<boolean>(false);
  const [orderInfo, setOrderInfo] = useState<any>(undefined);
  const [tokens, setTokens] = useState<(NftInfo | TokenInfo)[]>([]);
  const [sendMore, setSendMore] = useState<boolean>(false);
  const [orderTitle, setOrderTitle] = useState<string>('');
  const [recipientTipVisible, setRecipientTipVisible] = useState<boolean>(false);
  const [isMaker, setIsMaker] = useState<boolean>(false);
  const [isReceiver, setIsReceiver] = useState<boolean>(false);
  // receiverStatus: 0: waiting accept; 1: received; 2: failed; 3: returned Succeeded; 4: returned failed
  const [receiveInfo, setReceiveInfo] = useState<any>(undefined);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [isReturning, setIsReturning] = useState<boolean>(false);
  const [succAnimationVisible, setSuccAnimationVisible] = useState<boolean>(
    history.location.query?.animation ? true : false
  );

  const STATUS_CONFIG: any = {
    0: 'Waiting to be accepted',
    1: 'Transfer Completed',
    2: 'Failed',
    3: 'Returned',
    4: 'Refund failed'
  };

  const orderChainInfo = find(ETH_SUPPORTED_CHAINS, { chain_id: orderInfo?.chainId });

  function getOrderInfo(queryId: string) {
    const accessToken = getToken();
    if (!accessToken) return;
    setLoading(true);
    getTransferOrder(accessToken, queryId)
      .then((resp) => {
        if (resp.success && resp.result) {
          let order = resp.result[0];
          setOrderInfo(order);
          updateOrderTitle(order);
          let tokenArr: (NftInfo | TokenInfo)[] = [];
          (order?.receivers || [])?.forEach((item: any) => {
            (item?.tokens || [])?.forEach((tokenItem: any) => {
              if (tokenItem?.type === 0 || tokenItem?.type === 1) {
                // token
                tokenArr.push({
                  symbol: tokenItem?.tokenSymbol,
                  name: tokenItem?.tokenSymbol,
                  address: tokenItem?.tokenAddress,
                  decimals: tokenItem?.tokenDecimal,
                  chainId: order.chainId,
                  icon: tokenItem?.tokenIcon,
                  balanceValue: tokenItem?.tokenAmount,
                  balanceType: 0
                });
              } else if (tokenItem?.type === 2) {
                // erc 721
                tokenArr.push({
                  id: tokenItem?.tokenId,
                  contractAddress: tokenItem?.tokenAddress,
                  symbol: tokenItem?.tokenSymbol,
                  title: tokenItem?.tokenSymbol,
                  decimals: tokenItem?.tokenDecimal,
                  chainId: order.chainId,
                  icon: tokenItem?.tokenIcon,
                  balance: tokenItem?.tokenAmount,
                  type: tokenItem?.type === 2 ? 1 : 2,
                  balanceType: 0
                });
              }
            });
          });
          setTokens(tokenArr);
        } else {
          console.log('getTransferDetail detail error, ' + resp.errorMsg);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }

  async function onAccept() {
    const accessToken = getToken();
    if (!accessToken) return;
    setIsAccepting(true);
    const res = await receiveOrder(orderInfo?.id, accessToken).finally(() => {
      setIsAccepting(false);
    });
    if (res && res?.success) {
      roomNotification(1);
      getOrderInfo(orderInfo?.id);
    } else {
      message.error(res?.errorMsg || 'Accept error');
      return;
    }
  }

  async function onReturn() {
    const accessToken = getToken();
    if (!accessToken) return;
    setIsReturning(true);
    const res = await returnOrder(receiveInfo?.id, accessToken).finally(() => {
      setIsReturning(false);
    });
    if (res && res?.success) {
      roomNotification(2);
      getOrderInfo(orderInfo?.id);
    } else {
      message.error(res?.errorMsg || 'Return error');
      return;
    }
  }

  async function roomNotification(type: number) {
    // xxx has rejected/accepted the Transfer from xxx
    console.log('roomNotification');
    const sourceType = checkSourceType();
    TransferAccessService.sendEvent(orderInfo?.roomId, {
      body: `has ${type === 1 ? 'accepted' : 'rejected'} the Transfer from ${orderInfo?.makerUserName}`,
      icon: LINX_AUTH_INFO.redirectUri + '/logo_icon.png',
      link: `${LINX_AUTH_INFO.redirectUri}/order?id=${orderInfo?.id}${sourceType === 'SDN' ? '&st=sdn' : ''}${
        orderInfo?.roomId ? `&roomId=${orderInfo?.roomId}` : ''
      }`,
      link_text: 'Transfer'
    });
  }

  function updateOrderTitle(order: any) {
    let statusArray = [];
    const receiversLen = order?.receivers?.length;
    for (let i = 0; i < receiversLen; i++) {
      statusArray.push(order?.receivers[i]?.status);
    }
    if (receiversLen > 1) {
      statusArray = uniq(statusArray);
      if (statusArray?.length === 1) {
        setOrderTitle(STATUS_CONFIG[statusArray[0]]);
      } else {
        let accpetedLength = filter(order.receivers, {
          status: 1
        })?.length;
        setOrderTitle(`Accepted ${accpetedLength}/${receiversLen}`);
      }
    } else {
      setOrderTitle(STATUS_CONFIG[statusArray[0]]);
    }
  }

  useEffect(() => {
    const queryParams = history.location.query;
    let queryId = queryParams?.id;
    if (queryId && !isArray(queryId)) {
      getOrderInfo(queryId);
    }
  }, [getToken()]);

  useEffect(() => {
    const authUserInfo = getAuthUserInfo();
    if (authUserInfo?.id === orderInfo?.makerUserId) {
      setIsMaker(true);
    }
    const receIndex = findIndex(orderInfo?.receivers, {
      receiverUserId: authUserInfo?.id
    });
    if (receIndex >= 0) {
      setIsReceiver(true);
      setReceiveInfo(orderInfo?.receivers[receIndex]);
    }
  }, [orderInfo, LocalStorage_get(AUTH_USER_INFO)]);

  useEffect(() => {
    if (history.location.query?.animation) {
      history.replace(`/order${history.location?.search}`?.replace('&animation=1', ''));
    }
  }, []);

  // console.log('order', chainAssetsType);

  return loading ? (
    <LoadingMask visible={loading} />
  ) : (
    <>
      <div className={styles.record_wrapper}>
        <div
          className={styles.card}
          // style={{
          //   background: orderChainInfo ? `url("${orderChainInfo?.chain_icon_bg}") 30% 10% / 1000% no-repeat` : '#627EEA'
          // }}
        >
          <div className={styles.cardBg}>
            {history.location.query?.back && (
              <div
                className={styles.backBtn}
                onClick={() => {
                  if (history?.length <= 2) {
                    history.push(getHistoryUrl('/create'));
                  } else {
                    history.goBack();
                  }
                }}
              >
                {LeftOutlinedIcon}
              </div>
            )}
            <div className={styles.title}>
              {orderInfo?.spd ? (isReceiver ? STATUS_CONFIG?.[receiveInfo?.status] : orderTitle) : orderTitle}
            </div>
            <div className={styles.token_list}>
              {orderInfo?.receivers?.length === 1 || isReceiver ? (
                <StackTokenIcon
                  list={tokens}
                  showCount={orderInfo?.receivers?.length > 1 && isReceiver ? 1 : 2}
                  showMoreList={true}
                  receivers={orderInfo?.receivers}
                  createTime={dayjs(orderInfo?.createTime).format('MMM DD, YYYY HH:mm')}
                />
              ) : (
                <MultiTokenIcon tokens={tokens} orderInfo={orderInfo} />
              )}
            </div>
          </div>
          {succAnimationVisible && (
            <SuccessAnimation
              spd={orderInfo?.spd}
              visible={succAnimationVisible}
              setVisible={setSuccAnimationVisible}
            />
          )}
        </div>
        <div
          className={`${styles.content} ${
            isReceiver && ((receiveInfo?.status === 0 && orderInfo?.spd) || receiveInfo?.status === 1)
              ? styles.content_footer_bottom
              : ''
          }`}
        >
          {/* From */}
          <div className={styles.content_item}>
            <div className={styles.item_title}>From</div>
            <ContactNode
              userName={orderInfo?.makerUserName}
              userImage={orderInfo?.makerUserImage}
              userAddress={orderInfo?.makerAddress}
              sdmUserId={orderInfo?.makerUserId}
              balanceType={orderInfo?.spd ? 1 : 2}
              // bgImage={'/image/icon/contact_from_bg.png'}
            />
          </div>
          {/* Send to */}
          <div className={styles.content_item}>
            <div
              className={`${styles.item_title} ${orderInfo?.receivers?.length > 1 ? styles.onlink : ''} ${
                sendMore ? styles.upOutArrow : styles.downOutArrow
              }`}
              onClick={() => {
                setSendMore(!sendMore);
              }}
            >
              Send to{' '}
              {orderInfo?.receivers?.length > 1 ? (
                <>
                  ({orderInfo?.receivers?.length}) {downOutIcon}
                </>
              ) : (
                ''
              )}
            </div>
            {orderInfo?.receivers?.map((item: any, index: number) => {
              let receiveTime = dayjs(item?.time).format('MMM DD, YYYY HH:mm');
              let receiveTokens = '';
              item?.tokens?.forEach((tokenItem: any) => {
                receiveTokens += `${tokenItem?.tokenAmount} ${tokenItem?.tokenSymbol}, `;
              });
              if (receiveTokens !== '') {
                receiveTokens = receiveTokens.substring(0, receiveTokens.length - 2);
              }
              let extraContent =
                orderInfo?.spd && orderInfo?.receivers?.length > 1 ? (
                  <div className={styles.receive_spd_info}>
                    <div
                      className={styles.spd_info_title}
                      style={item?.status === 1 ? { color: 'var(--color-primary)' } : {}}
                    >
                      {item?.status === 0 && 'Pending accept'}
                      {item?.status === 1 && <>{receiveTime} Accepted</>}
                      {item?.status === 3 && 'Returned'}
                    </div>

                    <div
                      className={styles.spd_info_token}
                      style={item?.status === 1 ? { color: 'var(--color-primary)' } : {}}
                    >
                      {item?.status === 1 && (
                        <>
                          {CheckOutlinedIcon}
                          &nbsp;
                        </>
                      )}
                      {receiveTokens}
                    </div>
                  </div>
                ) : (
                  <></>
                );
              return (
                <div
                  className={`${styles.item_record} ${index > 0 ? (sendMore ? styles.show : styles.hidden) : ''}`}
                  key={item?.receiverUserId}
                >
                  <ContactNode
                    userName={item?.receiverUserName}
                    userImage={item?.receiverUserImage}
                    userAddress={item?.receiverAddress}
                    sdmUserId={item?.receiverUserId === item?.receiverAddress ? null : item?.receiverUserId}
                    balanceType={orderInfo?.spd ? 1 : 2}
                    hideContact={orderInfo?.spd && orderInfo?.receivers?.length > 1 ? true : false}
                    extraContent={extraContent}
                    // bgImage={'/image/icon/contact_to_bg.png'}
                  />
                </div>
              );
            })}
          </div>
          {/* Chain */}
          <div className={styles.content_item}>
            <div className={styles.item_title}>Chain</div>
            <div className={styles.item_value}>
              <img
                src={`/image/token/chain_${getChainName(orderInfo?.chainId)}.png`}
                width={16}
                height={16}
                style={{ marginRight: '5px', borderRadius: '50%' }}
              />
              {orderChainInfo?.transfer_network}
            </div>
          </div>
          {/* Gas fee */}
          {!orderInfo?.spd && orderInfo?.txFee && (
            <div className={styles.content_item}>
              <div className={styles.item_title}>Gas fee</div>
              <div className={styles.item_value}>
                {`${MathUtil_numberFixed(orderInfo?.txFee, 6, 'floor')} ${
                  getDefaultToken({ chainId: orderInfo?.chainId })?.symbol
                } ($${MathUtil_numberFixed(orderInfo?.txFeeUsd, 2, 'floor')})`}
              </div>
            </div>
          )}
          {/* Note */}
          {orderInfo?.message && orderInfo?.message !== '' && (
            <div className={styles.content_item}>
              <div className={styles.item_title}>Note</div>
              <div className={styles.item_value}>{orderInfo?.message}</div>
            </div>
          )}
          {/* TxId */}
          {orderInfo?.txId && (
            <div
              className={styles.item_scan}
              onClick={(e) => {
                const url = getViewScanUrl(tokens?.[0]?.chainId || 1);
                window.open(`${url}tx/${orderInfo?.txId}`);
                e.stopPropagation();
              }}
            >
              <div className={styles.item_title_scan}>
                View on block explorer
                <div className={styles.item_title_scan}>{linkJupIcon}</div>
              </div>
            </div>
          )}
          {/* Transfer Time */}
          <div className={styles.content_item}>
            <div className={styles.item_title}>Transfer Time</div>
            <div className={styles.item_value}>{dayjs(orderInfo?.createTime).format('MMM DD, YYYY HH:mm')}</div>
          </div>
          {/* Time direct transfer */}
          {orderInfo?.receivers?.length === 1 && orderInfo?.receivers[0]?.status !== 0 && (
            <div className={styles.content_item}>
              <div className={styles.item_title}>
                {orderInfo?.receivers[0]?.status === 1 ? 'Receive Time' : 'Return Time'}
              </div>
              <div className={styles.item_value}>
                {orderInfo?.receivers[0]?.time ? dayjs(orderInfo?.receivers[0]?.time).format('MMM DD, YYYY HH:mm') : ''}
              </div>
            </div>
          )}
        </div>
        {isReceiver && ((receiveInfo?.status === 0 && orderInfo?.spd) || receiveInfo?.status === 1) && (
          <div className={styles.footer}>
            {receiveInfo?.status === 0 && orderInfo?.spd && (
              <div className={styles.receive_actions}>
                <div className={styles.title}>If accepted, it will be transferred to your spending account.</div>
                <div className={styles.tip} onClick={() => setRecipientTipVisible(true)}>
                  Learn more
                </div>
                <div className={styles.buttons}>
                  <Space className={styles.buttons_space} size={10}>
                    <Button className="default_btn cancel_btn" disabled={isReturning} onClick={onReturn}>
                      {isReturning && LoadingOutlinedIcon}
                      Return
                    </Button>
                    <Button className="default_btn confirm_btn" disabled={isAccepting} onClick={onAccept}>
                      {isAccepting && LoadingOutlinedIcon}Accept
                    </Button>
                  </Space>
                </div>
              </div>
            )}
            {receiveInfo?.status === 1 && (
              <div className={styles.assets_actions}>
                <Space direction="vertical" size={15}>
                  {orderInfo?.spd ? (
                    <Button
                      className="default_btn confirm_btn"
                      onClick={() => {
                        const sourceType = checkSourceType();
                        let url = `${SPD_WEB_URL}/index?${sourceType === 'SDN' ? 'st=sdn' : 'st=sdm'}`;
                        const isSdm = getPlatformInfo()?.isSdm;
                        if (sourceType === 'SDN' && !isSdm) {
                          // support iframe
                          // const userProfile = LocalStorage_get(LOCAL_SDN_USER);
                          // url = `${url}&user=${userProfile ? encodeURIComponent(userProfile) : {}}`;
                          changeIframeSrc(url);
                        } else {
                          window.location.href = url;
                        }
                      }}
                    >
                      View in Spending account
                    </Button>
                  ) : (
                    <Button
                      className="default_btn confirm_btn"
                      onClick={() => {
                        const authUserInfo = getAuthUserInfo();
                        let linxAccAdd = authUserInfo?.address;
                        let network = orderChainInfo?.sdm_wallet || 'ethereum';
                        if (isSdm) {
                          sdmOpenWallet(linxAccAdd, network, 0);
                        } else {
                          if (self === top) {
                            message.error('Open in Sendingme');
                            return;
                          } else {
                            showSelfAssets('tokens', network);
                          }
                        }
                      }}
                    >
                      Check Wallet Assets
                    </Button>
                  )}

                  {!orderInfo?.spd && isReceiver && receiveInfo?.status !== 3 && !orderInfo?.originId && (
                    <Button
                      className="default_btn cancel_btn"
                      onClick={() => {
                        history.push(getHistoryUrl(`create?returnId=${orderInfo?.id}`, ['id', 'type', 'returnId']));
                      }}
                    >
                      Return
                    </Button>
                  )}
                </Space>
              </div>
            )}
          </div>
        )}
      </div>

      {recipientTipVisible && <RecipientTipPopup visible={recipientTipVisible} setVisible={setRecipientTipVisible} />}
    </>
  );
};

export default DetailPage;
