import { useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { PostCard } from "@/components/PostCard";
import { QuickActions } from "@/components/QuickActions";
import { CreatePostPrompt } from "@/components/CreatePostPrompt";
import { SuggestedUsers } from "@/components/SuggestedUsers";
import { SuggestedGroups } from "@/components/SuggestedGroups";
import { TrendingUp, Loader2 } from "lucide-react";
import { useFeed } from "@/hooks/useFeed";
import { Skeleton } from "@/components/ui/skeleton";

type FilterType = "all" | "proyecto" | "equipo" | "idea" | "evento" | "text";

const Index = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const { posts, loading, hasMore, loadMore, addReaction, toggleSave, refreshFeed } = useFeed(activeFilter);

  const handleDeletePost = () => {
    refreshFeed();
  };
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500
      ) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMore]);

  const trending = [
    "IA en educación",
    "Fintech estudiantil",
    "Sostenibilidad",
    "Web3 y blockchain",
  ];


  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <main className="pt-4">
        <QuickActions activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        <CreatePostPrompt onPostCreated={refreshFeed} />

        <div className="mb-6 bg-card border-y border-border">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-sm text-foreground">Tendencias</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {trending.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-muted text-foreground rounded text-xs font-medium hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <SuggestedUsers />

        <SuggestedGroups />

        {activeFilter !== "all" && (
          <div className="mb-4 bg-primary/10 border-y border-primary/30">
            <div className="flex items-center justify-between text-primary px-4 py-3">
              <p className="text-sm font-medium">
                Mostrando {posts.length} {posts.length === 1 ? "resultado" : "resultados"}
              </p>
              <button
                onClick={() => setActiveFilter("all")}
                className="text-xs underline hover:no-underline"
              >
                Ver todo
              </button>
            </div>
          </div>
        )}

        <div className="space-y-0">
          {loading && posts.length === 0 ? (
            <div className="space-y-0">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border-b border-border p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full mb-4" />
                  <Skeleton className="h-48 w-full rounded" />
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onReaction={addReaction}
                  onSave={toggleSave}
                  onDelete={handleDeletePost}
                />
              ))}
              {loading && hasMore && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center bg-card border-y border-border">
              <p className="text-muted-foreground mb-2">No hay publicaciones disponibles</p>
              <p className="text-sm text-muted-foreground">Sé el primero en publicar algo</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
