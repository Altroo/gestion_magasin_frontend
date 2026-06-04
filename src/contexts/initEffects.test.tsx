import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { InitEffects } from './initEffects';
import { useSession } from 'next-auth/react';
import { useGetProfilQuery } from '@/store/services/account';
import { useAppDispatch, useAppSelector } from '@/utils/hooks';
import { getAccessToken } from '@/store/selectors';

jest.mock('next-auth/react');
jest.mock('@/store/services/account');
jest.mock('@/utils/hooks');
jest.mock('@/store/selectors');

jest.mock('next/navigation', () => ({
	useRouter: jest.fn(),
	usePathname: jest.fn(),
}));

import { useRouter, usePathname } from 'next/navigation';

const mockDispatch = jest.fn();

describe('InitEffects', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		(useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
		(useAppSelector as jest.Mock).mockImplementation((selector) => {
			if (selector === getAccessToken) return { access: 'mock-token' };
			return undefined;
		});

		(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
		(usePathname as jest.Mock).mockReturnValue('/');

		(useGetProfilQuery as jest.Mock).mockReturnValue({ data: undefined });
	});

	it('renders null without errors', () => {
		(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });

		const { container } = render(<InitEffects />);
		expect(container.firstChild).toBeNull();
	});

	it('dispatches INIT_APP_SESSION_TOKENS when session is authenticated', async () => {
		const mockSession = { user: { name: 'Test' }, accessToken: 'mock-access-token' };
		(useSession as jest.Mock).mockReturnValue({ data: mockSession, status: 'authenticated' });

		render(<InitEffects />);

		await waitFor(() => {
			expect(mockDispatch).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'INIT_APP_SESSION_TOKENS' }),
			);
		});
	});

	it('does not dispatch INIT_APP_SESSION_TOKENS when unauthenticated', async () => {
		(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });

		render(<InitEffects />);

		await waitFor(() => {
			const initCalls = mockDispatch.mock.calls.filter(
				([action]) => action?.type === 'INIT_APP_SESSION_TOKENS',
			);
			expect(initCalls.length).toBe(0);
		});
	});

	it('dispatches ACCOUNT_SET_PROFIL when profile data is available', async () => {
		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });

		const mockUser = { id: 1, first_name: 'Jane', default_password_set: false };
		(useGetProfilQuery as jest.Mock).mockReturnValue({ data: mockUser });

		render(<InitEffects />);

		await waitFor(() => {
			expect(mockDispatch).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'ACCOUNT_SET_PROFIL', data: mockUser }),
			);
		});
	});

	it('redirects to DASHBOARD_PASSWORD when default_password_set is true', async () => {
		const mockPush = jest.fn();
		(useRouter as jest.Mock).mockReturnValue({ push: mockPush });
		(usePathname as jest.Mock).mockReturnValue('/dashboard/contracts');

		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });
		const mockUser = { id: 1, first_name: 'A', default_password_set: true };
		(useGetProfilQuery as jest.Mock).mockReturnValue({ data: mockUser });

		render(<InitEffects />);

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('password'));
		});
	});

	it('does not redirect when already on password page', async () => {
		const mockPush = jest.fn();
		(useRouter as jest.Mock).mockReturnValue({ push: mockPush });
		(usePathname as jest.Mock).mockReturnValue('/dashboard/settings/password');

		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });
		const mockUser = { id: 1, first_name: 'A', default_password_set: true };
		(useGetProfilQuery as jest.Mock).mockReturnValue({ data: mockUser });

		render(<InitEffects />);

		await waitFor(() => {
			expect(mockPush).not.toHaveBeenCalled();
		});
	});
});
