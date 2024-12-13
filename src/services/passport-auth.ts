import { message } from 'antd';
import { checkUserTokenForPage, checkUserAndGenToken, EthWeb3Service, SdnService } from '@/services';
import { history } from 'umi';
import {
  LocalStorage_set,
  fetchAuthorizeCode,
  isFromScaned,
  isScanedResult,
  getContractErrorMsg,
  getHistoryUrl,
  addressOmitShow,
  checkSourceType,
  useUrlParams,
  setLocalInfo
} from '@/utils';
import { LOCAL_USER_TOKEN, LINX_AUTH_INFO, LOCAL_LOGIN_TYPE } from '@/constants';
import { CurrentWalletProps } from '@/lib/wallet-selector/types';
import { SDNUserInfo } from '@/types';
import { randomBytes } from 'crypto';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';

export class PassportAuth {
  static async signedWalletLogin(account: string, ethWeb3: any, successFn?: any, failedFn?: any, dispatch?: any) {
    if (account && ethWeb3) {
      const nonce = randomBytes(32).toString('hex');
      const signMsg =
        `Welcome to Socialswap.com. Please sign this message to prove you own this wallet.This action won't cost you any Ether or trigger any on-chain transactions.\n\n` +
        `To keep it safe, here's a unique ID valid only once: ${account}#${nonce}\n\n` +
        `Issued At:  ${new Date(new Date().getTime()).toDateString()}`;

      try {
        const sign = await EthWeb3Service.sendPersonalSign(signMsg, account, ethWeb3);
        if (sign) {
          PassportAuth.setUserInfoAfterLogin(
            { loginType: 7, walletAddress: account, signMsg, sign },
            successFn,
            failedFn,
            dispatch
          );
        }
      } catch (err: any) {
        console.log('sendPersonalSign', err.message);
        const msg = getContractErrorMsg(err);
        message.error(msg);
        failedFn?.();
      }
    } else {
      failedFn?.();
      console.log('signedWalletLogin-error');
    }
  }

  static async setUserInfoAfterLogin(params: any, successFn?: any, failedFn?: any, dispatch?: any) {
    checkUserAndGenToken(params)
      .then((res) => {
        console.log('checkUserAndGenToken', res, params);
        if (res && res.success && res.result) {
          LocalStorage_set(LOCAL_LOGIN_TYPE, params?.loginType);
          LocalStorage_set(`${LOCAL_USER_TOKEN}_${params?.loginType}`, res.result.userToken);
          setLocalInfo(res?.result, dispatch);
          successFn?.();
        } else {
          message.error(res?.errorMsg || 'token error');
          failedFn?.();
        }
      })
      .catch((error) => {
        console.log('checkUserAndGenToken', error);
        failedFn?.();
      });
  }

  static checkPcAndH5Auth() {
    const sourceType = checkSourceType();
    if (sourceType === 'SDN') {
      //check auth
      const code = useUrlParams().get('authorization_code');
      const clientId = useUrlParams().get('client_id');
      if (code && clientId) {
        window.sdnAuthCode = code;
      } else {
        (window.TransferAccessService ? window.TransferAccessService : new SdnService({}))?.fetchAuthorizeCode();
      }
    }
  }

  static mobileAppCallBack(value1: any, value2: any) {
    const sourceType = checkSourceType();
    console.log('mobileAuthCallBack', value1, value2, sourceType);
    if (value1 === null && value2 && sourceType === 'SDN') {
      window.sdnAuthCode = value2;
    } else {
      message.error('Authorize error: ' + value1);
    }
  }

  static async walletSignLogin(
    sdnUser: SDNUserInfo,
    currentWallet: CurrentWalletProps,
    ethWeb3: any,
    successFn?: any,
    failedFn?: any,
    dispatch?: any
  ) {
    console.log('walletSignLogin', sdnUser, currentWallet);
    const address = currentWallet?.publicKey;
    if (address && sdnUser && ethWeb3) {
      const nonce = randomBytes(32).toString('hex');
      const msgHash =
        `Welcome to Transfer, an App built around giving away crypto assets on social platforms. Please sign this message to help us know your web3 social identity. This action won't trigger any on-chain transaction.\n\n` +
        `To keep it safe, here's a unique ID valid only once: ${sdnUser?.name}#${nonce}\n\n ` +
        `Issued At:  ${new Date(new Date().getTime()).toDateString()}`;
      const sign = await EthWeb3Service.sendPersonalSign(msgHash, address, ethWeb3);
      if (sign) {
        PassportAuth.setUserInfoAfterLogin(
          {
            loginType: 6,
            walletAddress: address,
            userId: sdnUser?.userId,
            userName: sdnUser?.name,
            userImgUrl: sdnUser?.avatarUrl,
            signature: sign,
            message: msgHash
          },
          successFn,
          failedFn,
          dispatch
        );
      } else {
        message.error('Sign Error');
        return;
      }
    } else {
      console.log('walletSignLogin-error', sdnUser, currentWallet);
    }
  }

