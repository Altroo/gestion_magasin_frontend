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
	Event as EventIcon,
	Fingerprint as FingerprintIcon,
	Inventory2 as InventoryIcon,
	QrCodeScanner as QrCodeScannerIcon,
	Straighten as StraightenIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
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

type Props = SessionProps & {
	id: number;
	storeId?: number;
};

type InfoRowProps = {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
};

const InfoRow = ({ icon, label, value }: InfoRowProps) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue = isValidElement(value) ? value : value || '-';

	return (
		<Stack direction="row" spacing={2} alignItems="flex-start" sx={{ py: 1.5, flexWrap: 'wrap' }}>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', minWidth: 40 }}>{icon}</Box>
			<Stack direction="row" spacing={isMobile ? 0 : 2} alignItems="center" sx={{ flex: 1, flexWrap: 'wrap' }}>
				<Typography fontWeight={600} color="text.secondary" sx={{ minWidth: { xs: '100%', sm: 220 }, wordBreak: 'break-word' }}>
					{label}
				</Typography>
				<Box sx={{ flex: 1 }}>
					{isValidElement(displayValue) ? displayValue : <Typography sx={{ color: 'text.primary' }}>{displayValue}</Typography>}
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
	const { data: product, isLoading, error } = useGetProductQuery({ id, store: storeId }, { skip: !token || !storeId });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const [deleteProduct] = useDeleteProductMutation();

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
							<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(CATALOG_LIST)}>
									{t.magasin.backToCatalog}
								</Button>
								{!isLoading && !error && product && (
									<Stack direction="row" gap={1} flexWrap="wrap">
										{permissions.can_edit && (
											<Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => router.push(CATALOG_EDIT(id, storeId))}>
												{t.common.edit}
											</Button>
										)}
										{permissions.can_delete && (
											<Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setShowDeleteModal(true)}>
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
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<InventoryIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{product.name}</Typography>
											</Stack>
											<Stack direction="row" spacing={1} flexWrap="wrap">
												<Chip label={`ID: ${product.id}`} size="small" variant="outlined" />
												{product.is_active ? (
													<Chip icon={<CheckCircleIcon />} label={t.users.active} color="success" size="small" />
												) : (
													<Chip label={t.users.inactive} color="default" size="small" variant="outlined" />
												)}
												{product.compliance_required && <Chip icon={<WarningIcon />} label={t.magasin.complianceRequired} color="warning" size="small" />}
											</Stack>
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<DescriptionIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{t.magasin.productInformation}</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<InfoRow icon={<FingerprintIcon />} label={t.magasin.reference} value={product.reference} />
											<Divider />
											<InfoRow icon={<QrCodeScannerIcon />} label={t.magasin.barcodeValue} value={product.barcode} />
											<Divider />
											<InfoRow icon={<CategoryIcon />} label={t.magasin.category} value={product.category_name} />
											<Divider />
											<InfoRow icon={<StraightenIcon />} label={t.magasin.unit} value={product.unit} />
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<CreditCardIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{t.magasin.pricing}</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<InfoRow icon={<CreditCardIcon />} label={t.magasin.purchasePrice} value={`${formatNumber(product.purchase_price)} Dhs`} />
											<Divider />
											<InfoRow icon={<CreditCardIcon />} label={t.magasin.wholesalePrice} value={`${formatNumber(product.wholesale_price)} Dhs`} />
											<Divider />
											<InfoRow icon={<CreditCardIcon />} label={t.magasin.detailPrice} value={`${formatNumber(product.detail_price)} Dhs`} />
											<Divider />
											<InfoRow icon={<CreditCardIcon />} label={t.magasin.counterPrice} value={`${formatNumber(product.counter_price)} Dhs`} />
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<InventoryIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{t.magasin.stockSettings}</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<InfoRow icon={<InventoryIcon />} label={t.magasin.currentStock} value={product.available_stock} />
											<Divider />
											<InfoRow icon={<InventoryIcon />} label={t.magasin.minimumStock} value={product.min_stock ?? product.default_stock_alert} />
											<Divider />
											<InfoRow icon={<EventIcon />} label={t.magasin.expirationDate} value={formatDateShort(product.expiration_date)} />
											<Divider />
											<InfoRow icon={<EventIcon />} label={t.magasin.shelfLifeDays} value={product.shelf_life_days} />
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
						{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
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
