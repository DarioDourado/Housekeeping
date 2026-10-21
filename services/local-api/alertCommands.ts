import type { Command } from './types';
import { findRoom } from './helpers';

export const acknowledgeAlert: Command<{ alertId: string }> = (state, { alertId }, ctx) => ({
  state: {
    ...state,
    alerts: state.alerts.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true, acknowledgedAt: ctx.now.toISOString() } : alert
    )
  }
});

// - pedido/trace da receção ou da supervisão para a equipa do quarto (§13.3)
export const sendTraceAlert: Command<{ roomId: string; message: string }> = (state, { roomId, message }, ctx) => {
  const room = findRoom(state, roomId);
  if (!room) return { state };

  return {
    state: {
      ...state,
      alerts: [
        {
          id: ctx.newId('alt'),
          timestamp: ctx.now.toISOString(),
          roomId,
          roomNumber: room.number,
          targetArea: room.block,
          type: 'RECEPTION_TRACE',
          message: { key: 'alerts.receptionTrace', params: { number: room.number, message } },
          acknowledged: false
        },
        ...state.alerts
      ]
    }
  };
};
