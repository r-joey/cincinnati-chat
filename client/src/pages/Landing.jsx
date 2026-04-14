import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, MessageCircle } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        {/* Hotel Logo / Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/30 mb-4">
            <Building2 className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Cincinnati Hotel
          </h1>
          <p className="text-lg text-blue-200/70">
            Welcome! How can we assist you today?
          </p>
        </div>

        {/* Role Selection */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <button
            onClick={() => navigate('/admin')}
            className="group flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-xl text-white transition-all duration-200 cursor-pointer"
          >
            <ShieldCheck className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="font-semibold text-lg">Admin</div>
              <div className="text-sm text-blue-200/60">Manage hotel info & view stats</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/chat')}
            className="group flex items-center gap-3 px-8 py-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 hover:border-amber-500/60 rounded-xl text-white transition-all duration-200 cursor-pointer"
          >
            <MessageCircle className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="font-semibold text-lg">Regular User</div>
              <div className="text-sm text-blue-200/60">Chat with our hotel assistant</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
