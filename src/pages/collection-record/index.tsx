import { useState, useEffect, useRef } from 'react';
import styles from './index.less';
import { ORDER_TYPE_MENU, IS_LINX_AUTH, LOCAL_SDN_USER } from '@/constants';
import UserAvatar from '@/components/user-avatar';
import { getHistoryUrl, getToken, getAuthUserInfo, LocalStorage_get } from '@/utils';
import { history, useDispatch } from 'umi';
import { actionSdmAuth, getReceiveOrders } from '@/services';
import { uniqBy } from 'lodash';
import TypeHeaderMenu from '@/components/type-header-menu';
import LoadingMask from '@/components/loading-mask';
import EmptyBlock from '@/components/empty-block';
import BaseInfiniteScroll from '@/components/infinite-scroll';

const CollectionRecord = () => {
  const dispatch = useDispatch();
  // 0:collection 2:payment
  const [orderType, setOrderType] = useState<number>(0);
  // collection
  const pageNum = useRef<number>(1);
  const hasMore = useRef<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [list, setList] = useState<any[]>([]);
  // payment
  const payPageNum = useRef<number>(1);
  const payHasMore = useRef<boolean>(true);
  const [payLoading, setPayLoading] = useState<boolean>(false);
  const [payList, setPayList] = useState<any[]>([]);

  async function getListByPage(isAuto?: boolean) {
    const accessToken = getToken();
    const userInfo = getAuthUserInfo();
    let userId = userInfo.id;
    if (!userId) {
      userId = JSON.parse(LocalStorage_get(LOCAL_SDN_USER) || '{}')?.userId;
    }
    if (IS_LINX_AUTH && !accessToken) {
      actionSdmAuth(dispatch);
      return;
    }
    if (!isAuto && (orderType === 0 ? pageNum.current : payPageNum.current) === 1) {
      return;
    }
    if (orderType === 0) {
      setLoading(true);
    } else {
      setPayLoading(true);
    }
    let res: {
      list: any[];
      total: number;
    } = {
      list: [],
      total: 0
    };
    if (orderType === 0 ? hasMore.current : payHasMore.current) {
      try {
        let resp = await getReceiveOrders(
          accessToken,
          userId,
          orderType,
          orderType === 0 ? pageNum.current : payPageNum.current,
          20
        );
        res.list = resp?.result?.rows;
        res.total = resp?.result?.total;
        // console.log('queryRecordList=', res);
      } catch (error) {
        console.log(error);
      }
    }

    const newList =
      (orderType === 0 ? pageNum.current : payPageNum.current) === 1
        ? [...(res?.list ?? [])]
        : uniqBy([...(orderType === 0 ? list : payList), ...(res?.list ?? [])], 'id');

    let isHasMore = false;
    if (res?.list?.length <= 0) {
      isHasMore = false;
    } else {
      isHasMore = newList?.length < res?.total;
    }
    if (orderType === 0) {
      setList(newList);
      setLoading(false);
      pageNum.current = pageNum.current + 1;
      hasMore.current = isHasMore;
    } else {
      setPayList(newList);
      setPayLoading(false);
      payPageNum.current = payPageNum.current + 1;
      payHasMore.current = isHasMore;
    }
  }

  useEffect(() => {
    getListByPage(true);
  }, [orderType]);

  return (
    <div className={styles.wrapper}>
      <TypeHeaderMenu
        tabKey={orderType + ''}
        onTabChange={(key) => {
          setOrderType(parseInt(key, 10));
          if (key === '0') {
            if (list?.length === 0) {
              getListByPage(true);
            }
          } else {
            if (payList?.length === 0) {
              getListByPage(true);
            }
          }
        }}
        menus={ORDER_TYPE_MENU}
      />

      <div className={styles.container}>
        <ListContent
          loading={orderType === 0 ? loading : payLoading}
          list={orderType === 0 ? list : payList}
          getListByPage={getListByPage}
          hasMoreRef={orderType === 0 ? hasMore : payHasMore}
          isPay={orderType === 0 ? false : true}
        />
      </div>
    </div>
  );
};

export default CollectionRecord;

const ListContent = ({ loading, list, getListByPage, hasMoreRef, isPay }: any) => {
  function getTypeName(type: any) {
    if (type == 2 || type == '2') {
      return 'Equal';
    } else if (type == 3 || type == '3') {
      return 'Specified';
    } else {
      return 'Sign-Up';
    }
  }

  return loading || list?.length > 0 ? (
    <>
      <LoadingMask visible={loading} />
      {list?.map((item: any) => {
        return (
          <div
            className={styles.record_item}
            key={item.id}
            onClick={() => {
              history.push(getHistoryUrl(`/collection-detail?id=${item.id}&back=1`));
            }}
          >
            <div className={styles.user_container}>
              <UserAvatar size={'3'} borderRadius="50%" name="" src={item.userImage} />
              <div className={styles.name_info}>
                <div className={styles.title}>
                  {item.userName}’s {getTypeName(item.type)} Collection
                </div>
                {isPay ? (
                  <div className={styles.value}>
                    <div className={styles.sub}>
                      Amount: {item.amount?.toFixed(4)} {item.tokenSymbol}
                    </div>
                    {item?.status == 3 ? (
                      <div className={`${styles.value_container} ${styles.compeleted}`}>Paid</div>
                    ) : (
                      <div className={`${styles.value_container} ${styles.uncompeleted}`}>Unpaid</div>
                    )}
                  </div>
                ) : (
                  <div className={styles.value}>
                    <div className={styles.sub}>
                      Unit(s) ({item.currCount}/{item.totalCount})
                    </div>
                    <div
                      className={`${styles.value_container} ${
                        item.currCount === item.totalCount ? styles.compeleted : styles.uncompeleted
                      }`}
                    >
                      {item.amount?.toFixed(4)} {item.tokenSymbol}
                    </div>
                  </div>
                )}
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
        history.push(getHistoryUrl('/collection', ['type']));
      }}
      createNewName="Create New Collection"
    />
  );
};
