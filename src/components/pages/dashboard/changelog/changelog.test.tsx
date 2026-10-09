import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Changelog from './changelog';
import { useGetChangelogQuery } from '@/store/services/changelog';
import { fr } from '@/translations/fr';
import { useAppSelector } from '@/utils/hooks';

jest.mock('@/utils/hooks', () => ({ useLanguage: () => ({ language: 'fr', t: fr }), useAppSelector: jest.fn() }));
jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
jest.mock('@/store/services/changelog', () => ({ useGetChangelogQuery: jest.fn() }));
const query = jest.mocked(useGetChangelogQuery);
const refetch = jest.fn();
beforeEach(() => {
	jest.clearAllMocks();
	jest.mocked(useAppSelector).mockReturnValue('local-test-token');
	query.mockReturnValue({ data: [], isLoading: false, isError: false, refetch } as ReturnType<
		typeof useGetChangelogQuery
	>);
});
it('waits for Redux authentication before fetching changelog entries', () => {
	jest.mocked(useAppSelector).mockReturnValue(null);
	render(<Changelog />);
	expect(query).toHaveBeenCalledWith(undefined, { skip: true, refetchOnMountOrArgChange: true });
	expect(screen.getByRole('status')).toHaveTextContent(fr.changelog.loading);
});
it('shows a clear empty state', () => {
	render(<Changelog />);
	expect(screen.getByText(fr.changelog.empty)).toBeVisible();
});
it('shows loading without a false empty state', () => {
	query.mockReturnValue({ isLoading: true, refetch } as ReturnType<typeof useGetChangelogQuery>);
	render(<Changelog />);
	expect(screen.getByRole('status')).toHaveTextContent(fr.changelog.loading);
	expect(screen.queryByText(fr.changelog.empty)).not.toBeInTheDocument();
});
it('offers retry on network failure', () => {
	query.mockReturnValue({ isError: true, refetch } as ReturnType<typeof useGetChangelogQuery>);
	render(<Changelog />);
	expect(screen.getByRole('alert')).toHaveTextContent(fr.changelog.error);
	fireEvent.click(screen.getByRole('button', { name: fr.common.retry }));
	expect(refetch).toHaveBeenCalled();
});
it('shows entries returned by the server', () => {
	query.mockReturnValue({
		data: [
			{
				id: 1,
				date: '2026-10-06',
				version: '1.0.0',
				title_fr: 'Nouvelle fonction',
				title_en: 'New feature',
				changes_fr: ['Une nouveauté.'],
				changes_en: ['A new feature.'],
			},
		],
		refetch,
	} as ReturnType<typeof useGetChangelogQuery>);
	render(<Changelog />);
	expect(screen.getByRole('heading', { name: 'Nouvelle fonction' })).toBeVisible();
	expect(screen.getByText('Une nouveauté.')).toBeVisible();
});
