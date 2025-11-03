import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";

interface Participant {
  user_id: string;
  profiles: {
    username: string;
    avatar_url?: string;
  };
}

interface IdeaParticipantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
}

const IdeaParticipantsDialog = ({
  open,
  onOpenChange,
  participants,
}: IdeaParticipantsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Participantes de la idea ({participants.length})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 pr-4">
            {participants.map((participant) => (
              <Link
                key={participant.user_id}
                to={`/profile/${participant.profiles.username}`}
                className="flex items-center gap-3 p-2 hover:bg-accent/50 rounded-lg transition-colors"
                onClick={() => onOpenChange(false)}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={participant.profiles.avatar_url} />
                  <AvatarFallback>
                    {participant.profiles.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{participant.profiles.username}</span>
              </Link>
            ))}
            {participants.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Aún no hay participantes en esta idea
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default IdeaParticipantsDialog;
