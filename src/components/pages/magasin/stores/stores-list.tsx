'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	Cancel as CancelIcon,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { GridColDef, GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import TooltipTextCell from '@/components/shared/dataGridCells/tooltipTextCell';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import { createBooleanFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useBulkDeleteStoresMutation, useDeleteStoreMutation, useGetStoresQuery } from '@/store/services/magasin';
import { STORES_ADD, STORES_EDIT, STORES_VIEW } from '@/utils/routes';
import { extractApiErrorMessage } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';
import type { SessionProps } from '@/types/_initTypes';
import type { StoreType } from '@/types/gestionMagasinTypes';

const StoresListClient = ({ session }: SessionProps) => {
	const token = useInitAccessToken(session);
	const router = useRouter();
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

	const { data, isLoading, refetch } = useGetStoresQuery(
		{
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
			...customFilterParams,
			...chipFilterParams,
		},
		{ skip: !token },
	);
	const [deleteStore] = useDeleteStoreMutation();
	const [bulkDeleteStores] = useBulkDeleteStoresMutation();

	const resetSelection = () => setSelectedIds([]);

	const deleteHandler = async () => {
		if (!deleteTarget) return;
		try {
			await deleteStore({ id: deleteTarget }).unwrap();
			onSuccess(t.magasin.storeDeleted);
			setSelectedIds((current) => current.filter((id) => id !== deleteTarget));
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.storeDeleteError));
		} finally {
			setDeleteTarget(null);
		}
	};

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteStores({ ids: selectedIds }).unwrap();
			onSuccess(t.magasin.bulkStoresDeleted(selectedIds.length));
			resetSelection();
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.storeDeleteError));
		} finally {
			setShowBulkDeleteModal(false);
		}
	};

	const booleanFilterOptions = [
		{ value: 'true', label: t.common.yes },
		{ value: 'false', label: t.common.no },
	];

	const chipFilters = useMemo(
		() => [
			{
				key: 'active',
				label: t.magasin.activeStore,
				paramName: 'is_active',
				options: [
					{ id: 'true', nom: t.users.active },
					{ id: 'false', nom: t.users.inactive },
				],
			},
		],
		[t.magasin.activeStore, t.users.active, t.users.inactive],
	);

	const columns: GridColDef[] = [
		{
			field: 'name',
			headerName: t.magasin.store,
			flex: 1.4,
			minWidth: 180,
			renderCell: (params: GridRenderCellParams<StoreType>) => (
				<DarkTooltip title={params.value}>
					<Typography
						variant="body2"
						noWrap
						sx={{
							fontWeight: 600,
						}}
					>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'code',
			headerName: t.magasin.storeCode,
			flex: 0.8,
			minWidth: 120,
			renderCell: (params: GridRenderCellParams<StoreType>) => <TooltipTextCell>{params.value}</TooltipTextCell>,
		},
		{
			field: 'address',
			headerName: t.magasin.storeAddress,
			flex: 1.3,
			minWidth: 180,
			renderCell: (params: GridRenderCellParams<StoreType>) => (
				<DarkTooltip title={params.value || '-'}>
					<Typography variant="body2" noWrap>
						{params.value || '-'}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'phone',
			headerName: t.magasin.storePhone,
			flex: 0.9,
			minWidth: 130,
			renderCell: (params: GridRenderCellParams<StoreType>) => <TooltipTextCell>{params.value || '-'}</TooltipTextCell>,
		},
		{
			field: 'members_count',
			headerName: t.magasin.membersCount,
			flex: 0.7,
			minWidth: 110,
			renderCell: (params: GridRenderCellParams<StoreType>) => <TooltipTextCell>{params.value ?? 0}</TooltipTextCell>,
		},
		{
			field: 'is_active',
			headerName: t.magasin.activeStore,
			flex: 0.8,
			minWidth: 120,
			filterOperators: createBooleanFilterOperators(booleanFilterOptions, t.common.all),
			renderCell: (params: GridRenderCellParams<StoreType>) => (
				<DarkTooltip title={params.value ? t.common.yes : t.common.no}>
					{params.value ? (
						<CheckCircleIcon color="success" fontSize="small" />
					) : (
						<CancelIcon color="error" fontSize="small" />
					)}
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
			renderCell: (params: GridRenderCellParams<StoreType>) => (
				<MobileActionsMenu
					actions={[
						{
							label: t.common.view,
							icon: <VisibilityIcon />,
							onClick: () => router.push(STORES_VIEW(params.row.id)),
							color: 'info' as const,
						},
						{
							label: t.common.edit,
							icon: <EditIcon />,
							onClick: () => router.push(STORES_EDIT(params.row.id)),
							color: 'primary' as const,
						},
						{
							label: t.common.delete,
							icon: <DeleteIcon />,
							onClick: () => setDeleteTarget(params.row.id),
							color: 'error' as const,
						},
					]}
				/>
			),
		},
	];

	return (
		<NavigationBar title={t.magasin.storesList}>
			<Protected>
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack
							direction="row"
							spacing={1}
							sx={{
								flexWrap: 'wrap',
							}}
						>
							<Button
								variant="contained"
								startIcon={<AddIcon fontSize="small" />}
								onClick={() => router.push(STORES_ADD)}
							>
								{t.magasin.newStore}
							</Button>
							{selectedIds.length > 0 && (
								<Button
									variant="outlined"
									color="error"
									startIcon={<DeleteIcon fontSize="small" />}
									onClick={() => setShowBulkDeleteModal(true)}
								>
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
						checkboxSelection
						onSelectionChange={setSelectedIds}
						selectedIds={selectedIds}
					/>
				</Box>
				{deleteTarget !== null && (
					<ActionModals
						title={t.magasin.deleteStoreTitle}
						body={t.magasin.deleteStoreBody}
						titleIcon={<DeleteIcon />}
						titleIconColor="#D32F2F"
						actions={[
							{
								text: t.common.cancel,
								active: false,
								onClick: () => setDeleteTarget(null),
								icon: <CloseIcon />,
								color: '#6B6B6B',
							},
							{ text: t.common.delete, active: true, onClick: deleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
						]}
					/>
				)}
				{showBulkDeleteModal && (
					<ActionModals
						title={t.magasin.deleteStoresTitle(selectedIds.length)}
						body={t.magasin.deleteStoresBody(selectedIds.length)}
						titleIcon={<DeleteIcon />}
						titleIconColor="#D32F2F"
						actions={[
							{
								text: t.common.cancel,
								active: false,
								onClick: () => setShowBulkDeleteModal(false),
								icon: <CloseIcon />,
								color: '#6B6B6B',
							},
							{
								text: t.common.delete,
								active: true,
								onClick: bulkDeleteHandler,
								icon: <DeleteIcon />,
								color: '#D32F2F',
							},
						]}
					/>
				)}
			</Protected>
		</NavigationBar>
	);
};

export default StoresListClient;
