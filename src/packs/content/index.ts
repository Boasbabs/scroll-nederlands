// The scenario packs, in the order the Topics tab lists them: by need, as a
// new arrival meets the situations (docs/topics-and-scenario-packs-plan.md).
import type { Pack } from '../types';
import { baan } from './baan';
import { geld } from './geld';
import { gemeente } from './gemeente';
import { huren } from './huren';
import { onderweg } from './onderweg';
import { werk } from './werk';
import { zorg } from './zorg';

export const packs: Array<Pack> = [gemeente, huren, geld, zorg, werk, baan, onderweg];
