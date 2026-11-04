import { paths } from 'src/routes/paths';

import { useGetProfile } from 'src/actions/profile';
import { DashboardContent } from 'src/layouts/dashboard';

import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProfileForm } from '../profile-form';

// ----------------------------------------------------------------------

export function ProfileView() {
  const { profile, profileLoading, profileError } = useGetProfile();

  const renderContent = () => {
    if (profileLoading) {
      return <LoadingScreen />;
    }

    if (profileError || !profile) {
      return (
        <EmptyContent
          filled
          title="Couldn't load your profile"
          description={profileError?.message}
          sx={{ py: 10 }}
        />
      );
    }

    return <ProfileForm profile={profile} />;
  };

  return (
    <DashboardContent maxWidth="lg">
      <CustomBreadcrumbs
        heading="Profile"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Profile' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {renderContent()}
    </DashboardContent>
  );
}
