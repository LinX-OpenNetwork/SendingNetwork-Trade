import styles from './index.less';
import { editIcon } from '@/utils';
import { useState } from 'react';
import LeavingMsgPopup from '@/components/leaving-msg-popup';

const AddNote = ({ pktMsg, setPktMsg }: any) => {
  const [leavingMsgPopupVisible, setLeavingMsgPopupVisible] = useState<boolean>(false);
  return (
    <>
      <div className={styles.note_wrapper}>
        <div className={styles.note_content} onClick={() => setLeavingMsgPopupVisible(true)}>
          {pktMsg && pktMsg !== '' ? (
            <div className={styles.note_text}>
              {pktMsg}&nbsp;&nbsp;
              <span>Edit Note</span>
            </div>
          ) : (
            <span>{editIcon}Add Note</span>
          )}
        </div>
      </div>

      {leavingMsgPopupVisible && (
        <LeavingMsgPopup
          title={'Notes'}
          visible={leavingMsgPopupVisible}
          setVisible={setLeavingMsgPopupVisible}
          pktMsg={pktMsg}
          onConfirm={(value: string) => {
            setPktMsg(value);
            setLeavingMsgPopupVisible(false);
          }}
        />
      )}
    </>
  );
};

export default AddNote;
