import type { ReactNode } from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
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
	contentSx?: SxProps<Theme>;
};

export const MagasinSectionCard = ({
	children,
	title,
	icon,
	action,
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
					{action}
				</Stack>
				<Divider sx={{ mt: 2 }} />
			</CardContent>
		)}
		<CardContent sx={contentSx}>{children}</CardContent>
	</Card>
);
