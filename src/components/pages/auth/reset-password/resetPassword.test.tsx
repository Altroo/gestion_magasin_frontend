import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import ResetPasswordClient from './resetPassword';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import React from 'react';

// Dynamic mock for search params
let searchParamsMock = new URLSearchParams();

// Mocks
let mockSessionData: { data: { user?: { email: string } } | null; status: string } = {
	data: null,
	status: 'unauthenticated',
};

jest.mock('next-auth/react', () => ({
	useSession: () => mockSessionData,
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush, replace: mockReplace }),
	useSearchParams: () => searchParamsMock,
}));

jest.mock('@/store/actions/_initActions', () => ({
	refreshAppTokenStatesAction: jest.fn(),
}));

jest.mock('@/utils/routes', () => ({
	AUTH_RESET_PASSWORD_ENTER_CODE: '/reset-password/enter-code',
	AUTH_LOGIN: '/login',
	DASHBOARD: '/dashboard',
}));

jest.mock('@/utils/clientHelpers', () => ({
	Desktop: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	TabletAndMobile: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Define mockTrigger at module level for access in tests
type TriggerFn = (args: unknown) => { unwrap: () => Promise<unknown> };
const mockTrigger = jest.fn<ReturnType<TriggerFn>, Parameters<TriggerFn>>();

jest.mock('@/store/services/account', () => {
	const actual = jest.requireActual('@/store/services/account');

	return {
		...actual,
		accountApi: {
			reducerPath: 'accountApi',
			reducer: (_state = {}) => _state,
			middleware: () => (next: (action: unknown) => unknown) => (action: unknown) => next(action),
		},
		useSendPasswordResetCodeMutation: (): [TriggerFn, { isLoading: boolean }] => [mockTrigger, { isLoading: false }],
	};
});

jest.mock('@/utils/apiHelpers', () => ({
	cookiesPoster: jest.fn().mockResolvedValue({}),
}));

describe('ResetPasswordClient', () => {
	beforeEach(() => {
		searchParamsMock = new URLSearchParams();
		mockSessionData = { data: null, status: 'unauthenticated' };
		mockTrigger.mockReset();
		mockTrigger.mockReturnValue({ unwrap: () => Promise.resolve({}) });
		jest.clearAllMocks();
	});

	it('renders reset password form with email input and button', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<ResetPasswordClient />
				</Provider>,
			);
		});

		const titles = screen.getAllByText('Récupération');
		expect(titles.length).toBeGreaterThanOrEqual(1);

		const subtitles = screen.getAllByText('du mot de passe');
		expect(subtitles.length).toBeGreaterThanOrEqual(1);

		const instructions = screen.getAllByText(
			'Entrez votre email pour recevoir un code et modifier votre mot de passe.',
		);
		expect(instructions.length).toBeGreaterThanOrEqual(1);

		const emailInputs = screen.getAllByPlaceholderText('Adresse email');
		expect(emailInputs.length).toBeGreaterThanOrEqual(1);

		const submitButtons = screen.getAllByRole('button', {
			name: /Renvoyer le code/i,
		});
		expect(submitButtons.length).toBeGreaterThanOrEqual(1);
	});

	it('submits the form when button is clicked', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<ResetPasswordClient />
				</Provider>,
			);
		});

		const emailInputs = screen.getAllByPlaceholderText('Adresse email');
		const submitButtons = screen.getAllByRole('button', {
			name: /Renvoyer le code/i,
		});

		await act(async () => {
			fireEvent.change(emailInputs[0], {
				target: { value: 'test@example.com' },
			});
			fireEvent.click(submitButtons[0]);
		});

		expect(submitButtons[0]).toBeEnabled();
	});

	it('handles API error during form submission', async () => {
		mockTrigger.mockReturnValue({
			unwrap: () => Promise.reject({ data: { email: ['Invalid email'] } }),
		});

		await act(async () => {
			render(
				<Provider store={store}>
					<ResetPasswordClient />
				</Provider>,
			);
		});

		const emailInputs = screen.getAllByPlaceholderText('Adresse email');
		const submitButtons = screen.getAllByRole('button', {
			name: /Renvoyer le code/i,
		});

		await act(async () => {
			fireEvent.change(emailInputs[0], {
				target: { value: 'invalid@example.com' },
			});
		});

		await act(async () => {
			fireEvent.click(submitButtons[0]);
		});

		// Form should still be present after error
		await waitFor(() => {
			expect(emailInputs[0]).toBeInTheDocument();
		});
	});

	it('redirects to dashboard when session exists', async () => {
		mockSessionData = { data: { user: { email: 'test@example.com' } }, status: 'authenticated' };

		await act(async () => {
			render(
				<Provider store={store}>
					<ResetPasswordClient />
				</Provider>,
			);
		});

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith('/dashboard');
		});
	});

	it('shows loading state when session is loading', async () => {
		mockSessionData = { data: null, status: 'loading' };

		await act(async () => {
			render(
				<Provider store={store}>
					<ResetPasswordClient />
				</Provider>,
			);
		});

		// The form should not be visible during loading
		expect(screen.queryByPlaceholderText('Adresse email')).not.toBeInTheDocument();
	});

	it('handles form submit event', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<ResetPasswordClient />
				</Provider>,
			);
		});

		const form = document.querySelector('form');
		expect(form).toBeInTheDocument();

		if (form) {
			await act(async () => {
				fireEvent.submit(form);
			});
		}
	});
});
