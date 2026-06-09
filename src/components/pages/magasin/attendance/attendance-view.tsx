'use client';

import { isValidElement, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	AccessTime as AccessTimeIcon,
	ArrowBack as ArrowBackIcon,
	Badge as BadgeIcon,
	CalendarMonth as CalendarIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Storefront as StorefrontIcon,
	Subject as RemarkIcon,
	Timer as TimerIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { magasinStatusLabel } from '@/components/pages/magasin/shared/status-labels';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteAttendanceRecordMutation, useGetAttendanceRecordQuery } from '@/store/services/magasin';
import { ATTENDANCE_EDIT, ATTENDANCE_LIST } from '@/utils/routes';
import { extractApiErrorMessage, formatDate, formatNumber } from '@/utils/helpers';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';

type Props = SessionProps & {
	id: number;
	storeId?: number;
};

const InfoRow = ({ icon, label, value }: { icon: ReactNode; label: string; value?: ReactNode }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue = isValidElement(value) ? value : value || '-';

	return (
		<Stack
			direction="row"
			spacing={2}
			sx={{
				alignItems: 'flex-start',
				py: 1.5,
				flexWrap: 'wrap',
			}}
		>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', minWidth: 40 }}>{icon}</Box>
			<Stack
				direction="row"
				spacing={isMobile ? 0 : 2}
				sx={{
					alignItems: 'center',
					flex: 1,
					flexWrap: 'wrap',
				}}
			>
				<Typography
					sx={{
						fontWeight: 600,
						color: 'text.secondary',
						minWidth: { xs: '100%', sm: 220 },
						wordBreak: 'break-word',
					}}
				>
					{label}
				</Typography>
				<Box sx={{ flex: 1 }}>
					{isValidElement(displayValue) ? (
						displayValue
					) : (
						<Typography sx={{ color: 'text.primary' }}>{displayValue}</Typography>
					)}
				</Box>
			</Stack>
		</Stack>
	);
};

