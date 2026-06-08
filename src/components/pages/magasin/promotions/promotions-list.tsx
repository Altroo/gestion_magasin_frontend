'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Stack } from '@mui/material';
import {
	Add as AddIcon,
	Cancel as CancelIcon,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { GridLogicOperator, type GridColDef, type GridFilterModel, type GridRenderCellParams } from '@mui/x-data-grid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import TooltipTextCell from '@/components/shared/dataGridCells/tooltipTextCell';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useBulkDeletePromotionsMutation, useDeletePromotionMutation, useGetPromotionsQuery, useGetStoresQuery } from '@/store/services/magasin';
import type { SessionProps } from '@/types/_initTypes';
import type { PromotionType } from '@/types/gestionMagasinTypes';
import { extractApiErrorMessage, formatDate, formatNumber } from '@/utils/helpers';
import { PROMOTIONS_ADD, PROMOTIONS_EDIT, PROMOTIONS_VIEW } from '@/utils/routes';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';

const PromotionsListClient = ({ session }: SessionProps) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
	const mergedFilterParams = useMemo(() => ({ ...chipFilterParams, ...customFilterParams }), [chipFilterParams, customFilterParams]);
	const { data, isLoading, refetch } = useGetPromotionsQuery(
		{ search: searchTerm, page: paginationModel.page + 1, pageSize: paginationModel.pageSize, ...mergedFilterParams },
		{ skip: !token },
	);
	const { data: storesData } = useGetStoresQuery({ pageSize: 100 }, { skip: !token });
	const [deletePromotion] = useDeletePromotionMutation();
	const [bulkDeletePromotions] = useBulkDeletePromotionsMutation();

	const chipFilters = useMemo(
		() => [
			{
				key: 'status',
				label: t.magasin.status,
				paramName: 'status',
				options: [
					{ id: 'active', nom: t.magasin.activePromotion },
					{ id: 'expired', nom: t.magasin.expiredPromotion },
				],
			},
			{
				key: 'store',
				label: t.magasin.store,
				paramName: 'store',
				options: (storesData?.results ?? []).map((store) => ({
					id: String(store.id),
					nom: store.name,
				})),
			},
		],
		[storesData?.results, t],
	);

	const handleChipFilterChange = useCallback((params: Record<string, string>) => {
		setChipFilterParams(params);
		setPaginationModel((current) => ({ ...current, page: 0 }));
	}, []);

	const handleDelete = async () => {
		if (!deleteTarget) return;
		try {
			await deletePromotion({ id: deleteTarget }).unwrap();
			onSuccess(t.magasin.promotionDeleted);
			setSelectedIds((current) => current.filter((id) => id !== deleteTarget));
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.promotionDeleteError));
		} finally {
			setDeleteTarget(null);
		}
	};

	const handleBulkDelete = async () => {
		try {
			await bulkDeletePromotions({ ids: selectedIds }).unwrap();
			onSuccess(t.magasin.promotionsDeleted(selectedIds.length));
			setSelectedIds([]);
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.promotionDeleteError));
		} finally {
			setShowBulkDeleteModal(false);
		}
	};

	const renderStatusChip = (status?: string | null) => {
		if (status === 'active') {
			return <DarkTooltip title={t.magasin.activePromotion}><Chip size="small" color="success" variant="outlined" icon={<CheckCircleIcon fontSize="small" />} label={t.magasin.activePromotion} sx={{ fontWeight: 600 }} /></DarkTooltip>;
		}
		return <DarkTooltip title={t.magasin.expiredPromotion}><Chip size="small" color="error" variant="outlined" icon={<CancelIcon fontSize="small" />} label={t.magasin.expiredPromotion} sx={{ fontWeight: 600 }} /></DarkTooltip>;
	};

	const columns: GridColDef[] = [
		{ field: 'name', headerName: t.magasin.promotionName, flex: 1.4, minWidth: 180, renderCell: (params: GridRenderCellParams<PromotionType>) => <TooltipTextCell fontWeight={600}>{params.value}</TooltipTextCell> },
		{ field: 'store_name', headerName: t.magasin.store, flex: 1, minWidth: 170, renderCell: (params: GridRenderCellParams<PromotionType>) => <TooltipTextCell>{params.value}</TooltipTextCell> },
		{ field: 'selling_price', headerName: t.magasin.sellingPrice, flex: 0.8, minWidth: 130, renderCell: (params: GridRenderCellParams<PromotionType>) => <TooltipTextCell title={`${formatNumber(params.value as string)} Dhs`} color="primary" fontWeight={600}>{formatNumber(params.value as string)} Dhs</TooltipTextCell> },
		{ field: 'status', headerName: t.magasin.status, flex: 0.7, minWidth: 130, renderCell: (params: GridRenderCellParams<PromotionType>) => renderStatusChip(params.value as string) },
		{ field: 'start_date', headerName: t.magasin.startDate, flex: 0.8, minWidth: 120, renderCell: (params: GridRenderCellParams<PromotionType>) => <TooltipTextCell>{params.value ? formatDate(params.value as string) : '-'}</TooltipTextCell> },
		{ field: 'end_date', headerName: t.magasin.endDate, flex: 0.8, minWidth: 120, renderCell: (params: GridRenderCellParams<PromotionType>) => <TooltipTextCell>{params.value ? formatDate(params.value as string) : '-'}</TooltipTextCell> },
		{
			field: 'actions',
			headerName: t.common.actions,
			minWidth: 140,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<PromotionType>) => (
				<MobileActionsMenu
					actions={[
						{ label: t.common.view, icon: <VisibilityIcon />, onClick: () => router.push(PROMOTIONS_VIEW(params.row.id)), color: 'info', show: permissions.can_view },
						{ label: t.common.edit, icon: <EditIcon />, onClick: () => router.push(PROMOTIONS_EDIT(params.row.id)), color: 'primary', show: permissions.can_create_promotion },
						{ label: t.common.delete, icon: <DeleteIcon />, onClick: () => setDeleteTarget(params.row.id), color: 'error', show: permissions.can_create_promotion },
					]}
				/>
			),
		},
	];

	return (
		<NavigationBar title={t.magasin.promotions}>
			<Protected permission="is_staff">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack direction="row" spacing={1} flexWrap="wrap">
							{permissions.can_create_promotion && <Button variant="contained" startIcon={<AddIcon fontSize="small" />} onClick={() => router.push(PROMOTIONS_ADD())}>{t.magasin.newPromotion}</Button>}
							{permissions.can_create_promotion && selectedIds.length > 0 && <Button variant="outlined" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => setShowBulkDeleteModal(true)}>{t.common.delete} ({selectedIds.length})</Button>}
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
						checkboxSelection={permissions.can_create_promotion}
						selectedIds={selectedIds}
						onSelectionChange={setSelectedIds}
					/>
				</Box>
			</Protected>
			{deleteTarget && (
				<ActionModals
					title={t.magasin.deletePromotionTitle}
					body={t.magasin.deletePromotionBody}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					actions={[
						{ text: t.common.cancel, active: false, onClick: () => setDeleteTarget(null), icon: <CloseIcon />, color: '#6B6B6B' },
						{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
					]}
				/>
			)}
			{showBulkDeleteModal && (
				<ActionModals
					title={t.magasin.deletePromotionsTitle(selectedIds.length)}
					body={t.magasin.deletePromotionsBody(selectedIds.length)}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					actions={[
						{ text: t.common.cancel, active: false, onClick: () => setShowBulkDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
						{ text: t.common.delete, active: true, onClick: handleBulkDelete, icon: <DeleteIcon />, color: '#D32F2F' },
					]}
				/>
			)}
		</NavigationBar>
	);
};

export default PromotionsListClient;
