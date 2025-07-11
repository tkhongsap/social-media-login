import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { AuthProviderButton } from "@/components/AuthProviderButton";

interface AuthProvider {
  name: string;
  displayName: string;
  color: string;
  icon: string;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewTabMessage, setShowNewTabMessage] = useState(false);

  // Fetch available authentication providers
  const { data: providersData, isLoading: providersLoading, error: providersError } = useQuery({
    queryKey: ['/api/auth/providers'],
    queryFn: async () => {
      const response = await fetch('/api/auth/providers');
      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }
      return response.json();
    }
  });

  useEffect(() => {
    // Check for auth result in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const authResult = urlParams.get('auth');
    const reason = urlParams.get('reason');
    
    if (authResult === 'success') {
      setLocation('/landing');
    } else if (authResult === 'error') {
      const errorMsg = reason ? `Authentication failed: ${decodeURIComponent(reason)}` : 'Authentication failed. Please try again.';
      setError(errorMsg);
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }
  }, [setLocation]);

  const handleProviderLogin = async (providerName: string) => {
    try {
      setError(null);
      setLoadingProvider(providerName);
      
      const response = await fetch(`/api/auth/${providerName}`);
      if (!response.ok) {
        throw new Error('Failed to initiate authentication');
      }
      
      const data = await response.json();
      
      // Show new tab message
      setShowNewTabMessage(true);
      
      // Open in new tab to avoid WebView restrictions
      const authWindow = window.open(data.authUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
      
      if (!authWindow) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }
      
      // Hide message after 3 seconds
      setTimeout(() => {
        setShowNewTabMessage(false);
      }, 3000);
      
    } catch (error) {
      console.error(`${providerName} login error:`, error);
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setLoadingProvider(null);
    }
  };

  const providers: AuthProvider[] = providersData?.providers || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Choose your preferred login method
              </p>
            </div>

            {/* Loading state for providers */}
            {providersLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading authentication methods...</span>
              </div>
            )}

            {/* Error state for providers */}
            {providersError && (
              <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/50">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-700 dark:text-red-300">
                  Failed to load authentication providers. Please refresh the page.
                </AlertDescription>
              </Alert>
            )}

            {/* Authentication error */}
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/50">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-700 dark:text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* New tab message */}
            {showNewTabMessage && (
              <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/50">
                <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  Authentication opened in a new tab. Complete the login there and return to this page.
                </AlertDescription>
              </Alert>
            )}

            {/* Dynamic provider buttons */}
            {!providersLoading && !providersError && (
              <div className="space-y-0">
                {providers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No authentication providers are currently available.
                  </div>
                ) : (
                  providers.map((provider) => (
                    <AuthProviderButton
                      key={provider.name}
                      provider={provider}
                      loading={loadingProvider === provider.name}
                      disabled={loadingProvider !== null}
                      onClick={handleProviderLogin}
                    />
                  ))
                )}
              </div>
            )}

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}