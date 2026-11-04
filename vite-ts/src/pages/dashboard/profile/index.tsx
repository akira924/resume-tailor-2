import { CONFIG } from 'src/global-config';

import { ProfileView } from 'src/sections/profile/view';

// ----------------------------------------------------------------------

const metadata = { title: `Profile | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <ProfileView />
    </>
  );
}
