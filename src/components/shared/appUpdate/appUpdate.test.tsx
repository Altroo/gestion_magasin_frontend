import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppUpdate from './appUpdate';
import { useAppSelector } from '@/utils/hooks';
import { getAppUpdateUrl, reloadApp } from '@/utils/updateApp';

const mockOnError = jest.fn();

jest.mock('@/utils/hooks', () => ({
	useAppSelector: jest.fn(),
	useLanguage: () => ({ t: jest.requireActual('@/translations/fr').fr }),
	useToast: () => ({ onError: mockOnError }),
}));
jest.mock('@/utils/updateApp', () => ({
	APP_UPDATE_PARAM: '_app_update',
	getAppUpdateUrl: jest.fn(),
	reloadApp: jest.fn(),
}));

const state = { localVersion: '1.0.0', serverVersion: '1.1.0', maintenance: false };
beforeEach(() => {
	jest.clearAllMocks();
	jest.mocked(useAppSelector).mockReturnValue(state);
});

it.each([null, '1.0.0', '0.9.9', 'invalid'])('hides the prompt for server version %s', (serverVersion) => {
	jest.mocked(useAppSelector).mockReturnValue({ ...state, serverVersion });
	render(<AppUpdate />);
	expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('does not compete with the maintenance screen', () => {
	jest.mocked(useAppSelector).mockReturnValue({ ...state, maintenance: true });
	render(<AppUpdate />);
	expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('defers this version without reloading, but shows a newer announcement', async () => {
	const user = userEvent.setup();
	const { rerender } = render(<AppUpdate />);
	await user.click(screen.getByRole('button', { name: 'Plus tard' }));
	expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	expect(reloadApp).not.toHaveBeenCalled();
	jest.mocked(useAppSelector).mockReturnValue({ ...state, serverVersion: '1.2.0' });
	rerender(<AppUpdate />);
	expect(screen.getByRole('dialog')).toBeInTheDocument();
});
it('reloads only after explicit confirmation and a successful availability check', async () => {
	jest.mocked(getAppUpdateUrl).mockResolvedValue('http://localhost/dashboard/board?_app_update=1.1.0-123');
	render(<AppUpdate />);
	expect(getAppUpdateUrl).not.toHaveBeenCalled();
	await userEvent.click(screen.getByRole('button', { name: 'Mettre à jour' }));
	expect(reloadApp).toHaveBeenCalledWith('http://localhost/dashboard/board?_app_update=1.1.0-123');
});
it('shows a retryable error without reloading when the release is unavailable', async () => {
	jest.mocked(getAppUpdateUrl).mockRejectedValue(new Error('offline'));
	render(<AppUpdate />);
	await userEvent.click(screen.getByRole('button', { name: 'Mettre à jour' }));
	expect(mockOnError).toHaveBeenCalledWith(expect.stringContaining('Vérifiez votre connexion'));
	expect(reloadApp).not.toHaveBeenCalled();
	expect(screen.getByRole('button', { name: 'Mettre à jour' })).toBeEnabled();
});
it('does not reload if maintenance starts during the availability check', async () => {
	let resolve!: (url: string) => void;
	jest.mocked(getAppUpdateUrl).mockReturnValue(
		new Promise((r) => {
			resolve = r;
		}),
	);
	const { rerender } = render(<AppUpdate />);
	await userEvent.click(screen.getByRole('button', { name: 'Mettre à jour' }));
	expect(screen.getByRole('button', { name: 'Mise à jour…' })).toBeDisabled();
	jest.mocked(useAppSelector).mockReturnValue({ ...state, maintenance: true });
	rerender(<AppUpdate />);
	await act(async () => resolve('http://localhost/'));
	expect(reloadApp).not.toHaveBeenCalled();
	expect(mockOnError).toHaveBeenCalledWith(expect.stringContaining('La mise à jour'));
});
it('cleans the update marker only after loading a sufficiently new bundle', () => {
	window.history.replaceState({}, '', '/dashboard/board?project=2&_app_update=1.1.0-123#card');
	const { rerender } = render(<AppUpdate />);
	expect(window.location.search).toContain('_app_update');
	jest.mocked(useAppSelector).mockReturnValue({ ...state, localVersion: '1.1.0' });
	rerender(<AppUpdate />);
	expect(window.location.search).toBe('?project=2');
	expect(window.location.hash).toBe('#card');
	window.history.replaceState({}, '', '/');
});
