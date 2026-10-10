'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	IconButton,
	ListItemButton,
	MenuItem,
	TextField,
	Portal,
	Stack,
	Typography,
} from '@mui/material';
import { DeleteOutlined, StorefrontOutlined } from '@mui/icons-material';
import { useAppSelector, useAppDispatch, useLanguage } from '@/utils/hooks';
import { getAccessToken, getProfilState } from '@/store/selectors';
import { chatRequest, ChatAPIError, consumeChatStream, safeNavigation, downloadSaleDocument } from './api';
import { magasinApi } from '@/store/services/magasin';
import { getChatAIStore, subscribeChatAIStore } from '@/utils/chatAIStoreScope';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import styles from './shared/chat-ai.module.css';
import { ChatAIInterface, ChatAIHeader, ChatAIWelcome, ChatAIMessageBox } from './shared/ChatAIInterface';
export { ChatAIFloatingButton, ChatAIPanel } from './shared/ChatAIInterface';
import { ChatAIComposer } from './shared/ChatAIComposer';
import { ChatAIResults } from './ChatAIResults';
import type { ChatCapabilities, ChatMessage, NavigationTarget, ChatCard } from './types';

const errorText: Record<string, string> = {
	PERMISSION_DENIED: 'Vous n’avez pas accès à ces informations.',
	NOT_FOUND: 'Aucun résultat autorisé trouvé.',
	CONTEXT_EXPIRED: 'Le contexte a expiré ou vos autorisations ont changé. Démarrez une nouvelle conversation.',
	NOT_AUTHENTICATED: 'Votre session a expiré.',
	BUSY: 'L’assistant est occupé. Réessayez dans un instant.',
	INVALID_MODEL_OUTPUT:
		'Je n’ai pas pu interpréter cette demande. Précisez votre recherche ou utilisez /aide pour choisir un module.',
	INCOMPLETE_RESPONSE: 'La réponse est incomplète. Vous pouvez réessayer ou utiliser /aide pour choisir un module.',
	MODEL_TIMEOUT: 'La réponse a pris trop de temps. Réessayez avec une recherche plus précise.',
	TOOL_TIMEOUT: 'L’opération a pris trop de temps. Vous pouvez réessayer.',
	SENSITIVE_INPUT: 'Retirez les mots de passe ou secrets avant d’envoyer ce message.',
	INVALID_ARGUMENTS: 'Précisez votre demande, le numéro ou la période.',
	MULTIPLE_MATCHES: 'Plusieurs résultats correspondent. Précisez votre recherche.',
	STALE_ACTION: 'Le document a changé. Demandez une nouvelle prévisualisation.',
	ACTION_REJECTED: 'L’application a refusé cette action selon ses règles de gestion.',
	CONTEXT_LIMIT: 'Cette conversation est complète. Démarrez une nouvelle conversation.',
};

const errorTextEnglish: Record<string, string> = {
	PERMISSION_DENIED: 'You do not have permission to access this information.',
	NOT_FOUND: 'No authorized matching result was found.',
	CONTEXT_EXPIRED: 'The context expired or your permissions changed. Start a new conversation.',
	NOT_AUTHENTICATED: 'Your session expired.',
	BUSY: 'The assistant is busy. Please try again shortly.',
	INVALID_MODEL_OUTPUT:
		'I could not interpret that request. Make your search more specific or use /help to choose a module.',
	INCOMPLETE_RESPONSE: 'The response is incomplete. Retry or use /help to choose a module.',
	MODEL_TIMEOUT: 'The response took too long. Try a more specific search.',
	TOOL_TIMEOUT: 'The operation took too long. Please try again.',
	SENSITIVE_INPUT: 'Remove passwords or secrets before sending this message.',
	INVALID_ARGUMENTS: 'Specify your request, the record or the period.',
	MULTIPLE_MATCHES: 'Several results match. Make your search more specific.',
	STALE_ACTION: 'The record changed. Request a new preview.',
	ACTION_REJECTED: 'The application rejected this action under its business rules.',
	CONTEXT_LIMIT: 'This conversation is full. Start a new conversation.',
};

type ChatAIRetryRequest = {
	text: string;
	id: string;
	context: { interface_language: 'fr' | 'en'; resource?: string; identifier?: number };
};

