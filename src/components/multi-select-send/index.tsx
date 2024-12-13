import styles from './index.less';
import { addressOmitShow, RightOutlinedIcon, getAuthUserInfo } from '@/utils';
import { filter, findIndex } from 'lodash';
import UserAvatar from '@/components/user-avatar';
import MemberSelectInputPopup from '@/components/multi-select-send/members-select-popup';

const MultiSelectSend = ({
  members,
  setMembers,
  balanceType,
  memberPopupVisible,
  setMemberPopupVisible,
  token,
  hasInput,
  title,
  onConfirmDisabled,
  footerExtra,
  receiver,
  setReceiver,
  isExternal
}: any) => {
  const checkedMembers = hasInput ? filter(members, (o) => o?.value > 0) : filter(members, (o) => o?.isChecked);
  const checkedMemberLen = checkedMembers?.length;
  const authUserInfo = getAuthUserInfo();
  const isReceiveInMember =
    findIndex(checkedMembers, (o: any) => o?.walletAddress?.toUpperCase() === receiver?.walletAddress?.toUpperCase()) >=
    0
      ? true
      : false;
  const showExternal = !isReceiveInMember && isExternal && receiver && receiver?.isChecked && !hasInput;
  const totalCheckedLen = checkedMemberLen + (showExternal ? 1 : 0);

  return (
    <>
      <div className={styles.select_send_wrapper}>
        <div className={styles.title}>{title}</div>
        <div className={styles.create_participants} onClick={() => setMemberPopupVisible(true)}>
          <div className={`${styles.item_input} ${totalCheckedLen > 0 ? styles.border_radius_top : ''}`}>
            <div className={styles.item_input_title}>Participants</div>
            <div className={styles.item_input_desc}>
              {totalCheckedLen === 0 ? 'Select' : <>{totalCheckedLen}&nbsp; Members</>}
              {RightOutlinedIcon}
            </div>
          </div>

          <div>
            {showExternal && (
              <ItemRender item={receiver} key={'receiver'} tokenSymbol={token?.symbol} isReceiver={true} />
            )}
            {checkedMembers.map((item: any) => {
              let isReceiver = receiver?.walletAddress?.toUpperCase() === item?.walletAddress?.toUpperCase();
              if (!isExternal) {
                isReceiver = authUserInfo?.id === item?.userId;
              }
              return <ItemRender item={item} key={item?.userId} tokenSymbol={token?.symbol} isReceiver={isReceiver} />;
            })}
          </div>
        </div>
      </div>
      {memberPopupVisible && (
        <MemberSelectInputPopup
          hasInput={hasInput}
          visible={memberPopupVisible}
          setVisible={setMemberPopupVisible}
          token={token}
          members={members}
          setMembers={setMembers}
          onConfirmDisabled={onConfirmDisabled}
          footerExtra={footerExtra}
          receiver={receiver}
          setReceiver={setReceiver}
          isExternal={isExternal}
        />
      )}
    </>
  );
};

export default MultiSelectSend;

const ItemRender = ({ item, isReceiver, balanceType, hasInput, tokenSymbol }: any) => {
  return (
    <div className={styles.member_item}>
      <div className={styles.member_item_content}>
        <UserAvatar size="2" borderRadius="50%" name={item?.name} src={item?.icon} />
        <div className={styles.item_content_name}>
          <div className={styles.name_title}>
            <div className={styles.title_value}>{item?.name}</div>
            {isReceiver && <div className={styles.external_tag}>Receiver</div>}
          </div>
          <div className={styles.name_sub}>
            {balanceType === 1 ? 'Spending account' : addressOmitShow(item?.walletAddress)}
          </div>
        </div>
      </div>
      {hasInput && (
        <div className={styles.member_item_value}>
          {item?.value} {tokenSymbol}
        </div>
      )}
    </div>
  );
};
