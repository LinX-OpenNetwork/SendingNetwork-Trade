import { LINX_WEB_URL, LINX_AUTH_INFO, LINX_SERVER_URL, ETH_SUPPORTED_CHAINS, BOX_WEB_URL } from '@/constants';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { history } from 'umi';
import { closeBrowserMobile, checkSourceType } from '@/utils';
import { message } from 'antd';
import { find } from 'lodash';

export const getLinxAuthUrl = (state: string, sessionId?: string) => {
  let url = '';
  if (self === top) {
    // no-iframe
    // https://app-alpha.sending.me/#/login/auth/?redirect_uri=https://red3.web3-tp.net&client_id=726564335F7374645F656E76656C6F706520
    url = `${LINX_WEB_URL}/#/login/auth`;
  } else {
    // is-iframe
    // https://app-alpha.sending.me/auth/?redirect_uri=https://red3.web3-tp.net&client_id=726564335F7374645F656E76656C6F706520
    url = `${LINX_WEB_URL}/auth/index.html`;
  }
  url += `?client_id=${LINX_AUTH_INFO.clientId}&redirect_uri=${encodeURIComponent(
    LINX_AUTH_INFO.redirectUri || ''
  )}&state=${encodeURIComponent(state)}`;

  if (sessionId) {
    url += `&sessionId=${sessionId}`;
  }
  console.log('LINX_AUTH_URL', url);
  return url;
};

export const getDappDeeplink = () => {
  const url =
    window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search;
  const deeplink = `${LINX_WEB_URL}/deeplink?dapp=${url}&isDeeplink=1`;
  // console.log('getDappDeeplink', deeplink);
  return deeplink;
};

export function getDeepLink(url: string) {
  const deeplink = `${LINX_WEB_URL}/deeplink?url=${url}`;
  // console.log('getDeepLink', deeplink);
  return deeplink;
}

export function directChatToUser(sdmUserId?: string, parentIframeUrl?: string) {
  const isIOS = getPlatformInfo()?.isIOS;
  const isSdm = getPlatformInfo()?.isSdm;
  if (sdmUserId) {
    if (isSdm) {
      if (isIOS) {
        //hiseas://chat/direct_chat/userid=xxx
        window.location.href = getDeepLink(`hiseas://chat/direct_chat/userid=${sdmUserId}`);
      }
    } else {
      //https://app.sending.me/#/user/{userId}
      window.open(`${parentIframeUrl ?? LINX_WEB_URL}/#/user/${sdmUserId}`);
    }
  }
}

export function onBackToRoom(roomId: string) {
  let sessionId = history.location?.query?.sessionId;
  if (sessionId) {
    window.location.href = `${LINX_WEB_URL}/#/session/${sessionId?.toString()}/room/${roomId}`;
  }
}

export function formatLinxImg(icon: string, { isAvatar, isUpload }: { isAvatar?: boolean; isUpload?: boolean }) {
  // mxc://hs-alpha.sending.me/2022-09-26_lqLRsgQPePNonrBm;
  // test: https://hs-alpha.sending.me/_matrix/media/r0/thumbnail/hs-alpha.sending.me/2022-09-26_lqLRsgQPePNonrBm?width=210&height=210&method=crop
  // prod: https:hs.sending.me/_api/media/r0/thumbnail/hs.sending.me/2022-09-09_LOFtYMxJToOZxqHg?width=30&height=30&method=crop
  if (icon && LINX_SERVER_URL) {
    let serverUrl = LINX_SERVER_URL;
    if (isAvatar) {
      if (LINX_SERVER_URL === 'https://hs.sending.me') {
        serverUrl += '/_api';
      } else {
        serverUrl += '/_matrix';
      }
      icon = icon.replace('mxc://', serverUrl + '/media/r0/thumbnail/');
      icon = icon + '?width=210&height=210&method=crop';
    }
    if (isUpload) {
      icon = icon.replace('mxc://', serverUrl + '/_api/media/r0/download/');
    }

    return icon;
  } else {
    return icon;
  }
}

export function showSelfAssets(assetType: string, network: string) {
  console.log('showSelfAssets', TransferHandshake, assetType, network);
  try {
    TransferHandshake.then((childAPI: any) => {
      console.log('SwapHandshake', childAPI);
      childAPI.emit('message.sending.me', {
        payload: {
          action: 'show_self_assets',
          assetType,
          network
        }
      });
    });
  } catch (error) {
    console.log('showSelfAssets-error', error);
  }
}

export function changeIframeSrc(src: string) {
  console.log('changeIframeSrc', TransferHandshake, src);
  try {
    TransferHandshake.then((childAPI: any) => {
      childAPI.emit('changeIframeSrc', {
        src
      });
    });
  } catch (error) {
    console.log('changeIframeSrc-error', error);
  }
}

export function backIM(chainId?: number) {
  const isSdm = getPlatformInfo()?.isSdm;
  const chainInfo = chainId
    ? find(ETH_SUPPORTED_CHAINS, {
        chain_id: chainId
      })
    : undefined;
  let network = chainInfo?.sdm_wallet || 'ethereum';
  if (isSdm) {
    closeBrowserMobile();
  } else {
    if (self === top) {
      message.error('Open in Sendingme');
      return;
    } else {
      showSelfAssets('tokens', network);
    }
  }
}

export function toBox(roomId?: string) {
  const sourceType = checkSourceType();
  const url = `${BOX_WEB_URL}/create?${sourceType === 'SDN' ? 'st=sdn' : 'st=sdm'}${roomId ? `&roomId=${roomId}` : ''}`;
  const isSdm = getPlatformInfo()?.isSdm;
  if (sourceType !== 'SDM' && !isSdm) {
    changeIframeSrc(url);
  } else {
    window.location.href = url;
  }
}
