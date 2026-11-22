import { z } from 'zod';
import { categories } from '../items/domain.ts';

const publicText = (max: number) => z.string().trim().min(1).max(max).refine(
  value => !/[<>@]|https?:|www\.|(?:\d[\s().+/-]*){7}/i.test(value) &&
    Array.from(value).every(character => character.charCodeAt(0) >= 32),
  'Use public-safe text without contact details, links, long numbers or markup.',
);
export const reportFields = z.object({
  title: publicText(100), description: publicText(600), category: z.enum(categories),
  country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  city: publicText(70).refine(value => /^[\p{L}][\p{L}\p{M} .’'-]*$/u.test(value)),
  occurred_on: z.iso.date().refine(value => value <= new Date().toISOString().slice(0, 10)),
  reward: z.number().int().min(0).max(100000000),
  brand: publicText(60).or(z.literal('')).default(''), model: publicText(60).or(z.literal('')).default(''), colour: publicText(40).or(z.literal('')).default(''),
}).strict();
export const listingInput = reportFields.extend({
  kind: z.enum(['lost','found']), itemId: z.uuid().nullable(),
}).strict();
export const directoryQuery = z.object({
  kind: z.enum(['lost','found']).default('lost'), q: z.string().trim().max(80).default(''),
  category: z.enum(categories).optional(), country: z.string().regex(/^[A-Z]{2}$/).optional(),
  city: z.string().trim().min(1).max(70).optional(), since: z.iso.date().optional(), until: z.iso.date().optional(),
  reward: z.enum(['yes','no']).optional(), verified: z.enum(['yes','no']).optional(),
  sort: z.enum(['recent','oldest','reward']).default('recent'),
  page: z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(1),
}).strict().refine(value => !value.since || !value.until || value.since<=value.until);
export type ReportFields = z.infer<typeof reportFields>;
export type Listing = ReportFields & {
  id:string; kind:'lost'|'found'; status:string; verified:boolean; has_photo:boolean; revision?:number;
};
