import { ButtonLink } from "@meridianher/ui/components/button"

/** Feed sort as links, so every view has its own address (PRD 6.3). */
export function SortTabs({ options, current }: { options: { value: string; label: string; href: string }[]; current: string }) {
  return (
    <nav aria-label="Sort posts" className="flex gap-1 overflow-x-auto">
      {options.map((o) => (
        <ButtonLink
          key={o.value}
          href={o.href}
          size="sm"
          variant={o.value === current ? "secondary" : "ghost"}
          aria-current={o.value === current ? "page" : undefined}
        >
          {o.label}
        </ButtonLink>
      ))}
    </nav>
  )
}
