import { render, screen, fireEvent } from '@testing-library/react';
import CustomTextInput from './customTextInput';
import { createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';

const theme = createTheme();

describe('CustomTextInput', () => {
	it('renders with label and placeholder', () => {
		render(
			<CustomTextInput
				id="custom-input"
				type="text"
				value=""
				label="Username"
				placeholder="Enter username"
				onChange={() => {}}
				theme={theme}
			/>,
		);

		expect(screen.getByLabelText('Username')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
	});

	it('displays helper text when provided', () => {
		render(
			<CustomTextInput
				id="custom-input"
				type="text"
				value=""
				label="Username"
				helperText="Required field"
				onChange={() => {}}
				theme={theme}
			/>,
		);

		expect(screen.getByText('Required field')).toBeInTheDocument();
	});

	it('renders as disabled when disabled is true', () => {
		render(
			<CustomTextInput
				id="custom-input"
				type="text"
				value=""
				label="Username"
				disabled
				onChange={() => {}}
				theme={theme}
			/>,
		);

		expect(screen.getByLabelText('Username')).toBeDisabled();
	});

	it('calls onChange when input changes', () => {
		const handleChange = jest.fn();

		render(
			<CustomTextInput id="custom-input" type="text" value="" label="Username" onChange={handleChange} theme={theme} />,
		);

		const input = screen.getByLabelText('Username');
		fireEvent.change(input, { target: { value: 'Al' } });

		expect(handleChange).toHaveBeenCalled();
	});

	it('renders with error state when error is true', () => {
		render(
			<CustomTextInput
				id="custom-input"
				type="text"
				value=""
				label="Username"
				error
				helperText="Invalid input"
				onChange={() => {}}
				theme={theme}
			/>,
		);

		expect(screen.getByText('Invalid input')).toBeInTheDocument();
		expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true');
	});
});
