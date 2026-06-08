'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	HighlightOff as RejectIcon,
	TaskAlt as ApproveIcon,
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
import TooltipTextCell from '@/components/shared/dataGridCells/tooltipTextCell';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import { createBooleanFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useBulkDeleteStockBalancesMutation,
	useDeleteStockBalanceMutation,
	useApproveStockAddRequestMutation,
	useGetCategoriesQuery,
	useGetProductUnitsQuery,
	useGetStockAddRequestsQuery,
	useGetStockBalancesQuery,
	useRejectStockAddRequestMutation,
} from '@/store/services/magasin';
import { STOCK_ADD, STOCK_EDIT, STOCK_VIEW } from '@/utils/routes';
import { extractApiErrorMessage, formatNumber } from '@/utils/helpers';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import type { SessionProps } from '@/types/_initTypes';
import type { StockAddRequestType, StockBalanceType } from '@/types/gestionMagasinTypes';

const roleCanManage = (role?: string) => role === 'direction' || role === 'responsable';
const roleCanApproveRequests = (role?: string) => role === 'direction';

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
	const canApproveRequests = permissions.is_staff || roleCanApproveRequests(selectedMembership?.role.code);

	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [requestPaginationModel, setRequestPaginationModel] = useState({ page: 0, pageSize: 5 });
	const [requestSearchTerm, setRequestSearchTerm] = useState('');
	const [requestFilterModel, setRequestFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
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
	const [approveStockAddRequest] = useApproveStockAddRequestMutation();
	const [rejectStockAddRequest] = useRejectStockAddRequestMutation();
	const { data: categories } = useGetCategoriesQuery(undefined, { skip: !token });
	const { data: productUnits } = useGetProductUnitsQuery(undefined, { skip: !token });
	const { data: stockRequests, isLoading: areRequestsLoading, refetch: refetchRequests } = useGetStockAddRequestsQuery(
		{
			store: storeId,
			status: 'pending',
			search: requestSearchTerm,
			page: requestPaginationModel.page + 1,
			pageSize: requestPaginationModel.pageSize,
		},
		{ skip: !token || !storeId || !canApproveRequests },
	);

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

	const approveRequestHandler = async (requestId: number) => {
		try {
			await approveStockAddRequest({ id: requestId }).unwrap();
			onSuccess(t.magasin.stockRequestApproved);
			refetch();
			refetchRequests();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.stockRequestApproveError));
		}
	};

	const rejectRequestHandler = async (requestId: number) => {
		try {
			await rejectStockAddRequest({ id: requestId }).unwrap();
			onSuccess(t.magasin.stockRequestRejected);
			refetchRequests();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.stockRequestRejectError));
		}
	};

	const booleanFilterOptions = useMemo(
		() => [
			{ value: 'true', label: t.magasin.lowStockReached },
			{ value: 'false', label: t.magasin.stockSufficient },
		],
		[t.magasin.lowStockReached, t.magasin.stockSufficient],
	);

	const chipFilters = useMemo(
		() => [
			{
				key: 'category',
				label: t.magasin.category,
				paramName: 'category_ids',
				options: (categories?.results ?? []).map((category) => ({ id: String(category.id), nom: category.name })),
			},
			{
				key: 'unit',
				label: t.magasin.unit,
				paramName: 'unit_ids',
				options: (productUnits?.results ?? []).map((unit) => ({ id: String(unit.id), nom: unit.name })),
			},
			{
				key: 'stock',
				label: t.magasin.lowStockStatus,
				paramName: 'low',
				options: [
					{ id: 'true', nom: t.magasin.lowStockReached },
					{ id: 'false', nom: t.magasin.stockSufficient },
				],
			},
		],
		[categories?.results, productUnits?.results, t.magasin.category, t.magasin.lowStockReached, t.magasin.lowStockStatus, t.magasin.stockSufficient, t.magasin.unit],
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
				<TooltipTextCell>{params.value ?? '-'}</TooltipTextCell>
			),
		},
		{
			field: 'unit_name',
			headerName: t.magasin.unit,
			flex: 0.8,
			minWidth: 110,
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell>{params.value ?? '-'}</TooltipTextCell>
			),
		},
		{
			field: 'store_name',
			headerName: t.magasin.store,
			flex: 1,
			minWidth: 140,
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell>{params.value}</TooltipTextCell>
			),
		},
		{
			field: 'quantity',
			headerName: t.magasin.currentStock,
			flex: 0.9,
			minWidth: 130,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell fontWeight={600}>{formatNumber(params.value as string)}</TooltipTextCell>
			),
		},
		{
			field: 'effective_min_stock',
			headerName: t.magasin.minimumStock,
			flex: 0.9,
			minWidth: 140,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell>{formatNumber(params.value as string)}</TooltipTextCell>
			),
		},
		{
			field: 'average_cost',
			headerName: t.magasin.averageCost,
			flex: 0.9,
			minWidth: 130,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell title={`${formatNumber(params.value as string)} Dhs`} color="primary" fontWeight={600}>
					{formatNumber(params.value as string)} Dhs
				</TooltipTextCell>
			),
		},
		{
			field: 'product_purchase_price',
			headerName: t.magasin.purchasePrice,
			flex: 0.9,
			minWidth: 130,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell title={`${formatNumber(params.value as string)} Dhs`} color="primary" fontWeight={600}>
					{formatNumber(params.value as string)} Dhs
				</TooltipTextCell>
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
					<DarkTooltip title={t.magasin.lowStockReached}>
						<Chip icon={<WarningIcon />} label={t.magasin.lowStockReached} color="warning" size="small" />
					</DarkTooltip>
				) : (
					<DarkTooltip title={t.magasin.stockSufficient}>
						<Chip icon={<CheckCircleIcon />} label={t.magasin.stockSufficient} color="success" size="small" variant="outlined" />
					</DarkTooltip>
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

	const requestColumns: GridColDef[] = [
		{
			field: 'product_name',
			headerName: t.magasin.product,
			flex: 1.5,
			minWidth: 190,
			renderCell: (params: GridRenderCellParams<StockAddRequestType>) => (
				<TooltipTextCell fontWeight={600}>{params.value}</TooltipTextCell>
			),
		},
		{
			field: 'quantity',
			headerName: t.magasin.quantity,
			flex: 0.8,
			minWidth: 120,
			renderCell: (params: GridRenderCellParams<StockAddRequestType>) => (
				<TooltipTextCell fontWeight={600}>{formatNumber(params.value as string)}</TooltipTextCell>
			),
		},
		{
			field: 'unit_cost',
			headerName: t.magasin.purchasePrice,
			flex: 0.8,
			minWidth: 130,
			renderCell: (params: GridRenderCellParams<StockAddRequestType>) => (
				<TooltipTextCell>{formatNumber(params.value as string)} Dhs</TooltipTextCell>
			),
		},
		{
			field: 'requested_by_email',
			headerName: t.users.email,
			flex: 1.2,
			minWidth: 180,
			renderCell: (params: GridRenderCellParams<StockAddRequestType>) => (
				<TooltipTextCell>{params.value ?? '-'}</TooltipTextCell>
			),
		},
		{
			field: 'actions',
			headerName: t.common.actions,
			flex: 1,
			minWidth: 170,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<StockAddRequestType>) => (
				<Stack direction="row" spacing={1}>
					<DarkTooltip title={t.magasin.approveStockRequest}>
						<Button size="small" variant="outlined" color="success" startIcon={<ApproveIcon fontSize="small" />} onClick={() => void approveRequestHandler(params.row.id)}>
							{t.common.confirm}
						</Button>
					</DarkTooltip>
					<DarkTooltip title={t.magasin.rejectStockRequest}>
						<Button size="small" variant="outlined" color="error" startIcon={<RejectIcon fontSize="small" />} onClick={() => void rejectRequestHandler(params.row.id)}>
							{t.magasin.rejectStockRequest}
						</Button>
					</DarkTooltip>
				</Stack>
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
							{permissions.can_create && (canManageStore || selectedMembership) && (
								<Button variant="contained" startIcon={<AddIcon fontSize="small" />} onClick={() => router.push(STOCK_ADD(storeId))}>
									{canApproveRequests ? t.magasin.newStock : t.magasin.newStockRequest}
								</Button>
							)}
							{selectedIds.length > 0 && permissions.can_delete && canManageStore && (
								<Button variant="outlined" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => setShowBulkDeleteModal(true)}>
									{t.common.delete} ({selectedIds.length})
								</Button>
							)}
						</Stack>
					</Box>
					<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} columns={2} />
					{canApproveRequests && (
						<Card elevation={2} sx={{ mt: 2, mb: 2, mx: { xs: 1, sm: 2, md: 3 }, borderRadius: 2, overflow: 'hidden' }}>
							<CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 2 }}>
									<WarningIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>{t.magasin.stockRequests}</Typography>
								</Stack>
								<Divider sx={{ mx: { xs: 2, md: 3 } }} />
								<PaginatedDataGrid
									data={stockRequests}
									isLoading={areRequestsLoading}
									columns={requestColumns}
									paginationModel={requestPaginationModel}
									setPaginationModel={setRequestPaginationModel}
									searchTerm={requestSearchTerm}
									setSearchTerm={setRequestSearchTerm}
									filterModel={requestFilterModel}
									onFilterModelChange={setRequestFilterModel}
									toolbar={{ quickFilter: true, debounceMs: 500 }}
								/>
							</CardContent>
						</Card>
					)}
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
