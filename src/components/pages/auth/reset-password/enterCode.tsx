'use client';

import React, { useState, useRef } from 'react';
import Styles from '@/styles/auth/auth.module.sass';
import { setFormikAutoErrors } from '@/utils/helpers';
import { Desktop, TabletAndMobile } from '@/utils/clientHelpers';
import { cookiesPoster } from '@/utils/apiHelpers';
import { AUTH_RESET_PASSWORD_SET_PASSWORD } from '@/utils/routes';
import AuthLayout from '@/components/layouts/auth/authLayout';
import { Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import { passwordResetCodeSchema } from '@/utils/formValidationSchemas';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { codeTextInputTheme } from '@/utils/themes';
import CustomOutlinedText from '@/components/formikElements/customOutlinedText/customOutlinedText';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import { useSendPasswordResetCodeMutation, usePasswordResetMutation } from '@/store/services/account';
import { useSession } from 'next-auth/react';
import { useToast, useLanguage } from '@/utils/hooks';
import { Send as SendIcon, ThumbUpAlt as ThumbUpAltIcon } from '@mui/icons-material';

type EnterCodePageContentProps = {
	email: string;
};

type FieldKey = 'one' | 'two' | 'three' | 'four' | 'five' | 'six';
const fields: FieldKey[] = ['one', 'two', 'three', 'four', 'five', 'six'];

const EnterCodePageContent = ({ email }: EnterCodePageContentProps) => {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const [reSendPasswordResetCode, { isLoading: isResendLoading }] = useSendPasswordResetCodeMutation();
	const [passwordReset, { isLoading: isPasswordResetLoading }] = usePasswordResetMutation();
	const [isPending, setIsPending] = useState(false);

	const inputRefs: Record<FieldKey, React.RefObject<HTMLInputElement | null>> = {
		one: useRef<HTMLInputElement | null>(null),
		two: useRef<HTMLInputElement | null>(null),
		three: useRef<HTMLInputElement | null>(null),
		four: useRef<HTMLInputElement | null>(null),
		five: useRef<HTMLInputElement | null>(null),
		six: useRef<HTMLInputElement | null>(null),
	};

	// input/onChange handler attached to native input (htmlInput)
	const handleInput = (field: FieldKey, e: React.InputEvent<HTMLInputElement> | React.ChangeEvent<HTMLInputElement>) => {
		const val = (e.currentTarget as HTMLInputElement).value.replace(/\D/g, '').slice(0, 1);
		formik.setFieldValue(field, val);

		// update combined code if you use one
		const next = { ...formik.values, [field]: val } as Record<string, string>;
		formik.setFieldValue('code', fields.map((k) => next[k]).join(''));

		if (val.length >= 1) {
			const i = fields.indexOf(field);
			const nextField = fields[i + 1];
			if (nextField) setTimeout(() => inputRefs[nextField].current?.focus(), 0);
			else setTimeout(() => formik.validateForm().catch(() => {
				// Validation errors are handled by formik state
			}), 0);
		}
	};

	// Backspace navigation on native input
	const handleKeyDown = (field: FieldKey, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace') {
			const curVal = (e.currentTarget as HTMLInputElement).value;
			if (!curVal) {
				const i = fields.indexOf(field);
				const prev = fields[i - 1];
				if (prev) {
					// focus previous
					setTimeout(() => {
						inputRefs[prev].current?.focus();
					}, 0);
				}
			}
		}
	};

	// Paste handler: fill fields with digits from clipboard
	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		const txt = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, fields.length);
		if (!txt) return;
		const digits = txt.split('');
		digits.forEach((ch, idx) => formik.setFieldValue(fields[idx], ch));
		formik.setFieldValue('code', digits.join(''));
		setTimeout(() => {
			formik.validateForm().catch(() => {
				// Validation errors are handled by formik state
			});
			const focusIndex = Math.min(digits.length, fields.length - 1);
			inputRefs[fields[focusIndex]].current?.focus();
		}, 0);
	};

	const formik = useFormik({
		initialValues: { one: '', two: '', three: '', four: '', five: '', six: '', globalError: '' },
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(passwordResetCodeSchema),
		onSubmit: async (values, { setFieldError }) => {
			setIsPending(true);
			const code = values.one + values.two + values.three + values.four + values.five + values.six;
			try {
				await passwordReset({ email, code }).unwrap();
				await cookiesPoster('/api/cookies', { code });
				router.push(AUTH_RESET_PASSWORD_SET_PASSWORD);
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	const renvoyerLeCodeHandler = async () => {
		try {
			await reSendPasswordResetCode({ email }).unwrap();
			onSuccess(t.auth.codeSent);
		} catch (e) {
			onError(t.auth.codeSendFailed);
			const setFieldError = formik.setFieldError;
			setFormikAutoErrors({ e, setFieldError });
		}
	};

	return (
		<>
			<Stack direction="column" className={Styles.contentWrapper} spacing={4}>
				{(isResendLoading || isPending || isPasswordResetLoading) && (
					<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
				)}
				<Stack direction="column" spacing={1}>
					<span className={Styles.content}>{t.auth.enterCode}</span>
					<span className={Styles.paragraphe}>
						{t.auth.codeSentTo} <span className={Styles.email}>{email}</span>
					</span>
				</Stack>
				<form style={{ width: '100%' }} onSubmit={(e) => e.preventDefault()}>
					<Stack direction="column" spacing={8}>
						<Stack
							direction="row"
							justifyContent="space-between"
							alignItems="center"
							spacing={1}
							className={Styles.mobileCodeRootWrapper}
						>
							{fields.map((field) => (
								<CustomOutlinedText
									autoFocus={field === 'one'}
									key={field}
									id={field}
									value={formik.values[field]}
									onBlur={formik.handleBlur(field)}
									error={formik.touched[field] && Boolean(formik.errors[field])}
									type="tel"
									theme={codeTextInputTheme(formik.touched[field] && Boolean(formik.errors[field]))}
									size="medium"
									fullWidth={false}
									slotProps={{
										htmlInput: {
											maxLength: 1,
											onInput: (e: React.InputEvent<HTMLInputElement>) => handleInput(field, e),
											onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleInput(field, e),
											onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(field, e),
											onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => handlePaste(e),
										},
									}}
									inputRef={inputRefs[field]}
								/>
							))}
						</Stack>
						{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
						<Stack direction="column" justifyContent="center" alignItems="center" spacing={2}>
							<PrimaryLoadingButton
								buttonText={t.auth.confirmCode}
								active={!isPasswordResetLoading}
								onClick={formik.handleSubmit}
								cssClass={Styles.emailRegisterButton}
								type="submit"
								startIcon={<ThumbUpAltIcon />}
								loading={isPasswordResetLoading}
							/>
							<TextButton
								buttonText={t.auth.resendCode}
								onClick={renvoyerLeCodeHandler}
								cssClass={Styles.resendCodeButton}
								startIcon={<SendIcon />}
								disabled={isResendLoading}
							/>
						</Stack>
					</Stack>
				</form>
			</Stack>
		</>
	);
};

type Props = {
	email: string;
};

const EnterCodeClient: React.FC<Props> = ({ email }) => {
	const { data: session, status } = useSession();
	const loading = status === 'loading';

	return (
		<>
			{loading && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}
			{!loading && !session && (
				<>
					<Desktop>
						<AuthLayout>
							<EnterCodePageContent email={email} />
						</AuthLayout>
					</Desktop>
					<TabletAndMobile>
						<div style={{ display: 'flex', width: '100%', height: '100%' }}>
							<main className={Styles.main}>
								<EnterCodePageContent email={email} />
							</main>
						</div>
					</TabletAndMobile>
				</>
			)}
		</>
	);
};

export default EnterCodeClient;
