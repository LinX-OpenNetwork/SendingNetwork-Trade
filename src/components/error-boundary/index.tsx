import React from 'react';
import ErrorBlock from '@/components/empty-block/error';

export default class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, errorInfo);
    console.log('ErrorBlock', error, errorInfo);
  }

  render() {
    if ((this.state as any).hasError) {
      // You can render any custom fallback UI
      return (
        <ErrorBlock
          tryAgainAction={() => {
            location.reload();
          }}
        />
      );
    }

    return (this.props as any).children;
  }
}
