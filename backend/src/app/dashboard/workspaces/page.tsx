'use client';

import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { GalleryVerticalEnd } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { workspacesInfoContent } from '@/config/infoconfig';

export default function WorkspacesPage() {
  const { memberships, orgId, setActiveOrganization } = useAuth();
  const router = useRouter();

  return (
    <PageContainer
      pageTitle='Workspaces'
      pageDescription='Manage your workspaces and switch between them'
      infoContent={workspacesInfoContent}
    >
      <div className='space-y-4'>
        {memberships.length === 0 ? (
          <Card>
            <CardContent className='flex min-h-[200px] items-center justify-center'>
              <div className='space-y-2 text-center'>
                <GalleryVerticalEnd className='mx-auto h-8 w-8 text-muted-foreground' />
                <h3 className='text-lg font-semibold'>No organizations yet</h3>
                <p className='text-muted-foreground text-sm'>
                  Organizations can be created in the Supabase dashboard or via
                  API. Configure your organizations in user metadata.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          memberships.map((membership) => {
            const isActive = membership.organization.id === orgId;
            return (
              <Card
                key={membership.organization.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  isActive ? 'border-primary' : ''
                }`}
                onClick={() => {
                  setActiveOrganization(membership.organization.id);
                  router.push('/dashboard/workspaces/team');
                }}
              >
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <GalleryVerticalEnd className='h-5 w-5' />
                    {membership.organization.name}
                    {isActive && (
                      <span className='bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs'>
                        Active
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>Role: {membership.role}</CardDescription>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>
    </PageContainer>
  );
}
