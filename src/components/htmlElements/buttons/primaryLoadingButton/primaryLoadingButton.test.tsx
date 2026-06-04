import { render, screen, fireEvent } from '@testing-library/react';
import PrimaryLoadingButton from './primaryLoadingButton';
import '@testing-library/jest-dom';

describe('PrimaryLoadingButton', () => {
	const mockClick = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders button with correct text', () => {
		render(<PrimaryLoadingButton buttonText="Load" loading={false} active={true} />);
		expect(screen.getByRole('button', { name: 'Load' })).toBeInTheDocument();
	});

	it('renders as disabled when active is false', () => {
		render(<PrimaryLoadingButton buttonText="Load" loading={false} active={false} />);
		expect(screen.getByRole('button', { name: 'Load' })).toBeDisabled();
	});

	it('calls onClick when button is clicked and active is true', () => {
		render(<PrimaryLoadingButton buttonText="Load" loading={false} active={true} onClick={mockClick} />);
		fireEvent.click(screen.getByRole('button', { name: 'Load' }));
		expect(mockClick).toHaveBeenCalled();
	});

	it('does not call onClick when button is disabled', () => {
		render(<PrimaryLoadingButton buttonText="Load" loading={false} active={false} onClick={mockClick} />);
		fireEvent.click(screen.getByRole('button', { name: 'Load' }));
		expect(mockClick).not.toHaveBeenCalled();
	});

	it('applies custom class when cssClass is provided', () => {
		render(<PrimaryLoadingButton buttonText="Load" loading={false} active={true} cssClass="custom-class" />);
		const button = screen.getByRole('button', { name: 'Load' });
		expect(button.className).toMatch(/custom-class/);
	});
});
