import {
	genderItemsList,
} from './rawData';
import { translations } from '@/translations';

const t = translations.fr;

describe('items lists', () => {
	describe('genderItemsList', () => {
		it('has two entries with correct codes and values', () => {
			const items = genderItemsList(t);
			expect(items).toHaveLength(2);

			expect(items[0]).toEqual({ code: 'H', value: t.rawData.genders.male });
			expect(items[1]).toEqual({ code: 'F', value: t.rawData.genders.female });

			const codes = items.map((i) => i.code);
			expect(codes).toEqual(['H', 'F']);

			const values = items.map((i) => i.value);
			expect(values).toEqual([t.rawData.genders.male, t.rawData.genders.female]);
		});

		it('contains unique codes', () => {
			const codes = genderItemsList(t).map((i) => i.code);
			const unique = Array.from(new Set(codes));
			expect(unique).toHaveLength(codes.length);
		});
	});
});
