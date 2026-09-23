import { Tooltip, tooltipClasses, TooltipProps } from '@mui/material';

const tooltipSelector = `& .${tooltipClasses.tooltip}`;
const arrowSelector = `& .${tooltipClasses.arrow}`;

const DarkTooltip = (props: TooltipProps) => (
	<Tooltip
		{...props}
		arrow
		placement="bottom-end"
		sx={{
			[tooltipSelector]: {
				backgroundColor: '#000 !important',
				color: '#fff !important',
				fontSize: '0.75rem !important',
				borderRadius: '4px !important',
				boxShadow: '1px !important',
			},
			[arrowSelector]: {
				color: '#000 !important',
			},
		}}
	/>
);

export default DarkTooltip;
