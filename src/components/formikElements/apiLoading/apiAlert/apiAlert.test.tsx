import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApiAlert from './apiAlert';
import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

describe('ApiAlert', () => {
	it('renders error messages when errorDetails contains an "error" array', () => {
		const errorDetails = { error: ['Invalid request', 'Missing fields'] };

		render(<ApiAlert errorDetails={errorDetails} />);

		// whole string is concatenated
		expect(screen.getByText('error : Invalid request,Missing fields')).toBeInTheDocument();

		const alert = screen.getByRole('alert');
		expect(alert).toHaveTextContent(/Invalid request/);
		expect(alert).toHaveTextContent(/Missing fields/);
	});

	it('applies custom sx style to the Alert component', () => {
		const customStyle: SxProps<Theme> = { backgroundColor: 'rgb(255, 0, 0)' };
		const errorDetails = { error: ['Something went wrong'] };

		const { container } = render(<ApiAlert errorDetails={errorDetails} cssStyle={customStyle} />);

		const alert = container.querySelector('.MuiAlert-root');
		expect(alert).toBeInTheDocument();
		expect(alert).toHaveStyle('background-color: rgb(255, 0, 0)');
	});

	it('renders default message when errorDetails is null or undefined', () => {
		const { container } = render(<ApiAlert />);

		const alert = container.querySelector('.MuiAlert-root');
		expect(alert).toBeInTheDocument();

		// The message part should contain the default fallback text
		const message = container.querySelector('.MuiAlert-message');
		expect(message).toBeInTheDocument();
		expect(message).toHaveTextContent('Une erreur est survenue. Veuillez réessayer.');
	});

	it('handles errorDetails with non-array string values', () => {
		const errorDetails = { field1: 'Error message 1', field2: 'Error message 2' } as unknown as Record<
			string,
			string[]
		>;

		render(<ApiAlert errorDetails={errorDetails} />);

		const alert = screen.getByRole('alert');
		expect(alert).toHaveTextContent(/field1/);
		expect(alert).toHaveTextContent(/Error message 1/);
	});

	it('handles errorDetails with mixed array and object values', () => {
		const errorDetails: Record<string, string[]> = {
			username: ['Username is required', 'Username must be unique'],
		};

		render(<ApiAlert errorDetails={errorDetails} />);

		const alert = screen.getByRole('alert');
		expect(alert).toHaveTextContent(/username/);
		expect(alert).toHaveTextContent(/Username is required/);
		expect(alert).toHaveTextContent(/Username must be unique/);
	});
});
