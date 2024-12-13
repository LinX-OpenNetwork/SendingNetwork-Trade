import { Modal } from 'antd-mobile';
import { Button } from 'antd';

const ConnnectTimeoutModal = ({ visible, setVisible }: any) => {
  return (
    <Modal
      visible={visible}
      bodyClassName="connect_timeout_modal"
      className="base_confirm_modal"
      style={{
        zIndex: '1301'
      }}
      showCloseButton
      content={
        <div className="content">
          <div className="title">Wallet not responding?</div>
          <div className="pha">1. Check your MetaMask to see if a confirmation prompt appears.</div>
          <div className="pha">2. If multiple wallet extensions installed, Try disabling others except MetaMask.</div>
          <div className="pha">
            If it is still not work and other Dapps also have this problem, it is likely to be a temporary failure of
            your wallet or the chain network.
          </div>
          <div className="actions">
            <Button
              className="default_btn confirm_btn"
              onClick={() => {
                setVisible(false);
              }}
            >
              OK
            </Button>
          </div>
        </div>
      }
      closeOnAction
      onClose={() => {
        setVisible(false);
      }}
      actions={[]}
    />
  );
};

export default ConnnectTimeoutModal;