const AttendanceViewClient = ({ session, id, storeId: initialStoreId }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const { defaultStore } = useSelectedStore(token);
	const storeId = initialStoreId ?? defaultStore?.id;
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const { data: attendance, isLoading, error } = useGetAttendanceRecordQuery({ id }, { skip: !token });
	const [deleteAttendance] = useDeleteAttendanceRecordMutation();
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);

	const handleDelete = async () => {
		try {
			await deleteAttendance({ id }).unwrap();
			onSuccess(t.magasin.attendanceDeleted);
			router.push(ATTENDANCE_LIST);
		} catch (deleteError) {
			onError(extractApiErrorMessage(deleteError, t.magasin.attendanceDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	return (
		<NavigationBar title={t.magasin.attendanceDetails}>
			<Protected permission="can_view">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Stack
								direction={{ xs: 'column', sm: 'row' }}
								spacing={2}
								sx={{
									justifyContent: 'space-between',
								}}
							>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(ATTENDANCE_LIST)}>
									{t.magasin.backToAttendance}
								</Button>
								{attendance && (
									<Stack direction="row" spacing={1}>
										{permissions.can_edit && (
											<Button
												variant="outlined"
												size="small"
												startIcon={<EditIcon />}
												onClick={() => router.push(ATTENDANCE_EDIT(id, storeId))}
											>
												{t.common.edit}
											</Button>
										)}
										{permissions.can_delete && (
											<Button
												variant="outlined"
												color="error"
												size="small"
												startIcon={<DeleteIcon />}
												onClick={() => setShowDeleteModal(true)}
											>
												{t.common.delete}
											</Button>
										)}
									</Stack>
								)}
							</Stack>
							{isLoading ? (
								<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
							) : (axiosError?.status as number) > 400 ? (
								<ApiAlert errorDetails={axiosError?.data.details} />
							) : !attendance ? (
								<Alert severity="warning">{t.magasin.noRows}</Alert>
							) : (
								<Stack spacing={3}>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack
												direction="row"
												spacing={2}
												sx={{
													alignItems: 'center',
													mb: 2,
													flexWrap: 'wrap',
												}}
											>
												<BadgeIcon color="primary" />
												<Typography
													variant="h6"
													sx={{
														fontWeight: 700,
													}}
												>
													{attendance.employee_name}
												</Typography>
												<Chip
													size="small"
													label={magasinStatusLabel(t, attendance.status)}
													color={
														attendance.status === 'present'
															? 'success'
															: attendance.status === 'absent'
																? 'error'
																: 'default'
													}
												/>
											</Stack>
											<Stack
												direction="row"
												spacing={1}
												sx={{
													flexWrap: 'wrap',
												}}
											>
												<Chip label={`ID: ${attendance.id}`} size="small" variant="outlined" />
												<Chip label={formatDate(attendance.date)} size="small" variant="outlined" />
											</Stack>
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack
												direction="row"
												spacing={2}
												sx={{
													alignItems: 'center',
													mb: 2,
												}}
											>
												<StorefrontIcon color="primary" />
												<Typography
													variant="h6"
													sx={{
														fontWeight: 700,
													}}
												>
													{t.magasin.attendanceInformation}
												</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<InfoRow icon={<StorefrontIcon />} label={t.magasin.store} value={attendance.store_name} />
											<Divider />
											<InfoRow icon={<CalendarIcon />} label={t.magasin.date} value={formatDate(attendance.date)} />
											<Divider />
											<InfoRow icon={<BadgeIcon />} label={t.magasin.employee} value={attendance.employee_name} />
											<Divider />
											<InfoRow icon={<BadgeIcon />} label={t.magasin.responsible} value={attendance.responsible} />
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack
												direction="row"
												spacing={2}
												sx={{
													alignItems: 'center',
													mb: 2,
												}}
											>
												<TimerIcon color="primary" />
												<Typography
													variant="h6"
													sx={{
														fontWeight: 700,
													}}
												>
													{t.magasin.hours}
												</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<InfoRow icon={<AccessTimeIcon />} label={t.magasin.clockIn} value={attendance.clock_in} />
											<Divider />
											<InfoRow icon={<AccessTimeIcon />} label={t.magasin.breakStart} value={attendance.break_start} />
											<Divider />
											<InfoRow icon={<AccessTimeIcon />} label={t.magasin.breakEnd} value={attendance.break_end} />
											<Divider />
											<InfoRow icon={<AccessTimeIcon />} label={t.magasin.clockOut} value={attendance.clock_out} />
											<Divider />
											<InfoRow
												icon={<AccessTimeIcon />}
												label={t.magasin.shift}
												value={magasinStatusLabel(t, attendance.shift)}
											/>
											<Divider />
											<InfoRow
												icon={<TimerIcon />}
												label={t.magasin.hours}
												value={formatNumber(attendance.hours_worked)}
											/>
											<Divider />
											<InfoRow icon={<WarningIcon />} label={t.magasin.delayMinutes} value={attendance.delay_minutes} />
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack
												direction="row"
												spacing={2}
												sx={{
													alignItems: 'center',
													mb: 2,
												}}
											>
												<RemarkIcon color="primary" />
												<Typography
													variant="h6"
													sx={{
														fontWeight: 700,
													}}
												>
													{t.magasin.movementNote}
												</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
												{attendance.observations || '-'}
											</Typography>
										</CardContent>
									</Card>
								</Stack>
							)}
						</Stack>
					</Box>
				</Box>
			</Protected>
			{showDeleteModal && (
				<ActionModals
					title={t.magasin.deleteAttendanceTitle}
					body={t.magasin.deleteAttendanceBody}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					actions={[
						{
							text: t.common.cancel,
							active: false,
							onClick: () => setShowDeleteModal(false),
							icon: <CloseIcon />,
							color: '#6B6B6B',
						},
						{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
					]}
				/>
			)}
		</NavigationBar>
	);
};

export default AttendanceViewClient;
