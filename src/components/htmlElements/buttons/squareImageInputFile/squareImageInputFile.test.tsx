import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SquareImageInputFile from './squareImageInputFile';
import '@testing-library/jest-dom';

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

jest.mock('@mui/icons-material/Add', () => {
	type AddIconProps = React.SVGProps<SVGSVGElement> & {
		color?: 'inherit' | 'primary' | 'secondary' | 'action' | 'error' | 'disabled';
		sx?: Record<string, unknown> | undefined;
	};

	return {
		__esModule: true,
		default: (props: AddIconProps) => {
			const { className } = props;
			const svgProps: React.SVGProps<SVGSVGElement> = {};
			if (className) svgProps.className = className;
			return React.createElement('svg', svgProps);
		},
	};
});

describe('SquareImageInputFile', () => {
	const mockUpload = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders button with label text', () => {
		render(<SquareImageInputFile onImageUpload={mockUpload} />);
		expect(screen.getByText('Ajouter une image')).toBeInTheDocument();
	});

	it('calls onImageUpload when button is clicked', () => {
		render(<SquareImageInputFile onImageUpload={mockUpload} />);
		fireEvent.click(screen.getByRole('button'));
		expect(mockUpload).toHaveBeenCalled();
	});
});
