import type { TriggerStorageKey, GetAiPromptMessage, GetAiPromptResponse } from './types';

// Runs on every web page. Replaces the trigger with the AI prompt as soon as it has been typed.
// Chrome loads this as a classic script, so it must not import any code, only types.

// ----------------------------------------------------------------------

const STORAGE_KEY: TriggerStorageKey = 'promptTrigger';

let trigger = __DEFAULT_PROMPT_TRIGGER__;

chrome.storage.sync.get(STORAGE_KEY).then((stored) => {
  trigger = (stored[STORAGE_KEY] as string | undefined) ?? trigger;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes[STORAGE_KEY]) {
    trigger = (changes[STORAGE_KEY].newValue as string | undefined) ?? __DEFAULT_PROMPT_TRIGGER__;
  }
});

// ----------------------------------------------------------------------

type TextField = HTMLInputElement | HTMLTextAreaElement;

// Only these input types have a caret to work with, which also leaves out passwords.
const INPUT_TYPES = ['text', 'search', 'url', 'tel'];

type Field =
  | { kind: 'text'; element: TextField }
  | { kind: 'rich'; element: HTMLElement; selection: Selection };

function getField(target: EventTarget | undefined): Field | null {
  if (target instanceof HTMLTextAreaElement && !target.readOnly) {
    return { kind: 'text', element: target };
  }

  if (target instanceof HTMLInputElement && !target.readOnly && INPUT_TYPES.includes(target.type)) {
    return { kind: 'text', element: target };
  }

  if (target instanceof HTMLElement && target.isContentEditable) {
    // Inside a shadow root, only Chrome's non-standard getSelection on the root sees the caret.
    const root = target.getRootNode() as Document & { getSelection?: () => Selection | null };
    const selection = root.getSelection?.() ?? document.getSelection();

    return selection && { kind: 'rich', element: target, selection };
  }

  return null;
}

/** The text before the caret, if that is where the user is typing. */
function getTextBeforeCaret(field: Field) {
  if (field.kind === 'text') {
    const { element } = field;
    const caret = element.selectionStart;

    return element.matches(':focus') && caret !== null && caret === element.selectionEnd
      ? element.value.slice(0, caret)
      : null;
  }

  const { anchorNode, anchorOffset, isCollapsed } = field.selection;

  return isCollapsed && anchorNode instanceof Text && field.element.contains(anchorNode)
    ? anchorNode.data.slice(0, anchorOffset)
    : null;
}

/** On its own only: "zx" shouldn't fire at the end of a longer word such as "xyzx". */
function endsWithTrigger(text: string | null) {
  if (!text?.endsWith(trigger)) return false;

  return !/[\p{L}\p{N}]$/u.test(text.slice(0, -trigger.length));
}

/** Rich editors catch up with selection and text changes asynchronously, a moment after they happen. */
const letEditorCatchUp = () => new Promise((resolve) => setTimeout(resolve, 30));

async function replaceTrigger(field: Field, prompt: string) {
  if (field.kind === 'text') {
    const caret = field.element.selectionStart ?? 0;

    field.element.setSelectionRange(caret - trigger.length, caret);
    // Rather than setting `value`: this is what keeps frameworks in sync and undo working.
    document.execCommand('insertText', false, prompt);
    return;
  }

  const { selection } = field;
  const node = selection.anchorNode!;
  const offset = selection.anchorOffset;

  selection.setBaseAndExtent(node, offset - trigger.length, node, offset);
  await letEditorCatchUp();

  document.execCommand('delete');
  await letEditorCatchUp();

  // Rich editors build their paragraphs from a paste, and would mangle inserted line breaks.
  const clipboardData = new DataTransfer();
  clipboardData.setData('text/plain', prompt);

  const handled = !field.element.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true, composed: true })
  );

  if (!handled) document.execCommand('insertText', false, prompt);
}

async function requestPrompt() {
  const message: GetAiPromptMessage = { type: 'get-ai-prompt' };

  try {
    const { prompt }: GetAiPromptResponse = await chrome.runtime.sendMessage(message);

    return prompt;
  } catch {
    // The extension was reloaded or removed after this page loaded.
    return null;
  }
}

document.addEventListener(
  'input',
  async (event) => {
    const { isTrusted, inputType, isComposing } = event as InputEvent;

    // Typing by the user only: a page's own script can't get the prompt out of a field this way.
    if (!isTrusted || inputType !== 'insertText' || isComposing) return;

    const field = getField(event.composedPath()[0]);

    if (!field || !endsWithTrigger(getTextBeforeCaret(field))) return;

    const prompt = await requestPrompt();

    // Leaves the text alone if the user has carried on typing or moved away in the meantime.
    if (prompt && endsWithTrigger(getTextBeforeCaret(field))) {
      replaceTrigger(field, prompt);
    }
  },
  true
);
