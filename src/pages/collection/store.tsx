import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { TokenSelector, ProcessType, TokenInfo, RoomInfo } from '@/types';

export const useCollectionStore = create<CollectionStore>()(
  immer((set) => ({
    cltType: 2,
    roomInfo: undefined,
    token: undefined,
    descTitle: '',
    selectAccountVisible: false,
    collectionAccount: undefined,
    tokenAmount: undefined,
    createBtnLoading: false,
    showAmount: 0,
    isAcceptSpd: false,
    balanceType: 2,
    members: [],
    membersVisible: false,
    participants: [],
    partiPopupVisible: false,
    addExternalVisible: false,
    isExternal: false,
    isReceiveInPayment: false,

    updateState(payload: Partial<CollectionStore>) {
      set((state) => {
        for (const key in payload) {
          state[key] = payload[key];
        }
      });
    }
  }))
);
interface CollectionStore {
  cltType: number;
  token: TokenInfo;
  roomInfo: RoomInfo;
  descTitle: string;
  selectAccountVisible: boolean;
  collectionAccount: any;
  tokenAmount: string | undefined;
  createBtnLoading: boolean;
  showAmount: number;
  isAcceptSpd: boolean;
  balanceType: number;
  members: any;
  membersVisible: boolean;
  participants: any;
  partiPopupVisible: boolean;
  addExternalVisible: boolean;
  isExternal: boolean;
  isReceiveInPayment: boolean;

  updateState: (payload: Partial<CollectionStore>) => void;
}
