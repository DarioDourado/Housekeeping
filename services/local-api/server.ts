import type { LocalizedText } from '@/types/housekeeping.types';
import { commands, type CommandArgs, type CommandName } from './index';
import { defaultNewId } from './helpers';
import { loadState, resetState, saveState } from './store';
import type { Actor, CommandContext, HousekeepingState } from './types';

// - fachada do "servidor": é o que os transporters chamam (no BE: pedidos HTTP à API FastAPI)
export const localServer = {
  query: (): HousekeepingState => loadState(),

  // - uma leitura → comando puro → uma escrita: sem estado partilhado em memória, sem corridas entre cliques
  execute: <N extends CommandName>(name: N, args: CommandArgs<N>, actor: Actor): LocalizedText | undefined => {
    const context: CommandContext = { actor, now: new Date(), newId: defaultNewId };
    const run = commands[name] as (s: HousekeepingState, a: CommandArgs<N>, c: CommandContext) => { state: HousekeepingState; toast?: LocalizedText };
    const { state, toast } = run(loadState(), args, context);
    saveState(state);
    return toast;
  },

  reset: (): void => resetState()
};
