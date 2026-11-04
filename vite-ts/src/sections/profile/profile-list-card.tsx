import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type ProfileListCardProps = {
  title: string;
  subheader: string;
  addLabel: string;
  emptyText: string;
  count: number;
  onAdd: () => void;
  children: React.ReactNode;
};

/** A card holding a list of entries (jobs, schools...), with an add button. */
export function ProfileListCard({
  title,
  subheader,
  addLabel,
  emptyText,
  count,
  onAdd,
  children,
}: ProfileListCardProps) {
  return (
    <Card>
      <CardHeader
        title={title}
        subheader={subheader}
        action={
          <Button
            size="small"
            color="primary"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={onAdd}
          >
            {addLabel}
          </Button>
        }
      />

      <Stack spacing={2} sx={{ p: 3 }}>
        {count ? (
          children
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
            {emptyText}
          </Typography>
        )}
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

type ProfileListItemProps = {
  label: string;
  onRemove: () => void;
  children: React.ReactNode;
};

/** One entry in a ProfileListCard, with a remove button. */
export function ProfileListItem({ label, onRemove, children }: ProfileListItemProps) {
  return (
    <Box
      sx={(theme) => ({
        p: 2.5,
        borderRadius: 1.5,
        border: `dashed 1px ${theme.vars.palette.divider}`,
      })}
    >
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          {label}
        </Typography>

        <Tooltip title="Remove">
          <IconButton size="small" color="error" onClick={onRemove}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          gap: 2.5,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
