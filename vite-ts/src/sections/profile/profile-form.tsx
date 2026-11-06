import type { IProfile } from 'src/types/profile';
import type { ProfileSchemaType } from './profile-schema';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import InputAdornment from '@mui/material/InputAdornment';

import { updateProfile } from 'src/actions/profile';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { UnsavedChangesDialog } from 'src/components/unsaved-changes-dialog';

import { ProfileEducation } from './profile-education';
import { ProfileExperience } from './profile-experience';
import { ProfileCertifications } from './profile-certifications';
import { toFormValues, ProfileSchema, defaultValues } from './profile-schema';

// ----------------------------------------------------------------------

const LINKS = [
  {
    name: 'links.linkedin',
    label: 'LinkedIn',
    icon: 'socials:linkedin',
    placeholder: 'linkedin.com/in/you',
  },
  { name: 'links.github', label: 'GitHub', icon: 'socials:github', placeholder: 'github.com/you' },
  {
    name: 'links.website',
    label: 'Website',
    icon: 'eva:external-link-fill',
    placeholder: 'yourname.com',
  },
] as const;

const gridSx = {
  p: 3,
  gap: 3,
  display: 'grid',
  gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
} as const;

// ----------------------------------------------------------------------

type Props = {
  profile: IProfile;
};

export function ProfileForm({ profile }: Props) {
  const methods = useForm({
    mode: 'onTouched',
    resolver: zodResolver(ProfileSchema),
    defaultValues,
    values: toFormValues(profile),
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = methods;

  const onSubmit = handleSubmit(async (data: ProfileSchemaType) => {
    try {
      await updateProfile(data);
      toast.success('Profile saved!');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong!');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        <Card>
          <CardHeader title="Personal information" subheader="Shown at the top of your resume" />

          <Box sx={gridSx}>
            <Field.Text name="personal.fullName" label="Full name" />
            <Field.Text
              name="personal.email"
              label="Email address"
              helperText="Your account email. It can't be changed here."
              slotProps={{ input: { readOnly: true } }}
            />
            <Field.Phone name="personal.phoneNumber" label="Phone number" defaultCountry="US" />
            <Field.Text
              name="personal.location"
              label="Location"
              placeholder="e.g. San Francisco, CA"
            />
          </Box>
        </Card>

        <Card>
          <CardHeader title="Online presence" subheader="Optional links for recruiters" />

          <Box sx={gridSx}>
            {LINKS.map((link) => (
              <Field.Text
                key={link.name}
                name={link.name}
                label={link.label}
                placeholder={link.placeholder}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify width={24} icon={link.icon} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            ))}
          </Box>
        </Card>

        <ProfileExperience />

        <ProfileEducation />

        <ProfileCertifications />

        <Box sx={{ gap: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="inherit"
            disabled={!isDirty || isSubmitting}
            onClick={() => reset()}
          >
            Discard changes
          </Button>

          <Button type="submit" variant="contained" loading={isSubmitting}>
            Save profile
          </Button>
        </Box>
      </Stack>

      <UnsavedChangesDialog when={isDirty && !isSubmitting} />
    </Form>
  );
}
