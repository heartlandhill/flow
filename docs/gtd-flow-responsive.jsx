import { useState, useEffect, useRef } from "react";

const AREAS = {
  work: { name: "Work", color: "#E8A87C" },
  personal: { name: "Personal", color: "#85B7D5" },
  health: { name: "Health", color: "#9ED4A0" },
};

const TAGS = [
  { id: "computer", name: "Computer", icon: "💻" },
  { id: "errands", name: "Errands", icon: "🏃" },
  { id: "calls", name: "Calls", icon: "📞" },
  { id: "home", name: "Home", icon: "🏠" },
  { id: "waiting", name: "Waiting For", icon: "⏳" },
  { id: "focus", name: "Deep Focus", icon: "🎯" },
];

const PROJECTS = [
  { id: "p1", name: "GTD App Development", area: "work", status: "active", reviewDate: "2026-02-07", progress: 35 },
  { id: "p2", name: "Q1 Marketing Strategy", area: "work", status: "active", reviewDate: "2026-02-03", progress: 60 },
  { id: "p3", name: "Home Renovation", area: "personal", status: "active", reviewDate: "2026-02-05", progress: 20 },
  { id: "p4", name: "Marathon Training", area: "health", status: "active", reviewDate: "2026-02-04", progress: 45 },
  { id: "p5", name: "Learn Italian", area: "personal", status: "someday", reviewDate: null, progress: 0 },
  { id: "p6", name: "Podcast Launch", area: "work", status: "someday", reviewDate: null, progress: 0 },
];

const INITIAL_TASKS = [
  { id: 1, title: "Review pitch deck from Sarah", project: null, tags: [], due: null, defer: null, completed: false, notes: "She sent it last Thursday, need to give feedback", inbox: true },
  { id: 2, title: "Book dentist appointment", project: null, tags: [], due: null, defer: null, completed: false, notes: "", inbox: true },
  { id: 3, title: "Research standing desk options", project: null, tags: [], due: null, defer: null, completed: false, notes: "Budget around $500-800", inbox: true },
  { id: 4, title: "Reply to Mom's email about Easter", project: null, tags: [], due: null, defer: null, completed: false, notes: "", inbox: true },
  { id: 5, title: "Define database schema for tasks and projects", project: "p1", tags: ["computer", "focus"], due: "2026-02-03", defer: null, completed: false, notes: "Use Prisma with PostgreSQL. Need tables for tasks, projects, areas, and tags.", inbox: false },
  { id: 6, title: "Set up Next.js App Router boilerplate", project: "p1", tags: ["computer"], due: "2026-02-02", defer: null, completed: true, notes: "", inbox: false },
  { id: 7, title: "Design component library in Figma", project: "p1", tags: ["computer", "focus"], due: "2026-02-05", defer: "2026-02-03", completed: false, notes: "Focus on sidebar, task list, and detail panel components", inbox: false },
  { id: 8, title: "Write CLAUDE.md project spec", project: "p1", tags: ["computer"], due: "2026-02-04", defer: null, completed: false, notes: "Include data model, conventions, file structure", inbox: false },
  { id: 9, title: "Draft Q1 blog post calendar", project: "p2", tags: ["computer"], due: "2026-02-06", defer: null, completed: false, notes: "Need 12 posts mapped to product launches", inbox: false },
  { id: 10, title: "Review analytics from December campaign", project: "p2", tags: ["computer"], due: "2026-02-03", defer: null, completed: false, notes: "", inbox: false },
  { id: 11, title: "Call contractor about kitchen timeline", project: "p3", tags: ["calls"], due: "2026-02-02", defer: null, completed: false, notes: "Ask about permits and material lead times", inbox: false },
  { id: 12, title: "Pick cabinet hardware finishes", project: "p3", tags: ["errands"], due: "2026-02-08", defer: "2026-02-05", completed: false, notes: "", inbox: false },
  { id: 13, title: "Run 10K tempo run", project: "p4", tags: [], due: "2026-02-01", defer: null, completed: false, notes: "Target pace: 5:15/km", inbox: false },
  { id: 14, title: "Schedule physio appointment", project: "p4", tags: ["calls"], due: "2026-02-03", defer: null, completed: false, notes: "Left knee has been bothering me after long runs", inbox: false },
  { id: 15, title: "Order new running shoes", project: "p4", tags: ["computer"], due: "2026-02-04", defer: null, completed: false, notes: "Nike Vaporfly or Asics Metaspeed+", inbox: false },
  { id: 16, title: "Send contract to new vendor", project: "p2", tags: ["computer", "waiting"], due: "2026-02-02", defer: null, completed: false, notes: "Waiting on legal review first", inbox: false },
  { id: 17, title: "Buy groceries for the week", project: null, tags: ["errands"], due: "2026-02-01", defer: null, completed: false, notes: "Need vegetables, protein, and meal prep containers", inbox: false },
  { id: 18, title: "Backup photos to external drive", project: null, tags: ["computer", "home"], due: null, defer: null, completed: false, notes: "", inbox: false },
];

