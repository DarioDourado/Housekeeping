import { lazy, Suspense } from 'react';
import { useOverlayStore } from '@/store/overlayStore';

// - Painéis pesados só carregam quando abertos (22-performance)
const RoomDetailModal = lazy(() => import('@/UI/components/RoomDetailModal').then(m => ({ default: m.RoomDetailModal })));
const CorrectionRequestModal = lazy(() => import('@/UI/components/Correction').then(m => ({ default: m.CorrectionRequestModal })));
const MoveTaskModal = lazy(() => import('@/UI/components/MoveTask').then(m => ({ default: m.MoveTaskModal })));
const OperaSyncModal = lazy(() => import('@/UI/components/OperaSync').then(m => ({ default: m.OperaSyncModal })));
const CreditsStatsModal = lazy(() => import('@/UI/components/CreditsStats').then(m => ({ default: m.CreditsStatsModal })));
const StaffManagerModal = lazy(() => import('@/UI/components/StaffManager').then(m => ({ default: m.StaffManagerModal })));
const TeamManagerModal = lazy(() => import('@/UI/components/TeamManager').then(m => ({ default: m.TeamManagerModal })));
const ChatDrawer = lazy(() => import('@/UI/components/Chat').then(m => ({ default: m.ChatDrawer })));

export const Overlays = () => {
  const { detailTaskId, correctionTaskId, moveTaskId, panel, closeDetail, closeCorrection, closeMove, closePanel } = useOverlayStore();

  return (
    <Suspense fallback={null}>
      {detailTaskId && <RoomDetailModal taskId={detailTaskId} onClose={closeDetail} />}
      {correctionTaskId && <CorrectionRequestModal taskId={correctionTaskId} onClose={closeCorrection} />}
      {moveTaskId && <MoveTaskModal taskId={moveTaskId} onClose={closeMove} />}
      {panel === 'opera' && <OperaSyncModal onClose={closePanel} />}
      {panel === 'credits' && <CreditsStatsModal onClose={closePanel} />}
      {panel === 'staff' && <StaffManagerModal onClose={closePanel} />}
      {panel === 'team' && <TeamManagerModal onClose={closePanel} />}
      {panel === 'chat' && <ChatDrawer onClose={closePanel} />}
    </Suspense>
  );
};
