import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavigationBar from './navigationBar';
import '@testing-library/jest-dom';
import React from 'react';
import type { NotificationType } from '@/types/gestionMagasinTypes';
import { CUSTOMER_DISPLAY_COOKIE, CUSTOMER_DISPLAY_COOKIE_VALUE } from '@/utils/customerDisplay';

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
const mockFetch = jest.fn();
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

type NotificationPage = { results: NotificationType[]; next: string | null };
const notification = (id: number): NotificationType => ({
	id,
	title: `Notification ${id}`,
	message: `Message ${id}`,
	notification_type: 'low_stock',
	object_id: null,
	is_read: false,
	date_created: '2026-09-07T10:00:00Z',
});
const mockFetchNotifications = jest.fn<{ unwrap: () => Promise<NotificationPage> }, [{ page: number }]>();
const mockMarkNotificationsRead = jest.fn().mockResolvedValue({});
const mockUnreadCountResult = { data: { count: 0 } };
const mockNotificationsResult: { data?: NotificationPage } = { data: { results: [], next: null } };
jest.mock('@/store/services/notification', () => ({
	useGetUnreadNotificationCountQuery: () => mockUnreadCountResult,
	useGetNotificationsQuery: () => mockNotificationsResult,
	useLazyGetNotificationsQuery: () => [mockFetchNotifications],
	useMarkNotificationsReadMutation: () => [mockMarkNotificationsRead],
}));

const mockUseGetMyStoresQuery = jest.fn();
jest.mock('@/store/services/magasin', () => ({
	useGetMyStoresQuery: (...args: unknown[]) => mockUseGetMyStoresQuery(...args),
}));

