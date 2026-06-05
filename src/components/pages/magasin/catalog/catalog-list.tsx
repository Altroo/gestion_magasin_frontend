'use client';

import React, { ChangeEvent, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Button,
	CircularProgress,
	IconButton,
	Stack,
	Typography,
} from '@mui/material';
import {
	Add as AddIcon,
	Cancel as CancelIcon,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Email as EmailIcon,
	FileUpload as FileUploadIcon,
	Visibility as VisibilityIcon,
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
	useBulkDeleteProductsMutation,
	useDeleteProductMutation,
	useGetProductsQuery,
	useImportProductsMutation,
	useSendCSVExampleEmailMutation,
} from '@/store/services/magasin';
import { CATALOG_ADD, CATALOG_EDIT, CATALOG_VIEW } from '@/utils/routes';
import { extractApiErrorMessage, formatNumber } from '@/utils/helpers';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import type { SessionProps } from '@/types/_initTypes';
import type { ProductType } from '@/types/gestionMagasinTypes';

const roleCanManage = (role?: string) => role === 'direction' || role === 'responsable';

const CatalogClient = ({ session }: SessionProps) => {
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
	const fileInputRef = useRef<HTMLInputElement | null>(null);

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
	} = useGetProductsQuery(
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

	const [deleteProduct] = useDeleteProductMutation();
	const [bulkDeleteProducts] = useBulkDeleteProductsMutation();
	const [importProducts, importState] = useImportProductsMutation();
	const [sendCSVExampleEmail, sendGuideState] = useSendCSVExampleEmailMutation();

	const resetSelection = () => setSelectedIds([]);

	const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file || !storeId) {
			return;
		}
		try {
			await importProducts({ store: storeId, file }).unwrap();
			onSuccess(t.magasin.importArticles);
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.errors.genericError));
		}
	};

	const handleSendImportGuide = async () => {
		if (!storeId) {
			return;
		}
		try {
			await sendCSVExampleEmail({ store: storeId }).unwrap();
			onSuccess(t.magasin.importArticlesGuideEmailSent);
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.importArticlesGuideEmailError));
		}
	};

	const deleteHandler = async () => {
		if (!deleteTarget) return;
		try {
			await deleteProduct({ id: deleteTarget, store: storeId }).unwrap();
			onSuccess(t.magasin.productDeleted);
			setSelectedIds((current) => current.filter((id) => id !== deleteTarget));
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.productDeleteError));
		} finally {
			setDeleteTarget(null);
		}
	};

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteProducts({ ids: selectedIds, store: storeId }).unwrap();
			onSuccess(t.magasin.bulkProductsDeleted(selectedIds.length));
			resetSelection();
			refetch();
		} catch (error) {
			onError(extractApiErrorMessage(error, t.magasin.productDeleteError));
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
				label: t.users.active,
				paramName: 'is_active',
				options: [
					{ id: 'true', nom: t.users.active },
					{ id: 'false', nom: t.users.inactive },
				],
			},
		],
		[t.users.active, t.users.inactive],
	);

	const columns: GridColDef[] = [
		{
			field: 'reference',
			headerName: t.magasin.reference,
			flex: 1,
			minWidth: 120,
			renderCell: (params: GridRenderCellParams<ProductType>) => (
				<DarkTooltip title={params.value ?? '-'}>
					<Typography variant="body2" noWrap>{params.value ?? '-'}</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'barcode',
			headerName: t.magasin.barcodeValue,
			flex: 1,
			minWidth: 130,
			renderCell: (params: GridRenderCellParams<ProductType>) => (
				<DarkTooltip title={params.value ?? '-'}>
					<Typography variant="body2" noWrap>{params.value ?? '-'}</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'name',
			headerName: t.magasin.product,
			flex: 1.8,
			minWidth: 180,
			renderCell: (params: GridRenderCellParams<ProductType>) => (
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
			renderCell: (params: GridRenderCellParams<ProductType>) => (
				<Typography variant="body2" noWrap>{params.value ?? '-'}</Typography>
			),
		},
		{
			field: 'counter_price',
			headerName: t.magasin.counterPrice,
			flex: 0.9,
			minWidth: 120,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<ProductType>) => (
				<Typography variant="body2" color="primary" fontWeight={600} noWrap>
					{formatNumber(params.value as string)} Dhs
				</Typography>
			),
		},
		{
			field: 'available_stock',
			headerName: t.magasin.currentStock,
			flex: 0.8,
			minWidth: 120,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<ProductType>) => (
				<Typography variant="body2" noWrap>{params.value ?? '-'}</Typography>
			),
		},
		{
			field: 'min_stock',
			headerName: t.magasin.minimumStock,
			flex: 0.8,
			minWidth: 130,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<ProductType>) => (
				<Typography variant="body2" noWrap>{params.value ?? params.row.default_stock_alert}</Typography>
			),
		},
		{
			field: 'is_active',
			headerName: t.users.active,
			flex: 0.7,
			minWidth: 100,
			filterOperators: createBooleanFilterOperators(booleanFilterOptions, t.common.all),
			renderCell: (params: GridRenderCellParams<ProductType>) => (
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
			renderCell: (params: GridRenderCellParams<ProductType>) => {
				const actions = [
					{
						label: t.common.view,
						icon: <VisibilityIcon />,
						onClick: () => router.push(CATALOG_VIEW(params.row.id, storeId)),
						color: 'info' as const,
						show: permissions.can_view,
					},
					{
						label: t.common.edit,
						icon: <EditIcon />,
						onClick: () => router.push(CATALOG_EDIT(params.row.id, storeId)),
						color: 'primary' as const,
						show: permissions.can_edit && canManageStore,
					},
					{
						label: t.common.delete,
						icon: <DeleteIcon />,
						onClick: () => setDeleteTarget(params.row.id),
						color: 'error' as const,
						show: permissions.can_delete && canManageStore,
					},
				];

				return <MobileActionsMenu actions={actions} />;
			},
		},
	];

	return (
		<NavigationBar title={t.magasin.catalog}>
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
								<Button
									variant="contained"
									startIcon={<AddIcon fontSize="small" />}
									onClick={() => router.push(CATALOG_ADD(storeId))}
								>
									{t.magasin.newProduct}
								</Button>
							)}
							{selectedIds.length > 0 && permissions.can_delete && canManageStore && (
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
					<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} columns={2} />
					<input ref={fileInputRef} hidden type="file" accept=".xlsx,.xls" onChange={handleImport} />
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
						toolbarActions={
							permissions.can_create && canManageStore ? (
								<>
									<DarkTooltip title={t.magasin.importArticlesGuideEmail}>
										<IconButton
											size="small"
											color="default"
											disabled={sendGuideState.isLoading}
											onClick={handleSendImportGuide}
										>
											{sendGuideState.isLoading ? <CircularProgress size={20} /> : <EmailIcon />}
										</IconButton>
									</DarkTooltip>
									<DarkTooltip title={t.magasin.importArticles}>
										<IconButton
											size="small"
											color="default"
											disabled={importState.isLoading}
											onClick={() => fileInputRef.current?.click()}
										>
											{importState.isLoading ? <CircularProgress size={20} /> : <FileUploadIcon />}
										</IconButton>
									</DarkTooltip>
								</>
							) : undefined
						}
					/>
				</Box>
				{deleteTarget !== null && (
					<ActionModals
						title={t.magasin.deleteProductTitle}
						body={t.magasin.deleteProductBody}
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
							{
								text: t.common.delete,
								active: true,
								onClick: deleteHandler,
								icon: <DeleteIcon />,
								color: '#D32F2F',
							},
						]}
					/>
				)}
				{showBulkDeleteModal && (
					<ActionModals
						title={t.magasin.deleteProductsTitle(selectedIds.length)}
						body={t.magasin.deleteProductsBody(selectedIds.length)}
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

export default CatalogClient;
