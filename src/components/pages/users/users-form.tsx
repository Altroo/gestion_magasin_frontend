'use client';

import React, { useState, useMemo } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Box,
	Button,
	FormControlLabel,
	Checkbox,
	Switch,
	Stack,
	Typography,
	Card,
	CardContent,
	Divider,
	useTheme,
	useMediaQuery,
	Alert,
	IconButton,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Email as EmailIcon,
	Groups as GroupsIcon,
	PersonOutline as PersonOutlineIcon,
	AdminPanelSettings as AdminPanelSettingsIcon,
	CheckCircle as CheckCircleIcon,
	AccountCircle as AccountCircleIcon,
	Security as SecurityIcon,
	Edit as EditIcon,
	Add as AddIcon,
	Delete as DeleteIcon,
	Storefront as StorefrontIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import RoundedAutocomplete from '@/components/formikElements/roundedAutocomplete/roundedAutocomplete';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { userSchema } from '@/utils/formValidationSchemas';
import { genderItemsList } from '@/utils/rawData';
import { getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { textInputTheme, customDropdownTheme } from '@/utils/themes';
import { USERS_LIST, USERS_VIEW } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import CustomSquareImageUploading from '@/components/formikElements/customSquareImageUploading/customSquareImageUploading';
import { useToast, useLanguage } from '@/utils/hooks';
import { useAddUserMutation, useCheckEmailMutation, useEditUserMutation, useGetUserQuery } from '@/store/services/account';
import { useGetStoreRolesQuery, useGetStoresQuery } from '@/store/services/magasin';
import { useInitAccessToken } from '@/contexts/InitContext';
import { Protected } from '@/components/layouts/protected/protected';
import type { DropDownType } from '@/types/accountTypes';
import type { StoreRoleCode, UserStoreAssignmentType } from '@/types/gestionMagasinTypes';

const inputTheme = textInputTheme();

interface UserFormValues {
	first_name: string;
	last_name: string;
	email: string;
	gender: string;
	is_active: boolean;
	is_staff: boolean;
	can_view: boolean;
	can_print: boolean;
	can_create: boolean;
	can_edit: boolean;
	can_delete: boolean;
	can_create_promotion: boolean;
	stores: UserStoreAssignmentType[];
	avatar: string | ArrayBuffer | null;
	avatar_cropped: string | ArrayBuffer | null;
	globalError: string;
}

type FormikContentProps = {
	token: string | undefined;
	id?: number;
};

const permissionFields: Array<keyof Pick<UserFormValues, 'can_view' | 'can_print' | 'can_create' | 'can_edit' | 'can_delete' | 'can_create_promotion'>> = [
	'can_view',
	'can_print',
	'can_create',
	'can_edit',
	'can_delete',
	'can_create_promotion',
];

const baseAdminPermissionFields: Array<Exclude<(typeof permissionFields)[number], 'can_create_promotion'>> = [
	'can_view',
	'can_print',
	'can_create',
	'can_edit',
	'can_delete',
];

const FormikContent: React.FC<FormikContentProps> = (props: FormikContentProps) => {
	const { token, id } = props;
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const isEditMode = id !== undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const router = useRouter();

	const {
		data: rawData,
		isLoading: isDataLoading,
		error: dataError,
	} = useGetUserQuery({ id: id! }, { skip: !token || !isEditMode });

	const [addUser, { isLoading: isAddLoading, error: addError }] = useAddUserMutation();
	const [checkEmail, { isLoading: isCheckEmailLoading, error: checkEmailError }] = useCheckEmailMutation();
	const [editUser, { isLoading: isEditLoading, error: editError }] = useEditUserMutation();
	const { data: storesRawData, isLoading: isStoresLoading } = useGetStoresQuery(
		{ pageSize: 100 },
		{ skip: !token },
	);
	const { data: rolesRawData, isLoading: isRolesLoading } = useGetStoreRolesQuery(undefined, { skip: !token });

	const error = checkEmailError || (isEditMode ? dataError || editError : addError);
	const axiosError: ResponseDataInterface<ApiErrorResponseType> | undefined = useMemo(() => {
		return error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined;
	}, [error]);

	const [isPending, setIsPending] = useState(false);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [selectedStore, setSelectedStore] = useState<DropDownType | null>(null);
	const [selectedRole, setSelectedRole] = useState<string>('');

	const formik = useFormik<UserFormValues>({
		initialValues: {
			first_name: rawData?.first_name ?? '',
			last_name: rawData?.last_name ?? '',
			email: rawData?.email ?? '',
			gender: rawData?.gender ?? '',
			is_active: rawData?.is_active ?? true,
			is_staff: rawData?.is_staff ?? false,
			can_view: rawData?.can_view ?? false,
			can_print: rawData?.can_print ?? false,
			can_create: rawData?.can_create ?? false,
			can_edit: rawData?.can_edit ?? false,
			can_delete: rawData?.can_delete ?? false,
			can_create_promotion: rawData?.can_create_promotion ?? false,
			stores: rawData?.stores ?? [],
			avatar: rawData?.avatar ?? '',
			avatar_cropped: rawData?.avatar_cropped ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(userSchema),
		onSubmit: async (data, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...fields } = data;
			const payload = {
				...fields,
				can_create_promotion: fields.is_staff ? fields.can_create_promotion : false,
				stores: fields.stores.map((store) => ({
					store_id: store.store_id,
					role: store.role,
				})),
			};
			try {
				if (rawData?.email !== data.email) {
					await checkEmail({ email: data.email }).unwrap();
				}
				if (isEditMode) {
					await editUser({ id: id!, data: payload }).unwrap();
					onSuccess(t.users.userUpdatedSuccess);
					router.push(USERS_VIEW(id!));
				} else {
					await addUser({ data: payload }).unwrap();
					onSuccess(t.users.userCreatedSuccess);
					router.push(USERS_LIST);
				}
			} catch (e) {
				if (isEditMode) {
					onError(t.users.userUpdateError);
				} else {
					onError(t.users.userCreateError);
				}
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			email: t.users.email,
			first_name: t.users.lastName,
			last_name: t.users.firstName,
			gender: t.users.gender,
			is_active: t.users.activeAccount,
			is_staff: t.users.adminAccount,
			avatar: t.users.profilePhoto,
			avatar_cropped: t.users.avatarCropped,
			can_view: t.users.canView,
			can_print: t.users.canPrint,
			can_create: t.users.canCreate,
			can_edit: t.users.canEdit,
			can_delete: t.users.canDelete,
			can_create_promotion: t.users.canCreatePromotion,
			stores: t.users.storeAccess,
			globalError: t.errors.globalError,
		}),
		[t],
	);

	const storesData = useMemo(() => storesRawData?.results ?? [], [storesRawData?.results]);
	const rolesData = useMemo(() => rolesRawData?.results ?? [], [rolesRawData?.results]);
	const storeAssignments = useMemo(() => formik.values.stores ?? [], [formik.values.stores]);
	const assignedStoreIds = useMemo(
		() => storeAssignments.map((store) => store.store_id),
		[storeAssignments],
	);
	const availableStores = useMemo(
		() =>
			storesData
				.filter((store) => store.is_active && !assignedStoreIds.includes(store.id))
				.map((store) => ({
					value: String(store.id),
					code: store.name,
				})),
		[assignedStoreIds, storesData],
	);
	const roleOptions = useMemo(
		() =>
			rolesData.map((role) => ({
				value: role.name,
				code: role.code,
			})),
		[rolesData],
	);
	const roleNameByCode = useMemo(
		() => Object.fromEntries(rolesData.map((role) => [role.code, role.name])),
		[rolesData],
	);
	const roleCodeByName = useMemo(
		() => Object.fromEntries(rolesData.map((role) => [role.name, role.code])),
		[rolesData],
	);

	const setAllPermissions = (checked: boolean) => {
		permissionFields.forEach((field) => {
			void formik.setFieldValue(field, checked, true);
		});
	};

	const handleAdminChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const checked = event.target.checked;
		void formik.setFieldValue('is_staff', checked, true);
		setAllPermissions(checked);
		if (!checked) {
			void formik.setFieldValue('can_create_promotion', false, true);
		}
	};

	const handlePermissionChange = (field: (typeof permissionFields)[number]) => (event: React.ChangeEvent<HTMLInputElement>) => {
		if (field === 'can_create_promotion' && !formik.values.is_staff) {
			void formik.setFieldValue('can_create_promotion', false, true);
			return;
		}
		const checked = event.target.checked;
		void formik.setFieldValue(field, checked, true);
		const nextValues = {
			can_view: formik.values.can_view,
			can_print: formik.values.can_print,
			can_create: formik.values.can_create,
			can_edit: formik.values.can_edit,
			can_delete: formik.values.can_delete,
			can_create_promotion: formik.values.can_create_promotion,
			[field]: checked,
		};
		void formik.setFieldValue('is_staff', baseAdminPermissionFields.every((permissionField) => nextValues[permissionField]), true);
	};

	const setStoreAssignments = (next: UserStoreAssignmentType[]) => {
		void formik.setFieldValue('stores', next, true);
	};

	const handleAddStore = () => {
		if (!selectedStore || !selectedRole) {
			return;
		}
		const store = storesData.find((item) => item.id === Number(selectedStore.value));
		const selectedRoleCode = roleCodeByName[selectedRole] as StoreRoleCode | undefined;
		if (!store || !selectedRoleCode || storeAssignments.some((item) => item.store_id === store.id)) {
			return;
		}
		setStoreAssignments([
			...storeAssignments,
			{
				membership_id: 0,
				store_id: store.id,
				store_name: store.name,
				role: selectedRoleCode,
				role_name: selectedRole,
				is_active: true,
			},
		]);
		setSelectedStore(null);
		setSelectedRole('');
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

	const hasValidationErrors = Object.keys(validationErrors).length > 0;
	const fieldError = (field: keyof UserFormValues) =>
		(formik.touched[field] || hasAttemptedSubmit) && typeof formik.errors[field] === 'string'
			? (formik.errors[field] as string)
			: '';

	const isLoading: boolean =
		isAddLoading ||
		isCheckEmailLoading ||
		isEditLoading ||
		isStoresLoading ||
		isRolesLoading ||
		isPending ||
		(isEditMode && isDataLoading);
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
			<Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" spacing={2}>
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={() => router.push(USERS_LIST)}
					sx={{
						whiteSpace: 'nowrap',
						px: { xs: 1.5, sm: 2, md: 3 },
						py: { xs: 0.8, sm: 1, md: 1 },
						fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
					}}
				>
					{t.navigation.usersList}
				</Button>
			</Stack>
			{hasValidationErrors && (
				<Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
					<Typography variant="subtitle2" fontWeight={600}>
						{t.users.validationErrorsDetected}
					</Typography>
					<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
						{Object.entries(validationErrors).map(([key, err]) => (
							<li key={key}>
								<Typography variant="body2">
									{getLabelForKey(fieldLabels, key)} : {err}
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
						{/* Profile Picture Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<AccountCircleIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
									{t.users.profilePhoto}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Box sx={{ display: 'flex', justifyContent: 'center' }}>
									<CustomSquareImageUploading
										image={formik.values.avatar}
										croppedImage={formik.values.avatar_cropped}
										onChange={(img) => formik.setFieldValue('avatar', img)}
										onCrop={(cropped) => formik.setFieldValue('avatar_cropped', cropped)}
									/>
								</Box>
							</CardContent>
						</Card>

						{/* Personal Information Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<PersonOutlineIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
									{t.users.personalInfo}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomTextInput
										id="email"
										type="email"
										label={`${t.users.email} *`}
										disabled={isEditMode}
										value={formik.values.email}
										onChange={formik.handleChange('email')}
										onBlur={formik.handleBlur('email')}
										error={Boolean(fieldError('email'))}
										helperText={fieldError('email')}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<EmailIcon fontSize="small" />}
									/>
									<CustomTextInput
										id="first_name"
										type="text"
										label={`${t.users.lastName} *`}
										value={formik.values.first_name}
										onChange={formik.handleChange('first_name')}
										onBlur={formik.handleBlur('first_name')}
										error={Boolean(fieldError('first_name'))}
										helperText={fieldError('first_name')}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<PersonOutlineIcon fontSize="small" />}
									/>
									<CustomTextInput
										id="last_name"
										type="text"
										label={`${t.users.firstName} *`}
										value={formik.values.last_name}
										onChange={formik.handleChange('last_name')}
										onBlur={formik.handleBlur('last_name')}
										error={Boolean(fieldError('last_name'))}
										helperText={fieldError('last_name')}
										fullWidth={false}
										size="small"
										theme={inputTheme}
										startIcon={<PersonOutlineIcon fontSize="small" />}
									/>
									<CustomDropDownSelect
										size="small"
										id="gender"
										label={`${t.users.gender} *`}
										items={genderItemsList(t)}
										value={formik.values.gender}
										onChange={(e) => formik.setFieldValue('gender', e.target.value)}
										theme={customDropdownTheme()}
										startIcon={<GroupsIcon fontSize="small" />}
										onBlur={formik.handleBlur('gender')}
										error={Boolean(fieldError('gender'))}
										helperText={fieldError('gender')}
									/>
								</Stack>
							</CardContent>
						</Card>

						{/* Account Settings Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<AdminPanelSettingsIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
									{t.users.accountSettings}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={1}>
									<FormControlLabel
										control={
											<Checkbox
												checked={formik.values.is_active}
												onChange={formik.handleChange}
												name="is_active"
												color="success"
											/>
										}
										label={
											<Stack direction="row" spacing={1} alignItems="center">
												<CheckCircleIcon fontSize="small" color={formik.values.is_active ? 'success' : 'disabled'} />
												<Typography>{t.users.activeAccount}</Typography>
											</Stack>
										}
									/>
									<FormControlLabel
										control={
											<Checkbox
												checked={formik.values.is_staff}
												onChange={handleAdminChange}
												name="is_staff"
												color="primary"
											/>
										}
										label={
											<Stack direction="row" spacing={1} alignItems="center">
												<AdminPanelSettingsIcon
													fontSize="small"
													color={formik.values.is_staff ? 'primary' : 'disabled'}
												/>
												<Typography>{t.users.adminAccount}</Typography>
											</Stack>
										}
									/>
								</Stack>
							</CardContent>
						</Card>

						{/* Store Access Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<StorefrontIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										{t.users.storeAccess} {storeAssignments.length > 0 && `(${storeAssignments.length})`}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
									<Table>
										<TableHead sx={{ backgroundColor: 'grey.50' }}>
											<TableRow>
												<TableCell sx={{ fontWeight: 700 }}>
													<Stack direction="row" spacing={1} alignItems="center">
														<StorefrontIcon color="primary" fontSize="small" />
														<span>{t.users.storeHeader}</span>
													</Stack>
												</TableCell>
												<TableCell sx={{ fontWeight: 700 }}>{t.users.roleHeader}</TableCell>
												<TableCell align="right" sx={{ fontWeight: 700 }}>
													{t.common.actions}
												</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{storeAssignments.length === 0 ? (
												<TableRow>
													<TableCell colSpan={3} align="center" sx={{ py: 4 }}>
														<Stack spacing={1} alignItems="center">
															<StorefrontIcon sx={{ fontSize: 48, color: 'grey.400' }} />
															<Typography variant="body2" color="text.secondary">
																{t.users.noStore}
															</Typography>
														</Stack>
													</TableCell>
												</TableRow>
											) : (
												storeAssignments.map((item, index) => (
													<TableRow key={`${item.store_id}-${index}`} sx={{ '&:hover': { backgroundColor: 'grey.50' } }}>
														<TableCell>
															<Typography fontWeight={600}>{item.store_name}</Typography>
														</TableCell>
														<TableCell>
															<Box sx={{ maxWidth: 220 }}>
																<CustomDropDownSelect
																	id={`store_role_${index}`}
																	size="small"
																	label={t.users.role}
																	items={roleOptions}
																	value={item.role_name || roleNameByCode[item.role] || item.role}
																	onChange={(event) => {
																		const nextRoleName = event.target.value;
																		const nextRole = roleCodeByName[nextRoleName] as StoreRoleCode | undefined;
																		if (!nextRole) {
																			return;
																		}
																		setStoreAssignments(
																			storeAssignments.map((store, storeIndex) =>
																				storeIndex === index
																					? {
																							...store,
																							role: nextRole,
																							role_name: nextRoleName,
																						}
																					: store,
																			),
																		);
																	}}
																	theme={customDropdownTheme()}
																	startIcon={<GroupsIcon fontSize="small" />}
																/>
															</Box>
														</TableCell>
														<TableCell align="right">
															<IconButton
																aria-label={t.common.delete}
																color="error"
																size="small"
																onClick={() => setStoreAssignments(storeAssignments.filter((_, storeIndex) => storeIndex !== index))}
															>
																<DeleteIcon />
															</IconButton>
														</TableCell>
													</TableRow>
												))
											)}
										</TableBody>
									</Table>
								</TableContainer>
								<Box sx={{ mt: 3 }}>
									<Typography variant="subtitle1" fontWeight={600}>
										{t.users.addStore}
										</Typography>
									<Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ mt: 2 }}>
										<Box sx={{ flex: 1 }}>
											<RoundedAutocomplete
												size="small"
												options={availableStores}
												value={selectedStore}
												onChange={(_, nextStore) => setSelectedStore(nextStore)}
												getOptionLabel={(option) => option.code}
												noOptionsText={t.common.noOptions}
												label={t.users.selectStore}
												startIcon={<StorefrontIcon fontSize="small" color="action" />}
												fullWidth
											/>
										</Box>
										<Box sx={{ flex: 1 }}>
											<CustomDropDownSelect
												id="new_user_store_role"
												size="small"
												label={t.users.role}
												items={roleOptions}
												value={selectedRole}
												onChange={(event) => setSelectedRole(event.target.value as string)}
												theme={customDropdownTheme()}
												startIcon={<GroupsIcon fontSize="small" />}
											/>
										</Box>
										<Button
											variant="contained"
											startIcon={<AddIcon />}
											onClick={handleAddStore}
											disabled={!selectedStore || !selectedRole}
											sx={{ minWidth: 120, height: 'fit-content' }}
										>
											{t.common.add}
										</Button>
									</Stack>
								</Box>
							</CardContent>
						</Card>

						{/* Permissions Card */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<SecurityIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
									{t.users.permissions}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={1}>
									<FormControlLabel
										control={<Switch checked={formik.values.can_view} onChange={handlePermissionChange('can_view')} name="can_view" />}
								label={t.users.canView}
									/>
									<FormControlLabel
										control={<Switch checked={formik.values.can_print} onChange={handlePermissionChange('can_print')} name="can_print" />}
								label={t.users.canPrint}
									/>
									<FormControlLabel
										control={<Switch checked={formik.values.can_create} onChange={handlePermissionChange('can_create')} name="can_create" />}
								label={t.users.canCreate}
									/>
									<FormControlLabel
										control={<Switch checked={formik.values.can_edit} onChange={handlePermissionChange('can_edit')} name="can_edit" />}
								label={t.users.canEdit}
									/>
									<FormControlLabel
										control={<Switch checked={formik.values.can_delete} onChange={handlePermissionChange('can_delete')} name="can_delete" />}
								label={t.users.canDelete}
									/>
									<FormControlLabel
										control={<Switch checked={formik.values.is_staff && formik.values.can_create_promotion} onChange={handlePermissionChange('can_create_promotion')} name="can_create_promotion" disabled={!formik.values.is_staff} />}
								label={t.users.canCreatePromotion}
									/>
								</Stack>
							</CardContent>
						</Card>

						{/* Submit Button */}
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								type="submit"
								buttonText={isEditMode ? t.users.updateUser : t.users.addUser}
								active={!isPending}
								loading={isPending}
								startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									setHasAttemptedSubmit(true);
									if (!formik.isValid) {
										e.preventDefault();
										formik.handleSubmit();
										onError(t.users.fixValidationErrors);
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
	);
};

interface Props extends SessionProps {
	id?: number;
}

const UsersFormClient: React.FC<Props> = ({ session, id }: Props) => {
	const token = useInitAccessToken(session);
	const isEditMode = id !== undefined;
	const { t } = useLanguage();

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={isEditMode ? t.users.editUser : t.users.createUser}>
				<main style={{ width: '100%' }}>
					<Protected>
						<Box sx={{ width: '100%' }}>
							<FormikContent token={token} id={id} />
						</Box>
					</Protected>
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default UsersFormClient;
