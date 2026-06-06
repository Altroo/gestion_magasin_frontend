'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack } from '@mui/material';
import {
	Add as AddIcon,
	CheckCircle as ValidateIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { GridLogicOperator, type GridColDef, type GridFilterModel, type GridRenderCellParams } from '@mui/x-data-grid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { stockWorkflowStatusOptions } from '@/components/pages/magasin/shared/status-labels';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import WorkflowStatusChip from '@/components/pages/magasin/shared/workflow-status-chip';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import TooltipTextCell from '@/components/shared/dataGridCells/tooltipTextCell';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteStockTransferMutation, useGetStockTransfersQuery, useValidateStockTransferMutation } from '@/store/services/magasin';
import type { SessionProps } from '@/types/_initTypes';
import type { StockTransferType } from '@/types/gestionMagasinTypes';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { STOCK_TRANSFERS_ADD, STOCK_TRANSFERS_EDIT, STOCK_TRANSFERS_VIEW } from '@/utils/routes';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';

const StockTransfersListClient = ({ session }: SessionProps) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const { memberships } = useSelectedStore(token);
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
	const [validateTarget, setValidateTarget] = useState<number | null>(null);
	const mergedFilterParams = useMemo(() => ({ ...chipFilterParams, ...customFilterParams }), [chipFilterParams, customFilterParams]);
	const { data, isLoading, refetch } = useGetStockTransfersQuery(
		{ search: searchTerm, page: paginationModel.page + 1, pageSize: paginationModel.pageSize, ...mergedFilterParams },
		{ skip: !token },
	);
	const [deleteTransfer] = useDeleteStockTransferMutation();
	const [validateTransfer] = useValidateStockTransferMutation();

	const targetStoreOptions = useMemo(
		() => memberships.map((membership) => membership.store).filter((store) => !store.is_global_stock).map((store) => ({ id: String(store.id), nom: store.name })),
		[memberships],
	);
	const chipFilters = useMemo(() => [
		{ key: 'status', label: t.magasin.status, paramName: 'status', options: stockWorkflowStatusOptions(t) },
		{ key: 'target_store_ids', label: t.magasin.targetStore, paramName: 'target_store_ids', options: targetStoreOptions },
	], [t, targetStoreOptions]);
	const handleChipFilterChange = useCallback((params: Record<string, string>) => { setChipFilterParams(params); setPaginationModel((current) => ({ ...current, page: 0 })); }, []);

	const handleDelete = async () => {
		if (!deleteTarget) return;
		try {
			await deleteTransfer({ id: deleteTarget }).unwrap();
			onSuccess(t.magasin.transferDeleted);
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.transferDeleteError));
		} finally {
			setDeleteTarget(null);
		}
	};

	const handleValidate = async () => {
		if (!validateTarget) return;
		try {
			await validateTransfer({ id: validateTarget }).unwrap();
			onSuccess(t.magasin.transferValidated);
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.transferValidateError));
		} finally {
			setValidateTarget(null);
		}
	};

	const columns: GridColDef[] = [
		{ field: 'reference', headerName: t.magasin.transferReference, flex: 0.8, minWidth: 140, renderCell: (params: GridRenderCellParams<StockTransferType>) => <TooltipTextCell>{params.value ?? '-'}</TooltipTextCell> },
		{ field: 'target_store_name', headerName: t.magasin.targetStore, flex: 1, minWidth: 150, renderCell: (params: GridRenderCellParams<StockTransferType>) => <TooltipTextCell>{params.value ?? '-'}</TooltipTextCell> },
		{ field: 'transfer_date', headerName: t.magasin.transferDate, flex: 0.8, minWidth: 130, renderCell: (params: GridRenderCellParams<StockTransferType>) => <TooltipTextCell>{formatDate(params.value as string)}</TooltipTextCell> },
		{ field: 'status', headerName: t.magasin.status, flex: 0.7, minWidth: 140, renderCell: (params: GridRenderCellParams<StockTransferType>) => <WorkflowStatusChip t={t} status={params.value as string} /> },
		{
			field: 'actions',
			headerName: t.common.actions,
			minWidth: 150,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<StockTransferType>) => (
				<MobileActionsMenu
					actions={[
						{ label: t.common.view, icon: <VisibilityIcon />, onClick: () => router.push(STOCK_TRANSFERS_VIEW(params.row.id)), color: 'info', show: permissions.can_view },
						{ label: t.common.edit, icon: <EditIcon />, onClick: () => router.push(STOCK_TRANSFERS_EDIT(params.row.id)), color: 'primary', show: permissions.can_edit && params.row.status !== 'validated' },
						{ label: t.common.confirm, icon: <ValidateIcon />, onClick: () => setValidateTarget(params.row.id), color: 'success', show: permissions.can_create && params.row.status === 'draft' },
						{ label: t.common.delete, icon: <DeleteIcon />, onClick: () => setDeleteTarget(params.row.id), color: 'error', show: permissions.can_delete && params.row.status !== 'validated' },
					]}
				/>
			),
		},
	];

	return (
		<NavigationBar title={t.magasin.stockTransfers}>
			<Protected>
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack direction="row" spacing={1} flexWrap="wrap">
							{permissions.can_create && <Button variant="contained" startIcon={<AddIcon fontSize="small" />} onClick={() => router.push(STOCK_TRANSFERS_ADD())}>{t.magasin.newStockTransfer}</Button>}
						</Stack>
					</Box>
					<ChipSelectFilterBar filters={chipFilters} onFilterChange={handleChipFilterChange} />
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
					/>
				</Box>
			</Protected>
			{deleteTarget && <ActionModals title={t.magasin.deleteTransferTitle} body={t.magasin.deleteTransferBody} titleIcon={<DeleteIcon />} titleIconColor="#D32F2F" actions={[{ text: t.common.cancel, active: false, onClick: () => setDeleteTarget(null), icon: <CloseIcon />, color: '#6B6B6B' }, { text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' }]} />}
			{validateTarget && <ActionModals title={t.common.confirm} body={t.magasin.stockTransferDetails} titleIcon={<ValidateIcon />} titleIconColor="#2E7D32" actions={[{ text: t.common.cancel, active: false, onClick: () => setValidateTarget(null), icon: <CloseIcon />, color: '#6B6B6B' }, { text: t.common.confirm, active: true, onClick: handleValidate, icon: <ValidateIcon />, color: '#2E7D32' }]} />}
		</NavigationBar>
	);
};

export default StockTransfersListClient;
