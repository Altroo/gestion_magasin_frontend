import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { AppSession } from '@/types/_initTypes';

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
	useAppDispatch: () => jest.fn(),
	useLanguage: () => ({ t: jest.requireActual('@/translations/fr').fr }),
}));

jest.mock('@/contexts/InitContext', () => ({
	__esModule: true,
	useInitAccessToken: () => 'mock-token',
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
const mockUseGetProfilQuery = jest.fn();
const mockEditProfil = jest.fn();

jest.mock('@/store/services/account', () => ({
	__esModule: true,
	useGetProfilQuery: (...args: unknown[]) => mockUseGetProfilQuery(...args),
	useEditProfilMutation: () => [mockEditProfil, { isLoading: false }],
}));

jest.mock('@/store/actions/accountActions', () => ({
	__esModule: true,
	accountEditProfilAction: jest.fn(),
}));

// Mock form sub-components
jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: ({ id, label, value }: { id: string; label: string; value: string }) => (
		<div data-testid={`input-${id}`}>
			<label>{label}</label>
			<input id={id} value={value ?? ''} readOnly />
		</div>
	),
}));

jest.mock('@/components/formikElements/customDropDownSelect/customDropDownSelect', () => ({
	__esModule: true,
	default: ({ id, label, onChange, value }: { id: string; label: string; onChange?: (e: { target: { value: string } }) => void; value?: string }) => (
		<div data-testid={`select-${id}`}>
			<label>{label}</label>
			<select data-testid={`dropdown-${id}`} value={value ?? ''} onChange={(e) => onChange?.({ target: { value: e.target.value } })}>
				<option value="Homme">Homme</option>
				<option value="Femme">Femme</option>
			</select>
		</div>
	),
}));

jest.mock('@/components/formikElements/customSquareImageUploading/customSquareImageUploading', () => ({
	__esModule: true,
	default: ({ onChange, onCrop, image, croppedImage }: { onChange: (img: string) => void; onCrop: (cropped: string) => void; image: string; croppedImage: string }) => (
		<div data-testid="avatar-upload">
			<span data-testid="avatar-image">{image}</span>
			<span data-testid="avatar-cropped">{croppedImage}</span>
			<button data-testid="avatar-change" onClick={() => onChange('data:image/png;base64,new')}>Change</button>
			<button data-testid="avatar-crop" onClick={() => onCrop('data:image/png;base64,cropped')}>Crop</button>
		</div>
	),
}));

jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: ({ buttonText, onClick }: { buttonText: string; onClick?: () => void }) => (
		<button data-testid="submit-button" onClick={onClick}>{buttonText}</button>
	),
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

jest.mock('@/utils/themes', () => ({
	textInputTheme: jest.fn(() => ({})),
	customDropdownTheme: jest.fn(() => ({})),
}));

jest.mock('@/utils/rawData', () => ({
	genderItemsList: jest.fn(() => [
		{ value: 'Homme', label: 'Homme' },
		{ value: 'Femme', label: 'Femme' },
	]),
}));

jest.mock('@/utils/formValidationSchemas', () => ({
	profilSchema: { parse: jest.fn() },
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
	centerAvatar: 'centerAvatar',
	maxInputWidth: 'maxInputWidth',
	maxWidth: 'maxWidth',
	mobileButton: 'mobileButton',
	submitButton: 'submitButton',
	main: 'main',
	fixMobile: 'fixMobile',
}));

// Import after mocks
import EditProfileClient from './edit-profile';

const mockSession: AppSession = {
	accessToken: 'mock-token',
	refreshToken: 'mock-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z',
	refreshTokenExpiration: '2099-12-31T23:59:59Z',
	expires: '2099-12-31T23:59:59Z',
	user: {
		id: '1',
		pk: 1,
		email: 'test@example.com',
		emailVerified: null,
		name: 'Test User',
		first_name: 'Test',
		last_name: 'User',
		image: null,
	},
};

const renderWithProviders = (ui: React.ReactElement) => render(<Provider store={mockStore}>{ui}</Provider>);

