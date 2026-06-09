import { Box, Paper, Typography } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useLanguage } from '@/utils/hooks';

const NoPermission = () => {
	const { t } = useLanguage();
	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '60vh',
				px: 2,
			}}
		>
			<Paper
				elevation={3}
				sx={{
					p: 6,
					maxWidth: 500,
					width: '100%',
					textAlign: 'center',
					borderRadius: 3,
					background: 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)',
				}}
			>
				{/* Icon container */}
				<Box
					sx={{
						display: 'inline-flex',
						p: 2,
						borderRadius: '50%',
						backgroundColor: 'error.lighter',
						mb: 2,
					}}
				>
					<LockIcon
						sx={{
							fontSize: 48,
							color: 'error.main',
						}}
					/>
				</Box>

				{/* Title */}
				<Typography
					variant="h5"
					gutterBottom
					sx={{
						fontWeight: 600,
						color: 'text.primary',
					}}
				>
					{t.errors.accessDenied}
				</Typography>

				{/* Description */}
				<Typography
					variant="body1"
					sx={{
						color: 'text.secondary',
						mb: 3,
					}}
				>
					{t.errors.accessDeniedText}
				</Typography>
			</Paper>
		</Box>
	);
};

export default NoPermission;
