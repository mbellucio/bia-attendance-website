"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowPathIcon, ArrowsRightLeftIcon, Bars3Icon, FunnelIcon, XMarkIcon, TrashIcon } from "@heroicons/react/24/outline";
import { network } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type DiscordRole = { id: string; name: string; sortOrder?: number };
type CategoryKey = "department" | "rank" | "ribbon" | "competence" | "timeServed" | "miscellaneous";
type Category = { key: CategoryKey; label: string; roles: DiscordRole[] };
type Board = { roles: DiscordRole[]; unassignedRoleIds: string[]; categories: Category[] };
type FloatingDrag = {
  element: HTMLElement;
  floatingElement: HTMLElement;
  offsetX: number;
  offsetY: number;
  originalStyle: string | null;
};

function beginFloatingDrag(element: HTMLElement, clientX: number, clientY: number): FloatingDrag {
  const rect = element.getBoundingClientRect();
  const floatingElement = element.cloneNode(true) as HTMLElement;
  floatingElement.setAttribute("aria-hidden", "true");
  floatingElement.style.position = "fixed";
  floatingElement.style.left = String(rect.left) + "px";
  floatingElement.style.top = String(rect.top) + "px";
  floatingElement.style.width = String(rect.width) + "px";
  floatingElement.style.zIndex = "1000";
  floatingElement.style.pointerEvents = "none";
  floatingElement.style.margin = "0";
  floatingElement.style.transition = "none";
  floatingElement.classList.add("ring-1", "ring-[#a8bc7a]", "shadow-2xl");
  floatingElement.querySelectorAll<HTMLElement>("button, select").forEach((control) => {
    control.tabIndex = -1;
  });
  document.body.appendChild(floatingElement);

  const drag: FloatingDrag = {
    element,
    floatingElement,
    offsetX: clientX - rect.left,
    offsetY: clientY - rect.top,
    originalStyle: element.getAttribute("style"),
  };
  element.style.visibility = "hidden";
  return drag;
}

function moveFloatingDrag(drag: FloatingDrag | null, clientX: number, clientY: number) {
  if (!drag) return;
  drag.floatingElement.style.left = String(clientX - drag.offsetX) + "px";
  drag.floatingElement.style.top = String(clientY - drag.offsetY) + "px";
}

function finishFloatingDrag(drag: FloatingDrag | null) {
  if (!drag) return;
  if (drag.originalStyle === null) drag.element.removeAttribute("style");
  else drag.element.setAttribute("style", drag.originalStyle);
  drag.floatingElement.remove();
}

type RoleItemProps = {
  role: DiscordRole;
  categories: Category[];
  busy: boolean;
  isDragging: boolean;
  onMove: (roleId: string, category: CategoryKey) => void;
  onDelete: (role: DiscordRole) => void;
  onDragStart: (roleId: string, event: ReactPointerEvent<HTMLLIElement>) => void;
};

