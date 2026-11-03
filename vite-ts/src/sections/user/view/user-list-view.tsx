import type { TableHeadCellProps } from 'src/components/table';
import type { IUserStatus, IUserListItem, IUserTableFilters } from 'src/types/user';

import { useMemo, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useSetState } from 'minimal-shared/hooks';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';

import { useGetUsers } from 'src/actions/user';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableSkeleton,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { UserTableRow } from '../user-table-row';
import { UserTableToolbar } from '../user-table-toolbar';
import { UserTableFiltersResult } from '../user-table-filters-result';

// ----------------------------------------------------------------------

type UserRow = IUserListItem & { status: IUserStatus };

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'deactivated', label: 'Deactivated' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_BY_IS_ACTIVE: Record<IUserListItem['isActive'], IUserStatus> = {
  [-1]: 'rejected',
  0: 'pending',
  1: 'active',
  2: 'deactivated',
};

const ROLE_OPTIONS = ['admin', 'user'];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'displayName', label: 'Name' },
  { id: 'role', label: 'Role', width: 160 },
  { id: 'status', label: 'Status', width: 120 },
  { id: 'createdAt', label: 'Joined', width: 160 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function UserListView() {
  const table = useTable({
    defaultOrderBy: 'createdAt',
    defaultOrder: 'desc',
    defaultRowsPerPage: 10,
  });

  const { users, usersLoading, usersError } = useGetUsers();

  const tableData = useMemo<UserRow[]>(
    // Same rule as sign-in and the nav badge: admins never wait for approval.
    () =>
      users.map((user) => ({
        ...user,
        status: user.role === 'admin' ? 'active' : STATUS_BY_IS_ACTIVE[user.isActive],
      })),
    [users]
  );

  const filters = useSetState<IUserTableFilters>({ name: '', role: [], status: 'all' });
  const { state: currentFilters, setState: updateFilters } = filters;

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const canReset =
    !!currentFilters.name || currentFilters.role.length > 0 || currentFilters.status !== 'all';

  const notFound = !usersLoading && !dataFiltered.length;

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Users"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'User' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {usersError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {usersError.message}
        </Alert>
      )}

      <Card>
        <Tabs
          value={currentFilters.status}
          onChange={handleFilterStatus}
          sx={[
            (theme) => ({
              px: { md: 2.5 },
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
        >
          {STATUS_OPTIONS.map((tab) => (
            <Tab
              key={tab.value}
              iconPosition="end"
              value={tab.value}
              label={tab.label}
              icon={
                <Label
                  variant={
                    ((tab.value === 'all' || tab.value === currentFilters.status) && 'filled') ||
                    'soft'
                  }
                  color={
                    (tab.value === 'active' && 'success') ||
                    (tab.value === 'pending' && 'warning') ||
                    (tab.value === 'rejected' && 'error') ||
                    'default'
                  }
                >
                  {tab.value === 'all'
                    ? tableData.length
                    : tableData.filter((user) => user.status === tab.value).length}
                </Label>
              }
            />
          ))}
        </Tabs>

        <UserTableToolbar
          filters={filters}
          onResetPage={table.onResetPage}
          options={{ roles: ROLE_OPTIONS }}
        />

        {canReset && (
          <UserTableFiltersResult
            filters={filters}
            totalResults={dataFiltered.length}
            onResetPage={table.onResetPage}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Scrollbar>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headCells={TABLE_HEAD}
              onSort={table.onSort}
            />

            <TableBody>
              {usersLoading ? (
                <TableSkeleton rowCount={table.rowsPerPage} cellCount={TABLE_HEAD.length} />
              ) : (
                dataFiltered
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => <UserTableRow key={row.id} row={row} />)
              )}

              {!usersLoading && (
                <TableEmptyRows
                  height={table.dense ? 56 : 56 + 20}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />
              )}

              <TableNoData notFound={notFound} />
            </TableBody>
          </Table>
        </Scrollbar>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={dataFiltered.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: UserRow[];
  filters: IUserTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name, status, role } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    const keyword = name.toLowerCase();
    inputData = inputData.filter(
      (user) =>
        user.displayName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((user) => user.status === status);
  }

  if (role.length) {
    inputData = inputData.filter((user) => role.includes(user.role));
  }

  return inputData;
}
