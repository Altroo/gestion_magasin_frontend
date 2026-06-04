import React from 'react';

jest.mock('@mui/icons-material/CheckCircleOutlined', () => {
	return {
		__esModule: true,
		default: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="CheckCircleOutlinedIcon" {...props} />,
	};
});

import { render, screen, fireEvent } from '@testing-library/react';
import CustomDropDownSelect from './customDropDownSelect';
import { createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

const theme = createTheme();

const mockItems = ['Option A', 'Option B', 'Option C'];

describe('CustomDropDownSelect', () => {
	it('renders label and options', () => {
		render(<CustomDropDownSelect id="test-select" label="Test Label" items={mockItems} theme={theme} value="" />);

		expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
	});

	it('renders selected value', () => {
		render(
			<CustomDropDownSelect id="test-select" label="Test Label" items={mockItems} theme={theme} value="Option B" />,
		);

		expect(screen.getByDisplayValue('Option B')).toBeInTheDocument();
	});

	it('calls onChange when selection changes', () => {
		const handleChange = jest.fn();

		render(
			<CustomDropDownSelect
				id="test-select"
				label="Test Label"
				items={mockItems}
				theme={theme}
				value=""
				onChange={handleChange}
			/>,
		);

		fireEvent.mouseDown(screen.getByLabelText('Test Label'));
		fireEvent.click(screen.getByText('Option B'));

		expect(handleChange).toHaveBeenCalled();
	});

	it('displays helper text when provided', () => {
		render(
			<CustomDropDownSelect
				id="test-select"
				label="Test Label"
				items={['One', 'Two']}
				theme={theme}
				value=""
				helperText="This is a helper"
			/>,
		);

		fireEvent.mouseDown(screen.getByLabelText('Test Label'));

		expect(screen.getByText((content) => content.includes('This is a helper'))).toBeInTheDocument();
	});

	it('renders disabled select when disabled is true', () => {
		render(
			<CustomDropDownSelect
				id="test-select"
				label="Test Label"
				items={['One', 'Two']}
				theme={theme}
				value=""
				disabled
			/>,
		);

		const select = screen.getByRole('combobox');
		expect(select).toHaveAttribute('aria-disabled', 'true');
	});
});
