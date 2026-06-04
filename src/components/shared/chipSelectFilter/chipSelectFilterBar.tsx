'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import ChipSelectFilter from './chipSelectFilter';
import type { ChipSelectOption } from './chipSelectFilter';

export interface ChipFilterConfig {
	key: string;
	label: string;
	paramName: string;
	options: ChipSelectOption[];
}

interface ChipSelectFilterBarProps {
	filters: ChipFilterConfig[];
	onFilterChange: (params: Record<string, string>) => void;
	columns?: number;
}

const ChipSelectFilterBar: React.FC<ChipSelectFilterBarProps> = ({ filters, onFilterChange, columns }) => {
	const filterKeys = useMemo(() => filters.map((filter) => filter.key).join(','), [filters]);

	const [selectedMap, setSelectedMap] = useState<Record<string, string[]>>(() => {
		const initial: Record<string, string[]> = {};
		filters.forEach((filter) => {
			initial[filter.key] = [];
		});
		return initial;
	});
	const [lastFilterKeys, setLastFilterKeys] = useState(filterKeys);

	if (lastFilterKeys !== filterKeys) {
		setLastFilterKeys(filterKeys);
		const reset: Record<string, string[]> = {};
		filters.forEach((filter) => {
			reset[filter.key] = [];
		});
		setSelectedMap(reset);
	}

	const buildParams = useCallback(
		(currentMap: Record<string, string[]>): Record<string, string> => {
			const params: Record<string, string> = {};
			filters.forEach((filter) => {
				const ids = currentMap[filter.key];
				if (ids && ids.length > 0) {
					params[filter.paramName] = ids.join(',');
				}
			});
			return params;
		},
		[filters],
	);

	const prevParamsRef = useRef<string>('{}');

	useEffect(() => {
		const params = buildParams(selectedMap);
		const paramsKey = JSON.stringify(params);
		if (paramsKey !== prevParamsRef.current) {
			prevParamsRef.current = paramsKey;
			onFilterChange(params);
		}
	}, [selectedMap, buildParams, onFilterChange]);

	const handleChange = useCallback((key: string, ids: string[]) => {
		setSelectedMap((prev) => ({
			...prev,
			[key]: ids,
		}));
	}, []);

	if (filters.length === 0) return null;

	return (
		<Box
			sx={{
				px: { xs: 0, sm: 2, md: 3 },
				mt: { xs: 1, sm: 2, md: 2 },
				mb: { xs: 1, sm: 1, md: 1 },
				mx: { xs: 1, sm: 1, md: 1 },
			}}
		>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: {
						xs: '1fr',
						sm: columns ? `repeat(${columns}, 1fr)` : 'repeat(auto-fill, minmax(200px, 300px))',
					},
					gap: { xs: 1, sm: 2 },
				}}
			>
				{filters.map((filter) => (
					<ChipSelectFilter
						key={filter.key}
						label={filter.label}
						options={filter.options}
						selectedIds={selectedMap[filter.key] ?? []}
						onChange={(ids) => handleChange(filter.key, ids)}
					/>
				))}
			</Box>
		</Box>
	);
};

export default ChipSelectFilterBar;
