import { getGasPriceValue } from '@/utils';
import Web3 from 'web3';
import { EthWeb3Service } from '@/services';

export class EthContractService {
  constructor(public web3: Web3) {
    this.web3 = web3;
    this.web3.eth.transactionBlockTimeout = 500;
    this.web3.eth.transactionPollingTimeout = 1000;
  }

  public ERC20(address: string, price?: string, chainId?: string | number) {
    const abi = require('./abi/ERC20.json');
    const gasPriceValue = getGasPriceValue(price, chainId);
    return gasPriceValue
      ? new this.web3.eth.Contract(abi, address, {
          gasPrice: gasPriceValue + ''
        })
      : new this.web3.eth.Contract(abi, address);
  }

  public ERC721(address: string, price?: string, chainId?: string | number) {
    const abi = require('./abi/ERC721.json');
    const gasPriceValue = getGasPriceValue(price, chainId);

    return gasPriceValue
      ? new this.web3.eth.Contract(abi, address, {
          gasPrice: gasPriceValue + ''
        })
      : new this.web3.eth.Contract(abi, address);
  }

  public ERC1155(address: string, price?: string, chainId?: string | number) {
    const abi = require('./abi/ERC1155.json');
    const gasPriceValue = getGasPriceValue(price, chainId);

    return gasPriceValue
      ? new this.web3.eth.Contract(abi, address, {
          gasPrice: gasPriceValue + ''
        })
      : new this.web3.eth.Contract(abi, address);
  }

  public TransferContract(price?: string, chainId?: string | number) {
    const abi = require('./abi/Transfer.json');
    const address = EthWeb3Service.getTransferAddress(chainId);
    console.log('TransferContract', price, chainId, address);
    if (!address || address === '') {
      console.error('Empty contract address', chainId);
      throw 'Empty contract address';
      return;
    }
    const gasPriceValue = getGasPriceValue(price, chainId);

    return gasPriceValue
      ? new this.web3.eth.Contract(abi, address, {
          gasPrice: gasPriceValue + ''
        })
      : new this.web3.eth.Contract(abi, address);
  }
}
