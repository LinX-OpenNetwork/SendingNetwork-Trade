import { SpinLoading, Mask } from 'antd-mobile';
import './index.less';

type LoadingMaskProps = {
  visible: boolean;
  loadingContent?: any;
  onMaskClick?: any;
};

const LoadingMask = (props: LoadingMaskProps) => {
  const { visible, onMaskClick, loadingContent } = props;

  return (
    <Mask visible={visible} onMaskClick={onMaskClick ? onMaskClick : () => {}} opacity={0} className="loading_mask">
      {loadingContent ? loadingContent : <SpinLoading />}
    </Mask>
  );
};

export default LoadingMask;
