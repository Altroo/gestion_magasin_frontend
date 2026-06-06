'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	Cancel as CancelIcon,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	FileUpload as FileUploadIcon,
	PendingActions as PendingActionsIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { GridColDef, GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { magasinStatusLabel } from '@/components/pages/magasin/shared/status-labels';
import StoreTabs, { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import TooltipTextCell from '@/components/shared/dataGridCells/tooltipTextCell';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteAttendanceRecordMutation, useGetAttendanceRecordsQuery, useGetEmployeesQuery, useImportAttendanceMutation } from '@/store/services/magasin';
import { ATTENDANCE_ADD, ATTENDANCE_EDIT, ATTENDANCE_VIEW } from '@/utils/routes';
import { extractApiErrorMessage, formatNumber } from '@/utils/helpers';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import type { SessionProps } from '@/types/_initTypes';
import type { AttendanceRecordType } from '@/types/gestionMagasinTypes';

const roleCanManage = (role?: string) => role === 'direction' || role === 'responsable';

const AttendanceClient = ({ session }: SessionProps) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const { defaultStore, memberships } = useSelectedStore(token);
	const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>();
	const storeId = selectedStoreId ?? defaultStore?.id;
	const selectedMembership = memberships.find((membership) => membership.store.id === storeId);
	const canManageStore = roleCanManage(selectedMembership?.role.code);
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

	const storeFilterActive = Boolean(chipFilterParams.store_ids);
	const { data, isLoading, refetch } = useGetAttendanceRecordsQuery(
		{
			store: storeFilterActive ? undefined : storeId,
			search: searchTerm,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			...customFilterParams,
			...chipFilterParams,
		},
		{ skip: !token || (!storeId && !storeFilterActive) },
	);
	const { data: employees } = useGetEmployeesQuery({ pageSize: 200 }, { skip: !token });
	const [importAttendance, importState] = useImportAttendanceMutation();
	const [deleteAttendanceRecord] = useDeleteAttendanceRecordMutation();

	const statusOptions = [
		{ value: 'present', label: t.magasin.present },
		{ value: 'off', label: t.magasin.off },
		{ value: 'absent', label: t.magasin.absent },
	];
	const shiftOptions = [
		{ value: 'morning', label: t.magasin.morningShift },
		{ value: 'evening', label: t.magasin.eveningShift },
		{ value: 'off', label: t.magasin.off },
	];
	const chipFilters = useMemo(
		() => [
			{
				key: 'store',
				label: t.magasin.store,
				paramName: 'store_ids',
				options: memberships.map((membership) => ({ id: String(membership.store.id), nom: membership.store.name })),
			},
			{
				key: 'employee',
				label: t.magasin.employee,
				paramName: 'employee_ids',
				options: (employees?.results ?? []).map((employee) => ({ id: String(employee.id), nom: employee.full_name })),
			},
			{
				key: 'status',
				label: t.magasin.status,
				paramName: 'status',
				options: [
					{ id: 'present', nom: t.magasin.present },
					{ id: 'off', nom: t.magasin.off },
					{ id: 'absent', nom: t.magasin.absent },
				],
			},
		],
		[employees?.results, memberships, t.magasin.absent, t.magasin.employee, t.magasin.off, t.magasin.present, t.magasin.status, t.magasin.store],
	);
	const handleChipFilterChange = (params: Record<string, string>) => {
		setChipFilterParams(params);
		setPaginationModel((current) => ({ ...current, page: 0 }));
	};

	const renderStatusChip = (status?: string | null) => {
		const label = magasinStatusLabel(t, status);
		if (status === 'present') {
			return <DarkTooltip title={label}><Chip size="small" color="success" variant="outlined" icon={<CheckCircleIcon fontSize="small" />} label={label} sx={{ fontWeight: 600 }} /></DarkTooltip>;
		}
		if (status === 'absent') {
			return <DarkTooltip title={label}><Chip size="small" color="error" variant="outlined" icon={<CancelIcon fontSize="small" />} label={label} sx={{ fontWeight: 600 }} /></DarkTooltip>;
		}
		if (status === 'off') {
			return <DarkTooltip title={label}><Chip size="small" color="warning" variant="outlined" icon={<PendingActionsIcon fontSize="small" />} label={label} sx={{ fontWeight: 600 }} /></DarkTooltip>;
		}
		return <DarkTooltip title={label}><Chip size="small" color="default" variant="outlined" label={label} sx={{ fontWeight: 600 }} /></DarkTooltip>;
	};

	const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file || !storeId) return;
		try {
			await importAttendance({ store: storeId, file }).unwrap();
			onSuccess(t.magasin.importPointage);
			refetch();
		} catch {
			onError(t.errors.genericError);
		}
	};

	const deleteHandler = async () => {
		if (!deleteTarget) return;
		try {
			await deleteAttendanceRecord({ id: deleteTarget }).unwrap();
			onSuccess(t.magasin.attendanceDeleted);
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.attendanceDeleteError));
		} finally {
			setDeleteTarget(null);
		}
	};

	const columns: GridColDef[] = [
		{ field: 'date', headerName: t.magasin.date, flex: 0.9, minWidth: 130, filterOperators: createDateRangeFilterOperator(), renderCell: (params: GridRenderCellParams<AttendanceRecordType>) => <TooltipTextCell>{params.value ?? '-'}</TooltipTextCell> },
		{
			field: 'employee_name',
			headerName: t.magasin.employee,
			flex: 1.4,
			minWidth: 180,
			renderCell: (params: GridRenderCellParams<AttendanceRecordType>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" fontWeight={600} noWrap>{params.value}</Typography>
				</DarkTooltip>
			),
		},
		{ field: 'store_name', headerName: t.magasin.store, flex: 1, minWidth: 140, renderCell: (params: GridRenderCellParams<AttendanceRecordType>) => <TooltipTextCell>{params.value ?? '-'}</TooltipTextCell> },
		{ field: 'clock_in', headerName: t.magasin.clockIn, flex: 0.8, minWidth: 110, renderCell: (params: GridRenderCellParams<AttendanceRecordType>) => <TooltipTextCell>{params.value ?? '-'}</TooltipTextCell> },
		{ field: 'clock_out', headerName: t.magasin.clockOut, flex: 0.8, minWidth: 110, renderCell: (params: GridRenderCellParams<AttendanceRecordType>) => <TooltipTextCell>{params.value ?? '-'}</TooltipTextCell> },
		{
			field: 'shift',
			headerName: t.magasin.shift,
			flex: 0.8,
			minWidth: 120,
			filterOperators: createDropdownFilterOperators(shiftOptions, t.common.all),
			renderCell: (params: GridRenderCellParams<AttendanceRecordType>) => <TooltipTextCell>{magasinStatusLabel(t, params.value as string)}</TooltipTextCell>,
		},
		{
			field: 'hours_worked',
			headerName: t.magasin.hours,
			flex: 0.8,
			minWidth: 110,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<AttendanceRecordType>) => <TooltipTextCell>{formatNumber(params.value as string)}</TooltipTextCell>,
		},
		{
			field: 'status',
			headerName: t.magasin.status,
			flex: 0.8,
			minWidth: 120,
			filterOperators: createDropdownFilterOperators(statusOptions, t.common.all),
			renderCell: (params: GridRenderCellParams<AttendanceRecordType>) => renderStatusChip(params.value as string),
		},
		{
			field: 'actions',
			headerName: t.common.actions,
			flex: 0.8,
			minWidth: 130,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<AttendanceRecordType>) => (
				<MobileActionsMenu
					actions={[
						{ label: t.common.view, icon: <VisibilityIcon />, onClick: () => router.push(ATTENDANCE_VIEW(params.row.id, storeId)), color: 'info', show: permissions.can_view },
						{ label: t.common.edit, icon: <EditIcon />, onClick: () => router.push(ATTENDANCE_EDIT(params.row.id, storeId)), color: 'primary', show: permissions.can_edit && canManageStore },
						{ label: t.common.delete, icon: <DeleteIcon />, onClick: () => setDeleteTarget(params.row.id), color: 'error', show: permissions.can_delete && canManageStore },
					]}
				/>
			),
		},
	];

	return (
		<NavigationBar title={t.magasin.attendance}>
			<Protected permission="can_view">
				<Box sx={magasinPageContainerSx}>
					<StoreTabs selectedStoreId={storeId} onChange={setSelectedStoreId} token={token} />
					<Box sx={magasinPageContentSx}>
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" flexWrap="wrap">
							{permissions.can_create && canManageStore && (
								<Button variant="contained" startIcon={<AddIcon fontSize="small" />} onClick={() => router.push(ATTENDANCE_ADD(storeId))}>
									{t.magasin.newAttendance}
								</Button>
							)}
						</Stack>
					</Box>
					<ChipSelectFilterBar filters={chipFilters} onFilterChange={handleChipFilterChange} columns={2} />
					<PaginatedDataGrid
						data={data}
						isLoading={isLoading}
						columns={columns}
						paginationModel={paginationModel}
						setPaginationModel={setPaginationModel}
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						filterModel={filterModel}
						onFilterModelChange={setFilterModel}
						onCustomFilterParamsChange={setCustomFilterParams}
						toolbar={{ quickFilter: true, debounceMs: 500 }}
						toolbarActions={
							permissions.can_create && canManageStore ? (
								<DarkTooltip title={t.magasin.importPointage}>
									<IconButton size="small" disabled={importState.isLoading} component="label">
										<FileUploadIcon />
										<input hidden type="file" accept=".xlsx,.xls" onChange={handleImport} disabled={importState.isLoading} />
									</IconButton>
								</DarkTooltip>
							) : undefined
						}
					/>
				</Box>
				{deleteTarget !== null && (
					<ActionModals
						title={t.magasin.deleteAttendanceTitle}
						body={t.magasin.deleteAttendanceBody}
						titleIcon={<DeleteIcon />}
						titleIconColor="#D32F2F"
						actions={[
							{ text: t.common.cancel, active: false, onClick: () => setDeleteTarget(null), icon: <CloseIcon />, color: '#6B6B6B' },
							{ text: t.common.delete, active: true, onClick: deleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
						]}
					/>
				)}
			</Protected>
		</NavigationBar>
	);
};

export default AttendanceClient;
