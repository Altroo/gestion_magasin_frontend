import '@testing-library/jest-dom';
import { TextEncoder } from 'util';

// --- Mock next-auth ---
jest.mock('next-auth/react', () => ({
	useSession: jest.fn(() => ({
		data: null,
		status: 'unauthenticated',
	})),
	signIn: jest.fn(),
	signOut: jest.fn(),
}));

// --- Mock MUI TouchRipple ---
jest.mock('@mui/material/ButtonBase/TouchRipple', () => {
	return {
		__esModule: true,
		default: () => null,
	};
});

// --- TextEncoder polyfill ---
global.TextEncoder = TextEncoder;
