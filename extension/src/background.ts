import type { GetAiPromptMessage, GetAiPromptResponse } from './expander/types';

import { getProfile } from './auth/api';
import { getToken } from './auth/token-storage';
import { buildAiPrompt } from '../../vite-ts/src/sections/ai-prompt/ai-prompt-utils';

// ----------------------------------------------------------------------

// Clicking the toolbar icon opens the side panel.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Failed to set side panel behavior:', error));

// The content script runs on every website, so it is kept away from the sign-in token, which is in
// this storage area. It only ever gets the finished prompt from here.
chrome.storage.local
  .setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' })
  .catch((error) => console.error('Failed to restrict storage access:', error));

// ----------------------------------------------------------------------

// Fetched every time, so a profile saved on the website applies straight away.
async function getAiPrompt(): Promise<GetAiPromptResponse> {
  const token = await getToken();

  if (!token) return { prompt: null };

  try {
    const { profile } = await getProfile(token);

    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({ title: 'Open Resume Tailor' });

    return { prompt: buildAiPrompt(profile) };
  } catch (error) {
    console.error('Failed to build the AI prompt:', error);

    // The page itself shows nothing, so this is the only sign of why the shortcut didn't work.
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setTitle({ title: `Couldn't insert the AI prompt: ${(error as Error).message}` });

    return { prompt: null };
  }
}

chrome.runtime.onMessage.addListener((message: GetAiPromptMessage, _sender, sendResponse) => {
  if (message.type !== 'get-ai-prompt') return false;

  getAiPrompt().then(sendResponse);

  // Keeps the channel open for the response above.
  return true;
});
