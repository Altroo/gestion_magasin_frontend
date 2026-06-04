import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ChipSelectFilterBar from './chipSelectFilterBar';
import type { ChipSelectFilterProps } from './chipSelectFilter';

jest.mock('./chipSelectFilter', () => ({
	__esModule: true,
	default: ({ label, onChange }: ChipSelectFilterProps) => (
		<button type="button" onClick={() => onChange(['true', 'false'])}>
			{label}
		</button>
	),
}));

describe('ChipSelectFilterBar', () => {
	it('emits comma-separated params for selected tags', async () => {
		const onFilterChange = jest.fn();

		render(
			<ChipSelectFilterBar
				filters={[
					{
						key: 'active',
						label: 'Actif',
						paramName: 'is_active',
						options: [
							{ id: 'true', nom: 'Actif' },
							{ id: 'false', nom: 'Inactif' },
						],
					},
				]}
				onFilterChange={onFilterChange}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Actif' }));

		await waitFor(() => {
			expect(onFilterChange).toHaveBeenCalledWith({ is_active: 'true,false' });
		});
	});
});