  static async sdnLogin(code: string, userInfo: any, dispatch?: any) {
    console.log('sdnLogin', userInfo, code);
    let userName = userInfo?.name;
    if (!userName || userName === '' || userName === 'null' || userName === 'undefined') {
      userName = addressOmitShow(userInfo?.walletAddress);
    }
    PassportAuth.setUserInfoAfterLogin(
      {
        loginType: 8,
        code,
        redirectUri: LINX_AUTH_INFO.redirectUri,
        clientId: LINX_AUTH_INFO.clientId,
        walletAddress: userInfo?.walletAddress,
        userId: userInfo?.userId,
        userName,
        userImgUrl: userInfo?.avatarUrl ?? userInfo?.avatar
      },
      () => {
        window.sdnAuthCode = undefined;
      },
      () => {},
      dispatch
    );
  }
}

/**
 * isValid: true => OK; false => to auth
 * isLinx: true => linx user; false
 * @param token
 * @returns
 */
export async function checkToken(token: string, dispatch?: any) {
  let result: { isValid: boolean; isLinx: boolean; data?: any } = { isValid: false, isLinx: false };
  const res = await checkUserTokenForPage(token).catch(() => {
    result.isValid = false;
  });
  if (res && res.success) {
    result.isValid = true;
    result.data = res?.result;
    if (res?.result?.linxUserId && res?.result?.linxUserId !== '') {
      result.isLinx = true;
    }
    setLocalInfo(res?.result, dispatch);
  } else {
    result.isValid = false;
  }

  return result;
}

export function checkIsPathToAuth(path?: string) {
  // after scanning the paymentcode does not go through SDM authorization (not in SDM IOS&And)
  const scanedInOut = isFromScaned();
  const scanedResult = isScanedResult();
  const pathName = path ?? window?.location?.pathname;
  const isPc = getPlatformInfo()?.isPc;
  const isSdm = getPlatformInfo()?.isSdm;
  // console.log('isPathToAuth', pathName, scanedInOut);
  if (pathName === '/create') {
    if ((scanedInOut && isSdm) || isPc || !scanedInOut) {
      return true;
    } else {
      return false;
    }
  } else if (pathName === '/order') {
    if (scanedResult) {
      return false;
    } else {
      return true;
    }
  } else if (pathName === '/buy-record-detail') {
    return false;
  } else {
    return true;
  }
}

export async function actionSdmAuth(dispatch?: any) {
  const isSdm = getPlatformInfo()?.isSdm;
  console.log('actionSdmAuth-isToAuth', isSdm);
  // sdn check code and user
  checkSdnAuthCode(dispatch);
  // to auth
  if (!isSdm) {
    // PC+h5
    PassportAuth.checkPcAndH5Auth();
  } else {
    // ios+and
    fetchAuthorizeCode();
  }
}

export async function checkSdnAuthCode(dispatch?: any) {
  const sourceType = checkSourceType();
  if (sourceType === 'SDN' && !window.TransferSdnAuthCodeTimer) {
    window.TransferSdnAuthCodeTimer = setInterval(() => {
      console.log('checkSdnCode', window.sdnAuthCode, window.sdnUserInfo);
      if (window.sdnUserInfo && window.sdnAuthCode) {
        console.log('clearInterval-checkSdnCode');
        clearInterval(window.TransferSdnAuthCodeTimer);
        PassportAuth.sdnLogin(window.sdnAuthCode, window.sdnUserInfo, dispatch);
      }
    }, 1000);
  }
}

export function Render(oldRender?: any) {
  if (history?.location?.pathname === '/') {
    history.push(getHistoryUrl('/create'));
  }
  if (history?.location?.pathname === '/collection') {
    history.push(getHistoryUrl('/create?type=receive&sub=bill'));
  }
  oldRender?.();
}
