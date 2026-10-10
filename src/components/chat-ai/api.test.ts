import { ReadableStream } from 'node:stream/web';
import { TextDecoder } from 'node:util';
import { consumeChatStream, safeNavigation, downloadSaleDocument } from './api';
import type { NavigationTarget } from './types';
jest.mock('@/utils/helpers', () => ({ handleUnauthorized: jest.fn() }));
jest.mock('next-auth/react', () => ({ getSession: jest.fn() }));
Object.assign(globalThis, { TextDecoder });
const target: NavigationTarget = {
	application: 'gestion_magasin',
	resource: 'expense',
	identifier: 12,
	company_id: 2,
	path: '/dashboard/expenses/12?store_id=2',
};
it.each([
	'javascript:alert(1)',
	'//example.invalid',
	'https://example.invalid',
	'/dashboard/expenses/13?store_id=2',
	'/dashboard/expenses/12?store_id=1',
])('rejects unsafe substituted target %s', (path) => expect(safeNavigation({ ...target, path }, 2)).toBeNull());
it('requires matching application, company and native route', () => {
	expect(safeNavigation(target, 2)).toBe('/dashboard/expenses/12?store_id=2');
	expect(safeNavigation(target, 1)).toBeNull();
	expect(safeNavigation({ ...target, application: 'facturation' } as unknown as NavigationTarget, 2)).toBeNull();
	expect(safeNavigation({ ...target, resource: 'project', path: '/dashboard/projects/12' }, 2)).toBeNull();
});
const stream = (...parts: string[]) =>
	({
		body: new ReadableStream({
			start(controller) {
				for (const part of parts) controller.enqueue(new TextEncoder().encode(part));
				controller.close();
			},
		}),
	}) as unknown as Response;
it('handles split streaming events and requires completion', async () => {
	const receive = jest.fn();
	await consumeChatStream(
		stream('event: message.delta\ndata: {"text":"Bonjour"}', '\n\nevent: message.completed\ndata: {"id":"done"}\n\n'),
		receive,
	);
	expect(receive).toHaveBeenCalledWith('message.delta', { text: 'Bonjour' });
	await expect(
		consumeChatStream(stream('event: message.delta\ndata: {"text":"partial"}\n\n'), receive),
	).rejects.toMatchObject({ code: 'INCOMPLETE_RESPONSE' });
});
it('preserves authorization failures during streaming', async () => {
	await expect(
		consumeChatStream(stream('event: error\ndata: {"code":"PERMISSION_DENIED"}\n\n'), jest.fn()),
	).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
});
it('downloads through the fresh-scope protected document endpoint', async () => {
	const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, blob: async () => new Blob(['synthetic']) });
	global.fetch = fetchMock;
	URL.createObjectURL = jest.fn().mockReturnValue('blob:synthetic');
	URL.revokeObjectURL = jest.fn();
	const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
	await downloadSaleDocument(12, 2, 'synthetic-token', 'pdf', 'en');
	expect(fetchMock).toHaveBeenCalledWith(
		expect.stringContaining('/ai/v1/documents/12/?company_id=2&language=en'),
		expect.objectContaining({ cache: 'no-store' }),
	);
	expect(click).toHaveBeenCalled();
	click.mockRestore();
});

it('allows only the selected store on native creation links', () => {
	const creation = { ...target, resource: 'expense_new', identifier: null, path: '/dashboard/expenses/new?store_id=2' };
	expect(safeNavigation(creation, 2)).toBe(creation.path);
	expect(safeNavigation({ ...creation, path: '/dashboard/expenses/new?store_id=1' }, 2)).toBeNull();
	expect(
		safeNavigation({ ...target, resource: 'sale_edit', path: '/dashboard/sales/12/edit?store_id=2' }, 2),
	).toBeNull();
});
