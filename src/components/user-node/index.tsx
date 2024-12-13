import styles from './index.less';
import UserAvatar from '@/components/user-avatar';

type IProps = {
  userName?: string;
  userImage?: string;
  borderRadius?: string;
  size: string;
};
const UserNode = (props: IProps) => {
  const { userName, userImage, borderRadius, size } = props;
  return (
    <div className={styles.user_node_pic}>
      <div className={styles.user_node_pic_el}>
        <UserAvatar name={userName} src={userImage} borderRadius={borderRadius} size={size} />
      </div>
    </div>
  );
};

export default UserNode;
