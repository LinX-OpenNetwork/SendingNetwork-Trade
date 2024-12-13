import { createContext, useContext, useEffect } from 'react';
import styles from './index.less';
import EqualOrSpecialDetail from './equalOrspecial';
import LoadingMask from '@/components/loading-mask';
import { useDispatch, useSelector } from 'dva';
import CollectionConfirmView from './components/comfirm-view';
import { useCollectionDetail } from './use-collection-detail';
import { useColDetailStore } from './store';

const CollectionDetail = () => {
  const dispatch = useDispatch();
  const { authedAccountInfo } = useSelector((state: any) => state.store);

  const loading = useColDetailStore((state) => state.loading);
  const orderInfo = useColDetailStore((state) => state.orderInfo);
  const isRecever = useColDetailStore((state) => state.isRecever);
  const receiveInfo = useColDetailStore((state) => state.receiveInfo);
  const confirmVisible = useColDetailStore((state) => state.confirmVisible);

  const { getOrderInfo } = useCollectionDetail();

  useEffect(() => {
    if (isRecever && receiveInfo?.status !== 3) {
      if (authedAccountInfo?.chainId !== orderInfo?.chainId) {
        dispatch({
          type: 'store/setAuthedAccountInfo',
          payload: { ...authedAccountInfo, chainId: orderInfo?.chainId }
        });
      }
    }
  }, [orderInfo?.chainId, authedAccountInfo?.chainId, isRecever]);

  // console.log('index', payToken, balanceType, isSpdInsuff, isWalletInsuff);

  return (
    <CreateContext.Provider
      value={{
        getOrderInfo
      }}
    >
      <div className={styles.wrapper}>
        {loading ? <LoadingMask visible={loading} /> : <EqualOrSpecialDetail />}

        {confirmVisible && <CollectionConfirmView visible={confirmVisible} />}
      </div>
    </CreateContext.Provider>
  );
};

export default CollectionDetail;

interface CreateContextState {
  getOrderInfo: any;
}

const CreateContext = createContext<CreateContextState>({} as CreateContextState);

export function useCreateContext(): CreateContextState {
  return useContext(CreateContext);
}
