import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { EditChallenge } from './EditChallenge';

interface EditChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string | null;
  onUpdate: () => void;
}

export const EditChallengeModal: React.FC<EditChallengeModalProps> = ({
  isOpen,
  onClose,
  challengeId,
  onUpdate,
}) => {
  if (!challengeId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bài tập</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin bài tập
          </DialogDescription>
        </DialogHeader>
        <EditChallenge
          challengeId={challengeId}
          onClose={onClose}
          onUpdate={onUpdate}
        />
      </DialogContent>
    </Dialog>
  );
};