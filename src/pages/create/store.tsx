import { ReactNode } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { UserIndexInfo, RoomInfo, TokenSelector, NftSelector, TokenInfo, signTranscation } from '@/types';

export const useCreateStore = create<CreateStore>()(
  immer((set) => ({
    createBtnLoading: false,
    resultContent: undefined,
    toAddress: '',
    toPeople: undefined,
    roomInfo: undefined,
    sendType: 1,
    initLoading: false,
    isPrivate: false,
    recipientTipVisible: false,
    balanceType: 2,
    isInsuffBalance: false,
    ethPrice: undefined,

    // direct-transfer
    pktMsg: '',
    sentUser: undefined,
    byAddress: false,
    checkedToken: [],
    checkedNft: [],
    checkedChainId: undefined,
    nextLoading: false,
    signList: [],
    signIndex: 0,
    presetToken: undefined,
    hideBalanceTypeMenu: false,
    confirmViewVisible: false,
    largeAmountVisible: false,
    largeAmount: '',
    isTimeout: false,
    // multi-transfer
    // equals
    members: [],
    // participants
    participants: [],
    partiPopupVisible: false,
    membersVisible: false,
    totalAmount: 0,
    amountType: 1,
    tokenAmount: undefined,
    token: undefined,
    descTitle: '',
    gasLoading: false,
    gasFee: undefined,

    isInsuffGas: false,

    resetState() {
      set((state) => {
        state.createBtnLoading = false;
        state.resultContent = undefined;
        state.toAddress = '';
        state.toPeople = undefined;
        state.roomInfo = undefined;
        state.isPrivate = false;
        state.initLoading = false;
        state.recipientTipVisible = false;
        state.balanceType = 2;
        state.isInsuffBalance = false;

        // direct-transfer
        state.pktMsg = '';
        state.sentUser = undefined;
        state.byAddress = false;
        state.checkedToken = [];
        state.checkedNft = [];
        state.checkedChainId = undefined;
        state.nextLoading = false;
        state.signList = [];
        state.signIndex = 0;
        state.presetToken = undefined;
        state.hideBalanceTypeMenu = false;
        state.confirmViewVisible = false;
        state.largeAmountVisible = false;
        state.largeAmount = '';
        state.isTimeout = false;

        // multi-transfer
        state.members = [];
        state.participants = [];
        state.partiPopupVisible = false;
        state.membersVisible = false;
        state.totalAmount = 0;
        state.tokenAmount = undefined;
        // state.token=undefined;
        state.descTitle = '';
        state.gasLoading = false;
        state.gasFee = undefined;
        state.isInsuffGas = false;
      });
    },
    updateSignItemStatus(index: number, payload: number) {
      set((state) => {
        state.signList![index]!.status = payload;
      });
    },
    updateState(payload: Partial<CreateStore>) {
      set((state) => {
        for (const key in payload) {
          state[key] = payload[key];
        }
      });
    }
  }))
);
interface CreateStore {
  createBtnLoading: boolean;
  resultContent: string | ReactNode | undefined;
  toAddress: string;
  toPeople: UserIndexInfo | undefined;
  roomInfo: RoomInfo | undefined;
  sendType: number;
  initLoading: boolean;
  isPrivate: boolean;
  recipientTipVisible: boolean;
  members: any;
  participants: any;
  balanceType: number;
  pktMsg: string;

  sentUser: UserIndexInfo | undefined;
  byAddress: boolean;
  checkedToken: TokenSelector[];
  checkedNft: NftSelector[];
  checkedChainId: number;
  nextLoading: boolean;
  signList: signTranscation[];
  signIndex: number;
  presetToken: TokenSelector | undefined;
  hideBalanceTypeMenu: boolean;
  confirmViewVisible: boolean;
  isInsuffBalance: boolean;
  largeAmountVisible: boolean;
  largeAmount: string;
  isTimeout: boolean;
  //
  partiPopupVisible: boolean;
  membersVisible: boolean;
  totalAmount: number;
  amountType: number;
  tokenAmount: string | undefined;
  token: TokenInfo | undefined;
  descTitle: string;
  gasLoading: boolean;
  gasFee: number | undefined;
  ethPrice: number | undefined;
  isInsuffGas: boolean;

  resetState: () => void;
  updateSignItemStatus: (index: number, payload: number) => void;
  updateState: (payload: Partial<CreateStore>) => void;
}
