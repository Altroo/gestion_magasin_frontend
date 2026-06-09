import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Stack, Avatar } from '@mui/material';

type Action = {
	active: boolean;
	text: string;
	onClick: () => void;
	color?: string;
	icon?: React.ReactNode;
	disabled?: boolean;
};

type Props = {
	title: string;
	actions: Action[];
	actionsStyle?: string[];
	body?: string;
	children?: React.ReactNode;
	titleIcon?: React.ReactNode;
	titleIconColor?: string;
	/** Called when the dialog is dismissed via backdrop click or Escape key. */
	onClose?: () => void;
};

const ActionModals: React.FC<Props> = ({
	title,
	actions,
	actionsStyle,
	body,
	children,
	titleIcon,
	titleIconColor,
	onClose,
}) => {
	const handleClose = () => {
		if (onClose) {
			onClose();
			return;
		}
		// Fallback: find the first non-active action (typically the cancel button)
		const cancelAction = actions.find((a) => !a.active);
		if (cancelAction) {
			cancelAction.onClick();
		}
	};

	return (
		<Dialog open onClose={handleClose}>
			<DialogTitle>
				<Stack
					direction="row"
					spacing={1}
					sx={{
						alignItems: 'center',
					}}
				>
					{titleIcon && (
						<Avatar
							variant="rounded"
							sx={{
								bgcolor: titleIconColor ?? 'transparent',
								color: titleIconColor ? '#fff' : 'inherit',
								width: 36,
								height: 36,
							}}
						>
							{titleIcon}
						</Avatar>
					)}
					<Typography variant="h6">{title}</Typography>
				</Stack>
			</DialogTitle>
			<DialogContent dividers>
				{body && <Typography variant="body2">{body}</Typography>}
				{children}
			</DialogContent>
			<DialogActions className={actionsStyle?.join(' ') ?? undefined} sx={{ padding: 2 }}>
				{actions.map((action, index) => {
					const bg = action.active ? (action.color ?? '#0D070B') : '#FFFFFF';
					const textColor = action.active ? '#FFFFFF' : (action.color ?? '#0D070B');
					const hoverBg = action.active ? (action.color ?? '#0D070B') : '#F5F5F5';

					return (
						<Button
							key={index}
							variant={action.active ? 'contained' : 'outlined'}
							onClick={action.onClick}
							disabled={action.disabled}
							startIcon={action.icon}
							aria-label={action.text}
							sx={{
								backgroundColor: bg,
								color: textColor,
								borderColor: action.active ? (action.color ?? '#0D070B') : undefined,
								textTransform: 'none',
								'&:hover': {
									backgroundColor: hoverBg,
								},
								// ensure good contrast for outlined state
								'&.MuiButton-outlined': {
									borderColor: action.color ?? '#0D070B',
								},
							}}
						>
							{action.text}
						</Button>
					);
				})}
			</DialogActions>
		</Dialog>
	);
};

export default ActionModals;
