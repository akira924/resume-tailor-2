import type { IProfile } from 'src/types/profile';

import { useMemo, useCallback } from 'react';
import { useCopyToClipboard } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetProfile } from 'src/actions/profile';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { buildAiPrompt } from '../ai-prompt-utils';

// ----------------------------------------------------------------------

export function AiPromptView() {
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

    return <AiPromptContent profile={profile} />;
  };

  return (
    <DashboardContent maxWidth="lg">
      <CustomBreadcrumbs
        heading="AI Prompt"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'AI Prompt' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {renderContent()}
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function AiPromptContent({ profile }: { profile: IProfile }) {
  const { copy } = useCopyToClipboard();

  const prompt = useMemo(() => buildAiPrompt(profile), [profile]);

  const handleCopy = useCallback(async () => {
    const copied = await copy(prompt);

    if (copied) {
      toast.success('Prompt copied!');
    } else {
      toast.error('Could not copy the prompt.');
    }
  }, [copy, prompt]);

  return (
    <Stack spacing={3}>
      {!profile.updatedAt && (
        <Alert
          severity="warning"
          action={
            <Button
              size="small"
              color="inherit"
              component={RouterLink}
              href={paths.dashboard.profile}
            >
              Go to profile
            </Button>
          }
        >
          Your profile hasn&apos;t been saved yet, so the candidate details below are incomplete.
        </Alert>
      )}

      <Card>
        <CardHeader
          title="Prompt"
          subheader="Built from your profile. Copy it, then add the job description at the end."
          action={
            <Button
              size="small"
              variant="contained"
              onClick={handleCopy}
              startIcon={<Iconify icon="solar:copy-bold" />}
            >
              Copy
            </Button>
          }
          sx={{ mb: 3 }}
        />

        <Box
          component="pre"
          tabIndex={0}
          aria-label="Generated AI prompt"
          sx={(theme) => ({
            m: 0,
            p: 3,
            maxHeight: 640,
            overflow: 'auto',
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            borderTop: `dashed 1px ${theme.vars.palette.divider}`,
          })}
        >
          {prompt}
        </Box>
      </Card>
    </Stack>
  );
}
