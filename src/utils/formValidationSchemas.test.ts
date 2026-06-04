import {
	loginSchema,
	emailSchema,
	passwordResetConfirmationSchema,
	passwordResetCodeSchema,
	userSchema,
	profilSchema,
	changePasswordSchema,
	posScanSchema,
	storeSchema,
	stockAdjustmentSchema,
	notificationPreferencesSchema,
	saleSchema,
} from './formValidationSchemas';

describe('Zod Schema Validation', () => {
	// ── loginSchema ──
	describe('loginSchema', () => {
		it('validates correct credentials', () => {
			expect(() =>
				loginSchema.parse({ email: 'user@example.com', password: 'securePass1' }),
			).not.toThrow();
		});
		it('fails with invalid email', () => {
			expect(() =>
				loginSchema.parse({ email: 'bad-email', password: 'securePass1' }),
			).toThrow();
		});
		it('fails with short password', () => {
			expect(() =>
				loginSchema.parse({ email: 'user@example.com', password: 'short' }),
			).toThrow();
		});
		it('fails with missing email', () => {
			expect(() => loginSchema.parse({ password: 'securePass1' })).toThrow();
		});
		it('fails with empty password', () => {
			expect(() =>
				loginSchema.parse({ email: 'user@example.com', password: '' }),
			).toThrow();
		});
		it('handles undefined password via preprocess', () => {
			expect(() =>
				loginSchema.parse({ email: 'user@example.com', password: undefined }),
			).toThrow();
		});
		it('accepts optional globalError', () => {
			expect(() =>
				loginSchema.parse({ email: 'user@example.com', password: 'securePass1', globalError: 'some error' }),
			).not.toThrow();
		});
	});

	// ── emailSchema ──
	describe('emailSchema', () => {
		it('validates correct email', () => {
			expect(() => emailSchema.parse({ email: 'user@example.com' })).not.toThrow();
		});
		it('fails with invalid email', () => {
			expect(() => emailSchema.parse({ email: 'not-an-email' })).toThrow();
		});
		it('fails with missing email', () => {
			expect(() => emailSchema.parse({})).toThrow();
		});
	});

	// ── passwordResetConfirmationSchema ──
	describe('passwordResetConfirmationSchema', () => {
		it('validates matching passwords', () => {
			expect(() =>
				passwordResetConfirmationSchema.parse({ new_password: 'newPass123', new_password2: 'newPass123' }),
			).not.toThrow();
		});
		it('fails with short password', () => {
			expect(() =>
				passwordResetConfirmationSchema.parse({ new_password: 'short', new_password2: 'short' }),
			).toThrow();
		});
		it('handles undefined via preprocess', () => {
			expect(() =>
				passwordResetConfirmationSchema.parse({ new_password: undefined, new_password2: undefined }),
			).toThrow();
		});
	});

	// ── passwordResetCodeSchema ──
	describe('passwordResetCodeSchema', () => {
		it('validates 6 single digits', () => {
			expect(() =>
				passwordResetCodeSchema.parse({ one: '1', two: '2', three: '3', four: '4', five: '5', six: '6' }),
			).not.toThrow();
		});
		it('fails with non-digit character', () => {
			expect(() =>
				passwordResetCodeSchema.parse({ one: 'a', two: '2', three: '3', four: '4', five: '5', six: '6' }),
			).toThrow();
		});
		it('fails with empty string', () => {
			expect(() =>
				passwordResetCodeSchema.parse({ one: '', two: '2', three: '3', four: '4', five: '5', six: '6' }),
			).toThrow();
		});
		it('fails with multi-digit string', () => {
			expect(() =>
				passwordResetCodeSchema.parse({ one: '12', two: '2', three: '3', four: '4', five: '5', six: '6' }),
			).toThrow();
		});
	});

	// ── userSchema ──
	describe('userSchema', () => {
		const validUser = {
			first_name: 'Al',
			last_name: 'User',
			email: 'al@example.com',
			gender: 'H',
			is_active: true,
			is_staff: false,
			can_view: true,
			can_print: true,
			can_create: false,
			can_edit: false,
			can_delete: false,
		};

		it('validates required fields', () => {
			expect(() => userSchema.parse(validUser)).not.toThrow();
		});
		it('fails with invalid email', () => {
			expect(() => userSchema.parse({ ...validUser, email: 'invalid-email' })).toThrow();
		});
		it('fails with missing first_name', () => {
			expect(() => userSchema.parse({ ...validUser, first_name: undefined })).toThrow();
		});
		it('fails with empty first_name', () => {
			expect(() => userSchema.parse({ ...validUser, first_name: '' })).toThrow();
		});
		it('fails with missing last_name', () => {
			expect(() => userSchema.parse({ ...validUser, last_name: undefined })).toThrow();
		});
		it('fails with short first_name (min 2)', () => {
			expect(() => userSchema.parse({ ...validUser, first_name: 'A' })).toThrow();
		});
		it('fails with missing gender', () => {
			expect(() => userSchema.parse({ ...validUser, gender: undefined })).toThrow();
		});
		it('handles undefined first_name via preprocess (becomes empty → fails)', () => {
			const result = userSchema.safeParse({ ...validUser, first_name: undefined });
			expect(result.success).toBe(false);
		});
		it('accepts optional avatar fields', () => {
			expect(() =>
				userSchema.parse({ ...validUser, avatar: null, avatar_cropped: null }),
			).not.toThrow();
		});
		it('accepts base64 image avatar', () => {
			expect(() =>
				userSchema.parse({ ...validUser, avatar: 'data:image/png;base64,abc', avatar_cropped: 'data:image/png;base64,def' }),
			).not.toThrow();
		});
	});

	// ── profilSchema ──
	describe('profilSchema', () => {
		it('validates minimal profile', () => {
			expect(() => profilSchema.parse({ first_name: 'Al', last_name: 'User' })).not.toThrow();
		});
		it('fails with empty first name', () => {
			expect(() => profilSchema.parse({ first_name: '', last_name: 'User' })).toThrow();
		});
		it('fails with missing last name', () => {
			expect(() => profilSchema.parse({ first_name: 'Al' })).toThrow();
		});
		it('accepts optional gender', () => {
			expect(() =>
				profilSchema.parse({ first_name: 'Al', last_name: 'User', gender: 'H' }),
			).not.toThrow();
		});
		it('handles undefined gender via preprocess', () => {
			expect(() =>
				profilSchema.parse({ first_name: 'Al', last_name: 'User', gender: undefined }),
			).not.toThrow();
		});
		it('handles empty gender via preprocess', () => {
			expect(() =>
				profilSchema.parse({ first_name: 'Al', last_name: 'User', gender: '' }),
			).not.toThrow();
		});
		it('accepts null avatar fields', () => {
			expect(() =>
				profilSchema.parse({ first_name: 'Al', last_name: 'User', avatar: null, avatar_cropped: null }),
			).not.toThrow();
		});
	});

	// ── changePasswordSchema ──
	describe('changePasswordSchema', () => {
		it('validates all password fields', () => {
			expect(() =>
				changePasswordSchema.parse({
					old_password: 'oldPass123',
					new_password: 'newPass123',
					new_password2: 'newPass123',
				}),
			).not.toThrow();
		});
		it('fails with short old password', () => {
			expect(() =>
				changePasswordSchema.parse({
					old_password: 'short',
					new_password: 'newPass123',
					new_password2: 'newPass123',
				}),
			).toThrow();
		});
		it('fails with empty new password', () => {
			expect(() =>
				changePasswordSchema.parse({
					old_password: 'oldPass123',
					new_password: '',
					new_password2: '',
				}),
			).toThrow();
		});
		it('fails when new passwords do not match', () => {
			const result = changePasswordSchema.safeParse({
				old_password: 'oldPass123',
				new_password: 'newPass123',
				new_password2: 'differentPass',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('posScanSchema', () => {
		it('validates a barcode scan form', () => {
			expect(() => posScanSchema.parse({ barcode: '6111122233344', globalError: '' })).not.toThrow();
		});

		it('fails with an empty barcode', () => {
			expect(() => posScanSchema.parse({ barcode: '' })).toThrow();
		});
	});

	describe('stockAdjustmentSchema', () => {
		it('validates a stock adjustment form', () => {
			expect(() => stockAdjustmentSchema.parse({ product: '1', quantity: '-2', globalError: '' })).not.toThrow();
		});

		it('fails with an empty quantity', () => {
			expect(() => stockAdjustmentSchema.parse({ product: '1', quantity: '' })).toThrow();
		});
	});

	describe('storeSchema', () => {
		it('validates a store form', () => {
			expect(() =>
				storeSchema.parse({
					name: 'MBR SOUTH',
					code: 'MBR_SOUTH',
					address: 'Casablanca',
					phone: '212600000000',
					is_active: true,
					globalError: '',
				}),
			).not.toThrow();
		});

		it('fails with missing name and code', () => {
			expect(() =>
				storeSchema.parse({
					name: '',
					code: '',
					address: '',
					phone: '',
					is_active: true,
				}),
			).toThrow();
		});
	});

	describe('notificationPreferencesSchema', () => {
		it('validates notification preferences', () => {
			expect(() =>
				notificationPreferencesSchema.parse({
					notify_low_stock: true,
					browser_notifications: false,
					low_stock_repeat_hours: '24',
					globalError: '',
				}),
			).not.toThrow();
		});

		it('fails when repeat hours is not positive', () => {
			expect(() =>
				notificationPreferencesSchema.parse({
					notify_low_stock: true,
					browser_notifications: true,
					low_stock_repeat_hours: '0',
				}),
			).toThrow();
		});
	});

	describe('saleSchema', () => {
		const validSale = {
			payment_status: 'paid',
			paid_amount: '120',
			discount_amount: '0',
			note: '',
			lines: [{ product: '1', quantity: '2', unit_price: '60' }],
			globalError: '',
		};

		it('validates a manual sale form', () => {
			expect(() => saleSchema.parse(validSale)).not.toThrow();
		});

		it('fails when no product line is selected', () => {
			expect(() =>
				saleSchema.parse({
					...validSale,
					lines: [{ product: '', quantity: '2', unit_price: '60' }],
				}),
			).toThrow();
		});

		it('fails when the sale has no lines', () => {
			expect(() =>
				saleSchema.parse({
					...validSale,
					lines: [],
				}),
			).toThrow();
		});
	});
});

