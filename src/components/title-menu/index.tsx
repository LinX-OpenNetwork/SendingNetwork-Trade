import { useState } from 'react';
import './index.less';
import { find } from 'lodash';
import { downOutIcon } from '@/utils';
import MenuPopup from '@/components/menu-popup';

const TitleMenu = ({ menus, activeKey, setActiveKey, extraNode, className, menuPopTextColor }: any) => {
  const [sendTypeVisible, setSendTypeVisible] = useState<boolean>(false);

  return (
    <>
      <div className={`${className} title_menu_wrapper`}>
        {extraNode}
        <div
          className={`menus ${sendTypeVisible ? 'upOutArrow' : 'downOutArrow'}`}
          onClick={() => {
            setSendTypeVisible(true);
          }}
        >
          {find(menus, { value: activeKey })?.name}
          {downOutIcon}
        </div>
      </div>
      {sendTypeVisible && (
        <MenuPopup
          visible={sendTypeVisible}
          setVisible={setSendTypeVisible}
          menus={menus}
          setMenuKey={setActiveKey}
          textColor={menuPopTextColor}
        />
      )}
    </>
  );
};

export default TitleMenu;
