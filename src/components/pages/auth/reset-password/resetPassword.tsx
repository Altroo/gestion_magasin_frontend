'use client';

import React, { useState, useEffect } from 'react';
import Styles from '@/styles/auth/auth.module.sass';
import { setFormikAutoErrors } from '@/utils/helpers';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { Desktop, TabletAndMobile } from '@/utils/clientHelpers';
import { cookiesPoster } from '@/utils/apiHelpers';
import { AUTH_RESET_PASSWORD_ENTER_CODE, DASHBOARD, AUTH_LOGIN } from '@/utils/routes';
import AuthLayout from '@/components/layouts/auth/authLayout';
import { Stack, Divider } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import { emailSchema } from '@/utils/formValidationSchemas';
import { textInputTheme } from '@/utils/themes';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import { useSendPasswordResetCodeMutation } from '@/store/services/account';
import { useSession } from 'next-auth/react';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { Send as SendIcon, Email as EmailIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import { useLanguage } from '@/utils/hooks';

const inputTheme = textInputTheme();
const ResetPasswordPageContent = () => {
	const router = useRouter();
	const [isPending, setIsPending] = useState(false);
	const { t } = useLanguage();

	const [reSendPasswordResetCode, { isLoading: isResendLoading }] = useSendPasswordResetCodeMutation();

	const formik = useFormik({
		initialValues: {
			email: '',
			globalError: '',
		},
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(emailSchema),
		onSubmit: async (values, { setFieldError }) => {
			setIsPending(true);
			try {
				await reSendPasswordResetCode({ email: values.email }).unwrap();
				await cookiesPoster('/api/cookies', { new_email: values.email });
				router.push(AUTH_RESET_PASSWORD_ENTER_CODE);
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	return (
		<Stack direction="column" className={Styles.contentWrapper} spacing={4}>
			<Stack
				direction="column"
				spacing={1}
				sx={{
					alignItems: 'flex-start',
					width: '100%',
				}}
			>
				<Stack direction="column">
					<span className={Styles.content}>{t.auth.recovery}</span>
					<span className={Styles.subContent}>{t.auth.ofPassword}</span>
				</Stack>
				<span className={Styles.paragraphe}>{t.auth.enterEmailDescription}</span>
			</Stack>
			<Divider orientation="horizontal" flexItem className={Styles.divider} />
			<form style={{ width: '100%' }} onSubmit={formik.handleSubmit} method="post">
				<Stack direction="column" spacing={4}>
					<CustomTextInput
						id="email"
						name="email"
						value={formik.values.email}
						onChange={formik.handleChange('email')}
						onBlur={formik.handleBlur('email')}
						helperText={formik.touched.email ? formik.errors.email : ''}
						error={formik.touched.email && Boolean(formik.errors.email)}
						fullWidth={false}
						size="medium"
						type="email"
						label={t.auth.emailAddress}
						placeholder={t.auth.emailPlaceholder}
						theme={inputTheme}
						startIcon={<EmailIcon fontSize="small" />}
						required
						autoComplete="email"
						maxLength={254}
					/>
					<PrimaryLoadingButton
						buttonText={t.auth.resendCode}
						active={!isResendLoading && !isPending}
						cssClass={Styles.emailRegisterButton}
						type="submit"
						startIcon={<SendIcon />}
						loading={isResendLoading || isPending}
					/>
					<TextButton
						buttonText={t.auth.backToLogin}
						startIcon={<ArrowBackIcon />}
						onClick={() => router.push(AUTH_LOGIN)}
					/>
				</Stack>
			</form>
		</Stack>
	);
};

const ResetPasswordClient: React.FC = () => {
	const { data: session, status } = useSession();
	const loading = status === 'loading';
	const router = useRouter();

	useEffect(() => {
		if (!loading && session) {
			router.replace(DASHBOARD);
		}
	}, [loading, session, router]);

	return (
		<>
			{loading && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}
			{!loading && !session && (
				<>
					<Desktop>
						<div>
							<AuthLayout>
								<ResetPasswordPageContent />
							</AuthLayout>
						</div>
					</Desktop>
					<TabletAndMobile>
						<div style={{ display: 'flex', width: '100%', height: '100%' }}>
							<main className={Styles.main}>
								<ResetPasswordPageContent />
							</main>
						</div>
					</TabletAndMobile>
				</>
			)}
		</>
	);
};

export default ResetPasswordClient;
