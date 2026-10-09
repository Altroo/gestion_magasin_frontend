import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { ChangelogEntry } from '@/types/changelogTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';

export const changelogApi = createApi({
	reducerPath: 'changelogApi',
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getChangelog: builder.query<ChangelogEntry[], void>({
			query: () => ({ url: '/ws/changelog/', method: 'GET' }),
		}),
	}),
});
export const { useGetChangelogQuery } = changelogApi;
