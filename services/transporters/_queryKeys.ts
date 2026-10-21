// - chaves centralizadas (07-react-query); inclui o contexto de que depende o dado
export const queryKeys = {
  housekeeping: {
    all: ['housekeeping'] as const,
    rooms: () => [...queryKeys.housekeeping.all, 'rooms'] as const,
    stays: () => [...queryKeys.housekeeping.all, 'stays'] as const,
    sections: () => [...queryKeys.housekeeping.all, 'sections'] as const,
    plans: () => [...queryKeys.housekeeping.all, 'plans'] as const,
    sheets: () => [...queryKeys.housekeeping.all, 'sheets'] as const,
    tasks: () => [...queryKeys.housekeeping.all, 'tasks'] as const,
    events: () => [...queryKeys.housekeeping.all, 'events'] as const,
    alerts: () => [...queryKeys.housekeeping.all, 'alerts'] as const,
    syncJobs: () => [...queryKeys.housekeeping.all, 'sync-jobs'] as const,
    blockTeams: () => [...queryKeys.housekeeping.all, 'block-teams'] as const
  },
  staff: {
    all: ['staff'] as const,
    list: () => [...queryKeys.staff.all, 'list'] as const
  },
  chat: {
    all: ['chat'] as const,
    channels: () => [...queryKeys.chat.all, 'channels'] as const,
    messages: (channelId: string) => [...queryKeys.chat.all, 'messages', channelId] as const
  }
};
