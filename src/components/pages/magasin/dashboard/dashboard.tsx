'use client';

import { useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	BarElement,
	Tooltip,
} from 'chart.js';
import { Box, Button, MenuItem, Stack, TextField, ThemeProvider } from '@mui/material';
import {
	Inventory2 as InventoryIcon,
	LocalOffer as LocalOfferIcon,
	PictureAsPdf as PictureAsPdfIcon,
	PointOfSale as PointOfSaleIcon,
	Storefront as StorefrontIcon,
	SwapHoriz as SwapHorizIcon,
	Timer as TimerIcon,
} from '@mui/icons-material';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { MagasinKpiCard, MagasinSectionCard } from '@/components/pages/magasin/shared/magasin-card';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetDashboardReportQuery, useGetMyStoresQuery } from '@/store/services/magasin';
import type { SessionProps } from '@/types/_initTypes';
import { fetchFileBlob } from '@/utils/apiHelpers';
import { formatNumber } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';
import { customDropdownTheme } from '@/utils/themes';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const chartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: { display: false },
	},
	scales: {
		x: { grid: { display: false } },
		y: { beginAtZero: true },
	},
};

const DashboardClient = ({ session }: SessionProps) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const { onError } = useToast();
	const [storeFilter, setStoreFilter] = useState<'all' | number>('all');
	const { data: memberships = [] } = useGetMyStoresQuery(undefined, { skip: !token });
	const { data } = useGetDashboardReportQuery(
		{ store: storeFilter === 'all' ? undefined : storeFilter },
		{ skip: !token },
	);

	const salesChart = useMemo(
		() => ({
			labels: data?.sales_trend.map((item) => item.date) ?? [],
			datasets: [
				{
					data: data?.sales_trend.map((item) => Number(item.total || 0)) ?? [],
					borderColor: '#1976d2',
					backgroundColor: '#1976d2',
					tension: 0.3,
				},
			],
		}),
		[data?.sales_trend],
	);

	const attendanceChart = useMemo(
		() => ({
			labels: data?.attendance_trend.map((item) => item.date) ?? [],
			datasets: [
				{
					data: data?.attendance_trend.map((item) => Number(item.hours || 0)) ?? [],
					backgroundColor: '#2e7d32',
				},
			],
		}),
		[data?.attendance_trend],
	);

	const reportKinds = useMemo(
		() => [
			{ kind: 'sales', label: t.magasin.sales },
			{ kind: 'stock', label: t.magasin.stock },
			{ kind: 'attendance', label: t.magasin.attendance },
			{ kind: 'promotions', label: t.magasin.promotions },
			{ kind: 'purchases', label: t.magasin.purchases },
			{ kind: 'inventory', label: t.magasin.inventory },
			{ kind: 'transfers', label: t.magasin.stockTransfers },
			{ kind: 'expenses', label: t.magasin.expenses },
		],
		[t],
	);

	const handleExportPdf = async (kind: string) => {
		if (!token || !process.env.NEXT_PUBLIC_REPORTS_EXPORT) return;
		try {
			const url = new URL(`${process.env.NEXT_PUBLIC_REPORTS_EXPORT}${kind}/`);
			url.searchParams.set('format', 'pdf');
			if (storeFilter !== 'all') {
				url.searchParams.set('store', String(storeFilter));
			}
			const blob = await fetchFileBlob(url.toString(), token);
			const href = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = href;
			link.download = `${kind}.pdf`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(href);
		} catch {
			onError(t.errors.genericError);
		}
	};

	return (
		<NavigationBar title={t.navigation.dashboard}>
			<Protected permission="can_view">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={2.5}>
							<ThemeProvider theme={customDropdownTheme()}>
								<TextField
									select
									size="small"
									label={t.magasin.store}
									value={storeFilter}
									onChange={(event) => setStoreFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))}
									sx={{ width: { xs: '100%', sm: 320 } }}
								>
									<MenuItem value="all">{t.magasin.allMagasinsDashboard}</MenuItem>
									{memberships.map((membership) => (
										<MenuItem key={membership.store.id} value={membership.store.id}>
											{membership.store.name}
										</MenuItem>
									))}
								</TextField>
							</ThemeProvider>
							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
								<MagasinKpiCard icon={<PointOfSaleIcon fontSize="small" />} label={t.magasin.sales} value={`${formatNumber(String(data?.kpis.sales_total ?? 0))} Dhs`} color="#1976d2" />
								<MagasinKpiCard icon={<InventoryIcon fontSize="small" />} label={t.magasin.lowStock} value={data?.kpis.low_stock_count ?? 0} color="#ed6c02" />
								<MagasinKpiCard icon={<LocalOfferIcon fontSize="small" />} label={t.magasin.activePromotions} value={data?.kpis.promotions_active_count ?? 0} color="#7b1fa2" />
								<MagasinKpiCard icon={<SwapHorizIcon fontSize="small" />} label={t.magasin.transfersCount} value={data?.kpis.transfers_count ?? 0} color="#455a64" />
							</Box>
							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
								<MagasinSectionCard title={t.magasin.salesTrend} icon={<StorefrontIcon fontSize="small" />} contentSx={{ height: 320 }}>
									<Line data={salesChart} options={chartOptions} />
								</MagasinSectionCard>
								<MagasinSectionCard title={t.magasin.attendanceTrend} icon={<TimerIcon fontSize="small" />} contentSx={{ height: 320 }}>
									<Bar data={attendanceChart} options={chartOptions} />
								</MagasinSectionCard>
							</Box>
							<MagasinSectionCard title={t.magasin.reports} icon={<PictureAsPdfIcon fontSize="small" />}>
								<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
									{reportKinds.map((report) => (
										<Button
											key={report.kind}
											variant="outlined"
											startIcon={<PictureAsPdfIcon fontSize="small" />}
											onClick={() => void handleExportPdf(report.kind)}
											sx={{ justifyContent: 'flex-start' }}
										>
											{report.label}
										</Button>
									))}
								</Box>
							</MagasinSectionCard>
						</Stack>
					</Box>
				</Box>
			</Protected>
		</NavigationBar>
	);
};

export default DashboardClient;
