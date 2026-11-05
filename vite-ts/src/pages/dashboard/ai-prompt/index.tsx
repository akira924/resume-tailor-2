import { CONFIG } from 'src/global-config';

import { AiPromptView } from 'src/sections/ai-prompt/view';

// ----------------------------------------------------------------------

const metadata = { title: `AI Prompt | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AiPromptView />
    </>
  );
}
