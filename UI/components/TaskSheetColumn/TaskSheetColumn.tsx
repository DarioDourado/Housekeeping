'use client';

import { useState } from 'react';
import { TaskSheet, Room, RoomStatus, ServiceType } from '../../../types/housekeeping.types';
import { User } from '../../../types/auth.types';
import { housekeepingTransporter } from '../../../services/transporters/housekeeping/housekeepingTransporter';
import { useHousekeeping } from '../../../services/hooks/housekeeping/useHousekeeping';
import { useAuth } from '../../../services/hooks/auth/useAuth';
import { RoomCard } from '../RoomCard/RoomCard';
import {
  Users,
  Plus,
  ArrowRightLeft,
  Merge,
  Sparkles,
  Luggage,
  Home,
  LogOut,
  Clock,
  Layers,
  ChevronDown
} from 'lucide-react';
import { getTeamColorPalette } from '../TeamManager/teamColorUtils';

interface TaskSheetColumnProps {
  sheet: TaskSheet;
  allSheets: TaskSheet[];
  roomsInSheet: Room[];
  allStaff: User[];
  onOpenDetail: (room: Room) => void;
  onOpenReproval: (room: Room) => void;
  onMoveRoomPrompt: (room: Room) => void;
  layoutMode?: 'PANORAMIC' | 'GRID' | 'FULL_FIT';
}

