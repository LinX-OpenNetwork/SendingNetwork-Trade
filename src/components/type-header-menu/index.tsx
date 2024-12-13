import { Tabs } from 'antd-mobile';
import styles from './index.less';

type IProps = {
  tabKey: string;
  onTabChange: (value: string) => void;
  menus: { key: string | number; value: string }[];
};

const TypeHeaderMenu = (props: IProps) => {
  const { tabKey, onTabChange, menus } = props;

  return (
    <div className={styles.type_menu}>
      <Tabs defaultActiveKey={tabKey} onChange={onTabChange}>
        {menus.map((item) => {
          return <Tabs.Tab title={item.value} key={item.key} />;
        })}
      </Tabs>
    </div>
  );
};

export default TypeHeaderMenu;
