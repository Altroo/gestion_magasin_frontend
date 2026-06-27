import type { UserStoreAssignmentType } from '@/types/gestionMagasinTypes';

export class UserClass {
	constructor(
		public readonly id: number,
		public first_name: string,
		public last_name: string,
		public email: string,
		public gender: string,
		public avatar: string | ArrayBuffer | null,
		public avatar_cropped: string | ArrayBuffer | null,
		public is_staff: boolean,
		public is_active: boolean,
		public default_password_set: boolean,
		public date_joined: string | null,
		public date_updated: string | null,
		public last_login: string | null,
		// Per-user permission flags
		public can_view: boolean,
		public can_print: boolean,
		public can_create: boolean,
		public can_edit: boolean,
		public can_delete: boolean,
		public can_create_promotion: boolean = false,
		public can_wholesale_sale: boolean = false,
		public stores?: UserStoreAssignmentType[],
	) {}
}
