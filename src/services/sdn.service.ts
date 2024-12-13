import { Toast } from 'antd-mobile';
import { history } from 'umi';
import { PROJECT_NAME, LOCAL_SDN_USER, LINX_AUTH_INFO } from '@/constants';
import SdmClientSDk, { PlatformType } from 'sdm-js-sdk';
import { LocalStorage_set } from '@/utils';
import { getPlatformInfo } from '@/lib/dom/getPlatformInfo';
import { PassportAuth } from './passport-auth';
import { isArray } from 'lodash';
export class SdnService {
  dispatch?: any;
  clientType?: any;
  SdmClientInstance: any;

  constructor({ dispatch, postmate }: { dispatch?: any; postmate?: any }) {
    this.dispatch = dispatch;

    const isAndroid = getPlatformInfo()?.isAndroid;
    const isSdm = getPlatformInfo()?.isSdm;
    const type = isSdm ? (isAndroid ? PlatformType.Android : PlatformType.iOS) : PlatformType.Web;
    this.clientType = type;
    console.log('new-sdn-type', type, postmate);

    this.SdmClientInstance = new SdmClientSDk({
      type,
      postmate
    });
  }

  getRoomInfo(roomId: string, updateKey?: string) {
    console.log('sdn-getRoomInfo', roomId);
    return new Promise((resolve, reject) => {
      if (!roomId || roomId === '') return reject('empty roomId');

      const callback = (params: any) => {
        console.log('sdn-callback-getRoomInfo', params, updateKey);
        let members: any = [];
        if (params?.members?.length > 0) {
          (params?.members || []).forEach((item: any) => {
            if (item && item?.user?.userId) {
              let icon = item?.avatar || item?.user?.avatar;
              let name = item?.nickName && item?.nickName !== '' ? item?.nickName : item?.user?.name;
              members.push({
                name: name && name !== '' ? name : item?.user?.walletAddress,
                userId: item?.user?.userId,
                walletAddress: item?.user?.walletAddress,
                icon: icon?.indexOf('mxc') >= 0 ? null : icon,
                userLevel: item?.powerLevel ?? item?.powerLeveL
              });
            }
          });
        }
        this.dispatch({
          type: updateKey === 'pktRoomInfo' ? 'store/updatePktRoomInfo' : 'store/updateRoomInfo',
          payload: {
            total: members?.length,
            members,
            roomType: params?.type,
            owner: params?.owner,
            name: params?.name,
            avatar: params?.avatar,
            squadId: params?.squadId
          }
        });

        return resolve({
          total: members?.length,
          members,
          roomType: params?.type,
          owner: params?.owner,
          name: params?.name,
          avatar: params?.avatar,
          squadId: params?.squadId
        });
      };
      this.SdmClientInstance.getRoomInfo(roomId, callback);
      // timeout
      timeoutReject(reject, 'sdn-timout-getRoomInfo');
    });
  }

  shareToRoom(paramArray: any[], roomId: string, isToast?: boolean, thenFn?: any, catchFn?: any) {
    console.log('sdn-sendMessage', roomId, paramArray);
    return new Promise((resolve, reject) => {
      if (!roomId || paramArray?.length <= 0) return reject('empty roomId');
      let isFulled = false;
      const callback = (res: any) => {
        console.log('sdn-callback-sendMessage', res);
        //IOS
        if (res === 200) {
          res = {
            event_id: 1
          };
        }
        //web
        if (res?.code === 200 || res?.code?.toString() === '200') {
          res.event_id = 1;
        }
        isFulled = true;
        if (thenFn) {
          thenFn(res);
        } else {
          if (res && res?.event_id) {
            if (isToast) {
              Toast.show({
                content: `${PROJECT_NAME} link has been sent`,
                maskClassName: 'copy_toast_mask'
              });
            }
          } else {
            // message.error('Send message failed');
          }
        }

        return resolve(res);
      };
      console.log('sdn-sendMessage-1');
      paramArray.forEach((params, index) => {
        console.log('sdn-sendMessage-paramArray', params, index);
        this.SdmClientInstance.sendMessage(roomId, params, index === paramArray?.length - 1 ? callback : () => {});
      });

      // setTimeout(() => {
      //   callback(200); //local test
      // }, 2000);

      // timeout
      setTimeout(() => {
        if (!isFulled) {
          console.log('sdn-timout-sendMessage');
          if (catchFn) {
            catchFn();
          }
          reject('sdn-timout-sendMessage');
        }
      }, 15000);
    });
  }

