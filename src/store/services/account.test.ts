import { accountApi, profilApi, usersApi } from '@/store/services/account';
import { setupApiStore } from '@/store/setupApiStore';

beforeAll(() => {
	process.env.NEXT_PUBLIC_ACCOUNT_SEND_PASSWORD_RESET ||= 'https://example.com/account/password-reset/send/';
	process.env.NEXT_PUBLIC_ACCOUNT_PASSWORD_RESET ||= 'https://example.com/account/password-reset/';
	process.env.NEXT_PUBLIC_ACCOUNT_PROFIL ||= 'https://example.com/account/profile/';
	process.env.NEXT_PUBLIC_ACCOUNT_PASSWORD_CHANGE ||= 'https://example.com/account/password-change/';
	process.env.NEXT_PUBLIC_USERS_ROOT ||= 'https://example.com/users/';
});

jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async () => ({ data: { ok: true } }),
}));

describe('accountApi', () => {
	const storeRef = setupApiStore(accountApi);

	it('sendPasswordResetCode mutation completes without error', async () => {
		const result = await storeRef.store.dispatch(
			accountApi.endpoints.sendPasswordResetCode.initiate({ email: 'test@example.com' }),
		);
		expect('error' in result).toBe(false);
	});

	it('passwordReset mutation completes without error', async () => {
		const result = await storeRef.store.dispatch(
			accountApi.endpoints.passwordReset.initiate({ email: 'test@example.com', code: '123456' }),
		);
		expect('error' in result).toBe(false);
	});

	it('setPassword mutation completes without error', async () => {
		const result = await storeRef.store.dispatch(
			accountApi.endpoints.setPassword.initiate({
				email: 'test@example.com',
				code: '123456',
				new_password: 'newpass',
				new_password2: 'newpass',
			}),
		);
		expect('error' in result).toBe(false);
	});
});

describe('profilApi', () => {
	const storeRef = setupApiStore(profilApi);

	it('getProfil query completes without error', async () => {
		const result = await storeRef.store.dispatch(profilApi.endpoints.getProfil.initiate());
		expect('error' in result).toBe(false);
	});

	it('editProfil mutation completes without error', async () => {
		const result = await storeRef.store.dispatch(
			profilApi.endpoints.editProfil.initiate({ data: new FormData() }),
		);
		expect('error' in result).toBe(false);
	});

	it('editPassword mutation completes without error', async () => {
		const result = await storeRef.store.dispatch(
			profilApi.endpoints.editPassword.initiate({ data: { old_password: 'old', new_password: 'new', new_password2: 'new' } }),
		);
		expect('error' in result).toBe(false);
	});
});

describe('usersApi', () => {
	const storeRef = setupApiStore(usersApi);

	it('getUsersList query (no pagination) completes without error', async () => {
		const result = await storeRef.store.dispatch(
			usersApi.endpoints.getUsersList.initiate({ with_pagination: false }),
		);
		expect('error' in result).toBe(false);
	});

	it('getUsersList query (with pagination) completes without error', async () => {
		const result = await storeRef.store.dispatch(
			usersApi.endpoints.getUsersList.initiate({ with_pagination: true, page: 1, pageSize: 10, search: '' }),
		);
		expect('error' in result).toBe(false);
	});

	it('getUser query completes without error', async () => {
		const result = await storeRef.store.dispatch(usersApi.endpoints.getUser.initiate({ id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('checkEmail mutation completes without error', async () => {
		const result = await storeRef.store.dispatch(
			usersApi.endpoints.checkEmail.initiate({ email: 'test@example.com' }),
		);
		expect('error' in result).toBe(false);
	});

	it('addUser mutation completes without error', async () => {
		const result = await storeRef.store.dispatch(
			usersApi.endpoints.addUser.initiate({ data: { email: 'new@example.com' } }),
		);
		expect('error' in result).toBe(false);
	});

	it('deleteUser mutation completes without error', async () => {
		const result = await storeRef.store.dispatch(usersApi.endpoints.deleteUser.initiate({ id: 1 }));
		expect('error' in result).toBe(false);
	});

	it('bulkDeleteUsers mutation completes without error', async () => {
		const result = await storeRef.store.dispatch(usersApi.endpoints.bulkDeleteUsers.initiate({ ids: [1, 2] }));
		expect('error' in result).toBe(false);
	});
});
