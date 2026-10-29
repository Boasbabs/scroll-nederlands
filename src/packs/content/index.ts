// The scenario packs, in the order the Topics tab lists them: by need, as a
// new arrival meets the situations (docs/topics-and-scenario-packs-plan.md).
// Sets (false friends) come after the situations, under their own heading.
import type { Pack } from '../types';
import { baan } from './baan';
import { boodschappen } from './boodschappen';
import { geld } from './geld';
import { gemeente } from './gemeente';
import { huren } from './huren';
import { nood } from './nood';
import { onderweg } from './onderweg';
import { uit } from './uit';
import { valseVrienden } from './valse-vrienden';
import { werk } from './werk';
import { zorg } from './zorg';

export const packs: Array<Pack> = [gemeente, huren, geld, zorg, werk, baan, onderweg, boodschappen, uit, nood, valseVrienden];
