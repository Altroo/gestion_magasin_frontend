'use client';

import React from 'react';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import { SentimentDissatisfied as SadIcon, Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { DASHBOARD } from '@/utils/routes';
import { useLanguage } from '@/utils/hooks';

const NotFound = () => {
	const router = useRouter();
	const { t } = useLanguage();

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '100vh',
				backgroundColor: 'background.default',
				p: 3,
			}}
		>
			<Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, maxWidth: 500, textAlign: 'center', borderRadius: 2 }}>
				<SadIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
				<Typography
					variant="h1"
					sx={{ fontSize: { xs: '4rem', sm: '6rem' }, fontWeight: 700, color: 'primary.main', mb: 1 }}
				>
					404
				</Typography>
				<Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
					{t.errors.pageNotFound}
				</Typography>

				<Typography
					variant="body1"
					sx={{
						color: 'text.secondary',
						mb: 4,
					}}
				>
					{t.errors.pageNotFoundText}
				</Typography>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
					<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.back()} size="large">
						{t.common.back}
					</Button>
					<Button variant="contained" startIcon={<HomeIcon />} onClick={() => router.push(DASHBOARD)} size="large">
						{t.common.dashboard}
					</Button>
				</Stack>
			</Paper>
		</Box>
	);
};

export default NotFound;
