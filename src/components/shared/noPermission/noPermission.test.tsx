import React from 'react';
import { render, screen } from '@testing-library/react';
import NoPermission from './noPermission';

describe('NoPermission', () => {
	test('renders access denied title', () => {
		render(<NoPermission />);
		expect(screen.getByText('Accès Refusé')).toBeInTheDocument();
	});

	test('renders description message', () => {
		render(<NoPermission />);
		expect(
			screen.getByText(
				/Vous n'avez pas la permission d'accéder à cette page. Veuillez contacter un administrateur si vous pensez qu'il s'agit d'une erreur./,
			),
		).toBeInTheDocument();
	});

	test('renders lock icon', () => {
		render(<NoPermission />);
		const icon = document.querySelector('[data-testid="LockIcon"]');
		expect(icon).toBeInTheDocument();
	});

	test('renders Paper component with elevation', () => {
		const { container } = render(<NoPermission />);
		const paper = container.querySelector('.MuiPaper-elevation3');
		expect(paper).toBeInTheDocument();
	});

	test('applies correct styling to container Box', () => {
		const { container } = render(<NoPermission />);
		const box = container.firstChild as HTMLElement;
		expect(box).toHaveStyle({
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
		});
	});

	test('renders with proper semantic structure', () => {
		const { container } = render(<NoPermission />);

		const heading = screen.getByRole('heading', { level: 5 });
		expect(heading).toHaveTextContent('Accès Refusé');

		expect(container.querySelector('.MuiBox-root')).toBeInTheDocument();
		expect(container.querySelector('.MuiPaper-root')).toBeInTheDocument();
		expect(container.querySelector('.MuiTypography-root')).toBeInTheDocument();
	});

	test('renders all Typography components', () => {
		const { container } = render(<NoPermission />);
		const typographyElements = container.querySelectorAll('.MuiTypography-root');

		expect(typographyElements.length).toBeGreaterThanOrEqual(2);
	});
});
