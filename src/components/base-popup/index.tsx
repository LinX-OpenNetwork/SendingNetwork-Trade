import { closeModalIcon, LeftOutlinedIcon } from '@/utils';
import { Popup } from 'antd-mobile';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';

type IProps = {
  visible: boolean;
  setVisible: any;
  hideHeader?: boolean;
  title?: string;
  children?: any;
  hideClose?: boolean;
  showBack?: boolean;
  onBack?: any;
  bodyStyle?: any;
  bodyClassName?: any;
};
const BasePopup = (props: IProps) => {
  const { visible, setVisible, hideHeader, title, hideClose, showBack, onBack, bodyStyle, bodyClassName } = props;
  const isIOS = getPlatformInfo()?.isIOS;

  return (
    <Popup
      visible={visible}
      onMaskClick={() => {}}
      bodyStyle={{
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        paddingBottom: isIOS ? '10px' : 'inherit',
        ...bodyStyle
      }}
      bodyClassName={`base_popup_container ${bodyClassName}`}
      getContainer={document.getElementById('tp-wrapper')}
    >
      {!hideHeader && (
        <div className="header">
          <div className="titleBox">
            <div
              className="closeBtn"
              onClick={() => {
                if (showBack) {
                  onBack();
                }
              }}
            >
              {showBack && LeftOutlinedIcon}
            </div>
            <div className="title">{title}</div>
            <div
              className="closeBtn"
              onClick={() => {
                if (!hideClose) {
                  setVisible(false);
                }
              }}
            >
              {!hideClose && closeModalIcon}
            </div>
          </div>
        </div>
      )}
      {props.children}
    </Popup>
  );
};

export default BasePopup;
