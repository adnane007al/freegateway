import { Dialog, DialogPopup, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'

// The shortcut sheet, opened with `?`.
//
// Every row here is a shortcut that actually exists:
//   Ctrl/⌘+K  command palette      (components/command-palette.tsx)
//   Escape    close dialog/palette (components/command-palette.tsx)
//   G then … jump to a section    (components/keyboard-shortcuts.tsx)
//   ?         this sheet           (components/keyboard-shortcuts.tsx)

const SHORTCUTS: { keys: string; descKey: string }[] = [
  { keys: 'Ctrl/⌘ + K', descKey: 'shortcuts.openPalette' },
  { keys: 'G then M', descKey: 'shortcuts.goModels' },
  { keys: 'G then K', descKey: 'shortcuts.goKeys' },
  { keys: 'G then A', descKey: 'shortcuts.goAnalytics' },
  { keys: 'G then P', descKey: 'shortcuts.goPlayground' },
  { keys: '?', descKey: 'shortcuts.showHelp' },
  { keys: 'Esc', descKey: 'shortcuts.close' },
]

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup maxWidth="max-w-md">
        <DialogTitle>{t('shortcuts.title')}</DialogTitle>
        <DialogDescription className="mb-4">{t('shortcuts.description')}</DialogDescription>
        <div className="space-y-2">
          {SHORTCUTS.map(s => (
            <div key={s.keys} className="flex items-center justify-between gap-4 rounded-sm border-2 border-foreground/20 bg-card px-3 py-2">
              <span className="text-sm text-muted-foreground">{t(s.descKey)}</span>
              <kbd className="rounded-sm border-2 border-foreground bg-muted px-2 py-0.5 font-mono text-xs font-bold">{s.keys}</kbd>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>{t('shortcuts.closeButton')}</Button>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
