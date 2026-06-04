import { UserClass } from './classes';

describe('UserClass', () => {
	const makeUser = (overrides?: Partial<ConstructorParameters<typeof UserClass>>) => {
		const args: ConstructorParameters<typeof UserClass> = [
			1,
			'John',
			'Doe',
			'john@example.com',
			'Homme',
			null,
			null,
			false,
			true,
			false,
			'2024-01-01',
			'2024-06-01',
			'2024-05-31',
			true,
			false,
			true,
			false,
			false,
		];
		if (overrides) {
			overrides.forEach((value, index) => {
				if (value !== undefined) {
					(args as unknown[])[index] = value;
				}
			});
		}
		return new UserClass(...args);
	};

	it('creates a UserClass instance with all properties', () => {
		const user = makeUser();
		expect(user.id).toBe(1);
		expect(user.first_name).toBe('John');
		expect(user.last_name).toBe('Doe');
		expect(user.email).toBe('john@example.com');
		expect(user.gender).toBe('Homme');
		expect(user.avatar).toBeNull();
		expect(user.avatar_cropped).toBeNull();
		expect(user.is_staff).toBe(false);
		expect(user.is_active).toBe(true);
		expect(user.default_password_set).toBe(false);
		expect(user.date_joined).toBe('2024-01-01');
		expect(user.date_updated).toBe('2024-06-01');
		expect(user.last_login).toBe('2024-05-31');
	});

	it('stores permission flags correctly', () => {
		const user = makeUser();
		expect(user.can_view).toBe(true);
		expect(user.can_print).toBe(false);
		expect(user.can_create).toBe(true);
		expect(user.can_edit).toBe(false);
		expect(user.can_delete).toBe(false);
	});

	it('allows mutating non-readonly properties', () => {
		const user = makeUser();
		user.first_name = 'Jane';
		expect(user.first_name).toBe('Jane');
	});

	it('creates a staff user with all permissions', () => {
		const user = new UserClass(
			2,
			'Admin',
			'User',
			'admin@example.com',
			'Femme',
			null,
			null,
			true,
			true,
			false,
			'2023-01-01',
			'2024-01-01',
			'2024-01-01',
			true,
			true,
			true,
			true,
			true,
		);
		expect(user.is_staff).toBe(true);
		expect(user.can_view).toBe(true);
		expect(user.can_print).toBe(true);
		expect(user.can_create).toBe(true);
		expect(user.can_edit).toBe(true);
		expect(user.can_delete).toBe(true);
	});
});
