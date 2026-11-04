import { CONFIG } from 'src/global-config';

import { ResumeView } from 'src/sections/resume/view';

// ----------------------------------------------------------------------

const metadata = { title: `Resume | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <ResumeView />
    </>
  );
}
