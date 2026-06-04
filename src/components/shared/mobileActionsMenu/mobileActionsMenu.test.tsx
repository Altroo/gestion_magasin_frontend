import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileActionsMenu from './mobileActionsMenu';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import '@testing-library/jest-dom';

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

// Mock useMediaQuery
let mockIsMobile = false;
jest.mock('@mui/material', () => {
	const actual = jest.requireActual('@mui/material');
	return {
		...actual,
		useMediaQuery: () => mockIsMobile,
	};
});

describe('MobileActionsMenu', () => {
	const mockOnClick1 = jest.fn();
	const mockOnClick2 = jest.fn();
	const mockOnClick3 = jest.fn();

	const defaultActions = [
		{
			label: 'View',
			icon: <VisibilityIcon />,
			onClick: mockOnClick1,
			color: 'info' as const,
		},
		{
			label: 'Edit',
			icon: <EditIcon />,
			onClick: mockOnClick2,
			color: 'primary' as const,
		},
		{
			label: 'Delete',
			icon: <DeleteIcon />,
			onClick: mockOnClick3,
			color: 'error' as const,
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();
		mockIsMobile = false;
	});

	describe('Desktop View', () => {
		it('renders individual icon buttons on desktop', () => {
			render(<MobileActionsMenu actions={defaultActions} />);

			// Should have all three icon buttons
			const buttons = screen.getAllByRole('button');
			expect(buttons).toHaveLength(3);

			// Should have aria-labels for accessibility
			expect(screen.getByLabelText('View')).toBeInTheDocument();
			expect(screen.getByLabelText('Edit')).toBeInTheDocument();
			expect(screen.getByLabelText('Delete')).toBeInTheDocument();
		});

		it('calls onClick handlers when buttons are clicked on desktop', async () => {
			render(<MobileActionsMenu actions={defaultActions} />);

			const viewBtn = screen.getByLabelText('View');
			const editBtn = screen.getByLabelText('Edit');
			const deleteBtn = screen.getByLabelText('Delete');

			await userEvent.click(viewBtn);
			expect(mockOnClick1).toHaveBeenCalledTimes(1);

			await userEvent.click(editBtn);
			expect(mockOnClick2).toHaveBeenCalledTimes(1);

			await userEvent.click(deleteBtn);
			expect(mockOnClick3).toHaveBeenCalledTimes(1);
		});

		it('filters actions based on show property on desktop', () => {
			const actionsWithShow = [
				...defaultActions,
				{
					label: 'Hidden Action',
					icon: <EditIcon />,
					onClick: jest.fn(),
					color: 'success' as const,
					show: false,
				},
			];

			render(<MobileActionsMenu actions={actionsWithShow} />);

			// Should only have 3 buttons (hidden action not rendered)
			const buttons = screen.getAllByRole('button');
			expect(buttons).toHaveLength(3);
			expect(screen.queryByLabelText('Hidden Action')).not.toBeInTheDocument();
		});
	});

	describe('Mobile View', () => {
		beforeEach(() => {
			mockIsMobile = true;
		});

		it('renders a three-dot menu button on mobile', () => {
			render(<MobileActionsMenu actions={defaultActions} />);

			// Should have only one button (the menu button)
			const buttons = screen.getAllByRole('button');
			expect(buttons).toHaveLength(1);
			expect(screen.getByLabelText("Plus d'actions")).toBeInTheDocument();
		});

		it('opens menu when three-dot button is clicked on mobile', async () => {
			render(<MobileActionsMenu actions={defaultActions} />);

			const menuButton = screen.getByLabelText("Plus d'actions");
			await userEvent.click(menuButton);

			// Menu items should be visible
			await waitFor(() => {
				expect(screen.getByText('View')).toBeInTheDocument();
				expect(screen.getByText('Edit')).toBeInTheDocument();
				expect(screen.getByText('Delete')).toBeInTheDocument();
			});
		});

		it('calls onClick handler when menu item is clicked on mobile', async () => {
			render(<MobileActionsMenu actions={defaultActions} />);

			const menuButton = screen.getByLabelText("Plus d'actions");
			await userEvent.click(menuButton);

			await waitFor(() => {
				expect(screen.getByText('Edit')).toBeInTheDocument();
			});

			const editMenuItem = screen.getByText('Edit');
			await userEvent.click(editMenuItem);

			expect(mockOnClick2).toHaveBeenCalledTimes(1);
		});

		it('closes menu after clicking a menu item on mobile', async () => {
			render(<MobileActionsMenu actions={defaultActions} />);

			const menuButton = screen.getByLabelText("Plus d'actions");
			await userEvent.click(menuButton);

			await waitFor(() => {
				expect(screen.getByText('View')).toBeInTheDocument();
			});

			const viewMenuItem = screen.getByText('View');
			await userEvent.click(viewMenuItem);

			// Menu should close
			await waitFor(() => {
				expect(screen.queryByText('View')).not.toBeInTheDocument();
			});
		});

		it('filters actions based on show property on mobile', async () => {
			const actionsWithShow = [
				...defaultActions,
				{
					label: 'Hidden Action',
					icon: <EditIcon />,
					onClick: jest.fn(),
					color: 'success' as const,
					show: false,
				},
			];

			render(<MobileActionsMenu actions={actionsWithShow} />);

			const menuButton = screen.getByLabelText("Plus d'actions");
			await userEvent.click(menuButton);

			await waitFor(() => {
				expect(screen.getByText('View')).toBeInTheDocument();
			});

			// Hidden action should not be in the menu
			expect(screen.queryByText('Hidden Action')).not.toBeInTheDocument();
		});

		it('stops event propagation when clicking menu button', async () => {
			const parentClickHandler = jest.fn();
			render(
				<div onClick={parentClickHandler}>
					<MobileActionsMenu actions={defaultActions} />
				</div>,
			);

			const menuButton = screen.getByLabelText("Plus d'actions");
			await userEvent.click(menuButton);

			// Parent click handler should not be called due to stopPropagation
			expect(parentClickHandler).not.toHaveBeenCalled();
		});
	});

	describe('Empty Actions', () => {
		it('handles empty actions array on desktop', () => {
			render(<MobileActionsMenu actions={[]} />);
			const buttons = screen.queryAllByRole('button');
			expect(buttons).toHaveLength(0);
		});

		it('handles empty actions array on mobile', () => {
			mockIsMobile = true;
			render(<MobileActionsMenu actions={[]} />);

			// Should still show menu button
			const menuButton = screen.getByLabelText("Plus d'actions");
			expect(menuButton).toBeInTheDocument();
		});
	});
});
