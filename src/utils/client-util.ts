import { LINX_AUTH_INFO } from '@/constants';
import { PassportAuth } from '@/services';
import { checkSourceType } from '@/utils';

declare global {
  var SdmClient: any;
}
export function isSDMClient() {
  let isSDMClient = false;
  try {
    if (SdmClient) {
      isSDMClient = true;
    } else {
      isSDMClient = false;
    }
  } catch (error) {
    isSDMClient = false;
  }

  return isSDMClient;
}

export function closeBrowserMobile() {
  try {
    if (SdmClient && SdmClient.closeBrowser) {
      SdmClient.closeBrowser();
    }
  } catch (error) {
    console.log('closeBrowser-error', error);
  }
}

export function fetchAuthorizeCode() {
  const sourceType = checkSourceType();
  try {
    if (SdmClient && SdmClient?.fetchAuthorizeCode) {
      console.log('SdmClient-fetchAuthorizeCode', SdmClient);
      SdmClient.fetchAuthorizeCode(
        'code',
        LINX_AUTH_INFO.clientId,
        LINX_AUTH_INFO.redirectUri,
        PassportAuth.mobileAppCallBack
      );
      console.log('SdmClient-fetchAuthorizeCode-end');
    }
  } catch (error) {
    console.log('SdmClient-fetchAuthorizeCode-error');
  }
}

export function fetchRoomContext(dispatch: any) {
  const roomContextCallBack = (value1: any, value2: any) => {
    console.log('roomContextCallBack', value1, value2);
    if (value1 === null && value2) {
      dispatch({
        type: 'store/setRoomContext',
        payload: value2
      });
    } else {
      // message.error('Room context error, please try again!');
    }
  };
  try {
    if (SdmClient && SdmClient?.fetchRoomContext) {
      SdmClient?.fetchRoomContext(roomContextCallBack);
    }
  } catch (error) {
    console.log('SdmClient-fetchRoomContext-error');
  }
}

export function sdmOpenWallet(address: string, chain: string, assetType: number) {
  //chain  ==> ethereum
  //assetType ==> 0：tokens，1：nft
  console.log('sdmOpenWallet', address, chain, assetType);
  try {
    if (SdmClient && SdmClient.sdmOpenWallet) {
      SdmClient.sdmOpenWallet(address, chain, assetType);
    }
  } catch (error) {
    console.log('sdmOpenWallet-error', error);
  }
}
