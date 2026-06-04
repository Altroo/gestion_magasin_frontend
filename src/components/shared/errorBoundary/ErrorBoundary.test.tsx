import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ErrorBoundary } from './errorBoundary';

// A component that throws on render
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
	if (shouldThrow) throw new Error('Test error');
	return <div data-testid="ok">OK</div>;
};

describe('ErrorBoundary', () => {
	// Suppress React's console.error for expected boundary errors
	beforeEach(() => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('renders children when no error occurs', () => {
		render(
			<ErrorBoundary>
				<ThrowingComponent shouldThrow={false} />
			</ErrorBoundary>,
		);
		expect(screen.getByTestId('ok')).toBeInTheDocument();
	});

	it('renders the default error UI when a child throws', () => {
		render(
			<ErrorBoundary>
				<ThrowingComponent shouldThrow={true} />
			</ErrorBoundary>,
		);
		expect(screen.getByText(/Une erreur est survenue/i)).toBeInTheDocument();
		expect(screen.getByText(/Nous nous excusons/i)).toBeInTheDocument();
	});

	it('renders user-provided fallback when a child throws and fallback is given', () => {
		render(
			<ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Fallback</div>}>
				<ThrowingComponent shouldThrow={true} />
			</ErrorBoundary>,
		);
		expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
		expect(screen.queryByText(/Une erreur est survenue/i)).not.toBeInTheDocument();
	});

	it('resets to show children after clicking reset button', async () => {
		// First render with error
		const { rerender } = render(
			<ErrorBoundary>
				<ThrowingComponent shouldThrow={true} />
			</ErrorBoundary>,
		);

		expect(screen.getByText(/Une erreur est survenue/i)).toBeInTheDocument();

		// First, switch to non-throwing children so they won't re-throw after reset
		rerender(
			<ErrorBoundary>
				<ThrowingComponent shouldThrow={false} />
			</ErrorBoundary>,
		);

		// Find and click the reset/retry button
		const resetBtn = screen.getByRole('button', { name: /réessayer/i });
		await userEvent.click(resetBtn);

		// Non-throwing children should now be rendered
		expect(screen.getByTestId('ok')).toBeInTheDocument();
	});

	it('shows error message in dev mode (NODE_ENV test is non-production)', () => {
		render(
			<ErrorBoundary>
				<ThrowingComponent shouldThrow={true} />
			</ErrorBoundary>,
		);
		// In test/dev environment the error message should be shown
		expect(screen.getByText('Test error')).toBeInTheDocument();
	});
});
