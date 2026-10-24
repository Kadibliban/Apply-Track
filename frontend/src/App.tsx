import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  CircleHelp,
  ClipboardList,
  LogOut,
  Menu,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { api, ApiError } from "./api";
import { useAuth } from "./auth";
import { useToast } from "./toast";
import type {
  Application,
  ApplicationPayload,
  ApplicationStatus,
  DashboardStats,
  FollowUp,
  Interview,
  User,
} from "./types";
import { applicationStatuses } from "./types";

const statusLabels: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  ASSESSMENT: "Assessment",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en", options ?? { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(value),
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  const submitLogin = async (email: string, password: string) => {
    setAuthBusy(true);
    setAuthError("");
    try {
      await signIn(email, password);
      navigate("/", { replace: true });
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setAuthBusy(false);
    }
  };

  const submitRegistration = async (name: string, email: string, password: string) => {
    setAuthBusy(true);
    setAuthError("");
    try {
      await signUp(name, email, password);
      navigate("/", { replace: true });
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setAuthBusy(false);
    }
  };

  if (loading) return <FullScreenLoader />;
  if (!user) {
    const isRegister = location.pathname === "/register";
    return isRegister ? (
      <AuthPage
        mode="register"
        busy={authBusy}
        error={authError}
        onLogin={submitLogin}
        onRegister={submitRegistration}
      />
    ) : (
      <AuthPage
        mode="login"
        busy={authBusy}
        error={authError}
        onLogin={submitLogin}
        onRegister={submitRegistration}
      />
    );
  }

  return (
    <Routes>
      <Route element={<AppShell user={user} onLogout={signOut} />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function FullScreenLoader() {
  return (
    <main className="loading-screen" aria-label="Loading your account">
      <div className="brand-mark"><BriefcaseBusiness size={22} /></div>
      <div className="loading-line" />
      <span>Getting your workspace ready</span>
    </main>
  );
}

function AuthPage({
  mode,
  busy,
  error,
  onLogin,
  onRegister,
}: {
  mode: "login" | "register";
  busy: boolean;
  error: string;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
}) {
  const isRegister = mode === "register";
  return (
    <main className="auth-page min-h-screen bg-white">
      <section className="auth-story">
        <Link className="brand brand-light" to="/login">
          <span className="brand-mark"><BriefcaseBusiness size={21} /></span>
          <span>applytrack</span>
        </Link>
        <div className="story-copy">
          <div className="eyebrow light-eyebrow"><Sparkles size={15} /> YOUR SEARCH, WITH MOMENTUM</div>
          <h1>Every next step<br />starts <em>somewhere.</em></h1>
          <p>A thoughtful little home for the work you’re putting into what comes next.</p>
          <div className="story-note">
            <div className="avatar-stack"><span>J</span><span>A</span><span>M</span><b>+</b></div>
            <div><strong>Make room for the good news.</strong><small>Your search is moving forward.</small></div>
          </div>
        </div>
        <div className="story-bottom"><span>Made for your next chapter</span><span>01 — 06</span></div>
        <div className="story-orbit orbit-one" /><div className="story-orbit orbit-two" />
      </section>
      <section className="auth-panel">
        <div className="auth-panel-top">
          <span>{isRegister ? "A fresh start" : "Welcome back"}</span>
          <span className="secure-note"><span /> PRIVATE BY DESIGN</span>
        </div>
        <div className="auth-form-wrap">
          <div className="auth-heading">
            <div className="mobile-brand brand"><span className="brand-mark"><BriefcaseBusiness size={20} /></span><span>applytrack</span></div>
            <p className="eyebrow">{isRegister ? "CREATE YOUR SPACE" : "YOUR SPACE IS WAITING"}</p>
            <h2>{isRegister ? "Start with a little clarity." : "Good to see you again."}</h2>
            <p>{isRegister ? "A few details, then you’re on your way." : "Pick up right where your job search left off."}</p>
          </div>
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const email = String(form.get("email")).trim();
              const password = String(form.get("password"));
              if (isRegister) void onRegister(String(form.get("name")).trim(), email, password);
              else void onLogin(email, password);
            }}
          >
            {isRegister && <Field label="Your name" name="name" autoComplete="name" placeholder="Alex Morgan" required minLength={1} />}
            <Field label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder={isRegister ? "At least 12 characters" : "Enter your password"}
              required
              minLength={isRegister ? 12 : 1}
            />
            {error && <InlineError message={error} />}
            <button className="button button-primary auth-submit" disabled={busy}>
              {busy ? <Spinner /> : isRegister ? "Create my account" : "Sign in"}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>
          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "New to ApplyTrack?"}{" "}
            <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create your space"}</Link>
          </p>
          <div className="auth-foot"><CircleHelp size={14} /> Your information stays yours. Always.</div>
        </div>
        <span className="auth-copyright">APPLYTRACK © 2026</span>
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  required,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
      />
    </label>
  );
}

