'use client';

import React, { useState } from 'react';
import Styles from '@/styles/auth/auth.module.sass';
import { setFormikAutoErrors } from '@/utils/helpers';
import { Desktop, TabletAndMobile } from '@/utils/clientHelpers';
import { cookiesPoster } from '@/utils/apiHelpers';
import { AUTH_RESET_PASSWORD_COMPLETE } from '@/utils/routes';
import AuthLayout from '@/components/layouts/auth/authLayout';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import { passwordResetConfirmationSchema } from '@/utils/formValidationSchemas';
import { textInputTheme } from '@/utils/themes';
import CustomPasswordInput from '@/components/formikElements/customPasswordInput/customPasswordInput';
import { useSetPasswordMutation } from '@/store/services/account';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import { Edit as EditIcon, Lock as LockIcon } from '@mui/icons-material';
import { useLanguage } from '@/utils/hooks';

const inputTheme = textInputTheme();

type SetPasswordPageContentProps = {
	email: string;
	code: string;
};

const SetPasswordPageContent: React.FC<SetPasswordPageContentProps> = ({ email, code }) => {
	const router = useRouter();
	const [isPending, setIsPending] = useState(false);
	const [setPassword, { isLoading: isSetPasswordLoading }] = useSetPasswordMutation();
	const { t } = useLanguage();

	const formik = useFormik({
		initialValues: {
			new_password: '',
			new_password2: '',
			globalError: '',
		},
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(passwordResetConfirmationSchema),
		onSubmit: async (values, { setFieldError }) => {
			setIsPending(true);
			try {
				await setPassword({
					email,
					code,
					new_password: values.new_password,
					new_password2: values.new_password2,
				}).unwrap();
				await cookiesPoster('/api/cookies', { pass_updated: 1 });
				router.push(AUTH_RESET_PASSWORD_COMPLETE);
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	return (
		<Stack direction="column" className={Styles.contentWrapper} spacing={6}>
			<Stack
				direction="column"
				sx={{
					justifyContent: 'flex-start',
					alignItems: 'flex-start',
					width: '100%',
				}}
			>
				<span className={Styles.content}>{t.auth.setNewPassword}</span>
			</Stack>
			<form style={{ width: '100%' }} onSubmit={(e) => e.preventDefault()}>
				<Stack direction="column" spacing={4}>
					<Stack direction="column" spacing={2}>
						<CustomPasswordInput
							id="new_password"
							value={formik.values.new_password}
							onChange={formik.handleChange('new_password')}
							onBlur={formik.handleBlur('new_password')}
							helperText={formik.touched.new_password ? formik.errors.new_password : ''}
							error={formik.touched.new_password && Boolean(formik.errors.new_password)}
							fullWidth={false}
							size="medium"
							label={t.auth.password}
							placeholder={t.auth.passwordPlaceholder}
							cssClass={Styles.mobileInput}
							theme={inputTheme}
							startIcon={<LockIcon fontSize="small" />}
						/>
						<CustomPasswordInput
							id="new_password2"
							value={formik.values.new_password2}
							onChange={formik.handleChange('new_password2')}
							onBlur={formik.handleBlur('new_password2')}
							helperText={formik.touched.new_password2 ? formik.errors.new_password2 : ''}
							error={formik.touched.new_password2 && Boolean(formik.errors.new_password2)}
							fullWidth={false}
							size="medium"
							label={t.auth.confirmPassword}
							placeholder={t.auth.confirmPassword}
							cssClass={Styles.mobileInput}
							theme={inputTheme}
							startIcon={<LockIcon fontSize="small" />}
						/>
					</Stack>
					{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
					<PrimaryLoadingButton
						buttonText={t.auth.changePasswordButton}
						active={!isSetPasswordLoading && !isPending}
						onClick={formik.handleSubmit}
						cssClass={Styles.emailRegisterButton}
						type="submit"
						startIcon={<EditIcon />}
						loading={isSetPasswordLoading || isPending}
					/>
				</Stack>
			</form>
		</Stack>
	);
};

type Props = {
	email: string;
	code: string;
};

const SetPasswordClient: React.FC<Props> = ({ email, code }) => (
	<>
		<Desktop>
			<div>
				<AuthLayout>
					<SetPasswordPageContent email={email} code={code} />
				</AuthLayout>
			</div>
		</Desktop>
		<TabletAndMobile>
			<div style={{ display: 'flex', width: '100%', height: '100%' }}>
				<main className={Styles.main}>
					<SetPasswordPageContent email={email} code={code} />
				</main>
			</div>
		</TabletAndMobile>
	</>
);

export default SetPasswordClient;
