import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Desktop, TabletAndMobile } from './clientHelpers';

// Control `useIsClient` and `useMediaQuery` via mocks
let mockIsClient = true;
let mockIsDesktop = true;
let mockIsTabletMobile = false;

jest.mock('@/utils/hooks', () => ({
	useIsClient: () => mockIsClient,
}));

jest.mock('@mui/material/styles', () => ({
	useTheme: () => ({
		breakpoints: {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			up: (_bp: string) => '(min-width:992px)',
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			down: (_bp: string) => '(max-width:991px)',
		},
	}),
}));

jest.mock('@mui/material/useMediaQuery', () => ({
	__esModule: true,
	default: (query: string) => {
		if (query === '(min-width:992px)') return mockIsDesktop;
		if (query === '(max-width:991px)') return mockIsTabletMobile;
		return false;
	},
}));

describe('Desktop', () => {
	beforeEach(() => {
		mockIsClient = true;
		mockIsDesktop = true;
	});

	it('renders children when isClient and isDesktop are true', () => {
		render(<Desktop><span>desktop-content</span></Desktop>);
		expect(screen.getByText('desktop-content')).toBeInTheDocument();
	});

	it('renders nothing when not desktop (mobile viewport)', () => {
		mockIsDesktop = false;
		render(<Desktop><span>desktop-content</span></Desktop>);
		expect(screen.queryByText('desktop-content')).not.toBeInTheDocument();
	});

	it('renders null when not client-side (SSR)', () => {
		mockIsClient = false;
		render(<Desktop><span>ssr-content</span></Desktop>);
		expect(screen.queryByText('ssr-content')).not.toBeInTheDocument();
	});
});

describe('TabletAndMobile', () => {
	beforeEach(() => {
		mockIsClient = true;
		mockIsTabletMobile = true;
	});

	it('renders children when isClient and isTabletMobile are true', () => {
		render(<TabletAndMobile><span>mobile-content</span></TabletAndMobile>);
		expect(screen.getByText('mobile-content')).toBeInTheDocument();
	});

	it('renders nothing on desktop (tablet/mobile check false)', () => {
		mockIsTabletMobile = false;
		render(<TabletAndMobile><span>mobile-content</span></TabletAndMobile>);
		expect(screen.queryByText('mobile-content')).not.toBeInTheDocument();
	});

	it('renders null when not client-side (SSR)', () => {
		mockIsClient = false;
		render(<TabletAndMobile><span>ssr-content</span></TabletAndMobile>);
		expect(screen.queryByText('ssr-content')).not.toBeInTheDocument();
	});
});
