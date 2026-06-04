import { render, screen, fireEvent } from '@testing-library/react';
import PrimaryAnchorButton from './primaryAnchorButton';
import '@testing-library/jest-dom';

describe('PrimaryAnchorButton', () => {
	const mockClick = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders button with correct text', () => {
		render(<PrimaryAnchorButton buttonText="Continue" active={true} nextPage="/next" />);

		expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
	});

	it('renders as disabled when active is false', () => {
		render(<PrimaryAnchorButton buttonText="Continue" active={false} nextPage="/next" />);

		expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
	});

	it('calls onClick when button is clicked and active is true', () => {
		render(<PrimaryAnchorButton buttonText="Continue" active={true} nextPage="/next" onClick={mockClick} />);

		fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
		expect(mockClick).toHaveBeenCalled();
	});

	it('renders link with correct href', () => {
		render(<PrimaryAnchorButton buttonText="Go" active={true} nextPage="/dashboard" />);

		const link = screen.getByRole('link');
		expect(link).toHaveAttribute('href', '/dashboard');
	});
});
