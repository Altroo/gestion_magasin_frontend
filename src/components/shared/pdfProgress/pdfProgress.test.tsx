import { act, render, screen } from '@testing-library/react';
import PdfProgress from './pdfProgress';

let mockPending = 0;
const mockListeners = new Set<() => void>();
jest.mock('@/utils/apiHelpers', () => ({
	subscribePdfRequests: (listener: () => void) => {
		mockListeners.add(listener);
		return () => mockListeners.delete(listener);
	},
	getPendingPdfRequests: () => mockPending,
	getServerPendingPdfRequests: () => 0,
}));

it('shows loading while any PDF is preparing and clears it when all requests finish', () => {
	const { unmount } = render(<PdfProgress />);
	expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
	act(() => {
		mockPending = 2;
		mockListeners.forEach((listener) => listener());
	});
	expect(screen.getByRole('progressbar')).toBeVisible();
	act(() => {
		mockPending = 1;
		mockListeners.forEach((listener) => listener());
	});
	expect(screen.getByRole('progressbar')).toBeVisible();
	act(() => {
		mockPending = 0;
		mockListeners.forEach((listener) => listener());
	});
	expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
	unmount();
	expect(mockListeners.size).toBe(0);
});
