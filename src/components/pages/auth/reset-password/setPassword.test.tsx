import { render, screen, fireEvent, act } from '@testing-library/react';
import SetPasswordClient from './setPassword';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import React from 'react';

// Mocks
jest.mock('next-auth/react', () => ({
	useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

jest.mock('@/store/actions/_initActions', () => ({
	refreshAppTokenStatesAction: jest.fn(),
}));

jest.mock('@/utils/clientHelpers', () => ({
	Desktop: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	TabletAndMobile: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/store/services/account', () => {
	const actual = jest.requireActual('@/store/services/account');

	return {
		...actual,
		accountApi: {
			reducerPath: 'accountApi',
			reducer: (_state = {}) => _state,
			middleware: () => (next: (action: unknown) => unknown) => (action: unknown) => next(action),
		},
	};
});

describe('SetPasswordClient', () => {
	const testEmail = 'test@example.com';
	const testCode = '1234';

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders password reset form with inputs and button', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<SetPasswordClient email={testEmail} code={testCode} />
				</Provider>,
			);
		});

		const titles = screen.getAllByText(
			(_, el) => !!(el?.textContent?.includes('Nouveau') && el.textContent.includes('mot de passe')),
		);
		expect(titles.length).toBeGreaterThanOrEqual(1);

		const passwordInputs = screen.getAllByPlaceholderText('Mot de passe');
		expect(passwordInputs.length).toBeGreaterThanOrEqual(1);

		const confirmInputs = screen.getAllByPlaceholderText('Confirmez mot de passe');
		expect(confirmInputs.length).toBeGreaterThanOrEqual(1);

		const submitButtons = screen.getAllByRole('button', {
			name: /Modifier mot de passe/i,
		});
		expect(submitButtons.length).toBeGreaterThanOrEqual(1);
	});

	it('submits the form when passwords are entered and button is clicked', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<SetPasswordClient email={testEmail} code={testCode} />
				</Provider>,
			);
		});

		const passwordInputs = screen.getAllByPlaceholderText('Mot de passe');
		const confirmInputs = screen.getAllByPlaceholderText('Confirmez mot de passe');
		const submitButtons = screen.getAllByRole('button', {
			name: /Modifier mot de passe/i,
		});

		await act(async () => {
			fireEvent.change(passwordInputs[0], {
				target: { value: 'StrongPass123!' },
			});
			fireEvent.change(confirmInputs[0], {
				target: { value: 'StrongPass123!' },
			});
			fireEvent.click(submitButtons[0]);
		});

		expect(submitButtons[0]).toBeEnabled();
	});
});
