import type { ReactNode } from 'react';
import { Typography } from '@mui/material';
import type { TypographyProps } from '@mui/material/Typography';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';

type TooltipTextCellProps = TypographyProps & {
	children: ReactNode;
	title?: ReactNode;
};

const TooltipTextCell = ({ children, title, noWrap = true, variant = 'body2', ...typographyProps }: TooltipTextCellProps) => {
	const tooltipTitle = title ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : '');

	return (
		<DarkTooltip title={tooltipTitle}>
			<Typography variant={variant} noWrap={noWrap} {...typographyProps}>
				{children}
			</Typography>
		</DarkTooltip>
	);
};

export default TooltipTextCell;
