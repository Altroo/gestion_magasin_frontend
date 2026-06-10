import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExpensesViewClient from './expenses-view';

jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: jest.fn(() => 'mock-token'),
}));

jest.mock('@/utils/hooks', () => {
	const { translations } = jest.requireActual('@/translations');
	return {
		useToast: () => ({ onSuccess: jest.fn(), onError: jest.fn() }),
		usePermission: () => ({
			is_staff: true,
			can_view: true,
			can_print: true,
			can_create: true,
			can_edit: true,
			can_delete: true,
		}),
		useLanguage: () => ({ t: translations.fr }),
	};
});

const mockUseGetExpenseQuery = jest.fn();

jest.mock('@/store/services/magasin', () => ({
	useGetExpenseQuery: (...args: unknown[]) => mockUseGetExpenseQuery(...args),
	useDeleteExpenseMutation: jest.fn(() => [jest.fn(() => ({ unwrap: () => Promise.resolve() }))]),
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => {
	const Mock = ({ children }: { children: React.ReactNode }) => <div data-testid="navigation-bar">{children}</div>;
	Mock.displayName = 'NavigationBar';
	return { __esModule: true, default: Mock };
});

jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => {
	const Mock = () => <div data-testid="api-progress" />;
	Mock.displayName = 'ApiProgress';
	return { __esModule: true, default: Mock };
});

jest.mock('@/components/formikElements/apiLoading/apiAlert/apiAlert', () => {
	const Mock = () => <div data-testid="api-alert" />;
	Mock.displayName = 'ApiAlert';
	return { __esModule: true, default: Mock };
});

jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => {
	const Mock = () => <div data-testid="action-modal" />;
	Mock.displayName = 'ActionModals';
	return { __esModule: true, default: Mock };
});

describe('ExpensesViewClient', () => {
	beforeEach(() => {
		mockUseGetExpenseQuery.mockReturnValue({
			data: {
				id: 12,
				store: 3,
				store_name: 'MBR South',
				category: 4,
				category_name: 'Eau',
				label: 'Facture eau',
				amount: '250.00',
				payment_status: 'paid',
				payment_mode: 'cash',
				payment_mode_name: 'Espèces',
				expense_date: '2026-06-01',
				invoice_file: '/media/expenses/invoices/facture.pdf',
				invoice_file_url: 'http://testserver/media/expenses/invoices/facture.pdf',
				note: 'Paiement du mois',
				created_by: 1,
				created_by_email: 'finance@example.com',
			},
			isLoading: false,
			error: undefined,
		});
	});

	it('renders the joined facture as a link on the expense view page', () => {
		render(<ExpensesViewClient id={12} />);

		const invoiceLink = screen.getByRole('link', { name: /facture/i });

		expect(invoiceLink).toBeInTheDocument();
		expect(invoiceLink).toHaveAttribute('href', 'http://testserver/media/expenses/invoices/facture.pdf');
		expect(invoiceLink).toHaveAttribute('target', '_blank');
	});
});
