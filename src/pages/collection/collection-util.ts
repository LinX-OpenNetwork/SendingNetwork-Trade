import { finished, updateTxId, updateStatusSpd } from '@/services';
import { message } from 'antd';

export function updateOrder(
  id: any,
  accessToken: string,
  chainId: number | undefined,
  txId: string,
  message: string,
  walletAddress: string,
  detailIdList?: number[]
) {
  let args = {
    accessToken: accessToken,
    chainId: chainId,
    txId: txId,
    id: id,
    message,
    walletAddress,
    detailIdList
  };
  updateTxId(args).then((respUpdate) => {
    console.log('updateTxId', respUpdate);
  });
}

export function finishOrder(
  id: any,
  accessToken: string,
  chainId: number | undefined,
  txId: string,
  afterSuccess: any,
  usd?: boolean,
  afterFailed?: any
) {
  let args = {
    accessToken: accessToken,
    chainId: chainId,
    txId: txId,
    id: id,
    usd: usd ? 1 : 0
  };
  finished(args).then((respFinish) => {
    console.log('finished order, ', respFinish);
    if (respFinish?.success) {
      afterSuccess();
    } else {
      afterFailed?.({ message: respFinish?.errorMsg || 'Update status error' });
      message.error(respFinish?.errorMsg || 'Update status error');
      return;
    }
  });
}

export async function updateOrderFromSpd(id: string, accessToken: string, message: string) {
  return updateStatusSpd({
    accessToken,
    id,
    message
  });
}
