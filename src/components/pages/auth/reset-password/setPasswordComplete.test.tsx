import { render, screen } from '@testing-library/react';
import SetPasswordCompleteClient from './setPasswordComplete';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import React from 'react';

// Mocks
jest.mock('next-auth/react', () => ({
	useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/utils/clientHelpers', () => ({
	Desktop: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	TabletAndMobile: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('SetPasswordCompleteClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders success message and login button', () => {
		render(
			<Provider store={store}>
				<SetPasswordCompleteClient />
			</Provider>,
		);

		const headers = screen.getAllByRole('heading', {
			name: /Mot de passe modifié/i,
		});
		expect(headers.length).toBeGreaterThanOrEqual(1);

		const subHeaders = screen.getAllByText(/Votre mot de passe a été modifié, connectez-vous/i);
		expect(subHeaders.length).toBeGreaterThanOrEqual(1);

		const loginButtons = screen.getAllByRole('link', {
			name: /Me connecter/i,
		});
		expect(loginButtons.length).toBeGreaterThanOrEqual(1);
	});
});
