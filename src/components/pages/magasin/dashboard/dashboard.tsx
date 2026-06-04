'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
	ArcElement,
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
	AssignmentTurnedIn as InventoryCheckIcon,
	Inventory2 as InventoryIcon,
	LocalOffer as LocalOfferIcon,
	Payments as ExpenseIcon,
	PictureAsPdf as PictureAsPdfIcon,
	PointOfSale as PointOfSaleIcon,
	Storefront as StorefrontIcon,
	SwapHoriz as SwapHorizIcon,
	Timer as TimerIcon,
	ShoppingCart as PurchaseIcon,
} from '@mui/icons-material';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { MagasinEmptyChart, MagasinKpiCard, MagasinSectionCard } from '@/components/pages/magasin/shared/magasin-card';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetDashboardReportQuery, useGetMyStoresQuery } from '@/store/services/magasin';
import type { SessionProps } from '@/types/_initTypes';
import { fetchFileBlob } from '@/utils/apiHelpers';
import { formatNumber } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';
import { customDropdownTheme } from '@/utils/themes';
import { magasinStatusLabel } from '@/components/pages/magasin/shared/status-labels';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

const chartPalette = ['#1976d2', '#2e7d32', '#ed6c02', '#7b1fa2', '#455a64', '#c62828', '#00897b', '#6d4c41'];

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

const legendChartOptions = {
	...chartOptions,
	plugins: {
		legend: {
			display: true,
			position: 'bottom' as const,
		},
	},
};

const doughnutOptions = {
	responsive: true,
	maintainAspectRatio: false,
	cutout: '64%',
	plugins: {
		legend: {
			display: true,
			position: 'bottom' as const,
		},
	},
};

const makeStatusDataset = (labels: string[], values: number[]) => ({
	labels,
	datasets: [
		{
			data: values,
			backgroundColor: chartPalette,
			borderWidth: 0,
		},
	],
});

type NumericChartData = {
	labels?: unknown[];
	datasets?: Array<{ data?: Array<string | number | null | undefined> }>;
};

