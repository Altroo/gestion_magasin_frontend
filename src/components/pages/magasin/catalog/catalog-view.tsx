'use client';

import React, { isValidElement, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Category as CategoryIcon,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	CreditCard as CreditCardIcon,
	Delete as DeleteIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Fingerprint as FingerprintIcon,
	Inventory2 as InventoryIcon,
	QrCodeScanner as QrCodeScannerIcon,
	Straighten as StraightenIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteProductMutation, useGetProductQuery } from '@/store/services/magasin';
import { CATALOG_EDIT, CATALOG_LIST } from '@/utils/routes';
import { extractApiErrorMessage, formatDateShort, formatNumber } from '@/utils/helpers';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { ProductStockTrackingItemType } from '@/types/gestionMagasinTypes';

type Props = SessionProps & {
	id: number;
	storeId?: number;
};

type InfoRowProps = {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
};

type StockTrackingGridRow = Omit<ProductStockTrackingItemType, 'id'> & {
	id: number;
};

const InfoRow = ({ icon, label, value }: InfoRowProps) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue = isValidElement(value) ? value : value || '-';

	return (
		<Stack
			direction="row"
			spacing={2}
			sx={{
				alignItems: 'flex-start',
				py: 1.5,
				flexWrap: 'wrap',
			}}
		>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', minWidth: 40 }}>{icon}</Box>
			<Stack
				direction="row"
				spacing={isMobile ? 0 : 2}
				sx={{
					alignItems: 'center',
					flex: 1,
					flexWrap: 'wrap',
				}}
			>
				<Typography
					sx={{
						fontWeight: 600,
						color: 'text.secondary',
						minWidth: { xs: '100%', sm: 220 },
						wordBreak: 'break-word',
					}}
				>
					{label}
				</Typography>
				<Box sx={{ flex: 1 }}>
					{isValidElement(displayValue) ? (
						displayValue
					) : (
						<Typography sx={{ color: 'text.primary' }}>{displayValue}</Typography>
					)}
				</Box>
			</Stack>
		</Stack>
	);
};

