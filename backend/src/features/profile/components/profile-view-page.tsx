'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ProfileViewPage() {
  const { user, fullName, email, imageUrl } = useAuth();
  const [name, setName] = useState(fullName ?? '');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const userForAvatar = user
    ? {
        imageUrl: imageUrl ?? undefined,
        fullName,
        emailAddresses: [{ emailAddress: email ?? '' }]
      }
    : null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: name }
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Profile updated successfully');
    }

    setLoading(false);
  };

  return (
    <div className='flex w-full flex-col gap-6 p-4'>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Manage your account settings and profile information.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex items-center gap-4'>
            {userForAvatar && (
              <UserAvatarProfile
                className='h-16 w-16 rounded-full'
                user={userForAvatar}
              />
            )}
            <div>
              <p className='text-lg font-medium'>{fullName}</p>
              <p className='text-muted-foreground text-sm'>{email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Full Name</Label>
              <Input
                id='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' value={email ?? ''} disabled />
              <p className='text-muted-foreground text-xs'>
                Email changes are managed through Supabase dashboard.
              </p>
            </div>
            <Button type='submit' disabled={loading}>
              {loading ? 'Saving...' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
