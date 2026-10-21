import { localServer } from '@/services/local-api/server';
import type { Actor, CommandArgs, CommandName } from '@/services/local-api';

// - Hoje fala com a API local (localStorage). Com o BE FastAPI, só este ficheiro muda: GET /rooms,
//   GET /plans/{id}/sheets, POST /tasks/{id}/start… (ver 34-backend-fastapi). Os hooks e a UI não mudam.
export const housekeepingTransporter = {
  getRooms: async () => localServer.query().rooms,
  getStays: async () => localServer.query().stays,
  getSections: async () => localServer.query().sections,
  getPlans: async () => localServer.query().plans,
  getSheets: async () => localServer.query().sheets,
  getTasks: async () => localServer.query().tasks,
  getEvents: async () => localServer.query().events,
  getAlerts: async () => localServer.query().alerts,
  getSyncJobs: async () => localServer.query().syncJobs,
  getBlockTeams: async () => localServer.query().blockTeams,

  // - devolve a mensagem de confirmação (toast) que a UI deve mostrar, se houver
  command: async <N extends CommandName>(name: N, args: CommandArgs<N>, actor: Actor) =>
    localServer.execute(name, args, actor),

  reset: async () => localServer.reset()
};