function InlineError({ message }: { message: string }) {
  return <div className="inline-error" role="alert">{message}</div>;
}

function Spinner() {
  return <span className="spinner" aria-label="Loading" />;
}

function AppShell({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const location = useLocation();
  const title = location.pathname.startsWith("/applications") ? "Applications" : "Overview";
  return (
    <div className="app-frame min-h-screen bg-paper text-ink">
      <aside className="sidebar">
        <Link className="brand" to="/"><span className="brand-mark"><BriefcaseBusiness size={20} /></span><span>applytrack</span></Link>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="side-nav" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <ChartNoAxesCombined size={18} /> Overview
          </NavLink>
          <NavLink to="/applications" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <ClipboardList size={18} /> Applications
          </NavLink>
        </nav>
        <div className="sidebar-tip">
          <span className="tip-icon"><Sparkles size={17} /></span>
          <strong>One step at a time.</strong>
          <p>Every application is progress worth keeping track of.</p>
          <div className="tip-progress"><span /></div>
          <small>YOU’RE DOING GREAT</small>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          <div className="user-details"><strong>{user.name}</strong><small>Job seeker</small></div>
          <button className="icon-button logout-button" onClick={onLogout} aria-label="Log out" title="Log out"><LogOut size={17} /></button>
        </div>
      </aside>
      <div className="mobile-header">
        <Link className="brand" to="/"><span className="brand-mark"><BriefcaseBusiness size={19} /></span><span>applytrack</span></Link>
        <button className="icon-button" aria-label="Toggle navigation" onClick={() => setMobileMenu(!mobileMenu)}>
          {mobileMenu ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      {mobileMenu && (
        <div className="mobile-menu">
          <NavLink to="/" end onClick={() => setMobileMenu(false)}><ChartNoAxesCombined size={18} /> Overview</NavLink>
          <NavLink to="/applications" onClick={() => setMobileMenu(false)}><ClipboardList size={18} /> Applications</NavLink>
          <button onClick={onLogout}><LogOut size={18} /> Log out</button>
        </div>
      )}
      <main className="main-area">
        <header className="topbar bg-white">
          <div><p className="breadcrumb">YOUR WORKSPACE <span>/</span> {title.toUpperCase()}</p><h1>{title}</h1></div>
          <div className="topbar-right">
            <span className="today-label"><CalendarDays size={16} /> {formatDate(new Date().toISOString(), { weekday: "short", month: "short", day: "numeric" })}</span>
            <span className="topbar-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          </div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([api.stats(), api.upcomingInterviews(), api.listApplications({ limit: 5 })])
      .then(([nextStats, nextInterviews, nextApps]) => {
        if (!active) return;
        setStats(nextStats);
        setInterviews(nextInterviews.slice(0, 4));
        setApplications(nextApps);
      })
      .catch((reason: unknown) => {
        if (active) setError(getErrorMessage(reason));
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const interviewCounts = stats
    ? [
        { label: "Applications", value: stats.total_applications, icon: BriefcaseBusiness, tone: "sage", note: "Your search in motion" },
        { label: "Interviews", value: stats.total_interviews, icon: CalendarDays, tone: "blue", note: "Conversations started" },
        { label: "Offers", value: stats.total_offers, icon: Sparkles, tone: "gold", note: "Possibilities ahead" },
        { label: "Rejections", value: stats.total_rejections, icon: ClipboardList, tone: "rose", note: "Part of every journey" },
        { label: "Coming up", value: stats.upcoming_interviews, icon: Bell, tone: "violet", note: "Interviews ahead" },
      ]
    : [];

  return (
    <div className="page-stack">
      <section className="welcome-banner">
        <div className="welcome-copy"><span className="welcome-kicker">A LITTLE PROGRESS ADDS UP <Sparkles size={14} /></span><h2>Your next chapter is<br className="welcome-break" /> taking shape.</h2><p>Keep showing up. We’ll help you keep track.</p></div>
        <div className="welcome-art" aria-hidden="true"><div className="sun-disc" /><div className="hill hill-back" /><div className="hill hill-front" /><div className="art-stem stem-one" /><div className="art-stem stem-two" /><div className="art-leaf leaf-one" /><div className="art-leaf leaf-two" /><div className="art-leaf leaf-three" /></div>
        <Link className="welcome-link" to="/applications">Go to applications <ArrowRight size={16} /></Link>
      </section>

      {error && <InlineError message={error} />}
      {loading ? <div className="skeleton-grid">{Array.from({ length: 5 }, (_, index) => <div className="skeleton-card" key={index} />)}</div> : (
        <section className="stats-grid" aria-label="Application statistics">
          {interviewCounts.map((item) => {
            const Icon = item.icon;
            return <article className="stat-card" key={item.label}>
              <div className={`stat-icon ${item.tone}`}><Icon size={19} /></div><span className="stat-label">{item.label}</span>
              <strong className="stat-value">{item.value}</strong><span className="stat-note">{item.note}</span>
            </article>;
          })}
        </section>
      )}

      <div className="dashboard-lower">
        <section className="surface recent-surface">
          <div className="section-heading"><div><p className="eyebrow">THE LATEST</p><h2>Recent applications</h2></div><Link to="/applications" className="text-link">See all <ArrowRight size={15} /></Link></div>
          {loading ? <LoadingRows /> : applications.length === 0 ? <EmptyState title="Your first step starts here" body="Add a job you’ve applied for and keep everything in one place." action={<Link className="button button-primary button-small" to="/applications"><Plus size={16} /> Add an application</Link>} /> : (
            <div className="recent-list">
              {applications.slice(0, 4).map((application) => <div className="recent-row" key={application.id}>
                <CompanyMark name={application.company} />
                <div className="recent-role"><strong>{application.job_title}</strong><span>{application.company}{application.location ? ` · ${application.location}` : ""}</span></div>
                <StatusBadge status={application.status} /><span className="recent-date">{formatDate(application.application_date, { month: "short", day: "numeric" })}</span>
              </div>)}
            </div>
          )}
        </section>
        <section className="surface agenda-surface">
          <div className="section-heading"><div><p className="eyebrow">ON THE HORIZON</p><h2>Coming up</h2></div><span className="agenda-count">{interviews.length}</span></div>
          {loading ? <LoadingRows count={2} /> : interviews.length === 0 ? <div className="mini-empty"><div className="mini-empty-icon"><CalendarDays size={19} /></div><strong>Room for something good</strong><p>Upcoming interviews will show up here.</p></div> : (
            <div className="agenda-list">
              {interviews.map((interview) => <AgendaInterview interview={interview} key={interview.id} />)}
            </div>
          )}
          <div className="agenda-footer"><span><span className="pulse-dot" /> Your next step, at your pace</span><Sparkles size={15} /></div>
        </section>
      </div>
      <footer className="page-footer"><span>Keep going — you’re building something.</span><span>MADE WITH CARE <span className="footer-heart">♥</span></span></footer>
    </div>
  );
}

function AgendaInterview({ interview }: { interview: Interview }) {
  const [application, setApplication] = useState<Application | null>(null);
  useEffect(() => {
    api.getApplication(interview.application_id).then(setApplication).catch(() => setApplication(null));
  }, [interview.application_id]);
  return (
    <div className="agenda-item">
      <div className="agenda-date"><strong>{formatDate(interview.interview_at, { day: "2-digit" })}</strong><span>{formatDate(interview.interview_at, { month: "short" }).toUpperCase()}</span></div>
      <div className="agenda-detail"><strong>{application?.company ?? "Interview"}</strong><span>{interview.interview_type} · {formatTime(interview.interview_at)}</span></div>
      <span className="agenda-arrow"><ArrowRight size={15} /></span>
    </div>
  );
}

function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<Application | "new" | null>(null);
  const [details, setDetails] = useState<Application | null>(null);
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState("");
  const notify = useToast();
  const pageSize = 20;

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.listApplications({ search: search.trim(), status, limit: pageSize, offset });
      setApplications(result);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), search ? 250 : 0);
    return () => window.clearTimeout(timer);
    // reload is intentionally reconstructed from current filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, offset]);

  const saveApplication = async (payload: ApplicationPayload) => {
    setSaving(true);
    try {
      if (editor === "new") {
        await api.createApplication(payload);
        notify("Application added to your tracker.");
      } else if (editor) {
        await api.updateApplication(editor.id, payload);
        notify("Application details updated.");
      }
      setEditorError("");
      setEditor(null);
      await reload();
    } catch (reason) {
      const message = getErrorMessage(reason);
      setError(message);
      setEditorError(message);
    } finally {
      setSaving(false);
    }
  };

  const removeApplication = async (application: Application): Promise<boolean> => {
    if (!window.confirm(`Delete your ${application.job_title} application at ${application.company}? This cannot be undone.`)) return false;
    try {
      await api.deleteApplication(application.id);
      notify("Application deleted.");
      if (details?.id === application.id) setDetails(null);
      await reload();
      return true;
    } catch (reason) {
      const message = getErrorMessage(reason);
      setError(message);
      if (editor) setEditorError(message);
      return false;
    }
  };

  const changeStatus = async (application: Application, next: ApplicationStatus) => {
    try {
      const updated = await api.updateApplication(application.id, { status: next });
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
      if (details?.id === updated.id) setDetails(updated);
      notify("Application status updated.");
      await reload();
    } catch (reason) {
      setError(getErrorMessage(reason));
    }
  };

  const changeSearch = (value: string) => { setSearch(value); setOffset(0); };
  const changeFilter = (value: string) => { setStatus(value); setOffset(0); };

  return (
    <div className="page-stack">
      <div className="applications-intro">
        <div><p className="eyebrow">YOUR SEARCH, ORGANIZED</p><h2>Good things are in progress.</h2><p>Every application is a step toward what’s next.</p></div>
        <button className="button button-primary" onClick={() => { setEditorError(""); setEditor("new"); }}><Plus size={17} /> Add application</button>
      </div>
      <section className="surface applications-surface">
        <div className="table-toolbar">
          <div className="search-control"><Search size={17} /><input aria-label="Search applications" placeholder="Search company or role..." value={search} onChange={(event) => changeSearch(event.target.value)} /><kbd>⌘ K</kbd></div>
          <label className="filter-control"><span>STATUS</span><select aria-label="Filter by status" value={status} onChange={(event) => changeFilter(event.target.value)}><option value="">All statuses</option>{applicationStatuses.map((item) => <option value={item} key={item}>{statusLabels[item]}</option>)}</select></label>
        </div>
        {error && <div className="table-error"><InlineError message={error} /><button className="button button-quiet button-small" onClick={() => void reload()}>Try again</button></div>}
        {loading ? <LoadingRows count={5} /> : applications.length === 0 ? <EmptyState title={search || status ? "No applications found" : "A blank page is full of possibility"} body={search || status ? "Try another search or clear your status filter." : "Add the roles you’re pursuing and make your next steps easier to see."} action={search || status ? <button className="button button-secondary button-small" onClick={() => { changeSearch(""); changeFilter(""); }}>Clear filters</button> : <button className="button button-primary button-small" onClick={() => { setEditorError(""); setEditor("new"); }}><Plus size={16} /> Add an application</button>} /> : (
          <>
            <div className="table-scroll"><table className="application-table"><thead><tr><th>COMPANY & ROLE</th><th>APPLIED</th><th>STATUS</th><th>LOCATION</th><th aria-label="Actions" /></tr></thead>
              <tbody>{applications.map((application) => <tr key={application.id}>
                <td><button className="company-cell" onClick={() => setDetails(application)}><CompanyMark name={application.company} /><span><strong>{application.company}</strong><small>{application.job_title}</small></span></button></td>
                <td className="date-cell">{formatDate(application.application_date, { month: "short", day: "numeric", year: "numeric" })}</td>
                <td><label className="status-select-wrap"><span className={`status-dot ${application.status.toLowerCase()}`} /><select aria-label={`Status for ${application.company}`} value={application.status} onChange={(event) => void changeStatus(application, event.target.value as ApplicationStatus)}>{applicationStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></label></td>
                <td className="location-cell">{application.location || "—"}</td>
                <td><button className="row-action" aria-label={`Edit ${application.company}`} onClick={() => { setEditorError(""); setEditor(application); }}>•••</button></td>
              </tr>)}</tbody></table></div>
            <div className="pagination"><span>Showing <strong>{offset + 1}–{offset + applications.length}</strong> applications</span><div><button className="button button-secondary button-small" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - pageSize))}>Previous</button><button className="button button-secondary button-small" disabled={applications.length < pageSize} onClick={() => setOffset(offset + pageSize)}>Next</button></div></div>
          </>
        )}
      </section>
      <footer className="page-footer"><span>One thoughtful step at a time.</span><span>MADE WITH CARE <span className="footer-heart">♥</span></span></footer>

      {editor && <ApplicationEditor application={editor === "new" ? null : editor} busy={saving} error={editorError} onClose={() => setEditor(null)} onSubmit={saveApplication} onDelete={editor === "new" ? undefined : async () => { if (await removeApplication(editor)) setEditor(null); }} />}
      {details && <ApplicationDetails application={details} onClose={() => setDetails(null)} onEdit={() => { setEditorError(""); setEditor(details); setDetails(null); }} onChanged={() => void reload()} />}
    </div>
  );
}

