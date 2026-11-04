import type { ProfileSchemaType } from './profile-schema';

import { useFieldArray, useFormContext } from 'react-hook-form';

import { Field } from 'src/components/hook-form';

import { newCertification } from './profile-schema';
import { MONTH_PICKER_PROPS } from './profile-constants';
import { ProfileListCard, ProfileListItem } from './profile-list-card';

// ----------------------------------------------------------------------

export function ProfileCertifications() {
  const { control } = useFormContext<ProfileSchemaType>();

  const { fields, append, remove } = useFieldArray({ control, name: 'certifications' });

  return (
    <ProfileListCard
      title="Certifications"
      subheader="Licenses and certificates"
      addLabel="Add certification"
      emptyText="No certifications yet."
      count={fields.length}
      onAdd={() => append(newCertification)}
    >
      {fields.map((field, index) => (
        <ProfileListItem
          key={field.id}
          label={`Certification ${index + 1}`}
          onRemove={() => remove(index)}
        >
          <Field.Text
            name={`certifications.${index}.name`}
            label="Certification"
            sx={{ gridColumn: { md: 'span 2' } }}
          />
          <Field.Text
            name={`certifications.${index}.institution`}
            label="Institution"
            placeholder="e.g. Amazon Web Services"
          />
          <Field.DatePicker
            name={`certifications.${index}.date`}
            label="Date"
            {...MONTH_PICKER_PROPS}
          />
        </ProfileListItem>
      ))}
    </ProfileListCard>
  );
}
