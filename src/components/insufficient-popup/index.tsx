import { message } from 'antd';
import MenuPopup from '@/components/menu-popup';
import { getHistoryUrl, getToken } from '@/utils';
import { useDispatch, useSelector } from 'dva';
import { history } from 'umi';
import { useSwitchAccount } from '@/services/hooks';

const InsufficientPopup = () => {
  const { onSwitchClick } = useSwitchAccount();
  const dispatch = useDispatch();
  const { insufficientVisible, buyToken, hideInsuffSwitch, insuffInfo } = useSelector((state: any) => state.store);

  return (
    <MenuPopup
      visible={insufficientVisible}
      setVisible={(value: boolean) => {
        dispatch({
          type: 'store/setInsufficientVisible',
          payload: {
            visible: value,
            hideInsuffSwitch: false
          }
        });
      }}
      textColor={'var(--color-text-sw-2-3)'}
      menus={[
        {
          key: 'info',
          name: <div className="menu_info">Available solutions</div>,
          value: 'info',
          show: true
        },
        { key: 'buy', name: 'Buy', value: 'buy', show: true },
        { key: 'receive', name: 'Receive', value: 'receive', show: true },
        { key: 'swap', name: 'Swap with token you have', value: 'swap', show: true },
        { key: 'switch', name: 'Switch to another account', value: 'switch', show: hideInsuffSwitch ? false : true }
      ]?.filter((o) => o.show)}
      setMenuKey={(value: string) => {
        if (value === 'switch') {
          onSwitchClick();
        } else if (value === 'receive') {
          /**
           * spd,chainId,token,amount,symbol
           */
          let url = '/payment-code';
          if (insuffInfo) {
            url += `?spd=${insuffInfo?.spd ? 1 : 0}&chainId=${insuffInfo?.chainId}&token=${
              insuffInfo?.address
            }&amount=${insuffInfo?.amount}${insuffInfo?.usdIds ? `&usdIds=${insuffInfo?.usdIds}` : ''}&setAmount=${
              insuffInfo?.setAmount ? 1 : 0
            }`;
          }
          history.push(getHistoryUrl(url));
        }
      }}
    />
  );
};

export default InsufficientPopup;
