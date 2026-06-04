'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Chip, Divider, Stack } from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	CalendarMonth as CalendarIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Description as DescriptionIcon,
	Inventory2 as InventoryIcon,
	LocalOffer as LocalOfferIcon,
	Numbers as NumbersIcon,
	Payment as PaymentIcon,
	Person as PersonIcon,
	PointOfSale as PointOfSaleIcon,
	Storefront as StorefrontIcon,
} from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { DetailCard, DetailHeaderCard, InfoRow, LineItemsCard, StatusChip } from '@/components/pages/magasin/shared/view-components';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetSaleQuery, useVoidSaleMutation } from '@/store/services/magasin';
import { SALES_LIST } from '@/utils/routes';
import { extractApiErrorMessage, formatDate, formatNumber } from '@/utils/helpers';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';

type Props = SessionProps & {
	id: number;
};

const SalesViewClient = ({ session, id }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const [showVoidModal, setShowVoidModal] = useState(false);
	const { data: sale, isLoading, error } = useGetSaleQuery({ id }, { skip: !token });
	const [voidSale] = useVoidSaleMutation();
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);

	const handleVoid = async () => {
		try {
			await voidSale({ id }).unwrap();
			onSuccess(t.magasin.saleVoided);
		} catch (voidError) {
			onError(extractApiErrorMessage(voidError, t.magasin.saleVoidError));
		} finally {
			setShowVoidModal(false);
		}
	};

	return (
		<NavigationBar title={t.magasin.saleDetails}>
			<Protected permission="can_view">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(SALES_LIST)}>
									{t.magasin.backToSales}
								</Button>
								{sale && sale.status !== 'void' && permissions.can_delete && (
									<Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setShowVoidModal(true)}>
										{t.magasin.voidSale}
									</Button>
								)}
							</Stack>
							{isLoading ? (
								<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
							) : (axiosError?.status as number) > 400 ? (
								<ApiAlert errorDetails={axiosError?.data.details} />
							) : !sale ? (
								<Alert severity="warning">{t.magasin.noRows}</Alert>
							) : (
								<Stack spacing={3}>
									<DetailHeaderCard
										icon={<PointOfSaleIcon />}
										title={`#${sale.id}`}
										chips={(
											<>
												<Chip label={`ID: ${sale.id}`} size="small" variant="outlined" />
												<StatusChip t={t} status={sale.status} />
											</>
										)}
									/>
									<DetailCard icon={<PointOfSaleIcon />} title={t.magasin.saleDetails}>
										<InfoRow icon={<StorefrontIcon />} label={t.magasin.store} value={sale.store_name} />
										<Divider />
										<InfoRow icon={<CalendarIcon />} label={t.magasin.date} value={formatDate(sale.date_created)} />
										<Divider />
										<InfoRow icon={<PersonIcon />} label={t.magasin.seller} value={sale.seller_email} />
										<Divider />
										<InfoRow icon={<PaymentIcon />} label={t.magasin.paymentMode} value={sale.payment_mode_name} />
										<Divider />
										<InfoRow icon={<DescriptionIcon />} label={t.magasin.note} value={sale.note} />
									</DetailCard>
									<DetailCard icon={<PaymentIcon />} title={t.magasin.paymentStatus}>
										<InfoRow icon={<PaymentIcon />} label={t.magasin.paymentStatus} value={<StatusChip t={t} status={sale.payment_status} />} />
										<Divider />
										<InfoRow icon={<NumbersIcon />} label={t.magasin.subtotal} value={`${formatNumber(sale.subtotal)} Dhs`} />
										<Divider />
										<InfoRow icon={<NumbersIcon />} label={t.magasin.discountAmount} value={`${formatNumber(sale.discount_amount)} Dhs`} />
										<Divider />
										<InfoRow icon={<NumbersIcon />} label={t.magasin.paidAmount} value={`${formatNumber(sale.paid_amount)} Dhs`} />
										<Divider />
										<InfoRow icon={<NumbersIcon />} label={t.magasin.changeAmount} value={`${formatNumber(sale.change_amount)} Dhs`} />
										<Divider />
										<InfoRow icon={<NumbersIcon />} label={t.magasin.total} value={`${formatNumber(sale.total)} Dhs`} />
									</DetailCard>
									<LineItemsCard
										icon={<InventoryIcon />}
										title={t.magasin.saleLines}
										rows={sale.lines}
										getRowKey={(line) => line.id}
										emptyLabel={t.magasin.noRows}
										columns={[
											{ key: 'product', label: t.magasin.product, render: (line) => `${line.product_reference ?? line.product_barcode ?? '-'} - ${line.product_name}` },
											{ key: 'quantity', label: t.magasin.quantity, align: 'right', render: (line) => formatNumber(line.quantity) },
											{ key: 'unitPrice', label: t.magasin.unitPrice, align: 'right', render: (line) => `${formatNumber(line.unit_price)} Dhs` },
											{ key: 'total', label: t.magasin.total, align: 'right', render: (line) => `${formatNumber(line.total)} Dhs` },
										]}
									/>
									{sale.promotion_lines.length > 0 && (
										<LineItemsCard
											icon={<LocalOfferIcon />}
											title={t.magasin.salePromotionLines}
											rows={sale.promotion_lines}
											getRowKey={(line) => line.id}
											emptyLabel={t.magasin.noRows}
											columns={[
												{ key: 'promotion', label: t.magasin.promotion, render: (line) => line.promotion_name },
												{ key: 'quantity', label: t.magasin.quantity, align: 'right', render: (line) => formatNumber(line.quantity) },
												{ key: 'unitPrice', label: t.magasin.unitPrice, align: 'right', render: (line) => `${formatNumber(line.unit_price)} Dhs` },
												{ key: 'total', label: t.magasin.total, align: 'right', render: (line) => `${formatNumber(line.total)} Dhs` },
											]}
										/>
									)}
								</Stack>
							)}
						</Stack>
					</Box>
				</Box>
			</Protected>
			{showVoidModal && (
				<ActionModals
					title={t.magasin.voidSaleTitle}
					body={t.magasin.voidSaleBody}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					actions={[
						{ text: t.common.cancel, active: false, onClick: () => setShowVoidModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
						{ text: t.magasin.voidSale, active: true, onClick: handleVoid, icon: <DeleteIcon />, color: '#D32F2F' },
					]}
				/>
			)}
		</NavigationBar>
	);
};

export default SalesViewClient;
