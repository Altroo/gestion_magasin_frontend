'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	CalendarMonth as CalendarIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Inventory2 as InventoryIcon,
	LocalOffer as LocalOfferIcon,
	Numbers as NumbersIcon,
	Storefront as StorefrontIcon,
} from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeletePromotionMutation, useGetPromotionQuery } from '@/store/services/magasin';
import { PROMOTIONS_EDIT, PROMOTIONS_LIST } from '@/utils/routes';
import { extractApiErrorMessage, formatDate, formatNumber } from '@/utils/helpers';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';

type Props = SessionProps & {
	id: number;
	storeId?: number;
};

const InfoRow = ({ icon, label, value }: { icon: ReactNode; label: string; value?: ReactNode }) => (
	<Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1.5 }}>
		<Box sx={{ color: 'primary.main', display: 'flex', width: 28 }}>{icon}</Box>
		<Box sx={{ flex: 1, minWidth: 0 }}>
			<Typography variant="caption" color="text.secondary">{label}</Typography>
			<Typography variant="body2" fontWeight={600}>{value || '-'}</Typography>
		</Box>
	</Stack>
);

const PromotionsViewClient = ({ session, id, storeId: initialStoreId }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const { defaultStore } = useSelectedStore(token);
	const storeId = initialStoreId ?? defaultStore?.id;
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const { data: promotion, isLoading, error } = useGetPromotionQuery({ id }, { skip: !token });
	const [deletePromotion] = useDeletePromotionMutation();
	const axiosError = useMemo(() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined), [error]);

	const handleDelete = async () => {
		try {
			await deletePromotion({ id }).unwrap();
			onSuccess(t.magasin.promotionDeleted);
			router.push(PROMOTIONS_LIST);
		} catch (deleteError) {
			onError(extractApiErrorMessage(deleteError, t.magasin.promotionDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	return (
		<NavigationBar title={t.magasin.promotionDetails}>
			<Protected permission="can_view">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(PROMOTIONS_LIST)}>
									{t.magasin.backToPromotions}
								</Button>
								{promotion && (
									<Stack direction="row" spacing={1}>
										{permissions.can_create_promotion && (
											<Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => router.push(PROMOTIONS_EDIT(id, storeId))}>
												{t.common.edit}
											</Button>
										)}
										{permissions.can_create_promotion && (
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
							) : !promotion ? (
								<Alert severity="warning">{t.magasin.noRows}</Alert>
							) : (
								<Stack spacing={3}>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<LocalOfferIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{promotion.name}</Typography>
												<Chip
													size="small"
													color={promotion.status === 'active' ? 'success' : 'default'}
													label={promotion.status === 'active' ? t.magasin.activePromotion : t.magasin.expiredPromotion}
												/>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<InfoRow icon={<StorefrontIcon />} label={t.magasin.store} value={promotion.store_name} />
											<Divider />
											<InfoRow icon={<NumbersIcon />} label={t.magasin.sellingPrice} value={`${formatNumber(promotion.selling_price)} Dhs`} />
											<Divider />
											<InfoRow icon={<CalendarIcon />} label={t.magasin.startDate} value={formatDate(promotion.start_date)} />
											<Divider />
											<InfoRow icon={<CalendarIcon />} label={t.magasin.endDate} value={formatDate(promotion.end_date)} />
											<Divider />
											<InfoRow icon={<DescriptionIcon />} label={t.magasin.note} value={promotion.note} />
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<InventoryIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{t.magasin.promotionLines}</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<Table size="small">
												<TableHead>
													<TableRow>
														<TableCell>{t.magasin.product}</TableCell>
														<TableCell>{t.magasin.reference}</TableCell>
														<TableCell align="right">{t.magasin.quantity}</TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{promotion.lines.map((line) => (
														<TableRow key={line.id}>
															<TableCell>{line.product_name}</TableCell>
															<TableCell>{line.product_reference ?? line.product_barcode ?? '-'}</TableCell>
															<TableCell align="right">{formatNumber(line.quantity)}</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
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
					title={t.magasin.deletePromotionTitle}
					body={t.magasin.deletePromotionBody}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					actions={[
						{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
						{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
					]}
				/>
			)}
		</NavigationBar>
	);
};

export default PromotionsViewClient;
