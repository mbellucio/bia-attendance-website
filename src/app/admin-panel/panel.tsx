"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowPathIcon, ArrowsRightLeftIcon, TrashIcon } from "@heroicons/react/24/outline";
import { network } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type DiscordRole = { id: string; name: string };
type CategoryKey = "department" | "rank" | "ribbon" | "competence" | "timeServed" | "miscellaneous";
type Category = { key: CategoryKey; label: string; roles: DiscordRole[] };
type Board = { roles: DiscordRole[]; unassignedRoleIds: string[]; categories: Category[] };
type RoleItemProps = {
  role: DiscordRole;
  categories: Category[];
  busy: boolean;
  onMove: (roleId: string, category: CategoryKey) => void;
  onDelete: (role: DiscordRole) => void;
  onDragStart: (roleId: string) => void;
};

function RoleItem({ role, categories, busy, onMove, onDelete, onDragStart }: RoleItemProps) {
  return <li draggable={!busy} onDragStart={() => onDragStart(role.id)}
    className="rounded-sm border border-white/10 bg-[#222822] p-3 text-xs text-[#e7e7dc] shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <span className="min-w-0 break-words font-medium">{role.name}</span>
      <button type="button" aria-label={"Delete " + role.name} title="Delete role" disabled={busy} onClick={(event) => { event.stopPropagation(); onDelete(role); }}
        className="shrink-0 rounded-sm p-1 text-[#bba59c] hover:bg-[#934230]/20 hover:text-[#edb1a0] disabled:opacity-50"><TrashIcon className="size-4" aria-hidden="true" /></button>
    </div>
    <label className="mt-3 block">
      <span className="sr-only">Move {role.name} to a category</span>
      <span className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-wider text-[#90988b]"><ArrowsRightLeftIcon className="size-3" aria-hidden="true" /> Move role</span>
      <select value="" disabled={busy} onChange={(event) => {
        if (event.target.value) onMove(role.id, event.target.value as CategoryKey);
        event.target.value = "";
      }} className="min-h-9 w-full border border-white/10 bg-[#171b18] px-2 text-[10px] text-[#cbd1c2] focus:border-[#a8bc7a] focus:outline-none">
        <option value="">Move to category...</option>
        {categories.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
      </select>
    </label>
  </li>;
}

export default function DiscordRolesPanel() {
  const [board, setBoard] = useState<Board>({ roles: [], unassignedRoleIds: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [busyRoleId, setBusyRoleId] = useState<string | null>(null);
  const [draggedRoleId, setDraggedRoleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncCount, setLastSyncCount] = useState<number | null>(null);
  const roleById = useMemo(() => new Map(board.roles.map((role) => [role.id, role])), [board.roles]);

  const loadBoard = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try { setBoard(await network.get<Board>(endpoints.admin.discordRoles)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load Discord roles."); }
    finally { if (showLoading) setLoading(false); }
  }, []);
  useEffect(() => { void loadBoard(true); }, [loadBoard]);

  async function syncRoles() {
    setSyncing(true); setError(null); setLastSyncCount(null);
    try {
      const result = await network.post<{ syncedCount?: number }>(endpoints.admin.syncDiscordRoles);
      setLastSyncCount(result.syncedCount ?? null);
      await loadBoard();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not synchronize Discord roles."); }
    finally { setSyncing(false); }
  }

  async function moveRole(roleId: string, category: CategoryKey) {
    setBusyRoleId(roleId); setError(null);
    try {
      await network.post(endpoints.admin.mapDiscordRole, { roleId, category });
      const role = roleById.get(roleId);
      if (role) setBoard((current) => ({
        ...current,
        unassignedRoleIds: current.unassignedRoleIds.filter((id) => id !== roleId),
        categories: current.categories.map((item) => ({
          ...item,
          roles: item.roles.filter((itemRole) => itemRole.id !== roleId).concat(item.key === category ? [role] : []),
        })),
      }));
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not move Discord role."); }
    finally { setBusyRoleId(null); }
  }

  async function deleteRole(role: DiscordRole) {
    
    setBusyRoleId(role.id); setError(null);
    try {
      await network.delete(endpoints.admin.deleteDiscordRole(role.id));
      setBoard((current) => ({
        ...current,
        roles: current.roles.filter((item) => item.id !== role.id),
        unassignedRoleIds: current.unassignedRoleIds.filter((id) => id !== role.id),
        categories: current.categories.map((category) => ({ ...category, roles: category.roles.filter((item) => item.id !== role.id) })),
      }));
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete Discord role."); }
    finally { setBusyRoleId(null); }
  }

  function dropOn(category: CategoryKey) {
    if (draggedRoleId) void moveRole(draggedRoleId, category);
    setDraggedRoleId(null);
  }

  const unassigned = board.unassignedRoleIds.flatMap((id) => {
    const role = roleById.get(id);
    return role ? [role] : [];
  });

  return <section className="mb-8" aria-label="Discord role classification">
    <div className="mb-4 flex flex-col gap-4 border border-white/10 bg-[#1a1e1b] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <h2 className="m-0 text-lg font-semibold text-[#f3f1e8]">Discord roles</h2>
        <p className="mb-0 mt-1 text-xs leading-5 text-[#aeb5a7]">Drag a role to a category or choose a destination in its menu.</p>
      </div>
      <button className="min-h-11 border border-[#a8bc7a]/70 bg-[#506846]/30 px-4 text-[10px] font-semibold uppercase tracking-[.12em] text-[#e2e8d5] transition-colors hover:bg-[#506846]/60 disabled:cursor-wait disabled:opacity-60" type="button" onClick={syncRoles} disabled={syncing || loading}>
        <ArrowPathIcon className={"mr-2 inline size-4 " + (syncing ? "animate-spin" : "")} aria-hidden="true" />{syncing ? "Synchronizing..." : "Synchronize roles"}
      </button>
    </div>
    {lastSyncCount !== null && <p className="my-3 text-xs text-[#c8d9ae]" role="status">Synchronized {lastSyncCount} Discord roles.</p>}
    {error && <div className="my-4 border-l-2 border-[#e3a090] bg-[#934230]/10 px-3 py-2 text-xs text-[#edb1a0]" role="alert">{error}</div>}
    <div className="overflow-x-auto border border-white/10 bg-[#1a1e1b] p-3 sm:p-4">
      <div className="flex min-w-max items-stretch gap-3">
        <section className="flex h-[70vh] max-h-[680px] min-h-[360px] w-64 shrink-0 flex-col border border-[#a8bc7a]/25 bg-[#1c231d] p-3" aria-label="Unassigned Discord roles">
          <h3 className="mb-3 mt-1 shrink-0 text-[10px] font-semibold uppercase tracking-[.13em] text-[#a8bc7a]">Discord roles <span className="text-[#9da598]">({unassigned.length})</span></h3>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          {loading ? <p className="text-xs text-[#aeb5a7]">Loading roles...</p> : unassigned.length === 0 ? <p className="text-xs leading-5 text-[#92998c]">No unassigned roles.</p> :
            <ul className="m-0 grid list-none gap-2 p-0">{unassigned.map((role) => <RoleItem key={role.id} role={role} categories={board.categories} busy={busyRoleId === role.id} onMove={moveRole} onDelete={deleteRole} onDragStart={setDraggedRoleId} />)}</ul>}
          </div>
        </section>
        {board.categories.map((category) => <section key={category.key} onDragOver={(event) => event.preventDefault()} onDrop={() => dropOn(category.key)}
          className={"flex h-[70vh] max-h-[680px] min-h-[360px] w-64 shrink-0 flex-col border p-3 transition-colors " + (draggedRoleId ? "border-[#a8bc7a]/50 bg-[#202820]" : "border-white/10 bg-[#1c201d]")}
          aria-label={category.label + " category"}>
          <h3 className="mb-3 mt-1 shrink-0 text-[10px] font-semibold uppercase tracking-[.13em] text-[#a8bc7a]">{category.label} <span className="text-[#9da598]">({category.roles.length})</span></h3>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          {loading ? <p className="text-xs text-[#aeb5a7]">Loading...</p> : category.roles.length === 0 ? <p className="min-h-12 rounded-sm border border-dashed border-white/10 p-3 text-xs leading-5 text-[#92998c]">Drop a role here or move one with its menu.</p> :
            <ul className="m-0 grid list-none gap-2 p-0">{category.roles.map((role) => <RoleItem key={role.id} role={role} categories={board.categories} busy={busyRoleId === role.id} onMove={moveRole} onDelete={deleteRole} onDragStart={setDraggedRoleId} />)}</ul>}
          </div>
        </section>)}
      </div>
    </div>
  </section>;
}