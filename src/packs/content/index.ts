// The scenario packs, in the order the Topics tab lists them: by need, as a
// new arrival meets the situations (docs/topics-and-scenario-packs-plan.md).
import type { Pack } from '../types';
import { baan } from './baan';
import { onderweg } from './onderweg';
import { werk } from './werk';

export const packs: Array<Pack> = [werk, baan, onderweg];
