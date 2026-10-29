// The scenario packs, in the order the Topics tab lists them: by need, as a
// new arrival meets the situations (docs/topics-and-scenario-packs-plan.md).
import type { Pack } from '../types';
import { geld } from './geld';
import { gemeente } from './gemeente';
import { huren } from './huren';

export const packs: Array<Pack> = [gemeente, huren, geld];
