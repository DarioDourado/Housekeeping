import { localServer } from '@/services/local-api/server';
import type { Actor } from '@/services/local-api';
import type { User } from '@/types/auth.types';

export const staffTransporter = {
  getStaff: async (): Promise<User[]> => localServer.query().staff,

  add: async (user: Omit<User, 'id'>, actor: Actor) => localServer.execute('addStaff', { user }, actor),
  update: async (user: User, actor: Actor) => localServer.execute('updateStaff', { user }, actor),
  remove: async (userId: string, actor: Actor) => localServer.execute('deleteStaff', { userId }, actor)
};
