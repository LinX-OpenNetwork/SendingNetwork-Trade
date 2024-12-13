import { closeModalIcon, LeftOutlinedIcon, LoadingOutlinedIcon, CheckOutlinedIcon, DownOutlinedIcon } from '@/utils';
import { signTranscation, NftSelector, TokenSelector } from '@/types';
import { Button, message } from 'antd';
import { Popup } from 'antd-mobile';
import './index.less';
import { filter } from 'lodash';

type signPopupProps = {
  visible: boolean;
  setVisible: any;
  signList: signTranscation[];
  onContinue: any;
  checkedToken: TokenSelector[];
  checkedNft: NftSelector[];
  createBtnLoading: boolean;
};

const SignPopup = (props: signPopupProps) => {
  const { visible, setVisible, signList, onContinue, checkedToken, checkedNft, createBtnLoading } = props;
  const isWaiting = filter(signList, { status: 1 })?.length > 0;
  const isProcessing = filter(signList, { status: 2 })?.length > 0;
  const checkedTokenList = checkedToken.filter((o) => o.value && Number(o.value) > 0);

  console.log('SignPopup', signList);
  return (
    <Popup
      visible={visible}
      onMaskClick={() => {}}
      bodyStyle={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
      bodyClassName="base_popup_container sign_popup_container"
      getContainer={document.getElementById('tp-wrapper')}
    >
      <div className="header">
        <div className="titleBox">
          <div
            className="closeBtn"
            onClick={() => {
              setVisible(false);
            }}
          >
            {LeftOutlinedIcon}
          </div>
          <div className="title">View</div>
          <div
            className="closeBtn"
            onClick={() => {
              setVisible(false);
            }}
          >
            {closeModalIcon}
          </div>
        </div>
      </div>
      <div className="content" style={{ marginBottom: '0', paddingBottom: '0' }}>
        <div className="content_order">
          <div className={`order_1 ${isWaiting || isProcessing ? '' : 'passed'}`}>1</div>
        </div>
        <div className="content_title">Approve assets</div>
        <SignListContent signList={signList} />
        <div className={`content_down ${isWaiting || isProcessing ? 'passed' : ''}`}>{DownOutlinedIcon}</div>
        <div className="content_order">
          <div className={`order_1 ${isWaiting || isProcessing ? 'passed' : ''}`}>2</div>
        </div>
        <div className="content_title" style={{ marginBottom: '0' }}>
          {createBtnLoading && LoadingOutlinedIcon} Confirm Transcation
          {checkedTokenList?.length > 0 && checkedNft?.length > 0 ? '(Token & NFT)' : ''}
        </div>
      </div>
      <div className="footer">
        <Button
          className={`default_btn confirm_btn ${isProcessing || createBtnLoading ? 'disabled' : ''}`}
          onClick={() => {
            if (!isProcessing && !createBtnLoading) {
              onContinue();
            } else {
              message.info('Please wait');
              return;
            }
          }}
          disabled={isProcessing || createBtnLoading}
        >
          Continue
        </Button>
      </div>
    </Popup>
  );
};

export default SignPopup;

const SignListContent = ({ signList }: { signList: signTranscation[] }) => {
  return (
    <div className="content_list">
      {signList.map((item, index) => {
        return (
          <div
            className={`list_item  
            ${item.status === 1 ? 'waiting' : ''} 
            ${item.status === 2 ? 'processing' : ''} 
            ${item.status === 3 ? 'completed' : ''}`}
            key={item.id}
          >
            <div className="item_title">
              {item?.type === 1
                ? item.nftInfo?.symbol
                : (item.nftInfo as NftSelector)?.collection || 'Collection ' + (index + 1)}
            </div>
            <div className="item_status">
              {item.status === 2 && LoadingOutlinedIcon}
              {item.status === 3 && CheckOutlinedIcon}
            </div>
          </div>
        );
      })}
    </div>
  );
};
