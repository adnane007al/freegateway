
import { Dialog, DialogPopup, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const SHORTCUTS = [
  { keys: 'Ctrl/⌘ + K', desc: 'Open command palette' },
  { keys: 'G then M', desc: 'Go to Models' },
  { keys: 'G then K', desc: 'Go to Keys' },
  { keys: 'G then A', desc: 'Go to Analytics' },
  { keys: 'G then P', desc: 'Go to Playground' },
  { keys: '?', desc: 'Show this shortcuts help' },
  { keys: 'Esc', desc: 'Close dialog / palette' },
]

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup maxWidth="max-w-md">
        <DialogTitle>Keyboard shortcuts</DialogTitle>
        <DialogDescription className="mb-4">Navigate FreeGateway faster.</DialogDescription>
        <div className="space-y-2">
          {SHORTCUTS.map(s => (
            <div key={s.keys} className="flex items-center justify-between gap-4 rounded-sm border-2 border-foreground/20 bg-card px-3 py-2">
              <span className="text-sm text-muted-foreground">{s.desc}</span>
              <kbd className="rounded-sm border-2 border-foreground bg-muted px-2 py-0.5 font-mono text-xs font-bold">{s.keys}</kbd>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