const hasChartData = (chartData: NumericChartData) =>
	Boolean(chartData.labels?.length) &&
	Boolean(
		chartData.datasets?.some((dataset) =>
			dataset.data?.some((value) => Number(value ?? 0) !== 0),
		),
	);

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
	const storeMemberships = useMemo(
		() => memberships.filter((membership) => membership.store.is_active && !membership.store.is_global_stock && membership.store.code !== 'mbr-south'),
		[memberships],
	);

	const financialTrendChart = useMemo(() => {
		const dates = Array.from(
			new Set([
				...(data?.sales_trend.map((item) => item.date) ?? []),
				...(data?.purchases_trend.map((item) => item.date) ?? []),
				...(data?.expenses_trend.map((item) => item.date) ?? []),
			]),
		).sort();
		const valueForDate = (items: Array<{ date: string; total: string }>, date: string) => Number(items.find((item) => item.date === date)?.total ?? 0);
		return {
			labels: dates,
			datasets: [
				{
					label: t.magasin.sales,
					data: dates.map((date) => valueForDate(data?.sales_trend ?? [], date)),
					borderColor: '#1976d2',
					backgroundColor: '#1976d2',
					tension: 0.3,
				},
				{
					label: t.magasin.purchases,
					data: dates.map((date) => valueForDate(data?.purchases_trend ?? [], date)),
					borderColor: '#2e7d32',
					backgroundColor: '#2e7d32',
					tension: 0.3,
				},
				{
					label: t.magasin.expenses,
					data: dates.map((date) => valueForDate(data?.expenses_trend ?? [], date)),
					borderColor: '#ed6c02',
					backgroundColor: '#ed6c02',
					tension: 0.3,
				},
			],
		};
	}, [data?.expenses_trend, data?.purchases_trend, data?.sales_trend, t.magasin.expenses, t.magasin.purchases, t.magasin.sales]);

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

	const stockByStoreChart = useMemo(
		() => ({
			labels: data?.stock_by_store.map((item) => item.store) ?? [],
			datasets: [
				{
					label: t.magasin.currentStock,
					data: data?.stock_by_store.map((item) => Number(item.quantity || 0)) ?? [],
					backgroundColor: '#1976d2',
					borderRadius: 4,
				},
			],
		}),
		[data?.stock_by_store, t.magasin.currentStock],
	);

	const lowStockByStoreChart = useMemo(
		() => ({
			labels: data?.low_stock_by_store.map((item) => item.store) ?? [],
			datasets: [
				{
					label: t.magasin.lowStock,
					data: data?.low_stock_by_store.map((item) => item.count) ?? [],
					backgroundColor: '#ed6c02',
					borderRadius: 4,
				},
			],
		}),
		[data?.low_stock_by_store, t.magasin.lowStock],
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

	const transferStatusChart = useMemo(
		() =>
			makeStatusDataset(
				data?.transfers_by_status.map((item) => magasinStatusLabel(t, item.status)) ?? [],
				data?.transfers_by_status.map((item) => item.count) ?? [],
			),
		[data?.transfers_by_status, t],
	);

	const inventoryStatusChart = useMemo(
		() =>
			makeStatusDataset(
				data?.inventory_by_status.map((item) => magasinStatusLabel(t, item.status)) ?? [],
				data?.inventory_by_status.map((item) => item.count) ?? [],
			),
		[data?.inventory_by_status, t],
	);

	const promotionsStatusChart = useMemo(
		() =>
			makeStatusDataset(
				data?.promotions_by_status.map((item) => magasinStatusLabel(t, item.status)) ?? [],
				data?.promotions_by_status.map((item) => item.count) ?? [],
			),
		[data?.promotions_by_status, t],
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
			const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
			const href = URL.createObjectURL(pdfBlob);
			const link = document.createElement('a');
			link.href = href;
			link.download = `${kind.replace(/[^a-z0-9_-]/gi, '_')}.pdf`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(href);
		} catch {
			onError(t.errors.genericError);
		}
	};
	const renderChart = (chartData: NumericChartData, chart: ReactNode) =>
		hasChartData(chartData) ? chart : <MagasinEmptyChart message={t.magasin.noChartData} />;

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
									{storeMemberships.map((membership) => (
										<MenuItem key={membership.store.id} value={membership.store.id}>
											{membership.store.name}
										</MenuItem>
									))}
								</TextField>
							</ThemeProvider>
							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
								<MagasinKpiCard icon={<PointOfSaleIcon fontSize="small" />} label={t.magasin.sales} value={`${formatNumber(String(data?.kpis.sales_total ?? 0))} Dhs`} color="#1976d2" />
								<MagasinKpiCard icon={<PurchaseIcon fontSize="small" />} label={t.magasin.purchases} value={`${formatNumber(String(data?.kpis.purchases_total ?? 0))} Dhs`} color="#2e7d32" />
								<MagasinKpiCard icon={<ExpenseIcon fontSize="small" />} label={t.magasin.expenses} value={`${formatNumber(String(data?.kpis.expenses_total ?? 0))} Dhs`} color="#ed6c02" />
								<MagasinKpiCard icon={<StorefrontIcon fontSize="small" />} label={t.magasin.netTotal} value={`${formatNumber(String(data?.kpis.net_total ?? 0))} Dhs`} color="#455a64" />
								<MagasinKpiCard icon={<InventoryIcon fontSize="small" />} label={t.magasin.lowStock} value={data?.kpis.low_stock_count ?? 0} color="#ed6c02" />
								<MagasinKpiCard icon={<LocalOfferIcon fontSize="small" />} label={t.magasin.activePromotions} value={data?.kpis.promotions_active_count ?? 0} color="#7b1fa2" />
								<MagasinKpiCard icon={<SwapHorizIcon fontSize="small" />} label={t.magasin.transfersCount} value={data?.kpis.transfers_count ?? 0} color="#455a64" />
								<MagasinKpiCard icon={<InventoryCheckIcon fontSize="small" />} label={t.magasin.expiringProducts} value={data?.kpis.expiring_count ?? 0} color="#c62828" />
							</Box>
							<MagasinSectionCard
								title={t.magasin.salesPurchasesExpensesTrend}
								icon={<PointOfSaleIcon fontSize="small" />}
								infoTooltip={t.magasin.financialTrendTooltip}
								contentSx={{ height: 340 }}
							>
								{renderChart(financialTrendChart, <Line data={financialTrendChart} options={legendChartOptions} />)}
							</MagasinSectionCard>
							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
								<MagasinSectionCard
									title={t.magasin.salesTrend}
									icon={<StorefrontIcon fontSize="small" />}
									infoTooltip={t.magasin.salesTrendTooltip}
									contentSx={{ height: 320 }}
								>
									{renderChart(salesChart, <Line data={salesChart} options={chartOptions} />)}
								</MagasinSectionCard>
								<MagasinSectionCard
									title={t.magasin.attendanceTrend}
									icon={<TimerIcon fontSize="small" />}
									infoTooltip={t.magasin.attendanceTrendTooltip}
									contentSx={{ height: 320 }}
								>
									{renderChart(attendanceChart, <Bar data={attendanceChart} options={chartOptions} />)}
								</MagasinSectionCard>
							</Box>
							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
								<MagasinSectionCard
									title={t.magasin.stockByStore}
									icon={<InventoryIcon fontSize="small" />}
									infoTooltip={t.magasin.stockByStoreTooltip}
									contentSx={{ height: 320 }}
								>
									{renderChart(stockByStoreChart, <Bar data={stockByStoreChart} options={chartOptions} />)}
								</MagasinSectionCard>
								<MagasinSectionCard
									title={t.magasin.lowStockByStore}
									icon={<InventoryIcon fontSize="small" />}
									infoTooltip={t.magasin.lowStockByStoreTooltip}
									contentSx={{ height: 320 }}
								>
									{renderChart(lowStockByStoreChart, <Bar data={lowStockByStoreChart} options={chartOptions} />)}
								</MagasinSectionCard>
							</Box>
							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
								<MagasinSectionCard
									title={t.magasin.transfersByStatus}
									icon={<SwapHorizIcon fontSize="small" />}
									infoTooltip={t.magasin.transfersByStatusTooltip}
									contentSx={{ height: 280 }}
								>
									{renderChart(transferStatusChart, <Doughnut data={transferStatusChart} options={doughnutOptions} />)}
								</MagasinSectionCard>
								<MagasinSectionCard
									title={t.magasin.inventoryByStatus}
									icon={<InventoryCheckIcon fontSize="small" />}
									infoTooltip={t.magasin.inventoryByStatusTooltip}
									contentSx={{ height: 280 }}
								>
									{renderChart(inventoryStatusChart, <Doughnut data={inventoryStatusChart} options={doughnutOptions} />)}
								</MagasinSectionCard>
								<MagasinSectionCard
									title={t.magasin.promotionsByStatus}
									icon={<LocalOfferIcon fontSize="small" />}
									infoTooltip={t.magasin.promotionsByStatusTooltip}
									contentSx={{ height: 280 }}
								>
									{renderChart(promotionsStatusChart, <Doughnut data={promotionsStatusChart} options={doughnutOptions} />)}
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
