import { Select } from 'antd';
import { RoomInfo, SelectorItem } from '@/types';
import UserAvatar from '@/components/user-avatar';
import './index.less';
import { getAuthUserInfo } from '@/utils';

type IProps = {
  roomInfo: RoomInfo | undefined;
  selectorValue: string;
  setSelectorValue: (value: string) => void;
  selectorList: SelectorItem[];
  selectorSubValue: string;
  setSelectorSubValue: (value: string) => void;
  onSelectChange: any;
};

const Selector = (props: IProps) => {
  const {
    selectorValue,
    setSelectorValue,
    selectorList,
    selectorSubValue,
    setSelectorSubValue,
    roomInfo,
    onSelectChange
  } = props;

  return (
    <div className={'type_selector'}>
      <Select
        defaultValue=""
        value={selectorValue}
        className="type_selector_input"
        popupClassName="type_dropdown_selector"
        style={{ width: '165px' }}
        getPopupContainer={(triggerNode) => triggerNode.parentNode}
        onChange={(value: string) => {
          setSelectorValue(value);
          onSelectChange({ sltValue: value, sltSubValue: selectorSubValue });
        }}
      >
        <Select.Option value={''} key="all">
          All
        </Select.Option>
        {selectorList.map((item) => {
          return (
            <Select.Option value={item.value} key={item.value}>
              {item.name}
            </Select.Option>
          );
        })}
      </Select>
      {selectorValue === 'room' && (
        <Select
          defaultValue=""
          value={selectorSubValue}
          className="type_selector_input"
          popupClassName="type_dropdown_selector"
          style={{ width: '165px', marginLeft: '20px' }}
          getPopupContainer={(triggerNode) => triggerNode.parentNode}
          onChange={(value) => {
            setSelectorSubValue(value);
            onSelectChange({ sltValue: selectorValue, sltSubValue: value });
          }}
        >
          <Select.Option value={''} key="sub-all">
            All Members
          </Select.Option>
          {roomInfo?.members.map((item: any) => {
            const authUserInfo = getAuthUserInfo();
            if (authUserInfo?.id === item?.userId) {
              return null;
            } else {
              return (
                <Select.Option value={item?.userId} key={item?.userId}>
                  <div className="type_selector_item">
                    <UserAvatar src={item?.icon} size="1.625" borderRadius="50%" name={item?.name} />
                    {item?.name}
                  </div>
                </Select.Option>
              );
            }
          })}
        </Select>
      )}
    </div>
  );
};

export default Selector;
