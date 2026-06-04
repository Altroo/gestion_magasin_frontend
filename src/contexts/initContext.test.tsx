import React from 'react';
import { render, screen } from '@testing-library/react';
import { InitContextProvider } from './InitContext';
import { useAppSelector } from '@/utils/hooks';
import { getInitStateToken } from '@/store/selectors';

jest.mock('@/utils/hooks');
jest.mock('@/store/selectors');

describe('InitContextProvider', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(useAppSelector as jest.Mock).mockImplementation((selector) => {
			if (selector === getInitStateToken) return { access: 'mock-token', refresh: 'mock-refresh' };
			return undefined;
		});
	});

	it('renders children', () => {
		render(
			<InitContextProvider>
				<div data-testid="child">Child</div>
			</InitContextProvider>,
		);
		expect(screen.getByTestId('child')).toBeInTheDocument();
	});

	it('calls useAppSelector with getInitStateToken selector', () => {
		render(
			<InitContextProvider>
				<div />
			</InitContextProvider>,
		);
		expect(useAppSelector).toHaveBeenCalledWith(getInitStateToken);
	});

	it('renders children even when selector returns undefined (uses emptyInitStateToken fallback)', () => {
		(useAppSelector as jest.Mock).mockReturnValue(undefined);
		render(
			<InitContextProvider>
				<div data-testid="child">Child</div>
			</InitContextProvider>,
		);
		expect(screen.getByTestId('child')).toBeInTheDocument();
	});
});
