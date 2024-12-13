import styles from './index.less';
import { Switch } from 'antd-mobile';

const AcceptSdpSwitchBtn = ({ isAcceptSpd, setIsAcceptSpd }: any) => {
  return (
    <div className={styles.balance_type}>
      <div className={styles.balance_type_title}>Accept transfer to spending account</div>
      <div>
        <Switch
          style={{ '--checked-color': 'var(--color-primary)', '--height': '22px', '--width': '44px' }}
          checked={isAcceptSpd}
          onChange={setIsAcceptSpd}
        />
      </div>
    </div>
  );
};

export default AcceptSdpSwitchBtn;
