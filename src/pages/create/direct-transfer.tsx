import styles from './index.less';
import UserAvatar from '@/components/user-avatar';
import WantPeopleSelect from '@/components/people-select';
import { addressOmitShow, sendIcon, LoadingOutlinedIcon } from '@/utils';
import { useSelector } from 'dva';
import { Button } from 'antd-mobile';
import CreateAssets from '@/components/create-assets/assets_add';
import ConfirmView from './components/confirm-view.tsx';
import CreateLoading from '@/components/skelet-loading/create-loading';
import LargeAmountModal from '@/components/large-amount-modal';
import AddNote from '@/components/add-note';
import { useCreateStore } from './store';
import { useDirectCreate } from './use-direct';

const DirectTransferPage = () => {
  const { roomId } = useSelector((state: any) => state.store);

  const roomInfo = useCreateStore((state) => state.roomInfo);
  const toAddress = useCreateStore((state) => state.toAddress);
  const toPeople = useCreateStore((state) => state.toPeople);
  const pktMsg = useCreateStore((state) => state.pktMsg);
  const balanceType = useCreateStore((state) => state.balanceType);
  const sentUser = useCreateStore((state) => state.sentUser);
  const byAddress = useCreateStore((state) => state.byAddress);
  const checkedToken = useCreateStore((state) => state.checkedToken);
  const checkedNft = useCreateStore((state) => state.checkedNft);
  const nextLoading = useCreateStore((state) => state.nextLoading);
  const presetToken = useCreateStore((state) => state.presetToken);
  const confirmViewVisible = useCreateStore((state) => state.confirmViewVisible);
  const isInsuffBalance = useCreateStore((state) => state.isInsuffBalance);
  // large amount remainder
  const largeAmountVisible = useCreateStore((state) => state.largeAmountVisible);
  const largeAmount = useCreateStore((state) => state.largeAmount);
  const updateState = useCreateStore((state) => state.updateState);

  const { onConfirm, onConfirmClick, onHandleMultiTokenContinue } = useDirectCreate();

  // console.log('direct-transfer', checkedToken, isInsuffBalance, balanceType);

  return (
    <div className={styles.direct_wrapper}>
      <div className={styles.direct_container}>
        {/* sent-people */}
        <div className={styles.select_send_to}>
          <div className={styles.sent_title}>{sendIcon}TO</div>
          {byAddress ? (
            <WantPeopleSelect
              toAddress={toAddress}
              setToAddress={(value) => {
                updateState({ toAddress: value });
              }}
              byAddress={byAddress}
              balanceType={balanceType}
              toPeople={toPeople}
              setToPeople={(value) => {
                updateState({ toPeople: value });
              }}
            />
          ) : sentUser ? (
            <div className={styles.info}>
              <UserAvatar name={sentUser?.name} src={sentUser?.icon} size="3.125" borderRadius="50%" />
              <div className={styles.name_info}>
                <div className={styles.ens}>{sentUser?.name}</div>
                <div className={styles.address}>
                  {balanceType === 1 ? 'Spending account' : addressOmitShow(toAddress, 4, 4)}
                </div>
              </div>
            </div>
          ) : (
            <WantPeopleSelect
              toAddress={toAddress}
              setToAddress={(value) => {
                updateState({ toAddress: value });
              }}
              toPeople={toPeople}
              setToPeople={(value) => {
                updateState({ toPeople: value });
              }}
              roomId={roomId}
              roomInfo={roomInfo}
              byAddress={byAddress}
              balanceType={balanceType}
            />
          )}
        </div>
        {/* note */}
        <div className={styles.note_container}>
          <AddNote
            pktMsg={pktMsg}
            setPktMsg={(value) => {
              updateState({ pktMsg: value });
            }}
          />
        </div>
        {/* add assets  */}
        <CreateAssets
          checkedToken={checkedToken}
          setCheckedToken={(value) => {
            updateState({ checkedToken: value });
          }}
          checkedNft={checkedNft}
          setCheckedNft={(value) => {
            updateState({ checkedNft: value });
          }}
          balanceType={balanceType}
          setBalanceType={(value) => {
            updateState({ balanceType: value });
          }}
          hideBalanceTypeMenu={false}
          presetToken={presetToken}
          isSetCreateToken={true}
          isInsuffBalance={isInsuffBalance}
          createKey="send"
        />
      </div>
      <div className={styles.action_container}>
        <Button
          className={`default_btn confirm_btn`}
          disabled={
            !isInsuffBalance &&
            !nextLoading &&
            checkedToken.filter((o) => o.value && Number(o.value) > 0)?.length + checkedNft?.length > 0
              ? false
              : true
          }
          onClick={onConfirmClick}
        >
          <div className="confirm_btn_text">{nextLoading && LoadingOutlinedIcon}Next</div>
        </Button>
      </div>
      {confirmViewVisible && (
        <ConfirmView
          checkedToken={checkedToken.filter((o) => o.value && Number(o.value) > 0)}
          onConfirm={onConfirm}
          onContinue={onHandleMultiTokenContinue}
        />
      )}
      {checkedToken?.length <= 0 && checkedNft?.length <= 0 && roomInfo && roomInfo?.members?.length <= 0 && (
        <div className={styles.loading}>
          <CreateLoading />
        </div>
      )}
      {largeAmountVisible && (
        <LargeAmountModal
          amount={largeAmount}
          visible={largeAmountVisible}
          setVisible={(value) => {
            updateState({ largeAmountVisible: value });
          }}
          onContinue={() => {
            updateState({ confirmViewVisible: true });
          }}
        />
      )}
    </div>
  );
};

export default DirectTransferPage;