  getMyProfile() {
    console.log('sdn-getMyProfile', history.location.query);
    let userProfile: any;
    const state = history.location.query?.state;
    if (state && !isArray(state)) {
      const stateArray = JSON.parse(decodeURIComponent(state)) || {};
      if (stateArray?.user) {
        userProfile = decodeURIComponent(stateArray?.user);
      }
    }
    if (history.location.query?.user && !isArray(history.location.query?.user)) {
      userProfile = decodeURIComponent(history.location.query?.user);
    }
    console.log('sdn-getMyProfile-userProfile', userProfile, userProfile?.userId);
    if (userProfile) {
      userProfile = JSON.parse(userProfile);
      // from url
      LocalStorage_set(LOCAL_SDN_USER, JSON.stringify(userProfile));
      window.sdnUserInfo = userProfile;
      console.log('sdn-getMyProfile-user', userProfile, window.sdnUserInfo);
      this.dispatch({
        type: 'store/updateSdnUser',
        payload: userProfile
      });
      return userProfile;
    } else {
      // from sdk
      return new Promise((resolve, reject) => {
        const callback = (userProfile: any) => {
          console.log('sdn-callback-getMyProfile', userProfile);
          if (userProfile?.userId && userProfile?.walletAddress) {
            LocalStorage_set(LOCAL_SDN_USER, JSON.stringify(userProfile));
            window.sdnUserInfo = userProfile;
            this.dispatch({
              type: 'store/updateSdnUser',
              payload: userProfile
            });
            return resolve(userProfile);
          } else {
            return reject('User Info error, please try again later');
          }
        };
        this.SdmClientInstance.getMyProfile(callback);

        // setTimeout(() => {
        //   callback(userData); //local test
        // }, 1000);

        // timeout
        timeoutReject(reject, 'sdn-timout-getMyProfile');
      });
    }
  }

  getUserProfile(userId: string) {
    console.log('sdn-getUserProfile', userId);
    return new Promise((resolve, reject) => {
      if (!userId || userId === '') return reject('empty userId');
      const callback = (userProfile: any) => {
        console.log('sdn-callback-getUserProfile', userId, userProfile);
        let icon = userProfile?.avatar ?? userProfile?.user?.avatar ?? userProfile?.avatarUrl;
        return resolve({
          userId: userProfile?.userId ?? userProfile?.user?.userId,
          name: userProfile?.name ?? userProfile?.user?.name,
          walletAddress: userProfile?.walletAddress ?? userProfile?.user?.walletAddress,
          avatar: icon?.indexOf('mxc') >= 0 ? null : icon
        });
      };
      this.SdmClientInstance.getUserProfile(userId, callback);
      // timeout
      setTimeout(() => {
        // message.error('get user info error');
        reject('sdn-timout-getUserProfile');
      }, 10000);
    });
  }

  getUserList(userIds: string[]) {
    console.log('sdn-getUserList', userIds);
    const callback = (params: any) => {
      console.log('sdn-getUserList-callback', userIds, params);
    };
    if (userIds) {
      this.SdmClientInstance.getUserList(userIds, callback);
    }
  }

  getRoomMember(roomId: string, userId: string) {
    console.log('sdn-getRoomMember', roomId, userId);
    const callback = (params: any) => {
      console.log('sdn-getRoomMember-callback', roomId, userId, params);
    };
    if (roomId && userId) {
      this.SdmClientInstance.getRoomMember(roomId, userId, callback);
    }
  }

  sendEvent(roomId: string, body: any) {
    console.log('sdn-sendEvent', roomId, body);
    return new Promise((resolve, reject) => {
      const callback = (params: any) => {
        console.log('sdn-callback-sendEvent', params);
        return resolve(params);
      };

      this.SdmClientInstance.sendEvent(roomId, body, callback);
      // timeout
      timeoutReject(reject, 'sdn-timout-sendEvent');
    });
  }

  fetchAuthorizeCode() {
    console.log('sdn-fetchAuthorizeCode');
    this.SdmClientInstance.fetchAuthorizeCode(
      'code',
      LINX_AUTH_INFO.clientId,
      LINX_AUTH_INFO.redirectUri,
      (result: any) => {
        console.log('sdn-callback-fetchAuthorizeCode', result);
        if (result) {
          if (result?.authorization_code) {
            PassportAuth.mobileAppCallBack(null, result?.authorization_code);
          } else {
            PassportAuth.mobileAppCallBack('auth code from sdm-js-sdk is emtpy, please try again later', null);
          }
        } else {
          PassportAuth.mobileAppCallBack('fetchAuthorizeCode error', null);
        }
      }
    );
  }

  request(method: string, params: any) {
    console.log('sdn-request', method, params);
    return new Promise((resolve, reject) => {
      const callback = (params: any) => {
        console.log('sdn-callback-request', params);
        return resolve(params);
      };

      this.SdmClientInstance.request(method, params, callback);
      // timeout
      timeoutReject(reject, 'sdn-timout-request');
    });
  }

  getThemeMode() {
    console.log('getThemeMode');
    const isAndroid = getPlatformInfo()?.isAndroid;
    const isSdm = getPlatformInfo()?.isSdm;
    if (isSdm && isAndroid) {
      return 'dark';
    } else {
      return new Promise((resolve, reject) => {
        const callback = (params: any) => {
          console.log('sdn-callback-getThemeMode', params);
          return resolve(params);
        };

        this.SdmClientInstance.getThemeMode(callback);
        // timeout
        timeoutReject(reject, 'sdn-timout-getThemeMode');
      });
    }
  }
}

const userData = {
  userId: '@0x82ae212daca2cd02fd4bb4ff47053a42f9a3e92a:hs-alpha.sending.me',
  name: 'Sally',
  avatarUrl:
    'https://hs-alpha.sending.me/_matrix/media/r0/thumbnail/hs-alpha.sending.me/2022-12-08_OUrHXjkvmgNHXgcC?width=210&height=210&method=crop',
  walletAddress: '0x82ae212daca2cd02fd4bb4ff47053a42f9a3e92a'
};

function timeoutReject(reject: any, msg: string) {
  setTimeout(() => {
    reject(msg);
  }, 10000);
}
