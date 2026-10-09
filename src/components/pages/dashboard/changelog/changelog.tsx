'use client';
import Styles from '@/styles/dashboard/changelog/changelog.module.sass';

import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { ChangelogTimeline } from '@/components/changelog/changelogTimeline';
import { useGetChangelogQuery } from '@/store/services/changelog';
import { useAppSelector, useLanguage } from '@/utils/hooks';
import { getAccessToken } from '@/store/selectors';

const Changelog = () => {
	const { t, language } = useLanguage();
	const accessToken = useAppSelector(getAccessToken);
	const {
		data,
		isLoading: queryLoading,
		isError,
		refetch,
	} = useGetChangelogQuery(undefined, { skip: !accessToken, refetchOnMountOrArgChange: true });
	const isLoading = !accessToken || queryLoading;
	return (
		<NavigationBar title={t.navigation.changelog}>
			<div className={Styles.page}>
				<section className={Styles.card} aria-label={t.navigation.changelog}>
					{isLoading ? (
						<p role="status" className={Styles.message}>
							{t.changelog.loading}
						</p>
					) : null}
					{isError ? (
						<div role="alert" className={Styles.error}>
							<p className={Styles.errorMessage}>{t.changelog.error}</p>
							<button type="button" className={Styles.retry} onClick={() => void refetch()}>
								{t.common.retry}
							</button>
						</div>
					) : null}
					{data?.length ? (
						<ChangelogTimeline entries={data} language={language} />
					) : !isLoading && !isError ? (
						<p className={Styles.message}>{t.changelog.empty}</p>
					) : null}
				</section>
			</div>
		</NavigationBar>
	);
};

export default Changelog;
