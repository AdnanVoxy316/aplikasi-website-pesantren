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

type ToastFn = (message: string) => void;

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
  const [lastPathname, setLastPathname] = useState(pathname);
  const hash = useSyncExternalStore(subscribeToHash, () => window.location.hash, () => "");
  const [openPopover, setOpenPopover] = useState<"none" | "notification" | "profile">("none");
  const [notifItems, setNotifItems] = useState<ShellNotification[]>(notifications);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimer = useRef<number | undefined>(undefined);

  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const notificationPopoverRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profilePopoverRef = useRef<HTMLDivElement>(null);

  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setSidebarOpen(false);
    setOpenPopover("none");
  }

  const showToast = useCallback<ToastFn>((message: string) => {
    setToastMessage(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMessage(""), 2600);
  }, []);

  useEffect(() => {
    const timer = toastTimer.current;
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName ?? "")
      ) {
        event.preventDefault();
        showToast("Pencarian global tersedia pada versi aplikasi berikutnya.");
      }
      if (event.key === "Escape") {
        setOpenPopover("none");
        setSidebarOpen(false);
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
  }, [showToast]);

  const navSections = navigation[role];
  const hasNotification = notifItems.some((item) => !item.read);
  const breadcrumb = useMemo(
    () =>
      pathname.startsWith("/profil")
        ? (["Akun", "Profil saya"] as [string, string])
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
          className={`sidebar${sidebarOpen ? " open" : ""}`}
          aria-label={`Navigasi ${roleLabels[role]}`}
        >
          <Link
            className="brand"
            href={roleDashboard[role]}
            aria-label="ELMS Pesantren, kembali ke beranda"
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
                          onClick={() => setSidebarOpen(false)}
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
                className="search-button"
                type="button"
                onClick={() => showToast("Pencarian global tersedia pada versi aplikasi berikutnya.")}
              >
                <Icon name="search" />
                <span>Cari apa saja</span>
                <kbd className="search-key">/</kbd>
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label="Buka notifikasi"
                aria-expanded={openPopover === "notification"}
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
        className={`popover${openPopover === "notification" ? " open" : ""}`}
        role="dialog"
        aria-label="Notifikasi"
        ref={notificationPopoverRef}
      >
        <div className="popover-head">
          <strong>Notifikasi</strong>
          <button type="button" onClick={markAllRead}>
            Tandai dibaca
          </button>
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
        className={`popover profile-popover${openPopover === "profile" ? " open" : ""}`}
        role="dialog"
        aria-label="Menu profil"
        ref={profilePopoverRef}
      >
        <div className="profile-menu-head">
          <span className="avatar">{user.initials}</span>
          <div className="profile-copy">
            <span className="profile-name">{user.name}</span>
            <span className="profile-role">{user.roleLabel}</span>
          </div>
        </div>
        <div className="profile-menu-list">
          <Link className="profile-menu-link" href="/profil" onClick={() => setOpenPopover("none")}>
            <Icon name="user" />
            Profil saya
          </Link>
          <Link className="profile-menu-link" href="/profil#keamanan" onClick={() => setOpenPopover("none")}>
            <Icon name="settings" />
            Pengaturan akun
          </Link>
          <Link className="profile-menu-link" href="/logout">
            <Icon name="log-out" />
            Keluar
          </Link>
        </div>
      </div>

      <div className={`toast${toastMessage ? " show" : ""}`} role="status" aria-live="polite">
        <Icon name="check" />
        <span>{toastMessage}</span>
      </div>
    </ToastContext.Provider>
  );
}
