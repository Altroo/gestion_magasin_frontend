import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type { PaginationResponseType } from '@/types/_initTypes';
import type { NotificationPreferenceType, NotificationType } from '@/types/gestionMagasinTypes';

export const notificationApi = createApi({
	reducerPath: 'notificationApi',
	tagTypes: ['Notification', 'NotificationPreference'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getNotifications: builder.query<PaginationResponseType<NotificationType>, { page?: number }>({
			query: ({ page = 1 } = {}) => ({
				url: process.env.NEXT_PUBLIC_NOTIFICATIONS,
				method: 'GET',
				params: { page },
			}),
			providesTags: ['Notification'],
		}),
		getNotificationPreferences: builder.query<NotificationPreferenceType, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_NOTIFICATION_PREFERENCES,
				method: 'GET',
			}),
			providesTags: ['NotificationPreference'],
		}),
		updateNotificationPreferences: builder.mutation<NotificationPreferenceType, Partial<NotificationPreferenceType>>({
			query: (data) => ({
				url: process.env.NEXT_PUBLIC_NOTIFICATION_PREFERENCES,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['NotificationPreference'],
		}),
		markNotificationsRead: builder.mutation<{ updated: number }, { ids?: number[] }>({
			query: (data) => ({
				url: process.env.NEXT_PUBLIC_NOTIFICATION_MARK_READ,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Notification'],
		}),
		getUnreadNotificationCount: builder.query<{ count: number }, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_NOTIFICATION_UNREAD_COUNT,
				method: 'GET',
			}),
			providesTags: ['Notification'],
		}),
	}),
});

export const {
	useGetNotificationPreferencesQuery,
	useGetNotificationsQuery,
	useLazyGetNotificationsQuery,
	useGetUnreadNotificationCountQuery,
	useMarkNotificationsReadMutation,
	useUpdateNotificationPreferencesMutation,
} = notificationApi;
