# BIA Platform Roadmap — Developer Guide

**Status:** planning/specification only; this document records scope and recommendations, not implementation.

## Product boundary
- **Public:** event listings/details and news articles, readable without login.
- **Member:** Steam sign-in, linked player profile, attendance/service history, awards, and eligible event-slot actions.
- **Administration:** protected Discord, event/ORBAT, log import, permission, salary, and content workflows.

Inventory the current schema, routes, authorization, attendance data/importer, and deployment before changing production. Keep backfills separate from schema migrations; deployments must never rely on a developer's local folders.

## Phase 0 — Baseline and release safety
Inventory code/data/hosting; separate dev/staging/production databases; establish backup, restore, migration, rollback and audit conventions; create minimized representative fixtures. Preserve existing attendance history.
**Exit:** repeatable deploy and recovery procedure; data sources and ownership documented.

## Phase 1 — Identity and authorization foundation
Keep SteamID64 as stable Steam identity linked to one Player. Add verified Discord OAuth linking and store Discord's immutable ID server-side. Never trust an ID from the browser. Add authorization over pages/routes, UI areas and server actions/API. Support create/read/update/delete; enforce checks on protected server reads and writes (hiding a button is not security); default deny. Audit identity and sensitive changes.
Possible concepts: User, Player, DiscordLink, Permission, Role, RolePermission, UserRole/PlayerRole, AuditEvent.
**Exit:** verified identity links, server-side permission checks and audit history.

## Phase 2 — Discord role catalog and synchronization
Run the Discord bot as a separate persistent service, not inside a short-lived Next.js request. Import guild roles keyed by immutable Discord role ID; names, colors, and position are mutable. Store guild ID. Admins classify/order roles as rank, department, time-served, ribbon, medal, or unclassified. Match members only through verified links. Choose authority and sync direction per category; reconcile event-driven changes plus periodic repair; audit source/actor and prevent echo loops. Handle deletion, bot permission loss, departures, API limits, retries, and visible sync errors.
Keep role catalog, category mapping, and player assignments separate. Possible concepts: DiscordGuild, DiscordRole, RoleClassification, PlayerDiscordMembership, PlayerRoleAssignment, RoleSyncRun.
**Exit:** account link and intended bidirectional sync work; retry/conflict behavior is proven.

## Phase 3 — Personnel data and player dashboard
Model departments, ordered ranks, service milestones, and award definitions as catalogs. Store dated player-award grants with issuer/citation/revocation metadata as appropriate. A Discord role is not itself an award grant. Dashboard: missions/events, attendance hours/history, rank, department, time served, medals/ribbons, later salary history. Define timezone/duration rules and whether aggregates need historical snapshots.
Possible concepts: Department, Rank, ServiceMilestone, AwardDefinition, PlayerAward, PlayerDepartmentAssignment, PlayerRankAssignment.
**Exit:** totals reconcile with source data; award grants/revocations are auditable.

## Phase 4 — Public events, news, media
Add public event/article pages and authorized CRUD with draft, preview, publish, unpublish, archive, validation, and audit. Event fields likely include title, slug, summary, description, scheduled instant/timezone, game, event type, era/map, publication state, author, settings. Use enums only for closed sets; configurable games/maps should be catalog records. Store images/files in object storage; DB records object key, MIME type, size, dimensions, checksum, owner and policy. Avoid large Postgres blobs and local-disk persistence assumptions. News has author, publication time/state, structured content and cover media.
Possible concepts: Event, Game, Map, NewsArticle, MediaAsset.
**Exit:** public users can browse; authorized staff can manage; media access/deletion is defined.

## Phase 5 — ORBAT builder and slots
Represent hierarchy (event → group/task force → squad/section → slot) with stable node ID, parent/order/type/label, capacity/settings and separate visual layout metadata. Keep hierarchy, layout, slot definitions and assignments distinct. Slots need title/order/capacity/eligibility/active state. Preserve assignment history. Confirm whether one player can hold multiple slots or a slot can have multiple occupants. Use transaction-safe reservations. Build pan/zoom clickable ORBAT and a keyboard-accessible tree/list fallback.
Possible concepts: EventOrgNode, EventSlot, SlotAssignment, SlotAssignmentHistory. Choose self-referencing nodes vs explicit group/squad tables after confirming hierarchy and reporting needs.
**Exit:** realistic ORBAT creation/reordering, concurrency-safe reservation, inspectable history.

