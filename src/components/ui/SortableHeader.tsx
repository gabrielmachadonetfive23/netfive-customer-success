import { ChevronUpDownIcon } from "@/components/icons";

export function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th
      scope="col"
      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-netfive-gray-500"
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1 hover:text-netfive-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-netfive-red"
      >
        {label}
        <ChevronUpDownIcon className={`h-3.5 w-3.5 ${active ? "text-netfive-red" : "opacity-50"}`} />
      </button>
    </th>
  );
}
