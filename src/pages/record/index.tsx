import { useEffect, useState, useRef } from 'react';
import { history, useDispatch } from 'umi';
import styles from './index.less';
import { Response, TransferRecord, RoomInfo, TokenInfo, NftInfo } from '@/types';
import { getTransferRecord, actionSdmAuth } from '@/services';
import { getHistoryUrl, getToken, getAuthUserInfo, getChainName } from '@/utils';
import { useSelector } from 'dva';
import TypeHeaderMenu from '@/components/type-header-menu';
import { HISTORY_TYPE_MENU } from '@/constants';
import dayjs from 'dayjs';
import Selector from './selector';
import StackTokenIcon from '@/components/stack-token-icon';
import LoadingMask from '@/components/loading-mask';
import BaseInfiniteScroll from '@/components/infinite-scroll';
import UserAvatar from '@/components/user-avatar';
import EmptyBlock from '@/components/empty-block';

type SelectorItem = {
  name: string;
  value: string;
};

const Record = () => {
  const dispatch = useDispatch();
  const { roomId, roomInfo: sdnRoomInfo } = useSelector((state: any) => state.store);

  const [roomInfo, setRoomInfo] = useState<RoomInfo | undefined>(undefined);
  const [tabKey, setTabKey] = useState<number>(
    history?.location?.query?.type ? parseInt(history?.location?.query?.type?.toString()) : 0
  );
  const [selectorList, setSelectorList] = useState<SelectorItem[]>([]);

  // sent-list
  const pageNum = useRef<number>(1);
  const hasMore = useRef<boolean>(true);
  const [selectorValue, setSelectorValue] = useState<string>('');
  const [selectorSubValue, setSelectorSubValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [list, setList] = useState<any[]>([]);
  // receive-list
  const receivePageNum = useRef<number>(1);
  const receiveHasMore = useRef<boolean>(true);
  const [receiveSelectorValue, setReceiveSelectorValue] = useState<string>('');
  const [receiveSelectorSubValue, setReceiveSelectorSubValue] = useState<string>('');
  const [receiveLoading, setReceiveLoading] = useState<boolean>(true);
  const [receiveList, setReceiveList] = useState<any[]>([]);

  async function getRoomInfo(roomId: string) {
    setSelectorList([
      {
        name: 'Current room',
        value: 'room'
      }
    ]);
    if (sdnRoomInfo) {
      setRoomInfo(sdnRoomInfo);
    } else {
      if (roomId) {
        const res = await TransferAccessService.getRoomInfo(roomId);
        if (res && res?.total) {
          setRoomInfo(res);
        }
      }
    }
  }

  async function queryRecordList(params: any) {
    const response: Response = await getTransferRecord(params);
    if (!response.success || !response?.result?.rows) {
      return { list: [], total: 0 };
    } else {
      return { list: response?.result?.rows, total: response?.result?.total };
    }
  }

  async function getListByPage(isAuto?: boolean, params?: any) {
    const accessToken = getToken();
    const tabKeyValue = params?.tabKeyParam ?? tabKey;
    const sltValue =
      tabKeyValue === 0 ? params?.sltValueParam ?? selectorValue : params?.sltValueParam ?? receiveSelectorValue;
    const sltSubValue =
      tabKeyValue === 0
        ? params?.sltSubValueParam ?? selectorSubValue
        : params?.sltSubValueParam ?? receiveSelectorSubValue;
    if (!isAuto && (tabKeyValue === 0 ? pageNum.current : receivePageNum.current) === 1) {
      return;
    }
    if (!accessToken) {
      actionSdmAuth(dispatch);
      return;
    }
    let res: {
      list: any[];
      total: number;
    } = {
      list: [],
      total: 0
    };
    if (tabKeyValue === 0) {
      setLoading(true);
    } else {
      setReceiveLoading(true);
    }
    if (tabKeyValue === 0 ? hasMore.current : receiveHasMore.current) {
      const userInfo = getAuthUserInfo();
      try {
        let queryRoomId = '';
        let queryRecId = '';
        if (sltValue === 'room') {
          queryRoomId = roomId;
          queryRecId = sltSubValue;
        } else if (!sltSubValue) {
          queryRecId = sltValue;
        }
        // console.log('queryRoomId=' + queryRoomId);
        res = await queryRecordList({
          accessToken,
          direction: tabKeyValue,
          page: tabKeyValue === 0 ? pageNum.current : receivePageNum.current,
          rows: 20,
          roomId: queryRoomId,
          userId: userInfo?.id,
          relatedUserId: queryRecId
        });
      } catch (error) {
        console.log(error);
      }
    }
    const newList =
      (tabKeyValue === 0 ? pageNum.current : receivePageNum.current) === 1
        ? [...(res?.list ?? [])]
        : [...(tabKeyValue === 0 ? list : receiveList), ...(res?.list ?? [])];

    let isHasMore = false;
    if (res?.list?.length <= 0) {
      isHasMore = false;
    } else {
      isHasMore = newList?.length < res?.total;
    }
    if (tabKeyValue === 0) {
      setList(newList);
      setLoading(false);
      pageNum.current = pageNum.current + 1;
      hasMore.current = isHasMore;
    } else {
      setReceiveList(newList);
      setReceiveLoading(false);
      receivePageNum.current = receivePageNum.current + 1;
      receiveHasMore.current = isHasMore;
    }
  }

  useEffect(() => {
    if (roomInfo?.members?.length === 2) {
      const authUserInfo = getAuthUserInfo();
      roomInfo?.members?.forEach((item) => {
        if (authUserInfo?.id === item?.userId) {
        } else {
          setSelectorValue('room');
          setSelectorSubValue(item?.userId);
          setReceiveSelectorValue('room');
          setReceiveSelectorSubValue(item?.userId);
          pageNum.current = 1;
          hasMore.current = true;
          setList([]);
          setLoading(true);
          getListByPage(true, { tabKeyParam: tabKey, sltValueParam: 'room', sltSubValueParam: item?.userId });
        }
      });
    }
  }, [roomInfo?.members?.length]);

  useEffect(() => {
    getRoomInfo(roomId);
  }, [roomId]);

  useEffect(() => {
    const type = history?.location?.query?.type ? parseInt(history?.location?.query?.type?.toString()) : 0;
    getListByPage(true, { tabKeyParam: type });
  }, []);

  console.log('receiveLoading', receiveLoading);

  return (
    <div className={styles.wrapper}>
      <TypeHeaderMenu
        tabKey={tabKey + ''}
        onTabChange={(key) => {
          setTabKey(parseInt(key, 10));
          history.replace(getHistoryUrl(history?.location?.pathname + '?type=' + key, ['type']));
          if (key === '0') {
            if (list?.length === 0) {
              getListByPage(true, { tabKeyParam: 0 });
            }
          } else {
            if (receiveList?.length === 0) {
              getListByPage(true, { tabKeyParam: 1 });
            }
          }
        }}
        menus={HISTORY_TYPE_MENU}
      />
      {(roomInfo?.members || [])?.length > 0 && (
        <Selector
          roomInfo={roomInfo}
          selectorValue={tabKey === 0 ? selectorValue : receiveSelectorValue}
          setSelectorValue={tabKey === 0 ? setSelectorValue : setReceiveSelectorValue}
          selectorList={selectorList}
          selectorSubValue={tabKey === 0 ? selectorSubValue : receiveSelectorSubValue}
          setSelectorSubValue={tabKey === 0 ? setSelectorSubValue : setReceiveSelectorSubValue}
          onSelectChange={(value) => {
            const { sltValue, sltSubValue } = value;
            if (tabKey === 0) {
              pageNum.current = 1;
              hasMore.current = true;
              setList([]);
              setLoading(true);
              getListByPage(true, { tabKeyParam: 0, sltValueParam: sltValue, sltSubValueParam: sltSubValue });
            } else {
              receivePageNum.current = 1;
              receiveHasMore.current = true;
              setReceiveList([]);
              setReceiveLoading(true);
              getListByPage(true, { tabKeyParam: 1, sltValueParam: sltValue, sltSubValueParam: sltSubValue });
            }
          }}
        />
      )}
      <ListContent
        tabKey={tabKey}
        loading={tabKey === 0 ? loading : receiveLoading}
        setLoading={tabKey === 0 ? setLoading : setReceiveLoading}
        list={tabKey === 0 ? list : receiveList}
        getListByPage={getListByPage}
        hasMoreRef={tabKey === 0 ? hasMore : receiveHasMore}
      />
    </div>
  );
};

export default Record;

const ListContent = ({ tabKey, loading, setLoading, list, getListByPage, hasMoreRef }: any) => {
  return (
    <div className={styles.list_content}>
      {loading || list?.length > 0 ? (
        <>
          <LoadingMask visible={loading} onMaskClick={() => setLoading(false)} />
          {list?.map((item: TransferRecord, index: number) => {
            let tokens: (TokenInfo | NftInfo)[] = item?.tokens.map((tokenItem) => {
              if (tokenItem.type !== 2) {
                return {
                  symbol: tokenItem?.tokenSymbol,
                  name: tokenItem?.tokenSymbol,
                  address: tokenItem?.tokenAddress,
                  decimals: tokenItem?.tokenDecimal,
                  chainId: item?.chainId,
                  balanceValue: tokenItem?.tokenAmount,
                  icon: tokenItem?.tokenIcon,
                  balanceType: 2
                };
              } else {
                return {
                  id: tokenItem?.tokenId,
                  title: tokenItem?.tokenSymbol,
                  contractAddress: tokenItem?.tokenAddress,
                  chainId: item?.chainId,
                  icon: tokenItem?.tokenIcon,
                  balanceType: 2
                };
              }
            });
            let userInfo =
              tabKey === 0
                ? { userId: item?.receiverUserId, userName: item?.receiverUserName, userImage: item?.receiverUserImage }
                : { userId: item?.makerUserId, userName: item?.makerUserName, userImage: item?.makerUserImage };

            return (
              <div
                className={styles.record_list_item}
                key={item?.id + index}
                onClick={() => {
                  history.push(
                    getHistoryUrl('/order?id=' + item.id + '&back=1&roomId=' + item.roomId, ['id', 'roomId', 'type'])
                  );
                }}
              >
                <div className={styles.user_icon}>
                  <UserAvatar
                    name={userInfo?.userName}
                    src={userInfo?.userImage || ''}
                    size="3.375"
                    borderRadius="50%"
                    style={{ marginRight: '1rem' }}
                  />
                  <img
                    src={`/image/token/chain_${getChainName(item?.chainId)}.png`}
                    className={styles.chain_icon}
                    width={16}
                    height={16}
                  />
                </div>
                <div className={styles.item_name}>
                  <div className={styles.name_info}>
                    <div>{userInfo?.userName}</div>
                    <div className={styles.value}>{dayjs(item.createTime).format('MMM DD,YYYY HH:mm')}</div>
                  </div>
                  <div className={styles.item_count}>
                    {/*{item?.tokenAmount} {item?.tokenSymbol}*/}
                    <StackTokenIcon list={tokens} showCount={3} />
                  </div>
                </div>
              </div>
            );
          })}
          <BaseInfiniteScroll loadMore={getListByPage} hasMore={hasMoreRef?.current} />
        </>
      ) : (
        <EmptyBlock
          isCreateNew={true}
          createNewAction={() => {
            history.push(getHistoryUrl('/create', ['type']));
          }}
          createNewName="Create New Transfer"
        />
      )}
    </div>
  );
};
