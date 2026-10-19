import { render, screen } from '@testing-library/react';
import DashboardLoading from './loading';

it('uses the current store app theme while dashboard routes are loading', () => {
	const { container } = render(<DashboardLoading />);
	expect(screen.getByTestId('api-loader')).toHaveStyle({ color: 'var(--app-text)' });
	expect(container.querySelector('.MuiBackdrop-root')).toHaveStyle({ backgroundColor: 'var(--app-surface)' });
});