## Phase 6 — Log import, attendance and slot reconciliation
1. Authenticated upload; enforce file type/size, checksum, event match, parser version, and immutable source reference.
2. Stage parse results; retain raw evidence or secured source reference, sessions, identity matches, unknown IDs, ambiguous cases and diagnostics.
3. Dry-run preview shows attendance decisions and proposed slot changes; explicit authorized apply.
4. Idempotent apply via source fingerprint/stable line IDs, transaction or resumable batches.
5. Store evidence, attendance decision/policy version, and reconciliation action/result separately. Corrections are revisions, never silent evidence rewrites.
6. Proposed rule to confirm: reserved+attended preserves slot; reserved+absent releases slot with reason; attending unassigned player keeps attendance and gets a deterministic eligible free slot if policy requires; ambiguous identity/incomplete log/no free slot stays unresolved for staff.
7. Support review/reprocess; delete-and-reimport is not normal repair.
Possible concepts: LogImportBatch, LogSource, EventLogLine, PlayerSession, EventParticipant, AttendanceDecision, SlotReconciliation.
**Exit:** repeat import cannot duplicate; reconnect/ambiguity fixtures pass; slot edits are explainable/reversible.

## Phase 7 — Arma mission map and planning
Start with rights-cleared supplied mission files. Identify text SQM, binary/binarized, or packaged inputs. Community SQM documentation calls it internal/undocumented; parsing is version-sensitive. Validate rights to process/show files. Parse only required marker fields into versioned intermediate data (ID/name/type/shape/coordinates/direction/color/text/size); reject unsupported formats and never execute uploads. Calibrate per-map coordinate transforms against landmarks. Separate imported markers from web annotations. Add versioned planning overlays (lines/arrows/areas/labels/phase/time/author/visibility/draft/share/publish) and define edit conflicts. Isolate parser, constrain uploads, store assets externally, provide manual/GeoJSON fallback.
**Exit:** sample mission/map works and aligns; unsupported content fails safely.

## Phase 8 — Fine-grained permissions
Use stable resource/action codes, e.g. events.read, events.create, attendance.import, salary.read_all, salary.read_own, salary.mark_paid. Grant to roles/groups and principals; add explicit deny only if needed. UI to search/configure permissions, preview effective access, and audit. Test direct URLs, substituted IDs, and unauthorized APIs.
**Exit:** all sensitive routes/actions have permission definitions and server-boundary tests.

## Phase 9 — Salary ledger
Inspect workbook first: formulas, eligibility, exceptions, rounding, currency, bonuses, overrides, corrections. Represent pay period by composite (year, month) or surrogate key plus unique constraint; constrain month 1–12. Store period-specific bonuses as immutable inputs/versioned rules. Department base pay and dated player overrides (reason/approver) are separate. Save calculation snapshots with inputs, formula version, line items, total, currency, status. Track payments separately; partial payments only if needed. Corrections create audited adjustments. Staff see all; players see own.
Possible concepts: PayPeriod, DepartmentCompensation, PlayerCompensationOverride, CompensationRuleVersion, SalaryStatement, SalaryLineItem, SalaryPayment, SalaryAdjustment.
**Exit:** workbook examples reconcile to smallest currency unit; past totals remain explainable.

