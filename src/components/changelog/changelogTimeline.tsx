import Styles from '@/styles/dashboard/changelog/changelog.module.sass';
import type { ChangelogEntry } from '@/types/changelogTypes';
import type { Language } from '@/types/languageTypes';

export const ChangelogTimeline = ({ entries, language }: { entries: ChangelogEntry[]; language: Language }) => {
	const dateFormat = new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC',
	});
	return (
		<div className={Styles.timeline}>
			{entries.map((entry) => (
				<article key={entry.id} aria-labelledby={`changelog-${entry.id}`} className={Styles.entry}>
					<div className={Styles.dateColumn}>
						<time dateTime={entry.date} className={Styles.date}>
							{dateFormat.format(new Date(`${entry.date}T00:00:00Z`))}
						</time>
						{entry.version && <p className={Styles.version}>Version {entry.version}</p>}
					</div>
					<div className={Styles.content}>
						<h2 id={`changelog-${entry.id}`} className={Styles.entryTitle}>
							{entry[`title_${language}`]}
						</h2>
						<ul className={Styles.changes}>
							{entry[`changes_${language}`].map((change, index) => (
								<li key={index} className={Styles.change}>
									<span aria-hidden="true" className={Styles.bullet}>
										-
									</span>
									<span className={Styles.changeText}>{change}</span>
								</li>
							))}
						</ul>
					</div>
				</article>
			))}
		</div>
	);
};
