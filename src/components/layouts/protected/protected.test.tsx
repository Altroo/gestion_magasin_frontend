import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Protected } from './protected';
import { usePermission, useAppSelector } from '@/utils/hooks';

// 🧩 Mock hooks module
jest.mock('@/utils/hooks', () => ({
	usePermission: jest.fn(),
	useAppSelector: jest.fn(),
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

describe('Protected component', () => {
	it('renders children when is_staff is true (default permission)', () => {
		(useAppSelector as jest.Mock).mockReturnValue({ id: 1 });
		(usePermission as jest.Mock).mockReturnValue({
			is_staff: true,
			can_view: false,
			can_print: false,
			can_create: false,
			can_edit: false,
			can_delete: false,
		});

		render(
			<Protected>
				<div>Secret Content</div>
			</Protected>,
		);

		expect(screen.getByText('Secret Content')).toBeInTheDocument();
		expect(screen.queryByText('Accès Refusé')).not.toBeInTheDocument();
	});

	it('renders access denied message when is_staff is false (default permission)', () => {
		(useAppSelector as jest.Mock).mockReturnValue({ id: 1 });
		(usePermission as jest.Mock).mockReturnValue({
			is_staff: false,
			can_view: false,
			can_print: false,
			can_create: false,
			can_edit: false,
			can_delete: false,
		});

		render(
			<Protected>
				<div>Secret Content</div>
			</Protected>,
		);

		expect(screen.getByText('Accès Refusé')).toBeInTheDocument();
		expect(screen.getByText(/Vous n'avez pas la permission d'accéder à cette page/i)).toBeInTheDocument();
		expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
	});

	it('renders children when specific permission is granted', () => {
		(useAppSelector as jest.Mock).mockReturnValue({ id: 1 });
		(usePermission as jest.Mock).mockReturnValue({
			is_staff: false,
			can_view: true,
			can_print: false,
			can_create: false,
			can_edit: false,
			can_delete: false,
		});

		render(
			<Protected permission="can_view">
				<div>Viewable Content</div>
			</Protected>,
		);

		expect(screen.getByText('Viewable Content')).toBeInTheDocument();
		expect(screen.queryByText('Accès Refusé')).not.toBeInTheDocument();
	});

	it('renders access denied when specific permission is not granted', () => {
		(useAppSelector as jest.Mock).mockReturnValue({ id: 1 });
		(usePermission as jest.Mock).mockReturnValue({
			is_staff: false,
			can_view: false,
			can_print: false,
			can_create: false,
			can_edit: false,
			can_delete: false,
		});

		render(
			<Protected permission="can_edit">
				<div>Editable Content</div>
			</Protected>,
		);

		expect(screen.getByText('Accès Refusé')).toBeInTheDocument();
		expect(screen.queryByText('Editable Content')).not.toBeInTheDocument();
	});
});
