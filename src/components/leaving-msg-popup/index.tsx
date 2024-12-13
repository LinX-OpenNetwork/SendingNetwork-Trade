import { Button, Input as InputPc, Space } from 'antd';
import { useState } from 'react';
import MobilePcPopup from '../mobile-pc-popup';
import './index.less';

type LeavingMsgPopupProps = {
  title: string;
  visible: boolean;
  setVisible: any;
  pktMsg: string;
  onConfirm: any;
};
const LeavingMsgPopup = (props: LeavingMsgPopupProps) => {
  const { title, visible, pktMsg, setVisible, onConfirm } = props;

  const [msg, setMsg] = useState<string>(pktMsg);

  return (
    <MobilePcPopup visible={visible} setVisible={setVisible}>
      <div className="leaving_msg_popup_container">
        <div className="header">
          <div className="titleBox">
            <div className="title">{title}</div>
          </div>
        </div>
        <div className="content">
          <div className="form_item_textarea">
            <InputPc.TextArea
              value={msg}
              className="input_textarea"
              onChange={(e) => {
                setMsg(e.target.value);
              }}
              maxLength={50}
              rows={1}
              placeholder="Visible to both parties, max 50 chars"
            />
          </div>
        </div>
        <div className="footer">
          <Space size={20}>
            <Button className="default_btn cancel_btn" onClick={() => setVisible(false)}>
              Cancel
            </Button>
            <Button className="default_btn confirm_btn" onClick={() => onConfirm(msg)}>
              Confirm
            </Button>
          </Space>
        </div>
      </div>
    </MobilePcPopup>
  );
};

export default LeavingMsgPopup;
