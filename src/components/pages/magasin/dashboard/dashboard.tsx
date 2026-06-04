'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
	ArcElement,
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Filler,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Tooltip,
} from 'chart.js';
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, LinearProgress, Stack, Typography } from '@mui/material';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetDashboardReportQuery, useGetMyStoresQuery } from '@/store/services/magasin';
import type { SessionProps } from '@/types/_initTypes';
import { fetchFileBlob } from '@/utils/apiHelpers';
import { formatNumber } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';
import { textInputTheme } from '@/utils/themes';
import { magasinStatusLabel } from '@/components/pages/magasin/shared/status-labels';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import type { DropDownType } from '@/types/accountTypes';
import { CHART_OPTS } from '@/utils/rawData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

const inputTheme = textInputTheme();
const ALL_STORES_CODE = '__all_stores__';

const doughnutPalette = ['#1d4ed8', '#047857', '#b91c1c', '#c2410c', '#6d28d9', '#0f766e', '#be123c', '#4d7c0f'];

const chartOptions = {
	...CHART_OPTS,
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
	interaction: { mode: 'index' as const, intersect: false },
	plugins: {
		legend: {
			display: true,
			position: 'top' as const,
		},
	},
	scales: {
		x: { grid: { color: 'rgba(0, 0, 0, 0.04)' } },
		y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.06)' } },
	},
};

