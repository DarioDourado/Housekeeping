import type { BlockTeam, Room, TaskSheet } from '../housekeeping.types';
import type { User } from '../auth.types';

export interface CollaboratorDirectoryTabProps {
  users: User[];
  blockTeams: BlockTeam[];
  taskSheets: TaskSheet[];
  rooms: Room[];
  onAddUser: (newUser: Omit<User, 'id'>) => Promise<void>;
  onUpdateUser: (updatedUser: User) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onSwitchUser: (userId: string) => Promise<void>;
}
