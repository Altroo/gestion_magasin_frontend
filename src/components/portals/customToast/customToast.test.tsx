import React from 'react';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import CustomToast from './customToast';
import '@testing-library/jest-dom';

// Mock MUI icon modules used by the component
jest.mock('@mui/icons-material/CheckCircleOutline', () => {
	return {
		__esModule: true,
		default: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="CheckCircleOutlineIcon" {...props} />,
	};
});
jest.mock('@mui/icons-material/ErrorOutline', () => {
	return {
		__esModule: true,
		default: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="ErrorOutlineIcon" {...props} />,
	};
});
jest.mock('@mui/icons-material/InfoOutlined', () => {
	return {
		__esModule: true,
		default: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="InfoOutlinedIcon" {...props} />,
	};
});
jest.mock('@mui/icons-material/WarningAmberOutlined', () => {
	return {
		__esModule: true,
		default: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="WarningAmberOutlinedIcon" {...props} />,
	};
});

// Minimal theme mock so ThemeProvider works
jest.mock('@/utils/themes', () => {
	const { createTheme } = jest.requireActual('@mui/material/styles');
	return { customToastTheme: () => createTheme({}) };
});

describe('CustomToast', () => {
	const setShowMock = jest.fn();

	afterEach(() => {
		jest.clearAllMocks();
		cleanup();
		document.body.innerHTML = '';
	});

	it('renders the message and has a working close control', () => {
		const { unmount } = render(
			<CustomToast type="error" show={true} setShow={setShowMock} message="Une erreur est survenue" />,
		);

		const alerts = screen.getAllByRole('alert');
		const targetAlert = alerts.find((a) => a.textContent?.includes('Une erreur est survenue'));
		expect(targetAlert).toBeDefined();

		const w = within(targetAlert as HTMLElement);
		let closeBtn: HTMLElement | null = null;
		try {
			closeBtn = w.getByLabelText(/close/i);
		} catch {
			const btns = w.queryAllByRole('button');
			if (btns.length > 0) closeBtn = btns[0];
		}
		expect(closeBtn).not.toBeNull();
		fireEvent.click(closeBtn as HTMLElement);
		expect(setShowMock).toHaveBeenCalledWith(false);

		unmount();
	});

	it('does not call setShow when clicking the message area', () => {
		const { unmount } = render(<CustomToast type="info" show={true} setShow={setShowMock} message="Info message" />);

		const alerts = screen.getAllByRole('alert');
		const targetAlert = alerts.find((a) => a.textContent?.includes('Info message'));
		expect(targetAlert).toBeDefined();

		const messageNode = within(targetAlert as HTMLElement).getByText('Info message');
		fireEvent.click(messageNode);
		expect(setShowMock).not.toHaveBeenCalled();

		unmount();
	});

	it('renders an icon (img/svg/alertIcon element) scoped to each alert', () => {
		const cases: Array<{ type: 'success' | 'error' | 'info' | 'warning'; msg: string }> = [
			{ type: 'success', msg: 'success-msg' },
			{ type: 'error', msg: 'error-msg' },
			{ type: 'info', msg: 'info-msg' },
			{ type: 'warning', msg: 'warn-msg' },
		];

		for (const c of cases) {
			const { unmount } = render(<CustomToast type={c.type} show={true} setShow={setShowMock} message={c.msg} />);

			const alerts = screen.getAllByRole('alert');
			const targetAlert = alerts.find((a) => a.textContent?.includes(c.msg));
			expect(targetAlert).toBeDefined();

			const alertEl = targetAlert as HTMLElement;

			// Strategy: attempt several selectors inside the alert; succeed if any finds a candidate icon.
			const findIcon = (): Element | null => {
				// 1) any <img> inside alert
				const imgTag = alertEl.querySelector('img');
				if (imgTag) return imgTag;

				// 2) inline SVG icon inside alert (MUI icons render as svg)
				const svgTag = alertEl.querySelector('svg');
				if (svgTag) return svgTag;

				// 3) element with class name containing alertIcon (as used in component CSS class)
				const classMatch = alertEl.querySelector('[class*="alertIcon"]');
				if (classMatch) return classMatch;

				return null;
			};

			const iconNode = findIcon();
			if (!iconNode) {
				// print DOM snapshot for debugging then fail explicitly
				console.error('Alert DOM snapshot (no icon found):', alertEl.outerHTML);
			}
			expect(iconNode).not.toBeNull();

			unmount();
			document.body.innerHTML = '';
		}
	});
});
