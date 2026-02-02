# Auto-Claude Spec Index — Flow GTD

## Run Order

### Batch 1: Foundation (Sequential — one at a time)
| # | Spec | Depends On |
|---|------|-----------|
| 001 | Project Scaffolding | — |
| 002 | Database Migration & Seed | 001 |
| 003 | Authentication | 002 |

**Merge all 3 before starting Batch 2.**

### Batch 2: Layout & Core Views (Parallel — up to 4 agents)
| # | Spec | Depends On |
|---|------|-----------|
| 004 | Responsive Layout Shell | Batch 1 |
| 005 | Inbox View (+ TaskRow, Checkbox) | Batch 1 |
| 006 | Today View | Batch 1 |
| 007 | Quick Capture (+ FAB) | Batch 1 |

**Merge all 4 before starting Batch 3. Resolve any merge conflicts in shared files (layout.tsx, types/index.ts).**

### Batch 3: Remaining Views (Parallel — up to 4 agents)
| # | Spec | Depends On |
|---|------|-----------|
| 008 | Forecast View | Batch 2 |
| 009 | Projects View | Batch 2 |
| 010 | Tags View | Batch 2 |
| 011 | Review View | Batch 2 |

**Merge all 4 before starting Batch 4.**

### Batch 4: Task Detail (Sequential)
| # | Spec | Depends On |
|---|------|-----------|
| 012 | Task Detail Panel | Batch 3 |
| 013 | Task Edit Mode | 012 |

**Merge before starting Batch 6. Batch 5 can overlap.**

### Batch 5: Notifications (Parallel — up to 3 agents, can overlap with Batches 3-4)
| # | Spec | Depends On |
|---|------|-----------|
| 014 | pg-boss & Reminders | Batch 2 |
| 015 | ntfy Integration | Batch 2 |
| 016 | Web Push Integration | Batch 2 |

**Merge all 3 before Batch 6. These can start as early as after Batch 2.**

### Batch 6: Polish (Sequential — run last)
| # | Spec | Depends On |
|---|------|-----------|
| 017 | Navigation Badges | All previous |
| 018 | Search | All previous |
| 019 | UI Polish Pass | 017 + 018 |

## Timeline Estimate

With Auto-Claude running 4 parallel agents:

| Phase | Duration | Running |
|-------|----------|---------|
| Batch 1 | 3 specs × ~15 min = ~45 min | Sequential |
| Batch 2 | 4 specs in parallel ≈ ~20 min | 4 agents |
| Batch 3 + 5 | 7 specs in parallel ≈ ~25 min | 4 agents (overlap) |
| Batch 4 | 2 specs sequential ≈ ~20 min | 1 agent |
| Batch 6 | 3 specs ≈ ~25 min | Sequential |
| **Total** | **~2-3 hours** | |

Add review/merge time between batches (~10 min each). Realistic total: **3-5 hours**.

## Quick Reference

```
001 Scaffolding → 002 Database → 003 Auth
                                      ↓
                    ┌───────┬─────────┼───────────┐
                    004     005       006         007
                  Layout  Inbox    Today      Capture
                    └───────┴─────────┴───────────┘
                                      ↓
                    ┌───────┬─────────┼───────────┐
                    008     009       010         011
                 Forecast Projects   Tags       Review
                    └───────┴─────────┴───────────┘
                                      ↓
                              012 Task Detail
                                      ↓
                              013 Task Edit
                                      ↓
          ┌──────────────────────────────────────────┐
          │  014 pg-boss  ←→  015 ntfy  ←→  016 Push │  (can start after Batch 2)
          └──────────────────────────────────────────┘
                                      ↓
                              017 Nav Badges
                              018 Search
                                      ↓
                              019 UI Polish
```
