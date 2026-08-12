import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollText, Settings, Sparkles } from "lucide-react";

interface HeaderProps {
  showLogs: boolean;
  setShowLogs: Dispatch<SetStateAction<boolean>>;
}

const Header = ({ showLogs, setShowLogs }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className='flex justify-between items-center px-8 py-4 bg-bg-glass backdrop-blur-md border-b border-border-color z-10'>
      {/* Logo */}
      <div className='flex items-center gap-2.5'>
        <Sparkles className='w-4 h-4 text-accent-cyan' strokeWidth={2} />
        <h1 className='text-lg font-extrabold tracking-widest bg-gradient-to-r from-text-main to-accent-cyan bg-clip-text text-transparent font-sans'>
          E C H O
        </h1>
      </div>

      {/* Actions */}
      <div className='flex items-center gap-3'>
        <button
          className={`group flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium border transition-all cursor-pointer ${
            showLogs
              ? "bg-accent-cyan/10 border-accent-cyan/60 text-accent-cyan shadow-[0_0_14px_rgba(0,240,255,0.2)]"
              : "bg-transparent border-border-color text-text-muted hover:text-text-main hover:border-accent-cyan/40 hover:shadow-[0_0_10px_rgba(0,240,255,0.1)]"
          }`}
          onClick={() => setShowLogs(!showLogs)}
        >
          <ScrollText className='w-4 h-4' strokeWidth={2} />
          Logs
        </button>

        <button
          className='group flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-transparent border border-border-color text-text-muted text-sm font-medium hover:text-text-main hover:border-accent-cyan/40 hover:shadow-[0_0_10px_rgba(0,240,255,0.1)] transition-all cursor-pointer'
          onClick={() => navigate("/settings")}
        >
          <Settings className='w-4 h-4 transition-transform duration-500 group-hover:rotate-90' strokeWidth={2} />
          Settings
        </button>
      </div>
    </header>
  );
};

export default Header;
