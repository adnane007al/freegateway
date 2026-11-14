import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { KeyRound, LogOut, Menu, MoreHorizontal, RefreshCw, Search, Settings, Sparkles, LayoutGrid, Play, Key, Bot, BarChart3, Crown, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { openCommandPalette } from '@/components/command-palette-state'
import { SettingsDialog } from '@/components/settings-dialog'
import { UpdatesDialog } from '@/components/updates-dialog'
import { OPEN_UPDATES_EVENT } from '@/lib/updates'
import { logout } from '@/lib/api'

import { usePremium } from '@/hooks/use-premium'
import { useI18n } from '@/i18n'
import { ChangeCredentialsModal } from '@/components/auth-gate'

const navItems = [
  { to: '/models', labelKey: 'nav.models', icon: LayoutGrid },
  { to: '/playground', labelKey: 'nav.playground', icon: Play },
  { to: '/keys', labelKey: 'nav.keys', icon: Key },
  { to: '/agents', labelKey: 'nav.agents', icon: Bot },
  { to: '/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
  { to: '/premium', labelKey: 'nav.premium', icon: Crown },
]

const modelItems = [
  { to: '/models/chat', labelKey: 'models.chatModelsTab' },
  { to: '/models/image', labelKey: 'models.imageTab' },
  { to: '/models/video', labelKey: 'models.videoTab' },
  { to: '/models/audio', labelKey: 'models.audioTab' },
  { to: '/models/embeddings', labelKey: 'models.embeddingsTab' },
  { to: '/models/decision', labelKey: 'decision.tab' },
  { to: '/models/search', labelKey: 'search.tab' },
  { to: '/models/fusion', labelKey: 'models.fusionTab' },
]

const analyticsItems = [
  { to: '/analytics', labelKey: 'nav.analytics' },
  { to: '/logs', labelKey: 'nav.logs' },
]

const navMenus: Record<string, { items: { to: string; labelKey: string }[]; isActive: (p: string) => boolean }> = {
  '/models': { items: modelItems, isActive: (p) => p.startsWith('/models') },
  '/analytics': { items: analyticsItems, isActive: (p) => p.startsWith('/analytics') || p.startsWith('/logs') },
}

const isDesktopApp = typeof window !== 'undefined' && (window as any).__FREEGATEWAY_DESKTOP__ === true
export function Sidebar() {
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [updatesOpen, setUpdatesOpen] = useState(false)
  const [credentialsMode, setCredentialsMode] = useState<'password' | 'email' | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: premium, licensed, isLoading: premiumLoading, isError: premiumError } = usePremium()
  const showUpgrade = Boolean(premium) && !licensed && !premiumLoading && !premiumError

  useEffect(() => {
    const open = () => setUpdatesOpen(true)
    window.addEventListener(OPEN_UPDATES_EVENT, open)
    return () => window.removeEventListener(OPEN_UPDATES_EVENT, open)
  }, [])

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b-2 border-foreground bg-background px-4 py-3">
        <span className="font-semibold tracking-tight text-sm">FreeGateway</span>
        <button onClick={() => setMobileOpen(true)} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
          <Menu />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-background border-r p-4 animate-in slide-in-from-left duration-200 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold tracking-tight text-sm">FreeGateway</span>
              <button onClick={() => setMobileOpen(false)} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>✕</button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const menu = navMenus[item.to]
                return (
                  <div key={item.to} className="space-y-1">
                    <NavLink to={item.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive || (menu && menu.isActive(location.pathname)) ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground'}`}>
                      <Icon className="size-4" /> {t(item.labelKey)}
                    </NavLink>
                    {menu && (
                      <div className="ms-7 space-y-0.5">
                        {menu.items.map((e) => (
                          <button key={e.to} onClick={() => { navigate(e.to); setMobileOpen(false) }} className="block w-full text-left rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                            {t(e.labelKey)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r-2 border-foreground bg-sidebar transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <div className="flex items-center justify-between px-3 py-4">
          {!collapsed && <span className="font-semibold tracking-tight text-sm">FreeGateway</span>}
          <button onClick={() => setCollapsed((c) => !c)} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const menu = navMenus[item.to]
            if (menu) {
              return (
                <div key={item.to} className="space-y-1">
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                        isActive || menu.isActive(location.pathname)
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`
                    }
                  >
                    <Icon className="size-4 shrink-0" />
                    {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                  </NavLink>
                  {!collapsed && (
                    <div className="ms-7 space-y-0.5">
                      {menu.items.map((entry) => (
                        <button
                          key={entry.to}
                          onClick={() => navigate(entry.to)}
                          className={`block w-full text-left rounded-md px-2 py-1 text-xs transition-colors ${
                            location.pathname === entry.to
                              ? 'text-foreground font-medium'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {t(entry.labelKey)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                    isActive ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`
                }
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
              </NavLink>
            )
          })}
        </nav>
        <div className="px-2 pb-4 space-y-1 border-t pt-3">
          <button
            onClick={openCommandPalette}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 w-full ${collapsed ? 'justify-center' : ''}`}
          >
            <Search className="size-4 shrink-0" />
            {!collapsed && <span>{t('palette.title')}</span>}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 w-full ${collapsed ? 'justify-center' : ''}`}>
              <MoreHorizontal className="size-4 shrink-0" />
              {!collapsed && <span>{t('nav.openMenu')}</span>}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {showUpgrade && (
                <DropdownMenuItem onClick={() => navigate('/premium')}>
                  <Sparkles /> {t('nav.upgrade')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings /> {t('nav.settings')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setUpdatesOpen(true)}>
                <RefreshCw /> {t('settings.checkForUpdates')}
              </DropdownMenuItem>
              {!isDesktopApp && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCredentialsMode('email')}>
                    <span className="flex size-4 items-center justify-center font-serif text-xs font-bold">@</span> {t('auth.changeEmail')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCredentialsMode('password')}>
                    <KeyRound /> {t('auth.changePassword')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut /> {t('nav.signOut')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        <UpdatesDialog open={updatesOpen} onOpenChange={setUpdatesOpen} />
        {credentialsMode && (
          <ChangeCredentialsModal mode={credentialsMode} onClose={() => setCredentialsMode(null)} />
        )}
      </aside>
    </>
  )
}


