'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Chip,
	Divider,
	Stack,
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
import { DetailCard, DetailHeaderCard, InfoRow, LineItemsCard, StatusChip } from '@/components/pages/magasin/shared/view-components';
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
									<DetailHeaderCard
										icon={<LocalOfferIcon />}
										title={promotion.name}
										chips={(
											<>
												<Chip label={`ID: ${promotion.id}`} size="small" variant="outlined" />
												<StatusChip t={t} status={promotion.status} />
											</>
										)}
									/>
									<DetailCard icon={<LocalOfferIcon />} title={t.magasin.promotionDetails}>
										<InfoRow icon={<StorefrontIcon />} label={t.magasin.store} value={promotion.store_name} />
										<Divider />
										<InfoRow icon={<NumbersIcon />} label={t.magasin.sellingPrice} value={`${formatNumber(promotion.selling_price)} Dhs`} />
										<Divider />
										<InfoRow icon={<CalendarIcon />} label={t.magasin.startDate} value={formatDate(promotion.start_date)} />
										<Divider />
										<InfoRow icon={<CalendarIcon />} label={t.magasin.endDate} value={formatDate(promotion.end_date)} />
										<Divider />
										<InfoRow icon={<DescriptionIcon />} label={t.magasin.note} value={promotion.note} />
									</DetailCard>
									<LineItemsCard
										icon={<InventoryIcon />}
										title={t.magasin.promotionLines}
										rows={promotion.lines}
										getRowKey={(line) => line.id}
										emptyLabel={t.magasin.noRows}
										columns={[
											{ key: 'product', label: t.magasin.product, render: (line) => line.product_name },
											{ key: 'reference', label: t.magasin.reference, render: (line) => line.product_reference ?? line.product_barcode ?? '-' },
											{ key: 'quantity', label: t.magasin.quantity, align: 'right', render: (line) => formatNumber(line.quantity) },
										]}
									/>
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
