import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, User, Clock, Settings, RefreshCw, LogOut } from "lucide-react";
import { SiLine, SiFacebook } from "react-icons/si";
import { GoogleIcon } from "@/components/GoogleIcon";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  provider: 'line' | 'google' | 'facebook';
  userId: string;
  displayName: string;
  email?: string; // For Google and Facebook
  statusMessage: string | null;
  pictureUrl: string;
  loginTime: string;
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error, refetch } = useQuery<UserProfile>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
      setLocation('/');
      toast({
        title: "Logged out successfully",
        description: "You have been logged out successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (error) {
      setLocation('/');
    }
  }, [error, setLocation]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Profile refreshed",
      description: "Your profile information has been updated.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <div className="flex space-x-1">
                    <SiLine className="text-white text-xs" />
                    <GoogleIcon size={12} />
                  </div>
                </div>
                <span className="text-xl font-bold text-slate-900">Social Login Demo</span>
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </nav>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <Skeleton className="w-20 h-20 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-128 mx-auto" />
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      {/* Navigation Bar */}
      <nav className="relative z-10 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg shadow-blue-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                profile.provider === 'line' ? 'bg-gradient-to-br from-[#00C300] to-[#00B300] shadow-[#00C300]/25' : 
                profile.provider === 'google' ? 'bg-white border border-gray-200 shadow-gray-200/50' : 'bg-gradient-to-br from-[#1877F2] to-[#166FE5] shadow-[#1877F2]/25'
              }`}>
                {profile.provider === 'line' ? (
                  <SiLine className="text-white text-lg" />
                ) : profile.provider === 'google' ? (
                  <GoogleIcon size={18} />
                ) : (
                  <SiFacebook className="text-white text-lg" />
                )}
              </div>
              <span className="text-xl font-bold text-slate-900">
                {profile.provider === 'line' ? 'Line' : 
                 profile.provider === 'google' ? 'Google' : 'Facebook'} Demo
              </span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className={`w-10 h-10 border-2 ${
                  profile.provider === 'line' ? 'border-line-green' : 
                  profile.provider === 'google' ? 'border-google-blue' : 'border-facebook-blue'
                }`}>
                  <AvatarImage src={profile.pictureUrl} alt={profile.displayName} />
                  <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">{profile.displayName}</p>
                  <p className="text-xs text-slate-500">
                    {(profile.provider === 'google' || profile.provider === 'facebook') && profile.email ? 
                      profile.email : 
                      (profile.statusMessage || `${profile.provider} User`)
                    }
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                disabled={logoutMutation.isPending}
                className="bg-white/80 hover:bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-lg backdrop-blur-sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl ${
            profile.provider === 'line' ? 'bg-gradient-to-br from-[#00C300] to-[#00B300] shadow-[#00C300]/25' : 
            profile.provider === 'google' ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/25' : 'bg-gradient-to-br from-[#1877F2] to-[#166FE5] shadow-[#1877F2]/25'
          }`}>
            <CheckCircle className="text-4xl text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Welcome to {profile.provider === 'line' ? 'Line' : 
                       profile.provider === 'google' ? 'Google' : 'Facebook'} Demo!
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            You have successfully authenticated with {profile.provider === 'line' ? 'Line' : 
                                                    profile.provider === 'google' ? 'Google' : 'Facebook'}. 
            Here's your profile information and available features.
          </p>
        </div>

        {/* Profile Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Profile Card */}
          <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/15 transition-all duration-300 hover:scale-[1.02] rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  profile.provider === 'line' ? 'bg-line-green-light' : 
                  profile.provider === 'google' ? 'bg-blue-100' : 'bg-blue-50'
                }`}>
                  <User className={`text-xl ${
                    profile.provider === 'line' ? 'text-line-green' : 
                    profile.provider === 'google' ? 'text-blue-600' : 'text-blue-700'
                  }`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Profile Information</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Display Name:</span>
                  <span className="font-medium text-slate-900">{profile.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">User ID:</span>
                  <span className="font-medium text-slate-900 font-mono text-xs">{profile.userId}</span>
                </div>
                {(profile.provider === 'google' || profile.provider === 'facebook') && profile.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-medium text-slate-900">{profile.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {profile.provider === 'line' ? 'Status:' : 'Provider:'}
                  </span>
                  <span className={`font-medium ${
                    profile.provider === 'line' ? 'text-line-green' : 
                    profile.provider === 'google' ? 'text-blue-600' : 'text-blue-700'
                  }`}>
                    {profile.provider === 'line' ? 
                      (profile.statusMessage || "Active User") : 
                      profile.provider === 'google' ? 'Google Account' : 'Facebook Account'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Info Card */}
          <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/15 transition-all duration-300 hover:scale-[1.02] rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-blue-600 text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Session Details</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Login Time:</span>
                  <span className="font-medium text-slate-900">{formatTime(profile.loginTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Session Status:</span>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    Active
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Activity:</span>
                  <span className="font-medium text-slate-900">Just now</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Channel Info Card */}
          <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/15 transition-all duration-300 hover:scale-[1.02] rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="text-purple-600 text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Channel Info</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Channel ID:</span>
                  <span className="font-medium text-slate-900 font-mono text-xs">2007715339</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">OAuth Status:</span>
                  <Badge className="bg-line-green-light text-line-green hover:bg-line-green-light">
                    Connected
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Permissions:</span>
                  <span className="font-medium text-slate-900">Profile Access</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button className="bg-line-green hover:bg-line-green-dark text-white font-semibold py-3 px-8 rounded-xl">
            <SiLine className="mr-2 text-lg" />
            Access Line Features
          </Button>
          
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-8 rounded-xl"
          >
            <RefreshCw className="mr-2 w-4 h-4" />
            Refresh Profile
          </Button>
        </div>

        {/* Developer Info */}
        <div className="mt-16 bg-slate-50 rounded-xl p-8 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
            <Settings className="text-slate-600" />
            <span>Developer Information</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-slate-700 mb-2">OAuth Configuration</h4>
              <div className="space-y-2 font-mono text-xs bg-white p-4 rounded-lg border">
                <div><span className="text-slate-500">Channel ID:</span> <span className="text-slate-900">2007715339</span></div>
                <div><span className="text-slate-500">Environment:</span> <span className="text-slate-900">Development</span></div>
                <div><span className="text-slate-500">Callback URL:</span> <span className="text-slate-900">localhost:5000/api/auth/line/callback</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-slate-700 mb-2">Implementation Status</h4>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="text-line-green mt-0.5 text-sm" />
                  <span>Line OAuth flow implemented</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="text-line-green mt-0.5 text-sm" />
                  <span>Secure session management active</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="text-line-green mt-0.5 text-sm" />
                  <span>Profile data retrieved from Line API</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
