import './index.less';
import UserAvatar from '../user-avatar';
import {
  addressOmitShow,
  walletIcon,
  LocalStorage_get,
  LocalStorage_set,
  closeModalIcon,
  PlusOutlinedIcon
} from '@/utils';
import { AccountWallet } from '@/types';
import { useDispatch, useSelector } from 'dva';
import FullScreenPop from '../fullscreen-popup';
import { LOCAL_ETH_CHAIN_ID, LOCAL_AUTH_ACCOUNT_ADDRESS, DEFAULT_CHAIN_ID } from '@/constants';
import { useSwitchAccount } from '@/services/hooks';

type IProps = {
  visible: boolean;
  setVisible: any;
  currentAccount: any;
  setAccount?: any;
};
const SelectAccountPopup = (props: IProps) => {
  const dispatch = useDispatch();
  const { visible, setVisible, currentAccount, setAccount } = props;
  const { accountList } = useSelector((state: any) => state.store);
  const { isConnected, onSwitchClick } = useSwitchAccount();

  async function setAuthedAccount(params: any) {
    const chainId = Number(LocalStorage_get(LOCAL_ETH_CHAIN_ID) ?? DEFAULT_CHAIN_ID);
    const payload = {
      walletName: params?.walletName,
      walletLogo: params?.verifySourceLogo,
      chainId: params?.chainId ?? chainId,
      publicKey: params?.walletAddress
    };
    LocalStorage_set(LOCAL_AUTH_ACCOUNT_ADDRESS, payload?.publicKey);
    dispatch({ type: 'store/setAuthedAccountInfo', payload });
  }

  return (
    <FullScreenPop visible={visible} setVisible={setVisible} style={{ '--z-index': '1200' }}>
      <div className="auth_account_content">
        <div className="header">
          <div className="titleBox">
            <div
              className="closeBtn"
              onClick={() => {
                setVisible(false);
              }}
            >
              {closeModalIcon}
            </div>
            <div className="title">Switch account</div>
            <div className="closeBtn"></div>
          </div>
        </div>
        <div className="content">
          <div className="title">Your SendingMe linked wallet accounts:</div>
          <div className="member_list">
            {accountList?.map((item: AccountWallet, index: number) => {
              if (!item) {
                return null;
              }
              return (
                <ItemRender
                  key={item?.walletAddress + index}
                  item={item}
                  onClick={async () => {
                    if (currentAccount?.walletAddress?.toUpperCase() !== item?.walletAddress?.toUpperCase()) {
                      setAccount ? setAccount(item) : setAuthedAccount(item);
                    }
                    setVisible(false);
                  }}
                  isActive={currentAccount?.walletAddress?.toUpperCase() === item?.walletAddress?.toUpperCase()}
                />
              );
            })}
            <div
              className="another_item"
              key={'another'}
              onClick={() => {
                onSwitchClick();
                setVisible(false);
              }}
            >
              <div className="another_logo">{walletIcon}</div>
              <div className="another_title">{!isConnected ? 'Want to use another account' : 'Switch account'}</div>
            </div>
          </div>
          <div
            className="title add_btn"
            onClick={() => {
              setVisible(false, true);
            }}
          >
            {PlusOutlinedIcon}Add any account address
          </div>
        </div>
      </div>
    </FullScreenPop>
  );
};

export default SelectAccountPopup;

const ItemRender = ({ item, onClick, isActive }: any) => {
  return (
    <div
      className={`member_item ${isActive ? 'active' : ''}`}
      // key={item.walletAddress + index}
      onClick={onClick}
    >
      <UserAvatar size="3" borderRadius="50%" name={item?.walletName} src={item?.verifySourceLogo} />
      <div className="item_content_name">
        <div className="name_title">{item?.walletName} </div>
        <div className="name_sub">{addressOmitShow(item?.walletAddress)}</div>
      </div>
    </div>
  );
};
