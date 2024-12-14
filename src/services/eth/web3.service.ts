import { BigNumber } from '@ethersproject/bignumber';
import { ETH_CONTRACT_ADDRESS_LIST, ETH_NETWORK_CONFIG, LOCAL_CONNECTED_CHAIN_ID } from '@/constants';
import Web3 from 'web3';
import { LocalStorage_get } from '@/utils';
import Web3Utils, { Mixed } from 'web3-utils';
export class EthWeb3Service {
  static getTransferAddress(chainId?: string | number) {
    let chainIdValue;
    if (chainId) {
      chainIdValue = chainId;
    } else {
      chainIdValue = LocalStorage_get(LOCAL_CONNECTED_CHAIN_ID) || ETH_NETWORK_CONFIG.chain_id;
      if (chainIdValue.toString().indexOf('0x') >= 0) {
        chainIdValue = Web3.utils.hexToNumberString(chainIdValue.toString());
      }
    }
    chainIdValue = Number(chainIdValue);
    return ETH_CONTRACT_ADDRESS_LIST[chainIdValue]?.TRANSFER_ADDRESS;
  }

  static async estimateGas(func: any, val: any, _onError: any, address: string) {
    // console.log('estimateGas', val);
    return Math.floor(
      (await func
        .estimateGas({
          from: address,
          value: val
        })
        .catch(_onError)) * 1.2
    );
  }

  static async sendTx(func: any, accountAddress: string, _onTxHash: any, _onReceipt: any, _onError: any) {
    const gasLimit = await this.estimateGas(func, BigNumber.from(0), _onError, accountAddress);
    // console.log('sendTx-gasLimit', accountAddress, gasLimit);
    if (!isNaN(gasLimit)) {
      return func
        .send({
          from: accountAddress,
          gas: gasLimit
        })
        .on('transactionHash', (hash: any) => {
          _onTxHash(hash);
        })
        .on('error', (e: any) => {
          if (e.toString().indexOf('newBlockHeaders') < 0) {
            _onError(e);
          }
        })
        .on('receipt', () => {
          _onReceipt();
        });
    }
  }

  static async needsApprove(
    contract: any,
    type: number,
    address: string,
    tradeAmount: BigNumber | Mixed | undefined,
    account: string,
    chainId?: number,
    gasPriceCon?: string
  ) {
    const transferAddress = this.getTransferAddress(chainId);
    if (!transferAddress || transferAddress === '') {
      console.error('Empty contract address', chainId);
      return;
    }
    console.log('contract transferAddress',"address",address,"transferAddress", transferAddress,account,tradeAmount,gasPriceCon);

    if (type === 1) {
      console.log('contract ERC20 transferAddress', "address",address,transferAddress,gasPriceCon,"account",account,transferAddress);

      const allowance = await contract.ERC20(address, gasPriceCon).methods.allowance(account, transferAddress).call();
      if (tradeAmount) {
        let currentAllowance = BigNumber.from(allowance);
        if (BigNumber.isBigNumber(tradeAmount)) {
          if (currentAllowance.lt(tradeAmount)) {
            return true;
          } else {
            return false;
          }
        } else {
          // @ts-ignore
          if (Web3Utils.toNumber(tradeAmount) > allowance) {
            return true;
          } else {
            return false;
          }
        }
      }
    } else if (type === 2) {
      let isApproved = await contract
        .ERC721(address, gasPriceCon)
        .methods.isApprovedForAll(account, transferAddress)
        .call();
      if (!isApproved) {
        return true;
      }
    } else if (type === 3) {
      let isApproved = await contract
        .ERC1155(address, gasPriceCon)
        .methods.isApprovedForAll(account, transferAddress)
        .call();
      if (!isApproved) {
        return true;
      }
    }
    return false;
  }

  static async approve(
    contract: any,
    type: number,
    address: string,
    account: string,
    chainId?: number,
    gasPriceCon?: string,
    tradeAmount?: BigNumber | Mixed,
    _onError?: any
  ) {
    let func;
    const transferAddress = this.getTransferAddress(chainId);
    if (!transferAddress || transferAddress === '') {
      console.error('contract Empty contract address', chainId);
      return;
    }
    if (type === 1) {
      let maxAllowance: BigNumber | Mixed = BigNumber.from(2).pow(255);
      if (tradeAmount) {
        if (BigNumber.isBigNumber(tradeAmount)) {
          maxAllowance = BigNumber.from(5).mul(tradeAmount);
        } else {
          // @ts-ignore
          maxAllowance = Web3Utils.toNumber(tradeAmount) * 5;
          // console.log('approve', maxAllowance, BigNumber.from(maxAllowance));
        }
      }
      func = contract.ERC20(address, gasPriceCon).methods.approve(transferAddress, maxAllowance);
    } else if (type === 2) {
      func = contract.ERC721(address, gasPriceCon).methods.setApprovalForAll(transferAddress, true);
    } else if (type === 3) {
      func = contract.ERC1155(address, gasPriceCon).methods.setApprovalForAll(transferAddress, true);
    }
    console.log('contract approve-func',"type", type,func,"address",address,"gasPriceCon",gasPriceCon);
    await this.sendTx(
      func,
      account,
      () => {},
      () => {},
      (e: any) => _onError(e)
    );
  }

  static async sendPersonalSign(message: string, address: string, ethWeb3?: any) {
    let sign;
    sign = await ethWeb3.eth.personal.sign(message, address);
    console.log('personalSign', sign);

    return sign;
  }
}
