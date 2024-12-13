import { useEffect, useState } from 'react';
import { getChainName } from '@/utils';
import { UNKNOWN_TOKEN_IMG } from '@/constants';

const TokenIcon = (props: {
  chainType?: string;
  symbol?: string;
  address?: string;
  icon?: string;
  showSymbol?: boolean;
  chainId?: number;
  showChainIcon?: boolean;
}) => {
  const { icon, symbol, showSymbol, chainId, showChainIcon } = props;
  const [tokenPicUrl, setTokenPicUrl] = useState<string | undefined>(undefined);

  function onImgError() {
    setTokenPicUrl(UNKNOWN_TOKEN_IMG);
  }

  function onImgLoad(url: string | undefined) {
    if (url) {
      const imgDom = new Image();
      imgDom.src = url;
      imgDom.onload = function () {
        setTokenPicUrl(url);
      };
      imgDom.onerror = () => {
        onImgError();
      };
    } else {
      setTokenPicUrl(UNKNOWN_TOKEN_IMG);
    }
  }

  useEffect(() => {
    if (icon && icon !== '') {
      setTokenPicUrl(icon);
    } else {
      setTokenPicUrl(undefined);
    }
  }, [icon]);

  return (
    <div className="token_empty_icon">
      {tokenPicUrl ? (
        <img src={tokenPicUrl} className="token_icon" onLoad={() => onImgLoad(icon)} onError={onImgError} />
      ) : (
        <>
          <img style={{ opacity: 0.8 }} src={UNKNOWN_TOKEN_IMG} className="token_icon" />
          {showSymbol && (
            <div className="token_empty_symbol">
              <div style={{ color: 'white' }}>{symbol}</div>
            </div>
          )}
        </>
      )}
      {showChainIcon && <img src={`/image/token/chain_${getChainName(chainId)}.png`} className="chain_icon" />}
    </div>
  );
};

export default TokenIcon;
