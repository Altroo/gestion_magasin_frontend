import { getSession } from 'next-auth/react';
import { handleUnauthorized } from '@/utils/helpers';
import type { NavigationTarget } from './types';

export class ChatAPIError extends Error {
	constructor(public code: string) {
		super(code);
	}
}

export const chatRequest = async (path: string, token: string, init: RequestInit = {}) => {
	const request = (access: string) =>
		fetch(`${process.env.NEXT_PUBLIC_ROOT_API_URL}/ai/v1/${path}`, {
			...init,
			cache: 'no-store',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}`, ...init.headers },
		});
	let response = await request(token);
	if (response.status === 401) {
		const fresh = await getSession();
		if (fresh?.accessToken && fresh.accessToken !== token) response = await request(fresh.accessToken);
		if (response.status === 401) {
			await handleUnauthorized();
			throw new ChatAPIError('NOT_AUTHENTICATED');
		}
	}
	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		throw new ChatAPIError(
			data.error?.code || (response.status === 403 ? 'PERMISSION_DENIED' : 'APPLICATION_UNAVAILABLE'),
		);
	}
	return response;
};

export const consumeChatStream = async (response: Response, receive: (event: string, data: unknown) => void) => {
	if (!response.body) throw new ChatAPIError('INCOMPLETE_RESPONSE');
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let completed = false;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			if (buffer.length > 100000) throw new ChatAPIError('INVALID_MODEL_OUTPUT');
			let boundary: number;
			while ((boundary = buffer.indexOf('\n\n')) !== -1) {
				const block = buffer.slice(0, boundary);
				buffer = buffer.slice(boundary + 2);
				const event = block
					.split('\n')
					.find((line) => line.startsWith('event: '))
					?.slice(7);
				const data = block
					.split('\n')
					.filter((line) => line.startsWith('data: '))
					.map((line) => line.slice(6))
					.join('\n');
				if (!event || !data) continue;
				const payload = JSON.parse(data);
				if (event === 'error') throw new ChatAPIError(payload.code || 'INTERNAL_ERROR');
				receive(event, payload);
				if (event === 'message.completed') completed = true;
			}
		}
		if (!completed) throw new ChatAPIError('INCOMPLETE_RESPONSE');
	} finally {
		reader.releaseLock();
	}
};

export const safeNavigation = (target: NavigationTarget, companyId: number) => {
	if (
		target.application !== 'gestion_magasin' ||
		!Number.isSafeInteger(companyId) ||
		companyId < 1 ||
		target.company_id !== companyId
	)
		return null;
	const lists: Record<string, string> = {
		products: 'article',
		stock_list: 'stock',
		store_stock: 'store-stock',
		sales: 'sales',
		purchases: 'purchases',
		transfers: 'stock-transfers',
		inventories: 'inventory',
		expenses: 'expenses',
		promotions: 'promotions',
		attendance_list: 'pointage',
		stores: 'stores',
		users: 'users',
		dashboard: '',
		pos: 'caise',
	};
	const details: Record<string, string> = {
		product: 'article',
		stock: 'stock',
		sale: 'sales',
		purchase: 'purchases',
		transfer: 'stock-transfers',
		inventory: 'inventory',
		expense: 'expenses',
		promotion: 'promotions',
		attendance: 'pointage',
		store: 'stores',
		user: 'users',
	};
	const resource = target.resource;
	let expected: string;
	if (Object.hasOwn(lists, resource) && target.identifier === null) expected = '/dashboard/' + lists[resource];
	else if (resource.endsWith('_new') && Object.hasOwn(details, resource.slice(0, -4)) && target.identifier === null)
		expected = '/dashboard/' + details[resource.slice(0, -4)] + '/new';
	else {
		const edit = resource.endsWith('_edit');
		const base = edit ? resource.slice(0, -5) : resource;
		if (
			!Object.hasOwn(details, base) ||
			(edit && base === 'sale') ||
			!Number.isSafeInteger(target.identifier) ||
			target.identifier! < 1 ||
			target.identifier! > 2147483647
		)
			return null;
		expected = '/dashboard/' + details[base] + '/' + target.identifier + (edit ? '/edit' : '');
	}
	const base = resource.replace(/_(?:new|edit)$/, '');
	if (!['user', 'users', 'store', 'stores'].includes(base)) expected += '?store_id=' + companyId;
	return target.path === expected ? expected : null;
};
export const downloadSaleDocument = async (
	id: number,
	companyId: number,
	token: string,
	format: 'pdf' | 'docx' = 'pdf',
	language: 'fr' | 'en' = 'fr',
) => {
	if (
		format !== 'pdf' ||
		!['fr', 'en'].includes(language) ||
		!Number.isSafeInteger(companyId) ||
		companyId < 1 ||
		!Number.isSafeInteger(id) ||
		id < 1
	)
		throw new ChatAPIError('INVALID_ARGUMENTS');
	const request = (access: string) =>
		fetch(
			`${process.env.NEXT_PUBLIC_ROOT_API_URL}/ai/v1/documents/${id}/?company_id=${companyId}&language=${language}`,
			{
				cache: 'no-store',
				headers: { Authorization: `Bearer ${access}` },
			},
		);
	let response = await request(token);
	if (response.status === 401) {
		const fresh = await getSession();
		if (fresh?.accessToken && fresh.accessToken !== token) response = await request(fresh.accessToken);
		if (response.status === 401) {
			await handleUnauthorized();
			throw new ChatAPIError('NOT_AUTHENTICATED');
		}
	}
	if (!response.ok) throw new ChatAPIError(response.status === 403 ? 'PERMISSION_DENIED' : 'APPLICATION_UNAVAILABLE');
	const content = await response.blob();
	const url = URL.createObjectURL(content);
	const link = document.createElement('a');
	link.href = url;
	link.download = `vente-${id}.pdf`;
	link.click();
	URL.revokeObjectURL(url);
};
