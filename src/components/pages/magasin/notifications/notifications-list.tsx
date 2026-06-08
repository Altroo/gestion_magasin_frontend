'use client';

import {
	Alert,
	Box,
	FormControlLabel,
	Stack,
	Switch,
} from '@mui/material';
import { Notifications as NotificationsIcon, Save as SaveIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useGetNotificationPreferencesQuery,
	useUpdateNotificationPreferencesMutation,
} from '@/store/services/notification';
import { notificationPreferencesSchema } from '@/utils/formValidationSchemas';
import { setFormikAutoErrors } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';
import { textInputTheme } from '@/utils/themes';
import Styles from '@/styles/dashboard/settings/settings.module.sass';
import type { SessionProps } from '@/types/_initTypes';
import type { NotificationPreferenceFormValues } from '@/types/gestionMagasinTypes';

const inputTheme = textInputTheme();

const NotificationsClient = ({ session }: SessionProps) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const { data: preferences } = useGetNotificationPreferencesQuery(undefined, { skip: !token });
	const [updatePreferences, updateState] = useUpdateNotificationPreferencesMutation();

	const preferencesFormik = useFormik<NotificationPreferenceFormValues>({
		initialValues: {
			notify_low_stock: preferences?.notify_low_stock ?? false,
			notify_stock_add_requests: preferences?.notify_stock_add_requests ?? false,
			browser_notifications: preferences?.browser_notifications ?? false,
			low_stock_repeat_hours: String(preferences?.low_stock_repeat_hours ?? 24),
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(notificationPreferencesSchema),
		onSubmit: async (values, { setFieldError }) => {
			try {
				await updatePreferences({
					notify_low_stock: values.notify_low_stock,
					notify_stock_add_requests: values.notify_stock_add_requests,
					browser_notifications: values.browser_notifications,
					low_stock_repeat_hours: Number(values.low_stock_repeat_hours),
				}).unwrap();
				onSuccess(t.magasin.savePreferences);
			} catch (e) {
				onError(t.errors.genericError);
				setFormikAutoErrors({ e, setFieldError });
			}
		},
	});

	return (
		<NavigationBar title={t.magasin.notificationPreferences}>
			<Protected permission="can_edit">
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					<Box sx={{ width: '100%', display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' } }}>
						<Stack direction="column" alignItems="center" spacing={2} className={Styles.flexRootStack} mt="32px">
							<h2 className={Styles.pageTitle}>{t.magasin.notificationPreferences}</h2>
							<form className={Styles.form} onSubmit={(event) => event.preventDefault()}>
								<Stack direction="column" justifyContent="center" alignItems="center" spacing={2}>
									<Box
										sx={{
											width: '100%',
											maxWidth: 365,
											display: 'flex',
											flexDirection: 'column',
											gap: 1,
										}}
									>
										<FormControlLabel
											control={
												<Switch
													checked={preferencesFormik.values.notify_low_stock}
													onChange={(_, checked) => void preferencesFormik.setFieldValue('notify_low_stock', checked)}
													name="notify_low_stock"
													disabled={updateState.isLoading}
												/>
											}
											label={t.magasin.notifyLowStock}
										/>
										<FormControlLabel
											control={
												<Switch
													checked={preferencesFormik.values.notify_stock_add_requests}
													onChange={(_, checked) => void preferencesFormik.setFieldValue('notify_stock_add_requests', checked)}
													name="notify_stock_add_requests"
													disabled={updateState.isLoading}
												/>
											}
											label={t.magasin.notifyStockAddRequests}
										/>
										<FormControlLabel
											control={
												<Switch
													checked={preferencesFormik.values.browser_notifications}
													onChange={(_, checked) => void preferencesFormik.setFieldValue('browser_notifications', checked)}
													name="browser_notifications"
													disabled={updateState.isLoading}
												/>
											}
											label={t.magasin.browserNotifications}
										/>
									</Box>
								<CustomTextInput
									id="low_stock_repeat_hours"
									name="low_stock_repeat_hours"
									type="number"
									theme={inputTheme}
									label={t.magasin.repeatHours}
									value={preferencesFormik.values.low_stock_repeat_hours}
									onChange={preferencesFormik.handleChange}
									onBlur={preferencesFormik.handleBlur}
									error={preferencesFormik.touched.low_stock_repeat_hours && Boolean(preferencesFormik.errors.low_stock_repeat_hours)}
									helperText={preferencesFormik.touched.low_stock_repeat_hours ? preferencesFormik.errors.low_stock_repeat_hours : ''}
									fullWidth
									size="small"
									startIcon={<NotificationsIcon fontSize="small" />}
									cssClass={Styles.maxInputWidth}
								/>
								{preferencesFormik.errors.globalError && (
									<Alert severity="error" sx={{ width: '100%', maxWidth: 365 }}>
										{preferencesFormik.errors.globalError}
									</Alert>
								)}
								<PrimaryLoadingButton
									type="submit"
									startIcon={<SaveIcon />}
									buttonText={t.magasin.savePreferences}
									loading={updateState.isLoading}
									active={!updateState.isLoading}
									onClick={() => preferencesFormik.handleSubmit()}
									cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
								/>
								</Stack>
							</form>
						</Stack>
					</Box>
				</main>
			</Protected>
		</NavigationBar>
	);
};

export default NotificationsClient;
