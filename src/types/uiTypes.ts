import type { ReactNode } from 'react';
import type { ChipProps } from '@mui/material/Chip';
import type { SvgIconProps } from '@mui/material/SvgIcon';

export type StatusVisual = {
	color: ChipProps['color'];
	icon: (props: SvgIconProps) => ReactNode;
};
