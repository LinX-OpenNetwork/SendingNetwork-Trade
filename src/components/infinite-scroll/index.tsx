import { InfiniteScroll, DotLoading } from 'antd-mobile';

interface BaseInfiniteScrollProps {
  loadMore: any;
  hasMore: boolean | undefined;
  noDataText?: boolean;
}

const BaseInfiniteScroll = (props: BaseInfiniteScrollProps) => {
  const { loadMore, hasMore, noDataText } = props;
  return (
    <InfiniteScroll loadMore={loadMore} hasMore={hasMore ? hasMore : false} threshold={50}>
      <InfiniteScrollContent hasMore={hasMore} noDataText={noDataText} />
    </InfiniteScroll>
  );
};

const InfiniteScrollContent = ({ hasMore, noDataText }: { hasMore?: boolean; noDataText?: boolean }) => {
  return (
    <>
      {hasMore ? (
        <>
          <span>Loading</span>
          <DotLoading />
        </>
      ) : noDataText ? (
        noDataText
      ) : (
        <span>--- no data ---</span>
      )}
    </>
  );
};

export default BaseInfiniteScroll;
