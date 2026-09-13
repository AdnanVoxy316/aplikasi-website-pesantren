"use client";

import { useRouter } from "next/navigation";

export function TaskSelect({
  basePath,
  paramName = "pengajaranId",
  selectedId,
  options,
  label = "Pilih kelas dan mapel",
}: {
  basePath: string;
  paramName?: string;
  selectedId: string;
  options: { id: string; label: string }[];
  label?: string;
}) {
  const router = useRouter();
  return (
    <select
      className="task-select"
      value={selectedId}
      aria-label={label}
      onChange={(event) => router.push(`${basePath}?${paramName}=${event.target.value}`)}
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
