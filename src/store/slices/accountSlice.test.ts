import reducer, { setProfil, setWSUserAvatar } from './accountSlice';
import { UserClass } from '@/models/classes';

describe('account slice', () => {
	const sampleUser = new UserClass(
		1,
		'John',
		'Doe',
		'john.doe@example.com',
		'M',
		'avatar-initial',
		null,
		false,
		true,
		false,
		'2024-01-01T00:00:00Z',
		'2024-06-01T00:00:00Z',
		'2024-06-01T00:00:00Z',
		true,   // can_view
		false,  // can_print
		true,   // can_create
		false,  // can_edit
		false,  // can_delete
	);

	it('returns the initial state when given undefined state', () => {
		const state = reducer(undefined, { type: '@@INIT' });
		expect(state).toEqual({ profil: {} });
	});

	it('setProfil stores the provided UserClass instance into profil', () => {
		const next = reducer(undefined, setProfil(sampleUser));
		expect(next.profil).toBe(sampleUser);
		expect((next.profil as UserClass).email).toBe('john.doe@example.com');
	});

	it('setWSUserAvatar updates profil.avatar when profil is a UserClass', () => {
		const stateWithProfil = { profil: { ...sampleUser } };
		const updated = reducer(stateWithProfil, setWSUserAvatar({ avatar: 'avatar-updated' }));
		expect((updated.profil as UserClass).avatar).toBe('avatar-updated');
	});

	it('setWSUserAvatar does not throw when profil is plain object', () => {
		const plainState = { profil: {} };
		const updated = reducer(plainState, setWSUserAvatar({ avatar: 'avatar-set' }));
		expect((updated.profil as Record<string, unknown>).avatar).toBe('avatar-set');
	});
});
