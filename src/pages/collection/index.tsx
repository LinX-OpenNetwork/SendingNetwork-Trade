import { useState } from 'react';
import styles from './index.less';
import { COLLECTION_MENUS } from '@/constants';
import { find } from 'lodash';
import { Button } from 'antd-mobile';
import { useSelector } from 'dva';
import { addressOmitShow, downOutIcon, LoadingOutlinedIcon } from '@/utils';
import UserAvatar from '@/components/user-avatar';
import LoadingMask from '@/components/loading-mask';
import SelectAccountPopup from '@/components/page-nav-bar/select_account_popup';
import AssetsTokenChange from '@/components/create-assets/assets_change';
import AssetsTokenSelect from '@/components/create-assets/assets_select';
import AddNote from '@/components/add-note';
import TitleMenu from '@/components/title-menu';
import AcceptSdpSwitchBtn from '@/components/accept-spd-switchbtn';
import MultiSelectSend from '@/components/multi-select-send';
import AddExternal from '@/components/add-external';
import { useCollectionStore } from './store';
import { useCollection } from './use-collection';

const CollectionPage = () => {
  const { accountList } = useSelector((state: any) => state.store);

  const [balanceType, setBalanceType] = useState<number>(2);
  const {
    // sign-up
    isAcceptSpd,
    cltType,
    token,
    descTitle,
    selectAccountVisible,
    collectionAccount,
    tokenAmount,
    createBtnLoading,
    showAmount,
    updateState,
    // equals
    members,
    membersVisible,
    // specified
    participants,
    partiPopupVisible,
    //
    addExternalVisible,
    isExternal
  } = useCollectionStore();

  const cltTypeObj = find(COLLECTION_MENUS, { value: cltType });

  const { checkConfirmParam } = useCollection();

  console.log('create-collection', token);

  return (
    <div className={styles.wrapper}>
      <div className={styles.create_content}>
        <TitleMenu
          menus={COLLECTION_MENUS}
          activeKey={cltType}
          setActiveKey={(value) => {
            updateState({ cltType: value });
          }}
          menuPopTextColor={'var(--color-text-sw-2-3)'}
          extraNode={<div className={styles.create_title}>{cltTypeObj?.amountDesc}</div>}
        />
        {/* Equal Token */}
        {cltType === 2 && (
          <AssetsTokenChange
            token={token ? { ...token, id: token?.address, value: tokenAmount } : undefined}
            setToken={(value) => {
              updateState({ token: value });
            }}
            onChangeVaule={(value: any) => {
              updateState({ tokenAmount: value === '' ? undefined : value });
            }}
            balanceType={2}
            setBalanceType={() => {}}
            hideBalanceTypeMenu={true}
            hideNftTab={true}
            isReceive={true}
            isSetCreateToken={true}
            createKey={'receive'}
            isContainUSD={true}
          />
        )}
        {/* Specified Token */}
        {cltType === 3 && (
          <AssetsTokenSelect
            token={token && token?.address ? { ...token, id: token?.address } : undefined}
            setToken={(value) => {
              updateState({ token: value });
            }}
            balanceType={balanceType}
            setBalanceType={setBalanceType}
            hideBalanceTypeMenu={true}
            isReceive={true}
            hideBalance={true}
            isSetCreateToken={true}
            createKey={'receive'}
            isContainUSD={true}
          />
        )}
        {/* Notes */}
        <AddNote
          pktMsg={descTitle}
          setPktMsg={(value) => {
            updateState({ descTitle: value });
          }}
        />
        {/* Receiving Account */}
        <div className={styles.create_address}>
          <div className={styles.title}>Receiving Account</div>
          <div
            className={styles.wallet_item}
            onClick={() => {
              updateState({ selectAccountVisible: true });
            }}
          >
            <div className={styles.wallet_name}>
              <UserAvatar size="3" borderRadius="50%" name={collectionAccount?.name} src={collectionAccount?.icon} />
              <div className={styles.wallet_name_info}>
                <div className={styles.name_title}>{collectionAccount?.name}</div>
                <div className={styles.name_sub}>{addressOmitShow(collectionAccount?.walletAddress)}</div>
              </div>
            </div>
            <div
              className={`${styles.wallet_action} ${selectAccountVisible ? styles.upOutArrow : styles.downOutArrow}`}
            >
              {downOutIcon}
            </div>
          </div>
        </div>
        {/* Accept spending */}
        {!isExternal && (
          <AcceptSdpSwitchBtn
            isAcceptSpd={isAcceptSpd}
            setIsAcceptSpd={(value) => {
              updateState({ isAcceptSpd: value });
            }}
          />
        )}
        <MultiSelectSend
          title="From"
          receiver={collectionAccount}
          setReceiver={(value) => {
            updateState({ collectionAccount: value });
          }}
          isExternal={isExternal}
          members={cltType === 2 ? members : participants}
          setMembers={(value) => {
            if (cltType === 2) {
              updateState({ members: value });
            } else {
              updateState({ participants: value });
            }
          }}
          balanceType={balanceType}
          memberPopupVisible={cltType === 2 ? membersVisible : partiPopupVisible}
          setMemberPopupVisible={(value) => {
            if (cltType === 2) {
              updateState({ membersVisible: value });
            } else {
              updateState({ partiPopupVisible: value });
            }
          }}
          token={token}
          hasInput={cltType === 2 ? false : true}
        />
      </div>
      <div className={styles.create_action}>
        <div className={styles.total_content}>
          <div className={styles.title}>{cltTypeObj?.summaryDesc}</div>
          <div className={styles.value}>
            {showAmount ? showAmount : '0.00'}
            &nbsp;
            <span>{token?.symbol}</span>
          </div>
        </div>
        <Button
          className={`default_btn confirm_btn ${createBtnLoading ? styles.disabled : ''} `}
          onClick={() => {
            checkConfirmParam();
          }}
          disabled={createBtnLoading}
        >
          <div className="confirm_btn_text">
            {createBtnLoading && LoadingOutlinedIcon}
            Confirm
          </div>
        </Button>
      </div>
      {createBtnLoading && <LoadingMask visible={createBtnLoading} loadingContent={' '} />}
      {selectAccountVisible && (
        <SelectAccountPopup
          visible={selectAccountVisible}
          setVisible={(value: boolean, addExternal: boolean) => {
            updateState({ selectAccountVisible: value, addExternalVisible: addExternal ? addExternal : false });
          }}
          currentAccount={collectionAccount}
          setAccount={(value: any) => {
            updateState({
              collectionAccount: {
                ...collectionAccount,
                name: value?.walletName,
                icon: value?.verifySourceLogo ?? collectionAccount?.icon,
                walletAddress: value?.walletAddress
              },
              isExternal: false,
              isAcceptSpd: true
            });
          }}
        />
      )}
      {addExternalVisible && (
        <AddExternal
          visible={addExternalVisible}
          setVisible={(value) => {
            updateState({ addExternalVisible: value });
          }}
          setAccount={(value: any) => {
            if (value?.walletAddress?.toUpperCase() === collectionAccount?.walletAddress?.toUpperCase()) {
              updateState({ addExternalVisible: false });
              return;
            }
            const existIndex = accountList?.findIndex(
              (o) => o?.walletAddress?.toUpperCase() === value?.walletAddress?.toUpperCase()
            );
            if (existIndex >= 0) {
              updateState({
                collectionAccount: {
                  value: '',
                  userId: '',
                  isChecked: false,
                  walletAddress: accountList?.[existIndex]?.walletAddress,
                  name: accountList?.[existIndex]?.walletName,
                  icon: accountList?.[existIndex]?.verifySourceLogo
                },
                isExternal: false,
                addExternalVisible: false,
                isAcceptSpd: true
              });
            } else {
              updateState({
                collectionAccount: {
                  value: '',
                  userId: '',
                  isChecked: false,
                  walletAddress: value?.walletAddress,
                  name: value?.name,
                  icon: value?.icon
                },
                isExternal: true,
                addExternalVisible: false,
                isAcceptSpd: false
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default CollectionPage;
