import { JobTitle, type User } from '@/types/auth.types';

// - Governantas respondem pelas sheets; responsáveis de andares respondem pelos blocos
export const isGovernanta = (user: Pick<User, 'jobTitles'>): boolean => !!user.jobTitles?.includes(JobTitle.GOVERNANTA);
export const isFloorManager = (user: Pick<User, 'jobTitles'>): boolean => !!user.jobTitles?.includes(JobTitle.FLOOR_MANAGER);
