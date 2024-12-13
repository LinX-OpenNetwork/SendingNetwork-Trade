import axios from 'axios';
import { actionSdmAuth } from './passport-auth';
import { IS_LINX_AUTH } from '@/constants';

const instance = axios.create({
  baseURL: ''
  // headers: { 'Content-Type': 'application/json' }
});

instance.interceptors.request.use((config) => {
  return config;
});

instance.interceptors.response.use(
  (res) => {
    const data = res.data;
    if (IS_LINX_AUTH && data?.errorCode === '40105') {
      actionSdmAuth();
    }
    return data;
  },
  (err) => {
    return err;
  }
);

export default instance.request;

// linxRequest
const linxInstance = axios.create({
  baseURL: process.env.LINX_SERVER_URL + '/_api/client/r0/oauth'
});

linxInstance.interceptors.response.use(
  (res) => {
    return res.data;
  },
  (err) => {
    return err;
  }
);

export const linxRequest = linxInstance.request;