const Icons = {
  inbox: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>,
  today: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  upcoming: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  projects: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  tags: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  review: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  plus: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  chevron: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  note: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>,
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date("2026-02-01T00:00:00");
  const diff = Math.floor((d - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return "Overdue";
  if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const dateClass = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date("2026-02-01T00:00:00");
  const diff = Math.floor((d - today) / 86400000);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  return "future";
};

export default function GTDApp() {
  const [activeView, setActiveView] = useState("inbox");
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCapture, setShowCapture] = useState(false);
  const [captureText, setCaptureText] = useState("");
  const [expandedAreas, setExpandedAreas] = useState({ work: true, personal: true, health: true });
  const [activeTag, setActiveTag] = useState(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [completingIds, setCompletingIds] = useState(new Set());
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const captureRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setShowCapture(true);
      }
      if (e.key === "Escape") {
        setShowCapture(false);
        setSelectedTask(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (showCapture && captureRef.current) captureRef.current.focus();
  }, [showCapture]);

  const toggleComplete = (id) => {
    setCompletingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
      setCompletingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      if (selectedTask?.id === id) setSelectedTask(null);
    }, 500);
  };

  const addToInbox = () => {
    if (!captureText.trim()) return;
    const newTask = {
      id: Date.now(), title: captureText.trim(),
      project: null, tags: [], due: null, defer: null,
      completed: false, notes: "", inbox: true,
    };
    setTasks(prev => [newTask, ...prev]);
    setCaptureText("");
    setShowCapture(false);
  };

  const inboxTasks = tasks.filter(t => t.inbox && !t.completed);
  const todayTasks = tasks.filter(t => !t.completed && t.due === "2026-02-01");
  const activeProjects = PROJECTS.filter(p => p.status === "active");
  const somedayProjects = PROJECTS.filter(p => p.status === "someday");
  const reviewProjects = activeProjects.filter(p => p.reviewDate);
  const getProjectTasks = (pid) => tasks.filter(t => t.project === pid && !t.completed);
  const getTagTasks = (tagId) => tasks.filter(t => t.tags.includes(tagId) && !t.completed);

  const forecastDays = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date("2026-02-01");
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    forecastDays.push({
      date: d, dateStr,
      tasks: tasks.filter(t => t.due === dateStr && !t.completed),
      isToday: i === 0,
      dayName: i === 0 ? "Today" : i === 1 ? "Tmrw" : d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
    });
  }

  const navItems = [
    { id: "inbox", icon: Icons.inbox, label: "Inbox", count: inboxTasks.length, accent: "#E8A87C" },
    { id: "today", icon: Icons.today, label: "Today", count: todayTasks.length, accent: "#F2D06B" },
    { id: "forecast", icon: Icons.upcoming, label: "Forecast", count: null, accent: "#85B7D5" },
    { id: "projects", icon: Icons.projects, label: "Projects", count: null, accent: "#C4A7E7" },
    { id: "tags", icon: Icons.tags, label: "Tags", count: null, accent: "#9ED4A0" },
    { id: "review", icon: Icons.review, label: "Review", count: reviewProjects.length, accent: "#E88B8B" },
  ];

  const bottomNavItems = navItems.slice(0, 5);

  const renderTaskRow = (task) => {
    const isCompleting = completingIds.has(task.id);
    const project = PROJECTS.find(p => p.id === task.project);
    return (
      <div
        key={task.id}
        className={`task-row ${selectedTask?.id === task.id ? "selected" : ""} ${isCompleting ? "completing" : ""}`}
        onClick={() => setSelectedTask(task)}
      >
        <button
          className={`checkbox ${task.completed ? "checked" : ""} ${isCompleting ? "animating" : ""}`}
          onClick={(e) => { e.stopPropagation(); toggleComplete(task.id); }}
        >
          {(task.completed || isCompleting) && Icons.check}
        </button>
        <div className="task-content">
          <span className="task-title">{task.title}</span>
          <div className="task-meta">
            {project && (
              <span className="task-project" style={{ color: AREAS[project.area]?.color }}>
                {project.name}
              </span>
            )}
            {task.tags.length > 0 && task.tags.slice(0, 2).map(t => {
              const tag = TAGS.find(tg => tg.id === t);
              return tag ? <span key={t} className="task-tag">{tag.icon}</span> : null;
            })}
            {task.due && (
              <span className={`task-due-inline ${dateClass(task.due)}`}>
                {formatDate(task.due)}
              </span>
            )}
          </div>
        </div>
        {task.notes && <span className="task-has-notes">{Icons.note}</span>}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeView) {
      case "inbox":
        return (
          <div className="view-content fade-in">
            <div className="view-header">
              <h1>Inbox</h1>
              <span className="view-count">{inboxTasks.length}</span>
            </div>
            <p className="view-subtitle">Capture everything, clarify later</p>
            <div className="task-list">
              {inboxTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✨</div>
                  <p>Inbox zero — everything is processed</p>
                </div>
              ) : inboxTasks.map(renderTaskRow)}
            </div>
          </div>
        );

      case "today":
        return (
          <div className="view-content fade-in">
            <div className="view-header">
              <h1>Today</h1>
              <span className="view-date">Sun, Feb 1</span>
            </div>
            <div className="task-list">
              {todayTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">☀️</div>
                  <p>Nothing due today — enjoy the calm</p>
                </div>
              ) : todayTasks.map(renderTaskRow)}
            </div>
          </div>
        );

      case "forecast":
        return (
          <div className="view-content fade-in">
            <div className="view-header">
              <h1>Forecast</h1>
            </div>
            <div className="forecast-scroll">
              <div className="forecast-strip">
                {forecastDays.map((day) => (
                  <div key={day.dateStr} className={`forecast-cell ${day.isToday ? "is-today" : ""} ${day.tasks.length > 0 ? "has-tasks" : ""}`}>
                    <span className="forecast-day-label">{day.dayName}</span>
                    <span className="forecast-day-num">{day.dayNum}</span>
                    {day.tasks.length > 0 && (
                      <div className="forecast-dots">
                        {day.tasks.slice(0, 3).map(t => (
                          <span key={t.id} className="forecast-dot" style={{ background: PROJECTS.find(p => p.id === t.project) ? AREAS[PROJECTS.find(p => p.id === t.project).area]?.color : "#888" }} />
                        ))}
                        {day.tasks.length > 3 && <span className="forecast-more">+{day.tasks.length - 3}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="forecast-detail-list">
              {forecastDays.filter(d => d.tasks.length > 0).map(day => (
                <div key={day.dateStr} className="forecast-day-group">
                  <div className="forecast-group-header">
                    <span className={`forecast-group-label ${day.isToday ? "accent" : ""}`}>{day.isToday ? "Today" : day.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
                    <span className="forecast-group-count">{day.tasks.length}</span>
                  </div>
                  {day.tasks.map(renderTaskRow)}
                </div>
              ))}
            </div>
          </div>
        );

      case "projects":
        return (
          <div className="view-content fade-in">
            <div className="view-header">
              <h1>Projects</h1>
            </div>
            {Object.entries(AREAS).map(([areaId, area]) => {
              const areaProjects = activeProjects.filter(p => p.area === areaId);
              if (areaProjects.length === 0) return null;
              return (
                <div key={areaId} className="area-group">
                  <button className="area-header" onClick={() => setExpandedAreas(prev => ({ ...prev, [areaId]: !prev[areaId] }))}>
                    <span className={`area-chevron ${expandedAreas[areaId] ? "expanded" : ""}`}>{Icons.chevron}</span>
                    <span className="area-dot" style={{ background: area.color }} />
                    <span className="area-name">{area.name}</span>
                    <span className="area-count">{areaProjects.length}</span>
                  </button>
                  {expandedAreas[areaId] && (
                    <div className="project-list">
                      {areaProjects.map(project => {
                        const ptasks = getProjectTasks(project.id);
                        return (
                          <div key={project.id} className="project-card">
                            <div className="project-card-header">
                              <span className="project-name">{project.name}</span>
                              <span className="project-task-count">{ptasks.length}</span>
                            </div>
                            <div className="project-progress-bar">
                              <div className="project-progress-fill" style={{ width: `${project.progress}%`, background: area.color }} />
                            </div>
                            <div className="project-tasks-preview">
                              {ptasks.slice(0, 3).map(renderTaskRow)}
                              {ptasks.length > 3 && <div className="more-tasks">+{ptasks.length - 3} more</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {somedayProjects.length > 0 && (
              <div className="area-group someday-group">
                <div className="area-header static">
                  <span className="area-dot" style={{ background: "#666" }} />
                  <span className="area-name">Someday / Maybe</span>
                </div>
                <div className="project-list">
                  {somedayProjects.map(project => (
                    <div key={project.id} className="project-card someday">
                      <span className="project-name">{project.name}</span>
                      <span className="someday-area" style={{ color: AREAS[project.area]?.color }}>{AREAS[project.area]?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "tags":
        return (
          <div className="view-content fade-in">
            <div className="view-header">
              <h1>Tags</h1>
            </div>
            <div className="tags-grid">
              {TAGS.map(tag => {
                const tagTasks = getTagTasks(tag.id);
                return (
                  <button key={tag.id} className={`tag-card ${activeTag === tag.id ? "active" : ""}`} onClick={() => setActiveTag(activeTag === tag.id ? null : tag.id)}>
                    <span className="tag-icon">{tag.icon}</span>
                    <span className="tag-name">{tag.name}</span>
                    <span className="tag-count">{tagTasks.length}</span>
                  </button>
                );
              })}
            </div>
            {activeTag && (
              <div className="tag-tasks-section">
                <h2>{TAGS.find(t => t.id === activeTag)?.icon} {TAGS.find(t => t.id === activeTag)?.name}</h2>
                <div className="task-list">{getTagTasks(activeTag).map(renderTaskRow)}</div>
              </div>
            )}
          </div>
        );

      case "review":
        const currentProject = reviewProjects[reviewIndex];
        if (!currentProject) return (
          <div className="view-content fade-in">
            <div className="view-header"><h1>Review</h1></div>
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <p>All projects reviewed</p>
            </div>
          </div>
        );
        const rTasks = getProjectTasks(currentProject.id);
        return (
          <div className="view-content fade-in">
            <div className="view-header">
              <h1>Review</h1>
              <span className="review-progress">{reviewIndex + 1}/{reviewProjects.length}</span>
            </div>
            <div className="review-card">
              <div className="review-card-top">
                <span className="review-area-badge" style={{ background: AREAS[currentProject.area]?.color }}>{AREAS[currentProject.area]?.name}</span>
              </div>
              <h2 className="review-project-name">{currentProject.name}</h2>
              <div className="review-stats">
                <div className="review-stat">
                  <span className="stat-num">{rTasks.length}</span>
                  <span className="stat-label">Remaining</span>
                </div>
                <div className="review-stat">
                  <span className="stat-num">{currentProject.progress}%</span>
                  <span className="stat-label">Complete</span>
                </div>
              </div>
              <div className="review-progress-bar">
                <div className="review-progress-fill" style={{ width: `${currentProject.progress}%`, background: AREAS[currentProject.area]?.color }} />
              </div>
              <div className="review-tasks">
                <h3>Next Actions</h3>
                {rTasks.map(renderTaskRow)}
              </div>
              <div className="review-questions">
                <p>→ Is this project still relevant?</p>
                <p>→ What's the next physical action?</p>
                <p>→ Is anything stuck or waiting?</p>
              </div>
              <div className="review-actions">
                <button className="btn-secondary" onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))} disabled={reviewIndex === 0}>Back</button>
                <button className="btn-primary" onClick={() => setReviewIndex(Math.min(reviewProjects.length - 1, reviewIndex + 1))} style={{ background: AREAS[currentProject.area]?.color }}>
                  {reviewIndex === reviewProjects.length - 1 ? "Done" : "Reviewed →"}
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap');

        :root {
          --bg-root: #1a1a1e;
          --bg-sidebar: #141416;
          --bg-surface: #222226;
          --bg-hover: #2a2a2f;
          --bg-selected: #2d2d35;
          --bg-card: #26262b;
          --border: #333338;
          --text-primary: #e8e4df;
          --text-secondary: #8a877f;
          --text-tertiary: #5e5c57;
          --accent: #E8A87C;
          --radius: 10px;
          --radius-sm: 6px;
          --safe-bottom: env(safe-area-inset-bottom, 0px);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

        /* ===== MOBILE-FIRST BASE ===== */

        .app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          height: 100dvh;
          background: var(--bg-root);
          color: var(--text-primary);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          overflow: hidden;
          position: relative;
        }

        /* ---- Mobile Header ---- */
        .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          min-height: 56px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-sidebar);
          z-index: 10;
        }

        .mobile-header-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-header-btn:active { background: var(--bg-hover); }

        .mobile-brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .brand-mark {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: linear-gradient(135deg, #E8A87C, #C4A7E7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1e;
        }

        .brand-name {
          font-family: 'Newsreader', serif;
          font-size: 18px;
          font-weight: 500;
          color: var(--text-primary);
        }

        /* ---- Desktop Sidebar (hidden on mobile) ---- */
        .sidebar {
          display: none;
        }

        /* ---- Main Scroll Area ---- */
        .main-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }

        .main-scroll::-webkit-scrollbar { width: 0; display: none; }

        /* ---- View Content ---- */
        .view-content {
          padding: 20px 16px 100px;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }

        .fade-in { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .view-header {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 4px;
        }

        .view-header h1 {
          font-family: 'Newsreader', serif;
          font-size: 26px;
          font-weight: 500;
          letter-spacing: -0.4px;
        }

        .view-count, .view-date, .review-progress {
          font-size: 14px;
          color: var(--text-tertiary);
        }

        .view-subtitle {
          color: var(--text-tertiary);
          font-size: 13px;
          margin-bottom: 20px;
        }

        /* ---- Tasks ---- */
        .task-list { display: flex; flex-direction: column; }

        .task-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
          -webkit-user-select: none;
          user-select: none;
        }

        .task-row:active { background: var(--bg-hover); }
        .task-row.selected { background: var(--bg-selected); border-color: var(--border); }
        .task-row.completing { opacity: 0.3; transform: scale(0.97); transition: all 0.4s ease; }

        .checkbox {
          width: 24px;
          height: 24px;
          min-width: 24px;
          border-radius: 50%;
          border: 2px solid var(--text-tertiary);
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 0;
          transition: all 0.2s ease;
          color: transparent;
          padding: 0;
        }

        .checkbox:active { transform: scale(0.9); }
        .checkbox.animating { border-color: var(--accent); background: var(--accent); color: var(--bg-root); transform: scale(1.1); }
        .checkbox.checked { border-color: var(--text-tertiary); background: var(--text-tertiary); color: var(--bg-root); }

        .task-content { flex: 1; min-width: 0; }

        .task-title {
          display: block;
          font-size: 15px;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .task-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          flex-wrap: wrap;
        }

        .task-project { font-size: 12px; font-weight: 500; }

        .task-tag {
          font-size: 13px;
        }

        .task-due-inline {
          font-size: 11px;
          font-weight: 500;
          padding: 1px 6px;
          border-radius: 3px;
        }

        .task-due-inline.today { color: #F2D06B; background: rgba(242,208,107,0.12); }
        .task-due-inline.tomorrow { color: #E8A87C; background: rgba(232,168,124,0.12); }
        .task-due-inline.overdue { color: #E88B8B; background: rgba(232,139,139,0.14); }
        .task-due-inline.future { color: var(--text-secondary); background: var(--bg-surface); }

        .task-has-notes { color: var(--text-tertiary); flex-shrink: 0; margin-top: 3px; }

        /* ---- Detail Sheet (mobile = full overlay) ---- */
        .detail-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 50;
          animation: fadeOverlay 0.15s ease;
        }

        @keyframes fadeOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .detail-sheet {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-card);
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
          z-index: 51;
          max-height: 85vh;
          overflow-y: auto;
          animation: sheetUp 0.25s ease;
        }

        @keyframes sheetUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .sheet-handle {
          width: 36px;
          height: 4px;
          background: var(--text-tertiary);
          border-radius: 2px;
          margin: 10px auto 0;
          opacity: 0.4;
        }

        .detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
        }

        .detail-header h3 {
          font-size: 12px;
          color: var(--text-tertiary);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .detail-close {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 8px;
          border-radius: var(--radius-sm);
          display: flex;
        }

        .detail-close:active { background: var(--bg-hover); }

        .detail-body { padding: 4px 20px 32px; }

        .detail-title {
          font-family: 'Newsreader', serif;
          font-size: 20px;
          font-weight: 500;
          line-height: 1.35;
          margin-bottom: 16px;
        }

        .detail-field {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(51,51,56,0.5);
        }

        .detail-label { font-size: 13px; color: var(--text-tertiary); min-width: 80px; }
        .detail-value { font-size: 14px; color: var(--text-secondary); }

        .detail-notes {
          margin-top: 20px;
          padding: 14px;
          background: var(--bg-surface);
          border-radius: var(--radius-sm);
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary);
        }

        .detail-notes-label {
          font-size: 11px;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 6px;
        }

        /* ---- Empty State ---- */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 20px;
          text-align: center;
        }

        .empty-icon { font-size: 32px; margin-bottom: 10px; }
        .empty-state p { color: var(--text-tertiary); font-size: 14px; }

        /* ---- Forecast ---- */
        .forecast-scroll {
          overflow-x: auto;
          margin: 16px -16px 0;
          padding: 0 16px;
          -webkit-overflow-scrolling: touch;
        }

        .forecast-scroll::-webkit-scrollbar { display: none; }

        .forecast-strip {
          display: flex;
          gap: 6px;
          min-width: min-content;
        }

        .forecast-cell {
          width: 60px;
          min-width: 60px;
          padding: 10px 6px;
          border-radius: var(--radius-sm);
          background: var(--bg-surface);
          text-align: center;
          flex-shrink: 0;
          border: 1.5px solid transparent;
        }

        .forecast-cell.is-today { border-color: var(--accent); background: rgba(232,168,124,0.08); }

        .forecast-day-label {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: var(--text-tertiary);
          font-weight: 500;
          margin-bottom: 2px;
        }

        .is-today .forecast-day-label { color: var(--accent); }

        .forecast-day-num {
          display: block;
          font-size: 18px;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }

        .is-today .forecast-day-num { color: var(--accent); font-weight: 600; }

        .forecast-dots {
          display: flex;
          gap: 3px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .forecast-dot { width: 6px; height: 6px; border-radius: 50%; }

        .forecast-more { font-size: 9px; color: var(--text-tertiary); }

        .forecast-detail-list { margin-top: 24px; }

        .forecast-day-group { margin-bottom: 20px; }

        .forecast-group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4px;
          margin-bottom: 6px;
        }

        .forecast-group-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .forecast-group-label.accent { color: var(--accent); }

        .forecast-group-count {
          font-size: 11px;
          color: var(--text-tertiary);
          background: var(--bg-surface);
          padding: 1px 7px;
          border-radius: 8px;
        }

        /* ---- Projects ---- */
        .area-group { margin-bottom: 20px; }

        .area-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 4px;
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .area-header.static { cursor: default; }
        .area-chevron { transition: transform 0.2s ease; display: flex; }
        .area-chevron.expanded { transform: rotate(90deg); }
        .area-dot { width: 8px; height: 8px; border-radius: 50%; }
        .area-name { flex: 1; text-align: left; }
        .area-count { color: var(--text-tertiary); font-size: 11px; }

        .project-list {
          margin-top: 6px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .project-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px;
        }

        .project-card.someday {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          opacity: 0.6;
        }

        .project-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .project-name { font-size: 14px; font-weight: 500; }

        .project-task-count {
          font-size: 11px;
          color: var(--text-tertiary);
          background: var(--bg-surface);
          padding: 1px 7px;
          border-radius: 8px;
        }

        .project-progress-bar {
          height: 3px;
          background: var(--bg-hover);
          border-radius: 2px;
          margin-bottom: 12px;
          overflow: hidden;
        }

        .project-progress-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
        .project-tasks-preview .task-row { padding: 8px 6px; }
        .more-tasks { font-size: 12px; color: var(--text-tertiary); padding: 4px 6px; }
        .someday-area { font-size: 11px; font-weight: 500; }
        .someday-group { opacity: 0.75; }

        /* ---- Tags ---- */
        .tags-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 16px;
          margin-bottom: 24px;
        }

        .tag-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
          color: var(--text-secondary);
          font-size: 13px;
        }

        .tag-card:active { background: var(--bg-hover); }
        .tag-card.active { border-color: var(--accent); background: rgba(232,168,124,0.06); color: var(--text-primary); }
        .tag-icon { font-size: 18px; }
        .tag-name { flex: 1; text-align: left; }
        .tag-count { font-size: 11px; color: var(--text-tertiary); background: var(--bg-root); padding: 1px 7px; border-radius: 8px; }

        .tag-tasks-section h2 {
          font-family: 'Newsreader', serif;
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 10px;
        }

        /* ---- Review ---- */
        .review-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          margin-top: 16px;
        }

        .review-card-top { margin-bottom: 10px; }

        .review-area-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 12px;
          color: var(--bg-root);
        }

        .review-project-name {
          font-family: 'Newsreader', serif;
          font-size: 22px;
          font-weight: 500;
          margin-bottom: 16px;
        }

        .review-stats { display: flex; gap: 28px; margin-bottom: 14px; }
        .review-stat { display: flex; flex-direction: column; }
        .stat-num { font-size: 20px; font-weight: 600; }
        .stat-label { font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }

        .review-progress-bar { height: 4px; background: var(--bg-hover); border-radius: 2px; margin-bottom: 20px; overflow: hidden; }
        .review-progress-fill { height: 100%; border-radius: 2px; transition: width 0.6s ease; }

        .review-tasks h3 {
          font-size: 12px;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 6px;
        }

        .review-questions {
          margin-top: 20px;
          padding: 14px;
          background: var(--bg-surface);
          border-radius: var(--radius-sm);
        }

        .review-questions p { font-size: 13px; color: var(--text-secondary); font-style: italic; padding: 3px 0; }

        .review-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          gap: 10px;
        }

        .btn-primary, .btn-secondary {
          padding: 12px 20px;
          border-radius: var(--radius-sm);
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.15s ease;
          flex: 1;
          text-align: center;
        }

        .btn-primary { background: var(--accent); color: var(--bg-root); }
        .btn-primary:active { filter: brightness(0.9); }
        .btn-secondary { background: var(--bg-surface); color: var(--text-secondary); border: 1px solid var(--border); }
        .btn-secondary:disabled { opacity: 0.3; }

        /* ---- Bottom Tab Bar (mobile) ---- */
        .bottom-bar {
          display: flex;
          align-items: center;
          justify-content: space-around;
          background: var(--bg-sidebar);
          border-top: 1px solid var(--border);
          padding: 6px 0;
          padding-bottom: calc(6px + var(--safe-bottom));
          z-index: 30;
          position: relative;
        }

        .tab-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 6px 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-tertiary);
          font-family: inherit;
          font-size: 10px;
          transition: color 0.15s;
          position: relative;
        }

        .tab-btn.active { color: var(--accent); }
        .tab-btn .tab-icon { opacity: 0.5; }
        .tab-btn.active .tab-icon { opacity: 1; }

        .tab-badge {
          position: absolute;
          top: 2px;
          right: 6px;
          background: var(--accent);
          color: var(--bg-root);
          font-size: 9px;
          font-weight: 700;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ---- FAB (capture) ---- */
        .fab {
          position: fixed;
          bottom: calc(72px + var(--safe-bottom));
          right: 16px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E8A87C, #d4916a);
          color: var(--bg-root);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(232,168,124,0.35);
          z-index: 25;
          transition: transform 0.15s ease;
        }

        .fab:active { transform: scale(0.92); }

        /* ---- Capture Modal ---- */
        .capture-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 15vh;
          animation: fadeOverlay 0.15s ease;
        }

        .capture-modal {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px;
          width: calc(100% - 32px);
          max-width: 480px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          animation: captureIn 0.2s ease;
          overflow: hidden;
        }

        @keyframes captureIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .capture-modal-header {
          padding: 14px 18px 0;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-tertiary);
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .capture-modal input {
          width: 100%;
          padding: 14px 18px;
          background: none;
          border: none;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 16px;
          outline: none;
        }

        .capture-modal input::placeholder { color: var(--text-tertiary); }

        .capture-modal-footer {
          padding: 10px 18px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border);
        }

        .capture-hint { font-size: 11px; color: var(--text-tertiary); }
        .capture-submit {
          padding: 8px 18px;
          border-radius: var(--radius-sm);
          background: var(--accent);
          color: var(--bg-root);
          border: none;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .capture-submit:disabled { opacity: 0.3; }

        /* ---- Mobile Menu Overlay ---- */
        .menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 60;
          animation: fadeOverlay 0.15s ease;
        }

        .menu-sheet {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-card);
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
          z-index: 61;
          padding: 8px 16px 24px;
          padding-bottom: calc(24px + var(--safe-bottom));
          animation: sheetUp 0.2s ease;
        }

        .menu-sheet .sheet-handle {
          margin-bottom: 12px;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          color: var(--text-secondary);
          background: none;
          border: none;
          width: 100%;
          font-family: inherit;
          font-size: 15px;
        }

        .menu-item:active { background: var(--bg-hover); }
        .menu-item.active { color: var(--text-primary); }
        .menu-item .nav-count { margin-left: auto; font-size: 12px; background: var(--bg-surface); color: var(--text-tertiary); padding: 2px 8px; border-radius: 10px; }

        /* ===== DESKTOP OVERRIDES (768px+) ===== */
        @media (min-width: 768px) {
          .app {
            flex-direction: row;
          }

          .mobile-header { display: none; }
          .bottom-bar { display: none; }

          .fab {
            display: none;
          }

          .sidebar {
            display: flex;
            flex-direction: column;
            width: 240px;
            min-width: 240px;
            background: var(--bg-sidebar);
            border-right: 1px solid var(--border);
            padding: 16px 0;
            user-select: none;
          }

          .sidebar-brand {
            padding: 8px 20px 24px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .nav-section { padding: 0 10px; }

          .nav-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.15s ease;
            color: var(--text-secondary);
            border: none;
            background: none;
            width: 100%;
            text-align: left;
            font-family: inherit;
            font-size: 13.5px;
          }

          .nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
          .nav-item.active { background: var(--bg-selected); color: var(--text-primary); }
          .nav-icon { opacity: 0.6; transition: opacity 0.15s; }
          .nav-item.active .nav-icon { opacity: 1; }
          .nav-item:hover .nav-icon { opacity: 0.9; }

          .sidebar .nav-count {
            margin-left: auto;
            font-size: 11px;
            font-weight: 500;
            background: var(--bg-surface);
            color: var(--text-secondary);
            padding: 1px 7px;
            border-radius: 10px;
            min-width: 20px;
            text-align: center;
          }

          .nav-item.active .nav-count { background: rgba(232,168,124,0.15); color: var(--accent); }

          .sidebar-divider { height: 1px; background: var(--border); margin: 12px 20px; }

          .sidebar-footer { margin-top: auto; padding: 12px 10px; }

          .capture-btn-desktop {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 9px 12px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            border: 1px dashed var(--border);
            background: none;
            color: var(--text-tertiary);
            width: 100%;
            font-family: inherit;
            font-size: 13px;
            transition: all 0.2s ease;
          }

          .capture-btn-desktop:hover {
            border-color: var(--accent);
            color: var(--accent);
            background: rgba(232,168,124,0.05);
          }

          .capture-shortcut {
            margin-left: auto;
            font-size: 10px;
            opacity: 0.5;
            background: var(--bg-surface);
            padding: 2px 5px;
            border-radius: 3px;
          }

          /* Desktop topbar */
          .desktop-topbar {
            display: flex;
            height: 52px;
            min-height: 52px;
            border-bottom: 1px solid var(--border);
            align-items: center;
            padding: 0 24px;
            gap: 12px;
          }

          .search-box {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 6px 12px;
            flex: 1;
            max-width: 400px;
          }

          .search-box input {
            border: none;
            background: none;
            color: var(--text-primary);
            font-family: inherit;
            font-size: 13px;
            outline: none;
            width: 100%;
          }

          .search-box input::placeholder { color: var(--text-tertiary); }
          .search-box svg { color: var(--text-tertiary); flex-shrink: 0; }

          .avatar {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: linear-gradient(135deg, #85B7D5, #C4A7E7);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            color: #1a1a1e;
            margin-left: auto;
          }

          .main-scroll { display: flex; flex-direction: column; }

          .desktop-content-wrapper {
            flex: 1;
            display: flex;
            overflow: hidden;
          }

          .desktop-scroll {
            flex: 1;
            overflow-y: auto;
          }

          .desktop-scroll::-webkit-scrollbar { width: 6px; }
          .desktop-scroll::-webkit-scrollbar-track { background: transparent; }
          .desktop-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

          .view-content {
            padding: 32px 40px 60px;
          }

          .task-row:hover { background: var(--bg-hover); }

          .checkbox {
            width: 20px;
            height: 20px;
            min-width: 20px;
            border-width: 1.8px;
          }

          .checkbox:hover { border-color: var(--accent); background: rgba(232,168,124,0.1); }

          /* Desktop detail panel */
          .detail-panel-desktop {
            width: 340px;
            min-width: 340px;
            border-left: 1px solid var(--border);
            background: var(--bg-sidebar);
            overflow-y: auto;
            animation: slideInDesktop 0.2s ease;
          }

          @keyframes slideInDesktop {
            from { opacity: 0; transform: translateX(12px); }
            to { opacity: 1; transform: translateX(0); }
          }

          .forecast-scroll {
            margin: 16px 0 0;
            padding: 0;
          }

          .forecast-cell { width: 70px; min-width: 70px; }

          .tags-grid { grid-template-columns: repeat(3, 1fr); }

          .capture-modal { width: 520px; }
        }

        /* Large desktop */
        @media (min-width: 1200px) {
          .view-content {
            max-width: 860px;
          }
        }
      `}</style>

      <div className="app">
        {/* ===== MOBILE HEADER ===== */}
        <div className="mobile-header">
          <div className="mobile-brand">
            <div className="brand-mark">F</div>
            <span className="brand-name">Flow</span>
          </div>
          <button className="mobile-header-btn" onClick={() => setShowMobileMenu(true)}>
            {Icons.menu}
          </button>
        </div>

        {/* ===== DESKTOP SIDEBAR ===== */}
        <div className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-mark">F</div>
            <span className="brand-name">Flow</span>
          </div>
          <div className="nav-section">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? "active" : ""}`}
                onClick={() => { setActiveView(item.id); setSelectedTask(null); setActiveTag(null); }}
              >
                <span className="nav-icon" style={activeView === item.id ? { color: item.accent } : {}}>{item.icon}</span>
                {item.label}
                {item.count !== null && <span className="nav-count">{item.count}</span>}
              </button>
            ))}
          </div>
          <div className="sidebar-divider" />
          <div className="sidebar-footer">
            <button className="capture-btn-desktop" onClick={() => setShowCapture(true)}>
              {Icons.plus} Quick Capture <span className="capture-shortcut">⌘N</span>
            </button>
          </div>
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="main-scroll">
          {/* Desktop topbar */}
          <div className="desktop-topbar" style={{ display: 'none' }}>
            <div className="search-box">
              {Icons.search}
              <input placeholder="Search tasks, projects, tags…" />
            </div>
            <div className="avatar">JD</div>
          </div>
          <style>{`@media (min-width: 768px) { .desktop-topbar { display: flex !important; } }`}</style>

          <div className="desktop-content-wrapper">
            <div className="desktop-scroll">
              {renderContent()}
            </div>

            {/* Desktop detail panel */}
            {selectedTask && (
              <>
                {/* Mobile: bottom sheet */}
                <div className="mobile-detail-wrapper">
                  <div className="detail-overlay" onClick={() => setSelectedTask(null)} />
                  <div className="detail-sheet">
                    <div className="sheet-handle" />
                    <div className="detail-header">
                      <h3>Task Details</h3>
                      <button className="detail-close" onClick={() => setSelectedTask(null)}>{Icons.close}</button>
                    </div>
                    <div className="detail-body">
                      <div className="detail-title">{selectedTask.title}</div>
                      {selectedTask.project && (
                        <div className="detail-field">
                          <span className="detail-label">Project</span>
                          <span className="detail-value" style={{ color: AREAS[PROJECTS.find(p => p.id === selectedTask.project)?.area]?.color }}>
                            {PROJECTS.find(p => p.id === selectedTask.project)?.name}
                          </span>
                        </div>
                      )}
                      {selectedTask.due && (
                        <div className="detail-field">
                          <span className="detail-label">Due</span>
                          <span className="detail-value">{formatDate(selectedTask.due)}</span>
                        </div>
                      )}
                      {selectedTask.defer && (
                        <div className="detail-field">
                          <span className="detail-label">Defer Until</span>
                          <span className="detail-value">{formatDate(selectedTask.defer)}</span>
                        </div>
                      )}
                      {selectedTask.tags.length > 0 && (
                        <div className="detail-field">
                          <span className="detail-label">Tags</span>
                          <span className="detail-value">{selectedTask.tags.map(t => TAGS.find(tg => tg.id === t)?.name).join(", ")}</span>
                        </div>
                      )}
                      {selectedTask.notes && (
                        <div className="detail-notes">
                          <div className="detail-notes-label">Notes</div>
                          {selectedTask.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <style>{`
                  .mobile-detail-wrapper { display: block; }
                  .detail-panel-desktop { display: none; }
                  @media (min-width: 768px) {
                    .mobile-detail-wrapper { display: none !important; }
                    .detail-panel-desktop { display: block !important; }
                  }
                `}</style>

                {/* Desktop: side panel */}
                <div className="detail-panel-desktop">
                  <div className="detail-header">
                    <h3>Task Details</h3>
                    <button className="detail-close" onClick={() => setSelectedTask(null)}>{Icons.close}</button>
                  </div>
                  <div className="detail-body">
                    <div className="detail-title">{selectedTask.title}</div>
                    {selectedTask.project && (
                      <div className="detail-field">
                        <span className="detail-label">Project</span>
                        <span className="detail-value" style={{ color: AREAS[PROJECTS.find(p => p.id === selectedTask.project)?.area]?.color }}>
                          {PROJECTS.find(p => p.id === selectedTask.project)?.name}
                        </span>
                      </div>
                    )}
                    {selectedTask.due && (
                      <div className="detail-field">
                        <span className="detail-label">Due</span>
                        <span className="detail-value">{formatDate(selectedTask.due)}</span>
                      </div>
                    )}
                    {selectedTask.defer && (
                      <div className="detail-field">
                        <span className="detail-label">Defer Until</span>
                        <span className="detail-value">{formatDate(selectedTask.defer)}</span>
                      </div>
                    )}
                    {selectedTask.tags.length > 0 && (
                      <div className="detail-field">
                        <span className="detail-label">Tags</span>
                        <span className="detail-value">{selectedTask.tags.map(t => TAGS.find(tg => tg.id === t)?.name).join(", ")}</span>
                      </div>
                    )}
                    {selectedTask.notes && (
                      <div className="detail-notes">
                        <div className="detail-notes-label">Notes</div>
                        {selectedTask.notes}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ===== MOBILE BOTTOM TAB BAR ===== */}
        <div className="bottom-bar">
          {bottomNavItems.map(item => (
            <button
              key={item.id}
              className={`tab-btn ${activeView === item.id ? "active" : ""}`}
              onClick={() => { setActiveView(item.id); setSelectedTask(null); setActiveTag(null); }}
            >
              {item.count > 0 && <span className="tab-badge">{item.count}</span>}
              <span className="tab-icon" style={activeView === item.id ? { color: item.accent } : {}}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* ===== FAB ===== */}
        <button className="fab" onClick={() => setShowCapture(true)}>
          {Icons.plus}
        </button>

        {/* ===== MOBILE MENU SHEET ===== */}
        {showMobileMenu && (
          <>
            <div className="menu-overlay" onClick={() => setShowMobileMenu(false)} />
            <div className="menu-sheet">
              <div className="sheet-handle" />
              {navItems.map(item => (
                <button
                  key={item.id}
                  className={`menu-item ${activeView === item.id ? "active" : ""}`}
                  onClick={() => { setActiveView(item.id); setShowMobileMenu(false); setSelectedTask(null); setActiveTag(null); }}
                >
                  <span style={activeView === item.id ? { color: item.accent } : { color: "var(--text-tertiary)" }}>{item.icon}</span>
                  {item.label}
                  {item.count !== null && <span className="nav-count">{item.count}</span>}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ===== CAPTURE MODAL ===== */}
        {showCapture && (
          <div className="capture-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCapture(false); }}>
            <div className="capture-modal">
              <div className="capture-modal-header">{Icons.inbox} New Inbox Item</div>
              <input
                ref={captureRef}
                value={captureText}
                onChange={e => setCaptureText(e.target.value)}
                placeholder="What's on your mind?"
                onKeyDown={e => { if (e.key === "Enter") addToInbox(); if (e.key === "Escape") setShowCapture(false); }}
              />
              <div className="capture-modal-footer">
                <span className="capture-hint">Enter to capture</span>
                <button className="capture-submit" onClick={addToInbox} disabled={!captureText.trim()}>Add to Inbox</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
