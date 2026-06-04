import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import UsersViewClient from './users-view';

jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: jest.fn(() => 'mock-token'),
}));

jest.mock('@/utils/hooks', () => {
	const { translations } = jest.requireActual('@/translations');
	return {
		useToast: () => ({ onSuccess: jest.fn(), onError: jest.fn() }),
		useAppSelector: jest.fn(),
		usePermission: () => ({ is_staff: true, can_view: true, can_print: true, can_create: true, can_edit: true, can_delete: true }),
		useLanguage: () => ({ t: translations.fr }),
	};
});

jest.mock('@/store/services/account', () => ({
	...jest.requireActual('@/store/services/account'),
	useGetUserQuery: jest.fn(() => ({ data: undefined, isLoading: false })),
	useDeleteUserMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
}));

jest.mock('@/utils/routes', () => ({
	USERS_LIST: '/users',
	USERS_EDIT: (id: number) => `/users/${id}/edit`,
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => {
	const Mock = () => <div data-testid="api-progress" />;
	Mock.displayName = 'ApiProgress';
	return { __esModule: true, default: Mock };
});

jest.mock('@/components/layouts/navigationBar/navigationBar', () => {
	const Mock = ({ children }: { children: React.ReactNode }) => <div data-testid="navigation-bar">{children}</div>;
	Mock.displayName = 'NavigationBar';
	return { __esModule: true, default: Mock };
});

jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

describe('UsersViewClient', () => {
	it('shows error when user not found', () => {
		render(
			<Provider store={store}>
				<UsersViewClient id={99} />
			</Provider>,
		);
		expect(screen.getByText(/utilisateur introuvable/i)).toBeInTheDocument();
	});

	it('renders user details', () => {
		const { useGetUserQuery } = jest.requireMock('@/store/services/account');
		(useGetUserQuery as jest.Mock).mockReturnValue({
			data: {
				id: 1,
				first_name: 'Marie',
				last_name: 'Martin',
				email: 'marie@test.com',
				gender: 'F',
				is_active: true,
				is_staff: false,
				can_view: true,
				can_print: true,
				can_create: false,
				can_edit: false,
				can_delete: false,
			},
			isLoading: false,
		});
		render(
			<Provider store={store}>
				<UsersViewClient id={1} />
			</Provider>,
		);
		expect(screen.getByText('Marie Martin')).toBeInTheDocument();
		expect(screen.getByText('marie@test.com')).toBeInTheDocument();
	});

	it('renders modify and delete buttons', () => {
		const { useGetUserQuery } = jest.requireMock('@/store/services/account');
		(useGetUserQuery as jest.Mock).mockReturnValue({
			data: {
				id: 1,
				first_name: 'Marie',
				last_name: 'Martin',
				email: 'marie@test.com',
				is_active: true,
				is_staff: false,
				can_view: true,
				can_print: true,
				can_create: false,
				can_edit: false,
				can_delete: false,
			},
			isLoading: false,
		});
		render(
			<Provider store={store}>
				<UsersViewClient id={1} />
			</Provider>,
		);
		expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /supprimer/i })).toBeInTheDocument();
	});
});
