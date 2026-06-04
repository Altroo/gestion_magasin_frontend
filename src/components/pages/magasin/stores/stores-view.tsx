'use client';

import React, { isValidElement, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	CheckCircle as CheckCircleIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Group as GroupIcon,
	LocationOn as LocationOnIcon,
	Phone as PhoneIcon,
	Storefront as StorefrontIcon,
	Tag as TagIcon,
} from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteStoreMutation, useGetStoreQuery } from '@/store/services/magasin';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { extractApiErrorMessage } from '@/utils/helpers';
import { STORES_EDIT, STORES_LIST } from '@/utils/routes';
import { useLanguage, useToast } from '@/utils/hooks';

type Props = SessionProps & {
	id: number;
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

const StoresViewClient = ({ session, id }: Props) => {
	const token = useInitAccessToken(session);
	const router = useRouter();
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const { data: store, isLoading, error } = useGetStoreQuery({ id }, { skip: !token });
	const [deleteStore] = useDeleteStoreMutation();
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);

	const handleDelete = async () => {
		try {
			await deleteStore({ id }).unwrap();
			onSuccess(t.magasin.storeDeleted);
			router.push(STORES_LIST);
		} catch (deleteError) {
			onError(extractApiErrorMessage(deleteError, t.magasin.storeDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	return (
		<NavigationBar title={t.magasin.storeDetails}>
			<Protected>
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(STORES_LIST)}>
									{t.magasin.backToStores}
								</Button>
								{!isLoading && !error && store && (
									<Stack direction="row" gap={1} flexWrap="wrap">
										<Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => router.push(STORES_EDIT(id))}>
											{t.common.edit}
										</Button>
										<Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setShowDeleteModal(true)}>
											{t.common.delete}
										</Button>
									</Stack>
								)}
							</Stack>
							{isLoading ? (
								<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
							) : (axiosError?.status as number) > 400 ? (
								<ApiAlert errorDetails={axiosError?.data.details} />
							) : !store ? (
								<Alert severity="warning">{t.magasin.storeNotFound}</Alert>
							) : (
								<Stack spacing={3}>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<StorefrontIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{store.name}</Typography>
											</Stack>
											<Stack direction="row" spacing={1} flexWrap="wrap">
												<Chip label={`ID: ${store.id}`} size="small" variant="outlined" />
												{store.is_active ? (
													<Chip icon={<CheckCircleIcon />} label={t.users.active} color="success" size="small" />
												) : (
													<Chip label={t.users.inactive} color="default" size="small" variant="outlined" />
												)}
											</Stack>
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<StorefrontIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{t.magasin.storeInformation}</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<InfoRow icon={<StorefrontIcon />} label={t.magasin.store} value={store.name} />
											<Divider />
											<InfoRow icon={<TagIcon />} label={t.magasin.storeCode} value={store.code} />
											<Divider />
											<InfoRow icon={<LocationOnIcon />} label={t.magasin.storeAddress} value={store.address} />
											<Divider />
											<InfoRow icon={<PhoneIcon />} label={t.magasin.storePhone} value={store.phone} />
											<Divider />
											<InfoRow icon={<GroupIcon />} label={t.magasin.membersCount} value={store.members_count ?? 0} />
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
					title={t.magasin.deleteStoreTitle}
					body={t.magasin.deleteStoreBody}
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

export default StoresViewClient;
