import TokenIcon from '@/components/token-icon';
import styles from './index.less';
import { MathUtil_plus } from '@/utils';

const MultiTokenIcon = ({ orderInfo, tokens }: any) => {
  function getTotalValue() {
    let total = 0;
    orderInfo?.receivers?.forEach((item: any) => {
      total = MathUtil_plus(total, item?.tokens?.[0]?.tokenAmount);
    });

    return total;
  }

  return (
    <div className={styles.multi_token_wrapper}>
      <TokenIcon {...tokens[0]} showSymbol />
      <div className={styles.token_value}>
        <span>Total</span> {getTotalValue()} <span>{tokens[0]?.symbol}</span>
      </div>
    </div>
  );
};

export default MultiTokenIcon;
