import { render, screen, fireEvent } from '@testing-library/react';
import CustomPasswordInput from './customPasswordInput';
import { createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

const theme = createTheme();

describe('CustomPasswordInput', () => {
	it('renders with label and placeholder', () => {
		render(
			<CustomPasswordInput
				id="password-input"
				value=""
				label="Password"
				placeholder="Enter password"
				onChange={() => {}}
				theme={theme}
			/>,
		);

		expect(screen.getByLabelText('Password')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
	});

	it('displays helper text when provided', () => {
		render(
			<CustomPasswordInput
				id="password-input"
				value=""
				label="Password"
				helperText="Must be at least 8 characters"
				onChange={() => {}}
				theme={theme}
			/>,
		);

		expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
	});

	it('renders as disabled when disabled is true', () => {
		render(
			<CustomPasswordInput id="password-input" value="" label="Password" disabled onChange={() => {}} theme={theme} />,
		);

		expect(screen.getByLabelText('Password')).toBeDisabled();
	});

	it('calls onChange when input changes', () => {
		const handleChange = jest.fn();

		render(<CustomPasswordInput id="password-input" value="" label="Password" onChange={handleChange} theme={theme} />);

		const input = screen.getByLabelText('Password');
		fireEvent.change(input, { target: { value: 'secret' } });

		expect(handleChange).toHaveBeenCalled();
	});

	it('toggles password visibility when icon is clicked', () => {
		render(
			<CustomPasswordInput id="password-input" value="secret" label="Password" onChange={() => {}} theme={theme} />,
		);

		const input = screen.getByLabelText('Password');
		expect(input).toHaveAttribute('type', 'password');

		const toggleButton = screen.getByLabelText('Afficher/masquer le mot de passe');
		fireEvent.click(toggleButton);

		expect(input).toHaveAttribute('type', 'text');
	});
});
