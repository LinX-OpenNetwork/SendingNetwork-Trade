import { AUTH_USER_INFO, LOCAL_USER_INFO } from '@/constants';

export function LocalStorage_get(name: string) {
  return localStorage.getItem(name);
}

export function LocalStorage_set(name: string, val: any) {
  return localStorage.setItem(name, val);
}

export function LocalStorage_remove(name: string) {
  localStorage.removeItem(name);
}

export function setLocalInfo(info: any, dispatch?: any) {
  LocalStorage_set(
    AUTH_USER_INFO,
    JSON.stringify({
      id: info?.linxUserId,
      name: info?.linxUserName,
      token: info?.accessToken,
      avatar: info?.linxImgUrl,
      address: info?.walletAddressMetamask
    })
  );
  const localData = {
    id: info?.userId,
    name: info?.linxUserName,
    avatar: info?.linxImgUrl,
    address: info?.walletAddressMetamask
  };
  LocalStorage_set(LOCAL_USER_INFO, JSON.stringify(localData));
  dispatch?.({
    type: 'store/updateLocalUserInfo',
    payload: localData
  });
}
