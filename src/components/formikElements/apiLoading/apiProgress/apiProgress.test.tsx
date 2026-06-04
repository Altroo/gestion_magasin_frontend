import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApiProgress from './apiProgress';

test('renders Backdrop and CircularProgress with the supplied colors', () => {
	const backdropColor = '#123456';
	const circularColor = '#abcdef';

	const { container } = render(<ApiProgress backdropColor={backdropColor} circularColor={circularColor} />);

	// Backdrop
	const backdrop = container.querySelector('.MuiBackdrop-root');
	expect(backdrop).toBeInTheDocument();
	expect(backdrop).toHaveStyle(`background-color: ${backdropColor}`);

	// CircularProgress
	const circular = container.querySelector('.MuiCircularProgress-root');
	expect(circular).toBeInTheDocument();
	expect(circular).toHaveStyle(`color: ${circularColor}`);
});
