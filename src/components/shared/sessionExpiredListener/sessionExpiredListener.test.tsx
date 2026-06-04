import React from 'react';
import { render, cleanup, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastContext, type ToastContextType } from '@/contexts/toastContext';
import SessionExpiredListener from './sessionExpiredListener';

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

afterEach(() => {
	cleanup();
	jest.clearAllMocks();
});

const renderWithToast = (toast: ToastContextType) =>
	render(
		<ToastContext.Provider value={toast}>
			<SessionExpiredListener />
		</ToastContext.Provider>,
	);

describe('SessionExpiredListener', () => {
	it('renders nothing (null)', () => {
		const toast: ToastContextType = { onSuccess: jest.fn(), onError: jest.fn() };
		const { container } = renderWithToast(toast);
		expect(container.innerHTML).toBe('');
	});

	it('calls toast.onError when a session-expired event is dispatched', () => {
		const toast: ToastContextType = { onSuccess: jest.fn(), onError: jest.fn() };
		renderWithToast(toast);

		act(() => {
			window.dispatchEvent(new Event('session-expired'));
		});

		expect(toast.onError).toHaveBeenCalledTimes(1);
		expect(toast.onError).toHaveBeenCalledWith('Votre session a expiré. Veuillez vous reconnecter.');
	});

	it('does not call toast.onSuccess on session-expired', () => {
		const toast: ToastContextType = { onSuccess: jest.fn(), onError: jest.fn() };
		renderWithToast(toast);

		act(() => {
			window.dispatchEvent(new Event('session-expired'));
		});

		expect(toast.onSuccess).not.toHaveBeenCalled();
	});

	it('removes the event listener on unmount', () => {
		const toast: ToastContextType = { onSuccess: jest.fn(), onError: jest.fn() };
		const { unmount } = renderWithToast(toast);

		unmount();

		act(() => {
			window.dispatchEvent(new Event('session-expired'));
		});

		expect(toast.onError).not.toHaveBeenCalled();
	});

	it('handles multiple session-expired events', () => {
		const toast: ToastContextType = { onSuccess: jest.fn(), onError: jest.fn() };
		renderWithToast(toast);

		act(() => {
			window.dispatchEvent(new Event('session-expired'));
			window.dispatchEvent(new Event('session-expired'));
			window.dispatchEvent(new Event('session-expired'));
		});

		expect(toast.onError).toHaveBeenCalledTimes(3);
	});

	it('does not crash when toast context is undefined', () => {
		// Render without provider value (undefined context)
		expect(() => {
			render(
				<ToastContext.Provider value={undefined as unknown as ToastContextType}>
					<SessionExpiredListener />
				</ToastContext.Provider>,
			);
			act(() => {
				window.dispatchEvent(new Event('session-expired'));
			});
		}).not.toThrow();
	});
});
