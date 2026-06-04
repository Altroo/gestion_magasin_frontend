import { render, screen, fireEvent } from '@testing-library/react';
import TextButton from './textButton';
import '@testing-library/jest-dom';

describe('TextButton', () => {
	const mockClick = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders button with correct text', () => {
		render(<TextButton buttonText="Click Me" />);
		expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
	});

	it('calls onClick when button is clicked', () => {
		render(<TextButton buttonText="Click Me" onClick={mockClick} />);
		fireEvent.click(screen.getByRole('button', { name: 'Click Me' }));
		expect(mockClick).toHaveBeenCalled();
	});

	it('renders as disabled when disabled is true', () => {
		render(<TextButton buttonText="Click Me" disabled />);
		expect(screen.getByRole('button', { name: 'Click Me' })).toBeDisabled();
	});

	it('applies custom class when cssClass is provided', () => {
		render(<TextButton buttonText="Click Me" cssClass="custom-class" />);
		const button = screen.getByRole('button', { name: 'Click Me' });
		expect(button.className).toMatch(/custom-class/);
	});
});
