import React from 'react';
import { Popup, CenterPopup } from 'antd-mobile';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';

type IProps = {
  children: React.ReactNode;
  visible: boolean;
  setVisible: (value: boolean) => void;
};

const MobilePcPopup = (props: IProps) => {
  const isMobile = getPlatformInfo()?.isMobile;
  const { visible, setVisible } = props;
  return !isMobile ? (
    <Popup
      visible={visible}
      onMaskClick={() => {
        setVisible(false);
      }}
      bodyStyle={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
      bodyClassName="base_popup_container"
      getContainer={document.getElementById('tp-wrapper')}
    >
      {props.children}
    </Popup>
  ) : (
    <CenterPopup
      visible={visible}
      onMaskClick={() => {
        setVisible(false);
      }}
      bodyStyle={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
      bodyClassName="base_popup_container"
      style={{
        '--min-width': '360px'
      }}
    >
      {props.children}
    </CenterPopup>
  );
};

export default MobilePcPopup;
