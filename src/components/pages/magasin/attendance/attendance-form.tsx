'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Divider, InputAdornment, MenuItem, Stack, TextField, ThemeProvider, Typography } from '@mui/material';
import {
	Add as AddIcon, ArrowBack as ArrowBackIcon, Badge as BadgeIcon,
	Edit as EditIcon, Event as EventIcon, Schedule as ScheduleIcon,
	Subject as RemarkIcon, Warning as WarningIcon }
	from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { MuiFormikDatePicker, MuiFormikTimePicker } from '@/components/formikElements/muiPickers/muiPickers';
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
import type { AttendanceFormValues, AttendancePayload, AttendanceShiftType } from '@/types/gestionMagasinTypes';

const inputTheme = textInputTheme();
const dropdownTheme = customDropdownTheme();
const shiftStartMinutes: Record<Exclude<AttendanceShiftType, 'off'>, number> = {
	morning: 9 * 60,
	afternoon: 15 * 60,
	evening: 19 * 60,
};

const parseTimeMinutes = (value?: string | null) => {
	if (!value) return null;
	const [hours, minutes] = value.split(':').map(Number);
	if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
	return hours * 60 + minutes;
};

type AttendanceTimeFields = Pick<AttendanceFormValues, 'status' | 'clock_in' | 'break_start' | 'break_end' | 'clock_out'>;
type AttendanceDelayFields = Pick<AttendanceFormValues, 'status' | 'shift' | 'clock_in'>;

const calculateWorkedHours = (values: AttendanceTimeFields) => {
	if (values.status !== 'present') return '0';
	const clockIn = parseTimeMinutes(values.clock_in);
	const clockOut = parseTimeMinutes(values.clock_out);
	if (clockIn === null || clockOut === null) return '';
	let totalMinutes = clockOut - clockIn;
	if (totalMinutes < 0) totalMinutes += 24 * 60;
	const breakStart = parseTimeMinutes(values.break_start);
	const breakEnd = parseTimeMinutes(values.break_end);
	if (breakStart !== null && breakEnd !== null) {
		let pauseMinutes = breakEnd - breakStart;
		if (pauseMinutes < 0) pauseMinutes += 24 * 60;
		totalMinutes -= pauseMinutes;
	}
	return String(Math.max(totalMinutes / 60, 0).toFixed(2));
};

