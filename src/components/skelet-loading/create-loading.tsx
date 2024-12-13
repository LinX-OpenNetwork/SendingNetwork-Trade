import styles from './index.less';
import { Skeleton } from 'antd-mobile';

const CreateLoading = () => {
  return (
    <div className={styles.create_loading_wrapper}>
      <div className={styles.block_1}>
        <div className={styles.header}>
          <Skeleton animated className={styles.loading_row2_cell2} />
        </div>
        <div className={styles.footer}>
          <Skeleton animated className={styles.loading_rect_samll1} />
          <div className={styles.right}>
            <Skeleton animated className={styles.loading_row2_cell3} />
            <Skeleton animated className={styles.loading_row1_cell1} />
          </div>
        </div>
      </div>
      <div className={styles.block_empty}>
        <Skeleton animated className={styles.loading_row1} />
      </div>
      <div className={styles.block_empty}>
        <Skeleton animated className={styles.loading_row1} />
        <Skeleton animated className={styles.loading_row2_cell2} />
      </div>
      <div className={styles.block_2}>
        <Skeleton animated className={styles.loading_rect_samll1} />
        <div className={styles.right}>
          <Skeleton animated className={styles.loading_row2_cell3} />
          <Skeleton animated className={styles.loading_row1_cell1} />
        </div>
      </div>
    </div>
  );
};

export default CreateLoading;
