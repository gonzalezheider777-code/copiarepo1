import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImagePlus, Video, X } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";

interface CreateTextPostFormProps {
  onClose: () => void;
  onPostCreated?: () => void;
}

const CreateTextPostForm = ({ onClose, onPostCreated }: CreateTextPostFormProps) => {
  const [content, setContent] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const { createPost, loading } = usePosts();

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
        setMediaType(type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    const { error } = await createPost({
      content,
      post_type: "text",
      media_file: mediaFile || undefined,
    });

    if (!error) {
      onClose();
      if (onPostCreated) {
        setTimeout(() => onPostCreated(), 100);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="content" className="text-base font-semibold">¿Qué tienes en mente?</Label>
        <Textarea
          id="content"
          placeholder="Comparte tus pensamientos, ideas o actualizaciones..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[140px] resize-none"
          required
        />
      </div>

      {mediaPreview && (
        <div className="relative rounded-lg overflow-hidden border border-border">
          {mediaType === "image" ? (
            <img
              src={mediaPreview}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
          ) : (
            <video
              src={mediaPreview}
              controls
              className="w-full h-48 object-cover bg-black"
            />
          )}
          <button
            type="button"
            onClick={() => {
              setMediaPreview(null);
              setMediaType(null);
              setMediaFile(null);
            }}
            className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white hover:bg-black/80 transition-colors shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 pt-3 border-t border-border">
        <Label
          htmlFor="image"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 rounded-lg cursor-pointer transition-all group border border-primary/20"
        >
          <ImagePlus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Imagen</span>
        </Label>
        <input
          type="file"
          id="image"
          accept="image/*"
          onChange={(e) => handleMediaChange(e, "image")}
          className="hidden"
        />
        
        <Label
          htmlFor="video"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent/10 to-primary/10 hover:from-accent/20 hover:to-primary/20 rounded-lg cursor-pointer transition-all group border border-accent/20"
        >
          <Video className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Video</span>
        </Label>
        <input
          type="file"
          id="video"
          accept="video/*"
          onChange={(e) => handleMediaChange(e, "video")}
          className="hidden"
        />
      </div>

      <div className="flex justify-end gap-3 pt-5">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={loading || !content.trim()}
          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
        >
          {loading ? "Publicando..." : "Publicar"}
        </Button>
      </div>
    </form>
  );
};

export default CreateTextPostForm;