## Phase 10 — 3D soldier with earned decorations
Do not turn DB award rows directly into geometry. Author soldier/decorations as 3D assets and attach earned decorations to named points during rendering.
1. Obtain/commission rigged soldier with explicit public-web and derivative-work rights. Prefer optimized GLB/glTF 2.0. Browser assets can be downloaded; confirm redistribution.
2. In Blender normalize scale/orientation; create named anchors such as RibbonRack_01, RibbonRack_02, Medal_Miniature_01. Decorations are separate meshes/materials or atlas variants with agreed pivots/transforms. Export GLB and inspect independently.
3. Award catalog stores code/name/precedence/rack/row/asset key/transform/scale/icon/active version. Player award grants link catalog records and retain dates/issuer as needed.
4. For 2D art, texture a modeled bar/medal mesh or carefully lit plane; a flat image alone does not make a convincing 3D medal.
5. Load GLB in browser-only Three.js or React Three Fiber. Server returns authorized award data; WebGL loads client-side. Provide static image and accessible award list fallback.
6. Map award codes to approved assets/anchors and arrange by precedence. Never accept arbitrary asset paths/transforms from player input.
7. Optimize mobile: lazy load, budget polygons/textures, cap pixel ratio, pause offscreen, verify compression, dispose GPU resources, handle WebGL loss.
8. QA no awards, one ribbon, multiple rows, medal, many awards, missing/revoked asset; verify placement, clipping, order, contrast, and mid-range phones.
DB stores award/grant and asset-version metadata; object storage/CDN stores GLB/textures/thumbnails/licenses. Version mapping so art changes do not rewrite award history.
**Exit:** publishable rights, correct ribbon/medal placement, fallback/accessibility, grant/revoke flow.

## Conceptual relational map
This is not a final Prisma schema. User 1—1 Player; Player 0/1 DiscordLink; Guild 1—many DiscordRole; Role 0/1 classification; Player many assignments/awards; AwardDefinition 1—many PlayerAward; Event 1—many OrgNode; nodes parent nodes; OrgNode 1—many EventSlot; slot has assignment history; Event 1—many import batches; batch 1—many raw lines; Event and Player join via EventParticipant; participant 1—many sessions; PayPeriod and Player join via SalaryStatement; statement 1—many payments; Department defines compensation; Player can have overrides; Event uses MissionAsset; MissionAsset has MapPlanVersion; MediaAsset decorates award definition.

## Cross-cutting requirements
- Security/privacy: server checks, least privilege, upload limits, rate limits, managed secrets; never expose private IDs/raw logs/salary publicly.
- Reliability: backup/restore drills, idempotent jobs, bounded retries, visible import/sync status, safe partial failure.
- Audit: raw evidence immutable; derived decisions/overrides/actor/time separate.
- Performance: pagination, external media, lazy map/3D, no full-archive request.
- Accessibility: keyboard/tree ORBAT alternative, textual map/award alternatives, not color-only state.
- Operations: monitor migrations/imports/Discord/uploads/parser/payroll/WebGL without logging secrets.

## Migration and release policy
Schema migrations change schema only. Historical logs/workbook imports are versioned, restartable jobs, never deployment-time migrations. Record source fingerprint, parser/formula version, counts, diagnostics, applied status. Dry-run and reconcile samples. Production source files must be intentionally uploaded or stored in controlled versioned storage, never read from developer-local paths. Keep recovery/correction paths.

## Discovery decisions
1. Discord role authority, conflict policy, guilds, bot host.
2. ORBAT levels, multi-slot/multi-occupant and release/reassignment rules.
3. Attendance threshold, reconnect/overlap, timezone, incomplete logs/no capacity.
4. Event fields/games/types/maps/timezone/publishing workflow.
5. Arma version/input forms/map rights/marker visibility/parser fallback.
6. Individual/group permissions, explicit deny, emergency admin.
7. Salary formulas/currency/bonuses/exceptions/corrections/partial payment/privacy.
8. Model/art supplier, redistribution rights, decoration standards, target device/fidelity.
9. Database/object storage/bot host/jobs/monitoring/budget.

## Acceptance strategy
Fixtures: representative logs, Discord snapshots, ORBATs, salary periods, mission files, award combinations. Test migration off-production; auth direct URL/ID substitution; duplicate imports, ambiguous identities, reconnects, open sessions, absent reservation, unassigned attendee, no capacity; Discord rename/deletion/permission-loss/rate-limit/retry loop; salary against approved workbook; map landmarks/unsupported uploads; 3D desktop/mobile/no-WebGL fallback.

## References
- [BIA event example](https://biaarma.com/event/OpMolot1) — event details and slots.
- [Bohemia community SQM reference](https://community.bistudio.com/wiki/SQM) — describes format as internal/undocumented.
- [Khronos glTF 2.0](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html), [Blender glTF export](https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html).
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader), [React Three Fiber framework guidance](https://r3f.docs.pmnd.rs/getting-started/installation), [Three.js resource cleanup](https://threejs.org/manual/pages/how-to-dispose-of-objects.html).
