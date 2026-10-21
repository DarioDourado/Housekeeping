export interface TeamManagerModalProps {
  onClose: () => void;
  initialSelectedBlock?: string;
  initialTab?: 'BOARD' | 'DIRECTORY';
}
