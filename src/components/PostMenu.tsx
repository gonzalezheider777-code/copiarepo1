import { MoreHorizontal, Bookmark, Link as LinkIcon, ThumbsUp, ThumbsDown, EyeOff, UserX, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePosts } from "@/hooks/usePosts";

interface PostMenuProps {
  postId: string;
  isOwnPost: boolean;
  onDelete?: (postId: string) => void;
}

export const PostMenu = ({
  postId,
  isOwnPost,
  onDelete,
}: PostMenuProps) => {
  const { toast } = useToast();
  const { deletePost, toggleSavePost, hidePost, reportPost } = usePosts();

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Enlace copiado",
      description: "El enlace se copió al portapapeles",
    });
  };

  const handleSave = async () => {
    await toggleSavePost(postId);
  };

  const handleHide = async () => {
    await hidePost(postId);
    toast({
      title: "Publicación ocultada",
      description: "Esta publicación ya no aparecerá en tu feed",
    });
  };

  const handleReport = async () => {
    await reportPost(postId, "Contenido inapropiado");
  };

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta publicación?")) {
      const { error } = await deletePost(postId);
      if (!error && onDelete) {
        onDelete(postId);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleSave}>
          <Bookmark className="h-4 w-4 mr-3" />
          Guardar publicación
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleCopyLink}>
          <LinkIcon className="h-4 w-4 mr-3" />
          Copiar enlace
        </DropdownMenuItem>

        {!isOwnPost && (
          <>
            <DropdownMenuItem>
              <ThumbsUp className="h-4 w-4 mr-3" />
              Me interesa este contenido
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleHide}>
              <ThumbsDown className="h-4 w-4 mr-3" />
              No me interesa este contenido
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleHide}>
              <EyeOff className="h-4 w-4 mr-3" />
              Ocultar publicación
            </DropdownMenuItem>

            <DropdownMenuItem>
              <UserX className="h-4 w-4 mr-3" />
              Ocultar de [Usuario]
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleReport}>
              <Flag className="h-4 w-4 mr-3" />
              Reportar publicación
            </DropdownMenuItem>
          </>
        )}

        {isOwnPost && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
              <Flag className="h-4 w-4 mr-3" />
              Eliminar publicación
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
