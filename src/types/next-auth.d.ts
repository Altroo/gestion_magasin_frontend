import type { ProviderType } from 'next-auth/providers';

declare module 'next-auth' {
	interface Session {
		user: tokenUser;
		accessToken: string;
		refreshToken: string;
		accessTokenExpiration: string;
		refreshTokenExpiration: string;
		expires: string;
	}

	interface User {
		id: string;
		name: string;
		email: string;
		image?: string | null;
		user: tokenUser;
		access: string;
		refresh: string;
		access_expiration: string;
		refresh_expiration: string;
	}

	interface Account {
		providerAccountId: string | undefined;
		type: ProviderType;
		provider: string;
		user: tokenUser;
		access: string;
		refresh: string;
		access_expiration: string;
		refresh_expiration: string;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		user: tokenUser;
		access: string;
		refresh: string;
		access_expiration: string;
		refresh_expiration: string;
	}
}

export type tokenUser = {
	id: string;
	pk: number;
	email: string;
	emailVerified: Date | null;
	name: string;
	first_name: string;
	last_name: string;
	image?: string | null;
};
