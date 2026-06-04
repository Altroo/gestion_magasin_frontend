import { Tooltip, tooltipClasses, TooltipProps } from '@mui/material';

const DarkTooltip = (props: TooltipProps) => (
	<Tooltip
		{...props}
		arrow
		placement="bottom-end"
		sx={{
			[`& .${tooltipClasses.tooltip}`]: {
				backgroundColor: '#000 !important',
				color: '#fff !important',
				fontSize: '0.75rem !important',
				borderRadius: '4px !important',
				boxShadow: '1px !important',
			},
			[`& .${tooltipClasses.arrow}`]: {
				color: '#000 !important',
			},
		}}
	/>
);

export default DarkTooltip;
