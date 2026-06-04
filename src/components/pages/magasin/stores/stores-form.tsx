'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Checkbox,
	Divider,
	FormControlLabel,
	Stack,
	Typography,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	CheckCircle as CheckCircleIcon,
	Edit as EditIcon,
	LocationOn as LocationOnIcon,
	Phone as PhoneIcon,
	Save as SaveIcon,
	Storefront as StorefrontIcon,
	Tag as TagIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAddStoreMutation, useEditStoreMutation, useGetStoreQuery } from '@/store/services/magasin';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { StoreFormValues, StorePayload } from '@/types/gestionMagasinTypes';
import { extractApiErrorMessage, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { storeSchema } from '@/utils/formValidationSchemas';
import { STORES_LIST, STORES_VIEW } from '@/utils/routes';
import { textInputTheme } from '@/utils/themes';
import { useLanguage, useToast } from '@/utils/hooks';

const inputTheme = textInputTheme();

type Props = SessionProps & {
	id?: number;
};

const toPayload = (values: StoreFormValues): StorePayload => ({
	name: values.name.trim(),
	code: values.code.trim(),
	address: values.address.trim(),
	phone: values.phone.trim(),
	is_active: values.is_active,
});

const StoresFormClient = ({ session, id }: Props) => {
	const token = useInitAccessToken(session);
	const router = useRouter();
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const isEditMode = id !== undefined;
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [isPending, setIsPending] = useState(false);

	const { data: store, isLoading: isStoreLoading, error: storeError } = useGetStoreQuery({ id: id! }, { skip: !token || !isEditMode });
	const [addStore, addState] = useAddStoreMutation();
	const [editStore, editState] = useEditStoreMutation();

	const error = storeError || addState.error || editState.error;
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);

	const formik = useFormik<StoreFormValues>({
		initialValues: {
			name: store?.name ?? '',
			code: store?.code ?? '',
			address: store?.address ?? '',
			phone: store?.phone ?? '',
			is_active: store?.is_active ?? true,
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(storeSchema),
		onSubmit: async (values, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			setIsPending(true);
			try {
				if (isEditMode) {
					await editStore({ id: id!, data: toPayload(values) }).unwrap();
					onSuccess(t.magasin.storeUpdated);
					router.push(STORES_VIEW(id!));
				} else {
					const created = await addStore(toPayload(values)).unwrap();
					onSuccess(t.magasin.storeCreated);
					router.push(STORES_VIEW(created.id));
				}
			} catch (e) {
				onError(extractApiErrorMessage(e, isEditMode ? t.magasin.storeUpdateError : t.magasin.storeCreateError));
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			name: t.magasin.store,
			code: t.magasin.storeCode,
			address: t.magasin.storeAddress,
			phone: t.magasin.storePhone,
			is_active: t.magasin.activeStore,
			globalError: t.errors.globalError,
		}),
		[t],
	);

	const validationErrors = useMemo(() => {
		const errors: Record<string, string> = {};
		if (hasAttemptedSubmit) {
			Object.entries(formik.errors).forEach(([key, value]) => {
				if (key !== 'globalError' && typeof value === 'string') {
					errors[key] = value;
				}
			});
		}
		return errors;
	}, [formik.errors, hasAttemptedSubmit]);

	const isLoading = isPending || addState.isLoading || editState.isLoading || (isEditMode && isStoreLoading);
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	return (
		<NavigationBar title={isEditMode ? t.magasin.editStore : t.magasin.newStore}>
			<Protected>
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(STORES_LIST)} sx={{ alignSelf: 'flex-start' }}>
								{t.magasin.backToStores}
							</Button>
							{Object.keys(validationErrors).length > 0 && (
								<Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
									<Typography variant="subtitle2" fontWeight={600}>
										{t.users.validationErrorsDetected}
									</Typography>
									<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
										{Object.entries(validationErrors).map(([key, errorMessage]) => (
											<li key={key}>
												<Typography variant="body2">
													{getLabelForKey(fieldLabels, key)} : {errorMessage}
												</Typography>
											</li>
										))}
									</ul>
								</Alert>
							)}
							{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
							{isLoading ? (
								<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
							) : shouldShowError ? (
								<ApiAlert errorDetails={axiosError?.data.details} />
							) : (
								<form onSubmit={formik.handleSubmit}>
									<Stack spacing={3}>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
													<StorefrontIcon color="primary" />
													<Typography variant="h6" fontWeight={700}>{t.magasin.storeInformation}</Typography>
												</Stack>
												<Divider sx={{ mb: 3 }} />
												<Stack spacing={2.5}>
													<CustomTextInput
														id="name"
														type="text"
														label={`${t.magasin.store} *`}
														value={formik.values.name}
														onChange={formik.handleChange('name')}
														onBlur={formik.handleBlur('name')}
														error={formik.touched.name && Boolean(formik.errors.name)}
														helperText={formik.touched.name ? formik.errors.name : ''}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<StorefrontIcon fontSize="small" />}
													/>
													<CustomTextInput
														id="code"
														type="text"
														label={`${t.magasin.storeCode} *`}
														value={formik.values.code}
														onChange={formik.handleChange('code')}
														onBlur={formik.handleBlur('code')}
														error={formik.touched.code && Boolean(formik.errors.code)}
														helperText={formik.touched.code ? formik.errors.code : ''}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<TagIcon fontSize="small" />}
													/>
													<CustomTextInput
														id="address"
														type="text"
														label={t.magasin.storeAddress}
														value={formik.values.address}
														onChange={formik.handleChange('address')}
														onBlur={formik.handleBlur('address')}
														error={formik.touched.address && Boolean(formik.errors.address)}
														helperText={formik.touched.address ? formik.errors.address : ''}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<LocationOnIcon fontSize="small" />}
													/>
													<CustomTextInput
														id="phone"
														type="text"
														label={t.magasin.storePhone}
														value={formik.values.phone}
														onChange={formik.handleChange('phone')}
														onBlur={formik.handleBlur('phone')}
														error={formik.touched.phone && Boolean(formik.errors.phone)}
														helperText={formik.touched.phone ? formik.errors.phone : ''}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<PhoneIcon fontSize="small" />}
													/>
													<FormControlLabel
														control={<Checkbox checked={formik.values.is_active} onChange={formik.handleChange} name="is_active" />}
														label={<Stack direction="row" spacing={1} alignItems="center"><CheckCircleIcon fontSize="small" /> <Typography>{t.magasin.activeStore}</Typography></Stack>}
													/>
												</Stack>
											</CardContent>
										</Card>
										<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
											<PrimaryLoadingButton
												type="submit"
												buttonText={isEditMode ? t.magasin.editStore : t.magasin.newStore}
												active={!isPending}
												loading={isPending}
												startIcon={isEditMode ? <EditIcon /> : <SaveIcon />}
												onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
													setHasAttemptedSubmit(true);
													if (!formik.isValid) {
														event.preventDefault();
														formik.handleSubmit();
														onError(t.magasin.fixValidationErrors);
														window.scrollTo({ top: 0, behavior: 'smooth' });
													}
												}}
												cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
											/>
										</Box>
									</Stack>
								</form>
							)}
						</Stack>
					</Box>
				</Box>
			</Protected>
		</NavigationBar>
	);
};

export default StoresFormClient;
