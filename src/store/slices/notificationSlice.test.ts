import reducer, { incrementUnreadCount, setLatestNotification, setUnreadCount } from './notificationSlice';
import type { NotificationType } from '@/types/gestionMagasinTypes';

describe('notification slice', () => {
	const notification: NotificationType = {
		id: 1,
		title: 'Stock minimum atteint',
		message: 'Article test au minimum',
		notification_type: 'low_stock',
		object_id: 12,
		store: 2,
		product: 12,
		is_read: false,
		date_created: '2026-06-03T10:00:00Z',
	};

	it('tracks unread count', () => {
		expect(reducer(undefined, setUnreadCount(4)).unreadCount).toBe(4);
		expect(reducer({ unreadCount: 4, latestNotification: null }, incrementUnreadCount()).unreadCount).toBe(5);
	});

	it('stores latest notification', () => {
		const state = reducer(undefined, setLatestNotification(notification));
		expect(state.latestNotification).toEqual(notification);
	});
});