const doughnutOptions = {
	...CHART_OPTS,
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
			backgroundColor: labels.map((_, index) => doughnutPalette[index % doughnutPalette.length]),
			borderColor: '#fff',
			borderWidth: 2,
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

type KpiCardProps = {
	label: string;
	value: string | number;
	sub?: string;
	color: string;
};

const KpiCard = ({ label, value, sub, color }: KpiCardProps) => (
	<Card
		elevation={2}
		sx={{
			height: '100%',
			position: 'relative',
			overflow: 'hidden',
			'&::before': {
				content: '""',
				position: 'absolute',
				top: 0,
				left: 0,
				width: 4,
				height: '100%',
				bgcolor: color,
			},
		}}
	>
		<CardContent sx={{ pl: 2.5 }}>
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

type ChartCardProps = {
	title: string;
	subheader?: string;
	children: ReactNode;
	height?: number;
};

const ChartCard = ({ title, subheader, children, height = 300 }: ChartCardProps) => (
	<Card elevation={2} sx={{ overflow: 'hidden' }}>
		<CardHeader
			title={
				<Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
					{title}
				</Typography>
			}
			subheader={
				subheader && (
					<Typography variant="caption" sx={{ color: 'text.secondary' }}>
						{subheader}
					</Typography>
				)
			}
			sx={{ pb: 0 }}
		/>
		<CardContent>
			<Box sx={{ height }}>{children}</Box>
		</CardContent>
	</Card>
);

const EmptyChart = () => {
	const { t } = useLanguage();
	return (
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
			<Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
				📊
			</Typography>
			<Typography variant="body2">{t.magasin.noChartData}</Typography>
		</Box>
	);
};

const DashboardClient = ({ session }: SessionProps) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const { onError } = useToast();
	const [storeFilter, setStoreFilter] = useState<'all' | number>('all');
	const { data: memberships = [] } = useGetMyStoresQuery(undefined, { skip: !token });
	const { data, isLoading, isFetching } = useGetDashboardReportQuery(
		{ store: storeFilter === 'all' ? undefined : storeFilter },
		{ skip: !token },
	);
	const storeMemberships = useMemo(
		() => memberships.filter((membership) => membership.store.is_active && !membership.store.is_global_stock && membership.store.code !== 'mbr-south'),
		[memberships],
	);
	const allStoresOption = useMemo<DropDownType>(
		() => ({ code: ALL_STORES_CODE, value: t.magasin.allMagasinsDashboard }),
		[t.magasin.allMagasinsDashboard],
	);
	const storeOptions = useMemo<DropDownType[]>(
		() => [allStoresOption, ...storeMemberships.map((membership) => ({ code: String(membership.store.id), value: membership.store.name }))],
		[allStoresOption, storeMemberships],
	);
	const selectedStoreOption =
		storeFilter === 'all'
			? allStoresOption
			: storeOptions.find((store) => Number(store.code) === storeFilter) ?? allStoresOption;

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
					borderColor: '#047857',
					backgroundColor: 'rgba(4, 120, 87, 0.26)',
					fill: true,
					pointRadius: 0,
					tension: 0.35,
				},
				{
					label: t.magasin.purchases,
					data: dates.map((date) => valueForDate(data?.purchases_trend ?? [], date)),
					borderColor: '#1d4ed8',
					backgroundColor: 'rgba(29, 78, 216, 0.2)',
					fill: true,
					pointRadius: 0,
					tension: 0.35,
				},
				{
					label: t.magasin.expenses,
					data: dates.map((date) => valueForDate(data?.expenses_trend ?? [], date)),
					borderColor: '#b91c1c',
					backgroundColor: 'rgba(185, 28, 28, 0.26)',
					fill: true,
					pointRadius: 0,
					tension: 0.35,
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
					borderColor: '#047857',
					backgroundColor: 'rgba(4, 120, 87, 0.26)',
					fill: true,
					pointRadius: 0,
					tension: 0.35,
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
					backgroundColor: '#1d4ed8',
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
					backgroundColor: '#b91c1c',
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
					backgroundColor: '#047857',
					borderRadius: 4,
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
			const blobUrl = window.URL.createObjectURL(pdfBlob);
			window.open(blobUrl, '_blank');
			setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
		} catch {
			onError(t.errors.genericError);
		}
	};
	const renderChart = (chartData: NumericChartData, chart: ReactNode) =>
		hasChartData(chartData) ? chart : <EmptyChart />;

	return (
		<NavigationBar title={t.navigation.dashboard}>
			<Protected permission="can_view">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={2.5}>
							<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'flex-end', alignItems: { xs: 'stretch', md: 'center' } }}>
								<Box sx={{ width: { xs: '100%', md: 380 } }}>
									<CustomAutoCompleteSelect
										id="store-dashboard-filter"
										size="small"
										noOptionsText={t.magasin.storeNotFound}
										label={t.magasin.searchByStore}
										items={storeOptions}
										theme={inputTheme}
										value={selectedStoreOption}
										fullWidth
										onChange={(_, newVal) =>
											setStoreFilter(newVal && newVal.code !== ALL_STORES_CODE ? Number(newVal.code) : 'all')
										}
									/>
								</Box>
							</Stack>
							{isLoading || isFetching ? (
								<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
									<CircularProgress />
								</Box>
							) : (
								<Stack spacing={3}>
									<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
										<KpiCard label={t.magasin.sales} value={`${formatNumber(String(data?.kpis.sales_total ?? 0))} Dhs`} sub={`${data?.kpis.sales_count ?? 0} ${t.magasin.sales}`} color="#047857" />
										<KpiCard label={t.magasin.purchases} value={`${formatNumber(String(data?.kpis.purchases_total ?? 0))} Dhs`} color="#1d4ed8" />
										<KpiCard label={t.magasin.expenses} value={`${formatNumber(String(data?.kpis.expenses_total ?? 0))} Dhs`} color="#b91c1c" />
										<KpiCard label={t.magasin.netTotal} value={`${formatNumber(String(data?.kpis.net_total ?? 0))} Dhs`} color="#334155" />
										<KpiCard label={t.magasin.lowStock} value={data?.kpis.low_stock_count ?? 0} sub={t.magasin.currentStock} color="#b91c1c" />
										<KpiCard label={t.magasin.activePromotions} value={data?.kpis.promotions_active_count ?? 0} color="#6d28d9" />
										<KpiCard label={t.magasin.transfersCount} value={data?.kpis.transfers_count ?? 0} color="#334155" />
										<KpiCard label={t.magasin.expiringProducts} value={data?.kpis.expiring_count ?? 0} color="#c2410c" />
									</Box>
									<Card elevation={2}>
										<CardContent>
											<Stack spacing={1.5}>
												<Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
													<Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 0 }}>
														{t.magasin.netTotal}
													</Typography>
													<Typography variant="subtitle2" sx={{ fontWeight: 700, color: Number(data?.kpis.net_total ?? 0) >= 0 ? 'success.main' : 'error.main' }}>
														{formatNumber(String(data?.kpis.net_total ?? 0))} Dhs
													</Typography>
												</Stack>
												<LinearProgress
													variant="determinate"
													value={Math.min(Math.abs(Number(data?.kpis.net_total ?? 0)), 100)}
													sx={{
														height: 18,
														borderRadius: 0,
														bgcolor: 'rgba(29, 78, 216, 0.18)',
														'& .MuiLinearProgress-bar': {
															bgcolor: Number(data?.kpis.net_total ?? 0) >= 0 ? '#047857' : '#b91c1c',
														},
													}}
												/>
											</Stack>
										</CardContent>
									</Card>
									<ChartCard
										title={t.magasin.salesPurchasesExpensesTrend}
										subheader={t.magasin.financialTrendTooltip}
										height={340}
									>
										{renderChart(financialTrendChart, <Line data={financialTrendChart} options={legendChartOptions} />)}
									</ChartCard>
									<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
										<ChartCard
											title={t.magasin.salesTrend}
											subheader={t.magasin.salesTrendTooltip}
											height={320}
										>
											{renderChart(salesChart, <Line data={salesChart} options={chartOptions} />)}
										</ChartCard>
										<ChartCard
											title={t.magasin.attendanceTrend}
											subheader={t.magasin.attendanceTrendTooltip}
											height={320}
										>
											{renderChart(attendanceChart, <Bar data={attendanceChart} options={chartOptions} />)}
										</ChartCard>
									</Box>
									<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
										<ChartCard
											title={t.magasin.stockByStore}
											subheader={t.magasin.stockByStoreTooltip}
											height={320}
										>
											{renderChart(stockByStoreChart, <Bar data={stockByStoreChart} options={chartOptions} />)}
										</ChartCard>
										<ChartCard
											title={t.magasin.lowStockByStore}
											subheader={t.magasin.lowStockByStoreTooltip}
											height={320}
										>
											{renderChart(lowStockByStoreChart, <Bar data={lowStockByStoreChart} options={chartOptions} />)}
										</ChartCard>
									</Box>
									<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
										<ChartCard
											title={t.magasin.transfersByStatus}
											subheader={t.magasin.transfersByStatusTooltip}
											height={280}
										>
											{renderChart(transferStatusChart, <Doughnut data={transferStatusChart} options={doughnutOptions} />)}
										</ChartCard>
										<ChartCard
											title={t.magasin.inventoryByStatus}
											subheader={t.magasin.inventoryByStatusTooltip}
											height={280}
										>
											{renderChart(inventoryStatusChart, <Doughnut data={inventoryStatusChart} options={doughnutOptions} />)}
										</ChartCard>
										<ChartCard
											title={t.magasin.promotionsByStatus}
											subheader={t.magasin.promotionsByStatusTooltip}
											height={280}
										>
											{renderChart(promotionsStatusChart, <Doughnut data={promotionsStatusChart} options={doughnutOptions} />)}
										</ChartCard>
									</Box>
									<ChartCard title={t.magasin.reports} subheader={t.metadata.dashboardDescription} height={210}>
										<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
											{reportKinds.map((report) => (
												<Button
													key={report.kind}
													variant="outlined"
													onClick={() => void handleExportPdf(report.kind)}
													sx={{ justifyContent: 'flex-start' }}
												>
													{report.label}
												</Button>
											))}
										</Box>
									</ChartCard>
								</Stack>
							)}
						</Stack>
					</Box>
				</Box>
			</Protected>
		</NavigationBar>
	);
};

export default DashboardClient;