const ChatAIWorkspace = ({
	companyId,
	token,
	capabilities,
	close,
	companyControl,
}: {
	close: () => void;
	companyControl: React.ReactNode;
	companyId: number;
	token: string;
	capabilities: ChatCapabilities;
}) => {
	const router = useRouter();
	const { language: interfaceLanguage } = useLanguage();
	const pathname = usePathname();
	const dispatch = useAppDispatch();
	const company = capabilities.companies.find((item) => item.id === companyId)!;
	const [conversation, setConversation] = useState<string | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [draft, setDraft] = useState('');
	const [composerVersion, setComposerVersion] = useState(0);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [delta, setDelta] = useState('');
	const [historyOpen, setHistoryOpen] = useState(false);
	const [pendingDeletion, setPendingDeletion] = useState<string | null>(null);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [history, setHistory] = useState<{ id: string; title?: string; updated_at: string }[]>([]);
	const controller = useRef<AbortController | null>(null);
	const active = useRef(true);
	const requestEpoch = useRef(0);
	const currentPath = useRef(pathname);
	const bottom = useRef<HTMLDivElement>(null);
	const followLatest = useRef(true);
	const [retry, setRetry] = useState<ChatAIRetryRequest | null>(null);
	useEffect(() => {
		active.current = true;
		return () => {
			active.current = false;
			requestEpoch.current += 1;
			controller.current?.abort();
		};
	}, []);
	useEffect(() => {
		currentPath.current = pathname;
	}, [pathname]);
	useEffect(() => {
		if (historyOpen) return;
		if (!messages.length && !delta && !busy) {
			bottom.current?.parentElement?.scrollTo?.({ top: 0 });
		} else if (followLatest.current) {
			bottom.current?.scrollIntoView?.({ behavior: 'auto', block: 'end' });
		}
	}, [messages, delta, busy, historyOpen]);

	// Every new view/request invalidates older asynchronous work, including fetches
	// whose response body finishes after abort. Server-confirmed writes are still
	// allowed to invalidate business caches, but cannot change a newer chat view.
	const cancelPending = () => {
		setPendingDeletion(null);
		requestEpoch.current += 1;
		controller.current?.abort();
		controller.current = null;
		setBusy(false);
		setHistoryLoading(false);
		setDelta('');
	};
	const startRequest = (loading: 'message' | 'history') => {
		cancelPending();
		const epoch = requestEpoch.current;
		const requestController = new AbortController();
		controller.current = requestController;
		setBusy(loading === 'message');
		setHistoryLoading(loading === 'history');
		const isCurrent = () => active.current && requestEpoch.current === epoch && !requestController.signal.aborted;
		return {
			signal: requestController.signal,
			isCurrent,
			finish: () => {
				if (!isCurrent()) return;
				controller.current = null;
				setBusy(false);
				setHistoryLoading(false);
				setDelta('');
			},
		};
	};

	const navigate = (target: NavigationTarget) => {
		const route = safeNavigation(target, companyId);
		if (route) router.push(route);
		else setError(interfaceLanguage === 'en' ? 'Navigation denied.' : 'Navigation refusée.');
	};
	const showError = (err: unknown) => {
		if (!active.current || (err instanceof DOMException && err.name === 'AbortError')) return;
		if (err instanceof ChatAPIError && err.code === 'CONTEXT_EXPIRED') {
			setConversation(null);
			setMessages([]);
			setRetry(null);
			setDelta('');
		}
		setError(
			(interfaceLanguage === 'en' ? errorTextEnglish : errorText)[err instanceof ChatAPIError ? err.code : ''] ||
				(interfaceLanguage === 'en'
					? 'The assistant is unavailable. Please try again.'
					: 'L’assistant est indisponible. Vous pouvez réessayer.'),
		);
	};
	const confirmAction = async (card: ChatCard) => {
		const epoch = requestEpoch.current;
		const path = pathname;
		const isCurrent = () => active.current && requestEpoch.current === epoch;
		try {
			// Do not abort a confirmed write: it may already have executed. Its
			// successful result must refresh caches even after leaving this view.
			await chatRequest(`actions/${card.action_id}/confirm/`, token, {
				method: 'POST',
				body: JSON.stringify({ confirmed: true }),
			});
			dispatch(
				magasinApi.util.invalidateTags([
					'Stores',
					'Products',
					'Stock',
					'StockAddRequests',
					'Sales',
					'Attendance',
					'Expenses',
					'Purchases',
					'Inventory',
					'Transfers',
					'Promotions',
					'Reports',
				]),
			);
			if (!isCurrent()) return;
			setMessages((old) => [
				...old.map((m) => ({ ...m, cards: m.cards?.filter((c) => c.type === 'confirmation') })),
				{
					id: crypto.randomUUID(),
					role: 'assistant',
					text:
						interfaceLanguage === 'en'
							? 'Action completed. Your identity is recorded in the history.'
							: 'Action effectuée. Votre identité est enregistrée dans l’historique.',
				},
			]);
			const listRoutes: Record<string, string> = {
				product: 'article',
				customer: 'sales',
				expense: 'expenses',
				attendance: 'pointage',
			};
			const list = card.resource && listRoutes[card.resource];
			if (card.operation === 'delete' && list && currentPath.current === path)
				router.push(`/dashboard/${list}?store_id=${companyId}`);
		} catch (err) {
			if (!isCurrent()) return;
			showError(err);
			throw err;
		}
	};
	const pageContext = () => {
		const match = pathname.match(
			/^\/dashboard\/(article|stock|sales|purchases|stock-transfers|inventory|expenses|promotions|pointage|stores|users)\/(\d+)\/?$/,
		);
		const resources: Record<string, string> = {
			article: 'product',
			stock: 'stock',
			sales: 'sale',
			purchases: 'purchase',
			'stock-transfers': 'transfer',
			inventory: 'inventory',
			expenses: 'expense',
			promotions: 'promotion',
			pointage: 'attendance',
			stores: 'store',
			users: 'user',
		};
		return {
			interface_language: interfaceLanguage,
			...(match ? { resource: resources[match[1]], identifier: Number(match[2]) } : {}),
		};
	};
	const selectRecord = async (resource: string, identifier: number, operation: 'edit' | 'delete') => {
		if (!conversation || busy) return;
		const request = startRequest('message');
		setError('');
		try {
			const response = await chatRequest(`conversations/${conversation}/selection/`, token, {
				method: 'POST',
				body: JSON.stringify({ resource, identifier, operation, context: pageContext() }),
				signal: request.signal,
			});
			const message = (await response.json()) as ChatMessage;
			if (request.isCurrent()) setMessages((old) => [...old, message]);
		} catch (err) {
			if (request.isCurrent()) showError(err);
		} finally {
			request.finish();
		}
	};
	const send = async (text = draft, previousRequest?: ChatAIRetryRequest) => {
		if (!text.trim() || text.length > 4000 || busy) return;
		followLatest.current = true;
		const request = startRequest('message');
		setHistoryOpen(false);
		setError('');
		setDelta('');
		setDraft('');
		const requestId = previousRequest?.id || crypto.randomUUID();
		// Retrying keeps the original page hint; the backend reauthorizes it.
		const context = previousRequest?.context ?? pageContext();
		setRetry({ text, id: requestId, context });
		if (!previousRequest) setMessages((old) => [...old, { id: requestId, role: 'user', text }]);
		const { signal, isCurrent } = request;
		try {
			let id = conversation;
			if (!id) {
				const response = await chatRequest('conversations/', token, {
					method: 'POST',
					body: JSON.stringify({ company_id: companyId }),
					signal,
				});
				id = (await response.json()).id as string;
				if (!isCurrent()) return;
				setConversation(id);
			}
			const response = await chatRequest(`conversations/${id}/messages/`, token, {
				method: 'POST',
				headers: { Accept: 'text/event-stream' },
				body: JSON.stringify({ text, request_id: requestId, context }),
				signal,
			});
			await consumeChatStream(response, (event, data) => {
				if (!isCurrent()) return;
				if (event === 'message.delta') setDelta((old) => old + (data as { text: string }).text);
				if (event === 'message.completed') {
					const message = data as ChatMessage;
					setDelta('');
					setMessages((old) => [...old.filter((item) => item.id !== message.id), message]);
					setRetry(null);
					// A validated navigation card is offered for user action; searches never redirect.
				}
			});
		} catch (err) {
			if (isCurrent()) showError(err);
		} finally {
			request.finish();
		}
	};
	const loadHistory = async () => {
		const request = startRequest('history');
		setHistoryOpen(true);
		setError('');
		try {
			const response = await chatRequest(`conversations/?company_id=${companyId}`, token, { signal: request.signal });
			const result = await response.json();
			if (request.isCurrent()) setHistory(result);
		} catch (err) {
			if (request.isCurrent()) showError(err);
		} finally {
			request.finish();
		}
	};
	const openHistory = async (id: string) => {
		const request = startRequest('history');
		try {
			const response = await chatRequest(`conversations/${id}/`, token, { signal: request.signal });
			const result = await response.json();
			if (request.isCurrent() && result.company_id === companyId) {
				followLatest.current = true;
				setConversation(id);
				setMessages(result.messages);
				setHistoryOpen(false);
				setError('');
				setRetry(null);
			}
		} catch (err) {
			if (request.isCurrent()) showError(err);
		} finally {
			request.finish();
		}
	};
	const newConversation = () => {
		cancelPending();
		setComposerVersion((version) => version + 1);
		followLatest.current = true;
		setConversation(null);
		setMessages([]);
		setDraft('');
		setError('');
		setRetry(null);
		setHistoryOpen(false);
	};
	const deleteConversation = async (id: string) => {
		if (!history.some((item) => item.id === id)) return;
		const request = startRequest('history');
		setError('');
		try {
			await chatRequest(`conversations/${id}/`, token, { method: 'DELETE', signal: request.signal });
			if (!request.isCurrent()) return;
			setHistory((old) => old.filter((item) => item.id !== id));
			if (conversation === id) {
				setConversation(null);
				setMessages([]);
				setDraft('');
				setRetry(null);
				followLatest.current = true;
			}
		} catch (err) {
			if (request.isCurrent()) showError(err);
		} finally {
			request.finish();
		}
	};

	return (
		<>
			<ChatAIHeader
				appName="Gestion Magasin"
				close={close}
				newConversation={newConversation}
				history={() => {
					if (historyOpen) {
						cancelPending();
						setHistoryOpen(false);
					} else {
						void loadHistory();
					}
				}}
				historyExpanded={historyOpen}
				language={interfaceLanguage}
			/>
			{companyControl}
			<Box
				role="log"
				aria-live="polite"
				aria-label="Conversation"
				onScroll={(event) => {
					if (historyOpen) return;
					const list = event.currentTarget;
					followLatest.current = list.scrollHeight - list.scrollTop - list.clientHeight <= 64;
				}}
				className={styles.messages}
			>
				{historyOpen ? (
					<Stack spacing={1}>
						<Typography variant="caption">
							{interfaceLanguage === 'en'
								? 'Your conversation history. Results are refreshed when reopened.'
								: 'Votre historique de conversations. Les résultats sont actualisés à la réouverture.'}
						</Typography>
						{historyLoading && (
							<Typography role="status">
								{interfaceLanguage === 'en' ? 'Loading history…' : 'Chargement de l’historique…'}
							</Typography>
						)}
						{error && <Alert severity="warning">{error}</Alert>}
						<Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
							{history.map((item) => {
								const title =
									item.title?.trim() || (interfaceLanguage === 'en' ? 'New conversation' : 'Nouvelle conversation');
								const selected = item.id === conversation;
								return (
									<Box
										key={item.id}
										component="li"
										sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}
									>
										<ListItemButton
											selected={selected}
											aria-current={selected ? 'true' : undefined}
											aria-label={`${interfaceLanguage === 'en' ? 'Open conversation' : 'Ouvrir la conversation'} : ${title}`}
											onClick={() => openHistory(item.id)}
											sx={{ minWidth: 0, px: 1, py: 1.5 }}
										>
											<Box sx={{ minWidth: 0 }}>
												<Typography variant="body2" sx={{ fontWeight: selected ? 600 : 400, overflowWrap: 'anywhere' }}>
													{title}
												</Typography>
												<Typography
													variant="caption"
													color="text.secondary"
													component="time"
													dateTime={item.updated_at}
													sx={{ display: 'block', mt: 0.5 }}
												>
													{new Date(item.updated_at).toLocaleString()}
												</Typography>
												{selected && (
													<Typography variant="caption" color="text.secondary">
														{interfaceLanguage === 'en' ? 'Current conversation' : 'Conversation actuelle'}
													</Typography>
												)}
											</Box>
										</ListItemButton>
										<DarkTooltip
											title={`${interfaceLanguage === 'en' ? 'Delete conversation' : 'Supprimer la conversation'} : ${title}`}
										>
											<span>
												<IconButton
													aria-label={`${interfaceLanguage === 'en' ? 'Delete conversation' : 'Supprimer la conversation'} : ${title}`}
													disabled={historyLoading}
													onClick={() => setPendingDeletion(item.id)}
												>
													<DeleteOutlined fontSize="small" />
												</IconButton>
											</span>
										</DarkTooltip>
									</Box>
								);
							})}
						</Box>

						{!historyLoading && !history.length && (
							<Typography>{interfaceLanguage === 'en' ? 'No conversations yet.' : 'Aucune conversation.'}</Typography>
						)}
						<TextButton
							buttonText={interfaceLanguage === 'en' ? 'Back to conversation' : 'Revenir à la conversation'}
							onClick={() => {
								cancelPending();
								setHistoryOpen(false);
							}}
						/>
					</Stack>
				) : (
					<div>
						{!messages.length && (
							<ChatAIWelcome
								language={interfaceLanguage}
								suggestions={company.suggestions}
								busy={busy}
								send={(question) => {
									void send(question);
								}}
							/>
						)}
						{messages.map((message) => (
							<ChatAIMessageBox key={message.id} role={message.role} text={message.text} language={interfaceLanguage}>
								<ChatAIResults
									cards={message.cards || []}
									navigate={navigate}
									confirm={confirmAction}
									select={selectRecord}
									permissions={company}
									pdf={(id, format, language) => {
										void downloadSaleDocument(id, companyId, token, format, language ?? interfaceLanguage).catch(
											showError,
										);
									}}
								/>
							</ChatAIMessageBox>
						))}
						{(busy || delta) && (
							<ChatAIMessageBox role="assistant" text={delta} language={interfaceLanguage}>
								{busy && (
									<Stack role="status" direction="row" sx={{ gap: 1, alignItems: 'center', mt: delta ? 1 : 0 }}>
										<CircularProgress size={14} />
										<Typography variant="caption" color="text.secondary">
											{interfaceLanguage === 'en' ? 'Working…' : 'En cours…'}
										</Typography>
									</Stack>
								)}
							</ChatAIMessageBox>
						)}
						{error && (
							<Alert severity="warning">
								{error}
								{retry && (
									<Button onClick={() => send(retry.text, retry)} disabled={busy}>
										{interfaceLanguage === 'en' ? 'Retry' : 'Réessayer'}
									</Button>
								)}
							</Alert>
						)}
					</div>
				)}
				<div ref={bottom} />
			</Box>
			{pendingDeletion && (
				<ActionModals
					title={interfaceLanguage === 'en' ? 'Delete this conversation?' : 'Supprimer cette conversation ?'}
					body={
						interfaceLanguage === 'en'
							? 'This deletes the conversation and its messages. Business records are unaffected.'
							: 'La conversation et ses messages seront supprimés. Les données de l’application seront conservées.'
					}
					onClose={() => setPendingDeletion(null)}
					actions={[
						{
							text: interfaceLanguage === 'en' ? 'Cancel' : 'Annuler',
							active: false,
							onClick: () => setPendingDeletion(null),
						},
						{
							text: interfaceLanguage === 'en' ? 'Delete conversation' : 'Supprimer la conversation',
							active: true,
							color: '#C62828',
							onClick: () => {
								void deleteConversation(pendingDeletion);
							},
						},
					]}
				>
					<Typography variant="body2">{history.find((item) => item.id === pendingDeletion)?.title}</Typography>
				</ActionModals>
			)}
			<ChatAIComposer
				key={`${composerVersion}:${historyOpen}`}
				draft={draft}
				setDraft={setDraft}
				busy={busy}
				historyOpen={historyOpen}
				shortcuts={company.shortcuts || []}
				language={interfaceLanguage}
				send={() => {
					void send();
				}}
				cancel={cancelPending}
			/>
		</>
	);
};

