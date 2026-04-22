import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Bell, Briefcase, ClipboardList, Brain, Target, X } from 'lucide-react';
import { formatINRCompact } from '../../utils/formatters';
import usePortfolioStore from '../../store/portfolioStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/market', label: 'Market', Icon: TrendingUp },
  { to: '/signals', label: 'Signals', Icon: Bell },
  { to: '/ai-strategy', label: 'AI Strategy', Icon: Brain },
  { to: '/manual-strategy', label: 'Manual Strategy', Icon: Target },
  { to: '/portfolio', label: 'Portfolio', Icon: Briefcase },
  { to: '/trades', label: 'Trades', Icon: ClipboardList },
];

export default function Sidebar({ open, onClose }) {
  const cash = usePortfolioStore((s) => s.cashBalance);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 z-50 h-full w-60 bg-[#111827] border-r border-[#1F2937] flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#1F2937]">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <span className="text-lg font-bold text-white">TradeBot</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-[#9CA3AF] hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                  ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-l-[3px] border-[#3B82F6]'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-[#1a2235]'
                }`
              }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Balance */}
        <div className="p-4 mx-3 mb-4 rounded-xl bg-gradient-to-br from-[#1a2235] to-[#111827] border border-[#1F2937]">
          <p className="text-xs text-[#9CA3AF] mb-1">Virtual Balance</p>
          <p className="text-lg font-bold font-mono text-white">💰 {formatINRCompact(cash)}</p>
          <p className="text-[10px] text-[#6B7280] mt-1">Paper Trading Mode</p>
        </div>
      </aside>
    </>
  );
}
