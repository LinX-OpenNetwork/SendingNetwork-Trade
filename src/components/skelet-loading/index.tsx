import styles from './index.less';
import { Skeleton } from 'antd';

const SkeletonLoading = ({ marginTop, listCount = 3 }: any) => {
  return (
    <div className={`${styles.skeleton_wrapper}`} style={{ marginTop }}>
      {new Array(listCount).fill(1)?.map((item, index) => {
        return (
          <Skeleton
            avatar
            active
            paragraph={{ rows: 3 }}
            key={index}
            className={styles.skeleton_item}
          />
        );
      })}
    </div>
  );
};

export default SkeletonLoading;
