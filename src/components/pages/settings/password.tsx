'use client';

import React, { useState } from 'react';
import Styles from '@/styles/dashboard/settings/settings.module.sass';
import { Box, Stack, useMediaQuery, useTheme, Alert } from '@mui/material';
import { setFormikAutoErrors } from '@/utils/helpers';
import { useFormik } from 'formik';
import { changePasswordSchema } from '@/utils/formValidationSchemas';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { textInputTheme } from '@/utils/themes';
import CustomPasswordInput from '@/components/formikElements/customPasswordInput/customPasswordInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import { useEditPasswordMutation } from '@/store/services/account';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useToast, useAppSelector, useLanguage } from '@/utils/hooks';
import { Edit as EditIcon, Lock as LockIcon } from '@mui/icons-material';
import { getProfilState } from '@/store/selectors';

const inputTheme = textInputTheme();

const FormikContent: React.FC = () => {
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const profil = useAppSelector(getProfilState);
	const [changePassword, { isLoading: isChangePasswordLoading }] = useEditPasswordMutation();
	const [isPending, setIsPending] = useState(false);

	const formik = useFormik({
		initialValues: {
			old_password: '',
			new_password: '',
			new_password2: '',
			globalError: '',
		},
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(changePasswordSchema),
		onSubmit: async (values, { setFieldError, resetForm }) => {
			setIsPending(true);
			try {
				await changePassword({
					data: {
						old_password: values.old_password,
						new_password: values.new_password,
						new_password2: values.new_password2,
					},
				}).unwrap();
				onSuccess(t.settings.passwordChangeSuccess);
				resetForm();
			} catch (e) {
				onError(t.settings.passwordChangeError);
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	return (
		<Stack
			direction="column"
			spacing={2}
			className={`${Styles.flexRootStack}`}
			sx={{
				alignItems: 'center',
				mt: '32px',
			}}
		>
			{(isChangePasswordLoading || isPending) && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}
			<h2 className={Styles.pageTitle}>{t.settings.changePassword}</h2>
			<form className={Styles.form} onSubmit={(e) => e.preventDefault()}>
				<Stack
					direction="column"
					spacing={2}
					sx={{
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					{profil && profil.default_password_set && (
						<Alert severity="warning" sx={{ maxWidth: '365px', width: '100%' }}>
							{t.settings.defaultPasswordWarning}
						</Alert>
					)}
					<CustomPasswordInput
						id="old_password"
						value={formik.values.old_password}
						onChange={formik.handleChange('old_password')}
						onBlur={formik.handleBlur('old_password')}
						helperText={formik.touched.old_password ? formik.errors.old_password : ''}
						error={formik.touched.old_password && Boolean(formik.errors.old_password)}
						fullWidth={false}
						size="small"
						label={t.settings.oldPassword}
						placeholder={t.settings.oldPassword}
						theme={inputTheme}
						startIcon={<LockIcon fontSize="small" />}
						cssClass={Styles.maxInputWidth}
					/>
					<CustomPasswordInput
						id="new_password"
						value={formik.values.new_password}
						onChange={formik.handleChange('new_password')}
						onBlur={formik.handleBlur('new_password')}
						helperText={formik.touched.new_password ? formik.errors.new_password : ''}
						error={formik.touched.new_password && Boolean(formik.errors.new_password)}
						fullWidth={false}
						size="small"
						label={t.settings.newPassword}
						placeholder={t.settings.newPassword}
						theme={inputTheme}
						startIcon={<LockIcon fontSize="small" />}
						cssClass={Styles.maxInputWidth}
					/>
					<CustomPasswordInput
						id="new_password2"
						value={formik.values.new_password2}
						onChange={formik.handleChange('new_password2')}
						onBlur={formik.handleBlur('new_password2')}
						helperText={formik.touched.new_password2 ? formik.errors.new_password2 : ''}
						error={formik.touched.new_password2 && Boolean(formik.errors.new_password2)}
						fullWidth={false}
						size="small"
						label={t.settings.confirmNewPassword}
						placeholder={t.settings.confirmNewPassword}
						theme={inputTheme}
						startIcon={<LockIcon fontSize="small" />}
						cssClass={Styles.maxInputWidth}
					/>
					<PrimaryLoadingButton
						buttonText={t.settings.modify}
						active={!isPending}
						onClick={formik.handleSubmit}
						cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
						type="submit"
						startIcon={<EditIcon />}
						loading={isPending}
					/>
				</Stack>
			</form>
		</Stack>
	);
};

const PasswordClient: React.FC = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const { t } = useLanguage();

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={t.settings.changePassword}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					<Box
						sx={{
							width: '100%',
							display: 'flex',
							justifyContent: isMobile ? 'center' : 'flex-start',
							alignItems: 'flex-start',
						}}
					>
						<Box sx={{ width: '100%' }}>
							<FormikContent />
						</Box>
					</Box>
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default PasswordClient;
