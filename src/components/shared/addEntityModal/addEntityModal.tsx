'use client';

import { useState } from 'react';
import type React from 'react';
import { Box, Button, Modal, Stack, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import { useLanguage } from '@/utils/hooks';
import type { ApiErrorResponseType } from '@/types/_initTypes';

type EntityPayload = {
	code: string;
	name: string;
	is_active?: boolean;
};

type AddEntityModalProps<T> = {
	open: boolean;
	setOpen: (open: boolean) => void;
	label: string;
	icon: React.ReactNode;
	inputTheme: Theme;
	mutationFn: (data: EntityPayload) => Promise<T>;
	onSuccess?: (entity: T) => void;
};

const normalizeCode = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 40);

const getMutationErrorMessage = (error: unknown, fallback: string): string => {
	const payload =
		(error as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).error ??
		(error as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).data ??
		(error as ApiErrorResponseType);

	if (payload?.details && typeof payload.details === 'object') {
		const firstError = Object.values(payload.details)[0];
		if (firstError) return String(Array.isArray(firstError) ? firstError[0] : firstError);
	}

	return fallback;
};

const AddEntityModal = <T extends { id?: number }>({
	open,
	setOpen,
	label,
	icon,
	inputTheme,
	mutationFn,
	onSuccess,
}: AddEntityModalProps<T>) => {
	const { t } = useLanguage();
	const [name, setName] = useState('');
	const [error, setError] = useState('');
	const close = () => {
		setOpen(false);
		setName('');
		setError('');
	};

	const submit = async () => {
		const cleanedName = name.trim();
		if (!cleanedName) {
			setError(t.validation.required);
			return;
		}
		try {
			const entity = await mutationFn({
				code: normalizeCode(cleanedName) || String(Date.now()),
				name: cleanedName,
				is_active: true,
			});
			onSuccess?.(entity);
			close();
		} catch (mutationError) {
			setError(getMutationErrorMessage(mutationError, t.errors.genericError));
		}
	};

	return (
		<Modal open={open} onClose={close} disableRestoreFocus>
			<Box
				sx={{
					p: 3,
					bgcolor: 'background.paper',
					borderRadius: 2,
					maxWidth: 420,
					width: '90%',
					mx: 'auto',
					mt: '15vh',
					boxShadow: 24,
				}}
			>
				<Typography variant="h6" sx={{ mb: 2 }}>
					{t.common.add} {label}
				</Typography>
				<CustomTextInput
					id={`new_${normalizeCode(label)}`}
					type="text"
					label={`${label} *`}
					value={name}
					onChange={(event) => {
						setName(event.target.value);
						if (error) setError('');
					}}
					error={Boolean(error)}
					helperText={error}
					fullWidth
					size="small"
					theme={inputTheme}
					startIcon={icon}
				/>
				<Stack
					direction="row"
					spacing={1}
					sx={{
						justifyContent: 'flex-end',
						mt: 2,
					}}
				>
					<Button onClick={close}>{t.common.cancel}</Button>
					<Button variant="contained" onClick={() => void submit()}>
						{t.common.add}
					</Button>
				</Stack>
			</Box>
		</Modal>
	);
};

export default AddEntityModal;
