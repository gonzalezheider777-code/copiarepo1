import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, TrendingUp, Users, FileText, Hash, Filter } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { useSearch } from "@/hooks/useSearch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const Search = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    postType?: string;
    university?: string;
    career?: string;
  }>({});
  const [showFilters, setShowFilters] = useState(false);

  const { users, posts, ideas, projects, trendingHashtags, suggestedUsers, isLoading } = useSearch(searchQuery, filters);


  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <main className="max-w-screen-xl mx-auto px-0 md:px-4 pt-4">
        <div className="mb-6 px-4 md:px-0 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar ideas, proyectos, personas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-card border-border focus:border-primary/50 transition-colors"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>

          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select
                  value={filters.postType || "all"}
                  onValueChange={(value) => setFilters({ ...filters, postType: value === "all" ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de post" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="idea">Ideas</SelectItem>
                    <SelectItem value="project">Proyectos</SelectItem>
                    <SelectItem value="event">Eventos</SelectItem>
                    <SelectItem value="team">Equipos</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Universidad"
                  value={filters.university || ""}
                  onChange={(e) => setFilters({ ...filters, university: e.target.value || undefined })}
                />

                <Input
                  placeholder="Carrera"
                  value={filters.career || ""}
                  onChange={(e) => setFilters({ ...filters, career: e.target.value || undefined })}
                />
              </div>
            </Card>
          )}
        </div>

        <Tabs defaultValue={searchQuery ? "posts" : "trending"} className="w-full px-4 md:px-0">
          <TabsList className="w-full grid grid-cols-6 mb-6 bg-card border border-border h-12">
            <TabsTrigger value="trending" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10">
              <Hash className="w-4 h-4" />
              <span className="hidden md:inline">Trending</span>
            </TabsTrigger>
            <TabsTrigger value="people" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10">
              <Users className="w-4 h-4" />
              <span className="hidden md:inline">Personas</span>
            </TabsTrigger>
            <TabsTrigger value="ideas" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10">
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">Ideas</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10">
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">Proyectos</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10">
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="suggested" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden md:inline">Sugeridos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-3">
            {trendingHashtags.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No hay hashtags trending aún</p>
              </Card>
            ) : (
              trendingHashtags.map((hashtag: any, index: number) => (
                <Card
                  key={index}
                  className="p-4 hover:shadow-lg transition-all cursor-pointer border-border group"
                  onClick={() => setSearchQuery(`#${hashtag.hashtag}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Hash className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        #{hashtag.hashtag}
                      </h3>
                      <p className="text-sm text-muted-foreground">{hashtag.usage_count} publicaciones</p>
                    </div>
                    <Badge variant="secondary" className="font-medium">
                      Tendencia
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="people" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-muted rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : users.length === 0 && searchQuery ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No se encontraron usuarios</p>
              </Card>
            ) : (
              (searchQuery ? users : []).map((user: any) => (
                <Card
                  key={user.id}
                  className="p-4 hover:shadow-lg transition-all cursor-pointer border-border group"
                  onClick={() => navigate(`/profile/${user.username}`)}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                        {user.full_name?.substring(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {user.full_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {user.bio}
                        </p>
                      )}
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-primary to-accent">
                      Ver perfil
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="posts" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/4" />
                          <div className="h-3 bg-muted rounded w-1/3" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-4 bg-muted rounded w-5/6" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 && searchQuery ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No se encontraron publicaciones</p>
              </Card>
            ) : (
              posts.map((post: any) => (
                <ProjectCard
                  key={post.id}
                  author={{
                    name: post.author.full_name,
                    role: `${post.author.career} • ${post.author.university}`,
                    avatar: post.author.avatar_url || '/placeholder.svg',
                  }}
                  title={post.title || 'Sin título'}
                  description={post.content}
                  category={post.category || 'General'}
                  type={post.post_type as any}
                  likes={post.reactions?.[0]?.count || 0}
                  comments={post.comments?.[0]?.count || 0}
                  timeAgo={post.created_at}
                  image={post.image_url}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="ideas" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/4" />
                          <div className="h-3 bg-muted rounded w-1/3" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-4 bg-muted rounded w-5/6" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : ideas.length === 0 && searchQuery ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No se encontraron ideas</p>
              </Card>
            ) : ideas.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Escribe algo en el buscador para encontrar ideas</p>
              </Card>
            ) : (
              ideas.map((idea: any) => (
                <ProjectCard
                  key={idea.id}
                  author={{
                    name: idea.author.full_name,
                    role: `${idea.author.career || ''} • ${idea.author.university || ''}`,
                    avatar: idea.author.avatar_url || '/placeholder.svg',
                  }}
                  title={idea.title || 'Sin título'}
                  description={idea.content}
                  category={idea.category || 'General'}
                  type="idea"
                  likes={idea.reactions?.[0]?.count || 0}
                  comments={idea.comments?.[0]?.count || 0}
                  timeAgo={idea.created_at}
                  image={idea.image_url}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/4" />
                          <div className="h-3 bg-muted rounded w-1/3" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-4 bg-muted rounded w-5/6" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : projects.length === 0 && searchQuery ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No se encontraron proyectos</p>
              </Card>
            ) : projects.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Escribe algo en el buscador para encontrar proyectos</p>
              </Card>
            ) : (
              projects.map((project: any) => (
                <ProjectCard
                  key={project.id}
                  author={{
                    name: project.author.full_name,
                    role: `${project.author.career || ''} • ${project.author.university || ''}`,
                    avatar: project.author.avatar_url || '/placeholder.svg',
                  }}
                  title={project.title || 'Sin título'}
                  description={project.content}
                  category={project.category || 'General'}
                  type="proyecto"
                  likes={project.reactions?.[0]?.count || 0}
                  comments={project.comments?.[0]?.count || 0}
                  timeAgo={project.created_at}
                  image={project.image_url}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="suggested" className="space-y-3">
            {suggestedUsers.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No hay sugerencias disponibles</p>
              </Card>
            ) : (
              suggestedUsers.map((user: any) => (
                <Card
                  key={user.id}
                  className="p-4 hover:shadow-lg transition-all cursor-pointer border-border group"
                  onClick={() => navigate(`/profile/${user.username}`)}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                        {user.full_name?.substring(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {user.full_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {user.university} • {user.career}
                      </p>
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-primary to-accent">
                      Ver perfil
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Search;
