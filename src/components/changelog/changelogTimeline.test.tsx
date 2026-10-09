import { render, screen, within } from '@testing-library/react';
import { ChangelogTimeline } from './changelogTimeline';
import type { ChangelogEntry } from '@/types/changelogTypes';

const entries: ChangelogEntry[] = [
	{
		id: 1,
		date: '2026-09-09',
		version: '1.0.0',
		title_fr: 'Des projets partagés',
		title_en: 'Shared projects',
		changes_fr: ['Travaillez ensemble.', 'Ajoutez plusieurs fichiers.'],
		changes_en: ['Work together.', 'Attach several files.'],
	},
];

it.each(['fr', 'en'] as const)(
	'shows the date, title and every change in %s with no read-more controls',
	(language) => {
		const { container } = render(<ChangelogTimeline entries={entries} language={language} />);
		expect(container.querySelector('time')).toHaveAttribute('datetime', '2026-09-09');
		expect(container.querySelector('time')).toHaveTextContent(
			language === 'fr' ? '9 septembre 2026' : 'September 9, 2026',
		);
		const article = screen.getByRole('article', { name: entries[0][`title_${language}`] });
		expect(within(article).getByText('Version 1.0.0')).toBeVisible();
		expect(within(article).getAllByRole('listitem')).toHaveLength(2);
		entries[0][`changes_${language}`].forEach((change) => expect(within(article).getByText(change)).toBeVisible());
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	},
);
it('does not invent a version for historical entries', () => {
	render(<ChangelogTimeline entries={[{ ...entries[0], version: '' }]} language="fr" />);
	expect(screen.queryByText(/Version/)).not.toBeInTheDocument();
});
it('renders admin text as plain text, never HTML', () => {
	const { container } = render(
		<ChangelogTimeline entries={[{ ...entries[0], changes_fr: ['<strong>Plain text</strong>'] }]} language="fr" />,
	);
	expect(screen.getByText('<strong>Plain text</strong>')).toBeVisible();
	expect(container.querySelector('strong')).toBeNull();
});
