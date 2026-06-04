import { render, screen } from '@testing-library/react';
import AuthLayout from './authLayout';
import '@testing-library/jest-dom';

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

describe('AuthLayout', () => {
	it('renders children inside right box', () => {
		render(
			<AuthLayout>
				<div>Login Form</div>
			</AuthLayout>,
		);
		expect(screen.getByText('Login Form')).toBeInTheDocument();
	});

	it('renders layout with left and right sections', () => {
		render(<AuthLayout />);
		const main = screen.getByRole('main');
		expect(main).toBeInTheDocument();
		expect(main.querySelectorAll('div')).not.toHaveLength(0);
	});
});
