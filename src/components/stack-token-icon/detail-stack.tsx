import { useState } from 'react';
import NftIcon from '@/components/nft-icon';
import { NftInfo, TokenInfo } from '@/types';
import ViewTokenPopup from '@/components/view-token-popup';
import TokenIcon from '../token-icon';
import './index.less';
import { downOutIcon } from '@/utils';

type IProps = {
  list?: (NftInfo | TokenInfo)[];
  showCount?: number;
  showLink?: boolean;
  receivers?: any[];
  createTime?: string;
  showMoreList?: boolean;
};

const StackTokenIcon = (props: IProps) => {
  const { list = [], showCount = 3, showLink, receivers, createTime, showMoreList } = props;

  const [showMore, setShowMore] = useState<boolean>(false);

  return (
    <>
      <div className="stack_token_icon_list detail_stack">
        {list.map((item: NftInfo | TokenInfo, index: number) => {
          let iconClassName = `icon_info`;
          if (index >= showCount) {
            return null;
          } else {
            if (item.hasOwnProperty('id')) {
              item = item as NftInfo;
              return (
                <div className={iconClassName} key={index}>
                  <NftIcon {...item} showLink={showLink} />
                  <div className="token_value">
                    <div className="amount_value">{`#${item.id}` ?? ''}</div>
                  </div>
                </div>
              );
            } else {
              item = item as TokenInfo;
              return (
                <div className={iconClassName} key={index}>
                  <TokenIcon {...item} showSymbol />
                  <div className="token_value">
                    <div className="amount_value">{item.balanceValue ?? ''}</div>{' '}
                    <div className="name_value">{item?.symbol}</div>
                  </div>
                </div>
              );
            }
          }
        })}
      </div>
      {list?.length > showCount && showMoreList && (
        <div
          className={`detail_stack_more_icon ${showMore ? 'upOutArrow' : 'downOutArrow'}`}
          onClick={() => {
            setShowMore(true);
          }}
        >
          More
          {downOutIcon}
        </div>
      )}
      {showMore && (
        <ViewTokenPopup
          visible={showMore}
          setVisible={setShowMore}
          list={list}
          receivers={receivers || []}
          type={receivers && receivers?.length > 1 ? 2 : 1}
          createTime={createTime}
        />
      )}
    </>
  );
};

export default StackTokenIcon;
