import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const LEADING_DAYS = ["26", "27", "28", "29", "30", "31"];
const EVENT_DAYS = new Set(["6", "9", "11", "12", "15"]);
const TODAY = "9";

const AGENDA: { time: string; subject: string; meta: string; badge: { variant: "success" | "warning" | "neutral"; label: string } }[] = [
  { time: "09 Feb", subject: "Presensi & pembelajaran", meta: "Semua kelas", badge: { variant: "success", label: "Hari ini" } },
  { time: "12 Feb", subject: "Deadline setoran hafalan", meta: "Ibtida A", badge: { variant: "warning", label: "Tugas" } },
  { time: "16 Feb", subject: "Libur Isra Mi'raj", meta: "Semua warga pesantren", badge: { variant: "neutral", label: "Libur" } },
  { time: "02 Mar", subject: "Ujian tengah semester", meta: "Semua tingkat", badge: { variant: "warning", label: "Ujian" } },
];

export function CalendarContent() {
  return (
    <>
      <PageHeading
        compact
        kicker="Jadwal dan agenda"
        title="Kalender akademik"
        description="Satu tempat untuk melihat jadwal belajar, ujian, libur, dan agenda pesantren."
        actions={
          <>
            <ToastButton className="button button-secondary" message="Filter kalender siap digunakan.">
              <Icon name="filter" />
              Filter agenda
            </ToastButton>
            <ToastButton className="button button-primary" message="Form agenda baru siap digunakan.">
              <Icon name="plus" />
              Tambah agenda
            </ToastButton>
          </>
        }
      />

      <div className="content-grid">
        <Panel
          title="Februari 2026"
          subtitle="Tahun Ajaran 2026 / 2027 · Semester Ganjil"
          actions={
            <div className="page-actions">
              <ToastButton className="pagination-button" message="Bulan sebelumnya." ariaLabel="Bulan sebelumnya">
                <Icon name="chevron-left" />
              </ToastButton>
              <ToastButton className="pagination-button" message="Bulan berikutnya." ariaLabel="Bulan berikutnya">
                <Icon name="chevron-right" />
              </ToastButton>
            </div>
          }
        >
          <div className="calendar-grid">
            {WEEKDAYS.map((day) => (
              <span className="calendar-weekday" key={day}>{day}</span>
            ))}
            {LEADING_DAYS.map((day) => (
              <span className="calendar-day muted" key={`lead-${day}`}>{day}</span>
            ))}
            {Array.from({ length: 28 }, (_, index) => {
              const day = String(index + 1);
              const classes = [
                "calendar-day",
                day === TODAY ? "today" : "",
                EVENT_DAYS.has(day) ? "has-event" : "",
              ].filter(Boolean).join(" ");
              return (
                <span className={classes} key={day}>{day}</span>
              );
            })}
          </div>
        </Panel>

        <Panel title="Agenda terdekat" subtitle="Kegiatan yang perlu disiapkan">
          <div className="panel-body">
            <div className="schedule-list">
              {AGENDA.map((item) => (
                <div className="schedule-item" key={item.time}>
                  <span className="schedule-time">{item.time}</span>
                  <div>
                    <div className="schedule-subject">{item.subject}</div>
                    <div className="schedule-meta">{item.meta}</div>
                  </div>
                  <StatusBadge variant={item.badge.variant}>{item.badge.label}</StatusBadge>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Legenda agenda" subtitle="Jenis kegiatan dalam kalender">
        <div className="panel-body">
          <div className="attendance-legend">
            <span><i className="attendance-dot present" />Pembelajaran</span>
            <span><i className="attendance-dot permit" />Tugas / ujian</span>
            <span><i className="attendance-dot sick" />Kegiatan pesantren</span>
            <span><i className="attendance-dot absent" />Libur</span>
          </div>
        </div>
      </Panel>

      <footer className="footer">
        <span className="footer-brand">ELMS Pesantren</span>
        <span className="footer-note">Kalender akademik dapat digunakan lintas role</span>
      </footer>
    </>
  );
}