export const TaskSheetColumn = ({
  sheet,
  allSheets,
  roomsInSheet,
  allStaff,
  onOpenDetail,
  onOpenReproval,
  onMoveRoomPrompt,
  layoutMode = 'PANORAMIC'
}: TaskSheetColumnProps) => {
  const { assignStaffToSheet, mergeSheets, moveRoomToSheet, draggingRoomId, draggingStaffId } = useHousekeeping();
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showMergeDropdown, setShowMergeDropdown] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Compute counters
  const counters = housekeepingTransporter.calculateCounters(roomsInSheet);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    // Drop de Colaborador na Task Sheet
    const staffId = e.dataTransfer.getData('application/staff-id') || draggingStaffId;
    if (staffId) {
      const staffMember = allStaff.find(s => s.id === staffId);
      if (staffMember) {
        if (!sheet.assignedUserIds.includes(staffId)) {
          const displayName = staffMember.name + (staffMember.isExtra ? ' (Extra)' : '');
          assignStaffToSheet(sheet.id, [...sheet.assignedUserIds, staffId], [...sheet.assignedUserNames, displayName]);
        }
      }
      return;
    }

    // Drop de Quarto na Task Sheet
    const roomId = e.dataTransfer.getData('text/plain') || draggingRoomId;
    if (roomId) {
      moveRoomToSheet(roomId, sheet.id);
    }
  };

  const handleToggleStaff = (staffMember: User) => {
    const isAssigned = sheet.assignedUserIds.includes(staffMember.id);
    let newIds: string[];
    let newNames: string[];

    if (isAssigned) {
      newIds = sheet.assignedUserIds.filter(id => id !== staffMember.id);
      newNames = sheet.assignedUserNames.filter(name => !name.includes(staffMember.name));
    } else {
      newIds = [...sheet.assignedUserIds, staffMember.id];
      const displayName = staffMember.name + (staffMember.isExtra ? ' (Extra)' : '');
      newNames = [...sheet.assignedUserNames, displayName];
    }
    assignStaffToSheet(sheet.id, newIds, newNames);
  };

  const handleMergeInto = (targetSheetId: string) => {
    mergeSheets(sheet.id, targetSheetId);
    setShowMergeDropdown(false);
  };

  const isCurrentSheetSource = draggingRoomId && sheet.roomIds.includes(draggingRoomId);

  const widthClass =
    layoutMode === 'GRID'
      ? 'w-full'
      : layoutMode === 'FULL_FIT'
      ? 'flex-1 min-w-[275px] max-w-none'
      : 'w-[315px] sm:w-[335px] xl:w-[355px] 2xl:w-[375px] shrink-0';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-2xl border transition-all duration-150 ${widthClass} ${
        isDragOver
          ? 'border-blue-500 ring-4 ring-blue-500/40 bg-blue-50/90 dark:bg-blue-950/50 shadow-xl scale-[1.01]'
          : draggingRoomId && !isCurrentSheetSource
          ? 'border-blue-300 dark:border-blue-700/80 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs'
          : sheet.isParkingSheet
          ? 'border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10'
          : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shadow-xs'
      }`}
    >
      
      {/* Column Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            {(() => {
              const blockPalette = getTeamColorPalette(sheet.block);
              return (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    sheet.isParkingSheet
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}>
                    Sheet #{sheet.sheetNumber}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${blockPalette.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${blockPalette.dot}`} />
                    <span>{sheet.block}</span>
                  </span>
                </div>
              );
            })()}
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
              {sheet.title}
            </h4>
          </div>

          {/* Merge button */}
          <div className="relative">
            <button
              onClick={() => setShowMergeDropdown(!showMergeDropdown)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Juntar esta secção com outra"
            >
              <Merge className="w-3.5 h-3.5" />
            </button>

            {showMergeDropdown && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 p-2 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 px-1">
                  Juntar com outra secção:
                </span>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {allSheets
                    .filter(s => s.id !== sheet.id)
                    .map(target => (
                      <button
                        key={target.id}
                        onClick={() => handleMergeInto(target.id)}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-800 dark:text-slate-200 truncate"
                      >
                        {target.title}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Staff Strip */}
        <div className="relative">
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Equipa Atribuída:
            </span>

            <button
              onClick={() => setShowAssignDropdown(!showAssignDropdown)}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              {sheet.assignedUserNames.length === 0 ? 'Atribuir Pessoa' : 'Editar'}
            </button>
          </div>

          {/* Assigned names chips */}
          <div className="flex flex-wrap gap-1 mt-1.5 min-h-[24px]">
            {sheet.assignedUserNames.length > 0 ? (
              sheet.assignedUserNames.map((name, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded-full"
                >
                  <span>{name}</span>
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400 italic">Sem pessoa atribuída</span>
            )}
          </div>

          {/* Staff selection dropdown */}
          {showAssignDropdown && (
            <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 p-2.5 text-xs">
              <div className="flex items-center justify-between mb-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <span>Escolher Pessoas:</span>
                <button
                  onClick={() => setShowAssignDropdown(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  OK
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {allStaff.map(staff => {
                  const checked = sheet.assignedUserIds.includes(staff.id);
                  return (
                    <label
                      key={staff.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleStaff(staff)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                        {staff.name}
                        {staff.isExtra ? ' (Extra Gás)' : ''}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Counters Bar (Mandatory as per Section 4 of meeting requirements) */}
        <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-center">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-medium">Estadias</span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {counters.stayoverCount}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-medium">Saída c/ Cheg</span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {counters.departureArrivalCount}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-medium">Só Saída</span>
            <span className="text-xs font-bold text-stone-500 tabular-nums">
              {counters.departureOnlyCount}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-medium">Refreshes</span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 tabular-nums">
              {counters.refreshCount}
            </span>
          </div>
        </div>

        {/* Total & Credits summary footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5">
          <span>Total: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{counters.totalRooms} quartos</strong></span>
          <span>Esforço: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{counters.estimatedCredits} cr</strong></span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">{counters.inspectedCount}/{counters.totalRooms} OK</span>
        </div>
      </div>

      {/* Room Cards Feed */}
      <div className="p-2.5 sm:p-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-215px)] min-h-[170px]">
        {/* Drop zone indicator when dragging a room or staff member over this column */}
        {isDragOver && (
          <div className="p-3 rounded-xl border-2 border-dashed border-blue-500 bg-blue-100/90 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 text-xs font-bold text-center flex items-center justify-center gap-2 animate-pulse shadow-md">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>
              {draggingStaffId
                ? `Atribuir colaboradora à Secção #${sheet.sheetNumber}`
                : `Soltar quarto na Secção #${sheet.sheetNumber} · ${sheet.block}`}
            </span>
          </div>
        )}

        {/* Receptive guide when a card is in flight */}
        {draggingRoomId && !isDragOver && !sheet.roomIds.includes(draggingRoomId) && (
          <div className="p-2 rounded-lg border border-dashed border-blue-300 dark:border-blue-700/60 bg-blue-50/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-[11px] font-semibold text-center flex items-center justify-center gap-1.5 transition-colors">
            <span>Soltar quarto nesta secção</span>
          </div>
        )}

        {draggingStaffId && !isDragOver && (
          <div className="p-2 rounded-lg border border-dashed border-blue-300 dark:border-blue-700/60 bg-blue-50/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-[11px] font-semibold text-center flex items-center justify-center gap-1.5 transition-colors">
            <span>Soltar colaboradora nesta secção</span>
          </div>
        )}

        {roomsInSheet.length > 0 ? (
          roomsInSheet.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onOpenDetail={onOpenDetail}
              onOpenReproval={onOpenReproval}
              onMoveRoom={onMoveRoomPrompt}
            />
          ))
        ) : (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-100 dark:bg-blue-950'
                : 'border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
            }`}
          >
            <Layers className="w-5 h-5 text-slate-400 mb-1" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {sheet.isParkingSheet ? 'Task Sheet de Estacionamento Vazia' : 'Secção Vazia'}
            </span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
              Arraste e solte quartos para aqui
            </span>
          </div>
        )}
      </div>

    </div>
  );
};
