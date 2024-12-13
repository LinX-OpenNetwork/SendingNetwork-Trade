import { useState } from 'react';
import NftIcon from '@/components/nft-icon';
import { NftInfo, TokenInfo } from '@/types';
import ViewTokenPopup from '@/components/view-token-popup';
import TokenIcon from '../token-icon';
import './index.less';

type IProps = {
  list?: (NftInfo | TokenInfo)[];
  iconSize?: string;
  showCount?: number;
  showTitle?: boolean;
  showLink?: boolean;
  type?: number;
  receivers?: any[];
  createTime?: string;
};

const StackTokenIcon = (props: IProps) => {
  const { list = [], iconSize = 'default', showCount = 3, showTitle, showLink, type, receivers, createTime } = props;

  const [showMore, setShowMore] = useState<boolean>(false);

  return (
    <>
      <div className="stack_token_icon_list">
        {list.map((item: NftInfo | TokenInfo, index: number) => {
          let iconClassName = `icon_info ${iconSize}`;
          if (index >= showCount) {
            return null;
          } else if (index === showCount - 1) {
            return (
              <div className={iconClassName} key={index}>
                <div
                  className="more_icon"
                  onClick={() => {
                    setShowMore(true);
                  }}
                >
                  <div className="value">+{list?.length}</div>
                </div>
                <div className="name_title_id">
                  <div className="name_title"></div>
                </div>
              </div>
            );
          } else {
            if ((item as NftInfo).id) {
              item = item as NftInfo;
              return (
                <div className={iconClassName} key={index}>
                  <NftIcon {...item} showLink={showLink} />
                  <div className="name_title_id">
                    {showTitle && <div className="name_title">{showTitle ? `#${item.id}` : ''}</div>}
                  </div>
                </div>
              );
            } else {
              item = item as TokenInfo;
              return (
                <div className={iconClassName} key={index}>
                  <TokenIcon {...item} showSymbol />
                  <div className="name_title_id">
                    {showTitle && <div className="name_title">{showTitle ? item.balanceValue : ''}</div>}
                  </div>
                </div>
              );
            }
          }
        })}
      </div>
      {showMore && (
        <ViewTokenPopup
          visible={showMore}
          setVisible={setShowMore}
          list={list}
          receivers={receivers || []}
          type={type || 1}
          createTime={createTime}
        />
      )}
    </>
  );
};

export default StackTokenIcon;
