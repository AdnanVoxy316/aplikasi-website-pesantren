import { PageHeading, RoleChip } from "@/components/ui/page-heading";
import { Panel, EmptyState } from "@/components/ui/panel";
import { listPengumuman, listTahunAjaran } from "@/db/queries/admin";
import { tanggalIndo } from "@/lib/format";
import { Icon } from "@/lib/icons";

export async function PengumumanSection({
  role,
  roleLabel,
}: {
  role: "guru" | "santri" | "wali_santri";
  roleLabel: string;
}) {
  const items = await listPengumuman(role);
  return (
    <>
      <PageHeading
        kicker="Layanan pesantren"
        title="Pengumuman"
        description={`Informasi resmi dari pengelola pesantren untuk ${roleLabel}.`}
      />
      <Panel title="Daftar pengumuman" subtitle={`${items.length} pengumuman terbaru`}>
        {items.length === 0 ? (
          <EmptyState>
            Belum ada pengumuman yang dipublikasikan. Pengumuman baru dari admin
            pesantren akan tampil di sini.
          </EmptyState>
        ) : (
          <div className="announcement-list">
            {items.map((item) => (
              <article className="announcement" key={item.id}>
                <span className="announcement-icon">
                  <Icon name="megaphone" />
                </span>
                <div>
                  <div className="announcement-title announcement-title-wrap">{item.judul}</div>
                  <div className="announcement-text announcement-text-full">{item.isi}</div>
                  <div className="announcement-date">
                    {tanggalIndo(item.createdAt)} · {item.dibuatOlehNama ?? "Admin"} ·
                    target: {item.targetKelasNama ?? item.targetRole}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
      <RoleChip icon="megaphone">Pengumuman diperbarui otomatis oleh admin</RoleChip>
    </>
  );
}

export async function KalenderSection() {
  const tahunAjaranRows = await listTahunAjaran();
  return (
    <>
      <PageHeading
        kicker="Beranda"
        title="Kalender akademik"
        description="Periode tahun ajaran dan semester yang sedang digunakan pesantren."
      />
      <Panel title="Periode tahun ajaran" subtitle="Jadwal periode dikelola oleh admin pesantren">
        {tahunAjaranRows.length === 0 ? (
          <EmptyState>Belum ada tahun ajaran yang dibuat admin.</EmptyState>
        ) : (
          <div className="table-shell table-shell-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Mulai</th>
                  <th>Selesai</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tahunAjaranRows.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.label}</strong>
                    </td>
                    <td>{tanggalIndo(new Date(t.tanggalMulai))}</td>
                    <td>{tanggalIndo(new Date(t.tanggalSelesai))}</td>
                    <td>
                      {t.isActive ? (
                        <span className="status-badge success">Aktif</span>
                      ) : (
                        <span className="status-badge neutral">Nonaktif</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