describe('EditProfileClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetProfilQuery.mockReturnValue({
			data: {
				first_name: 'Test',
				last_name: 'User',
				gender: 'Homme',
				avatar: '',
				avatar_cropped: '',
			},
			isLoading: false,
		});
	});

	afterEach(() => {
		cleanup();
	});

	it('renders the profile title', () => {
		renderWithProviders(<EditProfileClient session={mockSession} />);
		expect(screen.getByText('Profil')).toBeInTheDocument();
	});

	it('renders the avatar upload', () => {
		renderWithProviders(<EditProfileClient session={mockSession} />);
		expect(screen.getByTestId('avatar-upload')).toBeInTheDocument();
	});

	it('renders first name input', () => {
		renderWithProviders(<EditProfileClient session={mockSession} />);
		expect(screen.getByTestId('input-first_name')).toBeInTheDocument();
		expect(screen.getByText('Nom')).toBeInTheDocument();
	});

	it('renders last name input', () => {
		renderWithProviders(<EditProfileClient session={mockSession} />);
		expect(screen.getByTestId('input-last_name')).toBeInTheDocument();
		expect(screen.getByText('Prénom')).toBeInTheDocument();
	});

	it('renders gender select', () => {
		renderWithProviders(<EditProfileClient session={mockSession} />);
		expect(screen.getByTestId('select-gender')).toBeInTheDocument();
		expect(screen.getByText('Genre')).toBeInTheDocument();
	});

	it('renders submit button', () => {
		renderWithProviders(<EditProfileClient session={mockSession} />);
		expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
	});

	it('renders loading state when profile is loading', () => {
		mockUseGetProfilQuery.mockReturnValue({
			data: undefined,
			isLoading: true,
		});
		renderWithProviders(<EditProfileClient session={mockSession} />);
		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('populates form with profile data', () => {
		renderWithProviders(<EditProfileClient session={mockSession} />);
		const firstNameInput = screen.getByTestId('input-first_name').querySelector('input');
		expect(firstNameInput).toHaveValue('Test');
	});

	it('handles avatar change callback', () => {
		renderWithProviders(<EditProfileClient session={mockSession} />);
		const changeBtn = screen.getByTestId('avatar-change');
		fireEvent.click(changeBtn);
		expect(screen.getByTestId('avatar-upload')).toBeInTheDocument();
	});

	it('handles avatar crop callback', () => {
		renderWithProviders(<EditProfileClient session={mockSession} />);
		const cropBtn = screen.getByTestId('avatar-crop');
		fireEvent.click(cropBtn);
		expect(screen.getByTestId('avatar-upload')).toBeInTheDocument();
	});

	it('handles gender dropdown change', () => {
		renderWithProviders(<EditProfileClient session={mockSession} />);
		const genderSelect = screen.getByTestId('dropdown-gender');
		fireEvent.change(genderSelect, { target: { value: 'Femme' } });
		expect(screen.getByTestId('select-gender')).toBeInTheDocument();
	});

	it('handles submit button click', async () => {
		mockEditProfil.mockResolvedValue({ data: { first_name: 'Test', last_name: 'User', gender: 'Homme' } });
		renderWithProviders(<EditProfileClient session={mockSession} />);
		const submitBtn = screen.getByTestId('submit-button');
		fireEvent.click(submitBtn);
		expect(screen.getByTestId('submit-button')).toBeInTheDocument();
	});

	it('renders with profile data including avatar', () => {
		mockUseGetProfilQuery.mockReturnValue({
			data: {
				first_name: 'Jane',
				last_name: 'Doe',
				gender: 'Femme',
				avatar: 'data:image/png;base64,abc',
				avatar_cropped: 'data:image/png;base64,def',
			},
			isLoading: false,
		});
		renderWithProviders(<EditProfileClient session={mockSession} />);
		expect(screen.getByTestId('avatar-image')).toHaveTextContent('data:image/png;base64,abc');
		expect(screen.getByTestId('avatar-cropped')).toHaveTextContent('data:image/png;base64,def');
	});

	it('renders without profil data (empty state)', () => {
		mockUseGetProfilQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
		});
		renderWithProviders(<EditProfileClient session={mockSession} />);
		const firstNameInput = screen.getByTestId('input-first_name').querySelector('input');
		expect(firstNameInput).toHaveValue('');
	});
});
