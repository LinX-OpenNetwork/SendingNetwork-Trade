import BigNumber from 'bignumber.js';
export function MathUtil_numberFixed(value: number | string | undefined, n: number, mathMethod?: string) {
  let res = value;
  if (value) {
    switch (mathMethod) {
      case 'floor':
        res = Math.floor(Number(value) * Math.pow(10, n)) / Math.pow(10, n);
        break;
      case 'ceil':
        res = Math.ceil(Number(value) * Math.pow(10, n)) / Math.pow(10, n);
        break;
      default:
        res = Math.round(Number(value) * Math.pow(10, n)) / Math.pow(10, n);
        break;
    }
  }

  return res;
}

export function MathUtil_fromWei1(balance: string, decimal: number | null) {
  if (!decimal) {
    return balance + '';
  }
  // console.log('fromWei1 decimal=' + decimal);
  return new BigNumber(balance).div(new BigNumber(10).pow(decimal)) + '';
}

export function MathUtil_preFixZero(num: number, length: number) {
  return (Array(length).join('0') + num).slice(-length);
}

// X
export function MathUtil_multipliedBy(value1: number, value2: number) {
  let res = new BigNumber(value1);
  return Number(res.times(value2));
}

export function MathUtil_minus(value: number | string, other: number | string) {
  return new BigNumber(value).minus(new BigNumber(other)).toNumber();
}

export function MathUtil_plus(value: number | string, other: number | string) {
  return new BigNumber(value).plus(new BigNumber(other)).toNumber();
}

export function MathUtil_pow(value: number | string, pow: number | string) {
  return new BigNumber(value).multipliedBy(new BigNumber(10).pow(pow)).toNumber();
}

export function MathUtil_divPow(value1: number, value2: number) {
  if (value1 && value2) {
    const decimalIndex = String(value1).indexOf('.');
    let decimalLength = String(value1)?.length - decimalIndex - 1;
    if (decimalLength > 0) {
      let divValue1 = MathUtil_multipliedBy(value1, MathUtil_multipliedBy(10, decimalLength));
      let divValue2 = MathUtil_multipliedBy(value2, MathUtil_multipliedBy(10, decimalLength));
      return new BigNumber(divValue1).div(divValue2).toNumber();
    } else {
      return new BigNumber(value1).div(new BigNumber(value2)).toNumber();
    }
  }
}
