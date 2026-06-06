'use client';

import type { ReactNode } from 'react';
import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import {
	Cancel as CancelIcon,
	CheckCircle as ValidateIcon,
	Description as DraftIcon,
} from '@mui/icons-material';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import { magasinStatusLabel } from '@/components/pages/magasin/shared/status-labels';
import type { TranslationDictionary } from '@/types/languageTypes';

type WorkflowStatusChipProps = {
	t: TranslationDictionary;
	status?: string | null;
};

type WorkflowStatusVisual = {
	color: ChipProps['color'];
	icon: (props: SvgIconProps) => ReactNode;
};

const workflowStatusVisuals: Record<string, WorkflowStatusVisual> = {
	received: { color: 'success', icon: (props) => <ValidateIcon {...props} /> },
	validated: { color: 'success', icon: (props) => <ValidateIcon {...props} /> },
	cancelled: { color: 'error', icon: (props) => <CancelIcon {...props} /> },
	draft: { color: 'default', icon: (props) => <DraftIcon {...props} /> },
};

const getWorkflowStatusVisual = (status?: string | null): WorkflowStatusVisual => workflowStatusVisuals[status ?? ''] ?? workflowStatusVisuals.draft;

const WorkflowStatusChip = ({ t, status }: WorkflowStatusChipProps) => {
	const visual = getWorkflowStatusVisual(status);
	const Icon = visual.icon;
	const label = magasinStatusLabel(t, status);

	return (
		<DarkTooltip title={label}>
			<Chip
				size="small"
				color={visual.color}
				variant="outlined"
				icon={<Icon fontSize="small" />}
				label={label}
				sx={{ fontWeight: 600 }}
			/>
		</DarkTooltip>
	);
};

export default WorkflowStatusChip;
