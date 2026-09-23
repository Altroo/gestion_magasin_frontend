'use client';

import { Chip } from '@mui/material';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import { magasinStatusLabel } from '@/components/pages/magasin/shared/status-labels';
import type { TranslationDictionary } from '@/types/languageTypes';
import type { StatusVisual } from '@/types/uiTypes';
import { WORKFLOW_STATUS_VISUALS } from '@/utils/rawData';

type WorkflowStatusChipProps = {
	t: TranslationDictionary;
	status?: string | null;
};

const getWorkflowStatusVisual = (status?: string | null): StatusVisual =>
	WORKFLOW_STATUS_VISUALS[status ?? ''] ?? WORKFLOW_STATUS_VISUALS.draft;

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
