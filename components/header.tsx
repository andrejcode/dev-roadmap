import { Button } from './ui/button'
import { ModeToggle } from './mode-toggle'

export function Header() {
  return (
    <header className="shrink-0 border-b bg-background">
      <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6">
        <span className="font-heading text-lg font-bold">DevRoadmap</span>

        <div className="flex items-center space-x-2">
          <ModeToggle />
          <Button type="button">Log in</Button>
        </div>
      </div>
    </header>
  )
}
