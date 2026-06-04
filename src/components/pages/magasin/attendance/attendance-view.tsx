'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon, Badge as BadgeIcon } from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteAttendanceRecordMutation, useGetAttendanceRecordQuery } from '@/store/services/magasin';
import { ATTENDANCE_EDIT, ATTENDANCE_LIST } from '@/utils/routes';
import { extractApiErrorMessage, formatNumber } from '@/utils/helpers';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';

type Props = SessionProps & {
	id: number;
	storeId?: number;
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
	const axiosError = useMemo(() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined), [error]);

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
							<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(ATTENDANCE_LIST)}>
									{t.magasin.backToAttendance}
								</Button>
								{attendance && (
									<Stack direction="row" spacing={1}>
										{permissions.can_edit && (
											<Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => router.push(ATTENDANCE_EDIT(id, storeId))}>
												{t.common.edit}
											</Button>
										)}
										{permissions.can_delete && (
											<Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setShowDeleteModal(true)}>
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
								<Card elevation={2}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<BadgeIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>{attendance.employee_name}</Typography>
											<Chip size="small" label={attendance.status} />
										</Stack>
										<Divider sx={{ mb: 2 }} />
										<Stack spacing={1}>
											<Typography>{t.magasin.store}: {attendance.store_name}</Typography>
											<Typography>{t.magasin.date}: {attendance.date}</Typography>
											<Typography>{t.magasin.clockIn}: {attendance.clock_in ?? '-'}</Typography>
											<Typography>{t.magasin.breakStart}: {attendance.break_start ?? '-'}</Typography>
											<Typography>{t.magasin.breakEnd}: {attendance.break_end ?? '-'}</Typography>
											<Typography>{t.magasin.clockOut}: {attendance.clock_out ?? '-'}</Typography>
											<Typography>{t.magasin.hours}: {formatNumber(attendance.hours_worked)}</Typography>
											<Typography>{t.magasin.delayMinutes}: {attendance.delay_minutes}</Typography>
											<Typography>{t.magasin.responsible}: {attendance.responsible || '-'}</Typography>
											<Typography>{t.magasin.observations}: {attendance.observations || '-'}</Typography>
										</Stack>
									</CardContent>
								</Card>
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
						{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
						{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
					]}
				/>
			)}
		</NavigationBar>
	);
};

export default AttendanceViewClient;
