import { MultiWalletProvider } from '@/lib/wallet-selector';
import { ReactNode, useEffect } from 'react';
import { useDispatch, useSelector } from 'dva';
import { actionSdmAuth, checkIsPathToAuth, SdnService } from '@/services';
import ErrorBoundary from '@/components/error-boundary';
import PageNavBar from '@/components/page-nav-bar';
import {
  fetchRoomContext,
  LocalStorage_get,
  particleWalletUIDisplay,
  isCanAction,
  checkSourceType,
  LocalStorage_remove,
  checkTokenValid
} from '@/utils';
import Postmate from 'postmate';
import { ENV, IS_LINX_AUTH, LOCAL_WALLET_NAME } from '@/constants';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { SdmCallback } from 'sdm-js-sdk';
import { message } from 'antd';
import { history } from 'umi';
import useFetchAssets from './hooks';
import { ConfigProvider as MobileConfigProvider } from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';
import InsufficientPopup from '@/components/insufficient-popup';
import ConnectModal from '@/components/connect-modal';
import VConsole from 'vconsole';

declare global {
  var TransferAccessService: any;
  var TransferHandshake: any;
  var TransferSdnAuthCodeTimer: any;
}

export default (props: { children: ReactNode }) => {
  const isSdm = getPlatformInfo()?.isSdm;
  const isPc = getPlatformInfo()?.isPc;
  const isAndroid = getPlatformInfo()?.isAndroid;
  const dispatch = useDispatch();
  useFetchAssets();
  const { parentIframeUrl, connectModalVisible, insufficientVisible, themeMode } = useSelector(
    (state: any) => state.store
  );

  async function setUp() {
    console.log('layout: setUp');
    message.config({ top: 200, getContainer: () => document?.getElementById('tp-wrapper') });

    const vConsole = new VConsole();
    if (ENV === 'test' || history?.location?.query?.console?.toString() === '1') {
    } else {
      vConsole.destroy();
    }

    fetchRoomContext(dispatch);

    if (!window.TransferHandshake) {
      try {
        if (!isSdm) {
          window.TransferHandshake = new Postmate.Model({
            fetchRoomContext: (roomContext: any) => {
              console.log('Postmate-fetchRoomContext:', roomContext);
              if (roomContext) {
                dispatch({ type: 'store/setRoomContext', payload: roomContext });
              }
            },
            transParentIframe: ({ parentOrigin }: any) => {
              // share project transfer parent iframe
              console.log('transfer-transParentIframe', parentOrigin);
              dispatch({ type: 'store/setParentIframeUrl', payload: parentOrigin });
            },
            'message.sending.me': ({ id, error, data }: any) => {
              SdmCallback.executeCallback(id, error, data);
            }
          });

          window.TransferHandshake.then((parent: any) => {
            console.log('transferParentIframe', parent);
            dispatch({ type: 'store/setParentIframeUrl', payload: parent?.parentOrigin });
          }).catch();
        }
        // init sdm-js-sdk
        console.log('init sdm-js-sdk');
        if (!window.TransferAccessService) {
          window.TransferAccessService = new SdnService({
            dispatch,
            postmate: isSdm ? undefined : window.TransferHandshake
          });
        }
      } catch (e) {
        console.error('init sdm-js-sdk error', e);
      }
    }
  }

  function sdmJSSDKStart() {
    const sourceType = checkSourceType();
    const isCanCheck = isCanAction(parentIframeUrl);
    console.log('sdmJSSDKStart', parentIframeUrl);
    if (sourceType === 'SDN' && (isCanCheck || ['vault', 'wallet'].indexOf(history.location.query?.from?.toString()))) {
      TransferAccessService?.getMyProfile();
      if (isSdm && isAndroid) {
        dispatch({ type: 'store/updateThemeMode', payload: history?.location?.query?.theme ?? 'dark' });
      } else {
        TransferAccessService?.getThemeMode()?.then((res) => {
          console.log('getThemeMode', res);
          dispatch({ type: 'store/updateThemeMode', payload: res });
        });
      }
    } else {
      dispatch({ type: 'store/updateThemeMode', payload: history?.location?.query?.theme ?? 'dark' });
    }
  }

  async function checkAuth() {
    const isPathToAuth = checkIsPathToAuth();
    console.log('IS_LINX_AUTH', IS_LINX_AUTH, isPathToAuth);
    if (!IS_LINX_AUTH || !isPathToAuth) {
      if (IS_LINX_AUTH && !isPathToAuth) {
        const { isValid } = await checkTokenValid(7, dispatch);
        if (!isValid) {
          LocalStorage_remove(LOCAL_WALLET_NAME);
        }
      }
    } else {
      const { isValid } = await checkTokenValid(5, dispatch);
      if (!isValid) {
        actionSdmAuth(dispatch);
      }
    }
  }

  useEffect(() => {
    particleWalletUIDisplay();
  }, [LocalStorage_get(LOCAL_WALLET_NAME)]);

  useEffect(() => {
    setUp();
    checkAuth();
  }, []);

  useEffect(() => {
    sdmJSSDKStart();
  }, [parentIframeUrl]);

  console.log('layout', themeMode);

  return (
    <MobileConfigProvider locale={enUS}>
      <div
        id="tp-wrapper"
        className={`${isPc ? 'web-layout' : 'mobile-layout'} ${themeMode ? `${themeMode}-theme` : ''}`}
      >
        <MultiWalletProvider>
          <div className="wallet_layout">
            <PageNavBar />
            <ErrorBoundary>
              <div className="layout_main">{props.children}</div>
              {connectModalVisible && <ConnectModal visible={connectModalVisible} />}
              {insufficientVisible && <InsufficientPopup />}
            </ErrorBoundary>
          </div>
        </MultiWalletProvider>
      </div>
    </MobileConfigProvider>
  );
};