function RoleItem({ role, categories, busy, isDragging, onMove, onDelete, onDragStart }: RoleItemProps) {
  return <li onPointerDown={(event) => {
    if (busy || (event.target instanceof Element && event.target.closest("button, select"))) return;
    onDragStart(role.id, event);
  }}
    className={"touch-none select-none rounded-sm border border-white/10 bg-[#222822] p-3 text-xs text-[#e7e7dc] shadow-sm transition-opacity " + (isDragging ? "ring-1 ring-[#a8bc7a] shadow-xl" : "")}>
    <div className="flex items-start justify-between gap-2">
      <span className="min-w-0 break-words font-medium">{role.name}</span>
      <span className="flex shrink-0 items-center gap-1">
        <button type="button" aria-label={"Delete " + role.name} title="Delete role" disabled={busy} onClick={(event) => { event.stopPropagation(); onDelete(role); }} className="rounded-sm p-1 text-[#bba59c] hover:bg-[#934230]/20 hover:text-[#edb1a0] disabled:opacity-50"><TrashIcon className="size-4" aria-hidden="true" /></button>
      </span>
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
  const [dragTargetCategory, setDragTargetCategory] = useState<CategoryKey | null>(null);
  const roleDragRef = useRef<{ roleId: string; pointerId: number; startX: number; startY: number; moved: boolean } | null>(null);
  const roleFloatingDragRef = useRef<FloatingDrag | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncCount, setLastSyncCount] = useState<number | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [draftRankIds, setDraftRankIds] = useState<string[]>([]);
  const [draggedRankId, setDraggedRankId] = useState<string | null>(null);
  const rankDragRef = useRef<{ roleId: string; pointerId: number } | null>(null);
  const rankFloatingDragRef = useRef<FloatingDrag | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState("");
  const roleById = useMemo(() => new Map(board.roles.map((role) => [role.id, role])), [board.roles]);

  const loadBoard = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try { setBoard(await network.get<Board>(endpoints.admin.discordRoles)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load Discord roles."); }
    finally { if (showLoading) setLoading(false); }
  }, []);
  useEffect(() => { void loadBoard(true); }, [loadBoard]);

  useEffect(() => {
    if (!draggedRoleId) return;
    const handlePointerMove = (event: PointerEvent) => {
      const drag = roleDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) > 3) drag.moved = true;
      moveFloatingDrag(roleFloatingDragRef.current, event.clientX, event.clientY);
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-role-category]");
      setDragTargetCategory(target?.dataset.roleCategory as CategoryKey | undefined ?? null);
    };
    const handlePointerUp = (event: PointerEvent) => {
      const drag = roleDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-role-category]");
      const category = target?.dataset.roleCategory as CategoryKey | undefined;
      finishFloatingDrag(roleFloatingDragRef.current);
      roleFloatingDragRef.current = null;
      if (drag.moved && category) void moveRoleRef.current(drag.roleId, category);
      roleDragRef.current = null;
      setDraggedRoleId(null);
      setDragTargetCategory(null);
    };
    const handlePointerCancel = () => {
      finishFloatingDrag(roleFloatingDragRef.current);
      roleFloatingDragRef.current = null;
      roleDragRef.current = null;
      setDraggedRoleId(null);
      setDragTargetCategory(null);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [draggedRoleId]);

  useEffect(() => {
    if (!draggedRankId) return;
    const handlePointerMove = (event: PointerEvent) => {
      const drag = rankDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      moveFloatingDrag(rankFloatingDragRef.current, event.clientX, event.clientY);
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-rank-sort-id]");
      const targetId = target?.dataset.rankSortId;
      if (!targetId || targetId === drag.roleId) return;
      const rect = target.getBoundingClientRect();
      const insertAfter = event.clientY > rect.top + rect.height / 2;
      setDraftRankIds((current) => {
        const sourceIndex = current.indexOf(drag.roleId);
        const targetIndex = current.indexOf(targetId);
        if (sourceIndex < 0 || targetIndex < 0) return current;
        const next = [...current];
        next.splice(sourceIndex, 1);
        const nextTargetIndex = next.indexOf(targetId);
        next.splice(nextTargetIndex + (insertAfter ? 1 : 0), 0, drag.roleId);
        return next.every((id, index) => id === current[index]) ? current : next;
      });
    };
    const handlePointerUp = (event: PointerEvent) => {
      if (rankDragRef.current?.pointerId !== event.pointerId) return;
      finishFloatingDrag(rankFloatingDragRef.current);
      rankFloatingDragRef.current = null;
      rankDragRef.current = null;
      setDraggedRankId(null);
    };
    const handlePointerCancel = () => {
      finishFloatingDrag(rankFloatingDragRef.current);
      rankFloatingDragRef.current = null;
      rankDragRef.current = null;
      setDraggedRankId(null);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [draggedRankId]);

  async function syncRoles() {
    setSyncing(true); setError(null); setLastSyncCount(null);
    try {
      const result = await network.post<{ syncedCount?: number }>(endpoints.admin.syncDiscordRoles);
      setLastSyncCount(result.syncedCount ?? null);
      await loadBoard();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not synchronize Discord roles."); }
    finally { setSyncing(false); }
  }

  function openRankOrder() {
    const ranks = board.categories.find((category) => category.key === "rank")?.roles ?? [];
    setDraftRankIds(ranks.map((role) => role.id));
    setOrderOpen(true);
  }

  function moveDraftRank(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setDraftRankIds((current) => {
      if (fromIndex >= current.length || toIndex >= current.length) return current;
      const next = [...current];
      const [moving] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moving);
      return next;
    });
  }

  function startRankDrag(roleId: string, event: ReactPointerEvent<HTMLButtonElement>) {
    if (savingOrder) return;
    event.preventDefault();
    const element = event.currentTarget.closest<HTMLElement>("li[data-rank-sort-id]");
    if (!element) return;
    rankFloatingDragRef.current = beginFloatingDrag(element, event.clientX, event.clientY);
    rankDragRef.current = { roleId, pointerId: event.pointerId };
    setDraggedRankId(roleId);
  }

  function startRoleDrag(roleId: string, event: ReactPointerEvent<HTMLLIElement>) {
    event.preventDefault();
    roleFloatingDragRef.current = beginFloatingDrag(event.currentTarget, event.clientX, event.clientY);
    roleDragRef.current = { roleId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
    setDraggedRoleId(roleId);
  }

  async function saveRankOrder() {
    setSavingOrder(true); setError(null);
    try {
      await network.post(endpoints.admin.orderDiscordRole, { category: "rank", roleIds: draftRankIds });
      await loadBoard();
      setOrderOpen(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save rank order."); }
    finally { setSavingOrder(false); }
  }
  const moveRole = useCallback(async (roleId: string, category: CategoryKey) => {
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
  }, [roleById]);
  const moveRoleRef = useRef(moveRole);
  useEffect(() => { moveRoleRef.current = moveRole; }, [moveRole]);

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

  const normalizedFilter = filter.trim().toLocaleLowerCase();
  const matchesFilter = (role: DiscordRole) => !normalizedFilter || role.name.toLocaleLowerCase().includes(normalizedFilter);
  const rankCategory = board.categories.find((category) => category.key === "rank");
  const unassigned = board.unassignedRoleIds.flatMap((id) => {
    const role = roleById.get(id);
    return role && matchesFilter(role) ? [role] : [];
  });

  return <section className="mb-8" aria-label="Discord role classification">
    <div className="mb-4 flex flex-col gap-4 border border-white/10 bg-[#1a1e1b] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <h2 className="m-0 text-lg font-semibold text-[#f3f1e8]">Discord roles</h2>
        <p className="mb-0 mt-1 text-xs leading-5 text-[#aeb5a7]">Drag roles to a category or choose a destination. Rank order is highest to lowest from top to bottom; Time Served follows its leading number.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => setShowFilter((current) => !current)} aria-expanded={showFilter} className="min-h-11 border border-white/15 px-4 text-[10px] font-semibold uppercase tracking-[.12em] text-[#cbd1c2] hover:border-[#a8bc7a]/60 hover:text-[#e2e8d5]"><FunnelIcon className="mr-2 inline size-4" aria-hidden="true" />Filter</button>
      <button className="min-h-11 border border-[#a8bc7a]/70 bg-[#506846]/30 px-4 text-[10px] font-semibold uppercase tracking-[.12em] text-[#e2e8d5] transition-colors hover:bg-[#506846]/60 disabled:cursor-wait disabled:opacity-60" type="button" onClick={syncRoles} disabled={syncing || loading}>
        <ArrowPathIcon className={"mr-2 inline size-4 " + (syncing ? "animate-spin" : "")} aria-hidden="true" />{syncing ? "Synchronizing..." : "Synchronize roles"}
      </button>
    </div>
    </div>
    {showFilter && <label className="mb-4 flex items-center gap-3 border border-white/10 bg-[#1a1e1b] px-4 py-3">
      <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-[#a8bc7a]">Filter roles</span>
      <input autoFocus value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search role names..." className="min-w-0 flex-1 bg-transparent text-sm text-[#f3f1e8] outline-none placeholder:text-[#697166]" />
      {filter && <button type="button" onClick={() => setFilter("")} aria-label="Clear role filter" className="text-[#aeb5a7] hover:text-white"><XMarkIcon className="size-4" aria-hidden="true" /></button>}
    </label>}
    {lastSyncCount !== null && <p className="my-3 text-xs text-[#c8d9ae]" role="status">Synchronized {lastSyncCount} Discord roles.</p>}
    {error && <div className="my-4 border-l-2 border-[#e3a090] bg-[#934230]/10 px-3 py-2 text-xs text-[#edb1a0]" role="alert">{error}</div>}
    <div className="overflow-x-auto border border-white/10 bg-[#1a1e1b] p-3 sm:p-4">
      <div className="flex min-w-max items-stretch gap-3">
        <section className="flex h-[70vh] max-h-[680px] min-h-[360px] w-64 shrink-0 flex-col border border-[#a8bc7a]/25 bg-[#1c231d] p-3" aria-label="Unassigned Discord roles">
          <h3 className="mb-3 mt-1 shrink-0 text-[10px] font-semibold uppercase tracking-[.13em] text-[#a8bc7a]">Discord roles <span className="text-[#9da598]">({unassigned.length})</span></h3>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          {loading ? <p className="text-xs text-[#aeb5a7]">Loading roles...</p> : unassigned.length === 0 ? <p className="text-xs leading-5 text-[#92998c]">No unassigned roles.</p> :
            <ul className="m-0 grid list-none gap-2 p-0">{unassigned.map((role) => <RoleItem key={role.id} role={role} categories={board.categories} busy={busyRoleId === role.id} isDragging={draggedRoleId === role.id} onMove={moveRole} onDelete={deleteRole} onDragStart={startRoleDrag} />)}</ul>}
          </div>
        </section>
        {board.categories.map((category) => <section key={category.key} data-role-category={category.key}
          className={"flex h-[70vh] max-h-[680px] min-h-[360px] w-64 shrink-0 flex-col border p-3 transition-colors " + (dragTargetCategory === category.key ? "border-[#a8bc7a] bg-[#2b372b]" : "border-white/10 bg-[#1c201d]")}
          aria-label={category.label + " category"}>
          <div className="mb-3 mt-1 flex shrink-0 items-center justify-between gap-2"><h3 className="m-0 text-[10px] font-semibold uppercase tracking-[.13em] text-[#a8bc7a]">{category.label} <span className="text-[#9da598]">({category.roles.filter(matchesFilter).length})</span></h3>{category.key === "rank" && <button type="button" onClick={openRankOrder} disabled={loading || !rankCategory?.roles.length} className="border border-[#a8bc7a]/40 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-[#d5dfc5] hover:bg-[#506846]/30 disabled:opacity-40">Order</button>}</div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          {loading ? <p className="text-xs text-[#aeb5a7]">Loading...</p> : category.roles.filter(matchesFilter).length === 0 ? <p className="min-h-12 rounded-sm border border-dashed border-white/10 p-3 text-xs leading-5 text-[#92998c]">Drop a role here or move one with its menu.</p> :
            <ul className="m-0 grid list-none gap-2 p-0">{category.roles.filter(matchesFilter).map((role) => <RoleItem key={role.id} role={role} categories={board.categories} busy={busyRoleId === role.id} isDragging={draggedRoleId === role.id} onMove={moveRole} onDelete={deleteRole} onDragStart={startRoleDrag} />)}</ul>}
          </div>
        </section>)}
      </div>
    </div>
    {orderOpen && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/75 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingOrder) setOrderOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="rank-order-title" className="flex max-h-[90vh] w-full max-w-2xl flex-col border border-white/15 bg-[#171b18] shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6"><div><p className="m-0 text-[9px] font-semibold uppercase tracking-[.15em] text-[#a8bc7a]">RANKS</p><h3 id="rank-order-title" className="mb-0 mt-2 text-xl font-semibold text-[#f3f1e8]">Order ranks</h3><p className="mb-0 mt-2 text-xs text-[#aeb5a7]">Top to bottom: highest rank to lowest rank.</p></div><button type="button" aria-label="Close rank ordering" onClick={() => setOrderOpen(false)} disabled={savingOrder} className="rounded-sm p-2 text-[#aeb5a7] hover:bg-white/10 hover:text-white disabled:opacity-40"><XMarkIcon className="size-5" aria-hidden="true" /></button></header>
        <ol className="m-0 min-h-0 flex-1 list-none space-y-2 overflow-y-auto p-4 sm:p-6">{draftRankIds.map((roleId, index) => { const role = roleById.get(roleId); if (!role) return null; return <li key={roleId} data-rank-sort-id={roleId} className={"flex items-center gap-3 border border-white/10 bg-[#222822] px-4 py-3 text-sm text-[#e7e7dc] transition-opacity " + (draggedRankId === roleId ? "ring-1 ring-[#a8bc7a] shadow-xl" : "")}><button type="button" aria-label={"Drag to reorder " + role.name} disabled={savingOrder} onPointerDown={(event) => startRankDrag(roleId, event)} onKeyDown={(event) => { if (event.key === "ArrowUp") { event.preventDefault(); moveDraftRank(index, index - 1); } else if (event.key === "ArrowDown") { event.preventDefault(); moveDraftRank(index, index + 1); } }} className="cursor-grab touch-none text-[#a8bc7a] active:cursor-grabbing disabled:cursor-not-allowed"><Bars3Icon className="size-5 shrink-0" aria-hidden="true" /></button><span className="w-7 shrink-0 text-xs tabular-nums text-[#879080]">{index + 1}.</span><span className="min-w-0 flex-1 break-words">{role.name}</span></li>; })}</ol>
        <footer className="flex shrink-0 justify-end gap-2 border-t border-white/10 p-4"><button type="button" disabled={savingOrder} onClick={() => setOrderOpen(false)} className="min-h-10 border border-white/15 px-4 text-xs text-[#e7e7dc] hover:bg-white/5 disabled:opacity-40">Cancel</button><button type="button" disabled={savingOrder} onClick={saveRankOrder} className="min-h-10 border border-[#a8bc7a]/70 bg-[#506846]/30 px-5 text-xs font-semibold text-[#e2e8d5] hover:bg-[#506846]/60 disabled:cursor-wait disabled:opacity-50">{savingOrder ? "Saving..." : "Save order"}</button></footer>
      </section>
    </div>}
  </section>;
}
