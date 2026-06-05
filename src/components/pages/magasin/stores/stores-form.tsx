'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Autocomplete,
	Box,
	Button,
	Card,
	CardContent,
	Checkbox,
	Divider,
	FormControlLabel,
	IconButton,
	InputAdornment,
	MenuItem,
	Stack,
	TextField,
	ThemeProvider,
	Typography,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	CheckCircle as CheckCircleIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	LocationOn as LocationOnIcon,
	Phone as PhoneIcon,
	People as PeopleIcon,
	Save as SaveIcon,
	Security as SecurityIcon,
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
import { useGetUsersListQuery } from '@/store/services/account';
import { useAddStoreMutation, useEditStoreMutation, useGetStoreQuery, useGetStoreRolesQuery } from '@/store/services/magasin';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ApiErrorResponseType, PaginationResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { UserClass } from '@/models/classes';
import type { StoreFormValues, StorePayload, StoreRoleCode } from '@/types/gestionMagasinTypes';
import { extractApiErrorMessage, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { storeSchema } from '@/utils/formValidationSchemas';
import { STORES_LIST, STORES_VIEW } from '@/utils/routes';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
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
	is_global_stock: values.is_global_stock ?? false,
	managed_by: values.managed_by.map((item) => ({ pk: item.pk, role: item.role })),
});

const StoresFormClient = ({ session, id }: Props) => {
	const token = useInitAccessToken(session);
	const router = useRouter();
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const isEditMode = id !== undefined;
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState('');
	const [selectedRole, setSelectedRole] = useState<StoreRoleCode | ''>('');

	const { data: store, isLoading: isStoreLoading, error: storeError } = useGetStoreQuery({ id: id! }, { skip: !token || !isEditMode });
	const { data: usersRaw } = useGetUsersListQuery({ with_pagination: true, page: 1, pageSize: 100 }, { skip: !token });
	const { data: rolesRaw } = useGetStoreRolesQuery(undefined, { skip: !token });
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
			is_global_stock: store?.is_global_stock ?? false,
			managed_by: store?.managed_by ?? [],
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
			managed_by: t.users.storeAccess,
			globalError: t.errors.globalError,
		}),
		[t],
	);
	const usersData = (usersRaw as PaginationResponseType<UserClass> | undefined)?.results ?? [];
	const rolesData = rolesRaw?.results ?? [];
	const assignedUserIds = formik.values.managed_by.map((item) => item.pk);
	const availableUsers = usersData.filter((user) => user.is_active && !assignedUserIds.includes(user.id));
	const selectedUser = availableUsers.find((user) => String(user.id) === selectedUserId) ?? null;

	const addManagedUser = () => {
		if (!selectedUserId || !selectedRole) return;
		const user = usersData.find((item) => item.id === Number(selectedUserId));
		const role = rolesData.find((item) => item.code === selectedRole);
		if (!user || !role) return;
		void formik.setFieldValue('managed_by', [
			...formik.values.managed_by,
			{ pk: user.id, role: role.code, role_name: role.name },
		]);
		void formik.setFieldTouched('managed_by', true);
		setSelectedUserId('');
		setSelectedRole('');
	};

	const removeManagedUser = (userId: number) => {
		void formik.setFieldValue(
			'managed_by',
			formik.values.managed_by.filter((item) => item.pk !== userId),
		);
		void formik.setFieldTouched('managed_by', true);
	};

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
	const fieldError = (field: keyof StoreFormValues) =>
		(formik.touched[field] || hasAttemptedSubmit) && typeof formik.errors[field] === 'string'
			? (formik.errors[field] as string)
			: '';
	const managedByError = (formik.touched.managed_by || hasAttemptedSubmit) && typeof formik.errors.managed_by === 'string'
		? formik.errors.managed_by
		: '';

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
														error={Boolean(fieldError('name'))}
														helperText={fieldError('name')}
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
														error={Boolean(fieldError('code'))}
														helperText={fieldError('code')}
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
														error={Boolean(fieldError('address'))}
														helperText={fieldError('address')}
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
														error={Boolean(fieldError('phone'))}
														helperText={fieldError('phone')}
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
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
													<PeopleIcon color="primary" />
													<Typography variant="h6" fontWeight={700}>{t.users.storeAccess}</Typography>
												</Stack>
												<Divider sx={{ mb: 3 }} />
												<Stack spacing={2}>
													<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
														<Autocomplete
															size="small"
															options={availableUsers}
															value={selectedUser}
															onChange={(_, nextUser) => setSelectedUserId(nextUser ? String(nextUser.id) : '')}
															getOptionLabel={(user) => `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email}
															isOptionEqualToValue={(option, value) => option.id === value.id}
															noOptionsText={t.common.noOptions}
															fullWidth
															sx={{
																'& .MuiOutlinedInput-root': {
																	minHeight: 40,
																	borderRadius: '8px',
																	fontFamily: 'Poppins',
																	fontSize: '16px',
																},
																'& .MuiAutocomplete-input': {
																	fontFamily: 'Poppins',
																	fontSize: '16px',
																},
															}}
															renderInput={(params) => (
																<TextField
																	{...params}
																	label={t.users.selectUser}
																	InputProps={{
																		...params.InputProps,
																		startAdornment: (
																			<>
																				<InputAdornment position="start"><PeopleIcon fontSize="small" /></InputAdornment>
																				{params.InputProps.startAdornment}
																			</>
																		),
																	}}
																/>
															)}
														/>
														<ThemeProvider theme={customDropdownTheme()}>
															<TextField
																select
																size="small"
																label={t.users.role}
																value={selectedRole}
																onChange={(event) => setSelectedRole(event.target.value as StoreRoleCode)}
																fullWidth
																InputProps={{ startAdornment: <InputAdornment position="start"><SecurityIcon fontSize="small" /></InputAdornment> }}
															>
																{rolesData.map((role) => (
																	<MenuItem key={role.id} value={role.code}>{role.name}</MenuItem>
																))}
															</TextField>
														</ThemeProvider>
														<Button variant="contained" startIcon={<AddIcon />} onClick={addManagedUser} disabled={!selectedUserId || !selectedRole} sx={{ minWidth: 120, height: 40 }}>
															{t.common.add}
														</Button>
													</Stack>
													<Stack spacing={1}>
														{formik.values.managed_by.length === 0 ? (
															<Typography color="text.secondary">{t.users.noStore}</Typography>
														) : (
															formik.values.managed_by.map((item) => {
																const user = usersData.find((candidate) => candidate.id === item.pk);
																const label = user ? (`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email) : String(item.pk);
																return (
																	<Stack key={item.pk} direction="row" alignItems="center" justifyContent="space-between" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 2, py: 1 }}>
																		<Box>
																			<Typography fontWeight={600}>{label}</Typography>
																			<Typography variant="body2" color="text.secondary">{item.role_name}</Typography>
																		</Box>
																		<IconButton color="error" onClick={() => removeManagedUser(item.pk)}>
																			<DeleteIcon />
																		</IconButton>
																	</Stack>
																);
															})
														)}
													</Stack>
													{managedByError && (
														<Typography color="error" variant="caption">
															{managedByError}
														</Typography>
													)}
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
