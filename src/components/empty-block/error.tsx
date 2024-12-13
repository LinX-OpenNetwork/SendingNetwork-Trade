import { Button } from 'antd';
import './index.less';

const ErrorBlock = ({ tryAgainAction }: { tryAgainAction?: any }) => {
  return (
    <div className="list_empty">
      <div className="list_empty_icon">
        <img src={'/image/icon/icon_timedout.png'} width={100} height={100} />
      </div>
      <div className="list_empty_text">Something went wrong.</div>
      <div className="connect_wallet_btn">
        <Button
          className="default_btn confirm_btn"
          onClick={() => {
            tryAgainAction?.();
          }}
        >
          Try Again
        </Button>
      </div>
    </div>
  );
};

export default ErrorBlock;
