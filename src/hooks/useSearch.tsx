import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SearchFilters {
  university?: string;
  career?: string;
  semester?: number;
  postType?: string;
}

export function useSearch(query: string, filters?: SearchFilters) {
  const { user } = useAuth();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['search-users', query, filters],
    queryFn: async () => {
      if (!query.trim()) return [];

      let queryBuilder = supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,bio.ilike.%${query}%`);

      if (filters?.university) {
        queryBuilder = queryBuilder.eq('university', filters.university);
      }

      if (filters?.career) {
        queryBuilder = queryBuilder.eq('career', filters.career);
      }

      if (filters?.semester) {
        queryBuilder = queryBuilder.eq('semester', filters.semester);
      }

      const { data, error } = await queryBuilder.limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: query.length > 0,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['search-posts', query, filters],
    queryFn: async () => {
      if (!query.trim()) return [];

      let queryBuilder = supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            university,
            career
          ),
          reactions:reactions(count),
          comments:comments(count)
        `)
        .ilike('content', `%${query}%`);

      if (filters?.postType) {
        queryBuilder = queryBuilder.eq('post_type', filters.postType);
      }

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: query.length > 0,
  });

  const { data: ideas, isLoading: ideasLoading } = useQuery({
    queryKey: ['search-ideas', query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            university,
            career
          ),
          reactions:reactions(count),
          comments:comments(count),
          idea_participants(count)
        `)
        .eq('post_type', 'idea')
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: query.length > 0,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['search-projects', query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            university,
            career
          ),
          reactions:reactions(count),
          comments:comments(count)
        `)
        .eq('post_type', 'proyecto')
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: query.length > 0,
  });

  const { data: trendingHashtags } = useQuery({
    queryKey: ['trending-hashtags'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_trending_hashtags', {
        limit_count: 10,
      });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: suggestedUsers } = useQuery({
    queryKey: ['suggested-users', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase.rpc('get_university_friend_suggestions', {
        p_user_id: user.id,
        limit_count: 10,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  return {
    users: users || [],
    posts: posts || [],
    ideas: ideas || [],
    projects: projects || [],
    trendingHashtags: trendingHashtags || [],
    suggestedUsers: suggestedUsers || [],
    isLoading: usersLoading || postsLoading || ideasLoading || projectsLoading,
  };
}
