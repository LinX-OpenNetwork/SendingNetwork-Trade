import FullScreenPop from '../fullscreen-popup';
import { closeModalIcon } from '@/utils';
import { useState } from 'react';
import { Input, Button, message } from 'antd';
import './index.less';

const AddExternal = ({ visible, setVisible, setAccount }: any) => {
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  return (
    <FullScreenPop
      visible={visible}
      setVisible={() => {
        setVisible(false);
        setAddress('');
      }}
    >
      <div className="add_external_wrapper">
        <div className="header">
          <div className="titleBox">
            <div
              className="closeBtn"
              onClick={() => {
                setVisible(false);
              }}
            >
              {closeModalIcon}
            </div>
            <div className="title">Add an external account</div>
            <div className="closeBtn"></div>
          </div>
        </div>
        <div className="content">
          <div className="input">
            <div className="input_title">Account owner's name</div>
            <Input
              className="input_address"
              placeholder="Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </div>
          <div className="input">
            <div className="input_title">Wallet address</div>
            <Input
              className="input_address"
              placeholder="Wallet address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
              }}
            />
          </div>
        </div>
        <div className="footer">
          <Button
            className={`default_btn confirm_btn ${address === '' || name === '' ? 'disabled' : ''}`}
            onClick={() => {
              if (address === '' || name === '') return;
              if (address === '' || address?.length !== 42 || !address?.startsWith('0x')) {
                message.error('Address invalid');
                return;
              }
              setAccount({
                walletAddress: address,
                name: name,
                icon: '/image/icon/icon_Multiple_Wallets.png'
              });
            }}
          >
            Confirm
          </Button>
        </div>
      </div>
    </FullScreenPop>
  );
};

export default AddExternal;
