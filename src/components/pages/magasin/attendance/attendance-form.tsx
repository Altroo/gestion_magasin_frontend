'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Divider, InputAdornment, MenuItem, Stack, TextField, ThemeProvider, Typography } from '@mui/material';
import { Add as AddIcon, ArrowBack as ArrowBackIcon, Badge as BadgeIcon, Edit as EditIcon, Event as EventIcon, Schedule as ScheduleIcon, Warning as WarningIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAddAttendanceRecordMutation, useEditAttendanceRecordMutation, useGetAttendanceRecordQuery, useGetEmployeesQuery } from '@/store/services/magasin';
import { ATTENDANCE_LIST, ATTENDANCE_VIEW } from '@/utils/routes';
import { attendanceSchema } from '@/utils/formValidationSchemas';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { extractApiErrorMessage, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { AttendanceFormValues, AttendancePayload } from '@/types/gestionMagasinTypes';

const inputTheme = textInputTheme();
const dropdownTheme = customDropdownTheme();

type Props = SessionProps & {
	id?: number;
	storeId?: number;
};

const toPayload = (values: AttendanceFormValues, storeId: number): AttendancePayload => ({
	store: storeId,
	employee: Number(values.employee),
	date: values.date,
	clock_in: values.clock_in || null,
	break_start: values.break_start || null,
	break_end: values.break_end || null,
	clock_out: values.clock_out || null,
	hours_worked: values.hours_worked,
	delay_minutes: Number(values.delay_minutes || 0),
	status: values.status as AttendancePayload['status'],
	responsible: values.responsible,
	observations: values.observations,
});

const AttendanceFormClient = ({ session, id, storeId: initialStoreId }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const isEditMode = id !== undefined;
	const { defaultStore } = useSelectedStore(token);
	const storeId = initialStoreId ?? defaultStore?.id;
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const { data: attendance, isLoading: isAttendanceLoading, error: attendanceError } = useGetAttendanceRecordQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);
	const { data: employees, isLoading: areEmployeesLoading } = useGetEmployeesQuery(
		{ store: storeId, pageSize: 200 },
		{ skip: !token || !storeId },
	);
	const [addAttendance, addState] = useAddAttendanceRecordMutation();
	const [editAttendance, editState] = useEditAttendanceRecordMutation();
	const error = attendanceError || addState.error || editState.error;
	const axiosError = useMemo(() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined), [error]);

	const formik = useFormik<AttendanceFormValues>({
		initialValues: {
			employee: attendance?.employee ? String(attendance.employee) : '',
			date: attendance?.date ?? '',
			clock_in: attendance?.clock_in ?? '',
			break_start: attendance?.break_start ?? '',
			break_end: attendance?.break_end ?? '',
			clock_out: attendance?.clock_out ?? '',
			hours_worked: attendance?.hours_worked ?? '0',
			delay_minutes: attendance?.delay_minutes !== undefined ? String(attendance.delay_minutes) : '0',
			status: attendance?.status ?? 'present',
			responsible: attendance?.responsible ?? '',
			observations: attendance?.observations ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(attendanceSchema),
		onSubmit: async (values, { setFieldError }) => {
			if (!storeId) return;
			setHasAttemptedSubmit(true);
			setIsPending(true);
			try {
				if (isEditMode) {
					await editAttendance({ id: id!, data: toPayload(values, storeId) }).unwrap();
					onSuccess(t.magasin.attendanceUpdated);
					router.push(ATTENDANCE_VIEW(id!, storeId));
				} else {
					await addAttendance(toPayload(values, storeId)).unwrap();
					onSuccess(t.magasin.attendanceCreated);
					router.push(ATTENDANCE_LIST);
				}
			} catch (e) {
				onError(extractApiErrorMessage(e, isEditMode ? t.magasin.attendanceUpdateError : t.magasin.attendanceCreateError));
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			employee: t.magasin.employee,
			date: t.magasin.date,
			clock_in: t.magasin.clockIn,
			break_start: t.magasin.breakStart,
			break_end: t.magasin.breakEnd,
			clock_out: t.magasin.clockOut,
			hours_worked: t.magasin.hours,
			delay_minutes: t.magasin.delayMinutes,
			status: t.magasin.status,
			responsible: t.magasin.responsible,
			observations: t.magasin.observations,
			globalError: t.errors.globalError,
		}),
		[t],
	);
	const validationErrors = useMemo(() => {
		const errors: Record<string, string> = {};
		if (hasAttemptedSubmit) {
			Object.entries(formik.errors).forEach(([key, value]) => {
				if (key !== 'globalError' && typeof value === 'string') errors[key] = value;
			});
		}
		return errors;
	}, [formik.errors, hasAttemptedSubmit]);
	const isLoading = isPending || addState.isLoading || editState.isLoading || areEmployeesLoading || (isEditMode && isAttendanceLoading);
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;
	const fieldError = (field: keyof AttendanceFormValues) =>
		(formik.touched[field] || hasAttemptedSubmit) && typeof formik.errors[field] === 'string'
			? (formik.errors[field] as string)
			: '';

	return (
		<NavigationBar title={isEditMode ? t.magasin.editAttendance : t.magasin.newAttendance}>
			<Protected permission={isEditMode ? 'can_edit' : 'can_create'}>
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(ATTENDANCE_LIST)} sx={{ alignSelf: 'flex-start' }}>
								{t.magasin.backToAttendance}
							</Button>
							{Object.keys(validationErrors).length > 0 && (
								<Alert severity="error" icon={<WarningIcon />}>
									<Typography variant="subtitle2" fontWeight={600}>{t.users.validationErrorsDetected}</Typography>
									<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
										{Object.entries(validationErrors).map(([key, errorMessage]) => (
											<li key={key}><Typography variant="body2">{getLabelForKey(fieldLabels, key)} : {errorMessage}</Typography></li>
										))}
									</ul>
								</Alert>
							)}
							{isLoading ? (
								<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
							) : shouldShowError ? (
								<ApiAlert errorDetails={axiosError?.data.details} />
							) : (
								<form onSubmit={formik.handleSubmit}>
									<Card elevation={2}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<BadgeIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{t.magasin.attendanceInformation}</Typography>
											</Stack>
											<Divider sx={{ mb: 3 }} />
											<Stack spacing={2.5}>
												<ThemeProvider theme={dropdownTheme}>
													<TextField
														select
														size="small"
														id="employee"
														label={`${t.magasin.employee} *`}
														value={formik.values.employee}
														onChange={(event) => void formik.setFieldValue('employee', event.target.value)}
														onBlur={formik.handleBlur('employee')}
														error={Boolean(fieldError('employee'))}
														helperText={fieldError('employee')}
														InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon fontSize="small" /></InputAdornment> }}
														fullWidth
													>
														<MenuItem value="">{t.common.selectValue}</MenuItem>
														{employees?.results.map((employee) => (
															<MenuItem key={employee.id} value={String(employee.id)}>{employee.full_name}</MenuItem>
														))}
													</TextField>
												</ThemeProvider>
												<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}>
													<CustomTextInput id="date" type="date" label={`${t.magasin.date} *`} value={formik.values.date} onChange={formik.handleChange('date')} onBlur={formik.handleBlur('date')} error={Boolean(fieldError('date'))} helperText={fieldError('date')} fullWidth size="small" theme={inputTheme} startIcon={<EventIcon fontSize="small" />} shrink />
													<ThemeProvider theme={dropdownTheme}>
														<TextField select size="small" id="status" label={`${t.magasin.status} *`} value={formik.values.status} onChange={(event) => void formik.setFieldValue('status', event.target.value)} onBlur={formik.handleBlur('status')} error={Boolean(fieldError('status'))} helperText={fieldError('status')} fullWidth>
															<MenuItem value="present">{t.magasin.present}</MenuItem>
															<MenuItem value="off">{t.magasin.off}</MenuItem>
															<MenuItem value="absent">{t.magasin.absent}</MenuItem>
														</TextField>
													</ThemeProvider>
													{(['clock_in', 'break_start', 'break_end', 'clock_out'] as const).map((field) => (
														<CustomTextInput key={field} id={field} type="time" label={fieldLabels[field]} value={formik.values[field]} onChange={formik.handleChange(field)} onBlur={formik.handleBlur(field)} error={Boolean(fieldError(field))} helperText={fieldError(field)} fullWidth size="small" theme={inputTheme} startIcon={<ScheduleIcon fontSize="small" />} shrink />
													))}
													<CustomTextInput id="hours_worked" type="number" label={`${t.magasin.hours} *`} value={formik.values.hours_worked} onChange={formik.handleChange('hours_worked')} onBlur={formik.handleBlur('hours_worked')} error={Boolean(fieldError('hours_worked'))} helperText={fieldError('hours_worked')} fullWidth size="small" theme={inputTheme} startIcon={<ScheduleIcon fontSize="small" />} />
													<CustomTextInput id="delay_minutes" type="number" label={`${t.magasin.delayMinutes} *`} value={formik.values.delay_minutes} onChange={formik.handleChange('delay_minutes')} onBlur={formik.handleBlur('delay_minutes')} error={Boolean(fieldError('delay_minutes'))} helperText={fieldError('delay_minutes')} fullWidth size="small" theme={inputTheme} startIcon={<ScheduleIcon fontSize="small" />} />
												</Box>
												<CustomTextInput id="responsible" type="text" label={t.magasin.responsible} value={formik.values.responsible} onChange={formik.handleChange('responsible')} onBlur={formik.handleBlur('responsible')} error={Boolean(fieldError('responsible'))} helperText={fieldError('responsible')} fullWidth size="small" theme={inputTheme} startIcon={<BadgeIcon fontSize="small" />} />
												<CustomTextInput id="observations" type="text" label={t.magasin.observations} value={formik.values.observations} onChange={formik.handleChange('observations')} onBlur={formik.handleBlur('observations')} error={Boolean(fieldError('observations'))} helperText={fieldError('observations')} fullWidth size="small" theme={inputTheme} startIcon={<BadgeIcon fontSize="small" />} />
											</Stack>
										</CardContent>
									</Card>
									<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
										<PrimaryLoadingButton
											type="submit"
											buttonText={isEditMode ? t.magasin.editAttendance : t.magasin.newAttendance}
											active={!isPending}
											loading={isPending}
											startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
											onClick={(event) => {
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
								</form>
							)}
						</Stack>
					</Box>
				</Box>
			</Protected>
		</NavigationBar>
	);
};

export default AttendanceFormClient;
