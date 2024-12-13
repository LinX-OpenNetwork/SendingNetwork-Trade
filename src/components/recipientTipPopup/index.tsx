import FullScreenPop from '../fullscreen-popup';
import styles from './index.less';
import { Button } from 'antd-mobile';

const RecipientTipPopup = ({ visible, setVisible }: any) => {
  return (
    <FullScreenPop visible={visible} setVisible={setVisible}>
      <div className={styles.reci_wrapper}>
        <div className={styles.content}>
          <div className={styles.img}>
            <img src="/image/icon/recip_tip.png" width={160} />
          </div>
          <div className={styles.title}>How it works</div>
          <ul className={styles.content_ul}>
            <li className={styles.content_item}>
              Recipient needs to accept the transfer from sender's spending account.
            </li>
            <li className={styles.content_item}>
              If accepted, it will be transferred to the spending account of the recipient.
            </li>
            <li className={styles.content_item}>
              If not accepted within 24hrs, it will be returned to sender's spending account.
            </li>
          </ul>
        </div>
        <div className={styles.action}>
          <Button className="default_btn confirm_btn" onClick={() => setVisible(false)}>
            OK
          </Button>
        </div>
      </div>
    </FullScreenPop>
  );
};

export default RecipientTipPopup;
