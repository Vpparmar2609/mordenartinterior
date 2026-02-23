import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { roleLabels } from '@/types/auth';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { User, Mail, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Profile: React.FC = () => {
  const { profile, role } = useAuth();

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground flex items-center gap-3">
          <User className="w-7 h-7 text-primary" />
          My Profile
        </h1>
        <p className="text-muted-foreground mt-1">Manage your profile information</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display">Profile Photo</CardTitle>
          <CardDescription>Click on the avatar or button to upload a new photo</CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload />
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Name:</span>
            <span className="text-sm font-medium text-foreground">{profile?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Email:</span>
            <span className="text-sm font-medium text-foreground">{profile?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Role:</span>
            <Badge variant="outline">{role ? roleLabels[role] : 'No role'}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
