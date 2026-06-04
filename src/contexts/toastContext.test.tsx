import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastContext, ToastContextProvider, type ToastContextType } from './toastContext';

const TestConsumer: React.FC<{ action: 'success' | 'error'; message: string }> = ({ action, message }) => {
	const ctx = React.useContext(ToastContext);
	return (
		<button
			onClick={() => {
				if (!ctx) return;
				if (action === 'success') ctx.onSuccess(message);
				else ctx.onError(message);
			}}
		>
			trigger
		</button>
	);
};

describe('ToastContextProvider', () => {
	it('renders children', () => {
		render(
			<ToastContextProvider>
				<div data-testid="child">Child</div>
			</ToastContextProvider>,
		);
		expect(screen.getByTestId('child')).toBeInTheDocument();
	});

	it('shows a success alert when onSuccess is called', () => {
		render(
			<ToastContextProvider>
				<TestConsumer action="success" message="All good!" />
			</ToastContextProvider>,
		);

		act(() => {
			screen.getByRole('button', { name: /trigger/i }).click();
		});

		expect(screen.getByText('All good!')).toBeInTheDocument();
		expect(screen.getByRole('alert')).toBeInTheDocument();
	});

	it('shows an error alert when onError is called', () => {
		render(
			<ToastContextProvider>
				<TestConsumer action="error" message="Something broke!" />
			</ToastContextProvider>,
		);

		act(() => {
			screen.getByRole('button', { name: /trigger/i }).click();
		});

		expect(screen.getByText('Something broke!')).toBeInTheDocument();
		expect(screen.getByRole('alert')).toBeInTheDocument();
	});

	it('provides onSuccess and onError via context', () => {
		let capturedCtx: ToastContextType | undefined;
		const Capture = () => {
			// eslint-disable-next-line react-hooks/globals
			capturedCtx = React.useContext(ToastContext);
			return null;
		};
		render(
			<ToastContextProvider>
				<Capture />
			</ToastContextProvider>,
		);
		expect(capturedCtx).toBeDefined();
		expect(typeof capturedCtx?.onSuccess).toBe('function');
		expect(typeof capturedCtx?.onError).toBe('function');
	});
});
