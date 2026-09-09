"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Icon } from "@/lib/icons";
import {
  isNavItemActive,
  navigation,
  resolveBreadcrumb,
  roleLabels,
  roleDashboard,
} from "@/lib/nav";
import { markAllNotificationsRead } from "@/actions/notifikasi";

export type ToastType = "success" | "error" | "warning" | "info";
type ToastFn = (message: string, type?: ToastType) => void;

type ToastState = {
  message: string;
  type: ToastType;
};

const ToastContext = createContext<ToastFn>(() => {});

export function useToast(): ToastFn {
  return useContext(ToastContext);
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export type ShellUser = {
  name: string;
  initials: string;
  roleLabel: string;
  email?: string | undefined;
};

export type ShellNotification = {
  id: string;
  title: string;
  description: string;
  read: boolean;
};

export default function AppShell({
  role,
  user,
  notifications,
  tahunAjaranLabel,
  semesterLabel,
  children,
}: {
  role: keyof typeof navigation;
  user: ShellUser;
  notifications: ShellNotification[];
  tahunAjaranLabel: string;
  semesterLabel: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hash = useSyncExternalStore(subscribeToHash, () => window.location.hash, () => "");
  const [openPopover, setOpenPopover] = useState<"none" | "notification" | "profile">("none");
  const [notifItems, setNotifItems] = useState<ShellNotification[]>(notifications);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const previousPopoverRef = useRef<"none" | "notification" | "profile">("none");
  const previousSidebarOpenRef = useRef(false);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const notificationPopoverRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profilePopoverRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback<ToastFn>((message: string, type: ToastType = "success") => {
    setToast({ message, type });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    const timer = toastTimer.current;
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const getActivePopover = () => {
      if (openPopover === "notification") return notificationPopoverRef.current;
      if (openPopover === "profile") return profilePopoverRef.current;
      return null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPopover("none");
        setSidebarOpen(false);
        return;
      }

      if (event.key === "Tab" && openPopover !== "none") {
        const popover = getActivePopover();
        const focusable = popover
          ? Array.from(
              popover.querySelectorAll<HTMLElement>(
                'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
              ),
            )
          : [];
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      const inNotification =
        notificationButtonRef.current?.contains(target as Node) ??
        notificationPopoverRef.current?.contains(target as Node) ??
        false;
      const inProfile =
        profileButtonRef.current?.contains(target as Node) ??
        profilePopoverRef.current?.contains(target as Node) ??
        false;
      if (!inNotification && !inProfile) setOpenPopover("none");
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
    };
  }, [openPopover]);

  useEffect(() => {
    if (previousSidebarOpenRef.current && !sidebarOpen) menuButtonRef.current?.focus();
    previousSidebarOpenRef.current = sidebarOpen;
  }, [sidebarOpen]);

  useEffect(() => {
    const previous = previousPopoverRef.current;
    if (openPopover === "notification") {
      notificationPopoverRef.current
        ?.querySelector<HTMLElement>("[data-popover-focus], button, a[href]")
        ?.focus();
    } else if (openPopover === "profile") {
      profilePopoverRef.current?.querySelector<HTMLElement>("a[href], button")?.focus();
    } else if (previous === "notification") {
      notificationButtonRef.current?.focus();
    } else if (previous === "profile") {
      profileButtonRef.current?.focus();
    }
    previousPopoverRef.current = openPopover;
  }, [openPopover]);

  const navSections = navigation[role];
  const hasNotification = notifItems.some((item) => !item.read);
  const breadcrumb = useMemo(
    () =>
      pathname.startsWith("/profil")
        ? (["Akun", "Profil & pengaturan akun"] as [string, string])
        : resolveBreadcrumb(pathname, role),
    [pathname, role],
  );

  const markAllRead = () => {
    setNotifItems((items) => items.map((item) => ({ ...item, read: true })));
    void markAllNotificationsRead();
    showToast("Semua notifikasi ditandai sudah dibaca.");
  };

  return (
    <ToastContext.Provider value={showToast}>
      <div
        className={`sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <div className="app-shell">
        <aside
          id="primary-navigation"
          className={`sidebar${sidebarOpen ? " open" : ""}`}
          aria-label={`Navigasi ${roleLabels[role]}`}
        >
          <Link
            className="brand"
            href={roleDashboard[role]}
            aria-label="ELMS Pesantren, kembali ke beranda"
            onClick={() => {
              setSidebarOpen(false);
              setOpenPopover("none");
            }}
          >
            <span className="brand-mark">
              <Icon name="mosque" />
            </span>
            <span>
              <strong className="brand-name">ELMS Pesantren</strong>
              <span className="brand-subtitle">Ruang belajar terpadu</span>
            </span>
          </Link>

          <nav>
            {navSections.map((section) => (
              <section
                className="nav-section"
                key={section.label}
                aria-labelledby={`nav-${section.label}`}
              >
                <h2 className="nav-label" id={`nav-${section.label}`}>
                  {section.label}
                </h2>
                <ul className="nav-list">
                  {section.items.map((item) => {
                    const hashPart = item.href.includes("#") ? item.href.split("#")[1] : "";
                    const active =
                      isNavItemActive(pathname, item.href) && hashPart === hash;
                    return (
                      <li key={item.label}>
                        <Link
                          className={`nav-link${active ? " active" : ""}`}
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => {
                            setSidebarOpen(false);
                            setOpenPopover("none");
                          }}
                        >
                          <span className="nav-icon">
                            <Icon name={item.icon} />
                          </span>
                          {item.label}
                          {item.count ? <span className="nav-count">{item.count}</span> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </nav>

          <div className="sidebar-foot">
            <span className="year-caption">Tahun ajaran aktif</span>
            <span className="year-select" aria-label="Tahun ajaran aktif">
              {tahunAjaranLabel || "Belum diatur"}
            </span>
            <div className="sidebar-meta">
              <span className="live-dot" aria-hidden="true" />
              <span>{semesterLabel}</span>
            </div>
          </div>
        </aside>

        <main className="main-shell">
          <header className="topbar">
            <div className="topbar-start">
              <button
                className="menu-button"
                type="button"
                aria-label="Buka menu navigasi"
                aria-expanded={sidebarOpen}
                aria-controls="primary-navigation"
                ref={menuButtonRef}
                onClick={() => setSidebarOpen((open) => !open)}
              >
                <Icon name="menu" />
              </button>
              <div className="breadcrumb" aria-label="Breadcrumb">
                <span>{breadcrumb[0]}</span>
                <Icon name="chevron-right" />
                <strong>{breadcrumb[1]}</strong>
              </div>
            </div>
            <div className="topbar-end">
              <button
                className="search-button is-disabled"
                type="button"
                disabled
                aria-label="Pencarian global segera hadir"
                title="Pencarian global segera hadir"
              >
                <Icon name="search" />
                <span>Pencarian segera hadir</span>
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label="Buka notifikasi"
                aria-expanded={openPopover === "notification"}
                aria-controls="notification-popover"
                ref={notificationButtonRef}
                onClick={() =>
                  setOpenPopover((current) =>
                    current === "notification" ? "none" : "notification",
                  )
                }
              >
                <Icon name="bell" />
                {hasNotification ? <span className="notification-dot" aria-hidden="true" /> : null}
              </button>
              <button
                className="profile-button"
                type="button"
                aria-label="Buka menu profil"
                aria-expanded={openPopover === "profile"}
                aria-controls="profile-popover"
                ref={profileButtonRef}
                onClick={() =>
                  setOpenPopover((current) => (current === "profile" ? "none" : "profile"))
                }
              >
                <span className="avatar">{user.initials}</span>
                <span className="profile-copy">
                  <span className="profile-name">{user.name}</span>
                  <span className="profile-role">{user.roleLabel}</span>
                </span>
                <Icon name="chevron-down" className="profile-chevron" />
              </button>
            </div>
          </header>

          <div className="content">{children}</div>
        </main>
      </div>

      <div
        id="notification-popover"
        className={`popover${openPopover === "notification" ? " open" : ""}`}
        role="dialog"
        aria-labelledby="notification-popover-title"
        aria-hidden={openPopover !== "notification"}
        ref={notificationPopoverRef}
      >
        <div className="popover-head">
          <strong id="notification-popover-title">Notifikasi</strong>
          <div className="popover-actions">
            <button
              className="popover-close"
              type="button"
              aria-label="Tutup notifikasi"
              onClick={() => setOpenPopover("none")}
            >
              <Icon name="close" />
            </button>
            <button type="button" data-popover-focus onClick={markAllRead}>
              Tandai dibaca
            </button>
          </div>
        </div>
        <div className="notification-list">
          {notifItems.length === 0 ? (
            <div className="notification-item read">
              <div>
                <strong>Tidak ada notifikasi</strong>
                <span>Notifikasi baru akan muncul di sini.</span>
              </div>
            </div>
          ) : (
            notifItems.map((item) => (
              <div className={`notification-item${item.read ? " read" : ""}`} key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        id="profile-popover"
        className={`popover profile-popover${openPopover === "profile" ? " open" : ""}`}
        role="dialog"
        aria-labelledby="profile-popover-title"
        aria-hidden={openPopover !== "profile"}
        ref={profilePopoverRef}
      >
        <div className="profile-menu-head">
          <span className="avatar">{user.initials}</span>
          <div className="profile-copy">
            <span className="profile-name" id="profile-popover-title">{user.name}</span>
            <span className="profile-role">{user.roleLabel}</span>
          </div>
        </div>
        <div className="profile-menu-list">
          <Link className="profile-menu-link" href="/profil" onClick={() => setOpenPopover("none")}>
            <Icon name="user" />
            Profil &amp; pengaturan akun
          </Link>
          <Link className="profile-menu-link" href="/logout" onClick={() => setOpenPopover("none")}>
            <Icon name="log-out" />
            Keluar
          </Link>
        </div>
      </div>

      <div
        className={`toast${toast ? ` show ${toast.type}` : ""}`}
        role={toast?.type === "error" ? "alert" : "status"}
        aria-live={toast?.type === "error" ? "assertive" : "polite"}
        aria-atomic="true"
      >
        <Icon name={toast?.type === "success" ? "check" : "alert"} />
        <span>{toast?.message ?? ""}</span>
      </div>
    </ToastContext.Provider>
  );
}
