import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { TokenSelector, ProcessType } from '@/types';

export const useColDetailStore = create<ColDetailStore>()(
  immer((set) => ({
    loading: true,
    confirmVisible: false,
    orderInfo: undefined,
    isRecever: false,
    isMaker: false,
    receiveInfo: undefined,
    isSpdInsuff: undefined,
    isWalletInsuff: undefined,
    balanceType: 2,
    shortUsd: undefined,
    payToken: undefined,
    leavingMsg: '',
    createBtnLoading: false,
    payUsdTokensLoading: false,
    payUsdTokens: {
      spdTokens: [],
      walletTokens: []
    },
    confirmedPayTokens: undefined,
    isPaymentCode: false,
    // gas
    gasLoadings: undefined,
    gasFees: undefined,
    isInsuffGas: false,
    //
    processList: [],
    processIndex: 0,
    //
    makerReceivedLoading: false,
    makerReceivedList: [],

    updateProcessItem(chanIdKey: string, payload: Partial<any>) {
      set((state) => {
        for (const key in payload) {
          state.processList[chanIdKey][key] = payload[key];
        }
      });
    },
    updatePayDetailItem(index: number, payload: Partial<ProcessType>) {
      set((state) => {
        state.orderInfo!.payDetails![index]!.transferDetails = payload;
      });
    },
    updateState(payload: Partial<ColDetailStore>) {
      set((state) => {
        for (const key in payload) {
          state[key] = payload[key];
        }
      });
    }
  }))
);

interface ColDetailStore {
  loading: boolean;
  confirmVisible: boolean;
  orderInfo: any;
  isRecever: boolean;
  isMaker: boolean;
  receiveInfo: any;
  isSpdInsuff: boolean | undefined;
  isWalletInsuff: boolean | undefined;
  balanceType: number;
  shortUsd: number | undefined;
  payToken: TokenSelector | undefined;
  leavingMsg: string;
  createBtnLoading: boolean;
  payUsdTokensLoading: boolean;
  payUsdTokens: any;
  confirmedPayTokens: any;
  isPaymentCode: boolean;
  // gas
  gasLoadings: any;
  gasFees: any;
  isInsuffGas: any;
  //
  processList: any;
  processIndex: number;
  //
  makerReceivedLoading: boolean;
  makerReceivedList: any;

  updateProcessItem: (chanIdKey: string, payload: Partial<ProcessType>) => void;
  updatePayDetailItem: (index: number, payload: Partial<any>) => void;
  updateState: (payload: Partial<ColDetailStore>) => void;
}

export const useUsdDetailStore = create<UsdDetailStore>()(
  immer((set, get) => ({
    isCustom: false,
    sltIndex: undefined,
    checkedToken: undefined,
    confirmLoading: false,
    confirmDisabled: false,
    checkedAttr: {
      isSpdExpand: true,
      spdTotal: 0,
      isWalletExpand: true,
      walletTotal: 0
    },
    payUsdTotal: undefined,

    updateUsdState(payload: Partial<UsdDetailStore>) {
      set((state) => {
        for (const key in payload) {
          state[key] = payload[key];
        }
      });
    }
  }))
);

interface UsdDetailStore {
  isCustom: boolean;
  sltIndex: number | undefined;
  checkedToken: any;
  confirmLoading: boolean;
  confirmDisabled: boolean;
  checkedAttr: any;
  payUsdTotal: number | undefined;

  updateUsdState: (payload: Partial<UsdDetailStore>) => void;
}

export const useOtherDetailStore = create<OtherDetailStore>()(
  immer((set) => ({
    ethPrice: undefined,
    paymentVisible: false,
    confirmLoading: false,

    updateOtherState(payload: Partial<OtherDetailStore>) {
      set((state) => {
        for (const key in payload) {
          state[key] = payload[key];
        }
      });
    }
  }))
);

interface OtherDetailStore {
  ethPrice: number | undefined;
  paymentVisible: boolean;
  confirmLoading: boolean;

  updateOtherState: (payload: Partial<OtherDetailStore>) => void;
}
