'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Stack } from '@mui/material';
import {
	Add as AddIcon,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	PendingActions as PendingActionsIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { GridLogicOperator, type GridColDef, type GridFilterModel, type GridRenderCellParams } from '@mui/x-data-grid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import StoreTabs, { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import {
	expensePaymentModeLabel,
	expensePaymentModeOptions,
	expensePaymentStatusOptions,
	magasinStatusLabel,
} from '@/components/pages/magasin/shared/status-labels';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import TooltipTextCell from '@/components/shared/dataGridCells/tooltipTextCell';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useBulkDeleteExpensesMutation,
	useDeleteExpenseMutation,
	useGetExpenseCategoriesQuery,
	useGetExpensesQuery,
	useGetPaymentModesQuery,
} from '@/store/services/magasin';
import type { SessionProps } from '@/types/_initTypes';
import type { ExpenseType } from '@/types/gestionMagasinTypes';
import { extractApiErrorMessage, formatDate, formatNumber } from '@/utils/helpers';
import { EXPENSES_ADD, EXPENSES_EDIT, EXPENSES_VIEW } from '@/utils/routes';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';

const ExpensesListClient = ({ session }: SessionProps) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const { defaultStore, memberships } = useSelectedStore(token);
	const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>();
	const storeId = selectedStoreId ?? defaultStore?.id;
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
	const mergedFilterParams = useMemo(() => ({ ...chipFilterParams, ...customFilterParams }), [chipFilterParams, customFilterParams]);
	const storeFilterActive = Boolean(chipFilterParams.store_ids);
	const { data, isLoading, refetch } = useGetExpensesQuery(
		{
			store: storeFilterActive ? undefined : storeId,
			search: searchTerm,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			...mergedFilterParams,
		},
		{ skip: !token || (!storeId && !storeFilterActive) },
	);
	const [deleteExpense] = useDeleteExpenseMutation();
	const [bulkDeleteExpenses] = useBulkDeleteExpensesMutation();
	const { data: paymentModes } = useGetPaymentModesQuery({ page: 1, pageSize: 100, is_active: 'true' }, { skip: !token });
	const { data: expenseCategories } = useGetExpenseCategoriesQuery({ page: 1, pageSize: 100 }, { skip: !token });

	const chipFilters = useMemo(
		() => [
			{
				key: 'store',
				label: t.magasin.store,
				paramName: 'store_ids',
				options: memberships.map((membership) => ({ id: String(membership.store.id), nom: membership.store.name })),
			},
			{
				key: 'category',
				label: t.magasin.expenseCategory,
				paramName: 'category_ids',
				options: (expenseCategories?.results ?? []).map((category) => ({ id: String(category.id), nom: category.name })),
			},
			{ key: 'payment_status', label: t.magasin.paymentStatus, paramName: 'payment_status', options: expensePaymentStatusOptions(t) },
			{ key: 'payment_mode', label: t.magasin.paymentMode, paramName: 'payment_mode', options: expensePaymentModeOptions(t, paymentModes?.results) },
		],
		[expenseCategories?.results, memberships, paymentModes?.results, t],
	);
	const handleChipFilterChange = useCallback((params: Record<string, string>) => { setChipFilterParams(params); setPaginationModel((current) => ({ ...current, page: 0 })); }, []);

	const renderPaymentStatusChip = (status?: string | null) => {
		const label = magasinStatusLabel(t, status);
		if (status === 'paid') {
			return <DarkTooltip title={label}><Chip size="small" color="success" variant="outlined" icon={<CheckCircleIcon fontSize="small" />} label={label} sx={{ fontWeight: 600 }} /></DarkTooltip>;
		}
		if (status === 'payable') {
			return <DarkTooltip title={label}><Chip size="small" color="warning" variant="outlined" icon={<PendingActionsIcon fontSize="small" />} label={label} sx={{ fontWeight: 600 }} /></DarkTooltip>;
		}
		return <DarkTooltip title={label}><Chip size="small" color="default" variant="outlined" label={label} sx={{ fontWeight: 600 }} /></DarkTooltip>;
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		try {
			await deleteExpense({ id: deleteTarget }).unwrap();
			onSuccess(t.magasin.expenseDeleted);
			setSelectedIds((current) => current.filter((id) => id !== deleteTarget));
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.expenseDeleteError));
		} finally {
			setDeleteTarget(null);
		}
	};

	const handleBulkDelete = async () => {
		try {
			await bulkDeleteExpenses({ ids: selectedIds }).unwrap();
			onSuccess(t.magasin.expenseDeleted);
			setSelectedIds([]);
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.expenseDeleteError));
		} finally {
			setShowBulkDeleteModal(false);
		}
	};

	const columns: GridColDef[] = [
		{ field: 'label', headerName: t.magasin.expenseLabel, flex: 1.4, minWidth: 180, renderCell: (params: GridRenderCellParams<ExpenseType>) => <TooltipTextCell fontWeight={600}>{params.value}</TooltipTextCell> },
		{ field: 'store_name', headerName: t.magasin.store, flex: 1, minWidth: 140, renderCell: (params: GridRenderCellParams<ExpenseType>) => <TooltipTextCell>{params.value ?? '-'}</TooltipTextCell> },
		{ field: 'category_name', headerName: t.magasin.expenseCategory, flex: 1, minWidth: 140, renderCell: (params: GridRenderCellParams<ExpenseType>) => <TooltipTextCell>{params.value ?? '-'}</TooltipTextCell> },
		{ field: 'expense_date', headerName: t.magasin.date, flex: 0.8, minWidth: 120, renderCell: (params: GridRenderCellParams<ExpenseType>) => <TooltipTextCell>{formatDate(params.value as string)}</TooltipTextCell> },
		{ field: 'payment_mode', headerName: t.magasin.paymentMode, flex: 0.9, minWidth: 130, renderCell: (params: GridRenderCellParams<ExpenseType>) => <TooltipTextCell>{params.row.payment_mode_name ?? expensePaymentModeLabel(t, params.value as string, paymentModes?.results)}</TooltipTextCell> },
		{ field: 'payment_status', headerName: t.magasin.paymentStatus, flex: 0.8, minWidth: 140, renderCell: (params: GridRenderCellParams<ExpenseType>) => renderPaymentStatusChip(params.value as string) },
		{ field: 'amount', headerName: t.magasin.expenseAmount, flex: 0.8, minWidth: 120, renderCell: (params: GridRenderCellParams<ExpenseType>) => <TooltipTextCell title={`${formatNumber(params.value as string)} Dhs`} fontWeight={600}>{formatNumber(params.value as string)} Dhs</TooltipTextCell> },
		{
			field: 'actions',
			headerName: t.common.actions,
			minWidth: 140,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<ExpenseType>) => (
				<MobileActionsMenu
					actions={[
						{ label: t.common.view, icon: <VisibilityIcon />, onClick: () => router.push(EXPENSES_VIEW(params.row.id, storeId)), color: 'info', show: permissions.can_view },
						{ label: t.common.edit, icon: <EditIcon />, onClick: () => router.push(EXPENSES_EDIT(params.row.id, storeId)), color: 'primary', show: permissions.can_create },
						{ label: t.common.delete, icon: <DeleteIcon />, onClick: () => setDeleteTarget(params.row.id), color: 'error', show: permissions.can_delete },
					]}
				/>
			),
		},
	];

	return (
		<NavigationBar title={t.magasin.expenses}>
			<Protected permission="can_view">
				<Box sx={magasinPageContainerSx}>
					<StoreTabs selectedStoreId={storeId} onChange={setSelectedStoreId} token={token} />
					<Box sx={magasinPageContentSx}>
						<Stack direction="row" spacing={1} flexWrap="wrap">
							{permissions.can_create && <Button variant="contained" startIcon={<AddIcon fontSize="small" />} onClick={() => router.push(EXPENSES_ADD(storeId))}>{t.magasin.newExpense}</Button>}
							{permissions.can_delete && selectedIds.length > 0 && <Button variant="outlined" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => setShowBulkDeleteModal(true)}>{t.common.delete} ({selectedIds.length})</Button>}
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
						checkboxSelection={permissions.can_delete}
						selectedIds={selectedIds}
						onSelectionChange={setSelectedIds}
					/>
				</Box>
			</Protected>
			{deleteTarget && <ActionModals title={t.magasin.deleteExpenseTitle} body={t.magasin.deleteExpenseBody} titleIcon={<DeleteIcon />} titleIconColor="#D32F2F" actions={[{ text: t.common.cancel, active: false, onClick: () => setDeleteTarget(null), icon: <CloseIcon />, color: '#6B6B6B' }, { text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' }]} />}
			{showBulkDeleteModal && <ActionModals title={t.magasin.deleteExpenseTitle} body={t.magasin.deleteExpenseBody} titleIcon={<DeleteIcon />} titleIconColor="#D32F2F" actions={[{ text: t.common.cancel, active: false, onClick: () => setShowBulkDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' }, { text: t.common.delete, active: true, onClick: handleBulkDelete, icon: <DeleteIcon />, color: '#D32F2F' }]} />}
		</NavigationBar>
	);
};

export default ExpensesListClient;
