import { CLIENT_PRE_PATH } from '@/constants';
import { LocalStorage_set, getHistoryUrl } from '@/utils';
import { Render } from '@/services';
import { history } from 'umi';

declare global {
  var sdnAuthCode: any;
  var sdnUserInfo: any;
}

export async function render(oldRender: any) {
  const prePath = history?.location?.pathname + history?.location?.search;
  // console.log('render', prePath);
  LocalStorage_set(CLIENT_PRE_PATH, prePath);

  Render(oldRender);
}

export function onRouteChange({ location }: any) {
  // console.log('app-onRouteChange', action);
  if (location?.pathname === '/create' && location?.query?.type === 'receive') {
    if (location?.query?.sub === 'bill') {
      history.push(getHistoryUrl('/collection', ['type', 'sub']));
    } else {
      history.push(getHistoryUrl('/payment-code', ['type', 'sub']));
    }
  }
}
