import React, { useState } from 'react';
import { Box } from '@mui/material';
import { GridFilterInputValueProps, GridFilterOperator } from '@mui/x-data-grid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fr } from 'date-fns/locale';
import { formatLocalDate } from '@/utils/helpers';
import { useLanguage } from '@/utils/hooks';

interface DateRangeValue {
	from?: string;
	to?: string;
}

const DateRangeFilterInput: React.FC<GridFilterInputValueProps> = (props) => {
	const { item, applyValue } = props;
	const { t } = useLanguage();
	const value = (item.value as DateRangeValue) || {};

	const [fromDate, setFromDate] = useState<Date | null>(value.from ? new Date(value.from) : null);
	const [toDate, setToDate] = useState<Date | null>(value.to ? new Date(value.to) : new Date());

	const handleFromChange = (date: Date | null) => {
		setFromDate(date);
		let effectiveToDate = toDate;
		
		// If new from date is after to date, adjust to date
		if (date && toDate && date > toDate) {
			effectiveToDate = date;
			setToDate(date);
		}
		
		const newValue: DateRangeValue = {
			from: date ? formatLocalDate(date) : undefined,
			to: effectiveToDate ? formatLocalDate(effectiveToDate) : formatLocalDate(new Date()),
		};
		applyValue({ ...item, value: newValue });
	};

	const handleToChange = (date: Date | null) => {
		// Only allow to date >= from date
		if (date && fromDate && date < fromDate) {
			return; // Don't allow invalid selection
		}
		setToDate(date);
		const newValue: DateRangeValue = {
			from: fromDate ? formatLocalDate(fromDate) : undefined,
			to: date ? formatLocalDate(date) : undefined,
		};
		applyValue({ ...item, value: newValue });
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Box sx={{ display: 'inline-flex', flexDirection: 'row', gap: 1, alignItems: 'center', paddingRight: 1 }}>
				<DatePicker
					label={t.filters.from}
					value={fromDate}
					onChange={handleFromChange}
					maxDate={toDate || undefined}
					slotProps={{
						textField: {
							size: 'small',
							sx: { width: 190 },
						},
					}}
				/>
				<DatePicker
					label={t.filters.to}
					value={toDate}
					onChange={handleToChange}
					minDate={fromDate || undefined}
					slotProps={{
						textField: {
							size: 'small',
							sx: { width: 190 },
						},
					}}
				/>
			</Box>
		</LocalizationProvider>
	);
};

export const createDateRangeFilterOperator = <T extends Record<string, unknown>>(filterLabel?: string): GridFilterOperator<T>[] => [
	{
		label: filterLabel ?? 'entre',
		value: 'between',
		getApplyFilterFn: () => {
			// Return null to indicate server-side filtering
			// The actual filtering is done by the backend using date_after/date_before params
			return null;
		},
		InputComponent: DateRangeFilterInput,
	},
];
