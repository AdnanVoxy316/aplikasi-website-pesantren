import { Icon, type IconName } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter, Panel } from "@/components/ui/panel";
import { ToastButton } from "@/components/toast-button";
import { DemoForm } from "@/components/demo-form";
import type { BadgeVariant } from "@/components/ui/status-badge";

type AnnouncementEntry = {
  icon: IconName;
  title: string;
  text: string;
  badge: { variant: BadgeVariant; label: string };
  date: string;
};

const ANNOUNCEMENTS: AnnouncementEntry[] = [
  {
    icon: "megaphone",
    title: "Jadwal ujian tengah semester",
    text: "Ujian akan dilaksanakan pada 2-7 Maret 2026. Mohon wali kelas memperbarui jadwal.",
    badge: { variant: "success", label: "Semua warga · Terbit" },
    date: "09 Feb 2026",
  },
  {
    icon: "calendar",
    title: "Libur Isra Mi'raj",
    text: "Kegiatan belajar diliburkan pada 16 Februari. Kegiatan kembali normal keesokan harinya.",
    badge: { variant: "neutral", label: "Semua warga · Terbit" },
    date: "08 Feb 2026",
  },
  {
    icon: "book",
    title: "Persiapan munaqasyah hafalan",
    text: "Santri tingkat Ulya dapat melihat pembagian jadwal munaqasyah di kelas masing-masing.",
    badge: { variant: "warning", label: "Ulya · Terjadwal" },
    date: "06 Feb 2026",
  },
];

export function PengumumanContent() {
  return (
    <>
      <PageHeading
        compact
        kicker="Komunikasi warga pesantren"
        title="Pengumuman"
        description="Bagikan informasi ke semua role, kelas tertentu, atau kelompok warga pesantren."
        actions={
          <ToastButton
            className="button button-primary"
            message="Form pengumuman baru siap digunakan."
          >
            <Icon name="plus" />
            Pengumuman baru
          </ToastButton>
        }
      />
      <div className="content-grid">
        <Panel
          title="Pengumuman terbit"
          subtitle="3 pengumuman aktif dan terlihat oleh penerima"
          actions={
            <select className="select-control">
              <option>Semua target</option>
              <option>Semua warga</option>
              <option>Santri</option>
              <option>Guru</option>
              <option>Wali santri</option>
            </select>
          }
        >
          <div className="announcement-list">
            {ANNOUNCEMENTS.map((item) => (
              <article className="announcement" key={item.title}>
                <span className="announcement-icon">
                  <Icon name={item.icon} />
                </span>
                <div>
                  <div className="announcement-title">{item.title}</div>
                  <div className="announcement-text">{item.text}</div>
                  <span
                    className={`status-badge ${item.badge.variant}`}
                    style={{ marginTop: 7 }}
                  >
                    {item.badge.label}
                  </span>
                </div>
                <time className="announcement-date">{item.date}</time>
              </article>
            ))}
          </div>
        </Panel>
        <aside className="panel" data-admin-only>
          <div className="form-card">
            <h2 className="form-card-title">Tulis pengumuman</h2>
            <p className="form-card-description">
              Pilih target agar informasi sampai ke penerima yang tepat.
            </p>
            <DemoForm
              success="Pengumuman berhasil diterbitkan."
              actions={
                <>
                  <ToastButton
                    className="button button-secondary"
                    message="Draft pengumuman disimpan."
                  >
                    Simpan draft
                  </ToastButton>
                  <button className="button button-primary" type="submit">
                    Terbitkan
                  </button>
                </>
              }
            >
              <div className="form-grid single">
                <div className="field">
                  <label htmlFor="announcementTitle">Judul pengumuman</label>
                  <input
                    id="announcementTitle"
                    placeholder="Contoh: Jadwal kajian pekanan"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="audience">Target penerima</label>
                  <select id="audience">
                    <option>Semua warga pesantren</option>
                    <option>Guru</option>
                    <option>Santri</option>
                    <option>Wali santri</option>
                    <option>Kelas tertentu</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="announcementBody">Isi pengumuman</label>
                  <textarea
                    id="announcementBody"
                    placeholder="Tulis informasi yang ingin disampaikan..."
                    required
                  />
                </div>
                <div className="field">
                  <label className="check-row">
                    <input type="checkbox" defaultChecked /> Kirim notifikasi
                    in-app
                  </label>
                </div>
              </div>
            </DemoForm>
          </div>
        </aside>
      </div>
      <PageFooter />
    </>
  );
}
