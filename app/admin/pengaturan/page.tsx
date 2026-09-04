import type { Metadata } from "next";
import { Icon } from "@/lib/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { PageFooter } from "@/components/ui/panel";
import { ToastButton } from "@/components/toast-button";
import { DemoForm } from "@/components/demo-form";
import { SwitchField } from "@/components/switch-field";

export const metadata: Metadata = {
  title: "Pengaturan Pesantren",
  description:
    "Kelola identitas, periode akademik, dan preferensi dasar aplikasi.",
};

export default function AdminPengaturanPage() {
  return (
    <>
      <PageHeading
        compact
        kicker="Identitas dan preferensi"
        title="Pengaturan pesantren"
        description="Kelola identitas, periode akademik, dan preferensi dasar aplikasi."
        actions={
          <span className="role-chip">
            <Icon name="check-circle" />
            Tersimpan otomatis
          </span>
        }
      />
      <div className="form-layout">
        <section className="panel">
          <div className="form-card">
            <h2 className="form-card-title">Identitas pesantren</h2>
            <p className="form-card-description">
              Informasi ini tampil pada login, rapor, dan komunikasi resmi.
            </p>
            <DemoForm
              success="Pengaturan pesantren berhasil disimpan."
              actions={
                <>
                  <button className="button button-secondary" type="reset">
                    Batalkan
                  </button>
                  <button className="button button-primary" type="submit">
                    Simpan perubahan
                  </button>
                </>
              }
            >
              <div className="form-grid">
                <div className="field full">
                  <label htmlFor="schoolName">Nama pesantren</label>
                  <input
                    id="schoolName"
                    defaultValue="Pesantren Al-Hikmah"
                    required
                  />
                </div>
                <div className="field full">
                  <label htmlFor="address">
                    Alamat <span className="optional">(opsional)</span>
                  </label>
                  <textarea id="address">
                    Jl. Pendidikan No. 12, Yogyakarta
                  </textarea>
                </div>
                <div className="field">
                  <label htmlFor="academicYear">Tahun ajaran aktif</label>
                  <select id="academicYear">
                    <option>2026 / 2027</option>
                    <option>2025 / 2026</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="semester">Semester aktif</label>
                  <select id="semester">
                    <option>Ganjil</option>
                    <option>Genap</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="phone">
                    Nomor kontak <span className="optional">(opsional)</span>
                  </label>
                  <input id="phone" defaultValue="0274 555 012" />
                </div>
                <div className="field">
                  <label htmlFor="emailSchool">
                    Email resmi <span className="optional">(opsional)</span>
                  </label>
                  <input
                    id="emailSchool"
                    type="email"
                    defaultValue="halo@alhikmah.sch.id"
                  />
                </div>
              </div>
              <div className="form-divider" />
              <h3 className="form-card-title">Preferensi notifikasi</h3>
              <div className="setting-list">
                <SwitchField
                  name="notifyAssignments"
                  label="Notifikasi tugas baru"
                  description="Kirim pemberitahuan saat tugas dibuat."
                  defaultChecked
                />
                <SwitchField
                  name="notifyReports"
                  label="Rapor tersedia"
                  description="Beritahu santri dan wali saat rapor terbit."
                  defaultChecked
                />
                <SwitchField
                  name="notifyPayments"
                  label="Pengingat pembayaran"
                  description="Aktifkan pengingat tagihan SPP mendekati jatuh tempo."
                  defaultChecked
                />
              </div>
            </DemoForm>
          </div>
        </section>
        <aside className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Status konfigurasi</h2>
              <p className="panel-subtitle">Kelengkapan identitas sistem</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="progress-row">
              <span>Profil pesantren</span>
              <strong>92%</strong>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: "92%" }} />
            </div>
            <div className="notice" style={{ marginTop: 18 }}>
              <Icon name="check-circle" />
              <div>
                <strong>Konfigurasi siap</strong>
                Nama dan tahun ajaran aktif sudah tersedia untuk komponen
                utama.
              </div>
            </div>
            <div className="form-divider" />
            <div className="setting-list">
              <div className="setting-row">
                <div>
                  <div className="setting-name">Logo pesantren</div>
                  <div className="setting-description">Belum diunggah</div>
                </div>
                <ToastButton
                  className="button button-secondary"
                  message="Dialog upload logo siap digunakan."
                >
                  Unggah
                </ToastButton>
              </div>
              <div className="setting-row">
                <div>
                  <div className="setting-name">Zona waktu</div>
                  <div className="setting-description">WIB (UTC+7)</div>
                </div>
                <ToastButton
                  className="table-action"
                  message="Pengaturan zona waktu siap dibuka."
                  ariaLabel="Edit zona waktu"
                >
                  <Icon name="edit" />
                </ToastButton>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <PageFooter />
    </>
  );
}
