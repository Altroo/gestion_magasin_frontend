import React from 'react';
import { render, waitFor } from '@testing-library/react';
import ClearCookiesClient from './clearCookiesClient';
import { cookiesDeleter } from '@/utils/apiHelpers';

jest.mock('@/utils/apiHelpers', () => ({
	cookiesDeleter: jest.fn().mockResolvedValue(undefined),
}));

describe('ClearCookiesClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('calls cookiesDeleter with correct path and keys on mount', async () => {
		render(<ClearCookiesClient />);

		await waitFor(() => {
			expect(cookiesDeleter).toHaveBeenCalledTimes(1);
		});

		expect(cookiesDeleter).toHaveBeenCalledWith('/api/cookies', {
			pass_updated: true,
			new_email: true,
			code: true,
		});
	});
});
