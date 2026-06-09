import type { ReactNode } from 'react';
import { Typography } from '@mui/material';
import type { TypographyProps } from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';

type TooltipTextCellProps = TypographyProps & {
	children: ReactNode;
	title?: ReactNode;
	fontWeight?: React.CSSProperties['fontWeight'];
	textAlign?: React.CSSProperties['textAlign'];
};

const TooltipTextCell = ({
	children,
	title,
	noWrap = true,
	variant = 'body2',
	fontWeight,
	textAlign,
	sx,
	...typographyProps
}: TooltipTextCellProps) => {
	const tooltipTitle = title ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : '');
	const mergedSx: SxProps<Theme> = {
		...(sx as Record<string, unknown>),
		...(fontWeight === undefined ? {} : { fontWeight }),
		...(textAlign === undefined ? {} : { textAlign }),
	};

	return (
		<DarkTooltip title={tooltipTitle}>
			<Typography variant={variant} noWrap={noWrap} sx={mergedSx} {...typographyProps}>
				{children}
			</Typography>
		</DarkTooltip>
	);
};

export default TooltipTextCell;
