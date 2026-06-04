import { render, screen, fireEvent } from '@testing-library/react';
import CustomOutlinedText from './customOutlinedText';
import { createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';

const theme = createTheme();

describe('CustomOutlinedText', () => {
	it('renders with label and placeholder', () => {
		render(
			<CustomOutlinedText
				id="test-input"
				type="text"
				value=""
				label="Test Label"
				placeholder="Enter text"
				theme={theme}
			/>,
		);

		expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
	});

	it('displays helper text when provided', () => {
		render(
			<CustomOutlinedText
				id="test-input"
				type="text"
				value=""
				label="Test Label"
				helperText="This is a helper"
				theme={theme}
			/>,
		);

		expect(screen.getByText('This is a helper')).toBeInTheDocument();
	});

	it('renders as disabled when disabled is true', () => {
		render(<CustomOutlinedText id="test-input" type="text" value="" label="Test Label" disabled theme={theme} />);

		expect(screen.getByLabelText('Test Label')).toBeDisabled();
	});

	it('calls onChange when input changes', () => {
		const handleChange = jest.fn();

		render(
			<CustomOutlinedText
				id="test-input"
				type="text"
				value=""
				label="Test Label"
				onChange={handleChange}
				theme={theme}
			/>,
		);

		const input = screen.getByLabelText('Test Label');
		fireEvent.change(input, { target: { value: 'Hello' } });

		expect(handleChange).toHaveBeenCalled();
	});

	it('renders with error state when error is true', () => {
		render(
			<CustomOutlinedText
				id="test-input"
				type="text"
				value=""
				label="Test Label"
				error
				helperText="Error occurred"
				theme={theme}
			/>,
		);

		expect(screen.getByText('Error occurred')).toBeInTheDocument();
		expect(screen.getByLabelText('Test Label')).toHaveAttribute('aria-invalid', 'true');
	});
});
