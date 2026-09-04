import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/lib/icons";
import { PageHeading, RoleChip } from "@/components/ui/page-heading";
import { Panel, PageFooter } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastButton } from "@/components/toast-button";
import { DemoForm } from "@/components/demo-form";
import { santriTaskBadges, santriTasks } from "../tasks";

type PageProps = { params: Promise<{ tugasId: string }> };

export function generateStaticParams() {
  return santriTasks.map((task) => ({ tugasId: task.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { tugasId } = await params;
  const task = santriTasks.find((item) => item.id === tugasId);
  return { title: task ? task.title : "Detail Tugas" };
}

export default async function TugasDetailPage({ params }: PageProps) {
  const { tugasId } = await params;
  const task = santriTasks.find((item) => item.id === tugasId);
  if (!task) notFound();
  const badge = santriTaskBadges[task.status];

  return (
    <>
      <PageHeading
        compact
        kicker={task.subject}
        title={task.title}
        description={`Tugas dari ${task.teacherFull} · Ibtida A`}
        actions={
          <>
            <StatusBadge variant={badge.variant}>{badge.label}</StatusBadge>
            <Link className="button button-secondary" href="/santri/tugas">
              <Icon name="arrow-left" />
              Kembali
            </Link>
          </>
        }
      />

      <div className="detail-layout">
        <section>
          <Panel
            title="Instruksi tugas"
            subtitle={task.createdNote}
            actions={<RoleChip icon="clock">{task.deadlineChip}</RoleChip>}
            bodyClassName="panel-body"
          >
            <div className="task-instruction">
              <p>{task.instruction}</p>
              <h3>Ketentuan</h3>
              <ul>
                {task.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div
              className={task.notice.warning ? "notice warning" : "notice"}
              style={{ marginTop: 20 }}
            >
              <Icon name={task.notice.warning ? "alert" : "check-circle"} />
              <div>
                <strong>{task.notice.strong}</strong>
                {task.notice.text}
              </div>
            </div>
          </Panel>

          <section className="panel" style={{ marginTop: 15 }}>
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Submission kamu</h2>
                <p className="panel-subtitle">
                  Pilih salah satu cara mengumpulkan tugas
                </p>
              </div>
            </div>
            <div className="form-card">
              <DemoForm
                success="Submission berhasil dikirim ke guru."
                actions={
                  <>
                    <ToastButton
                      className="button button-secondary"
                      message="Submission sebelumnya belum tersedia."
                    >
                      Hapus submission
                    </ToastButton>
                    <button className="button button-primary" type="submit">
                      <Icon name="upload" />
                      Kirim tugas
                    </button>
                  </>
                }
              >
                <div className="form-grid">
                  <div className="field full">
                    <label htmlFor="submissionFile">
                      Upload file{" "}
                      <span className="optional">
                        (.doc, .docx, .pdf, .jpg, .png)
                      </span>
                    </label>
                    <input id="submissionFile" type="file" />
                    <small>
                      Ukuran maksimum 10 MB. Untuk prototype, file tidak
                      benar-benar diunggah.
                    </small>
                  </div>
                  <div className="field full">
                    <label htmlFor="submissionLink">Atau kirim link</label>
                    <div className="input-with-icon">
                      <Icon name="link" />
                      <input
                        id="submissionLink"
                        type="url"
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                  </div>
                  <div className="field full">
                    <label htmlFor="submissionNote">
                      Catatan untuk guru <span className="optional">(opsional)</span>
                    </label>
                    <textarea
                      id="submissionNote"
                      placeholder="Tambahkan catatan jika diperlukan..."
                    />
                  </div>
                </div>
              </DemoForm>
            </div>
          </section>
        </section>

        <aside>
          <Panel
            title="Ringkasan tugas"
            subtitle="Informasi penting"
            bodyClassName="panel-body"
          >
            <div className="setting-list">
              {task.summary.map((row) => (
                <div className="setting-row" key={row.name}>
                  <div>
                    <div className="setting-name">{row.name}</div>
                    <div className="setting-description">{row.description}</div>
                  </div>
                  <Icon name={row.icon} />
                </div>
              ))}
            </div>
          </Panel>

          <section className="panel" style={{ marginTop: 15 }}>
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Bantuan</h2>
                <p className="panel-subtitle">Ada kendala mengumpulkan?</p>
              </div>
            </div>
            <div className="panel-body">
              <p className="panel-subtitle">
                Hubungi guru pengampu sebelum deadline jika ada masalah pada
                file atau link.
              </p>
              <div style={{ display: "grid", marginTop: 14 }}>
                <ToastButton
                  className="button button-secondary"
                  message="Pesan kepada guru siap digunakan."
                >
                  <Icon name="megaphone" />
                  Hubungi guru
                </ToastButton>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <PageFooter />
    </>
  );
}
