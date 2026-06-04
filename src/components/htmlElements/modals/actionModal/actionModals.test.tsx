import { render, screen, fireEvent } from '@testing-library/react';
import ActionModals from './actionModals';
import '@testing-library/jest-dom';

describe('ActionModals', () => {
	const mockAction1 = jest.fn();
	const mockAction2 = jest.fn();

	const actions = [
		{ text: 'Cancel', active: false, onClick: mockAction1 },
		{ text: 'Confirm', active: true, onClick: mockAction2 },
	];

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders modal with title and body', () => {
		render(<ActionModals title="Delete Item" body="Are you sure?" actions={actions} />);
		expect(screen.getByText('Delete Item')).toBeInTheDocument();
		expect(screen.getByText('Are you sure?')).toBeInTheDocument();
	});

	it('renders all action buttons with correct labels', () => {
		render(<ActionModals title="Confirm" actions={actions} />);
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
	});

	it('calls correct action handlers on button clicks', () => {
		render(<ActionModals title="Confirm" actions={actions} />);
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
		expect(mockAction1).toHaveBeenCalled();
		expect(mockAction2).toHaveBeenCalled();
	});

	it('renders children inside content area', () => {
		render(
			<ActionModals title="With Children" actions={actions}>
				<div>Extra Content</div>
			</ActionModals>,
		);
		expect(screen.getByText('Extra Content')).toBeInTheDocument();
	});
});
