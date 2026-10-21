'use client';

import { useState, useRef } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { HousekeepingProvider } from '../context/HousekeepingContext';
import { useHousekeeping } from '../services/hooks/housekeeping/useHousekeeping';
import { useAuth } from '../services/hooks/auth/useAuth';
import { Room, TaskSheet, RoomStatus, ServiceType, RoomTypology } from '../types/housekeeping.types';
import { Navbar } from '../UI/components/Header/Navbar';
import type { HousekeepingPageUiState } from '../types/pages/housekeeping-page.types';
import { TaskSheetColumn } from '../UI/components/TaskSheetColumn/TaskSheetColumn';
import { TurndownView } from '../UI/components/Turndown/TurndownView';
import { AuditingTimeline } from '../UI/components/Auditing/AuditingTimeline';
import { RoomDetailModal } from '../UI/components/RoomDetailModal/RoomDetailModal';
import { InspectionReprovalModal } from '../UI/components/Inspection/InspectionReprovalModal';
import { MoveRoomModal } from '../UI/components/MoveRoom/MoveRoomModal';
import { OperaSyncModal } from '../UI/components/OperaSync/OperaSyncModal';
import { CreditsStatsModal } from '../UI/components/CreditsStats/CreditsStatsModal';
import { StaffManagerModal } from '../UI/components/StaffManager/StaffManagerModal';
import { TeamManagerModal, BlockTeamRosterBar } from '../UI/components/TeamManager';
import { ChatDrawer } from '../UI/components/Chat/ChatDrawer';
import { MobileView } from '../UI/components/MobileSimulator/MobileView';
import { RoomCard } from '../UI/components/RoomCard/RoomCard';
import {
  Layers,
  RotateCcw,
  Sparkles,
  Server,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Luggage,
  Home,
  LogOut,
  Smartphone,
  Columns,
  LayoutGrid,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function HousekeepingAppContent() {
  const { user, users } = useAuth();
  const {
    rooms,
    taskSheets,
    resetToDailyPreset,
    loading,
    moveToast,
    dismissMoveToast
  } = useHousekeeping();

  const [activeTab, setActiveTab] = useState<HousekeepingPageUiState['activeTab']>('MORNING');
  const [isMobileSimulator, setIsMobileSimulator] = useState<HousekeepingPageUiState['isMobileSimulator']>(false);
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<HousekeepingPageUiState['selectedBlockFilter']>('ALL');
  const [layoutMode, setLayoutMode] = useState<HousekeepingPageUiState['layoutMode']>('EXPANDED');

  // Modals state
  const [detailRoom, setDetailRoom] = useState<Room | null>(null);
  const [reprovalRoom, setReprovalRoom] = useState<Room | null>(null);
  const [movingRoom, setMovingRoom] = useState<Room | null>(null);
  const [showOperaModal, setShowOperaModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showTeamManagerModal, setShowTeamManagerModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            A carregar Vila Vita Parc Housekeeping OS...
          </p>
        </div>
      </div>
    );
  }

  // Summary Metrics for the day
  const totalRooms = rooms.length;
  const stayovers = rooms.filter(r => r.serviceType === ServiceType.STAYOVER).length;
  const departuresWithArrival = rooms.filter(r => r.serviceType === ServiceType.DEPARTURE_ARRIVAL).length;
  const departuresOnly = rooms.filter(r => r.serviceType === ServiceType.DEPARTURE_ONLY).length;
  const refreshes = rooms.filter(r => r.serviceType === ServiceType.REFRESH).length;

  const dirtyCount = rooms.filter(r => r.morningStatus === RoomStatus.DIRTY).length;
  const cleanCount = rooms.filter(r => r.morningStatus === RoomStatus.CLEAN).length;
  const inspectedCount = rooms.filter(r => r.morningStatus === RoomStatus.INSPECTED).length;

  // Filter sheets by block if selected
  const filteredSheets = taskSheets.filter(s => {
    if (selectedBlockFilter === 'ALL') return true;
    if (selectedBlockFilter === 'PARKING') return s.isParkingSheet;
    return s.block.toLowerCase().includes(selectedBlockFilter.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMobileSimulator={isMobileSimulator}
        onToggleMobileSimulator={() => setIsMobileSimulator(!isMobileSimulator)}
        onOpenOperaModal={() => setShowOperaModal(true)}
        onOpenCreditsModal={() => setShowCreditsModal(true)}
        onOpenStaffModal={() => setShowStaffModal(true)}
        onOpenTeamManager={() => setShowTeamManagerModal(true)}
        onOpenChat={() => setShowChatDrawer(true)}
        onResetPreset={resetToDailyPreset}
      />

      {/* Main Content Area: Full Screen Extension (Sem limites artificiais de largura) */}
      <main className="flex-1 w-full max-w-none px-2 sm:px-3 lg:px-4 py-2 flex flex-col">
        
        {/* MOBILE SIMULATOR MODE */}
        {isMobileSimulator ? (
          <div className="py-4">
            <div className="text-center mb-4">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                Simulador de Telemóvel de Serviço · Responsável de Área & Governanta
              </span>
            </div>
            <MobileView
              onOpenDetail={setDetailRoom}
              onOpenReproval={setReprovalRoom}
              onOpenChat={() => setShowChatDrawer(true)}
            />
          </div>
        ) : (
          <>
            {/* TAB 1: DISTRIBUIÇÃO MANHÃ (Task Sheets & Drag/Move) */}
            {activeTab === 'MORNING' && (
              <div className="space-y-4 animate-in fade-in-50 duration-150 w-full">
                
                {/* Global Day Summary Strip */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs w-full">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    
                    {/* Left: Overall Hotel Counters */}
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Total Hotel</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          {totalRooms} Quartos
                        </span>
                      </div>

                      <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                      <div>
                        <span className="text-slate-400 block font-medium">Saída c/ Chegada</span>
                        <span className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          {departuresWithArrival}
                        </span>
                      </div>

                      <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                      <div>
                        <span className="text-slate-400 block font-medium">Estadias</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                          {stayovers}
                        </span>
                      </div>

                      <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                      <div>
                        <span className="text-slate-400 block font-medium">Só Saídas</span>
                        <span className="text-lg font-bold text-stone-500 tabular-nums">
                          {departuresOnly}
                        </span>
                      </div>

                      <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                      <div>
                        <span className="text-slate-400 block font-medium">Refreshes</span>
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                          {refreshes}
                        </span>
                      </div>
                    </div>

                    {/* Right: Progress & Opera Sync quick status */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-md font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          {dirtyCount} Dirty
                        </span>
                        <span className="px-2.5 py-1 rounded-md font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                          {cleanCount} Clean
                        </span>
                        <span className="px-2.5 py-1 rounded-md font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          {inspectedCount} Inspected
                        </span>
                      </div>

                      <button
                        onClick={resetToDailyPreset}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
                        title="Recarregar modelo diário inicial de task sheets"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Recarregar Pré-definição</span>
                      </button>
                    </div>

                  </div>
                </div>

                {/* Interactive Block Teams Roster Bar (Drag & Drop Staff per Block) */}
                <BlockTeamRosterBar onOpenTeamManager={() => setShowTeamManagerModal(true)} />

                {/* Sub-toolbar: Block Filter, Full Screen Layout Toggle & Scroll Controls */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs w-full bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  
                  {/* Left: Block filters */}
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 lg:pb-0">
                    <span className="text-slate-400 font-medium mr-1 flex items-center gap-1 shrink-0">
                      <Filter className="w-3.5 h-3.5" />
                      Área:
                    </span>
                    {[
                      { id: 'ALL', label: 'Todas as Secções (22)' },
                      { id: 'Bloco A', label: 'Bloco A' },
                      { id: 'Bloco B', label: 'Bloco B' },
                      { id: 'Bloco C', label: 'Bloco C' },
                      { id: 'Oasis', label: 'Oasis Parc' },
                      { id: 'Villas', label: 'Master Villas' },
                      { id: 'PARKING', label: 'Estacionamento (21-22)' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedBlockFilter(f.id)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
                          selectedBlockFilter === f.id
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Right: Layout Density & Screen Distribution Controls */}
                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider hidden md:inline">
                      Extensão Ecrã:
                    </span>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                      <button
                        onClick={() => setLayoutMode('EXPANDED')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          layoutMode === 'EXPANDED'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title="Ocupa 100% da largura do ecrã sem qualquer scroll horizontal"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Extensão Total</span>
                      </button>

                      <button
                        onClick={() => setLayoutMode('AUTO_FIT')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          layoutMode === 'AUTO_FIT'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title="Ajusta todas as colunas visíveis proporcionalmente à largura do ecrã"
                      >
                        <Columns className="w-3.5 h-3.5" />
                        <span>Ajustar ao Ecrã</span>
                      </button>

                      <button
                        onClick={() => setLayoutMode('COMPACT')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          layoutMode === 'COMPACT'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title="Densidade máxima para monitores desktop verem mais secções e quartos"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Modo Compacto</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* DISTRIBUTION BOARD: Extensão Total do Ecrã (Sem scroll horizontal) */}
                <div
                  className={`w-full max-w-none transition-all pb-8 ${
                    layoutMode === 'AUTO_FIT'
                      ? 'flex flex-wrap lg:flex-nowrap gap-3 w-full'
                      : layoutMode === 'COMPACT'
                      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8 gap-2.5 w-full'
                      : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 gap-3.5 w-full'
                  }`}
                >
                  {filteredSheets.map(sheet => {
                    const roomsInSheet = rooms
                      .filter(r => r.assignedSheetId === sheet.id)
                      .sort((a, b) => {
                        if (a.isPriority && !b.isPriority) return -1;
                        if (!a.isPriority && b.isPriority) return 1;
                        return a.orderIndex - b.orderIndex;
                      });

                    return (
                      <TaskSheetColumn
                        key={sheet.id}
                        sheet={sheet}
                        allSheets={taskSheets}
                        roomsInSheet={roomsInSheet}
                        allStaff={users}
                        onOpenDetail={setDetailRoom}
                        onOpenReproval={setReprovalRoom}
                        onMoveRoomPrompt={setMovingRoom}
                        layoutMode={layoutMode === 'AUTO_FIT' ? 'FULL_FIT' : 'GRID'}
                      />
                    );
                  })}
                </div>

              </div>
            )}

            {/* TAB 2: TURNDOWN (NOITE) */}
            {activeTab === 'TURNDOWN' && (
              <TurndownView onOpenDetail={setDetailRoom} />
            )}

            {/* TAB 3: QUARTOS EM DIRETO (Live Grid) */}
            {activeTab === 'LIVE' && (
              <div className="space-y-4 animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Painel em Tempo Real de Todos os Quartos
                    </h2>
                    <p className="text-xs text-slate-500">
                      Monitorização operacional de andares, tempos de início/fim e sincronização Opera Cloud.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {rooms.map(room => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onOpenDetail={setDetailRoom}
                      onOpenReproval={setReprovalRoom}
                      onMoveRoom={setMovingRoom}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: AUDITORIA DE TEMPOS */}
            {activeTab === 'AUDIT' && (
              <AuditingTimeline />
            )}
          </>
        )}

      </main>

      {/* MODALS */}
      {detailRoom && (
        <RoomDetailModal
          room={detailRoom}
          onClose={() => setDetailRoom(null)}
          onOpenReproval={(r) => {
            setDetailRoom(null);
            setReprovalRoom(r);
          }}
        />
      )}

      {reprovalRoom && (
        <InspectionReprovalModal
          room={reprovalRoom}
          onClose={() => setReprovalRoom(null)}
        />
      )}

      {movingRoom && (
        <MoveRoomModal
          room={movingRoom}
          sheets={taskSheets}
          onClose={() => setMovingRoom(null)}
        />
      )}

      {showOperaModal && (
        <OperaSyncModal onClose={() => setShowOperaModal(false)} />
      )}

      {showCreditsModal && (
        <CreditsStatsModal onClose={() => setShowCreditsModal(false)} />
      )}

      {showStaffModal && (
        <StaffManagerModal onClose={() => setShowStaffModal(false)} />
      )}

      {showTeamManagerModal && (
        <TeamManagerModal onClose={() => setShowTeamManagerModal(false)} />
      )}

      {showChatDrawer && (
        <ChatDrawer onClose={() => setShowChatDrawer(false)} />
      )}

      {/* Drag & Drop Realtime Confirmation Toast */}
      {moveToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 dark:border-slate-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{moveToast.message}</span>
            <button
              onClick={dismissMoveToast}
              className="text-slate-400 hover:text-white dark:hover:text-slate-900 ml-2 text-xs font-bold p-1"
              aria-label="Fechar notificação"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function Page() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HousekeepingProvider>
          <HousekeepingAppContent />
        </HousekeepingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
