// common response
export interface Response {
  success: true | false;
  msg: string;
  errorCode: null;
  errorMsg: string;
  result: any;
}
