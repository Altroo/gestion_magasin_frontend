'use client';

import React from 'react';
import Image from 'next/image';
import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import { useAppSelector, useLanguage } from '@/utils/hooks';
import { getWSMaintenanceState } from '@/store/selectors';
import Logo from '../../../../public/assets/images/gestion-magasin-logo.svg';
import IlluSVG from '../../../../public/assets/images/auth_illu/pos-receipt.svg';

const Maintenance: React.FC = () => {
	const maintenance = useAppSelector(getWSMaintenanceState);
	const { t } = useLanguage();

	if (!maintenance) {
		return null;
	}

	return (
		<Box
			data-testid="maintenance-gate"
			sx={{
				position: 'fixed',
				inset: 0,
				zIndex: (theme) => theme.zIndex.modal + 100,
				backgroundColor: '#FFFFFF',
				overflowY: 'auto',
			}}
		>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: {
						xs: '1fr',
						md: 'minmax(280px, 32%) 1fr',
					},
					minHeight: '100vh',
				}}
			>
				<Box
					sx={{
						display: { xs: 'none', md: 'flex' },
						flexDirection: 'column',
						justifyContent: 'space-between',
						background: 'linear-gradient(180deg, #FFF3E0 0%, #FCE8CC 100%)',
						p: 5,
						overflow: 'hidden',
					}}
				>
					<Image src={Logo} alt={t.common.appLogo} priority style={{ width: '150px', height: 'auto' }} />
					<Box sx={{ width: '100%', maxWidth: 420 }}>
						<Image src={IlluSVG} alt="" priority style={{ width: '100%', height: 'auto' }} />
					</Box>
				</Box>

				<Stack
					component="main"
					role="alertdialog"
					aria-live="assertive"
					aria-labelledby="maintenance-title"
					aria-describedby="maintenance-description"
					sx={{
						minHeight: '100vh',
						justifyContent: 'center',
						px: { xs: 3, sm: 6, md: 8 },
						py: { xs: 5, sm: 6, md: 8 },
						background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
					}}
				>
					<Stack
						direction="row"
						sx={{
							justifyContent: 'center',
							display: { xs: 'flex', md: 'none' },
							mb: 4,
						}}
					>
						<Image src={Logo} alt={t.common.appLogo} priority style={{ width: '88px', height: 'auto' }} />
					</Stack>

					<Paper
						elevation={0}
						sx={{
							width: '100%',
							maxWidth: 560,
							p: { xs: 4, sm: 5 },
							borderRadius: 4,
							border: '1px solid',
							borderColor: 'divider',
							boxShadow: '0 24px 80px rgba(13, 7, 11, 0.08)',
							backgroundColor: '#FFFFFF',
						}}
					>
						<Stack spacing={3}>
							<Chip
								icon={<BuildCircleOutlinedIcon />}
								label={t.errors.maintenanceChip}
								sx={{
									alignSelf: 'flex-start',
									backgroundColor: '#FFF3E0',
									color: '#A15C07',
									fontWeight: 600,
								}}
							/>

							<Stack spacing={1.5}>
								<Typography
									id="maintenance-title"
									variant="h3"
									sx={{
										fontSize: { xs: '2rem', md: '2.75rem' },
										lineHeight: 1.05,
										fontWeight: 700,
										color: '#0D070B',
									}}
								>
									{t.errors.maintenanceTitle}
								</Typography>
								<Typography
									id="maintenance-description"
									variant="body1"
									sx={{
										fontSize: '1rem',
										lineHeight: 1.7,
										color: '#6B7280',
									}}
								>
									{t.errors.maintenanceText}
								</Typography>
							</Stack>

							<Divider />

							<Stack spacing={1.5}>
								<Typography variant="body1" sx={{ color: '#0D070B', fontWeight: 600 }}>
									{t.errors.maintenanceSuspended}
								</Typography>
								<Typography variant="body2" sx={{ color: '#6B7280', lineHeight: 1.7 }}>
									{t.errors.maintenanceThanks}
								</Typography>
							</Stack>
						</Stack>
					</Paper>
				</Stack>
			</Box>
		</Box>
	);
};

export default Maintenance;
