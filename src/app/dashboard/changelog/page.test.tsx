jest.mock('@/utils/serverTranslations', () => ({ getServerTranslations: jest.fn() }));
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Page, { generateMetadata } from './page';
import { getServerTranslations } from '@/utils/serverTranslations';
import { fr } from '@/translations/fr';
import { en } from '@/translations/en';
import Changelog from '@/components/pages/dashboard/changelog/changelog';
import { AUTH_LOGIN } from '@/utils/routes';

jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('next/navigation', () => ({
	redirect: jest.fn(() => {
		throw new Error('redirect');
	}),
}));
jest.mock('@/components/pages/dashboard/changelog/changelog', () => ({ __esModule: true, default: () => null }));
beforeEach(() => jest.clearAllMocks());
it('requires a signed-in user', async () => {
	(auth as jest.Mock).mockResolvedValue(null);
	await expect(Page()).rejects.toThrow('redirect');
	expect(redirect).toHaveBeenCalledWith(AUTH_LOGIN);
});
it('is available to an ordinary signed-in user', async () => {
	(auth as jest.Mock).mockResolvedValue({ user: { is_staff: false } });
	expect((await Page()).type).toBe(Changelog);
	expect(redirect).not.toHaveBeenCalled();
});

it.each([
	[fr, 'Nouveautés'],
	[en, 'Changelog'],
] as const)('translates the page metadata', async (dictionary, title) => {
	jest.mocked(getServerTranslations).mockResolvedValue(dictionary);
	expect((await generateMetadata()).title).toBe(title);
});
