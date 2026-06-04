'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Close as CloseIcon, Delete as DeleteIcon, PointOfSale as PointOfSaleIcon } from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
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
									<Card elevation={2}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<PointOfSaleIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>#{sale.id}</Typography>
												<Chip size="small" label={sale.status} color={sale.status === 'void' ? 'default' : 'success'} />
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<Stack spacing={1}>
												<Typography>{t.magasin.store}: {sale.store_name}</Typography>
												<Typography>{t.magasin.date}: {formatDate(sale.date_created)}</Typography>
												<Typography>{t.magasin.seller}: {sale.seller_email ?? '-'}</Typography>
												<Typography>{t.magasin.paymentMode}: {sale.payment_mode_name ?? '-'}</Typography>
												<Typography>{t.magasin.paymentStatus}: {sale.payment_status}</Typography>
												<Typography>{t.magasin.subtotal}: {formatNumber(sale.subtotal)} Dhs</Typography>
												<Typography>{t.magasin.discountAmount}: {formatNumber(sale.discount_amount)} Dhs</Typography>
												<Typography>{t.magasin.paidAmount}: {formatNumber(sale.paid_amount)} Dhs</Typography>
												<Typography>{t.magasin.changeAmount}: {formatNumber(sale.change_amount)} Dhs</Typography>
												<Typography fontWeight={700}>{t.magasin.total}: {formatNumber(sale.total)} Dhs</Typography>
											</Stack>
										</CardContent>
									</Card>
									<Card elevation={2}>
										<CardContent sx={{ p: 3 }}>
											<Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>{t.magasin.saleLines}</Typography>
											{sale.lines.length > 0 && (
												<Table size="small">
													<TableHead>
														<TableRow>
															<TableCell>{t.magasin.product}</TableCell>
															<TableCell align="right">{t.magasin.quantity}</TableCell>
															<TableCell align="right">{t.magasin.unitPrice}</TableCell>
															<TableCell align="right">{t.magasin.total}</TableCell>
														</TableRow>
													</TableHead>
													<TableBody>
														{sale.lines.map((line) => (
															<TableRow key={line.id}>
																<TableCell>{line.product_reference ?? line.product_barcode} - {line.product_name}</TableCell>
																<TableCell align="right">{formatNumber(line.quantity)}</TableCell>
																<TableCell align="right">{formatNumber(line.unit_price)} Dhs</TableCell>
																<TableCell align="right">{formatNumber(line.total)} Dhs</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											)}
											{sale.promotion_lines.length > 0 && (
												<Box sx={{ mt: sale.lines.length > 0 ? 3 : 0 }}>
													<Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>{t.magasin.salePromotionLines}</Typography>
													<Table size="small">
														<TableHead>
															<TableRow>
																<TableCell>{t.magasin.promotion}</TableCell>
																<TableCell align="right">{t.magasin.quantity}</TableCell>
																<TableCell align="right">{t.magasin.unitPrice}</TableCell>
																<TableCell align="right">{t.magasin.total}</TableCell>
															</TableRow>
														</TableHead>
														<TableBody>
															{sale.promotion_lines.map((line) => (
																<TableRow key={line.id}>
																	<TableCell>{line.promotion_name}</TableCell>
																	<TableCell align="right">{formatNumber(line.quantity)}</TableCell>
																	<TableCell align="right">{formatNumber(line.unit_price)} Dhs</TableCell>
																	<TableCell align="right">{formatNumber(line.total)} Dhs</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</Box>
											)}
										</CardContent>
									</Card>
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