export const ChatAIAssistant = () => {
	const { language } = useLanguage();
	const token = useAppSelector(getAccessToken);
	const profile = useAppSelector(getProfilState);
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const storeHint = useSyncExternalStore(subscribeChatAIStore, getChatAIStore, () => null);
	const routeStore = Number(searchParams.get('store_id'));
	const activeStore =
		storeHint?.pathname === pathname && storeHint.owner === profile.id
			? storeHint.storeId
			: Number.isSafeInteger(routeStore) && routeStore > 0
				? routeStore
				: null;
	const [capabilities, setCapabilities] = useState<ChatCapabilities | null>(null);
	const [capabilityOwner, setCapabilityOwner] = useState<number | null>(null);
	const [open, setOpen] = useState(false);
	const [selection, setSelection] = useState<{ owner: number; company: number } | null>(null);
	const [overlayOpen, setOverlayOpen] = useState(false);
	useEffect(() => {
		// Native dialogs/drawers own focus and accessibility while open. Preserve
		// the chat state, but hide its shell until those overlays are closed.
		const update = () =>
			setOverlayOpen(
				Array.from(document.querySelectorAll<HTMLElement>('.MuiModal-root')).some((element) => {
					const style = getComputedStyle(element);
					return (
						element.getAttribute('aria-hidden') !== 'true' && style.display !== 'none' && style.visibility !== 'hidden'
					);
				}),
			);
		update();
		const observer = new MutationObserver(update);
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['aria-hidden', 'class', 'style'],
		});
		return () => observer.disconnect();
	}, []);
	useEffect(() => {
		if (!token || !profile.id) return;
		const identity = profile.id;
		const controller = new AbortController();
		void chatRequest(`capabilities/?language=${language}`, token, { signal: controller.signal })
			.then((response) => response.json())
			.then((value) => {
				if (!controller.signal.aborted) {
					setCapabilities(value);
					setCapabilityOwner(identity);
				}
			})
			.catch(() => {
				if (!controller.signal.aborted) setCapabilities(null);
			});
		return () => controller.abort();
	}, [token, profile.id, language]);
	useEffect(() => {
		const clear = () => {
			setCapabilities(null);
			setOpen(false);
			setSelection(null);
		};
		window.addEventListener('session-expired', clear);
		return () => window.removeEventListener('session-expired', clear);
	}, []);
	if (
		!token ||
		!profile.id ||
		!(profile.is_staff || profile.can_view) ||
		!capabilities ||
		capabilityOwner !== profile.id ||
		!pathname.startsWith('/dashboard')
	)
		return null;
	const authorizedActiveStore = capabilities.companies.some((item) => item.id === activeStore) ? activeStore : null;
	const company = capabilities.companies.find(
		(item) => item.id === (authorizedActiveStore ?? (selection?.owner === profile.id ? selection.company : null)),
	);
	if (!capabilities.companies.length) return null;
	const companyControl = (
		<Box className={styles.company}>
			{authorizedActiveStore && company ? (
				<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
					<StorefrontOutlined fontSize="small" color="action" />
					<Typography variant="body2" sx={{ fontWeight: 500, fontSize: 12 }}>
						{company.name}
					</Typography>
					<Typography variant="caption" color="text.secondary" sx={{ ml: 'auto !important', fontSize: 10 }}>
						{language === 'en' ? 'Active store' : 'Magasin actif'}
					</Typography>
				</Stack>
			) : (
				<TextField
					select
					fullWidth
					size="small"
					label={language === 'en' ? 'Store' : 'Magasin'}
					value={company?.id || ''}
					onChange={(event) => setSelection({ owner: profile.id, company: Number(event.target.value) })}
				>
					{capabilities.companies.map((item) => (
						<MenuItem key={item.id} value={item.id}>
							{item.name}
						</MenuItem>
					))}
				</TextField>
			)}
		</Box>
	);
	return (
		<Portal>
			<ChatAIInterface open={open} onOpenChange={setOpen} suppressed={overlayOpen}>
				{company ? (
					<ChatAIWorkspace
						key={`${profile.id}:${company.id}`}
						companyId={company.id}
						token={token}
						capabilities={capabilities}
						close={() => setOpen(false)}
						companyControl={companyControl}
					/>
				) : (
					<>
						<ChatAIHeader appName="Gestion Magasin" language={language} close={() => setOpen(false)} />
						<Box className={styles.messages}>
							<ChatAIMessageBox
								role="assistant"
								language={language}
								text={
									language === 'en'
										? 'Which store is your question about?'
										: 'Quel magasin est concerné par votre question ?'
								}
							>
								<Stack spacing={1} sx={{ mt: 1 }}>
									{capabilities.companies.map((item) => (
										<Button
											key={item.id}
											variant="outlined"
											size="small"
											onClick={() => setSelection({ owner: profile.id, company: item.id })}
										>
											{item.name}
										</Button>
									))}
								</Stack>
							</ChatAIMessageBox>
						</Box>
					</>
				)}
			</ChatAIInterface>
		</Portal>
	);
};
