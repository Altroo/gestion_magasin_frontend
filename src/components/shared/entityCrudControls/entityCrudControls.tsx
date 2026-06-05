'use client';

import React, { useMemo, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack } from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import type { Theme } from '@mui/material/styles';
import type { DropDownType } from '@/types/accountTypes';
import type { ApiErrorResponseType } from '@/types/_initTypes';
import AddEntityModal from '@/components/shared/addEntityModal/addEntityModal';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import { useLanguage } from '@/utils/hooks';

type EntityPayload = {
	code: string;
	name: string;
	is_active?: boolean;
};

type EntityCrudControlsProps<T> = {
	label: string;
	icon: React.ReactNode;
	inputTheme: Theme;
	selectedItem: DropDownType | null;
	addEntity: (data: EntityPayload) => Promise<T>;
	editEntity: (args: { id: number; data: Partial<EntityPayload> }) => Promise<T>;
	deleteEntity: (args: { id: number }) => Promise<unknown>;
	onAddSuccess: (id: number) => void;
	onDeleteSuccess?: () => void;
	disabled?: boolean;
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

const EntityCrudControls = <T extends { id?: number },>({
	label,
	icon,
	inputTheme,
	selectedItem,
	addEntity,
	editEntity,
	deleteEntity,
	onAddSuccess,
	onDeleteSuccess,
	disabled = false,
}: EntityCrudControlsProps<T>) => {
	const { t } = useLanguage();
	const [openAddModal, setOpenAddModal] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [editName, setEditName] = useState('');
	const [editError, setEditError] = useState<string | null>(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);

	const selectedId = useMemo(() => {
		if (!selectedItem?.value) return null;
		const parsed = Number(selectedItem.value);
		return Number.isFinite(parsed) ? parsed : null;
	}, [selectedItem]);

	const handleEditOpen = () => {
		if (!selectedItem?.code) return;
		setEditName(selectedItem.code);
		setEditError(null);
		setEditOpen(true);
	};

	const handleEditSubmit = async () => {
		const cleanedName = editName.trim();
		if (!selectedId || !cleanedName) return;
		setActionLoading(true);
		try {
			await editEntity({
				id: selectedId,
				data: {
					code: normalizeCode(cleanedName) || String(selectedId),
					name: cleanedName,
					is_active: true,
				},
			});
			setEditOpen(false);
		} catch (error) {
			setEditError(getMutationErrorMessage(error, t.errors.genericError));
		} finally {
			setActionLoading(false);
		}
	};

	const handleDeleteConfirm = async () => {
		if (!selectedId) return;
		setActionLoading(true);
		try {
			await deleteEntity({ id: selectedId });
			setDeleteOpen(false);
			onDeleteSuccess?.();
		} finally {
			setActionLoading(false);
		}
	};

	return (
		<>
			<Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', ml: 1 }}>
				{selectedItem && (
					<>
						<IconButton size="small" onClick={handleEditOpen} title={t.common.update} disabled={disabled}>
							<EditIcon fontSize="small" />
						</IconButton>
						<IconButton size="small" onClick={() => setDeleteOpen(true)} title={t.common.delete} color="error" disabled={disabled}>
							<DeleteIcon fontSize="small" />
						</IconButton>
					</>
				)}
				<Button size="small" variant="outlined" onClick={() => setOpenAddModal(true)} disabled={disabled}>
					{t.common.add}
				</Button>
			</Stack>

			<AddEntityModal
				open={openAddModal}
				setOpen={setOpenAddModal}
				label={label}
				icon={icon}
				inputTheme={inputTheme}
				mutationFn={addEntity}
				onSuccess={(entity) => {
					if (typeof entity.id === 'number') onAddSuccess(entity.id);
				}}
			/>

			<Dialog open={editOpen} onClose={() => setEditOpen(false)}>
				<DialogTitle>{`${t.common.update} ${label}`}</DialogTitle>
				<DialogContent>
					<Stack sx={{ mt: 1 }}>
						<CustomTextInput
							id={`edit_${label}`}
							type="text"
							label={label}
							fullWidth
							size="small"
							value={editName}
							onChange={(event) => {
								setEditName(event.target.value);
								if (editError) setEditError(null);
							}}
							error={Boolean(editError)}
							helperText={editError ?? ''}
							theme={inputTheme}
							startIcon={icon}
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setEditOpen(false)}>{t.common.cancel}</Button>
					<Button onClick={() => void handleEditSubmit()} variant="contained" disabled={actionLoading || !editName.trim()}>
						{t.common.update}
					</Button>
				</DialogActions>
			</Dialog>

			{deleteOpen && selectedItem && (
				<ActionModals
					title={`${t.common.delete} ${label}`}
					body={`${t.common.delete} ${selectedItem.code} ?`}
					actions={[
						{
							text: t.common.cancel,
							active: false,
							onClick: () => setDeleteOpen(false),
							icon: <CloseIcon />,
							color: '#6B6B6B',
						},
						{
							text: t.common.delete,
							active: true,
							onClick: () => void handleDeleteConfirm(),
							icon: <DeleteIcon />,
							color: '#D32F2F',
							disabled: actionLoading,
						},
					]}
					onClose={() => setDeleteOpen(false)}
				/>
			)}
		</>
	);
};

export default EntityCrudControls;
