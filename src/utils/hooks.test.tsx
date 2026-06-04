import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

// ─── useAppDispatch / useAppSelector ─────────────────────────────────────────

import { useAppDispatch, useAppSelector } from './hooks';
import { store } from '@/store/store';

const wrapper = ({ children }: { children: React.ReactNode }) => (
	<Provider store={store}>{children}</Provider>
);

describe('useAppDispatch', () => {
	it('returns a dispatch function', () => {
		const { result } = renderHook(() => useAppDispatch(), { wrapper });
		expect(typeof result.current).toBe('function');
	});
});

describe('useAppSelector', () => {
	it('selects state from the store', () => {
		const { result } = renderHook(() => useAppSelector((s) => s._init), { wrapper });
		expect(result.current).toBeDefined();
	});
});

// ─── usePermission ───────────────────────────────────────────────────────────

jest.mock('@/store/selectors', () => ({
	getProfilState: jest.fn((state: unknown) => {
		const s = state as { account?: { profil?: unknown } };
		return (s?.account?.profil ?? {}) as ReturnType<typeof import('@/store/selectors').getProfilState>;
	}),
}));

import { usePermission } from './hooks';

describe('usePermission', () => {
	const makeWrapper =
		(profil: Record<string, unknown>) =>
		// eslint-disable-next-line react/display-name
		({ children }: { children: React.ReactNode }) => {
			const fakeStore = configureStore({
				reducer: {
					account: () => ({ profil }),
					_init: () => ({}),
				},
			});
			return <Provider store={fakeStore}>{children}</Provider>;
		};

	it('returns all true for a staff user', () => {
		const { result } = renderHook(() => usePermission(), {
			wrapper: makeWrapper({ is_staff: true }),
		});
		expect(result.current.is_staff).toBe(true);
		expect(result.current.can_view).toBe(true);
		expect(result.current.can_print).toBe(true);
		expect(result.current.can_create).toBe(true);
		expect(result.current.can_edit).toBe(true);
		expect(result.current.can_delete).toBe(true);
	});

	it('returns individual flags for non-staff user', () => {
		const { result } = renderHook(() => usePermission(), {
			wrapper: makeWrapper({
				is_staff: false,
				can_view: true,
				can_print: false,
				can_create: true,
				can_edit: false,
				can_delete: false,
			}),
		});
		expect(result.current.is_staff).toBe(false);
		expect(result.current.can_view).toBe(true);
		expect(result.current.can_print).toBe(false);
		expect(result.current.can_create).toBe(true);
		expect(result.current.can_edit).toBe(false);
		expect(result.current.can_delete).toBe(false);
	});
});

// ─── useIsClient ─────────────────────────────────────────────────────────────

import { useIsClient } from './hooks';

describe('useIsClient', () => {
	it('returns true on the client side', () => {
		const { result } = renderHook(() => useIsClient());
		expect(result.current).toBe(true);
	});
});

// ─── useToast ──────────────────────────────────────────────────────────────

import { useToast } from './hooks';
import { ToastContext } from '@/contexts/toastContext';

describe('useToast', () => {
	it('returns the toast context value when within provider', () => {
		const mockCtx = { onSuccess: jest.fn(), onError: jest.fn() };
		const contextWrapper = ({ children }: { children: React.ReactNode }) => (
			<ToastContext.Provider value={mockCtx}>{children}</ToastContext.Provider>
		);
		const { result } = renderHook(() => useToast(), { wrapper: contextWrapper });
		expect(result.current.onSuccess).toBe(mockCtx.onSuccess);
		expect(result.current.onError).toBe(mockCtx.onError);
	});

	it('throws when used outside of ToastProvider', () => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
		expect(() => renderHook(() => useToast())).toThrow('useToast must be used within ToastProvider');
		jest.restoreAllMocks();
	});
});
