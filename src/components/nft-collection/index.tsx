import { NftSelector, NftCollection } from '@/types';
import './index.less';
import NftIcon from '../nft-icon';
import UserAvatar from '../user-avatar';
import { findIndex, flatMap } from 'lodash';
import { history } from 'umi';
import { getChainName, DownOutlinedIcon, UpOutlinedIcon } from '@/utils';

type NftCollectionListProps = {
  nftType: number;
  list: NftCollection[];
  onExpandList: any;
  onChangeChild: any;
  showCheckbox?: boolean;
  hideChainIcon?: boolean;
  nftShowType?: string | null;
};
const NftCollectionList = (props: NftCollectionListProps) => {
  const { list, onExpandList, onChangeChild, nftShowType } = props;

  return (
    <div className="nft_collection_content">
      {!nftShowType || nftShowType === '1' ? (
        list.map((item: NftCollection) => {
          let index = findIndex(list, { id: item?.id });
          return (
            <div className="selector_parent_item" key={item?.id + item?.title + index}>
              <div className="parent_item" onClick={() => onExpandList(index)}>
                <div className="parent_item_title">
                  <div className="item_img">
                    <UserAvatar name={item.title} src={item?.icon} size="1.5" borderRadius={'50%'} />
                    <img
                      src={`/image/token/chain_${getChainName(item?.children?.[0]?.chainId)}.png`}
                      className="chain_icon"
                      width={14}
                      height={14}
                    />
                  </div>
                  <div className="item_info">
                    <div className="title">
                      {item.title}({item?.children?.length})
                    </div>
                  </div>
                </div>
                <div className="parent_item_right">
                  <div className="parent_item_type">{nftShowType === '1' ? 'ERC 721' : 'ERC 1155'}</div>
                  <div className="parent_item_expand">{item.isExpanded ? UpOutlinedIcon : DownOutlinedIcon}</div>
                </div>
              </div>
              <div className={`child_list ${item.isExpanded ? 'show' : 'hidden'}`}>
                {(item?.children || []).map((child: NftSelector, childIndex: number) => {
                  return (
                    <div className="nft_list_item" key={child.id + index}>
                      <div
                        className="list_item_info"
                        onClick={() => {
                          if (!history.location.query?.returnId) {
                            onChangeChild(index, childIndex, child);
                          }
                        }}
                      >
                        <NftIcon icon={child?.icon} className="list_item_img" chainId={child?.chainId} showChainIcon />
                        <div className="list_item_detail">
                          <div className="info_name_tag">{child.collection}</div>
                          <div className="info_name">#{child.id}</div>
                          <div className="info_contract_value">{child.contractAddress}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div className="nft_list">
          {flatMap(list, (o) => o.children).map((child: NftSelector | undefined, childI: number) => {
            if (child) {
              return (
                <div
                  className="nft_item"
                  key={child?.id + child?.address + childI}
                  onClick={() => {
                    if (!history.location.query?.returnId) {
                      let index = findIndex(
                        list,
                        (i) => i.contractAddress?.toLocaleLowerCase() === child.contractAddress?.toLocaleLowerCase()
                      );
                      let childIndex = findIndex(list[index].children, (j) => j.id === child.id);
                      onChangeChild(index, childIndex, child);
                    }
                  }}
                >
                  <NftIcon icon={child?.icon} chainId={child?.chainId} showChainIcon />
                  <div className="item_id">#{child.id}</div>
                </div>
              );
            } else {
              return null;
            }
          })}
        </div>
      )}
    </div>
  );
};

export default NftCollectionList;
