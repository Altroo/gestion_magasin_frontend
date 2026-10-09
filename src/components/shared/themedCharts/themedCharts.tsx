'use client';

import type { ComponentProps } from 'react';
import { useTheme, type Theme } from '@mui/material/styles';
import { Bar as BaseBar, Line as BaseLine, Doughnut as BaseDoughnut } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';

type AppChartType = 'bar' | 'line' | 'doughnut';

export const chartOptionsForTheme = <T extends AppChartType>(
	options: ChartOptions<T> | undefined,
	theme: Theme,
	axes: boolean,
): ChartOptions<T> => {
	const source = (options ?? {}) as ChartOptions<AppChartType>;
	const color = theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#666';
	const grid = theme.palette.mode === 'dark' ? theme.palette.divider : 'rgba(0, 0, 0, 0.1)';
	const scales = Object.fromEntries(
		Object.entries(source.scales ?? (axes ? { x: {}, y: {} } : {})).map(([key, scale]) => [
			key,
			{
				...scale,
				ticks: { ...scale?.ticks, color },
				grid: { ...scale?.grid, color: grid },
				border: { ...scale?.border, color: grid },
				title: { ...scale?.title, color },
			},
		]),
	);
	return {
		...source,
		color,
		font: { ...source.font, family: theme.typography.fontFamily },
		scales,
		plugins: {
			...source.plugins,
			legend: { ...source.plugins?.legend, labels: { ...source.plugins?.legend?.labels, color } },
			title: { ...source.plugins?.title, color },
		},
		elements: {
			...source.elements,
			arc: { ...source.elements?.arc, borderColor: theme.palette.background.paper },
		},
	} as ChartOptions<T>;
};

export const Bar = (props: ComponentProps<typeof BaseBar>) => {
	const theme = useTheme();
	return <BaseBar {...props} options={chartOptionsForTheme(props.options, theme, true)} />;
};
export const Line = (props: ComponentProps<typeof BaseLine>) => {
	const theme = useTheme();
	return <BaseLine {...props} options={chartOptionsForTheme(props.options, theme, true)} />;
};
export const Doughnut = (props: ComponentProps<typeof BaseDoughnut>) => {
	const theme = useTheme();
	return <BaseDoughnut {...props} options={chartOptionsForTheme(props.options, theme, false)} />;
};
