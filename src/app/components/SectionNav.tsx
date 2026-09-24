// A small menu that stays at the top while the visitor scrolls a perfume page (like Parfumo's tabs).
export default function SectionNav({ items, label }: { items: { id: string; label: string }[]; label: string }) {
  return (
    <nav aria-label={label} className="section-nav -mx-4 mt-10 border-y border-line px-4 sm:-mx-6 sm:px-6">
      <ul className="flex gap-1 overflow-x-auto py-2 text-sm font-bold [scrollbar-width:none]">
        {items.map(item => (
          <li key={item.id} className="shrink-0">
            <a href={`#${item.id}`} className="block rounded-full px-3.5 py-1.5 text-smoke transition hover:bg-blush hover:text-wine-700">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
