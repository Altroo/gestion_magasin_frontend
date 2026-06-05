import { z } from 'zod';
import {
	INPUT_REQUIRED,
	INPUT_PASSWORD_MIN,
	INPUT_MIN,
	INPUT_MAX,
	MINI_INPUT_EMAIL,
	SHORT_INPUT_REQUIRED,
} from '@/utils/formValidationErrorMessages';
import { getT } from '@/utils/helpers';


const base64ImageField = z.url().or(z.string().startsWith('data:image/')).nullable().optional();

const passwordField = z.preprocess(
	(val) => (val === undefined ? '' : val),
	z
		.string()
		.min(8, { error: () => INPUT_PASSWORD_MIN(8) })
		.nonempty({ error: INPUT_REQUIRED }),
);

const requiredTextField = (min: number, max: number) =>
	z.preprocess(
		(val) => (val === undefined ? '' : val),
		z
			.string()
			.min(min, { error: () => INPUT_MIN(min) })
			.max(max, { error: () => INPUT_MAX(max) })
			.nonempty({ error: INPUT_REQUIRED }),
	);

const requiredNumberTextField = () =>
	z.preprocess(
		(val) => (val === undefined || val === null ? '' : String(val)),
		z
			.string()
			.nonempty({ error: INPUT_REQUIRED })
			.refine((val) => Number.isFinite(Number(val)), { error: INPUT_REQUIRED }),
	);

const requiredPositiveIntegerTextField = () =>
	z.preprocess(
		(val) => (val === undefined || val === null ? '' : String(val)),
		z
			.string()
			.nonempty({ error: INPUT_REQUIRED })
			.refine((val) => Number.isInteger(Number(val)) && Number(val) > 0, { error: INPUT_REQUIRED }),
	);

const requiredChoiceTextField = () =>
	z.preprocess((val) => (val === undefined ? '' : val), z.string().nonempty({ error: INPUT_REQUIRED }));

const optionalChoiceField = () =>
	z.preprocess((val) => (val === undefined || val === null || val === '' ? undefined : val), z.string().optional());

const optionalTextField = (min: number, max: number) =>
	z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? undefined : val),
		z
			.string()
			.min(min, { error: () => INPUT_MIN(min) })
			.max(max, { error: () => INPUT_MAX(max) })
			.optional(),
	);

const singleDigit = z
	.string()
	.min(1, { error: SHORT_INPUT_REQUIRED })
	.regex(/^\d$/, { error: SHORT_INPUT_REQUIRED })
	.transform((val) => Number(val));

export const loginSchema = z.object({
	email: z.email({ error: MINI_INPUT_EMAIL }),
	password: passwordField,
	globalError: optionalTextField(1, 500),
});

export const emailSchema = z.object({
	email: z.email({ error: MINI_INPUT_EMAIL }),
	globalError: optionalTextField(1, 500),
});

export const passwordResetConfirmationSchema = z.object({
	new_password: passwordField,
	new_password2: passwordField,
	globalError: optionalTextField(1, 500),
});

export const passwordResetCodeSchema = z.object({
	one: singleDigit,
	two: singleDigit,
	three: singleDigit,
	four: singleDigit,
	five: singleDigit,
	six: singleDigit,
	globalError: optionalTextField(1, 500),
});

export const userSchema = z.object({
	// REQUIRED FIELDS
	first_name: requiredTextField(2, 255),
	last_name: requiredTextField(2, 255),
	email: z.email({ error: MINI_INPUT_EMAIL }),
	gender: requiredChoiceTextField(),
	is_active: z.boolean(),
	is_staff: z.boolean(),
	// OPTIONAL FIELDS
	can_view: z.boolean(),
	can_print: z.boolean(),
	can_create: z.boolean(),
	can_edit: z.boolean(),
	can_delete: z.boolean(),
	can_create_promotion: z.boolean(),
	stores: z
		.array(
			z.object({
				membership_id: z.number(),
				store_id: z.number(),
				store_name: z.string(),
				role: z.string().min(1, { error: INPUT_REQUIRED }),
				role_name: z.string().optional(),
				is_active: z.boolean().optional(),
			}),
		)
		.optional(),
	avatar: base64ImageField,
	avatar_cropped: base64ImageField,
	globalError: optionalTextField(1, 500),
});

export const profilSchema = z.object({
	first_name: requiredTextField(2, 30),
	last_name: requiredTextField(2, 30),
	gender: optionalChoiceField(),
	avatar: base64ImageField,
	avatar_cropped: base64ImageField,
});

export const changePasswordSchema = z
	.object({
		old_password: z.string().min(1, { error: INPUT_REQUIRED }).min(8, { error: () => INPUT_PASSWORD_MIN(8) }),
		new_password: z.string().min(1, { error: INPUT_REQUIRED }).min(8, { error: () => INPUT_PASSWORD_MIN(8) }),
		new_password2: z.string().min(1, { error: INPUT_REQUIRED }),
		globalError: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.new_password !== data.new_password2) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: getT().validation.passwordMismatch,
				path: ['new_password2'],
			});
		}
	});

export const posScanSchema = z.object({
	barcode: requiredTextField(1, 80),
	globalError: optionalTextField(1, 500),
});

export const productSchema = z.object({
	reference: optionalTextField(1, 80),
	barcode: requiredTextField(1, 80),
	name: requiredTextField(2, 255),
	category: requiredNumberTextField(),
	unit: requiredNumberTextField(),
	purchase_price: requiredNumberTextField(),
	wholesale_price: requiredNumberTextField(),
	detail_price: requiredNumberTextField(),
	counter_price: requiredNumberTextField(),
	default_stock_alert: requiredNumberTextField(),
	expiration_date: optionalTextField(1, 20),
	shelf_life_days: optionalTextField(1, 10),
	is_active: z.boolean(),
	globalError: optionalTextField(1, 500),
});

