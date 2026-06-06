'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack } from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Delete as DeleteIcon, DownloadDone as ReceiveIcon, Edit as EditIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { GridLogicOperator, type GridColDef, type GridFilterModel, type GridRenderCellParams } from '@mui/x-data-grid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { purchaseStatusOptions } from '@/components/pages/magasin/shared/status-labels';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import WorkflowStatusChip from '@/components/pages/magasin/shared/workflow-status-chip';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import TooltipTextCell from '@/components/shared/dataGridCells/tooltipTextCell';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeletePurchaseMutation, useGetPurchasesQuery, useReceivePurchaseMutation } from '@/store/services/magasin';
import type { SessionProps } from '@/types/_initTypes';
import type { PurchaseType } from '@/types/gestionMagasinTypes';
import { extractApiErrorMessage, formatDate, formatNumber } from '@/utils/helpers';
import { PURCHASES_ADD, PURCHASES_EDIT, PURCHASES_VIEW } from '@/utils/routes';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';

const PurchasesListClient = ({ session }: SessionProps) => {
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
	const [receiveTarget, setReceiveTarget] = useState<number | null>(null);
	const mergedFilterParams = useMemo(() => ({ ...chipFilterParams, ...customFilterParams }), [chipFilterParams, customFilterParams]);
	const { data, isLoading, refetch } = useGetPurchasesQuery(
		{ search: searchTerm, page: paginationModel.page + 1, pageSize: paginationModel.pageSize, ...mergedFilterParams },
		{ skip: !token },
	);
	const { data: filterPurchases } = useGetPurchasesQuery(
		{ page: 1, pageSize: 200 },
		{ skip: !token },
	);
	const [deletePurchase] = useDeletePurchaseMutation();
	const [receivePurchase] = useReceivePurchaseMutation();

	const supplierOptions = useMemo(() => {
		const suppliers = new Set<string>();
		(filterPurchases?.results ?? []).forEach((purchase) => {
			const supplier = purchase.supplier_name.trim();
			if (supplier) suppliers.add(supplier);
		});
		return Array.from(suppliers).sort((a, b) => a.localeCompare(b)).map((supplier) => ({ id: supplier, nom: supplier }));
	}, [filterPurchases?.results]);

	const storeOptions = useMemo(
		() => memberships.map((membership) => ({ id: String(membership.store.id), nom: membership.store.name })),
		[memberships],
	);

	const chipFilters = useMemo(
		() => [
			{
				key: 'status',
				label: t.magasin.status,
				paramName: 'status',
				options: purchaseStatusOptions(t),
			},
			{
				key: 'supplier',
				label: t.magasin.supplier,
				paramName: 'supplier_names',
				options: supplierOptions,
			},
			{
				key: 'store',
				label: t.magasin.store,
				paramName: 'store_ids',
				options: storeOptions,
			},
		],
		[storeOptions, supplierOptions, t],
	);

	const handleChipFilterChange = useCallback((params: Record<string, string>) => {
		setChipFilterParams(params);
		setPaginationModel((current) => ({ ...current, page: 0 }));
	}, []);

	const handleDelete = async () => {
		if (!deleteTarget) return;
		try {
			await deletePurchase({ id: deleteTarget }).unwrap();
			onSuccess(t.magasin.purchaseDeleted);
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.purchaseDeleteError));
		} finally {
			setDeleteTarget(null);
		}
	};

	const handleReceive = async () => {
		if (!receiveTarget) return;
		try {
			await receivePurchase({ id: receiveTarget }).unwrap();
			onSuccess(t.magasin.purchaseReceived);
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.purchaseReceiveError));
		} finally {
			setReceiveTarget(null);
		}
	};

	const columns: GridColDef[] = [
		{ field: 'reference', headerName: t.magasin.reference, flex: 0.8, minWidth: 130, renderCell: (params: GridRenderCellParams<PurchaseType>) => <TooltipTextCell>{params.value ?? '-'}</TooltipTextCell> },
		{ field: 'supplier_name', headerName: t.magasin.supplier, flex: 1.2, minWidth: 160, renderCell: (params: GridRenderCellParams<PurchaseType>) => <TooltipTextCell fontWeight={600}>{params.value || '-'}</TooltipTextCell> },
		{ field: 'store_name', headerName: t.magasin.store, flex: 1, minWidth: 140, renderCell: (params: GridRenderCellParams<PurchaseType>) => <TooltipTextCell>{params.value ?? '-'}</TooltipTextCell> },
		{ field: 'purchase_date', headerName: t.magasin.date, flex: 0.8, minWidth: 120, renderCell: (params: GridRenderCellParams<PurchaseType>) => <TooltipTextCell>{formatDate(params.value as string)}</TooltipTextCell> },
		{ field: 'status', headerName: t.magasin.status, flex: 0.7, minWidth: 110, renderCell: (params: GridRenderCellParams<PurchaseType>) => <WorkflowStatusChip t={t} status={params.value as string} /> },
		{ field: 'subtotal', headerName: t.magasin.subtotal, flex: 0.8, minWidth: 120, renderCell: (params: GridRenderCellParams<PurchaseType>) => <TooltipTextCell title={`${formatNumber(params.value as string)} Dhs`} fontWeight={600}>{formatNumber(params.value as string)} Dhs</TooltipTextCell> },
		{
			field: 'actions',
			headerName: t.common.actions,
			minWidth: 150,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<PurchaseType>) => (
				<MobileActionsMenu
					actions={[
						{ label: t.common.view, icon: <VisibilityIcon />, onClick: () => router.push(PURCHASES_VIEW(params.row.id)), color: 'info', show: permissions.can_view },
						{ label: t.common.edit, icon: <EditIcon />, onClick: () => router.push(PURCHASES_EDIT(params.row.id)), color: 'primary', show: permissions.can_edit && params.row.status !== 'received' },
						{ label: t.magasin.receivePurchase, icon: <ReceiveIcon />, onClick: () => setReceiveTarget(params.row.id), color: 'success', show: permissions.can_create && params.row.status === 'draft' },
						{ label: t.common.delete, icon: <DeleteIcon />, onClick: () => setDeleteTarget(params.row.id), color: 'error', show: permissions.can_delete && params.row.status !== 'received' },
					]}
				/>
			),
		},
	];

	return (
		<NavigationBar title={t.magasin.purchases}>
			<Protected>
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack direction="row" spacing={1} flexWrap="wrap">
							{permissions.can_create && <Button variant="contained" startIcon={<AddIcon fontSize="small" />} onClick={() => router.push(PURCHASES_ADD())}>{t.magasin.newPurchase}</Button>}
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
			{deleteTarget && (
				<ActionModals
					title={t.magasin.deletePurchaseTitle}
					body={t.magasin.deletePurchaseBody}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					actions={[
						{ text: t.common.cancel, active: false, onClick: () => setDeleteTarget(null), icon: <CloseIcon />, color: '#6B6B6B' },
						{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
					]}
				/>
			)}
			{receiveTarget && (
				<ActionModals
					title={t.magasin.receivePurchase}
					body={t.magasin.purchaseDetails}
					titleIcon={<ReceiveIcon />}
					titleIconColor="#2E7D32"
					actions={[
						{ text: t.common.cancel, active: false, onClick: () => setReceiveTarget(null), icon: <CloseIcon />, color: '#6B6B6B' },
						{ text: t.magasin.receivePurchase, active: true, onClick: handleReceive, icon: <ReceiveIcon />, color: '#2E7D32' },
					]}
				/>
			)}
		</NavigationBar>
	);
};

export default PurchasesListClient;
