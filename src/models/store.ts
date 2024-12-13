import { getLocalUserInfo, LocalStorage_set } from '@/utils';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { LOCAL_ETH_CHAIN_ID } from '@/constants';

export default {
  name: 'store',
  state: {
    localUserInfo: undefined,
    sdnUser: undefined,
    roomInfo: undefined,
    pktRoomInfo: undefined,

    connectModalVisible: false,
    isCreate: false,
    autoReceive: false,

    roomId: undefined,
    roomContext: undefined,

    tokenSelectorVisible: false,

    swapSelectModalVisible: false,
    swapModalVisible: false,
    isCrossChainSwap: false,
    swapToken: undefined,

    isRecoAccount: false,
    // CurrentWalletProps {
    //   chainId: number;
    //   publicKey: string;
    //   walletName: string;
    //   walletLogo: string;
    //   balance: number;
    // }
    authedAccountInfo: undefined,
    accountList: [],

    insufficientVisible: false,
    insuffInfo: undefined,

    parentIframeUrl: undefined,

    hideInsuffSwitch: false,
    buyToken: undefined,
    buyTokenList: [],

    themeMode: undefined
  },
  effects: {
    *updateSdnUser({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateSdnUser', payload);
      yield put({
        type: 'save',
        key: 'sdnUser',
        payload
      });
    },
    *updateRoomInfo({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateRoomInfo');
      yield put({
        type: 'save',
        key: 'roomInfo',
        payload
      });
    },
    *updatePktRoomInfo({ payload }: any, { put }: any) {
      // console.log('dva-effects-updatePktRoomInfo');
      yield put({
        type: 'save',
        key: 'pktRoomInfo',
        payload
      });
    },
    *setConnectModalVisible({ payload }: any, { put }: any) {
      // console.log('dva-effects-setConnectModalVisible', payload);
      const { visible, isCreate, autoReceive, isRecoAccount } = payload;
      yield put({
        type: 'save',
        key: 'connectModalVisible',
        payload: visible
      });
      yield put({
        type: 'save',
        key: 'autoReceive',
        payload: autoReceive
      });
      yield put({
        type: 'save',
        key: 'isCreate',
        payload: isCreate ? isCreate : false
      });
      yield put({
        type: 'save',
        key: 'isRecoAccount',
        payload: isRecoAccount ? isRecoAccount : false
      });
    },
    *setRoomContext({ payload }: any, { put }: any) {
      // console.log('dva-effects-setRoomContext', payload);
      const isSdmAndroid = getPlatformInfo()?.isSdm && getPlatformInfo()?.isAndroid;
      if (!isSdmAndroid) {
        yield put({
          type: 'save',
          key: 'roomContext',
          payload: payload
        });
        yield put({
          type: 'save',
          key: 'roomId',
          payload: payload?.roomId
        });
      }
    },
    *updateRoomId({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateRoomId', payload);
      yield put({
        type: 'save',
        key: 'roomId',
        payload
      });
    },
    *setTokenSelectorVisible({ payload }: any, { put }: any) {
      yield put({
        type: 'save',
        key: 'tokenSelectorVisible',
        payload
      });
    },
    *updateLocalUserInfo({ payload }: any, { put }: any) {
      yield put({
        type: 'save',
        key: 'localUserInfo',
        payload
      });
    },
    *setSwapSelectModalVisible({ payload }: any, { put }: any) {
      yield put({
        type: 'save',
        key: 'swapSelectModalVisible',
        payload: payload?.visible
      });
    },
    *setSwapModalVisible({ payload }: any, { put }: any) {
      yield put({
        type: 'save',
        key: 'swapModalVisible',
        payload: payload?.visible
      });
    },
    *setIsCrossChainSwap({ payload }: any, { put }: any) {
      yield put({
        type: 'save',
        key: 'isCrossChainSwap',
        payload
      });
    },
    *setAuthedAccountInfo({ payload }: any, { put }: any) {
      // console.log('dva-effects-setAuthedAccountInfo', payload);
      LocalStorage_set(LOCAL_ETH_CHAIN_ID, payload?.chainId);
      yield put({
        type: 'save',
        key: 'authedAccountInfo',
        payload: payload
      });
    },
    *setAccountList({ payload }: any, { put }: any) {
      yield put({
        type: 'save',
        key: 'accountList',
        payload
      });
    },
    *setInsufficientVisible({ payload }: any, { put }: any) {
      yield put({
        type: 'save',
        key: 'insufficientVisible',
        payload: payload?.visible
      });
      yield put({
        type: 'save',
        key: 'hideInsuffSwitch',
        payload: payload?.hideInsuffSwitch
      });
      yield put({
        type: 'save',
        key: 'insuffInfo',
        payload: payload?.insuffInfo
      });
    },
    *setParentIframeUrl({ payload }: any, { put }: any) {
      // console.log('dva-effects-setParentIframeUrl', payload);
      yield put({
        type: 'save',
        key: 'parentIframeUrl',
        payload
      });
    },
    *setBuyToken({ payload }: any, { put }: any) {
      yield put({
        type: 'save',
        key: 'buyToken',
        payload: payload?.buyToken
      });
      yield put({
        type: 'save',
        key: 'buyTokenList',
        payload: payload?.buyTokenList ?? []
      });
    },
    *setSwapToken({ payload }: any, { put }: any) {
      yield put({
        type: 'save',
        key: 'swapToken',
        payload
      });
    },
    *updateThemeMode({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateThemeMode', payload);
      yield put({
        type: 'save',
        key: 'themeMode',
        payload
      });
    }
  },
  reducers: {
    save(state: any, action: any) {
      state[action.key] = action.payload;
      return { ...state };
    }
  },
  subscriptions: {
    setup({ dispatch, history }: any) {
      return history.listen((historyParams: any) => {
        const isSdm = getPlatformInfo()?.isSdm;
        const isAndroid = getPlatformInfo()?.isAndroid;
        // console.log('store-historyParams', historyParams, isSdm, isAndroid);
        if (!isSdm || (isSdm && isAndroid)) {
          dispatch({
            type: 'updateRoomId',
            payload: history?.location?.query?.roomId?.toString()
          });
        }
        const localUserInfo = getLocalUserInfo();
        // console.log('xxxx', localUserInfo);
        dispatch({
          type: 'updateLocalUserInfo',
          payload: localUserInfo
        });
      });
    }
  }
};
