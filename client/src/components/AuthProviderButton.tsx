import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { SiLine, SiFacebook } from "react-icons/si";
import { GoogleIcon } from "@/components/GoogleIcon";

interface AuthProvider {
  name: string;
  displayName: string;
  color: string;
  icon: string;
}

interface AuthProviderButtonProps {
  provider: AuthProvider;
  loading: boolean;
  disabled: boolean;
  onClick: (providerName: string) => void;
}

const iconComponents = {
  SiLine: SiLine,
  SiFacebook: SiFacebook,
  GoogleIcon: GoogleIcon,
};

export function AuthProviderButton({ provider, loading, disabled, onClick }: AuthProviderButtonProps) {
  const IconComponent = iconComponents[provider.icon as keyof typeof iconComponents];
  
  const getButtonStyles = () => {
    switch (provider.name) {
      case 'line':
        return "bg-gradient-to-r from-[#00C300] to-[#00B300] hover:from-[#00B300] hover:to-[#00A300] text-white shadow-lg shadow-[#00C300]/25";
      case 'google':
        return "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 shadow-lg shadow-gray-200/50";
      case 'facebook':
        return "bg-gradient-to-r from-[#1877F2] to-[#166FE5] hover:from-[#166FE5] hover:to-[#1565D8] text-white shadow-lg shadow-[#1877F2]/25";
      default:
        return "bg-gray-600 hover:bg-gray-700 text-white shadow-lg shadow-gray-500/25";
    }
  };

  return (
    <Button
      onClick={() => onClick(provider.name)}
      disabled={disabled}
      className={`w-full font-semibold py-4 px-6 h-auto rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden group ${getButtonStyles()}`}
    >
      <div className="relative z-10">
        {loading ? (
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Connecting...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-3">
            {IconComponent && (
              provider.icon === 'GoogleIcon' ? (
                <GoogleIcon size={20} className="group-hover:scale-110 transition-transform duration-200" />
              ) : (
                <IconComponent className="text-xl group-hover:scale-110 transition-transform duration-200" />
              )
            )}
            <span className="text-lg">Continue with {provider.displayName}</span>
            <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Subtle animated background shimmer */}
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
      )}
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </Button>
  );
}