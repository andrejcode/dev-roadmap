import { Roadmap } from '@/components/roadmap'
import { frontendRoadmap } from '@/lib/roadmap/frontend'

export default function Home() {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <Roadmap roadmap={frontendRoadmap} />
    </main>
  )
}
