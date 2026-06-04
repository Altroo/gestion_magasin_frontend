import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavigationBar from './navigationBar';
import '@testing-library/jest-dom';
import React from 'react';

jest.mock('@/utils/clientHelpers', () => ({
	Desktop: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
	TabletAndMobile: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

let mockPathname = '/dashboard';
jest.mock('next/navigation', () => ({
	usePathname: () => mockPathname,
}));

let mockIsMobile = false;
jest.mock('@mui/material', () => {
	const actual = jest.requireActual('@mui/material');
	return {
		...actual,
		useMediaQuery: () => mockIsMobile,
	};
});

const mockCookiesDeleter = jest.fn();
jest.mock('@/utils/apiHelpers', () => ({
	cookiesDeleter: (...args: unknown[]) => mockCookiesDeleter(...(args as unknown[])),
}));

const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
	signOut: (...args: unknown[]) => mockSignOut(...(args as unknown[])),
	useSession: () => mockUseSession(),
}));

const mockUseIsClient = jest.fn(() => true);
const mockUseAppDispatch = jest.fn();
const mockUseAppSelector = jest.fn();
jest.mock('@/utils/hooks', () => ({
	useAppDispatch: () => mockUseAppDispatch,
	useAppSelector: (fn: unknown) => mockUseAppSelector(fn),
	useIsClient: () => mockUseIsClient(),
	useLanguage: () => ({ t: jest.requireActual('@/translations/fr').fr, language: 'fr', setLanguage: jest.fn() }),
}));

const mockFetchNotifications = jest.fn(() => ({
	unwrap: jest.fn().mockResolvedValue({ results: [], next: null }),
}));
const mockMarkNotificationsRead = jest.fn().mockResolvedValue({});
const mockUnreadCountResult = { data: { count: 0 } };
const mockNotificationsResult = { data: { results: [], next: null } };
jest.mock('@/store/services/notification', () => ({
	useGetUnreadNotificationCountQuery: () => mockUnreadCountResult,
	useGetNotificationsQuery: () => mockNotificationsResult,
	useLazyGetNotificationsQuery: () => [mockFetchNotifications],
	useMarkNotificationsReadMutation: () => [mockMarkNotificationsRead],
}));

describe('NavigationBar', () => {
	let mockProfile = {
		avatar_cropped: undefined,
		first_name: 'John',
		last_name: 'Doe',
		gender: 'Homme',
		is_staff: false,
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockPathname = '/dashboard';
		mockProfile = {
			avatar_cropped: undefined,
			first_name: 'John',
			last_name: 'Doe',
			gender: 'Homme',
			is_staff: false,
		};
		mockUseAppSelector.mockImplementation((selector: { name?: string }) => (
			selector.name === 'getUnreadNotificationCount' ? 0 : mockProfile
		));
		mockUseSession.mockImplementation(() => ({ data: {}, status: 'authenticated' }));
		mockIsMobile = false;
	});

	it('renders the title passed as prop', () => {
		render(
			<NavigationBar title="Mon Contrat">
				<div>Content</div>
			</NavigationBar>,
		);
		expect(screen.getByText('Mon Contrat')).toBeInTheDocument();
	});

	it('calls cookiesDeleter and signOut when logout clicked', async () => {
		render(
			<NavigationBar title="Dashboard">
				<div>Content</div>
			</NavigationBar>,
		);

		const logoutBtn = screen.getByRole('button', { name: /Se déconnecter/i });
		await userEvent.click(logoutBtn);

		expect(mockCookiesDeleter).toHaveBeenCalledTimes(1);
		expect(mockSignOut).toHaveBeenCalledTimes(1);
		expect(mockSignOut.mock.calls[0][0]).toMatchObject({ redirect: true });
	});

	it('shows Bienvenu greeting for Homme gender', () => {
		render(
			<NavigationBar title="t1">
				<div />
			</NavigationBar>,
		);
		expect(screen.getByText(/Bienvenu/i)).toBeInTheDocument();
	});

	it('shows Bienvenue greeting for Femme gender', () => {
		mockProfile = {
			avatar_cropped: undefined,
			first_name: 'Marie',
			last_name: 'C',
			gender: 'Femme',
			is_staff: false,
		};
		render(
			<NavigationBar title="t2">
				<div />
			</NavigationBar>,
		);
		expect(
			screen.getAllByText(/Bienvenue|Bienvenu/i).some((el) => /Bienvenue/.test(el.textContent || '')),
		).toBeTruthy();
	});


	it('shows Utilisateurs section for staff users', () => {
		mockProfile = {
			avatar_cropped: undefined,
			first_name: 'Admin',
			last_name: 'User',
			gender: 'Homme',
			is_staff: true,
		};
		render(
			<NavigationBar title="Admin">
				<div />
			</NavigationBar>,
		);
		expect(screen.getByText('Utilisateurs')).toBeInTheDocument();
	});

	it('does not show Utilisateurs section for non-staff users', () => {
		render(
			<NavigationBar title="User">
				<div />
			</NavigationBar>,
		);
		expect(screen.queryByText('Utilisateurs')).not.toBeInTheDocument();
	});


	it('drawer toggle button only appears on mobile', async () => {
		mockIsMobile = false;
		const { rerender } = render(
			<NavigationBar title="D"><div /></NavigationBar>,
		);
		expect(screen.queryByLabelText('Basculer le tiroir de navigation')).not.toBeInTheDocument();

		mockIsMobile = true;
		rerender(
			<NavigationBar title="D2"><div /></NavigationBar>,
		);
		const toggleBtn = screen.getByLabelText('Basculer le tiroir de navigation');
		expect(toggleBtn).toBeInTheDocument();
		await userEvent.click(toggleBtn);
	});

	it('handles pathname with no matching menu item without error', () => {
		mockPathname = '/some/random/path';
		render(
			<NavigationBar title="Random">
				<div />
			</NavigationBar>,
		);
		expect(screen.getByText('Random')).toBeInTheDocument();
	});
});
