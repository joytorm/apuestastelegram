'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// Organization type stored in user_metadata or a profiles table
export interface Organization {
  id: string;
  name: string;
  image_url?: string;
}

// Membership with role info
export interface OrgMembership {
  organization: Organization;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoaded: boolean;
  // User convenience getters
  fullName: string | null;
  email: string | null;
  imageUrl: string | null;
  // Organization support
  organization: Organization | null;
  orgId: string | null;
  memberships: OrgMembership[];
  role: string | null;
  permissions: string[];
  hasOrg: boolean;
  setActiveOrganization: (orgId: string) => void;
  // Auth actions
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Restore active org from metadata
      const savedOrgId =
        session?.user?.user_metadata?.active_org_id ?? null;
      setActiveOrgId(savedOrgId);
      setIsLoaded(true);
    });

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        setActiveOrgId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Derive organizations from user metadata
  // In a real app, these would come from a `profiles` or `organizations` table
  const memberships: OrgMembership[] = useMemo(() => {
    const orgs = user?.user_metadata?.organizations;
    if (!orgs || !Array.isArray(orgs)) return [];
    return orgs as OrgMembership[];
  }, [user?.user_metadata?.organizations]);

  const organization = useMemo(() => {
    if (!activeOrgId) return null;
    return (
      memberships.find((m) => m.organization.id === activeOrgId)
        ?.organization ?? null
    );
  }, [activeOrgId, memberships]);

  const role = useMemo(() => {
    if (!activeOrgId) return null;
    return (
      memberships.find((m) => m.organization.id === activeOrgId)?.role ?? null
    );
  }, [activeOrgId, memberships]);

  const permissions: string[] = useMemo(() => {
    // Derive permissions from role. Customize as needed.
    if (!role) return [];
    const rolePermissions: Record<string, string[]> = {
      admin: [
        'org:teams:manage',
        'org:teams:view',
        'org:manage:billing',
        'org:manage:settings'
      ],
      member: ['org:teams:view'],
      viewer: []
    };
    return rolePermissions[role] ?? [];
  }, [role]);

  const setActiveOrganization = useCallback(
    (orgId: string) => {
      setActiveOrgId(orgId);
      // Persist to user metadata
      if (user) {
        supabase.auth.updateUser({
          data: { active_org_id: orgId }
        });
      }
    },
    [user, supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const fullName = user?.user_metadata?.full_name ?? null;
  const email = user?.email ?? null;
  const imageUrl = user?.user_metadata?.avatar_url ?? null;

  const value: AuthContextType = useMemo(
    () => ({
      user,
      session,
      isLoaded,
      fullName,
      email,
      imageUrl,
      organization,
      orgId: activeOrgId,
      memberships,
      role,
      permissions,
      hasOrg: !!organization,
      setActiveOrganization,
      signOut
    }),
    [
      user,
      session,
      isLoaded,
      fullName,
      email,
      imageUrl,
      organization,
      activeOrgId,
      memberships,
      role,
      permissions,
      setActiveOrganization,
      signOut
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
