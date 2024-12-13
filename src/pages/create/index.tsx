import { useEffect, createContext, useContext } from 'react';
import { filter } from 'lodash';
import { TRANS_SEND_MENUS, AUTH_USER_INFO } from '@/constants';
import LoadingMask from '@/components/loading-mask';
import styles from './index.less';
import { useSelector } from 'dva';
import { history, dynamic } from 'umi';
import DirectTransferPage from './direct-transfer';
import { isFromScaned, LocalStorage_get, getAuthUserInfo, checkSourceType } from '@/utils';
import { message } from 'antd';
import RecipientTipPopup from '@/components/recipientTipPopup';
import TitleMenu from '@/components/title-menu';
import { useCreateStore } from './store';
import { pointsReport } from '@/services';

const MultipleTransferPage = dynamic({
  loader: async function () {
    return await import('./multi-transfer');
  }
});

const CreatePage = () => {
  const sourceType = checkSourceType();
  const { roomId } = useSelector((state: any) => state.store);

  const createBtnLoading = useCreateStore((state) => state.createBtnLoading);
  const roomInfo = useCreateStore((state) => state.roomInfo);
  const sendType = useCreateStore((state) => state.sendType);
  const initLoading = useCreateStore((state) => state.initLoading);
  const isPrivate = useCreateStore((state) => state.isPrivate);
  const recipientTipVisible = useCreateStore((state) => state.recipientTipVisible);
  const resetState = useCreateStore((state) => state.resetState);
  const updateState = useCreateStore((state) => state.updateState);

  async function getRoomInfo() {
    if (roomId) {
      const res = await TransferAccessService.getRoomInfo(roomId);
      if (res && res?.total) {
        updateState({ roomInfo: res });
      }
    }
  }

  function afterSuccess(orderId: string) {
    // points report start
    if (['SDN', 'SDM'].indexOf(sourceType) >= 0) {
      pointsReport({ action_type: 'transfer' }).then((pointsRes) => {
        console.log('pointsRes', pointsRes);
      });
    }
    // success
    resetState();
    // detail?id=66&roomId=!YnILqYpZbafdzcPsou:hs.sending.me
    let url = `/order?id=${orderId}&animation=1&back=1${sourceType === 'SDN' ? '&st=sdn' : ''}`;
    if (roomId) url += `&roomId=${roomId}`;
    console.log('afterSuccess', url);
    if (isFromScaned()) {
      url += `&from=scancode`;
    } else {
      if (history.location.query?.from) url += `&from=${history.location.query?.from}`;
    }

    history.push(url);
  }

  function updateRoomData() {
    const authUserInfo = getAuthUserInfo();
    if (roomInfo?.total) {
      // private chat
      if (roomInfo?.total === 2 && !history.location.query?.userId) {
        let otherPeople =
          authUserInfo?.id === roomInfo?.members[0]?.userId ? roomInfo?.members[1] : roomInfo?.members[0];
        updateState({
          toPeople: {
            id: otherPeople?.userId,
            icon: otherPeople?.icon,
            name: otherPeople?.name,
            address: otherPeople?.walletAddress
          },
          toAddress: otherPeople?.walletAddress,
          isPrivate: true
        });
      }
      // multi-transfer-equal
      const membersTemp = filter(roomInfo?.members, (o) => o?.userId != authUserInfo?.id).map((item: any) => {
        return { ...item, isChecked: false };
      });
      // multi-transfer-specified
      const participantsTemp = filter(roomInfo?.members, (o) => o?.userId != authUserInfo?.id).map((item: any) => {
        return { ...item, value: undefined };
      });
      updateState({ members: membersTemp, participants: participantsTemp });
    }
  }

  useEffect(() => {
    updateRoomData();
  }, [LocalStorage_get(AUTH_USER_INFO), roomInfo]);

  useEffect(() => {
    /* External call: 
      /create?from=wallet&chain=ethereum 
      /create?from=vault&address=xxx&chainId=5
    */
    const fromParam = history.location.query?.from;
    if (fromParam && ['vault', 'wallet'].indexOf(fromParam?.toString()) >= 0) {
    } else {
      getRoomInfo();
    }
  }, [roomId]);

  // console.log('1111', createBtnLoading, initLoading);

  return (
    <CreateContext.Provider value={{ afterSuccess }}>
      <div className={styles.wrapper}>
        {history.location.query?.from === 'wallet' || history.location.query?.from === 'vault' ? (
          /* External call: https://transfer.web3-tp.net/create?st=sdn&from=wallet&chain=ethereum */
          <>
            <div style={{ height: '20px' }}>&nbsp;</div>
            <DirectTransferPage />
          </>
        ) : (
          <>
            {isPrivate || history.location.query?.returnId ? (
              <div style={{ height: '20px' }}>&nbsp;</div>
            ) : (
              <TitleMenu
                menus={TRANS_SEND_MENUS}
                activeKey={sendType}
                setActiveKey={(value: any) => {
                  if (roomId || value === 1) {
                    updateState({ sendType: value });
                  } else {
                    message.info('The feature only supports use in a SendingMe room/group now');
                  }
                }}
                className={styles.sub_title}
              />
            )}
            {sendType === 1 ? <DirectTransferPage /> : <MultipleTransferPage />}
          </>
        )}
        {(createBtnLoading || initLoading) && (
          <LoadingMask visible={createBtnLoading || initLoading} loadingContent={createBtnLoading && ' '} />
        )}

        {recipientTipVisible && (
          <RecipientTipPopup
            visible={recipientTipVisible}
            setVisible={(value) => {
              updateState({ recipientTipVisible: value });
            }}
          />
        )}
      </div>
    </CreateContext.Provider>
  );
};

export default CreatePage;

interface CreateContextState {
  afterSuccess: any;
}

export const CreateContext = createContext<CreateContextState>({} as CreateContextState);

export function useCreateTransferContext(): CreateContextState {
  return useContext(CreateContext);
}