function ApplicationEditor({
  application,
  busy,
  error,
  onClose,
  onSubmit,
  onDelete,
}: {
  application: Application | null;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (payload: ApplicationPayload) => Promise<void>;
  onDelete?: () => void;
}) {
  const [validationError, setValidationError] = useState("");
  return (
    <Modal onClose={onClose} title={application ? "A few details" : "A new possibility"} subtitle={application ? "Update this part of your journey." : "Add a role you’re exploring."}>
      <form className="application-form" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const minimum = form.get("salary_min") ? Number(form.get("salary_min")) : null;
        const maximum = form.get("salary_max") ? Number(form.get("salary_max")) : null;
        if (minimum !== null && maximum !== null && minimum > maximum) {
          setValidationError("The salary range should start with the smaller number.");
          return;
        }
        setValidationError("");
        void onSubmit({
          company: String(form.get("company")).trim(),
          job_title: String(form.get("job_title")).trim(),
          application_date: String(form.get("application_date")),
          status: String(form.get("status")) as ApplicationStatus,
          job_url: String(form.get("job_url") || "").trim() || null,
          location: String(form.get("location") || "").trim() || null,
          employment_type: String(form.get("employment_type") || "").trim() || null,
          salary_min: minimum,
          salary_max: maximum,
          job_description: String(form.get("job_description") || "").trim() || null,
          notes: String(form.get("notes") || "").trim() || null,
        });
      }}>
        <div className="form-grid">
          <label className="field"><span>Company <b>*</b></span><input name="company" required maxLength={200} defaultValue={application?.company ?? ""} placeholder="e.g. Northstar Studio" autoFocus /></label>
          <label className="field"><span>Job title <b>*</b></span><input name="job_title" required maxLength={200} defaultValue={application?.job_title ?? ""} placeholder="e.g. Product Designer" /></label>
          <label className="field"><span>Date applied <b>*</b></span><input name="application_date" type="date" required defaultValue={application?.application_date ?? new Date().toISOString().slice(0, 10)} /></label>
          <label className="field"><span>Current status</span><select name="status" defaultValue={application?.status ?? "APPLIED"}>{applicationStatuses.map((item) => <option value={item} key={item}>{statusLabels[item]}</option>)}</select></label>
          <label className="field"><span>Location</span><input name="location" maxLength={200} defaultValue={application?.location ?? ""} placeholder="Remote, New York..." /></label>
          <label className="field"><span>Employment type</span><input name="employment_type" maxLength={80} defaultValue={application?.employment_type ?? ""} placeholder="Full-time" /></label>
          <label className="field"><span>Salary from</span><input name="salary_min" type="number" min="0" defaultValue={application?.salary_min ?? ""} placeholder="e.g. 80000" /></label>
          <label className="field"><span>Salary to</span><input name="salary_max" type="number" min="0" defaultValue={application?.salary_max ?? ""} placeholder="e.g. 100000" /></label>
          <label className="field field-wide"><span>Job posting link</span><input name="job_url" type="url" defaultValue={application?.job_url ?? ""} placeholder="https://..." /></label>
          <label className="field field-wide"><span>Job description</span><textarea name="job_description" rows={4} defaultValue={application?.job_description ?? ""} placeholder="What is the role looking for?" /></label>
          <label className="field field-wide"><span>Notes for future you</span><textarea name="notes" rows={3} defaultValue={application?.notes ?? ""} placeholder="Referral, who you spoke with, what stood out..." /></label>
        </div>
        {validationError && <InlineError message={validationError} />}
        {error && <InlineError message={error} />}
        <div className="modal-actions">
          {onDelete && <button type="button" className="button button-danger-quiet" onClick={onDelete}>Delete application</button>}
          <span className="modal-spacer" />
          <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button-primary" disabled={busy}>{busy ? <Spinner /> : application ? "Save changes" : "Add application"}</button>
        </div>
      </form>
    </Modal>
  );
}

