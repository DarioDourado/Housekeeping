'use client';

import { useState } from 'react';
import { Room, RoomStatus } from '../../../types/housekeeping.types';
import { useHousekeeping } from '../../../services/hooks/housekeeping/useHousekeeping';
import { useAuth } from '../../../services/hooks/auth/useAuth';
import {
  Moon,
  Check,
  CheckCheck,
  BellOff,
  UserX,
  Users,
  Plus,
  ArrowRightLeft,
  Clock,
  Sparkles,
  Info,
  GripVertical
} from 'lucide-react';

interface TurndownViewProps {
  onOpenDetail: (room: Room) => void;
}

export const TurndownView = ({ onOpenDetail }: TurndownViewProps) => {
  const { user } = useAuth();
  const {
    rooms,
    turndownGroups,
    updateTurndownStatus,
    assignTurndownGroup,
    moveRoomToTurndownGroup,
    recordDND,
    recordRefuseService
  } = useHousekeeping();

  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [draggingRoomId, setDraggingRoomId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, roomId: string) => {
    e.dataTransfer.setData('text/plain', roomId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingRoomId(roomId);
  };

  const handleDragEnd = () => {
    setDraggingRoomId(null);
  };

  const handleGroupDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverGroupId !== groupId) {
      setDragOverGroupId(groupId);
    }
  };

  const handleGroupDrop = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    setDragOverGroupId(null);
    const roomId = e.dataTransfer.getData('text/plain');
    if (roomId) {
      moveRoomToTurndownGroup(roomId, groupId);
    }
  };

  // Filter occupied/in-house rooms requiring turndown
  const turndownRooms = rooms.filter(r => r.turndownRequired);

  const totalDistributed = turndownRooms.length;
  const totalCompleted = turndownRooms.filter(r => r.turndownStatus === RoomStatus.CLEAN || r.turndownStatus === RoomStatus.INSPECTED).length;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-150">
      
      {/* Turndown Banner & Info Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white border border-indigo-800/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">
                Serviço de Turndown (Serviço da Noite)
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 font-medium">
                18h00 – 21h30
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Isolado do Opera
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl">
              Distribuição livre sem interferência com o serviço da manhã. As alterações aqui efetuadas não sobrescrevem as task sheets matinais nem enviam status ao Opera Cloud.
            </p>
          </div>
        </div>

        {/* Big Counter */}
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl shrink-0">
          <div>
            <span className="text-[11px] text-indigo-200 block">Progresso da Noite</span>
            <span className="text-xl font-bold tabular-nums">
              {totalCompleted} / {totalDistributed}
            </span>
          </div>
          <div className="w-16 h-2 bg-indigo-950 rounded-full overflow-hidden border border-indigo-700">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${totalDistributed > 0 ? (totalCompleted / totalDistributed) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Turndown Groups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {turndownGroups.map(group => {
          const groupRooms = rooms.filter(r => r.turndownSheetId === group.id && r.turndownRequired);
          const completedInGroup = groupRooms.filter(r => r.turndownStatus === RoomStatus.CLEAN || r.turndownStatus === RoomStatus.INSPECTED).length;
          const isOver = dragOverGroupId === group.id;

          return (
            <div
              key={group.id}
              onDragOver={e => handleGroupDragOver(e, group.id)}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverGroupId(null);
                }
              }}
              onDrop={e => handleGroupDrop(e, group.id)}
              className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-xs flex flex-col transition-all duration-150 ${
                isOver
                  ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-md scale-[1.01]'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Group Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                      Grupo Noite #{group.sheetNumber}
                    </span>
                    <span className="text-xs font-medium text-slate-400">{group.block}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {completedInGroup}/{groupRooms.length} feitos
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {group.title}
                </h3>

                {/* Assigned Staff */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {group.assignedUserNames.length > 0
                      ? group.assignedUserNames.join(', ')
                      : 'Sem pessoa atribuída'}
                  </span>
                </div>
              </div>

              {/* Group Rooms List */}
              <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
                {/* Visual drop indicator */}
                {isOver && (
                  <div className="p-2.5 rounded-xl border-2 border-dashed border-indigo-500 bg-indigo-100/60 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 text-xs font-bold text-center animate-pulse flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Largar quarto no Grupo #{group.sheetNumber}</span>
                  </div>
                )}

                {groupRooms.map(room => {
                  const isClean = room.turndownStatus === RoomStatus.CLEAN || room.turndownStatus === RoomStatus.INSPECTED;
                  const isDragging = draggingRoomId === room.id;

                  return (
                    <div
                      key={room.id}
                      draggable
                      onDragStart={e => handleDragStart(e, room.id)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none ${
                        isDragging
                          ? 'opacity-40 scale-[0.98] ring-2 ring-indigo-500'
                          : isClean
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-1.5">
                          <div className="p-0.5 text-slate-400 group-hover:text-indigo-500">
                            <GripVertical className="w-3.5 h-3.5 mt-0.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                {room.number}
                              </span>
                              <span className="text-xs text-slate-500">{room.block}</span>
                            </div>
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                              {room.guest.guestName}
                            </p>
                          </div>
                        </div>

                        {/* Status chip */}
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          isClean
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                        }`}>
                          {isClean ? 'Preparado (Clean)' : 'Pendente (Dirty)'}
                        </span>
                      </div>

                      {/* Specials / Chocolates / Details */}
                      <div className="mt-2 text-xs text-slate-500 flex flex-wrap items-center gap-2">
                        {room.guest.vipType && (
                          <span className="text-amber-600 font-semibold">{room.guest.vipType}</span>
                        )}
                        {room.operational.isDND && (
                          <span className="text-purple-600 font-medium flex items-center gap-0.5">
                            <BellOff className="w-3 h-3" /> DND
                          </span>
                        )}
                        {room.operational.isRefusedService && (
                          <span className="text-stone-500 flex items-center gap-0.5">
                            <UserX className="w-3 h-3" /> Recusou
                          </span>
                        )}
                      </div>

                      {/* Turndown Action Buttons */}
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {!isClean ? (
                            <button
                              onClick={() => updateTurndownStatus(room.id, RoomStatus.CLEAN)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Turndown Feito</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => updateTurndownStatus(room.id, RoomStatus.DIRTY)}
                              className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            >
                              Reabrir
                            </button>
                          )}

                          <button
                            onClick={() => recordDND(room.id)}
                            className="p-1 text-slate-400 hover:text-purple-600 rounded"
                            title="Registar DND"
                          >
                            <BellOff className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Move to another turndown group */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onOpenDetail(room)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Ver ficha"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
