import { useState, type DragEvent } from 'react';
import { useUiStore } from '@/store/uiStore';
import { useMoveTask } from './useMoveTask';

// - Arrastar um cartão (tarefa) para outra posição ou task sheet. Só quem pode distribuir arrasta.
export const useTaskDrag = (taskId: string, sheetId: string, index: number, canDrag: boolean) => {
  const moveTask = useMoveTask();
  const draggingTaskId = useUiStore(state => state.draggingTaskId);
  const setDraggingTaskId = useUiStore(state => state.setDraggingTaskId);
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(null);

  const isTarget = canDrag && !!draggingTaskId && draggingTaskId !== taskId;

  return {
    isDragging,
    dropPosition,
    draggableProps: {
      draggable: canDrag,
      onDragStart: (event: DragEvent) => {
        event.dataTransfer.setData('text/plain', taskId);
        event.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
        setDraggingTaskId(taskId);
      },
      onDragEnd: () => {
        setIsDragging(false);
        setDraggingTaskId(null);
      },
      onDragOver: (event: DragEvent) => {
        if (!isTarget) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        const rect = event.currentTarget.getBoundingClientRect();
        setDropPosition(event.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom');
      },
      onDragLeave: (event: DragEvent) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropPosition(null);
      },
      onDrop: (event: DragEvent) => {
        if (!isTarget) return;
        event.preventDefault();
        event.stopPropagation();
        const position = dropPosition;
        setDropPosition(null);
        const draggedId = event.dataTransfer.getData('text/plain') || draggingTaskId;
        if (draggedId) void moveTask(draggedId, sheetId, position === 'bottom' ? index + 1 : index);
      }
    }
  };
};
