import React from 'react';
import { Popup } from 'antd-mobile';
import './index.less';

type IProps = {
  children: React.ReactNode;
  visible: boolean;
  setVisible: (value: boolean) => void;
  style?: any;
};

const FullScreenPop = (props: IProps) => {
  const { visible, setVisible, style } = props;
  return (
    <Popup
      visible={visible}
      onMaskClick={() => {
        setVisible(false);
      }}
      bodyStyle={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
      className="fullscreen_popup_container"
      bodyClassName="base_popup_container fullscreen_popup_body"
      getContainer={document.getElementById('tp-wrapper')}
      style={style}
    >
      {props.children}
    </Popup>
  );
};

export default FullScreenPop;
