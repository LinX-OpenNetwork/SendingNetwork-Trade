import styles from './index.less';
import { Skeleton } from 'antd-mobile';

const AssetsLoading = ({ style }: any) => {
  return (
    <div className={styles.token_list_loading} style={style}>
      <Skeleton animated className={styles.loading_rect_samll1} />
      <div className={styles.right}>
        <Skeleton animated className={styles.loading_row2_cell3} />
        <Skeleton animated className={styles.loading_row1_cell1} />
      </div>
    </div>
  );
};

export default AssetsLoading;
