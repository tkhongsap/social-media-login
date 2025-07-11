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
        return "bg-line-green hover:bg-line-green-dark text-white";
      case 'google':
        return "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400";
      case 'facebook':
        return "bg-facebook-blue hover:bg-facebook-blue-dark text-white";
      default:
        return "bg-gray-600 hover:bg-gray-700 text-white";
    }
  };

  return (
    <Button
      onClick={() => onClick(provider.name)}
      disabled={disabled}
      className={`w-full font-semibold py-4 px-6 h-auto rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl mb-4 ${getButtonStyles()}`}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Authenticating...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-3 group">
          {IconComponent && (
            provider.icon === 'GoogleIcon' ? (
              <GoogleIcon size={20} className="group-hover:scale-110 transition-transform duration-200" />
            ) : (
              <IconComponent className="text-xl group-hover:scale-110 transition-transform duration-200" />
            )
          )}
          <span>Continue with {provider.displayName}</span>
          <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </Button>
  );
}