export const storeSchema = z.object({
	name: requiredTextField(2, 160),
	code: requiredTextField(2, 40),
	address: optionalTextField(1, 255),
	phone: optionalTextField(1, 40),
	is_active: z.boolean(),
	is_global_stock: z.boolean().optional(),
	managed_by: z.array(z.object({ pk: z.number(), role: z.string().min(1) })).min(1, { error: INPUT_REQUIRED }),
	globalError: optionalTextField(1, 500),
});

export const saleSchema = z.object({
	payment_status: requiredChoiceTextField(),
	paid_amount: requiredNumberTextField(),
	discount_amount: requiredNumberTextField(),
	note: optionalTextField(1, 500),
	lines: z
		.array(
			z.object({
				type: z.enum(['product', 'promotion']),
				product: optionalTextField(1, 50),
				promotion: optionalTextField(1, 50),
				quantity: requiredNumberTextField(),
				unit_price: requiredNumberTextField(),
			}).superRefine((line, ctx) => {
				if (line.type === 'product' && !line.product) {
					ctx.addIssue({ code: z.ZodIssueCode.custom, message: INPUT_REQUIRED(), path: ['product'] });
				}
				if (line.type === 'promotion' && !line.promotion) {
					ctx.addIssue({ code: z.ZodIssueCode.custom, message: INPUT_REQUIRED(), path: ['promotion'] });
				}
			}),
		)
		.min(1, { error: INPUT_REQUIRED }),
	globalError: optionalTextField(1, 500),
});

export const expenseSchema = z.object({
	category: requiredNumberTextField(),
	label: requiredTextField(2, 180),
	amount: requiredNumberTextField(),
	payment_status: requiredChoiceTextField(),
	payment_mode: requiredChoiceTextField(),
	expense_date: requiredChoiceTextField(),
	note: optionalTextField(1, 500),
	globalError: optionalTextField(1, 500),
});

export const purchaseSchema = z.object({
	store: requiredNumberTextField(),
	supplier_name: optionalTextField(1, 160),
	reference: optionalTextField(1, 80),
	purchase_date: requiredChoiceTextField(),
	status: requiredChoiceTextField(),
	note: optionalTextField(1, 500),
	lines: z
		.array(
			z.object({
				product: requiredNumberTextField(),
				quantity: requiredNumberTextField(),
				unit_cost: requiredNumberTextField(),
			}),
		)
		.min(1, { error: INPUT_REQUIRED }),
	globalError: optionalTextField(1, 500),
});

export const inventorySchema = z.object({
	code: requiredTextField(2, 80),
	title: requiredTextField(2, 160),
	inventory_date: requiredChoiceTextField(),
	status: requiredChoiceTextField(),
	note: optionalTextField(1, 500),
	lines: z
		.array(
			z.object({
				product: requiredNumberTextField(),
				expected_quantity: requiredNumberTextField(),
				counted_quantity: requiredNumberTextField(),
				note: optionalTextField(1, 255),
			}),
		)
		.min(1, { error: INPUT_REQUIRED }),
	globalError: optionalTextField(1, 500),
});

export const stockTransferSchema = z.object({
	target_store: requiredNumberTextField(),
	reference: optionalTextField(1, 80),
	transfer_date: requiredChoiceTextField(),
	status: requiredChoiceTextField(),
	note: optionalTextField(1, 500),
	lines: z
		.array(
			z.object({
				product: requiredNumberTextField(),
				quantity: requiredNumberTextField(),
			}),
		)
		.min(1, { error: INPUT_REQUIRED }),
	globalError: optionalTextField(1, 500),
});

export const promotionSchema = z.object({
	name: requiredTextField(2, 160),
	selling_price: requiredNumberTextField(),
	status: requiredChoiceTextField(),
	start_date: optionalTextField(1, 20),
	end_date: optionalTextField(1, 20),
	note: optionalTextField(1, 500),
	lines: z
		.array(
			z.object({
				product: requiredNumberTextField(),
				quantity: requiredNumberTextField(),
			}),
		)
		.min(1, { error: INPUT_REQUIRED }),
	globalError: optionalTextField(1, 500),
});

export const stockAdjustmentSchema = z.object({
	product: requiredNumberTextField(),
	quantity: requiredNumberTextField(),
	min_stock: optionalTextField(1, 20),
	note: optionalTextField(1, 500),
	globalError: optionalTextField(1, 500),
});

export const stockThresholdSchema = z.object({
	product: requiredNumberTextField(),
	quantity: optionalTextField(1, 20),
	min_stock: requiredNumberTextField(),
	note: optionalTextField(1, 500),
	globalError: optionalTextField(1, 500),
});

export const attendanceSchema = z.object({
	employee: requiredNumberTextField(),
	date: requiredChoiceTextField(),
	clock_in: optionalTextField(1, 20),
	break_start: optionalTextField(1, 20),
	break_end: optionalTextField(1, 20),
	clock_out: optionalTextField(1, 20),
	hours_worked: requiredNumberTextField(),
	delay_minutes: requiredNumberTextField(),
	status: requiredChoiceTextField(),
	responsible: optionalTextField(1, 160),
	observations: optionalTextField(1, 500),
	globalError: optionalTextField(1, 500),
});

export const notificationPreferencesSchema = z.object({
	notify_low_stock: z.boolean(),
	browser_notifications: z.boolean(),
	low_stock_repeat_hours: requiredPositiveIntegerTextField(),
	globalError: optionalTextField(1, 500),
});

