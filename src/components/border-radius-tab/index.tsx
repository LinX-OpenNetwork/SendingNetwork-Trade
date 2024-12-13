import styles from './index.less';

type IProp = {
  menus: {
    name: string;
    value: string;
  }[];
  tab: string;
  setTab: (value: string) => void;
};
const BorderRadiusTab = (props: IProp) => {
  const { menus, tab, setTab } = props;

  return (
    <div className={styles.tab_menu}>
      <div className={styles.tab_block}></div>
      {menus?.map((item) => {
        return (
          <div className={`${styles.tab_menu_item} `} key={item?.value}>
            <div
              className={`${styles.tab_item} ${tab === item?.value ? styles.active : ''}`}
              onClick={() => setTab(item?.value)}
            >
              {item?.name}
            </div>
          </div>
        );
      })}
      <div className={styles.tab_block}></div>
    </div>
  );
};

export default BorderRadiusTab;
