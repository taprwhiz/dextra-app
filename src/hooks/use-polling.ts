import { useEffect } from 'react';

type UsePollingOptions = {
  url: string | null;
  onUpdate: (newData: any) => void;
  interval?: number;
};

const usePolling = ({ url, onUpdate, interval = 60000 }: UsePollingOptions) => {
  useEffect(() => {
    const poll = async () => {
      // Allow for use of just the callback without a URL for just a timer
      if (!url) {
        return onUpdate(null);
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          return;
        }
        const data = await response.json();

        onUpdate(data); // Pass fetched data to the callback
      } catch (_) {
        // Intentionally ignore the error
      }
    };

    const pollingInterval = setInterval(poll, interval);
    return () => clearInterval(pollingInterval); // Cleanup interval on unmount
  }, [onUpdate, interval]);
};

export default usePolling;
