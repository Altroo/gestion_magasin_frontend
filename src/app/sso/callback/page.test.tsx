import { render, waitFor } from '@testing-library/react';
import type React from 'react';

const mockSignIn = jest.fn();
jest.mock('next-auth/react', () => ({
	__esModule: true,
	signIn: (...args: unknown[]) => mockSignIn(...args),
}));

const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
	__esModule: true,
	useRouter: () => ({ replace: mockReplace }),
	useSearchParams: () => mockSearchParams,
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div>SSO_CALLBACK_LOADING</div>,
}));

jest.mock('@/utils/routes', () => ({
	__esModule: true,
	DASHBOARD: '/dashboard',
	AUTH_LOGIN: '/login',
}));

beforeEach(() => {
	jest.clearAllMocks();
	mockSearchParams = new URLSearchParams('code=abc');
});

describe('SSOCallbackPage', () => {
	it('exchanges code and redirects to dashboard', async () => {
		mockSignIn.mockResolvedValueOnce({});
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Page = require('./page').default as React.ComponentType;

		render(<Page />);

		await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('sso-code', { code: 'abc', redirect: false }));
		expect(mockReplace).toHaveBeenCalledWith('/dashboard');
	});

	it('redirects to login when code is missing', async () => {
		mockSearchParams = new URLSearchParams();
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Page = require('./page').default as React.ComponentType;

		render(<Page />);

		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login?error=SSOCodeMissing'));
		expect(mockSignIn).not.toHaveBeenCalled();
	});
});
