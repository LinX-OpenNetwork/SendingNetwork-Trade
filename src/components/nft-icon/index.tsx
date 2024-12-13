import { useState } from 'react';
import { STATIC_CDN, UNKNOWN_NFT_IMG } from '@/constants';
import { getChainName, getNftLink } from '@/utils';

const loadingImg = STATIC_CDN + '/image/nfts/loading.png';

// link: https://nftgo.io/asset/ETH/0xb024aae925554ae3d323aed12ff71a889935cbbf/3984
// link: https://opensea.io/assets/matic/0x9d305a42a3975ee4c1c57555bed5919889dce63f/164042
// link: https://opensea.io/assets/ethereum
type NftIconProps = {
  icon?: string;
  id?: string;
  symbol?: string;
  contractAddress?: string;
  className?: string;
  link?: string;
  chainId?: number;
  showLink?: boolean;
  showChainIcon?: boolean;
};

const NftIcon = (props: NftIconProps) => {
  const { icon, link, showLink, className, chainId, contractAddress, id, symbol, showChainIcon } = props;
  const [error, setError] = useState<false>(false);
  const [neededSrc, setNeededSrc] = useState(loadingImg || icon);

  function onImgError() {
    setNeededSrc(UNKNOWN_NFT_IMG);
  }

  function onImgLoad(url: string | undefined) {
    if (url) {
      setError(false);
      const imgDom = new Image();
      imgDom.src = url;
      imgDom.onload = function () {
        setNeededSrc(url);
      };
      imgDom.onerror = () => {
        onImgError();
      };
    } else {
      if (id && !icon) {
        setNeededSrc(UNKNOWN_NFT_IMG);
      } else {
        setNeededSrc(UNKNOWN_NFT_IMG);
      }
    }
  }

  const ImgNode = (
    <div className="token_empty_icon">
      <img
        src={neededSrc}
        className={className || 'nft_default_icon'}
        onLoad={() => onImgLoad(icon)}
        onError={onImgError}
      />
      <div className="token_empty_symbol">
        <div>{!icon && symbol}</div>
      </div>
      {showChainIcon && <img src={`/image/token/chain_${getChainName(chainId)}.png`} className="chain_icon" />}
    </div>
  );

  const nftLink = getNftLink(contractAddress, id, chainId, link);

  return showLink ? (
    <a href={nftLink} target="_blank">
      {ImgNode}
    </a>
  ) : (
    ImgNode
  );
};

export default NftIcon;
