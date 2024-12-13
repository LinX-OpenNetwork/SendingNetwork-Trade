import { Popup } from 'antd-mobile';
import './index.less';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';

type IProps = {
  visible: boolean;
  setVisible: any;
  menus: any;
  setMenuKey: any;
  textColor?: string;
  title?: string;
};

const MenuPopup = (props: IProps) => {
  const { visible, setVisible, menus, setMenuKey, textColor, title } = props;
  const isIOS = getPlatformInfo()?.isIOS;
  const isSdm = getPlatformInfo()?.isSdm;

  return (
    <Popup
      visible={visible}
      onMaskClick={() => {}}
      getContainer={document.getElementById('tp-wrapper')}
      className="clt_type_popup"
      bodyStyle={{ bottom: isSdm && isIOS ? '25px' : '0' }}
    >
      <div className="clt_type_content">
        <div className="pkt_mode_list">
          {title && <div className="pkt_mode_item pkt_mode_item_title">{title}</div>}
          {menus.map((item: any) => {
            return (
              <div
                style={{ color: textColor }}
                className="pkt_mode_item"
                key={item.key}
                onClick={() => {
                  setMenuKey(item.value);
                  setVisible(false);
                }}
              >
                {item.name}
              </div>
            );
          })}
        </div>
        <div className="divider">&nbsp;</div>
        <div className="actions" onClick={() => setVisible(false)}>
          Cancel
        </div>
      </div>
    </Popup>
  );
};

export default MenuPopup;
