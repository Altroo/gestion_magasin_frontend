import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ChatAIAssistant, ChatAIFloatingButton } from './ChatAIAssistant';
import { ChatAIResults, validConfirmation } from './ChatAIResults';
import { chatRequest, consumeChatStream } from './api';
import { getAccessToken } from '@/store/selectors';
import { publishChatAIStore } from '@/utils/chatAIStoreScope';
import type { ChatCapabilities, ChatCard } from './types';
let mockToken = 'fixture-token',
	mockProfile = { id: 1, can_view: true, is_staff: false },
	mockPath = '/dashboard',
	mockLanguage: 'en' | 'fr' = 'fr';
const mockPush = jest.fn(),
	mockDispatch = jest.fn();
jest.mock('next/navigation', () => ({
	useSearchParams: () => new URLSearchParams(),
	usePathname: () => mockPath,
	useRouter: () => ({ push: mockPush }),
}));
jest.mock('@/utils/hooks', () => ({
	useAppSelector: (selector: unknown) => (selector === getAccessToken ? mockToken : mockProfile),
	useAppDispatch: () => mockDispatch,
	useLanguage: () => ({ language: mockLanguage, t: jest.requireActual('@/translations').translations[mockLanguage] }),
}));
jest.mock('@/store/selectors', () => ({ getAccessToken: jest.fn(), getProfilState: jest.fn() }));
jest.mock('@/utils/helpers', () => ({ handleUnauthorized: jest.fn() }));
jest.mock('@/store/services/magasin', () => ({
	magasinApi: { util: { invalidateTags: (tags: string[]) => ({ type: 'magasin/invalidateTags', payload: tags }) } },
}));
jest.mock('./api', () => ({ ...jest.requireActual('./api'), chatRequest: jest.fn(), consumeChatStream: jest.fn() }));
const theme = createTheme({ palette: { primary: { main: '#0274D7' } } });
const themed = (node: React.ReactNode) => <ThemeProvider theme={theme}>{node}</ThemeProvider>;
const capabilities: ChatCapabilities = {
	application: 'gestion_magasin',
	languages: ['fr', 'en'],
	companies: [
		{
			id: 1,
			name: 'Demo Company A',
			can_create: true,
			can_update: true,
			can_delete: true,
			can_print: true,
			suggestions: ['Affiche les derniers dépenses.'],
			shortcuts: [
				{
					command: '/voir',
					title: 'Rechercher',
					help: 'Décrivez le dépense ou le client.',
					example: '/voir dépense du client Demo',
				},
			],
		},
	],
};
const response = (data: unknown) => ({ json: async () => data }) as Response;
const reply = (text: string, cards: ChatCard[] = []) => ({ id: 'reply-' + text, role: 'assistant', text, cards });
const deferred = <T,>() => {
	let resolve!: (v: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
};
let handlers: Record<string, (init?: RequestInit) => Response | Promise<Response>>;
beforeEach(() => {
	jest.clearAllMocks();
	mockToken = 'fixture-token';
	mockProfile = { id: 1, can_view: true, is_staff: false };
	mockPath = '/dashboard';
	mockLanguage = 'fr';
	handlers = {};
	jest.mocked(chatRequest).mockImplementation(async (path, _token, init) => {
		if (handlers[path]) return handlers[path](init);
		if (path.startsWith('capabilities/')) return response(capabilities);
		if (path === 'conversations/') return response({ id: 'conversation-1' });
		throw new Error('Unexpected request ' + path);
	});
	jest
		.mocked(consumeChatStream)
		.mockImplementation(async (res, receive) => receive('message.completed', await res.json()));
});

capabilities.companies.push({ ...capabilities.companies[0], id: 2, name: 'Demo Company B' });
const open = async (company = 'Demo Company A') => {
	const view = render(themed(<ChatAIAssistant />));
	fireEvent.click(await screen.findByRole('button', { name: 'Ask AI Assistant' }));
	expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
	fireEvent.click(await screen.findByRole('button', { name: company }));
	await screen.findByRole('textbox', { name: 'Votre message' });
	return view;
};
const send = (text: string) => {
	fireEvent.change(screen.getByRole('textbox', { name: 'Votre message' }), { target: { value: text } });
	fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
};
it.each(['anonymous', 'no-read', 'public'])('hides the assistant for %s', (mode) => {
	if (mode === 'anonymous') mockToken = '';
	if (mode === 'no-read') mockProfile.can_view = false;
	if (mode === 'public') mockPath = '/login';
	render(themed(<ChatAIAssistant />));
	expect(screen.queryByRole('button', { name: 'Ask AI Assistant' })).not.toBeInTheDocument();
});
it('places the shared robot launcher at a fixed viewport position', () => {
	render(themed(<ChatAIFloatingButton open={false} toggle={jest.fn()} />));
	expect(screen.getByRole('button', { name: 'Ask AI Assistant' })).toHaveStyle({
		position: 'fixed',
		width: '56px',
		height: '56px',
	});
});
it('requires a company choice and scopes the created conversation', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Réponse B'));
	await open('Demo Company B');
	send('bonjour');
	await screen.findByText('Réponse B');
	const create = jest.mocked(chatRequest).mock.calls.find(([path]) => path === 'conversations/');
	expect(JSON.parse(create![2]!.body as string)).toEqual({ company_id: 2 });
});
it('sends a meaningful suggestion once', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Contrats trouvés'));
	await open();
	fireEvent.click(screen.getByRole('button', { name: 'Affiche les derniers dépenses.' }));
	await screen.findByText('Contrats trouvés');
	expect(jest.mocked(chatRequest).mock.calls.filter(([path]) => path.endsWith('/messages/'))).toHaveLength(1);
});
it('keeps slash descriptions editable and sends a bare command for help', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Décrivez le dépense recherché.'));
	await open();
	send('/voir');
	expect(await screen.findByText('Décrivez le dépense recherché.')).toBeVisible();
});
it('new conversation keeps the selected store and clears old content', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Private synthetic response'));
	await open();
	send('hello');
	await screen.findByText('Private synthetic response');
	fireEvent.click(screen.getByRole('button', { name: 'Nouvelle conversation' }));
	expect(screen.queryByText('Private synthetic response')).not.toBeInTheDocument();
	expect(screen.getByRole('textbox', { name: 'Votre message' })).toBeVisible();
	expect(screen.getByRole('combobox', { name: 'Magasin' })).toHaveTextContent('Demo Company A');
});
it('preserves a conversation across routes and sends fresh native page hints', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Réponse conservée'));
	const view = await open();
	send('hello');
	await screen.findByText('Réponse conservée');
	mockPath = '/dashboard/expenses/42';
	view.rerender(themed(<ChatAIAssistant />));
	send('Explique ce dépense');
	await waitFor(() =>
		expect(jest.mocked(chatRequest).mock.calls.filter(([path]) => path.endsWith('/messages/'))).toHaveLength(2),
	);
	const call = jest
		.mocked(chatRequest)
		.mock.calls.filter(([path]) => path.endsWith('/messages/'))
		.at(-1)!;
	expect(JSON.parse(call[2]!.body as string).context).toEqual({
		interface_language: 'fr',
		resource: 'expense',
		identifier: 42,
	});
	expect(document.querySelectorAll('button[aria-label="Ask AI Assistant"]')).toHaveLength(1);
});
it('clears private state on session expiration', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Private synthetic response'));
	await open();
	send('hello');
	await screen.findByText('Private synthetic response');
	act(() => window.dispatchEvent(new Event('session-expired')));
	expect(screen.queryByText('Private synthetic response')).not.toBeInTheDocument();
});
it('read-only results hide all mutation and print controls', () => {
	render(
		themed(
			<ChatAIResults
				cards={[
					{
						type: 'record_list',
						resource: 'expense',
						items: [{ id: 1, name: 'SYN-DEMO', description: '<script>untrusted()</script>' }],
					},
				]}
				navigate={jest.fn()}
				select={jest.fn()}
				pdf={jest.fn()}
				permissions={{ can_update: false, can_delete: false, can_print: false }}
			/>,
		),
	);
	expect(screen.getByText('<script>untrusted()</script>')).toBeVisible();
	expect(document.querySelector('script')).toBeNull();
	expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
});
it('honours record-level deletion restrictions', () => {
	render(
		themed(
			<ChatAIResults
				cards={[
					{ type: 'record_list', resource: 'product', items: [{ id: 1, name: 'Predefined demo', can_delete: false }] },
				]}
				navigate={jest.fn()}
				select={jest.fn()}
				permissions={{ can_update: true, can_delete: true, can_print: false }}
			/>,
		),
	);
	expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
});
it('validates actual contract fields and company scope in confirmations', () => {
	const card: ChatCard = {
		type: 'confirmation',
		resource: 'expense',
		company_id: 2,
		record_id: 1,
		action_id: 'synthetic',
		operation: 'update',
		changes: { label: 'Synthetic' },
		before: { label: 'Old' },
	};
	expect(validConfirmation(card)).toBe(true);
	expect(validConfirmation({ ...card, changes: { company: 'other' } })).toBe(false);
	expect(validConfirmation({ ...card, company_id: 0 })).toBe(false);
	render(themed(<ChatAIResults cards={[card]} navigate={jest.fn()} />));
	expect(screen.getByText('Libellé : Old → Synthetic')).toBeVisible();
	expect(screen.queryByText(/label/)).not.toBeInTheDocument();
});
it('preserves the requested document format and language', () => {
	const pdf = jest.fn();
	render(
		themed(
			<ChatAIResults
				cards={[{ type: 'pdf', resource: 'expense', record_id: 17, format: 'pdf', language: 'en' }]}
				navigate={jest.fn()}
				pdf={pdf}
			/>,
		),
	);
	fireEvent.click(screen.getByRole('button', { name: 'Télécharger la facture PDF' }));
	expect(pdf).toHaveBeenCalledWith(17, 'pdf', 'en');
});
it('cancellation ignores a late completion', async () => {
	const later = deferred<Response>();
	handlers['conversations/conversation-1/messages/'] = () => later.promise;
	await open();
	send('Find a contract');
	fireEvent.click(await screen.findByRole('button', { name: 'Annuler la réponse' }));
	await act(async () => later.resolve(response(reply('Late response'))));
	expect(screen.queryByText('Late response')).not.toBeInTheDocument();
});

