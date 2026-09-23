export interface ChipSelectOption {
	id: string;
	nom: string;
}

export interface ChipFilterConfig {
	key: string;
	label: string;
	paramName: string;
	options: ChipSelectOption[];
}
