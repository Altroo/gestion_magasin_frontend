import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnterCodeClient from './enterCode';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import React from 'react';

// Dynamic mock for search params
let searchParamsMock = new URLSearchParams();

// controllable mocks
const mockPush = jest.fn();
const mockPasswordResetTrigger = jest.fn().mockResolvedValue({});
const mockSendCodeTrigger = jest.fn().mockResolvedValue({});
const mockCookiesPoster = jest.fn().mockResolvedValue({});
const mockSetFormikAutoErrors = jest.fn();
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();

jest.mock('next-auth/react', () => ({
	useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush, replace: jest.fn() }),
	useSearchParams: () => searchParamsMock,
}));

jest.mock('@/utils/clientHelpers', () => ({
	Desktop: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
	TabletAndMobile: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/utils/hooks', () => ({
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
	useLanguage: () => ({ t: jest.requireActual('@/translations/fr').fr }),
}));

jest.mock('@/store/services/account', () => {
	const actual = jest.requireActual('@/store/services/account');
	return {
		...actual,
		useSendPasswordResetCodeMutation: () => [
			(args: unknown) => ({ unwrap: () => mockSendCodeTrigger(args) }),
			{ isLoading: false },
		],
		usePasswordResetMutation: () => [
			(args: unknown) => ({ unwrap: () => mockPasswordResetTrigger(args) }),
			{ isLoading: false },
		],
	};
});

jest.mock('@/utils/apiHelpers', () => ({
	cookiesPoster: (...args: unknown[]) => mockCookiesPoster(...(args as unknown[])),
}));

jest.mock('@/utils/helpers', () => ({
	setFormikAutoErrors: (...args: unknown[]) => mockSetFormikAutoErrors(...(args as unknown[])),
	hexToRGB: (hex: string, alpha = 1) => `rgba(0,0,0,${alpha})`,
}));

describe('EnterCodeClient', () => {
	const testEmail = 'test@example.com';

	beforeEach(() => {
		searchParamsMock = new URLSearchParams();
		jest.clearAllMocks();
		mockPasswordResetTrigger.mockResolvedValue({});
		mockSendCodeTrigger.mockResolvedValue({});
	});

	it('renders code entry form with inputs and buttons', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<EnterCodeClient email={testEmail} />
				</Provider>,
			);
		});

		expect(screen.getAllByText('Rentrez le code').length).toBeGreaterThanOrEqual(1);
		expect(
			screen.getAllByText((_, el) => el?.textContent === `Un code a été envoyé à ${testEmail}`).length,
		).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(4);
		expect(screen.getAllByRole('button', { name: /Confirmer le code/i }).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText('Renvoyer le code').length).toBeGreaterThanOrEqual(1);
	});

	it(
		'typing digits moves focus and updates combined code then submits successfully',
		async () => {
			await act(async () => {
				render(
				<Provider store={store}>
					<EnterCodeClient email={testEmail} />
				</Provider>,
			);
		});

		const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
		await userEvent.type(inputs[0], '1');
		await userEvent.type(inputs[1], '2');
		await userEvent.type(inputs[2], '3');
		await userEvent.type(inputs[3], '4');
		await userEvent.type(inputs[4], '5');
		await userEvent.type(inputs[5], '6');

		const confirmBtn = screen.getAllByRole('button', { name: /Confirmer le code/i })[0];
		await act(async () => {
			fireEvent.click(confirmBtn);
		});

		await waitFor(() => {
			expect(mockPasswordResetTrigger).toHaveBeenCalled();
			expect(mockCookiesPoster).toHaveBeenCalled();
			expect(mockPush).toHaveBeenCalled();
		});
	}, 15000);

	it('pasting full code fills inputs and validates/focuses appropriately', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<EnterCodeClient email={testEmail} />
				</Provider>,
			);
		});

		const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
		const pasteEvent = {
			clipboardData: { getData: () => '987654' },
		} as unknown as ClipboardEvent;
		await act(async () => {
			fireEvent.paste(inputs[0], pasteEvent);
		});

		expect((inputs[0] as HTMLInputElement).value).toBe('9');
		expect((inputs[1] as HTMLInputElement).value).toBe('8');
		expect((inputs[2] as HTMLInputElement).value).toBe('7');
		expect((inputs[3] as HTMLInputElement).value).toBe('6');
		expect((inputs[4] as HTMLInputElement).value).toBe('5');
		expect((inputs[5] as HTMLInputElement).value).toBe('4');
	});

	it('calls setFormikAutoErrors when passwordReset throws', async () => {
		mockPasswordResetTrigger.mockRejectedValue(new Error('network error'));

		await act(async () => {
			render(
				<Provider store={store}>
					<EnterCodeClient email={testEmail} />
				</Provider>,
			);
		});

		const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
		await userEvent.type(inputs[0], '1');
		await userEvent.type(inputs[1], '2');
		await userEvent.type(inputs[2], '3');
		await userEvent.type(inputs[3], '4');
		await userEvent.type(inputs[4], '5');
		await userEvent.type(inputs[5], '6');

		const confirmBtn = screen.getAllByRole('button', { name: /Confirmer le code/i })[0];
		await act(async () => {
			fireEvent.click(confirmBtn);
		});

		await waitFor(() => {
			expect(mockPasswordResetTrigger).toHaveBeenCalled();
			expect(mockSetFormikAutoErrors).toHaveBeenCalled();
		});
	}, 15000);

	it('backspace on empty input focuses previous input', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<EnterCodeClient email={testEmail} />
				</Provider>,
			);
		});

		const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
		await userEvent.type(inputs[0], '1');
		await userEvent.type(inputs[1], '2');

		await act(async () => {
			inputs[1].focus();
			fireEvent.change(inputs[1], { target: { value: '' } });
		});

		await act(async () => {
			fireEvent.keyDown(inputs[1], { key: 'Backspace', code: 'Backspace' });
		});

		await waitFor(() => {
			expect(document.activeElement).toBe(inputs[0]);
		});
	});

	it('triggers resend code when clicking resend and calls onSuccess', async () => {
		await act(async () => {
			render(
				<Provider store={store}>
					<EnterCodeClient email={testEmail} />
				</Provider>,
			);
		});

		const resendButtons = screen.getAllByText('Renvoyer le code');
		await act(async () => {
			fireEvent.click(resendButtons[0]);
		});

		await waitFor(() => {
			expect(mockSendCodeTrigger).toHaveBeenCalled();
			expect(mockOnSuccess).toHaveBeenCalledWith('code envoyé.');
		});
	});

	it('resend code error triggers onError and setFormikAutoErrors', async () => {
		mockSendCodeTrigger.mockRejectedValueOnce(new Error('network error'));

		await act(async () => {
			render(
				<Provider store={store}>
					<EnterCodeClient email={testEmail} />
				</Provider>,
			);
		});

		const resendButtons = screen.getAllByText('Renvoyer le code');
		await act(async () => {
			fireEvent.click(resendButtons[0]);
		});

		await waitFor(() => {
			expect(mockSendCodeTrigger).toHaveBeenCalled();
			expect(mockOnError).toHaveBeenCalledWith("Échec de l'envoi du code.");
			expect(mockSetFormikAutoErrors).toHaveBeenCalled();
		});
	});
});