it('follows the active store tab and clears the previous store conversation', async () => {
	mockPath = '/dashboard/expenses';
	let release = () => {};
	act(() => {
		release = publishChatAIStore({ pathname: mockPath, owner: 1, storeId: 1 });
	});
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Private store A'));
	const view = render(themed(<ChatAIAssistant />));
	fireEvent.click(await screen.findByRole('button', { name: 'Ask AI Assistant' }));
	send('hello');
	await screen.findByText('Private store A');
	act(() => {
		release();
		release = publishChatAIStore({ pathname: mockPath, owner: 1, storeId: 2 });
	});
	expect(screen.queryByText('Private store A')).not.toBeInTheDocument();
	expect(screen.getByText('Demo Company B')).toBeVisible();
	send('bonjour');
	await screen.findByText('Private store A');
	const creates = jest.mocked(chatRequest).mock.calls.filter(([path]) => path === 'conversations/');
	expect(JSON.parse(creates.at(-1)![2]!.body as string).company_id).toBe(2);
	view.unmount();
	act(() => release());
});

it('uses native English status labels and form captions', () => {
	mockLanguage = 'en';
	const card: ChatCard = {
		type: 'record_list',
		resource: 'sale',
		items: [
			{
				id: 1,
				name: 'Demo sale',
				status: 'confirmed',
				details: [{ label: 'Statut paiement', label_en: 'Payment status', value: 'Payé', status_code: 'paid' }],
			},
		],
	};
	render(themed(<ChatAIResults cards={[card]} navigate={jest.fn()} />));
	expect(screen.getByText('Confirmed')).toBeVisible();
	expect(screen.getByText('Payment status : Paid')).toBeVisible();
	expect(screen.queryByText('Confirmée')).not.toBeInTheDocument();
});

it.each([
	['fr', 'En attente', 'Approuvée', 'Rejetée'],
	['en', 'Pending', 'Approved', 'Rejected'],
])('labels stock request states in %s', (language, pending, approved, rejected) => {
	mockLanguage = language as 'en' | 'fr';
	render(
		themed(
			<ChatAIResults
				cards={[
					{
						type: 'record_list',
						resource: 'stock_request',
						items: ['pending', 'approved', 'rejected'].map((status, id) => ({ id: id + 1, name: 'Demo', status })),
					},
				]}
				navigate={jest.fn()}
			/>,
		),
	);
	for (const label of [pending, approved, rejected]) expect(screen.getByText(label)).toBeVisible();
});
