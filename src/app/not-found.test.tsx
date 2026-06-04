import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
		back: mockBack,
		forward: jest.fn(),
		refresh: jest.fn(),
		replace: jest.fn(),
		prefetch: jest.fn(),
	}),
}));

jest.mock('@/utils/routes', () => ({
	DASHBOARD: '/dashboard',
}));

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

import NotFound from './not-found';

describe('NotFound (404 page)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders the 404 text', () => {
		render(<NotFound />);
		expect(screen.getByText('404')).toBeInTheDocument();
	});

	it('renders "Page introuvable" heading', () => {
		render(<NotFound />);
		expect(screen.getByText('Page introuvable')).toBeInTheDocument();
	});

	it('renders the description text', () => {
		render(<NotFound />);
		expect(screen.getByText(/la page que vous cherchez/i)).toBeInTheDocument();
	});

	it('renders Retour button', () => {
		render(<NotFound />);
		expect(screen.getByText('Retour')).toBeInTheDocument();
	});

	it('renders "Tableau de bord" button', () => {
		render(<NotFound />);
		expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
	});

	it('calls router.back() when Retour is clicked', () => {
		render(<NotFound />);
		fireEvent.click(screen.getByText('Retour'));
		expect(mockBack).toHaveBeenCalledTimes(1);
	});

	it('calls router.push(DASHBOARD) when Tableau de bord is clicked', () => {
		render(<NotFound />);
		fireEvent.click(screen.getByText('Tableau de bord'));
		expect(mockPush).toHaveBeenCalledWith('/dashboard');
	});
});
