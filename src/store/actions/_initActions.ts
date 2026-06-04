import * as types from './index';
import type { Session } from 'next-auth';

export const initAppAction = () => ({
	type: types.INIT_APP,
});

export const initAppSessionTokensAction = (session: Session) => ({
	type: types.INIT_APP_SESSION_TOKENS,
	session,
});

export const refreshAppTokenStatesAction = (session: Session) => ({
	type: types.REFRESH_APP_TOKEN_STATES,
	session,
});
