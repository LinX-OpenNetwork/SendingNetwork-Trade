import { Button } from 'antd';
import './index.less';
import { ReactNode } from 'react';

type IProps = {
  isWallet?: boolean;
  isCreateNew?: boolean;
  createNewName?: any;
  createNewAction?: any;
  extraDesc?: ReactNode | string;
};

const EmptyBlock = (props: IProps) => {
  const { isCreateNew, createNewName, createNewAction, extraDesc } = props;

  return (
    <div className="list_empty">
      {isCreateNew ? (
        <>
          <EmptyText extra={extraDesc} />
          <div className="connect_wallet_btn">
            <Button
              className="default_btn confirm_btn"
              onClick={() => {
                if (isCreateNew && createNewAction) {
                  createNewAction();
                }
              }}
            >
              {isCreateNew && createNewName ? createNewName : ''}
            </Button>
          </div>
        </>
      ) : (
        <EmptyText extra={extraDesc} />
      )}
    </div>
  );
};

export default EmptyBlock;

const EmptyText = ({ extra }: { extra?: any }) => {
  return (
    <>
      <div className="list_empty_icon">
        <img src={'/image/empty.svg'} width={100} height={90} />
      </div>
      <div className="list_empty_text">{extra ? extra : 'No data'}</div>
    </>
  );
};
