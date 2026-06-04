import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Minimal mock store
const mockStore = configureStore({
	reducer: {
		_init: () => ({}),
		account: () => ({}),
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

// Mock hooks
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useToast: () => ({
		onSuccess: mockOnSuccess,
		onError: mockOnError,
	}),
	useAppSelector: jest.fn(() => null),
	useLanguage: () => ({ t: jest.requireActual('@/translations/fr').fr }),
}));

jest.mock('@/store/selectors', () => ({
	__esModule: true,
	getProfilState: jest.fn(),
}));

// Mock NavigationBar
jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children, title }: { children: React.ReactNode; title: string }) => (
		<div data-testid="navigation-bar">
			<h1 data-testid="nav-title">{title}</h1>
			{children}
		</div>
	),
}));

// Mock RTK Query hooks
const mockChangePassword = jest.fn();

jest.mock('@/store/services/account', () => ({
	__esModule: true,
	useEditPasswordMutation: () => [mockChangePassword, { isLoading: false }],
}));

// Mock form sub-components
jest.mock('@/components/formikElements/customPasswordInput/customPasswordInput', () => ({
	__esModule: true,
	default: ({ id, label, value }: { id: string; label: string; value: string }) => (
		<div data-testid={`input-${id}`}>
			<label>{label}</label>
			<input id={id} type="password" value={value ?? ''} readOnly />
		</div>
	),
}));

jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: ({ buttonText }: { buttonText: string }) => (
		<button data-testid="submit-button">{buttonText}</button>
	),
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

jest.mock('@/utils/themes', () => ({
	textInputTheme: jest.fn(() => ({})),
}));

jest.mock('@/utils/formValidationSchemas', () => ({
	changePasswordSchema: { parse: jest.fn() },
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

jest.mock('@/utils/helpers', () => ({
	setFormikAutoErrors: jest.fn(),
}));

jest.mock('@/styles/dashboard/settings/settings.module.sass', () => ({
	flexRootStack: 'flexRootStack',
	pageTitle: 'pageTitle',
	form: 'form',
	maxInputWidth: 'maxInputWidth',
	maxWidth: 'maxWidth',
	mobileButton: 'mobileButton',
	submitButton: 'submitButton',
	main: 'main',
	fixMobile: 'fixMobile',
}));

// Import after mocks
import PasswordClient from './password';

const renderWithProviders = (ui: React.ReactElement) => render(<Provider store={mockStore}>{ui}</Provider>);

describe('PasswordClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders the page title', () => {
		renderWithProviders(<PasswordClient />);
		expect(screen.getByTestId('nav-title')).toHaveTextContent('Modifier le mot de passe');
	});

	it('renders old password input', () => {
		renderWithProviders(<PasswordClient />);
		expect(screen.getByTestId('input-old_password')).toBeInTheDocument();
		expect(screen.getByText('Ancien mot de passe')).toBeInTheDocument();
	});

	it('renders new password input', () => {
		renderWithProviders(<PasswordClient />);
		expect(screen.getByTestId('input-new_password')).toBeInTheDocument();
		expect(screen.getByText('Nouveau mot de passe')).toBeInTheDocument();
	});

	it('renders confirm password input', () => {
		renderWithProviders(<PasswordClient />);
		expect(screen.getByTestId('input-new_password2')).toBeInTheDocument();
		expect(screen.getByText('Confirmation du nouveau mot de passe')).toBeInTheDocument();
	});

	it('renders submit button', () => {
		renderWithProviders(<PasswordClient />);
		expect(screen.getByTestId('submit-button')).toHaveTextContent('Modifier');
	});

	it('shows default password warning when profil.default_password_set is true', () => {
		const { useAppSelector } = jest.requireMock('@/utils/hooks') as { useAppSelector: jest.Mock };
		useAppSelector.mockReturnValue({ default_password_set: true });

		renderWithProviders(<PasswordClient />);
		expect(
			screen.getByText(/Il est recommandé de changer votre mot de passe par défaut/),
		).toBeInTheDocument();

		useAppSelector.mockReturnValue(null);
	});

	it('does not show default password warning when profil.default_password_set is false', () => {
		const { useAppSelector } = jest.requireMock('@/utils/hooks') as { useAppSelector: jest.Mock };
		useAppSelector.mockReturnValue({ default_password_set: false });

		renderWithProviders(<PasswordClient />);
		expect(
			screen.queryByText(/Il est recommandé de changer votre mot de passe par défaut/),
		).not.toBeInTheDocument();

		useAppSelector.mockReturnValue(null);
	});

	it('renders loading state when mutation is in progress', () => {
		const accountService = jest.requireMock('@/store/services/account') as {
			useEditPasswordMutation: () => [jest.Mock, { isLoading: boolean }];
		};
		const mockMutate = jest.fn();
		accountService.useEditPasswordMutation = () => [mockMutate, { isLoading: true }];

		renderWithProviders(<PasswordClient />);
		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('renders when profil is undefined', () => {
		const { useAppSelector } = jest.requireMock('@/utils/hooks') as { useAppSelector: jest.Mock };
		useAppSelector.mockReturnValue(undefined);

		renderWithProviders(<PasswordClient />);
		expect(screen.getAllByText('Modifier le mot de passe').length).toBeGreaterThan(0);
		expect(
			screen.queryByText(/Il est recommandé de changer votre mot de passe par défaut/),
		).not.toBeInTheDocument();

		useAppSelector.mockReturnValue(null);
	});

	it('renders with profil object that has no default_password_set property', () => {
		const { useAppSelector } = jest.requireMock('@/utils/hooks') as { useAppSelector: jest.Mock };
		useAppSelector.mockReturnValue({ id: 1, email: 'test@test.com' });

		renderWithProviders(<PasswordClient />);
		expect(screen.getAllByText('Modifier le mot de passe').length).toBeGreaterThan(0);
		expect(
			screen.queryByText(/Il est recommandé de changer votre mot de passe par défaut/),
		).not.toBeInTheDocument();

		useAppSelector.mockReturnValue(null);
	});
});
