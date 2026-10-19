import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import LoginClient from './login';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { type ReactNode } from 'react';
import { DASHBOARD } from '@/utils/routes';

import type { AppSession } from '@/types/_initTypes';

const mockSession: AppSession = {
	accessToken: 'mock-token',
	refreshToken: 'mock-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z',
	refreshTokenExpiration: '2099-12-31T23:59:59Z',
	expires: '2099-12-31T23:59:59Z',
	user: {
		accessToken: 'mock-token',
		pk: 1,
		email: 'test@example.com',
		first_name: 'Test',
		last_name: 'User',
		id: '',
		emailVerified: null,
		name: '',
	},
};

// Dynamic mock for search params
let searchParamsMock = new URLSearchParams();

// controllable mocks
const mockSignIn = jest.fn();
const mockGetSession = jest.fn();
type UseSessionReturn = { data: AppSession | null; status: 'authenticated' | 'unauthenticated' | 'loading' };
const mockUseSession = jest.fn<UseSessionReturn, []>(() => ({ data: null, status: 'unauthenticated' }));
const mockPostApi = jest.fn();
const mockSetFormikAutoErrors = jest.fn();
const mockRefreshAppTokenStatesAction = jest.fn((s: unknown) => ({ type: 'REFRESH', payload: s }));
const mockDispatch = jest.fn();

const mockPush = jest.fn();
const mockReplace = jest.fn();

// Mocks
jest.mock('next-auth/react', () => ({
	useSession: () => mockUseSession(),
	signIn: (...args: unknown[]) => mockSignIn(args),
	getSession: (...args: unknown[]) => mockGetSession(...args),
}));

jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush, replace: mockReplace }),
	useSearchParams: () => searchParamsMock,
}));

jest.mock('@/store/actions/_initActions', () => ({
	refreshAppTokenStatesAction: (s: unknown) => mockRefreshAppTokenStatesAction(s),
}));

jest.mock('@/utils/clientHelpers', () => ({
	Desktop: ({ children }: { children?: ReactNode }) => <>{children}</>,
	TabletAndMobile: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

jest.mock('@/utils/apiHelpers', () => ({
	postApi: (...args: unknown[]) => mockPostApi(args),
}));

jest.mock('@/utils/helpers', () => ({
	allowAnyInstance: () => ({}),
	setFormikAutoErrors: (p: unknown) => mockSetFormikAutoErrors(p),
	hexToRGB: (hex: string, alpha = 1) => `rgba(0,0,0,${alpha})`,
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

jest.mock('@/utils/hooks', () => ({
	useAppDispatch: () => mockDispatch,
	useLanguage: () => ({ t: jest.requireActual('@/translations/fr').fr }),
}));

describe('LoginClient', () => {
	beforeEach(() => {
		searchParamsMock = new URLSearchParams();
		jest.clearAllMocks();
		mockGetSession.mockReset().mockResolvedValue(null);
		mockUseSession.mockImplementation(() => ({ data: null, status: 'unauthenticated' }));
		mockPostApi.mockResolvedValue({ status: 500 });
	});

	it('renders login form with title and button', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<LoginClient />
				</Provider>,
			);
		});

		const headings = screen.getAllByText('Connexion');
		expect(headings.length).toBeGreaterThan(0);

		const forgotButtons = screen.getAllByText('Mot de passe oublié ?');
		expect(forgotButtons.length).toBeGreaterThan(0);

		const loginButtons = screen.getAllByRole('button', {
			name: /Me connecter/i,
		});
		expect(loginButtons.length).toBeGreaterThanOrEqual(1);
	});

	it('submits form and calls postApi and signIn on success', async () => {
		mockPostApi.mockResolvedValue({ status: 200 });

		await act(async () => {
			render(
				<Provider store={store}>
					<LoginClient />
				</Provider>,
			);
		});

		const emailInput = screen.getAllByLabelText(/Adresse email/i)[0] as HTMLInputElement;
		const passwordInput = screen.getAllByLabelText(/Mot de passe/i)[0] as HTMLInputElement;
		const submitButton = screen.getAllByRole('button', { name: /Me connecter/i })[0];

		await act(async () => {
			fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
			fireEvent.change(passwordInput, { target: { value: 'password123' } });
		});

		await act(async () => {
			fireEvent.click(submitButton);
		});

		await waitFor(() => {
			expect(mockPostApi).toHaveBeenCalled();
			expect(mockSignIn).toHaveBeenCalled();
		});
	});

	it('calls setFormikAutoErrors when postApi throws', async () => {
		mockPostApi.mockRejectedValue(new Error('network error'));

		await act(async () => {
			render(
				<Provider store={store}>
					<LoginClient />
				</Provider>,
			);
		});

		const emailInput = screen.getAllByLabelText(/Adresse email/i)[0] as HTMLInputElement;
		const passwordInput = screen.getAllByLabelText(/Mot de passe/i)[0] as HTMLInputElement;
		const submitButton = screen.getAllByRole('button', { name: /Me connecter/i })[0];

		await act(async () => {
			fireEvent.change(emailInput, { target: { value: 'u@e.com' } });
			fireEvent.change(passwordInput, { target: { value: 'password123' } });
		});

		await act(async () => {
			fireEvent.click(submitButton);
		});

		await waitFor(() => {
			expect(mockPostApi).toHaveBeenCalled();
			expect(mockSetFormikAutoErrors).toHaveBeenCalled();
		});
	});

	it('dispatches refreshAppTokenStatesAction and replaces route when session is present', async () => {
		mockUseSession.mockImplementation(() => ({ data: mockSession, status: 'authenticated' }));
		mockGetSession.mockResolvedValue(mockSession);

		await act(async () => {
			render(
				<Provider store={store}>
					<LoginClient />
				</Provider>,
			);
		});

		expect(mockRefreshAppTokenStatesAction).toHaveBeenCalledWith(mockSession);
		expect(mockDispatch).toHaveBeenCalledWith({ type: 'REFRESH', payload: mockSession });
		expect(mockReplace).toHaveBeenCalledWith(DASHBOARD);
	});

	it('keeps the form usable when a cached session has expired on the server', async () => {
		mockUseSession.mockImplementation(() => ({ data: mockSession, status: 'authenticated' }));
		render(<LoginClient />);
		expect(await screen.findAllByText('Connexion')).not.toHaveLength(0);
		expect(mockDispatch).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();
	});
	it('keeps the form usable when session verification fails', async () => {
		mockGetSession.mockRejectedValueOnce(new Error('Session unavailable'));
		render(<LoginClient />);
		expect(await screen.findAllByText('Connexion')).not.toHaveLength(0);
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('shows loader when session status is loading', async () => {
		mockUseSession.mockImplementation(() => ({ data: null, status: 'loading' }));

		await act(async () => {
			render(
				<Provider store={store}>
					<LoginClient />
				</Provider>,
			);
		});

		expect(screen.queryByText('Connexion')).toBeNull();
	});
});
