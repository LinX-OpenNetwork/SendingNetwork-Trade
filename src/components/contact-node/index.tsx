import styles from './index.less';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { directChatToUser, addressOmitShow, contactIcon, getAuthUserInfo } from '@/utils';
import UserNode from '../user-node';
import { useSelector } from 'dva';

type IProps = {
  userName?: string;
  userImage?: string;
  userAddress?: string;
  sdmUserId?: string;
  hideContact?: boolean;
  balanceType?: number;
  extraContent?: any;
  bgImage?: string;
};

const ContactNode = (props: IProps) => {
  const isPc = getPlatformInfo()?.isPc;
  const { userName, userImage, userAddress, sdmUserId, hideContact, balanceType, extraContent, bgImage } = props;
  const authUserInfo = getAuthUserInfo();
  const { parentIframeUrl } = useSelector((state: any) => state.store);

  return (
    <div
      className={styles.contact_item}
      style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: '100% 100%' } : {}}
    >
      <div className={styles.item_value_content}>
        {/* <UserAvatar name={userName} src={userImage} size="3.125" borderRadius="8px" /> */}
        <UserNode userName={userName} userImage={userImage} borderRadius="50%" size="3" />
        <div className={styles.item_value_user}>
          <div className={styles.user_info}>{userName}</div>
          <div className={styles.item_value_sub}>
            {balanceType === 1 ? 'Spending account' : addressOmitShow(userAddress, 4, 4)}
          </div>
        </div>
      </div>
      {!hideContact && isPc && sdmUserId && authUserInfo?.id !== sdmUserId && (
        <div
          className={styles.item_value_action}
          onClick={() => {
            directChatToUser(sdmUserId, parentIframeUrl);
          }}
        >
          <div className={styles.contact_btn}>{contactIcon}</div>
        </div>
      )}
      {extraContent}
    </div>
  );
};

export default ContactNode;
