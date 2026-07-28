const REVIEW_STATE_KEY = 'review_prompt_state';

interface ReviewPromptState {
  pages: string[];
  shown: boolean;
  dismissed: boolean;
  reviewed: boolean;
  reportExported: boolean;
}

const DEFAULT_STATE: ReviewPromptState = {
  pages: [],
  shown: false,
  dismissed: false,
  reviewed: false,
  reportExported: false,
};

const normalizePage = (pageUrl: string) => {
  try {
    const url = new URL(pageUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return `${url.origin}${url.pathname}`;
  } catch {
    return '';
  }
};

const getState = async (): Promise<ReviewPromptState> => {
  const stored = await chrome.storage.local.get(REVIEW_STATE_KEY);
  return { ...DEFAULT_STATE, ...(stored[REVIEW_STATE_KEY] || {}) };
};

const setState = (state: ReviewPromptState) =>
  chrome.storage.local.set({ [REVIEW_STATE_KEY]: state });

const reservePrompt = async (state: ReviewPromptState) => {
  const eligible = state.reportExported || state.pages.length >= 3;
  if (!eligible || state.shown || state.dismissed || state.reviewed) return false;
  await setState({ ...state, shown: true });
  return true;
};

export async function recordSuccessfulInspection(pageUrl: string) {
  const page = normalizePage(pageUrl);
  if (!page) return false;
  const state = await getState();
  const pages = [...new Set([...state.pages, page])].slice(-20);
  const nextState = { ...state, pages };
  await setState(nextState);
  return reservePrompt(nextState);
}

export async function recordReportExport() {
  const state = await getState();
  const nextState = { ...state, reportExported: true };
  await setState(nextState);
  return reservePrompt(nextState);
}

export async function dismissReviewPrompt() {
  const state = await getState();
  await setState({ ...state, dismissed: true, shown: true });
}

export async function completeReviewPrompt() {
  const state = await getState();
  await setState({ ...state, reviewed: true, shown: true });
}
