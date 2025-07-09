import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { SiLine } from "react-icons/si";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewTabMessage, setShowNewTabMessage] = useState(false);

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

  const handleLineLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/line');
      if (!response.ok) {
        throw new Error('Failed to initiate authentication');
      }
      
      const data = await response.json();
      
      // Open in new tab to avoid WebView restrictions
      const newWindow = window.open(data.authUrl, '_blank');
      
      if (!newWindow) {
        // Fallback if popup blocked
        window.location.href = data.authUrl;
      } else {
        // Show message about new tab
        setShowNewTabMessage(true);
        
        // Monitor the new window for closure
        const checkClosed = setInterval(() => {
          if (newWindow.closed) {
            clearInterval(checkClosed);
            setIsLoading(false);
            setShowNewTabMessage(false);
            // Refresh the page to check auth status
            window.location.reload();
          }
        }, 1000);
        
        // Stop loading state after opening new window
        setIsLoading(false);
      }
    } catch (err) {
      setError('Failed to start authentication process');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden shadow-xl border-slate-200">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-line-green to-line-green-dark p-8 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <SiLine className="text-line-green text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-line-green-light text-sm">Sign in with your Line account to continue</p>
          </div>

          <CardContent className="p-8">
            {error && (
              <Alert className="mb-6 border-red-400 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-700 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {showNewTabMessage && (
              <Alert className="mb-6 border-blue-400 bg-blue-50">
                <ExternalLink className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-700 font-medium">
                  A new tab has opened for Line authentication. Please complete the login process and close the tab when finished.
                </AlertDescription>
              </Alert>
            )}

            {/* Line Login Button */}
            <Button
              onClick={handleLineLogin}
              disabled={isLoading}
              className="w-full bg-line-green hover:bg-line-green-dark text-white font-semibold py-4 px-6 h-auto rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3 group">
                  <SiLine className="text-xl group-hover:scale-110 transition-transform duration-200" />
                  <span>Continue with Line</span>
                  <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </Button>

            {/* Terms */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-center text-sm text-slate-500">
                By continuing, you agree to our{" "}
                <a href="#" className="text-line-green hover:underline font-medium">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-line-green hover:underline font-medium">
                  Privacy Policy
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-slate-600 text-sm">
            Don't have a Line account?{" "}
            <a
              href="https://line.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-line-green hover:underline font-medium"
            >
              Create one here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
