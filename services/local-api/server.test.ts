import { afterEach, describe, expect, it, vi } from 'vitest';
import { INITIAL_ROOMS } from '@/config/hotelData';
import { RoomStatus, TaskStatus } from '@/types/housekeeping.types';
import { localServer } from '@/services/local-api/server';

const actor = { id: 'user-maria', name: 'Maria João', role: 'housekeeper' };

afterEach(() => vi.restoreAllMocks());

describe('localServer (persistência + validação)', () => {
  it('sem dados guardados devolve a seed', () => {
    expect(localServer.query().rooms).toHaveLength(INITIAL_ROOMS.length);
  });

  it('um comando persiste e a leitura seguinte já o vê', () => {
    localServer.execute('startTask', { taskId: 'task-101-cleaning' }, actor);

    const started = localServer.query().tasks.find(task => task.id === 'task-101-cleaning');
    expect(started).toMatchObject({ status: TaskStatus.IN_PROGRESS, startedById: 'user-maria' });
    expect(localServer.query().events[0]?.type).toBe('ROOM_STARTED');
  });

  it('dois comandos seguidos acumulam (cada um lê o estado mais recente, sem estado preso em memória)', () => {
    localServer.execute('startTask', { taskId: 'task-101-cleaning' }, actor);
    localServer.execute('finishTask', { taskId: 'task-101-cleaning' }, actor);

    expect(localServer.query().rooms.find(room => room.id === 'room-101')?.operaStatus).toBe(RoomStatus.CLEAN);
    expect(localServer.query().events.slice(0, 2).map(event => event.type)).toEqual(['ROOM_FINISHED', 'ROOM_STARTED']);
  });

  it('devolve a mensagem de confirmação do comando', () => {
    const toast = localServer.execute('moveTask', { taskId: 'task-101-cleaning', targetSheetId: 'sheet-8' }, actor);
    expect(toast).toMatchObject({ key: 'toasts.roomMoved' });
  });

  it('JSON corrompido ou com formato inválido não rebenta: volta à seed e avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    localStorage.setItem('vvp_hk_rooms_v3', '{isto não é json');
    expect(localServer.query().rooms).toHaveLength(INITIAL_ROOMS.length);

    localStorage.setItem('vvp_hk_rooms_v3', JSON.stringify([{ id: 1 }]));
    expect(localServer.query().rooms).toHaveLength(INITIAL_ROOMS.length);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('reset apaga os dados guardados e repõe a seed', () => {
    localServer.execute('recordNotPerformed', { taskId: 'task-101-cleaning', reason: 'DND' as never }, actor);
    localServer.reset();

    expect(localServer.query().tasks.find(task => task.id === 'task-101-cleaning')?.status).toBe(TaskStatus.PENDING);
  });
});
