import type { ZodTypeAny } from 'zod';
import type { FormikErrors } from 'formik';

declare module 'zod-formik-adapter' {
	export function toFormikValidationSchema<S extends ZodTypeAny>(
		schema: S,
	): (values: import('zod').infer<S>) => void | object | Promise<FormikErrors<import('zod').infer<S>>>;
}
