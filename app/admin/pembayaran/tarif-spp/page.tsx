import type { Metadata } from "next";
import { Icon, type IconName } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter, Panel } from "@/components/ui/panel";
import { StatusBadge, type BadgeVariant } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { DemoForm } from "@/components/demo-form";

export const metadata: Metadata = {
  title: "Tarif SPP",
  description:
    "Buat versi tarif baru tanpa mengubah snapshot tagihan pada periode sebelumnya.",
};

type RateAction = {
  icon: IconName;
  toast: string;
  ariaLabel: string;
  danger?: boolean;
};

type RateRow = {
  name: string;
  note: string;
  target: string;
  amount: string;
  starts: string;
  ends: string;
  status: { variant: BadgeVariant; label: string };
  actions: RateAction[];
};

const RATES: RateRow[] = [
  {
    name: "SPP Reguler 2026/2027",
    note: "Dibuat 01 Jul 2026",
    target: "Semua kelas",
    amount: "Rp 350.000",
    starts: "01 Jul 2026",
    ends: "-",
    status: { variant: "success", label: "Aktif" },
    actions: [
      {
        icon: "eye",
        toast: "Tarif aktif tidak dapat menimpa histori.",
        ariaLabel: "Lihat tarif",
      },
      {
        icon: "edit",
        toast: "Buat versi tarif berikutnya.",
        ariaLabel: "Duplikasi tarif",
      },
    ],
  },
  {
    name: "SPP Reguler 2025/2026",
    note: "Snapshot histori",
    target: "Semua kelas",
    amount: "Rp 300.000",
    starts: "01 Jan 2026",
    ends: "30 Jun 2026",
    status: { variant: "neutral", label: "Arsip" },
    actions: [
      {
        icon: "eye",
        toast: "Detail tarif histori siap dibuka.",
        ariaLabel: "Lihat tarif",
      },
    ],
  },
  {
    name: "Program Ulya",
    note: "Dibuat 01 Jul 2026",
    target: "Ulya",
    amount: "Rp 425.000",
    starts: "01 Jul 2026",
    ends: "-",
    status: { variant: "success", label: "Aktif" },
    actions: [
      {
        icon: "edit",
        toast: "Form edit tarif siap dibuka.",
        ariaLabel: "Edit tarif",
      },
      {
        icon: "trash",
        toast: "Tarif siap dinonaktifkan.",
        ariaLabel: "Nonaktifkan tarif",
        danger: true,
      },
    ],
  },
];

export default function AdminTarifSppPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Konfigurasi keuangan"
        title="Tarif SPP"
        description="Buat versi tarif baru tanpa mengubah snapshot tagihan pada periode sebelumnya."
        actions={
          <ToastButton
            className="button button-primary"
            message="Form tarif SPP baru siap digunakan."
          >
            <Icon name="plus" />
            Tambah tarif
          </ToastButton>
        }
      />
      <div className="notice">
        <Icon name="shield" />
        <div>
          <strong>Nominal tidak hard-coded</strong>
          Tarif aktif diambil dari konfigurasi periode. Ketika tarif berubah,
          buat record baru agar histori tagihan tetap konsisten.
        </div>
      </div>
      <div className="content-grid" style={{ marginTop: 15 }}>
        <Panel
          title="Versi tarif tersimpan"
          subtitle="Riwayat tarif umum dan tarif khusus kelas"
          actions={
            <select className="select-control" aria-label="Filter status tarif">
              <option>Semua status</option>
              <option>Aktif</option>
              <option>Arsip</option>
            </select>
          }
        >
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama tarif</th>
                  <th>Target</th>
                  <th>Nominal</th>
                  <th>Berlaku mulai</th>
                  <th>Berlaku sampai</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {RATES.map((rate) => (
                  <tr key={rate.name}>
                    <td>
                      <strong>{rate.name}</strong>
                      <br />
                      <span className="person-meta">{rate.note}</span>
                    </td>
                    <td>{rate.target}</td>
                    <td>
                      <strong>{rate.amount}</strong>
                    </td>
                    <td>{rate.starts}</td>
                    <td>{rate.ends}</td>
                    <td>
                      <StatusBadge variant={rate.status.variant}>
                        {rate.status.label}
                      </StatusBadge>
                    </td>
                    <td>
                      <div className="table-actions">
                        {rate.actions.map((action) => (
                          <ToastButton
                            key={action.icon}
                            className={
                              action.danger
                                ? "table-action danger"
                                : "table-action"
                            }
                            message={action.toast}
                            ariaLabel={action.ariaLabel}
                          >
                            <Icon name={action.icon} />
                          </ToastButton>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <aside className="panel">
          <div className="form-card">
            <h2 className="form-card-title">Buat tarif baru</h2>
            <p className="form-card-description">
              Perubahan tarif berlaku untuk tagihan yang dibuat setelah tanggal
              mulai.
            </p>
            <DemoForm
              success="Tarif SPP baru berhasil disimpan."
              actions={
                <>
                  <button className="button button-secondary" type="reset">
                    Reset
                  </button>
                  <button className="button button-primary" type="submit">
                    Simpan tarif
                  </button>
                </>
              }
            >
              <div className="form-grid single">
                <div className="field">
                  <label htmlFor="rateName">Nama tarif</label>
                  <input
                    id="rateName"
                    placeholder="Contoh: SPP Reguler 2027/2028"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="rateAmount">Nominal per periode</label>
                  <input
                    id="rateAmount"
                    type="number"
                    min={0}
                    placeholder="Nominal dari kebijakan pesantren"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="rateTarget">
                    Target kelas <span className="optional">(opsional)</span>
                  </label>
                  <select id="rateTarget">
                    <option>Semua kelas</option>
                    <option>Ibtida</option>
                    <option>Tsanawiyah</option>
                    <option>Ulya</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="rateStart">Berlaku mulai</label>
                  <input
                    id="rateStart"
                    type="date"
                    defaultValue="2026-07-01"
                    required
                  />
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
