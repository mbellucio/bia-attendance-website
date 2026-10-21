"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, UserCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/actions/button";
import { SearchBar } from "@/components/ui/forms/search-bar";
import { SelectField } from "@/components/ui/forms/select-field";
import { ToggleSwitch } from "@/components/ui/forms/toggle-switch";
import { network } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type UserRole = { category: string; name: string; iconPath: string | null };
type UserRecord = { id: string; name: string; discordLinked: boolean; admin: boolean; rankSortOrder: number; roles: UserRole[] };
type UserResponse = { users: UserRecord[] };
type SyncResult = { syncedCount: number; skippedCount: number };

const PAGE_SIZE = 18;
const normalize = (value: string) => value.trim().toLocaleLowerCase();

export default function ManageUsersPanel() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [updatingAdmin, setUpdatingAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [page, setPage] = useState(1);

  const loadUsers = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try { setUsers((await network.get<UserResponse>(endpoints.admin.users)).users); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load users."); }
    finally { if (showLoading) setLoading(false); }
  }, []);
  useEffect(() => { void loadUsers(true); }, [loadUsers]);

  async function updateAdminAccess(user: UserRecord, admin: boolean) {
    setUpdatingAdmin(true); setError(null);
    try {
      await network.patch(endpoints.admin.userAdmin, { userId: user.id, admin });
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, admin } : item));
      setSelected((current) => current?.id === user.id ? { ...current, admin } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update administrator access.");
    } finally { setUpdatingAdmin(false); }
  }
  async function syncUsers() {
    setSyncing(true); setError(null); setMessage(null);
    try {
      const result = await network.post<SyncResult>(endpoints.admin.syncUsers);
      setMessage(`Synchronized ${result.syncedCount} users. ${result.skippedCount} linked accounts were not found in the Discord server.`);
      await loadUsers();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not synchronize users."); }
    finally { setSyncing(false); }
  }
  const rankOptions = useMemo(() => [...new Set(users.flatMap((user) => user.roles.filter((role) => normalize(role.category) === "rank").map((role) => role.name)))].sort((a, b) => a.localeCompare(b)), [users]);
  const departmentOptions = useMemo(() => [...new Set(users.flatMap((user) => user.roles.filter((role) => normalize(role.category) === "department").map((role) => role.name)))].sort((a, b) => a.localeCompare(b)), [users]);
  const filteredUsers = useMemo(() => {
    const query = normalize(search);
    return [...users].sort((left, right) =>
      Number(right.discordLinked) - Number(left.discordLinked) ||
      right.rankSortOrder - left.rankSortOrder ||
      left.name.localeCompare(right.name)
    ).filter((user) => {
      const matchesSearch = !query || normalize(user.name).includes(query);
      const matchesRank = !rankFilter || user.roles.some((role) => normalize(role.category) === "rank" && role.name === rankFilter);
      const matchesDepartment = !departmentFilter || user.roles.some((role) => normalize(role.category) === "department" && role.name === departmentFilter);
      return matchesSearch && matchesRank && matchesDepartment;
    });
  }, [users, search, rankFilter, departmentFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstResult = filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastResult = Math.min(currentPage * PAGE_SIZE, filteredUsers.length);
  const selectedRoleGroups = useMemo(() => {
    if (!selected) return [];
    const groups = new Map<string, UserRole[]>();
    for (const role of selected.roles) groups.set(role.category, [...(groups.get(role.category) ?? []), role]);
    const order: Record<string, number> = { Rank: 0, Department: 1, "Time served": 2, Ribbon: 3, Competence: 4, Miscellaneous: 5, Other: 6 };
    return [...groups.entries()].sort(([left], [right]) => (order[left] ?? 99) - (order[right] ?? 99) || left.localeCompare(right));
  }, [selected]);

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return <section className="mb-8" aria-label="Manage users">
    <div className="mb-4 flex flex-col gap-4 border border-white/10 bg-[#1a1e1b] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div><h2 className="m-0 text-lg font-semibold text-[#f3f1e8]">Manage Users</h2><p className="mb-0 mt-1 text-xs leading-5 text-[#aeb5a7]">Review user roles and manually synchronize linked Discord accounts.</p></div>
      <Button type="button" variant="primary" onClick={syncUsers} disabled={syncing || loading} leadingIcon={<ArrowPathIcon className={"size-4 " + (syncing ? "animate-spin" : "")} aria-hidden="true" />}>{syncing ? "Synchronizing users..." : "Synchronize all users"}</Button>
    </div>
    {message && <p role="status" className="my-3 text-xs text-[#c8d9ae]">{message}</p>}
    {error && <div role="alert" className="my-4 border-l-2 border-[#e3a090] bg-[#934230]/10 px-3 py-2 text-xs text-[#edb1a0]">{error}</div>}
    {!loading && users.length > 0 && <div className="mb-4 grid gap-3 border border-white/10 bg-[#1a1e1b] p-4 sm:grid-cols-2 xl:grid-cols-[minmax(14rem,2fr)_repeat(2,minmax(10rem,1fr))]">
      <SearchBar label="Search users by name" value={search} onChange={(event) => updateFilter(setSearch, event.target.value)} placeholder="Search users by name" />
      <SelectField label="Filter by rank" value={rankFilter} onChange={(event) => updateFilter(setRankFilter, event.target.value)} options={[{ value: "", label: "All ranks" }, ...rankOptions.map((rank) => ({ value: rank, label: rank }))]} />
      <SelectField label="Filter by department" value={departmentFilter} onChange={(event) => updateFilter(setDepartmentFilter, event.target.value)} options={[{ value: "", label: "All departments" }, ...departmentOptions.map((department) => ({ value: department, label: department }))]} />
    </div>}
    {loading ? <p className="py-6 text-sm text-[#aeb5a7]">Loading users...</p> : users.length === 0 ? <p className="py-6 text-sm text-[#aeb5a7]">No users found.</p> : filteredUsers.length === 0 ? <p className="border border-dashed border-white/10 py-8 text-center text-sm text-[#aeb5a7]">No users match these search and filter criteria.</p> : <>
      <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {pageUsers.map((user) => <li key={user.id}><Button type="button" variant="secondary" align="start" onClick={() => setSelected(user)} className="min-h-16 w-full gap-3 border-white/10 bg-[#1a1e1b] p-4 text-left normal-case tracking-normal hover:border-[#a8bc7a]/50 hover:bg-[#202720] focus-visible:outline-[#a8bc7a]">
          <UserCircleIcon className="size-6 shrink-0 text-[#a8bc7a]" aria-hidden="true" /><span className="min-w-0 flex-1 truncate text-sm font-medium text-[#f3f1e8]">{user.name}</span><span className="text-[9px] uppercase tracking-wider text-[#90988b]">{user.roles.length} roles</span>
        </Button></li>)}
      </ul>
      <nav aria-label="Manage users pagination" className="mt-4 flex flex-col gap-3 border border-white/10 bg-[#1a1e1b] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-xs text-[#aeb5a7]">Showing <span className="font-medium text-[#f3f1e8]">{firstResult}–{lastResult}</span> of <span className="font-medium text-[#f3f1e8]">{filteredUsers.length}</span> users</p>
        <div className="flex items-center gap-3"><span className="text-xs text-[#aeb5a7]">Page {currentPage} of {pageCount}</span><Button type="button" variant="secondary" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="size-10 min-h-10 p-0"><ChevronLeftIcon className="size-4" aria-hidden="true" /></Button><Button type="button" variant="secondary" aria-label="Next page" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="size-10 min-h-10 p-0"><ChevronRightIcon className="size-4" aria-hidden="true" /></Button></div>
      </nav>
    </>}
    {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="user-roles-title" className="flex max-h-[90vh] w-full max-w-4xl flex-col border border-white/15 bg-[#171b18] shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-7"><div><p className="m-0 text-[9px] font-semibold uppercase tracking-[.15em] text-[#a8bc7a]">USER ROLES</p><h2 id="user-roles-title" className="mb-0 mt-2 text-2xl font-semibold text-[#f3f1e8]">{selected.name}</h2></div><button type="button" aria-label="Close user roles" onClick={() => setSelected(null)} className="rounded-sm p-2 text-[#aeb5a7] hover:bg-white/10 hover:text-white"><XMarkIcon className="size-5" aria-hidden="true" /></button></header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7"><p className="mt-0 text-xs text-[#aeb5a7]">{selected.discordLinked ? "Discord account linked" : "Discord account not linked"}</p>
          <div className="mb-6 flex items-center justify-between gap-4 border border-white/10 bg-[#202520] p-4">
            <span><span className="block text-sm font-medium text-[#f3f1e8]">Administrator access</span><span className="mt-1 block text-xs text-[#aeb5a7]">Allow this account to manage the admin panel.</span></span>
            <ToggleSwitch checked={selected.admin} label={"Administrator access for " + selected.name} disabled={updatingAdmin} onChange={(admin) => void updateAdminAccess(selected, admin)} />
          </div>
          {selectedRoleGroups.length === 0 ? <p className="border border-dashed border-white/10 p-5 text-sm text-[#aeb5a7]">No roles assigned yet. Run a manual synchronization after mapping Discord roles.</p> : <div className="space-y-6">{selectedRoleGroups.map(([category, roles]) => <section key={category} aria-labelledby={`role-group-${category}`}><h3 id={`role-group-${category}`} className="mb-2 mt-0 border-b border-white/10 pb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#a8bc7a]">{category} <span className="text-[#90988b]">({roles.length})</span></h3><ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">{roles.map((role, index) => <li key={role.name + "-" + index} className="flex items-center gap-3 border border-white/10 bg-[#202520] px-4 py-3 text-sm text-[#e7e7dc]">{isDiscordRoleIcon(role.iconPath) && <Image src={role.iconPath} alt="" width={24} height={24} unoptimized className="size-6 shrink-0 object-contain" />}<span>{role.name}</span></li>)}</ul></section>)}</div>}
        </div>
        <footer className="flex shrink-0 justify-end border-t border-white/10 p-4"><Button type="button" variant="secondary" onClick={() => setSelected(null)}>Close</Button></footer>
      </section>
    </div>}
  </section>;
}

function isDiscordRoleIcon(path: string | null): path is string {
  if (!path) return false;
  try {
    const url = new URL(path);
    return url.protocol === "https:" && url.hostname === "cdn.discordapp.com" && url.pathname.startsWith("/role-icons/");
  } catch {
    return false;
  }
}