function ApplicationDetails({
  application,
  onClose,
  onEdit,
  onChanged,
}: {
  application: Application;
  onClose: () => void;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingInterview, setEditingInterview] = useState<number | null>(null);
  const notify = useToast();

  const loadActivities = async () => {
    setLoading(true);
    try {
      const [nextInterviews, nextFollowUps] = await Promise.all([
        api.listInterviews(application.id),
        api.listFollowUps(application.id),
      ]);
      setInterviews(nextInterviews);
      setFollowUps(nextFollowUps);
      setError("");
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadActivities(); }, [application.id]);

  const createInterview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    try {
      await api.createInterview(application.id, {
        interview_at: new Date(String(form.get("interview_at"))).toISOString(),
        interview_type: String(form.get("interview_type")),
        meeting_link: String(form.get("meeting_link") || "").trim() || undefined,
        notes: String(form.get("interview_notes") || "").trim() || undefined,
      });
      formElement.reset();
      notify("Interview added to your calendar.");
      await loadActivities();
      onChanged();
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  const createFollowUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    try {
      await api.createFollowUp(application.id, {
        due_at: new Date(String(form.get("due_at"))).toISOString(),
        notes: String(form.get("followup_notes") || "").trim() || undefined,
      });
      formElement.reset();
      notify("A reminder has been added.");
      await loadActivities();
      onChanged();
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  const completeFollowUp = async (followUp: FollowUp) => {
    try {
      await api.updateFollowUp(followUp.id, { is_completed: !followUp.is_completed });
      notify(followUp.is_completed ? "Reminder marked as open." : "Nice work — reminder completed.");
      await loadActivities();
      onChanged();
    } catch (reason) {
      setError(getErrorMessage(reason));
    }
  };

  const editInterview = async (event: React.FormEvent<HTMLFormElement>, interview: Interview) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.updateInterview(interview.id, {
        interview_at: new Date(String(form.get("interview_at"))).toISOString(),
        interview_type: String(form.get("interview_type")),
      });
      setEditingInterview(null);
      notify("Interview details updated.");
      await loadActivities();
      onChanged();
    } catch (reason) {
      setError(getErrorMessage(reason));
    }
  };

  return (
    <Modal onClose={onClose} title={application.company} subtitle={application.job_title} wide>
      <div className="details-topline"><StatusBadge status={application.status} /><span>Applied {formatDate(application.application_date)}</span><button className="button button-secondary button-small" onClick={onEdit}>Edit details</button></div>
      <div className="detail-info-grid">
        <DetailInfo label="Location" value={application.location} />
        <DetailInfo label="Employment" value={application.employment_type} />
        <DetailInfo label="Salary range" value={application.salary_min || application.salary_max ? [application.salary_min, application.salary_max].filter(Boolean).map((amount) => `$${Number(amount).toLocaleString()}`).join(" – ") : null} />
        {application.job_url && <DetailInfo label="Job posting" value={<a href={application.job_url} target="_blank" rel="noreferrer">Open listing <ArrowRight size={13} /></a>} />}
        {application.notes && <DetailInfo label="Notes" value={application.notes} wide />}
      </div>
      {error && <InlineError message={error} />}
      {loading ? <LoadingRows count={2} /> : (
        <div className="activity-columns">
          <section className="activity-panel">
            <div className="activity-heading"><span className="activity-icon interview-icon"><CalendarDays size={17} /></span><div><strong>Interviews</strong><small>{interviews.length} on the calendar</small></div></div>
            {interviews.length === 0 ? <p className="activity-empty">Nothing scheduled just yet.</p> : <div className="activity-list">{interviews.map((interview) => (
              <div className="activity-item" key={interview.id}>
                {editingInterview === interview.id ? <form className="inline-edit-form" onSubmit={(event) => void editInterview(event, interview)}><input name="interview_type" defaultValue={interview.interview_type} required /><input name="interview_at" type="datetime-local" defaultValue={toLocalDateTime(interview.interview_at)} required /><div><button className="button button-primary button-small">Save</button><button type="button" className="button button-secondary button-small" onClick={() => setEditingInterview(null)}>Cancel</button></div></form> : <>
                  <div className="activity-item-copy"><strong>{interview.interview_type}</strong><span>{formatDate(interview.interview_at)} · {formatTime(interview.interview_at)}</span>{interview.meeting_link && <a href={interview.meeting_link} target="_blank" rel="noreferrer">Meeting link <ArrowRight size={12} /></a>}</div>
                  <button className="mini-action" onClick={() => setEditingInterview(interview.id)}>Edit</button>
                </>}
              </div>
            ))}</div>}
            <form className="activity-form" onSubmit={(event) => void createInterview(event)}>
              <p className="form-section-label">SCHEDULE AN INTERVIEW</p>
              <input name="interview_type" required maxLength={80} placeholder="Interview type (e.g. Hiring manager)" aria-label="Interview type" />
              <input name="interview_at" type="datetime-local" required aria-label="Interview date and time" min={toLocalDateTime(new Date().toISOString())} />
              <input name="meeting_link" type="url" placeholder="Meeting link (optional)" aria-label="Meeting link" />
              <button className="button button-secondary button-small" disabled={busy}><Plus size={14} /> Add interview</button>
            </form>
          </section>
          <section className="activity-panel">
            <div className="activity-heading"><span className="activity-icon followup-icon"><Bell size={17} /></span><div><strong>Follow-ups</strong><small>{followUps.filter((item) => !item.is_completed).length} reminders open</small></div></div>
            {followUps.length === 0 ? <p className="activity-empty">A gentle reminder can keep things moving.</p> : <div className="activity-list">{followUps.map((followUp) => (
              <div className={`activity-item followup-item ${followUp.is_completed ? "completed" : ""}`} key={followUp.id}>
                <button className={`check-toggle ${followUp.is_completed ? "checked" : ""}`} aria-label={followUp.is_completed ? "Reopen reminder" : "Complete reminder"} onClick={() => void completeFollowUp(followUp)}>{followUp.is_completed ? "✓" : ""}</button>
                <div className="activity-item-copy"><strong>{followUp.notes || "Follow up"}</strong><span>Due {formatDate(followUp.due_at)} · {formatTime(followUp.due_at)}</span></div>
                {!followUp.is_completed && <span className={new Date(followUp.due_at) < new Date() ? "overdue-tag" : "upcoming-tag"}>{new Date(followUp.due_at) < new Date() ? "OVERDUE" : "UPCOMING"}</span>}
              </div>
            ))}</div>}
            <form className="activity-form" onSubmit={(event) => void createFollowUp(event)}>
              <p className="form-section-label">ADD A REMINDER</p>
              <input name="followup_notes" placeholder="What would you like to remember?" aria-label="Follow-up notes" />
              <input name="due_at" type="datetime-local" required aria-label="Follow-up due date" min={toLocalDateTime(new Date().toISOString())} />
              <button className="button button-secondary button-small" disabled={busy}><Plus size={14} /> Add reminder</button>
            </form>
          </section>
        </div>
      )}
    </Modal>
  );
}

