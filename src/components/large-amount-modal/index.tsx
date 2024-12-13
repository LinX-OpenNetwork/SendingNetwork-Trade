import { Modal } from 'antd-mobile';
import './index.less';

type IProps = {
  amount: string;
  visible: boolean;
  setVisible: (value: boolean) => void;
  onContinue: any;
};

const LargeAmountModal = (props: IProps) => {
  const { amount, visible, setVisible, onContinue } = props;

  return (
    <Modal
      visible={visible}
      title={null}
      bodyClassName="large_amount_modal"
      showCloseButton={false}
      onClose={() => setVisible(false)}
      content={
        <div className="large_amount_content">
          <div className="title">
            <img src="/image/icon/amount_tip.png" width={100} height={100} />
          </div>
          <div className="content">
            The value of this transfer is relatively large (${amount}), remind you to double-check.
          </div>
          <div></div>
        </div>
      }
      actions={[
        {
          key: 'continue',
          text: 'Continue',
          className: 'default_btn confirm_btn',
          onClick: () => {
            setVisible(false);
            onContinue();
          }
        },
        {
          key: 'back',
          text: 'Back',
          className: 'default_btn cancel_btn',
          onClick: () => {
            setVisible(false);
          }
        }
      ]}
    />
  );
};

export default LargeAmountModal;
