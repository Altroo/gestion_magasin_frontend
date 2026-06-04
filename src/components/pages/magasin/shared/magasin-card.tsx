import type { ReactNode } from 'react';
import { Box, Card, CardContent, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { InfoOutlined as InfoOutlinedIcon, InsertChartOutlined as InsertChartOutlinedIcon } from '@mui/icons-material';
import type { CardProps } from '@mui/material/Card';
import type { SxProps, Theme } from '@mui/material/styles';

type MagasinKpiCardProps = {
	icon: ReactNode;
	label: string;
	value: string | number;
	sub?: string;
	color: string;
};

export const MagasinKpiCard = ({ icon, label, value, sub, color }: MagasinKpiCardProps) => (
	<Card
		elevation={1}
		sx={{
			height: '100%',
			position: 'relative',
			overflow: 'hidden',
			'&::before': {
				content: '""',
				position: 'absolute',
				top: 0,
				left: 0,
				width: 3,
				height: '100%',
				bgcolor: color,
			},
		}}
	>
		<CardContent sx={{ pl: 2.5 }}>
			<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 0.5 }}>
				<Box sx={{ color, display: 'flex' }}>{icon}</Box>
				<Typography
					variant="caption"
					sx={{
						color: 'text.secondary',
						textTransform: 'uppercase',
						letterSpacing: 0,
					}}
				>
					{label}
				</Typography>
			</Stack>
			<Typography variant="h5" sx={{ fontWeight: 700 }}>
				{value}
			</Typography>
			{sub && (
				<Typography variant="body2" sx={{ color: 'text.secondary' }}>
					{sub}
				</Typography>
			)}
		</CardContent>
	</Card>
);

type MagasinSectionCardProps = CardProps & {
	children: ReactNode;
	title?: string;
	icon?: ReactNode;
	action?: ReactNode;
	infoTooltip?: string;
	contentSx?: SxProps<Theme>;
};

export const MagasinSectionCard = ({
	children,
	title,
	icon,
	action,
	infoTooltip,
	contentSx,
	sx,
	...cardProps
}: MagasinSectionCardProps) => (
	<Card elevation={2} sx={{ overflow: 'hidden', ...sx }} {...cardProps}>
		{title && (
			<CardContent sx={{ pb: 0 }}>
				<Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
					<Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
						{icon && <Box sx={{ color: 'primary.main', display: 'flex', flexShrink: 0 }}>{icon}</Box>}
						<Typography variant="h6" sx={{ fontWeight: 700, minWidth: 0 }}>
							{title}
						</Typography>
					</Stack>
					<Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
						{infoTooltip && (
							<Tooltip title={infoTooltip} arrow placement="top">
								<IconButton size="small" sx={{ color: 'text.secondary' }}>
									<InfoOutlinedIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						)}
						{action}
					</Stack>
				</Stack>
				<Divider sx={{ mt: 2 }} />
			</CardContent>
		)}
		<CardContent sx={contentSx}>{children}</CardContent>
	</Card>
);

export const MagasinEmptyChart = ({ message }: { message: string }) => (
	<Box
		sx={{
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			alignItems: 'center',
			height: '100%',
			bgcolor: 'grey.50',
			borderRadius: 2,
			border: '1px dashed',
			borderColor: 'grey.300',
			color: 'text.secondary',
			textAlign: 'center',
			px: 2,
		}}
	>
		<InsertChartOutlinedIcon sx={{ mb: 1, fontSize: 30 }} />
		<Typography variant="body2">{message}</Typography>
	</Box>
);
