'use client';

import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, useTheme, useMediaQuery, Box } from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { useLanguage } from '@/utils/hooks';

export type ActionItem = {
	label: string;
	icon: React.ReactNode;
	onClick: (event?: React.MouseEvent<HTMLElement>) => void;
	color?: 'inherit' | 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
	show?: boolean;
};

type MobileActionsMenuProps = {
	actions: ActionItem[];
};

const MobileActionsMenu: React.FC<MobileActionsMenuProps> = ({ actions }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const { t } = useLanguage();

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		event.stopPropagation();
		setAnchorEl(event.currentTarget);
	};

	const handleClose = (event?: React.MouseEvent) => {
		if (event) {
			event.stopPropagation();
		}
		setAnchorEl(null);
	};

	const handleMenuItemClick = (event: React.MouseEvent, action: ActionItem) => {
		event.stopPropagation();
		handleClose();
		action.onClick(event as React.MouseEvent<HTMLElement>);
	};

	// Filter actions based on show property (default to true if not specified)
	const visibleActions = actions.filter((action) => action.show !== false);

	// On mobile, show a three-dot menu
	if (isMobile) {
		return (
			<>
				<IconButton
					size="small"
					onClick={handleClick}
					aria-label={t.accessibility.moreActions}
					aria-controls={open ? 'actions-menu' : undefined}
					aria-haspopup="true"
					aria-expanded={open ? 'true' : undefined}
				>
					<MoreVertIcon />
				</IconButton>
				<Menu
					id="actions-menu"
					anchorEl={anchorEl}
					open={open}
					onClose={() => handleClose()}
					slotProps={{
						list: {
							'aria-labelledby': 'more-actions-button',
						},
					}}
					anchorOrigin={{
						vertical: 'bottom',
						horizontal: 'right',
					}}
					transformOrigin={{
						vertical: 'top',
						horizontal: 'right',
					}}
				>
					{visibleActions.map((action, index) => (
						<MenuItem key={index} onClick={(e) => handleMenuItemClick(e, action)}>
							<ListItemIcon sx={{ color: action.color ? `${action.color}.main` : 'inherit' }}>
								{action.icon}
							</ListItemIcon>
							<ListItemText>{action.label}</ListItemText>
						</MenuItem>
					))}
				</Menu>
			</>
		);
	}

	// On desktop, show individual icon buttons
	return (
		<Box sx={{ display: 'flex', gap: 1 }}>
			{visibleActions.map((action, index) => (
				<IconButton
					key={index}
					size="small"
					color={action.color}
					onClick={(e) => {
						e.stopPropagation();
						action.onClick(e);
					}}
					aria-label={action.label}
				>
					{action.icon}
				</IconButton>
			))}
		</Box>
	);
};

export default MobileActionsMenu;