const calculateDelayMinutes = (values: AttendanceDelayFields) => {
	if (values.status !== 'present' || values.shift === 'off') return '0';
	if (!values.shift) return '';
	const clockIn = parseTimeMinutes(values.clock_in);
	if (clockIn === null) return '';
	return String(Math.max(clockIn - shiftStartMinutes[values.shift], 0));
};

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
	shift: values.shift as AttendanceShiftType,
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
			shift: attendance?.shift ?? 'morning',
			hours_worked: attendance?.hours_worked ?? '',
			delay_minutes: attendance?.delay_minutes !== undefined ? String(attendance.delay_minutes) : '',
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
			shift: t.magasin.shift,
			hours_worked: t.magasin.hours,
			delay_minutes: t.magasin.delayMinutes,
			status: t.magasin.status,
			responsible: t.magasin.responsible,
			observations: t.magasin.movementNote,
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
	const handleStatusChange = (statusValue: AttendanceFormValues['status']) => {
		void formik.setFieldValue('status', statusValue);
		if (statusValue === 'off') {
			void formik.setFieldValue('shift', 'off');
		} else if (formik.values.shift === 'off') {
			void formik.setFieldValue('shift', 'morning');
		}
	};
	const {
		clock_in: clockIn,
		break_start: breakStart,
		break_end: breakEnd,
		clock_out: clockOut,
		status: attendanceStatus,
		shift,
		hours_worked: hoursWorked,
		delay_minutes: delayMinutes,
	} = formik.values;
	const { setFieldValue } = formik;

	useEffect(() => {
		const nextHours = calculateWorkedHours({
			status: attendanceStatus,
			clock_in: clockIn,
			break_start: breakStart,
			break_end: breakEnd,
			clock_out: clockOut,
		});
		const nextDelay = calculateDelayMinutes({
			status: attendanceStatus,
			shift,
			clock_in: clockIn,
		});
		if (hoursWorked !== nextHours) {
			void setFieldValue('hours_worked', nextHours, false);
		}
		if (delayMinutes !== nextDelay) {
			void setFieldValue('delay_minutes', nextDelay, false);
		}
	}, [
		attendanceStatus,
		breakEnd,
		breakStart,
		clockIn,
		clockOut,
		delayMinutes,
		hoursWorked,
		setFieldValue,
		shift,
	]);

	return (
        <NavigationBar title={isEditMode ? t.magasin.editAttendance : t.magasin.newAttendance}>
            <Protected permission={isEditMode ? 'can_edit' : 'can_create'}>
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Button
								variant="outlined"
								startIcon={<ArrowBackIcon />}
								onClick={() => router.push(ATTENDANCE_LIST)}
								sx={{ alignSelf: 'flex-start' }}
							>
								{t.magasin.backToAttendance}
							</Button>
							{Object.keys(validationErrors).length > 0 && (
								<Alert severity="error" icon={<WarningIcon />}>
									<Typography variant="subtitle2" sx={{
                                        fontWeight: 600
                                    }}>
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
							{isLoading ? (
								<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
							) : shouldShowError ? (
								<ApiAlert errorDetails={axiosError?.data.details} />
							) : (
								<form onSubmit={formik.handleSubmit}>
									<Stack spacing={3}>
										<Card elevation={2}>
											<CardContent sx={{ p: 3 }}>
												<Stack
													direction="row"
													spacing={2}
													sx={{
															alignItems: "center",
															mb: 2
													}}>
													<BadgeIcon color="primary" />
													<Typography variant="h6" sx={{
                                                        fontWeight: 700
                                                    }}>
														{t.magasin.attendanceInformation}
													</Typography>
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
															slotProps={{
																input: {
																	startAdornment: (
																		<InputAdornment position="start">
																			<BadgeIcon fontSize="small" />
																		</InputAdornment>
																	),
																},
															}}
															fullWidth
														>
															<MenuItem value="">{t.common.selectValue}</MenuItem>
															{employees?.results.map((employee) => (
																<MenuItem key={employee.id} value={String(employee.id)}>
																	{employee.full_name}
																</MenuItem>
															))}
														</TextField>
													</ThemeProvider>
													<Box
														sx={{
															display: 'grid',
															gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
															gap: 2.5,
														}}
													>
														<MuiFormikDatePicker
															id="date"
															label={`${t.magasin.date} *`}
															value={formik.values.date}
															onChange={(value) => void formik.setFieldValue('date', value)}
															onBlur={formik.handleBlur('date')}
															error={Boolean(fieldError('date'))}
															helperText={fieldError('date')}
															fullWidth
															size="small"
															startIcon={<EventIcon fontSize="small" />}
														/>
														<ThemeProvider theme={dropdownTheme}>
															<TextField
																select
																size="small"
																id="status"
																label={`${t.magasin.status} *`}
																value={formik.values.status}
																onChange={(event) =>
																	handleStatusChange(event.target.value as AttendanceFormValues['status'])
																}
																onBlur={formik.handleBlur('status')}
																error={Boolean(fieldError('status'))}
																helperText={fieldError('status')}
																fullWidth
															>
																<MenuItem value="present">{t.magasin.present}</MenuItem>
																<MenuItem value="off">{t.magasin.off}</MenuItem>
																<MenuItem value="absent">{t.magasin.absent}</MenuItem>
															</TextField>
														</ThemeProvider>
														<ThemeProvider theme={dropdownTheme}>
															<TextField
																select
																size="small"
																id="shift"
																label={`${t.magasin.shift} *`}
																value={formik.values.shift}
																onChange={(event) => void formik.setFieldValue('shift', event.target.value)}
																onBlur={formik.handleBlur('shift')}
																error={Boolean(fieldError('shift'))}
																helperText={fieldError('shift')}
																disabled={formik.values.status === 'off'}
																fullWidth
																>
																	<MenuItem value="morning">{t.magasin.morningShift}</MenuItem>
																	<MenuItem value="afternoon">{t.magasin.afternoonShift}</MenuItem>
																	<MenuItem value="evening">{t.magasin.eveningShift}</MenuItem>
																	<MenuItem value="off">{t.magasin.off}</MenuItem>
																</TextField>
														</ThemeProvider>
														{(['clock_in', 'break_start', 'break_end', 'clock_out'] as const).map((field) => (
															<MuiFormikTimePicker
																key={field}
																id={field}
																label={fieldLabels[field]}
																value={formik.values[field]}
																onChange={(value) => void formik.setFieldValue(field, value)}
																onBlur={formik.handleBlur(field)}
																error={Boolean(fieldError(field))}
																helperText={fieldError(field)}
																fullWidth
																size="small"
																startIcon={<ScheduleIcon fontSize="small" />}
															/>
														))}
														<CustomTextInput
															id="hours_worked"
															type="number"
															label={t.magasin.hours}
															value={formik.values.hours_worked}
															onChange={formik.handleChange('hours_worked')}
															onBlur={formik.handleBlur('hours_worked')}
															error={Boolean(fieldError('hours_worked'))}
															helperText={fieldError('hours_worked')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<ScheduleIcon fontSize="small" />}
															disabled
														/>
														<CustomTextInput
															id="delay_minutes"
															type="number"
															label={t.magasin.delayMinutes}
															value={formik.values.delay_minutes}
															onChange={formik.handleChange('delay_minutes')}
															onBlur={formik.handleBlur('delay_minutes')}
															error={Boolean(fieldError('delay_minutes'))}
															helperText={fieldError('delay_minutes')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<ScheduleIcon fontSize="small" />}
															disabled
														/>
													</Box>
													<CustomTextInput
														id="responsible"
														type="text"
														label={t.magasin.responsible}
														value={formik.values.responsible}
														onChange={formik.handleChange('responsible')}
														onBlur={formik.handleBlur('responsible')}
														error={Boolean(fieldError('responsible'))}
														helperText={fieldError('responsible')}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<BadgeIcon fontSize="small" />}
													/>
												</Stack>
											</CardContent>
										</Card>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack
                                                    direction="row"
                                                    spacing={2}
                                                    sx={{
                                                        alignItems: "center",
                                                        mb: 2
                                                    }}>
													<RemarkIcon color="primary" />
													<Typography variant="h6" sx={{
                                                        fontWeight: 700
                                                    }}>
														{t.magasin.movementNote}
													</Typography>
												</Stack>
												<Divider sx={{ mb: 3 }} />
												<CustomTextInput
													id="observations"
													type="textarea"
													label={t.magasin.movementNote}
													value={formik.values.observations}
													onChange={formik.handleChange('observations')}
													onBlur={formik.handleBlur('observations')}
													error={Boolean(fieldError('observations'))}
													helperText={fieldError('observations')}
													fullWidth
													size="small"
													multiline
													rows={3}
													theme={inputTheme}
													startIcon={<RemarkIcon fontSize="small" />}
												/>
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

export default AttendanceFormClient;