const CatalogViewClient = ({ session, id, storeId: initialStoreId }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const { defaultStore } = useSelectedStore(token);
	const storeId = initialStoreId ?? defaultStore?.id;
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [stockPaginationModel, setStockPaginationModel] = useState<GridPaginationModel>({
		page: 0,
		pageSize: 5,
	});
	const { data: product, isLoading, error } = useGetProductQuery({ id, store: storeId }, { skip: !token || !storeId });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const [deleteProduct] = useDeleteProductMutation();
	const stockTrackingRows: StockTrackingGridRow[] = (
		product?.stock_tracking_items?.length
			? product.stock_tracking_items
			: product
				? [
						{
							default_stock_alert: product.default_stock_alert,
							expiration_date: product.expiration_date,
							requires_expiration_date: product.requires_expiration_date,
							shelf_life_days: product.shelf_life_days ?? null,
						},
					]
				: []
	).map((item, index) => ({
		...item,
		id: item.id ?? index + 1,
	}));
	const stockTrackingColumns = useMemo<GridColDef<StockTrackingGridRow>[]>(
		() => [
			{
				field: 'default_stock_alert',
				headerName: t.magasin.defaultStockAlert,
				flex: 1,
				minWidth: 210,
			},
			{
				field: 'expiration_date',
				headerName: t.magasin.expirationDate,
				flex: 1,
				minWidth: 180,
				renderCell: ({ row }) => formatDateShort(row.expiration_date),
			},
			{
				field: 'requires_expiration_date',
				headerName: t.magasin.expirationTracking,
				flex: 1,
				minWidth: 220,
				renderCell: ({ row }) => (row.requires_expiration_date ? t.common.yes : t.common.no),
			},
			{
				field: 'shelf_life_days',
				headerName: t.magasin.shelfLifeDays,
				flex: 0.8,
				minWidth: 180,
				renderCell: ({ row }) => row.shelf_life_days ?? '-',
			},
		],
		[t],
	);

	const handleDelete = async () => {
		try {
			await deleteProduct({ id, store: storeId }).unwrap();
			onSuccess(t.magasin.productDeleted);
			router.push(CATALOG_LIST);
		} catch (deleteError) {
			onError(extractApiErrorMessage(deleteError, t.magasin.productDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	return (
		<NavigationBar title={t.magasin.productDetails}>
			<Protected permission="can_view">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Stack
								direction={{ xs: 'column', sm: 'row' }}
								spacing={2}
								sx={{
									justifyContent: 'space-between',
									alignItems: { xs: 'stretch', sm: 'center' },
								}}
							>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(CATALOG_LIST)}>
									{t.magasin.backToCatalog}
								</Button>
								{!isLoading && !error && product && (
									<Stack
										direction="row"
										sx={{
											gap: 1,
											flexWrap: 'wrap',
										}}
									>
										{permissions.can_edit && (
											<Button
												variant="outlined"
												size="small"
												startIcon={<EditIcon />}
												onClick={() => router.push(CATALOG_EDIT(id, storeId))}
											>
												{t.common.edit}
											</Button>
										)}
										{permissions.can_delete && (
											<Button
												variant="outlined"
												color="error"
												size="small"
												startIcon={<DeleteIcon />}
												onClick={() => setShowDeleteModal(true)}
											>
												{t.common.delete}
											</Button>
										)}
									</Stack>
								)}
							</Stack>
							{isLoading ? (
								<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
							) : (axiosError?.status as number) > 400 ? (
								<ApiAlert errorDetails={axiosError?.data.details} />
							) : !product ? (
								<Alert severity="warning">{t.magasin.noRows}</Alert>
							) : (
								<Stack spacing={3}>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack
												direction="row"
												spacing={2}
												sx={{
													alignItems: 'center',
													mb: 2,
												}}
											>
												<InventoryIcon color="primary" />
												<Typography
													variant="h6"
													sx={{
														fontWeight: 700,
													}}
												>
													{product.name}
												</Typography>
											</Stack>
											<Stack
												direction="row"
												spacing={1}
												sx={{
													flexWrap: 'wrap',
												}}
											>
												<Chip label={`ID: ${product.id}`} size="small" variant="outlined" />
												{product.is_active ? (
													<Chip icon={<CheckCircleIcon />} label={t.users.active} color="success" size="small" />
												) : (
													<Chip label={t.users.inactive} color="default" size="small" variant="outlined" />
												)}
											</Stack>
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack
												direction="row"
												spacing={2}
												sx={{
													alignItems: 'center',
													mb: 2,
												}}
											>
												<DescriptionIcon color="primary" />
												<Typography
													variant="h6"
													sx={{
														fontWeight: 700,
													}}
												>
													{t.magasin.productInformation}
												</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<InfoRow icon={<FingerprintIcon />} label={t.magasin.reference} value={product.reference} />
											<Divider />
											<InfoRow icon={<QrCodeScannerIcon />} label={t.magasin.barcodeValue} value={product.barcode} />
											<Divider />
											<InfoRow icon={<CategoryIcon />} label={t.magasin.category} value={product.category_name} />
											<Divider />
											<InfoRow icon={<StraightenIcon />} label={t.magasin.unit} value={product.unit_name} />
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack
												direction="row"
												spacing={2}
												sx={{
													alignItems: 'center',
													mb: 2,
												}}
											>
												<CreditCardIcon color="primary" />
												<Typography
													variant="h6"
													sx={{
														fontWeight: 700,
													}}
												>
													{t.magasin.pricing}
												</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<InfoRow
												icon={<CreditCardIcon />}
												label={t.magasin.purchasePrice}
												value={`${formatNumber(product.purchase_price)} Dhs`}
											/>
											<Divider />
											<InfoRow
												icon={<CreditCardIcon />}
												label={t.magasin.wholesalePrice}
												value={`${formatNumber(product.wholesale_price)} Dhs`}
											/>
											<Divider />
											<InfoRow
												icon={<CreditCardIcon />}
												label={t.magasin.detailPrice}
												value={`${formatNumber(product.detail_price)} Dhs`}
											/>
											<Divider />
											<InfoRow
												icon={<CreditCardIcon />}
												label={t.magasin.counterPrice}
												value={`${formatNumber(product.counter_price)} Dhs`}
											/>
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack
												direction="row"
												spacing={2}
												sx={{
													alignItems: 'center',
													mb: 2,
												}}
											>
												<InventoryIcon color="primary" />
												<Typography
													variant="h6"
													sx={{
														fontWeight: 700,
													}}
												>
													{t.magasin.stockSettings}
												</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<InfoRow
												icon={<InventoryIcon />}
												label={t.magasin.currentStock}
												value={product.available_stock}
											/>
											<Divider />
											<Box sx={{ width: '100%', mt: 2 }}>
												<DataGrid
													rows={stockTrackingRows}
													columns={stockTrackingColumns}
													localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
													disableRowSelectionOnClick
													paginationModel={stockPaginationModel}
													onPaginationModelChange={setStockPaginationModel}
													pageSizeOptions={[5, 10, 25]}
													sx={{
														border: 'none',
														'& .MuiDataGrid-columnHeaderTitle': {
															fontWeight: 700,
															whiteSpace: 'normal',
															lineHeight: 1.25,
														},
														'& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
															outline: 'none',
														},
													}}
												/>
											</Box>
										</CardContent>
									</Card>
								</Stack>
							)}
						</Stack>
					</Box>
				</Box>
			</Protected>
			{showDeleteModal && (
				<ActionModals
					title={t.magasin.deleteProductTitle}
					body={t.magasin.deleteProductBody}
					actions={[
						{
							text: t.common.cancel,
							active: false,
							onClick: () => setShowDeleteModal(false),
							icon: <CloseIcon />,
							color: '#6B6B6B',
						},
						{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
					]}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</NavigationBar>
	);
};

export default CatalogViewClient;
