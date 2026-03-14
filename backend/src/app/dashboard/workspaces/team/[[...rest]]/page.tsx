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
import { teamInfoContent } from '@/config/infoconfig';

export default function TeamPage() {
  const { organization, memberships, isLoaded } = useAuth();

  return (
    <PageContainer
      pageTitle='Team Management'
      pageDescription='Manage your workspace team, members, roles, security and more.'
      infoContent={teamInfoContent}
    >
      {!organization ? (
        <Card>
          <CardContent className='flex min-h-[200px] items-center justify-center'>
            <div className='space-y-2 text-center'>
              <h3 className='text-lg font-semibold'>
                No Organization Selected
              </h3>
              <p className='text-muted-foreground text-sm'>
                Please select an organization from the sidebar to manage team
                members.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>{organization.name}</CardTitle>
              <CardDescription>
                Manage members and roles for this organization. Team management
                is handled through Supabase and your database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <h3 className='text-sm font-medium'>Members</h3>
                <div className='text-muted-foreground text-sm'>
                  <p>
                    Team member management is configured through your Supabase
                    project. Use the Supabase dashboard or API to manage
                    organization members, roles, and permissions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
