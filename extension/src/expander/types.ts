// Types only: the content script must stay a single file, so it can't share code with the rest of
// the extension. These keep the values it repeats in step.

/** Key in chrome.storage.sync of what the user types to insert the prompt. */
export type TriggerStorageKey = 'promptTrigger';

export type GetAiPromptMessage = { type: 'get-ai-prompt' };

/** `prompt` is null if signed out, or if the prompt couldn't be built. */
export type GetAiPromptResponse = { prompt: string | null };
