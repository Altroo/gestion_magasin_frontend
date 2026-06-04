'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { Add as AddIcon, CheckCircle as ValidateIcon, Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import StoreTabs, { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useBulkDeleteInventorySessionsMutation, useDeleteInventorySessionMutation, useGetInventorySessionsQuery, useValidateInventorySessionMutation } from '@/store/services/magasin';
import type { SessionProps } from '@/types/_initTypes';
import type { InventorySessionType } from '@/types/gestionMagasinTypes';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { INVENTORY_ADD, INVENTORY_EDIT, INVENTORY_VIEW } from '@/utils/routes';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';

const InventoryListClient = ({ session }: SessionProps) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const { defaultStore } = useSelectedStore(token);
	const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>();
	const storeId = selectedStoreId ?? defaultStore?.id;
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
	const [validateTarget, setValidateTarget] = useState<number | null>(null);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
	const { data, isLoading, refetch } = useGetInventorySessionsQuery(
		{ store: storeId, search: searchTerm, page: paginationModel.page + 1, pageSize: paginationModel.pageSize, ...chipFilterParams },
		{ skip: !token || !storeId },
	);
	const [deleteInventory] = useDeleteInventorySessionMutation();
	const [bulkDeleteInventory] = useBulkDeleteInventorySessionsMutation();
	const [validateInventory] = useValidateInventorySessionMutation();

	const chipFilters = useMemo(() => [{ key: 'status', label: t.magasin.status, paramName: 'status', options: [{ id: 'draft', nom: 'Draft' }, { id: 'validated', nom: 'Validated' }, { id: 'cancelled', nom: 'Cancelled' }] }], [t.magasin.status]);
	const handleChipFilterChange = useCallback((params: Record<string, string>) => { setChipFilterParams(params); setPaginationModel((current) => ({ ...current, page: 0 })); }, []);

	const handleDelete = async () => {
		if (!deleteTarget) return;
		try {
			await deleteInventory({ id: deleteTarget }).unwrap();
			onSuccess(t.magasin.inventoryDeleted);
			setSelectedIds((current) => current.filter((id) => id !== deleteTarget));
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.inventoryDeleteError));
		} finally {
			setDeleteTarget(null);
		}
	};

	const handleBulkDelete = async () => {
		try {
			await bulkDeleteInventory({ ids: selectedIds }).unwrap();
			onSuccess(t.magasin.inventoryDeleted);
			setSelectedIds([]);
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.inventoryDeleteError));
		} finally {
			setShowBulkDeleteModal(false);
		}
	};

	const handleValidate = async () => {
		if (!validateTarget) return;
		try {
			await validateInventory({ id: validateTarget }).unwrap();
			onSuccess(t.magasin.inventoryValidated);
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.inventoryValidateError));
		} finally {
			setValidateTarget(null);
		}
	};

	const columns: GridColDef[] = [
		{ field: 'code', headerName: t.magasin.reference, flex: 0.8, minWidth: 130 },
		{ field: 'title', headerName: t.magasin.inventory, flex: 1.4, minWidth: 180, renderCell: (params: GridRenderCellParams<InventorySessionType>) => <Typography fontWeight={600}>{params.value}</Typography> },
		{ field: 'store_name', headerName: t.magasin.store, flex: 1, minWidth: 140 },
		{ field: 'inventory_date', headerName: t.magasin.date, flex: 0.8, minWidth: 120, renderCell: (params: GridRenderCellParams<InventorySessionType>) => <Typography>{formatDate(params.value as string)}</Typography> },
		{ field: 'status', headerName: t.magasin.status, flex: 0.7, minWidth: 110, renderCell: (params: GridRenderCellParams<InventorySessionType>) => <Chip size="small" color={params.value === 'validated' ? 'success' : 'default'} label={String(params.value)} /> },
		{
			field: 'actions',
			headerName: t.common.actions,
			minWidth: 150,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<InventorySessionType>) => (
				<MobileActionsMenu
					actions={[
						{ label: t.common.view, icon: <VisibilityIcon />, onClick: () => router.push(INVENTORY_VIEW(params.row.id, storeId)), color: 'info', show: permissions.can_view },
						{ label: t.common.edit, icon: <EditIcon />, onClick: () => router.push(INVENTORY_EDIT(params.row.id, storeId)), color: 'primary', show: permissions.can_create && params.row.status === 'draft' },
						{ label: t.magasin.validateInventory, icon: <ValidateIcon />, onClick: () => setValidateTarget(params.row.id), color: 'success', show: permissions.can_create && params.row.status === 'draft' },
						{ label: t.common.delete, icon: <DeleteIcon />, onClick: () => setDeleteTarget(params.row.id), color: 'error', show: permissions.can_delete && params.row.status !== 'validated' },
					]}
				/>
			),
		},
	];

	return (
		<NavigationBar title={t.magasin.inventory}>
			<Protected permission="can_view">
				<Box sx={magasinPageContainerSx}>
					<StoreTabs selectedStoreId={storeId} onChange={setSelectedStoreId} token={token} />
					<Box sx={magasinPageContentSx}>
						<Stack spacing={2}>
							<Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
								{permissions.can_delete && selectedIds.length > 0 && <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setShowBulkDeleteModal(true)}>{t.common.delete}</Button>}
								{permissions.can_create && <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push(INVENTORY_ADD(storeId))}>{t.magasin.newInventory}</Button>}
							</Stack>
							<ChipSelectFilterBar filters={chipFilters} onFilterChange={handleChipFilterChange} columns={1} />
							<PaginatedDataGrid data={data} isLoading={isLoading} columns={columns} paginationModel={paginationModel} setPaginationModel={setPaginationModel} searchTerm={searchTerm} setSearchTerm={setSearchTerm} checkboxSelection={permissions.can_delete} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
						</Stack>
					</Box>
				</Box>
			</Protected>
			{deleteTarget && <ActionModals title={t.magasin.deleteInventoryTitle} body={t.magasin.deleteInventoryBody} titleIcon={<DeleteIcon />} titleIconColor="#D32F2F" actions={[{ text: t.common.cancel, active: false, onClick: () => setDeleteTarget(null), icon: <CloseIcon />, color: '#6B6B6B' }, { text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' }]} />}
			{showBulkDeleteModal && <ActionModals title={t.magasin.deleteInventoryTitle} body={t.magasin.deleteInventoryBody} titleIcon={<DeleteIcon />} titleIconColor="#D32F2F" actions={[{ text: t.common.cancel, active: false, onClick: () => setShowBulkDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' }, { text: t.common.delete, active: true, onClick: handleBulkDelete, icon: <DeleteIcon />, color: '#D32F2F' }]} />}
			{validateTarget && <ActionModals title={t.magasin.validateInventory} body={t.magasin.inventoryDetails} titleIcon={<ValidateIcon />} titleIconColor="#2E7D32" actions={[{ text: t.common.cancel, active: false, onClick: () => setValidateTarget(null), icon: <CloseIcon />, color: '#6B6B6B' }, { text: t.magasin.validateInventory, active: true, onClick: handleValidate, icon: <ValidateIcon />, color: '#2E7D32' }]} />}
		</NavigationBar>
	);
};

export default InventoryListClient;
