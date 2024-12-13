export default {
  name: 'assets',
  state: {
    assetsPublicKey: '',
    assetsDefaultToken: {},
    // eth
    ethTokenLoading: false,
    ethTokenList: [],
    ethNftLoading: false,
    ethNftList: [],
    ethTopTokenLoading: false,
    ethTopTokenList: [],

    // polygon
    polygonTokenLoading: false,
    polygonTokenList: [],
    polygonNftLoading: false,
    polygonNftList: [],
    polygonTopTokenLoading: false,
    polygonTopTokenList: [],

    // arbitrum
    arbitrumTokenLoading: false,
    arbitrumTokenList: [],
    arbitrumNftLoading: false,
    arbitrumNftList: [],
    arbitrumTopTokenLoading: false,
    arbitrumTopTokenList: [],

    // bnb
    bnbTokenLoading: false,
    bnbTokenList: [],
    bnbNftLoading: false,
    bnbNftList: [],
    bnbTopTokenLoading: false,
    bnbTopTokenList: [],

    // linea
    lineaTokenLoading: false,
    lineaTokenList: [],
    lineaNftLoading: false,
    lineaNftList: [],
    lineaTopTokenLoading: false,
    lineaTopTokenList: [],

    // optimism
    optimismTokenLoading: false,
    optimismTokenList: [],
    optimismNftLoading: false,
    optimismNftList: [],
    optimismTopTokenLoading: false,
    optimismTopTokenList: [],

    // spending
    spendingTokenLoading: false,
    spendingTokenList: [],
    spendingNftLoading: false,
    spendingNftList: [],

    // usdList
    usdTokenLoading: false,
    usdTokenList: [],

    // bill usd
    billUsdTokenLoading: false,
    billUsdTokenList: []
  },
  effects: {
    *updatePublicKey({ payload }: any, { put }: any) {
      // console.log('dva-effects-updatePublicKey', payload);
      yield put({
        type: 'save',
        key: 'assetsPublicKey',
        payload: payload
      });
    },
    *updateTokenLoading({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateTokenLoading', payload);
      yield put({
        type: 'save',
        key: payload?.chain + 'TokenLoading',
        payload: payload?.value
      });
    },
    *updateTokenList({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateTokenList', payload);
      yield put({
        type: 'save',
        key: payload?.chain + 'TokenList',
        payload: payload?.value
      });
    },
    *updateNftLoading({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateNftLoading', payload);
      yield put({
        type: 'save',
        key: payload?.chain + 'NftLoading',
        payload: payload?.value
      });
    },
    *updateNftList({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateNftList', payload);
      yield put({
        type: 'save',
        key: payload?.chain + 'NftList',
        payload: payload?.value
      });
    },
    *updateSpendingTokenLoading({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateSpendingTokenLoading', payload);
      yield put({
        type: 'save',
        key: 'spendingTokenLoading',
        payload: payload
      });
    },
    *updateSpendingTokenList({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateSpendingTokenList', payload);
      yield put({
        type: 'save',
        key: 'spendingTokenList',
        payload
      });
    },
    *updateSpendingNftLoading({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateSpendingNftLoading', payload);
      yield put({
        type: 'save',
        key: 'spendingNftLoading',
        payload: payload
      });
    },
    *updateSpendingNftList({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateSpendingNftList', payload);
      yield put({
        type: 'save',
        key: 'spendingNftList',
        payload
      });
    },
    *updateTopTokenLoading({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateTopTokenLoading', payload);
      yield put({
        type: 'save',
        key: payload?.chain + 'TopTokenLoading',
        payload: payload?.value
      });
    },
    *updateTopTokenList({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateTopTokenList', payload);
      yield put({
        type: 'save',
        key: payload?.chain + 'TopTokenList',
        payload: payload?.value
      });
    },
    *updateDefaultToken({ payload }: any, { put, select }: any) {
      const { assetsDefaultToken } = yield select((state: any) => state.assets);
      // console.log('dva-effects-updateDefaultToken', payload, assetsDefaultToken);
      yield put({
        type: 'save',
        key: 'assetsDefaultToken',
        payload: {
          ...assetsDefaultToken,
          [payload?.chain]: payload?.value
        }
      });
    },
    *updateUsdTokenLoading({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateUsdTokenLoading', payload);
      yield put({
        type: 'save',
        key: 'usdTokenLoading',
        payload: payload
      });
    },
    *updateUsdTokenList({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateUsdTokenList', payload);
      yield put({
        type: 'save',
        key: 'usdTokenList',
        payload: payload
      });
    },
    *updateBillUsdTokenLoading({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateBillUsdTokenLoading', payload);
      yield put({
        type: 'save',
        key: 'billUsdTokenLoading',
        payload: payload
      });
    },
    *updateBillUsdTokenList({ payload }: any, { put }: any) {
      // console.log('dva-effects-updateBillUsdTokenList', payload);
      yield put({
        type: 'save',
        key: 'billUsdTokenList',
        payload: payload
      });
    }
  },
  reducers: {
    save(state: any, action: any) {
      state[action.key] = action.payload;
      return { ...state };
    }
  },
  subscriptions: {}
};