describe('NavigationBar', () => {
	let mockProfile: {
		avatar_cropped?: string;
		first_name: string;
		last_name: string;
		gender: string;
		is_staff: boolean;
		pointage_only?: boolean;
	} = {
		avatar_cropped: undefined,
		first_name: 'John',
		last_name: 'Doe',
		gender: 'Homme',
		is_staff: false,
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockUseIsClient.mockReturnValue(true);
		mockNotificationsResult.data = { results: [], next: null };
		mockFetchNotifications.mockReset();
		mockFetchNotifications.mockReturnValue({ unwrap: async () => ({ results: [], next: null }) });
		mockFetch.mockResolvedValue({ ok: true });
		Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: mockFetch });
		document.cookie = `${CUSTOMER_DISPLAY_COOKIE}=; Max-Age=0; Path=/`;
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
		mockUseGetMyStoresQuery.mockReturnValue({ data: [], isSuccess: true });
		mockIsMobile = false;
	});

	it('loads notification pages and resets pagination when the first page refreshes', async () => {
		mockNotificationsResult.data = undefined;
		const { rerender } = render(<NavigationBar title="Dashboard"><div /></NavigationBar>);
		await userEvent.click(screen.getByRole('button', { name: 'Notifications' }));

		mockNotificationsResult.data = { results: [notification(1)], next: '?page=2' };
		rerender(<NavigationBar title="Dashboard"><div /></NavigationBar>);
		expect(screen.getByText('Notification 1')).toBeInTheDocument();

		mockFetchNotifications.mockReturnValueOnce({
			unwrap: async () => ({ results: [notification(2)], next: '?page=3' }),
		});
		await userEvent.click(screen.getByRole('button', { name: 'Afficher' }));
		expect(mockFetchNotifications).toHaveBeenLastCalledWith({ page: 2 });
		expect(await screen.findByText('Notification 2')).toBeInTheDocument();
		expect(screen.getByText('Notification 1')).toBeInTheDocument();

		mockFetchNotifications.mockReturnValueOnce({
			unwrap: async () => ({ results: [notification(3)], next: null }),
		});
		await userEvent.click(screen.getByRole('button', { name: 'Afficher' }));
		expect(mockFetchNotifications).toHaveBeenLastCalledWith({ page: 3 });
		expect(await screen.findByText('Notification 3')).toBeInTheDocument();
		expect(screen.getByText('Notification 2')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Afficher' })).not.toBeInTheDocument();

		mockNotificationsResult.data = { results: [notification(4)], next: '?page=2' };
		rerender(<NavigationBar title="Dashboard"><div /></NavigationBar>);
		expect(screen.getByText('Notification 4')).toBeInTheDocument();
		expect(screen.queryByText('Notification 1')).not.toBeInTheDocument();
		expect(screen.queryByText('Notification 2')).not.toBeInTheDocument();
		expect(screen.queryByText('Notification 3')).not.toBeInTheDocument();
		await userEvent.click(screen.getByRole('button', { name: 'Afficher' }));
		expect(mockFetchNotifications).toHaveBeenLastCalledWith({ page: 2 });
	});

	it('ignores a pending older page after the first page refreshes', async () => {
		mockNotificationsResult.data = { results: [notification(1)], next: '?page=2' };
		let resolvePage!: (page: NotificationPage) => void;
		const pendingPage = new Promise<NotificationPage>((resolve) => { resolvePage = resolve; });
		mockFetchNotifications.mockReturnValueOnce({ unwrap: () => pendingPage });
		const { rerender } = render(<NavigationBar title="Dashboard"><div /></NavigationBar>);
		await userEvent.click(screen.getByRole('button', { name: 'Notifications' }));
		await userEvent.click(screen.getByRole('button', { name: 'Afficher' }));
		expect(screen.getByRole('button', { name: 'Chargement…' })).toBeDisabled();

		mockNotificationsResult.data = { results: [notification(4)], next: '?page=2' };
		rerender(<NavigationBar title="Dashboard"><div /></NavigationBar>);
		await act(async () => { resolvePage({ results: [notification(2)], next: null }); });
		expect(screen.getByText('Notification 4')).toBeInTheDocument();
		expect(screen.queryByText('Notification 2')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Afficher' })).toBeEnabled();
	});

	it('keeps caisse controls hidden until the client is ready', () => {
		document.cookie = `${CUSTOMER_DISPLAY_COOKIE}=${CUSTOMER_DISPLAY_COOKIE_VALUE}; Path=/`;
		mockUseIsClient.mockReturnValue(false);
		const { rerender } = render(<NavigationBar title="Caisse"><div /></NavigationBar>);
		expect(screen.queryByRole('button', { name: 'Fermer la caisse' })).not.toBeInTheDocument();
		mockUseIsClient.mockReturnValue(true);
		rerender(<NavigationBar title="Caisse"><div /></NavigationBar>);
		expect(screen.getByRole('button', { name: 'Fermer la caisse' })).toBeInTheDocument();
	});

	it('shows tactile window controls and confirms before closing the installed caisse', async () => {
		document.cookie = `${CUSTOMER_DISPLAY_COOKIE}=${CUSTOMER_DISPLAY_COOKIE_VALUE}; Path=/`;

		render(
			<NavigationBar title="Caisse">
				<div />
			</NavigationBar>,
		);

		expect(screen.getByRole('button', { name: 'Réduire la caisse' })).toBeInTheDocument();
		await userEvent.click(screen.getByRole('button', { name: 'Fermer la caisse' }));
		expect(mockFetch).not.toHaveBeenCalled();
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(screen.getByText("Voulez-vous fermer l'application Caisse ?")).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
		await userEvent.click(screen.getByRole('button', { name: 'Fermer' }));
		await waitFor(() =>
			expect(mockFetch).toHaveBeenCalledWith(
				'http://127.0.0.1:37821/window/close',
				expect.objectContaining({ method: 'POST', body: 'close' }),
			),
		);
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
		const installerLink = screen.getByRole('link', { name: "Installer l'imprimante caisse" });
		expect(installerLink).toHaveAttribute('href', '/downloads/Installer-Caisse.cmd');
		expect(installerLink).toHaveAttribute('download');
	});

	it('does not show Utilisateurs section for non-staff users', () => {
		render(
			<NavigationBar title="User">
				<div />
			</NavigationBar>,
		);
		expect(screen.queryByText('Utilisateurs')).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: "Installer l'imprimante caisse" })).not.toBeInTheDocument();
	});

	it('shows only caisse and personal settings for a vendeur', () => {
		mockUseGetMyStoresQuery.mockReturnValue({
			isSuccess: true,
			data: [
				{
					id: 1,
					store: { id: 1, is_active: true, is_global_stock: false },
					role: { code: 'vendeur' },
					is_active: true,
				},
			],
		});

		render(
			<NavigationBar title="Caisse">
				<div />
			</NavigationBar>,
		);

		expect(screen.getByText('Opérations')).toBeInTheDocument();
		expect(screen.getAllByText('Caisse').length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText('Paramètres')).toBeInTheDocument();
		expect(screen.queryByText('Articles')).not.toBeInTheDocument();
		expect(screen.queryByText('Stock')).not.toBeInTheDocument();
		expect(screen.queryByText('Ventes')).not.toBeInTheDocument();
		expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
		expect(screen.queryByText('Administration')).not.toBeInTheDocument();
		const installerLink = screen.getByRole('link', { name: "Installer l'imprimante caisse" });
		expect(installerLink).toHaveAttribute('href', '/downloads/Installer-Caisse.cmd');
		expect(installerLink).toHaveAttribute('download');
	});

	it('shows only pointage and account settings navigation for pointage-only users', () => {
		mockProfile = {
			avatar_cropped: undefined,
			first_name: 'Pointage',
			last_name: 'User',
			gender: 'Homme',
			is_staff: false,
			pointage_only: true,
		};

		render(
			<NavigationBar title="Pointage">
				<div />
			</NavigationBar>,
		);

		expect(screen.getAllByText('Pointage').length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText('Paramètres')).toBeInTheDocument();
		expect(screen.getAllByText('Mon Profil').length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText('Changer le mot de passe')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Se déconnecter/i })).toBeInTheDocument();
		expect(screen.queryByText('Opérations')).not.toBeInTheDocument();
		expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
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
