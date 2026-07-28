import { useCallback, useEffect, useRef, useState } from 'react';
import { STORE_REVIEW_URL } from '@/config/project';
import {
  completeReviewPrompt,
  dismissReviewPrompt,
  recordReportExport,
  recordSuccessfulInspection,
} from '@/lib/review-prompt';

export function useReviewPrompt(pageUrl: string, hasSuccessfulInspection: boolean) {
  const [visible, setVisible] = useState(false);
  const recordedPages = useRef(new Set<string>());

  useEffect(() => {
    if (!hasSuccessfulInspection || !pageUrl || recordedPages.current.has(pageUrl)) return;
    recordedPages.current.add(pageUrl);
    recordSuccessfulInspection(pageUrl)
      .then((show) => {
        if (show) setVisible(true);
      })
      .catch(() => {});
  }, [hasSuccessfulInspection, pageUrl]);

  const reportExported = useCallback(async () => {
    const show = await recordReportExport();
    if (show) setVisible(true);
  }, []);

  const dismiss = useCallback(async () => {
    setVisible(false);
    await dismissReviewPrompt();
  }, []);

  const review = useCallback(async () => {
    setVisible(false);
    await completeReviewPrompt();
    await chrome.tabs.create({ url: STORE_REVIEW_URL });
  }, []);

  return {
    state: { visible },
    actions: { reportExported, dismiss, review },
  };
}
