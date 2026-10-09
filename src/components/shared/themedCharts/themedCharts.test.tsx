import { createTheme } from '@mui/material/styles';
import { chartOptionsForTheme } from './themedCharts';

it('keeps chart semantics and tooltip callbacks when applying dark colors', () => {
	const callback = jest.fn(() => '12 MAD');
	const options = chartOptionsForTheme<'bar'>(
		{
			indexAxis: 'y',
			scales: { x: { stacked: true, ticks: { callback } }, y: { grid: { display: false } } },
			plugins: { legend: { display: false }, tooltip: { callbacks: { label: callback } } },
		},
		createTheme({ palette: { mode: 'dark' } }),
		true,
	);
	expect(options.indexAxis).toBe('y');
	expect(options.scales?.x?.stacked).toBe(true);
	expect(options.scales?.x?.ticks?.callback).toBe(callback);
	expect(options.scales?.y?.grid?.display).toBe(false);
	expect(options.plugins?.tooltip?.callbacks?.label).toBe(callback);
	expect(options.plugins?.legend?.display).toBe(false);
	expect(options.plugins?.legend?.labels?.color).toBe('rgba(255, 255, 255, 0.7)');
});
it('does not introduce Cartesian axes into doughnut charts', () => {
	const options = chartOptionsForTheme<'doughnut'>({ cutout: '62%' }, createTheme(), false);
	expect(options.cutout).toBe('62%');
	expect(options.scales).toEqual({});
});