function DetailInfo({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return <div className={`detail-info ${wide ? "detail-info-wide" : ""}`}><span>{label}</span><div>{value || "Not added"}</div></div>;
}

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function Modal({ children, onClose, title, subtitle, wide = false }: { children: React.ReactNode; onClose: () => void; title: string; subtitle: string; wide?: boolean }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => { window.removeEventListener("keydown", onKey); document.body.classList.remove("modal-open"); };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading"><div><p className="eyebrow">{wide ? "YOUR APPLICATION" : "KEEP IT MOVING"}</p><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></div>
        {children}
      </section>
    </div>
  );
}

function CompanyMark({ name }: { name: string }) {
  const letters = name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const colors = ["mark-green", "mark-coral", "mark-blue", "mark-gold", "mark-violet"];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];
  return <span className={`company-mark ${color}`}>{letters || "?"}</span>;
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}><span />{statusLabels[status]}</span>;
}

function EmptyState({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return <div className="empty-state"><span className="empty-illustration"><BriefcaseBusiness size={24} /></span><h3>{title}</h3><p>{body}</p>{action}</div>;
}

function LoadingRows({ count = 4 }: { count?: number }) {
  return <div className="loading-rows" aria-label="Loading applications">{Array.from({ length: count }, (_, index) => <div className="loading-row" key={index}><span /><span /><span /></div>)}</div>;
}

export default App;
