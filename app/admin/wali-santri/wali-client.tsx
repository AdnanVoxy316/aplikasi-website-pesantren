"use client";

import { useTransition } from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/components/app-shell";
import { linkWaliAnakForm, unlinkWaliAnakForm } from "@/actions/forms";

export type WaliGroup = {
  id: string;
  userId: string;
  nama: string;
  email: string;
  noTelp: string | null;
  anak: {
    id: string;
    santriId: string;
    santriNama: string;
    nis: string;
    kelasNama: string | null;
  }[];
};

export type SantriOption = { id: string; label: string };

const inputStyle = {
  display: "block",
  width: "100%",
  marginBottom: 10,
  padding: "9px 11px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  fontSize: 12,
};

export function WaliSantriClient({
  groups,
  santriOptions,
}: {
  groups: WaliGroup[];
  santriOptions: SantriOption[];
}) {
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      showToast(result.ok ? result.message ?? "Berhasil." : result.error ?? "Gagal.");
    });
  };

  return (
    <div className="form-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Relasi wali — santri</h2>
            <p className="panel-subtitle">
              {groups.length} wali terdaftar · satu wali bisa memiliki lebih dari satu anak
            </p>
          </div>
        </div>
        <div className="announcement-list" style={{ padding: "0 22px 18px" }}>
          {groups.map((wali) => (
            <article className="announcement" key={wali.id} style={{ alignItems: "flex-start" }}>
              <span className="announcement-icon">
                <Icon name="users" />
              </span>
              <div style={{ flex: 1 }}>
                <div className="announcement-title">
                  {wali.nama} <span style={{ color: "var(--muted-light)" }}>· {wali.email}</span>
                </div>
                {wali.anak.length === 0 ? (
                  <div className="announcement-text">
                    Belum terhubung dengan santri mana pun.
                  </div>
                ) : (
                  wali.anak.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        marginTop: 6,
                        padding: "7px 10px",
                        borderRadius: 10,
                        background: "var(--surface-soft)",
                      }}
                    >
                      <span style={{ fontSize: 12 }}>
                        <strong>{a.santriNama}</strong> · NIS {a.nis}
                        {a.kelasNama ? ` · ${a.kelasNama}` : ""}
                      </span>
                      <button
                        className="table-action danger"
                        type="button"
                        title="Lepas relasi"
                        disabled={pending}
                        onClick={() => {
                          if (!window.confirm(`Lepas relasi ${wali.nama} — ${a.santriNama}?`)) return;
                          const fd = new FormData();
                          fd.set("id", a.id);
                          run(() => unlinkWaliAnakForm(fd));
                        }}
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </article>
          ))}
          {groups.length === 0 ? (
            <p className="panel-subtitle">
              Belum ada akun wali santri. Buat akun wali terlebih dahulu di menu Akun.
            </p>
          ) : null}
        </div>
      </section>

      <section className="panel form-card">
        <h2 className="form-card-title">Hubungkan wali ke santri</h2>
        <p className="form-card-description">
          Relasi menentukan tagihan, nilai, kehadiran, dan rapor anak yang bisa dilihat wali.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const fd = new FormData(form);
            run(() => linkWaliAnakForm(fd));
            form.reset();
          }}
        >
          <div className="form-grid single">
            <div className="field">
              <label htmlFor="w-wali">Wali santri</label>
              <select id="w-wali" name="waliUserId" required style={inputStyle}>
                {groups.map((g) => (
                  <option key={g.id} value={g.userId}>
                    {g.nama} ({g.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="w-santri">Santri (anak)</label>
              <select id="w-santri" name="santriId" required style={inputStyle}>
                {santriOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={pending}>
              Hubungkan
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
