import { createApi } from '@reduxjs/toolkit/query/react';
import { allowAnyInstance, isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import type { ApiErrorResponseType, PaginationResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { RootState } from '@/store/store';
import { getInitStateToken } from '@/store/selectors';
import type { UserClass } from '@/models/classes';
import type { EditProfilResponse, PasswordResetResponse } from '@/types/accountTypes';
import { initToken } from '@/store/slices/_initSlice';
import type { StoreRoleCode } from '@/types/gestionMagasinTypes';

type UserMutationPayload = Partial<Omit<UserClass, 'stores'>> & {
	stores?: Array<{ store_id: number; role: StoreRoleCode }>;
};

// ─── Public endpoints (login / password reset) ───────────────────────────────
export const accountApi = createApi({
	reducerPath: 'accountApi',
	baseQuery: axiosBaseQuery(() => allowAnyInstance()),
	endpoints: (builder) => ({
		sendPasswordResetCode: builder.mutation<void | ApiErrorResponseType, { email: string }>({
			query: (payload) => ({
				url: process.env.NEXT_PUBLIC_ACCOUNT_SEND_PASSWORD_RESET,
				method: 'POST',
				data: payload,
			}),
		}),
		passwordReset: builder.mutation<void | ApiErrorResponseType, { email: string; code: string }>({
			query: (payload) => ({
				url: `${process.env.NEXT_PUBLIC_ACCOUNT_PASSWORD_RESET}${payload.email}/${payload.code}/`,
				method: 'GET',
			}),
		}),
		setPassword: builder.mutation<
			void | ApiErrorResponseType,
			{ email: string; code: string; new_password: string; new_password2: string }
		>({
			query: (payload) => ({
				url: process.env.NEXT_PUBLIC_ACCOUNT_PASSWORD_RESET,
				method: 'PUT',
				data: payload,
			}),
		}),
	}),
});

// ─── Profile endpoints (authenticated) ──────────────────────────────────────
export const profilApi = createApi({
	reducerPath: 'profilApi',
	tagTypes: ['Profil'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getProfil: builder.query<UserClass, void>({
			query: () => ({ url: process.env.NEXT_PUBLIC_ACCOUNT_PROFIL, method: 'GET' }),
			providesTags: ['Profil'],
		}),
		editProfil: builder.mutation<UserClass, EditProfilResponse>({
			query: ({ data }) => ({ url: process.env.NEXT_PUBLIC_ACCOUNT_PROFIL, method: 'PATCH', data }),
			invalidatesTags: ['Profil'],
		}),
		editPassword: builder.mutation<void | ApiErrorResponseType, PasswordResetResponse>({
			query: ({ data }) => ({ url: process.env.NEXT_PUBLIC_ACCOUNT_PASSWORD_CHANGE, method: 'PUT', data }),
			invalidatesTags: ['Profil'],
		}),
	}),
});

// ─── Users management (staff only) ──────────────────────────────────────────
export const usersApi = createApi({
	reducerPath: 'usersApi',
	tagTypes: ['Users'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getUsersList: builder.query<
			SuccessResponseType<Array<Partial<UserClass>>> | PaginationResponseType<Partial<UserClass>>,
			{ with_pagination?: boolean; page?: number; pageSize?: number; search?: string; [key: string]: string | number | boolean | undefined }
		>({
			query: ({ with_pagination, page, pageSize, search, ...rest }) => ({
				url: process.env.NEXT_PUBLIC_USERS_ROOT,
				method: 'GET',
				params: {
					pagination: with_pagination || undefined,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
					...rest,
				},
			}),
			providesTags: ['Users'],
		}),
		getUser: builder.query<UserClass, { id: number }>({
			query: ({ id }) => ({ url: `${process.env.NEXT_PUBLIC_USERS_ROOT}${id}/`, method: 'GET' }),
			providesTags: ['Users'],
		}),
		checkEmail: builder.mutation<void | ApiErrorResponseType, { email: string }>({
			query: ({ email }) => ({
				url: process.env.NEXT_PUBLIC_ACCOUNT_CHECK_EMAIL,
				method: 'POST',
				data: { email },
			}),
			invalidatesTags: ['Users'],
		}),
		addUser: builder.mutation<UserClass, { data: UserMutationPayload }>({
			query: ({ data }) => ({ url: process.env.NEXT_PUBLIC_USERS_ROOT, method: 'POST', data }),
			invalidatesTags: ['Users'],
		}),
		editUser: builder.mutation<UserClass, { id: number; data: UserMutationPayload }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_USERS_ROOT}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Users'],
		}),
		deleteUser: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_USERS_ROOT}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Users'],
		}),
		bulkDeleteUsers: builder.mutation<void | ApiErrorResponseType, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_USERS_ROOT}bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Users'],
		}),
	}),
});

export const { useSendPasswordResetCodeMutation, usePasswordResetMutation, useSetPasswordMutation } = accountApi;
export const { useGetProfilQuery, useEditProfilMutation, useEditPasswordMutation } = profilApi;
export const {
	useGetUsersListQuery,
	useDeleteUserMutation,
	useEditUserMutation,
	useGetUserQuery,
	useAddUserMutation,
	useCheckEmailMutation,
	useBulkDeleteUsersMutation,
} = usersApi;
