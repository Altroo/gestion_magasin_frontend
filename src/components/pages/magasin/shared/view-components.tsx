'use client';

import { isValidElement, type ReactNode } from 'react';
import {
	Box,
	Card,
	CardContent,
	Chip,
	Divider,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import {
	Cancel as CancelIcon,
	CheckCircle as CheckCircleIcon,
	PendingActions as PendingActionsIcon,
	RadioButtonUnchecked as EmptyStatusIcon,
} from '@mui/icons-material';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import { magasinStatusLabel } from '@/components/pages/magasin/shared/status-labels';
import type { TranslationDictionary } from '@/types/languageTypes';

type InfoRowProps = {
	icon: ReactNode;
	label: string;
	value?: ReactNode;
};

type DetailCardProps = {
	icon: ReactNode;
	title: ReactNode;
	children: ReactNode;
};

type DetailHeaderCardProps = {
	icon: ReactNode;
	title: ReactNode;
	chips?: ReactNode;
};

type LineItemColumn<T> = {
	key: string;
	label: string;
	align?: 'left' | 'right' | 'center';
	render: (row: T) => ReactNode;
};

type LineItemsCardProps<T> = {
	icon: ReactNode;
	title: ReactNode;
	columns: LineItemColumn<T>[];
	rows: T[];
	getRowKey: (row: T) => string | number;
	emptyLabel: string;
};

type StatusVisual = {
	color: ChipProps['color'];
	icon: (props: SvgIconProps) => ReactNode;
};

const STATUS_VISUALS: Record<string, StatusVisual> = {
	active: { color: 'success', icon: (props) => <CheckCircleIcon {...props} /> },
	confirmed: { color: 'success', icon: (props) => <CheckCircleIcon {...props} /> },
	paid: { color: 'success', icon: (props) => <CheckCircleIcon {...props} /> },
	present: { color: 'success', icon: (props) => <CheckCircleIcon {...props} /> },
	received: { color: 'success', icon: (props) => <CheckCircleIcon {...props} /> },
	validated: { color: 'success', icon: (props) => <CheckCircleIcon {...props} /> },
	absent: { color: 'error', icon: (props) => <CancelIcon {...props} /> },
	cancelled: { color: 'error', icon: (props) => <CancelIcon {...props} /> },
	expired: { color: 'error', icon: (props) => <CancelIcon {...props} /> },
	void: { color: 'error', icon: (props) => <CancelIcon {...props} /> },
	credit: { color: 'warning', icon: (props) => <PendingActionsIcon {...props} /> },
	draft: { color: 'warning', icon: (props) => <PendingActionsIcon {...props} /> },
	in_progress: { color: 'warning', icon: (props) => <PendingActionsIcon {...props} /> },
	off: { color: 'warning', icon: (props) => <PendingActionsIcon {...props} /> },
	payable: { color: 'warning', icon: (props) => <PendingActionsIcon {...props} /> },
};

const getStatusVisual = (status?: string | null): StatusVisual =>
	STATUS_VISUALS[status ?? ''] ?? {
		color: 'default',
		icon: (props) => <EmptyStatusIcon {...props} />,
	};

export const InfoRow = ({ icon, label, value }: InfoRowProps) => {
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

export const DetailCard = ({ icon, title, children }: DetailCardProps) => (
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
				<Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
				<Typography
					variant="h6"
					sx={{
						fontWeight: 700,
					}}
				>
					{title}
				</Typography>
			</Stack>
			<Divider sx={{ mb: 2 }} />
			<Stack spacing={0}>{children}</Stack>
		</CardContent>
	</Card>
);

export const DetailHeaderCard = ({ icon, title, chips }: DetailHeaderCardProps) => (
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
				<Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
				<Typography
					variant="h6"
					sx={{
						fontWeight: 700,
					}}
				>
					{title}
				</Typography>
			</Stack>
			{chips && (
				<Stack
					direction="row"
					spacing={1}
					sx={{
						flexWrap: 'wrap',
					}}
				>
					{chips}
				</Stack>
			)}
		</CardContent>
	</Card>
);

export const StatusChip = ({ t, status }: { t: TranslationDictionary; status?: string | null }) => {
	const visual = getStatusVisual(status);
	const Icon = visual.icon;

	return (
		<Chip
			icon={<Icon />}
			label={magasinStatusLabel(t, status)}
			color={visual.color}
			size="small"
			variant={visual.color === 'default' ? 'outlined' : 'filled'}
		/>
	);
};

export const StatusIcon = ({ t, status }: { t: TranslationDictionary; status?: string | null }) => {
	const visual = getStatusVisual(status);
	const Icon = visual.icon;

	return (
		<DarkTooltip title={magasinStatusLabel(t, status)}>
			<Icon color={visual.color === 'default' ? 'disabled' : visual.color} fontSize="small" />
		</DarkTooltip>
	);
};

export const LineItemsCard = <T,>({ icon, title, columns, rows, getRowKey, emptyLabel }: LineItemsCardProps<T>) => (
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
				<Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
				<Typography
					variant="h6"
					sx={{
						fontWeight: 700,
					}}
				>
					{title}
				</Typography>
			</Stack>
			<Divider sx={{ mb: 2 }} />
			<Table size="small">
				<TableHead>
					<TableRow>
						{columns.map((column) => (
							<TableCell key={column.key} align={column.align}>
								{column.label}
							</TableCell>
						))}
					</TableRow>
				</TableHead>
				<TableBody>
					{rows.length === 0 ? (
						<TableRow>
							<TableCell colSpan={columns.length}>
								<Typography
									variant="body2"
									sx={{
										color: 'text.secondary',
									}}
								>
									{emptyLabel}
								</Typography>
							</TableCell>
						</TableRow>
					) : (
						rows.map((row) => (
							<TableRow key={getRowKey(row)}>
								{columns.map((column) => (
									<TableCell key={column.key} align={column.align}>
										{column.render(row)}
									</TableCell>
								))}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
);
