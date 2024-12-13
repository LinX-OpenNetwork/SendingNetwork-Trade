import { useSelector } from 'dva';
import { useEffect } from 'react';
import { useCollectionStore } from './store';
import {
  LocalStorage_get,
  LocalStorage_set,
  closeBrowserMobile,
  getAuthUserInfo,
  getToken,
  MathUtil_plus,
  MathUtil_numberFixed,
  MathUtil_divPow,
  checkSourceType
} from '@/utils';
import { LOCAL_CREATED_TOKEN, LINX_WEB_URL, SHARE_URL } from '@/constants';
import { message } from 'antd';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { history } from 'umi';
import { filter, findIndex, join } from 'lodash';
import { createReceiveOrder } from '@/services';
import { TokenSelector } from '@/types';

export const useCollection = () => {
  const isSdm = getPlatformInfo()?.isSdm;
  const sourceType = checkSourceType();
  const { roomInfo: sdnRoomInfo, roomId, authedAccountInfo } = useSelector((state: any) => state.store);
  const { usdTokenList } = useSelector((state: any) => state.assets);

  const {
    isAcceptSpd,
    cltType,
    roomInfo,
    token,
    descTitle,
    balanceType,
    collectionAccount,
    isExternal,
    isReceiveInPayment,
    tokenAmount,
    showAmount,
    members,
    participants,
    updateState
  } = useCollectionStore();

  async function getRoomInfo() {
    if (sdnRoomInfo) {
      updateState({ roomInfo: sdnRoomInfo });
    } else {
      if (roomId) {
        const res = await TransferAccessService.getRoomInfo(roomId);
        if (res && res?.total) {
          updateState({ roomInfo: res });
        }
      }
    }
  }

  function checkConfirmParam(isReturn?: boolean) {
    const imUserInfo = getAuthUserInfo();
    const accessToken = getToken();
    let recordData: any = {
      accessToken,
      chainId: token?.address === 'USD' ? 0 : token?.chainId,
      roomId,
      title: descTitle,
      receiverAddress: collectionAccount?.walletAddress,
      receiverUserId: isExternal ? '' : imUserInfo?.id,
      receiverUserName: isExternal ? collectionAccount?.name : imUserInfo?.name,
      receiverUserImage: isExternal ? collectionAccount?.icon : imUserInfo?.avatar,
      type: cltType,
      totalCount: 0,
      totalAmount: cltType === 2 ? tokenAmount : showAmount,
      unitAmount: 0,
      expriedTime: '',
      tokenAddress: token?.address,
      tokenSymbol: token?.symbol,
      tokenIcon: token?.icon,
      tokenDecimal: token?.decimals,
      makers: [],
      imAccessToken: imUserInfo?.token,
      spd: isAcceptSpd
    };
    if (token?.address === 'USD') {
      const checkedUsdTokenList = usdTokenList?.filter((o: any) => o.isChecked);
      const checkedUsdTokenListLen = checkedUsdTokenList?.length;
      if (checkedUsdTokenListLen <= 0) {
        message.error('USD is empty');
        return;
      } else if (checkedUsdTokenListLen === 1) {
        recordData.chainId = checkedUsdTokenList?.[0]?.chainId;
        recordData.tokenAddress = checkedUsdTokenList?.[0]?.address;
        recordData.tokenSymbol = checkedUsdTokenList?.[0]?.symbol;
        recordData.tokenIcon = checkedUsdTokenList?.[0]?.icon;
        recordData.tokenDecimal = checkedUsdTokenList?.[0]?.decimals;
      } else {
        recordData.usdIds = join(
          checkedUsdTokenList?.map((o: TokenSelector) => o?.id),
          ','
        );
      }
    }
    // cltType 2: Equal Collection; 3: Specified Collection;
    if (cltType === 2) {
      if (!tokenAmount || Number(tokenAmount) <= 0) {
        message.error('Amount is empty');
        return;
      }
      const selectedMembers = filter(members, (o) => o?.isChecked);
      let selectedMembersLen = selectedMembers?.length;
      if (isReceiveInPayment) {
        selectedMembersLen += 1;
      }
      if (selectedMembersLen == 0) {
        message.error('No members');
        return;
      }
      let payAmount = MathUtil_numberFixed(MathUtil_divPow(Number(tokenAmount), selectedMembersLen), 6);
      recordData.unitAmount = payAmount;
      for (const member of selectedMembers) {
        recordData.makers.push({
          makerAddress: member.walletAddress,
          makerUserId: member.userId,
          makerUserName: member.name,
          makerUserImage: member.icon,
          tokenAmount: payAmount
        });
      }
      if (isReceiveInPayment) {
        recordData.makers.unshift({
          makerAddress: collectionAccount.walletAddress,
          makerUserId: collectionAccount.userId,
          makerUserName: collectionAccount.name,
          makerUserImage: collectionAccount.icon,
          tokenAmount: payAmount
        });
      }
      recordData.totalCount = recordData.makers?.length;
      if (recordData.totalCount < 1) {
        message.error('No member for payment');
        return;
      }
      let checkAmount = Number(tokenAmount) / recordData.totalCount < 0.0001;
      // console.log('checkAmount=', checkAmount);
      if (checkAmount) {
        message.error('Token amount too small');
        return;
      }
    } else if (cltType === 3) {
      // console.log('participants[0]=', participants[0]);
      const selParticipants = filter(participants, (o) => o.value > 0);
      for (const member of selParticipants) {
        // console.log('member=', member);
        if (member.value < 0.0001) {
          message.error('Token amount too small');
          return;
        }
        if (member.userId == imUserInfo.id) {
          message.error('Cannot have yourself in specified payment');
          return;
        }
        recordData.makers.push({
          makerAddress: member.walletAddress,
          makerUserId: member.userId,
          makerUserName: member.name,
          makerUserImage: member.icon,
          tokenAmount: member.value
        });
      }
      recordData.totalCount = recordData.makers?.length;
      if (recordData.totalCount <= 0) {
        message.error('No participants');
        return;
      }
    } else {
      message.error('Please select type');
      return;
    }
    if (isReturn) {
      return recordData;
    } else {
      // setConfirmVisible(true);
      onConfirm();
    }
  }

  async function onConfirm() {
    // setConfirmVisible(false);
    const recordData = checkConfirmParam(true);
    updateState({ createBtnLoading: true });
    const resp = await createReceiveOrder(recordData).finally(() => {
      updateState({ createBtnLoading: false });
    });
    if (resp && resp?.success && resp?.result) {
      // start ---set created token
      let createdToken = JSON.parse(LocalStorage_get(LOCAL_CREATED_TOKEN) ?? '{}');
      createdToken![`${authedAccountInfo?.chainId}-receive`] = {
        symbol: token?.symbol,
        address: token?.address,
        name: token?.symbol,
        decimals: token?.decimals,
        chainType: 'eth',
        chainId: authedAccountInfo?.chainId,
        icon: token?.icon,
        balanceType
      };
      LocalStorage_set(LOCAL_CREATED_TOKEN, JSON.stringify(createdToken));
      // end ---set created token
      await sendMsg(resp.result, cltType);

      //close window on mobile
      if (isSdm) {
        setTimeout(() => {
          closeBrowserMobile();
        }, 2000);
      } else {
        history.push(
          `/collection-detail?id=${resp.result}&back=1&roomId=${roomId}${sourceType === 'SDN' ? '&st=sdn' : ''}`
        );
      }
    } else {
      message.error(resp?.errorMsg);
      return;
    }
  }

  async function sendMsg(orderId: number, type: number) {
    if (!roomId) return;
    let msg = '';
    let msgHtml = '';
    if (type === 2) {
      let selectedMembers = filter(members, (o) => o.isChecked);
      for (const selectedMember of selectedMembers) {
        msg += '@' + selectedMember.name + ' ';
        msgHtml += `<a href=\"${LINX_WEB_URL}/#/user/${selectedMember?.userId}\">@${selectedMember.name}</a> `;
      }
    } else if (type === 3) {
      let selParticipants = filter(participants, (o) => o.value > 0);
      for (const member of selParticipants) {
        msg += '@' + member.name + ' ';
        msgHtml += `<a href=\"${LINX_WEB_URL}/#/user/${member?.userId}\">@${member.name}</a> `;
      }
    }
    msg += 'You have an unpaid split bill ';
    msgHtml += 'You have an unpaid split bill ';
    const shareUrl = `${SHARE_URL}/collection-detail?id=${orderId}&type=${type}${
      sourceType === 'SDN' ? '&st=sdn' : ''
    }`;

    TransferAccessService.shareToRoom(
      [
        {
          body: '💰 ' + msg + '\n' + shareUrl,
          msgtype: 'm.text',
          format: 'org.matrix.custom.html',
          formatted_body: '💰 ' + msgHtml + '\n' + shareUrl
        }
      ],
      roomId,
      false,
      () => {},
      () => {}
    );
  }

  function updateShowAmount() {
    const selMembers = cltType === 2 ? filter(members, (o) => o?.isChecked) : filter(participants, (o) => o.value > 0);
    let selMembersLen = selMembers?.length;
    let totalAmountValue: any = 0;
    if (cltType === 2) {
      if (isReceiveInPayment) {
        selMembersLen += 1;
      }
      totalAmountValue =
        tokenAmount && Number(tokenAmount) > 0 && selMembersLen > 0
          ? MathUtil_numberFixed(MathUtil_divPow(Number(tokenAmount), selMembersLen), 6)
          : 0;
      updateState({ showAmount: totalAmountValue });
    } else if (cltType === 3) {
      (selMembers || []).forEach((item) => {
        totalAmountValue = MathUtil_plus(totalAmountValue, item?.value ? Number(item?.value) : 0);
      });
      updateState({ showAmount: totalAmountValue });
    }
  }

  useEffect(() => {
    getRoomInfo();
  }, [roomId, sdnRoomInfo]);

  useEffect(() => {
    updateShowAmount();
  }, [cltType, tokenAmount, isReceiveInPayment, JSON.stringify(members), JSON.stringify(participants)]);

  useEffect(() => {
    if (cltType === 2) {
      const selMembers = filter(members, (o) => o?.isChecked);
      const isInMember =
        findIndex(
          selMembers,
          (o: any) => o?.walletAddress?.toUpperCase() === collectionAccount?.walletAddress?.toUpperCase()
        ) >= 0
          ? true
          : false;

      updateState({ isReceiveInPayment: !isInMember && isExternal && collectionAccount?.isChecked });
    }
  }, [cltType, collectionAccount, isExternal, JSON.stringify(members)]);

  useEffect(() => {
    if (authedAccountInfo) {
      updateState({
        collectionAccount: {
          value: '',
          userId: '',
          isChecked: false,
          name: authedAccountInfo?.walletName,
          icon: authedAccountInfo?.walletLogo,
          walletAddress: authedAccountInfo?.publicKey
        }
      });
    }
  }, [authedAccountInfo]);

  useEffect(() => {
    if (roomInfo && roomInfo?.members) {
      let membersTemp: any = [];
      let participantsTemp: any = [];
      roomInfo.members?.forEach((item: any) => {
        membersTemp.push({ ...item, isChecked: false });
        participantsTemp.push({ ...item, value: undefined });
      });
      updateState({ members: membersTemp, participants: participantsTemp });
    }
  }, [roomInfo]);

  return {
    onConfirm,
    checkConfirmParam
  };
};
