'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Visibility as VisibilityIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { GridColDef, GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import StoreTabs, { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import { createBooleanFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useBulkDeleteStockBalancesMutation,
	useDeleteStockBalanceMutation,
	useGetStockBalancesQuery,
} from '@/store/services/magasin';
import { STOCK_ADD, STOCK_EDIT, STOCK_VIEW } from '@/utils/routes';
import { extractApiErrorMessage, formatNumber } from '@/utils/helpers';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import type { SessionProps } from '@/types/_initTypes';
import type { StockBalanceType } from '@/types/gestionMagasinTypes';

const roleCanManage = (role?: string) => role === 'direction' || role === 'responsable';

const StockClient = ({ session }: SessionProps) => {
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
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

	const {
		data,
		isLoading,
		refetch,
	} = useGetStockBalancesQuery(
		{
			store: storeId,
			search: searchTerm,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			...customFilterParams,
			...chipFilterParams,
		},
		{ skip: !token || !storeId },
	);
	const [deleteStockBalance] = useDeleteStockBalanceMutation();
	const [bulkDeleteStockBalances] = useBulkDeleteStockBalancesMutation();

	const resetSelection = () => setSelectedIds([]);

	const deleteHandler = async () => {
		if (!deleteTarget) return;
		try {
			await deleteStockBalance({ id: deleteTarget }).unwrap();
			onSuccess(t.magasin.stockDeleted);
			setSelectedIds((current) => current.filter((id) => id !== deleteTarget));
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.stockDeleteError));
		} finally {
			setDeleteTarget(null);
		}
	};

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteStockBalances({ ids: selectedIds }).unwrap();
			onSuccess(t.magasin.bulkStocksDeleted(selectedIds.length));
			resetSelection();
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.stockDeleteError));
		} finally {
			setShowBulkDeleteModal(false);
		}
	};

	const booleanFilterOptions = useMemo(
		() => [
			{ value: 'true', label: t.common.yes },
			{ value: 'false', label: t.common.no },
		],
		[t.common.no, t.common.yes],
	);

	const chipFilters = useMemo(
		() => [
			{
				key: 'stock',
				label: t.magasin.lowStockStatus,
				paramName: 'low',
				options: [{ id: 'true', nom: t.magasin.lowStock }],
			},
		],
		[t.magasin.lowStock, t.magasin.lowStockStatus],
	);

	const columns: GridColDef[] = [
		{
			field: 'product_reference',
			headerName: t.magasin.reference,
			flex: 1,
			minWidth: 130,
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<DarkTooltip title={params.value ?? params.row.product_barcode ?? '-'}>
					<Typography variant="body2" noWrap>{params.value ?? params.row.product_barcode ?? '-'}</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'product_name',
			headerName: t.magasin.product,
			flex: 1.8,
			minWidth: 190,
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" fontWeight={600} noWrap>{params.value}</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'category_name',
			headerName: t.magasin.category,
			flex: 1,
			minWidth: 130,
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<Typography variant="body2" noWrap>{params.value ?? '-'}</Typography>
			),
		},
		{
			field: 'store_name',
			headerName: t.magasin.store,
			flex: 1,
			minWidth: 140,
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<Typography variant="body2" noWrap>{params.value}</Typography>
			),
		},
		{
			field: 'quantity',
			headerName: t.magasin.currentStock,
			flex: 0.9,
			minWidth: 130,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<Typography variant="body2" fontWeight={600} noWrap>{formatNumber(params.value as string)}</Typography>
			),
		},
		{
			field: 'effective_min_stock',
			headerName: t.magasin.minimumStock,
			flex: 0.9,
			minWidth: 140,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<Typography variant="body2" noWrap>{formatNumber(params.value as string)}</Typography>
			),
		},
		{
			field: 'average_cost',
			headerName: t.magasin.averageCost,
			flex: 0.9,
			minWidth: 130,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<Typography variant="body2" color="primary" fontWeight={600} noWrap>
					{formatNumber(params.value as string)} Dhs
				</Typography>
			),
		},
		{
			field: 'is_low_stock',
			headerName: t.magasin.lowStockStatus,
			flex: 0.9,
			minWidth: 140,
			filterOperators: createBooleanFilterOperators(booleanFilterOptions, t.common.all),
			renderCell: (params: GridRenderCellParams<StockBalanceType>) =>
				params.value ? (
					<Chip icon={<WarningIcon />} label={t.magasin.lowStock} color="warning" size="small" />
				) : (
					<Chip label={t.common.no} color="default" size="small" variant="outlined" />
				),
		},
		{
			field: 'actions',
			headerName: t.common.actions,
			flex: 1,
			minWidth: 140,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<MobileActionsMenu
					actions={[
						{
							label: t.common.view,
							icon: <VisibilityIcon />,
							onClick: () => router.push(STOCK_VIEW(params.row.id, storeId)),
							color: 'info',
							show: permissions.can_view,
						},
						{
							label: t.common.edit,
							icon: <EditIcon />,
							onClick: () => router.push(STOCK_EDIT(params.row.id, storeId)),
							color: 'primary',
							show: permissions.can_edit && canManageStore,
						},
						{
							label: t.common.delete,
							icon: <DeleteIcon />,
							onClick: () => setDeleteTarget(params.row.id),
							color: 'error',
							show: permissions.can_delete && canManageStore,
						},
					]}
				/>
			),
		},
	];

	return (
		<NavigationBar title={t.magasin.stock}>
			<Protected permission="can_view">
				<Box sx={magasinPageContainerSx}>
					<StoreTabs
						selectedStoreId={storeId}
						onChange={(nextStoreId) => {
							setSelectedStoreId(nextStoreId);
							setPaginationModel((current) => ({ ...current, page: 0 }));
							resetSelection();
						}}
						token={token}
					/>
					<Box sx={magasinPageContentSx}>
						<Stack direction="row" spacing={1} flexWrap="wrap">
							{permissions.can_create && canManageStore && (
								<Button variant="contained" startIcon={<AddIcon fontSize="small" />} onClick={() => router.push(STOCK_ADD(storeId))}>
									{t.magasin.newStock}
								</Button>
							)}
							{selectedIds.length > 0 && permissions.can_delete && canManageStore && (
								<Button variant="outlined" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => setShowBulkDeleteModal(true)}>
									{t.common.delete} ({selectedIds.length})
								</Button>
							)}
						</Stack>
					</Box>
					<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} columns={1} />
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
						checkboxSelection={permissions.can_delete && canManageStore}
						onSelectionChange={setSelectedIds}
						selectedIds={selectedIds}
					/>
				</Box>
				{deleteTarget !== null && (
					<ActionModals
						title={t.magasin.deleteStockTitle}
						body={t.magasin.deleteStockBody}
						titleIcon={<DeleteIcon />}
						titleIconColor="#D32F2F"
						actions={[
							{ text: t.common.cancel, active: false, onClick: () => setDeleteTarget(null), icon: <CloseIcon />, color: '#6B6B6B' },
							{ text: t.common.delete, active: true, onClick: deleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
						]}
					/>
				)}
				{showBulkDeleteModal && (
					<ActionModals
						title={t.magasin.deleteStocksTitle(selectedIds.length)}
						body={t.magasin.deleteStocksBody(selectedIds.length)}
						titleIcon={<DeleteIcon />}
						titleIconColor="#D32F2F"
						actions={[
							{ text: t.common.cancel, active: false, onClick: () => setShowBulkDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
							{ text: t.common.delete, active: true, onClick: bulkDeleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
						]}
					/>
				)}
			</Protected>
		</NavigationBar>
	);
};

export default StockClient;
