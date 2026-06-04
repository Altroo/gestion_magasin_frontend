import { render, screen, fireEvent } from '@testing-library/react';
import DarkTooltip from './darkTooltip';
import '@testing-library/jest-dom';
import React from 'react';

describe('DarkTooltip', () => {
	it('renders tooltip with correct text on hover', async () => {
		render(
			<DarkTooltip title="Tooltip text">
				<button aria-label="Tooltip trigger">Hover me</button>
			</DarkTooltip>,
		);

		const trigger = screen.getByRole('button', { name: 'Tooltip trigger' });
		fireEvent.mouseOver(trigger);

		expect(await screen.findByText('Tooltip text')).toBeInTheDocument();
	});
});
