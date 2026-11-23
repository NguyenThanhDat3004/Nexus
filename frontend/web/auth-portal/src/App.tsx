import React, { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { LoginView } from './LoginView';
import { ParticleField } from './components/ParticleField';
import { useSsoLogin } from './hooks/useSsoLogin';

function AuthPortalContent() {
  const { initiateSso, handleSsoCallback, isLoading, error } = useSsoLogin();

  // Khi Google redirect về có ?code=..., tự động đổi token và chuyển trang ngay tức thì
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      handleSsoCallback(code, 'GOOGLE', window.location.origin + '/oauth/callback');
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 bg-[#f4f6fb] overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Interactive Mouse Spider-Web Particle Canvas */}
      <ParticleField />

      {/* Deep High-Tech Ambient Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30 z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #94a3b8 1.2px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Dynamic Dual Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-radial from-indigo-300/30 via-purple-100/15 to-transparent pointer-events-none blur-3xl z-0" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-radial from-blue-200/25 via-transparent to-transparent pointer-events-none blur-3xl z-0" />

      {/* Central Auth Container */}
      <div className="relative z-10 w-full max-w-[560px]">
        <LoginView 
          onGoogleSignIn={() => initiateSso('GOOGLE')}
          onMicrosoftSignIn={() => initiateSso('MICROSOFT')}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* Enterprise Security Footer */}
      <footer className="relative z-10 mt-10 text-center font-mono text-xs text-slate-400 tracking-wider uppercase space-y-1">
        <p>NEXUS EVIDENTIARY ARCHITECTURE &bull; HARDENED ZERO-TRUST PORTAL</p>
        <p className="text-[10px] text-slate-400/80">NODE PROTOCOL: SECURE LEDGER ROUTING &bull; PORT 5170</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthPortalContent />
    </AuthProvider>
  );
}
