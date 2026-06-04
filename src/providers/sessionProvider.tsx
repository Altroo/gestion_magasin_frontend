'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { ComponentProps } from 'react';

// Proactively refresh the session every 4 minutes so the JWT callback
// runs before the 15-minute access token expires and keeps Redux in sync.
const REFETCH_INTERVAL = 4 * 60; // seconds

const SessionProvider = (props: ComponentProps<typeof NextAuthSessionProvider>) => (
	<NextAuthSessionProvider {...props} refetchInterval={REFETCH_INTERVAL} refetchOnWindowFocus={true} />
);

export default SessionProvider;
