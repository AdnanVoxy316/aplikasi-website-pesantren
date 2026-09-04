"use server";

import {
  createAkun,
  updateAkun,
  resetPassword,
  setAkunAktif,
  deleteAkun,
} from "@/actions/admin/akun";
import {
  createTahunAjaran,
  activateTahunAjaran,
  createKelas,
  updateKelas,
  deleteKelas,
  createMapel,
  updateMapel,
  deleteMapel,
  createPengajaran,
  deletePengajaran,
  linkWaliAnak,
  unlinkWaliAnak,
  createJenisNilai,
  deleteJenisNilai,
} from "@/actions/admin/akademik";
import { createPengumuman, deletePengumuman } from "@/actions/admin/pengumuman";
import { updatePengaturan } from "@/actions/admin/pengaturan";
import { deleteNilai, simpanNilaiMassal } from "@/actions/guru/nilai";
import { simpanKehadiran } from "@/actions/guru/kehadiran";
import { createTugas, gradeSubmission, deleteTugas } from "@/actions/guru/tugas";
import { generateRapor } from "@/actions/guru/rapor";
import { submitLink, submitFile, deleteSubmission } from "@/actions/santri/submission";
import {
  createTarif,
  setTarifAktif,
  generateTagihan,
  cancelTagihan,
  bayarSekarang,
  markPaidManual,
} from "@/actions/pembayaran/spp";

const str = (fd: FormData, key: string): string => String(fd.get(key) ?? "").trim();
const opt = (fd: FormData, key: string): string | undefined => {
  const value = str(fd, key);
  return value === "" ? undefined : value;
};

/* Admin — akun */
export async function createAkunForm(fd: FormData) {
  return createAkun({
    name: str(fd, "name"),
    email: str(fd, "email"),
    password: str(fd, "password"),
    role: str(fd, "role") as "guru" | "santri" | "wali_santri",
    nip: opt(fd, "nip"),
    nis: opt(fd, "nis"),
    noTelp: opt(fd, "noTelp"),
    kelasId: opt(fd, "kelasId"),
  });
}

export async function updateAkunForm(fd: FormData) {
  return updateAkun({
    userId: str(fd, "userId"),
    name: str(fd, "name"),
    noTelp: opt(fd, "noTelp"),
    nip: opt(fd, "nip"),
    nis: opt(fd, "nis"),
    kelasId: opt(fd, "kelasId"),
    alamat: opt(fd, "alamat"),
  });
}

export async function resetPasswordForm(fd: FormData) {
  return resetPassword(str(fd, "userId"), str(fd, "password"));
}

export async function toggleAkunForm(fd: FormData) {
  return setAkunAktif(str(fd, "userId"), str(fd, "isActive") === "true");
}

export async function deleteAkunForm(fd: FormData) {
  return deleteAkun(str(fd, "userId"));
}

/* Admin — akademik */
export async function createTahunAjaranForm(fd: FormData) {
  return createTahunAjaran({
    label: str(fd, "label"),
    tanggalMulai: str(fd, "tanggalMulai"),
    tanggalSelesai: str(fd, "tanggalSelesai"),
  });
}

export async function activateTahunAjaranForm(fd: FormData) {
  return activateTahunAjaran(str(fd, "id"));
}

export async function createKelasForm(fd: FormData) {
  return createKelas({
    nama: str(fd, "nama"),
    tingkat: opt(fd, "tingkat"),
    waliKelasId: opt(fd, "waliKelasId"),
    tahunAjaranId: str(fd, "tahunAjaranId"),
  });
}

export async function updateKelasForm(fd: FormData) {
  return updateKelas(str(fd, "id"), {
    nama: str(fd, "nama"),
    tingkat: opt(fd, "tingkat"),
    waliKelasId: opt(fd, "waliKelasId"),
    tahunAjaranId: str(fd, "tahunAjaranId"),
  });
}

export async function deleteKelasForm(fd: FormData) {
  return deleteKelas(str(fd, "id"));
}

export async function createMapelForm(fd: FormData) {
  return createMapel({
    nama: str(fd, "nama"),
    kategori: str(fd, "kategori") === "pesantren" ? "pesantren" : "umum",
    deskripsi: opt(fd, "deskripsi"),
  });
}

export async function updateMapelForm(fd: FormData) {
  return updateMapel(str(fd, "id"), {
    nama: str(fd, "nama"),
    kategori: str(fd, "kategori") === "pesantren" ? "pesantren" : "umum",
    deskripsi: opt(fd, "deskripsi"),
  });
}

export async function deleteMapelForm(fd: FormData) {
  return deleteMapel(str(fd, "id"));
}

export async function createPengajaranForm(fd: FormData) {
  return createPengajaran({
    guruId: str(fd, "guruId"),
    kelasId: str(fd, "kelasId"),
    mapelId: str(fd, "mapelId"),
    tahunAjaranId: str(fd, "tahunAjaranId"),
  });
}

export async function deletePengajaranForm(fd: FormData) {
  return deletePengajaran(str(fd, "id"));
}

export async function linkWaliAnakForm(fd: FormData) {
  return linkWaliAnak(str(fd, "waliUserId"), str(fd, "santriId"));
}

export async function unlinkWaliAnakForm(fd: FormData) {
  return unlinkWaliAnak(str(fd, "id"));
}

export async function createJenisNilaiForm(fd: FormData) {
  return createJenisNilai({
    nama: str(fd, "nama"),
    bobot: str(fd, "bobot"),
  });
}

export async function deleteJenisNilaiForm(fd: FormData) {
  return deleteJenisNilai(str(fd, "id"));
}

/* Admin — pengumuman & pengaturan */
export async function createPengumumanForm(fd: FormData) {
  return createPengumuman({
    judul: str(fd, "judul"),
    isi: str(fd, "isi"),
    targetRole: (str(fd, "targetRole") || "semua") as
      | "semua"
      | "admin"
      | "guru"
      | "santri"
      | "wali_santri",
    targetKelasId: opt(fd, "targetKelasId"),
  });
}

export async function deletePengumumanForm(fd: FormData) {
  return deletePengumuman(str(fd, "id"));
}

export async function updatePengaturanForm(fd: FormData) {
  return updatePengaturan({
    namaPesantren: str(fd, "namaPesantren"),
    alamat: opt(fd, "alamat"),
    deskripsi: opt(fd, "deskripsi"),
    logoUrl: opt(fd, "logoUrl"),
    semesterAktif: str(fd, "semesterAktif") === "genap" ? "genap" : "ganjil",
  });
}

/* Guru — nilai */
export async function simpanNilaiMassalForm(fd: FormData) {
  const entries: { santriId: string; jenisNilaiId: string; nilai: string }[] = [];
  for (const [key, value] of fd.entries()) {
    if (!key.startsWith("nilai__")) continue;
    const [, santriId, jenisNilaiId] = key.split("__");
    if (santriId && jenisNilaiId && String(value).trim() !== "") {
      entries.push({ santriId, jenisNilaiId, nilai: String(value) });
    }
  }
  return simpanNilaiMassal({
    kelasId: str(fd, "kelasId"),
    mapelId: str(fd, "mapelId"),
    tahunAjaranId: str(fd, "tahunAjaranId"),
    semester: str(fd, "semester") === "genap" ? "genap" : "ganjil",
    entries,
  });
}

export async function deleteNilaiForm(fd: FormData) {
  return deleteNilai(str(fd, "id"));
}

/* Guru — kehadiran */
export async function simpanKehadiranForm(fd: FormData) {
  const entries: { santriId: string; status: "hadir" | "izin" | "sakit" | "alpa" }[] = [];
  for (const [key, value] of fd.entries()) {
    if (!key.startsWith("status__")) continue;
    const santriId = key.replace("status__", "");
    const status = String(value) as "hadir" | "izin" | "sakit" | "alpa";
    if (["hadir", "izin", "sakit", "alpa"].includes(status)) {
      entries.push({ santriId, status });
    }
  }
  return simpanKehadiran({
    kelasId: str(fd, "kelasId"),
    mapelId: str(fd, "mapelId"),
    tahunAjaranId: str(fd, "tahunAjaranId"),
    tanggal: str(fd, "tanggal"),
    entries,
  });
}

/* Guru — tugas */
export async function createTugasForm(fd: FormData) {
  return createTugas({
    judul: str(fd, "judul"),
    deskripsi: str(fd, "deskripsi"),
    kelasId: str(fd, "kelasId"),
    mapelId: str(fd, "mapelId"),
    tahunAjaranId: str(fd, "tahunAjaranId"),
    deadline: str(fd, "deadline"),
  });
}

export async function gradeSubmissionForm(fd: FormData) {
  return gradeSubmission({
    submissionId: str(fd, "submissionId"),
    nilai: str(fd, "nilai"),
    feedback: opt(fd, "feedback"),
  });
}

export async function deleteTugasForm(fd: FormData) {
  return deleteTugas(str(fd, "id"));
}

/* Guru/Admin — rapor */
export async function generateRaporForm(fd: FormData) {
  return generateRapor({
    santriId: str(fd, "santriId"),
    kelasId: str(fd, "kelasId"),
    tahunAjaranId: str(fd, "tahunAjaranId"),
    semester: str(fd, "semester") === "genap" ? "genap" : "ganjil",
    catatanWaliKelas: opt(fd, "catatanWaliKelas"),
  });
}

/* Santri — submission */
export async function submitLinkForm(fd: FormData) {
  return submitLink({
    tugasId: str(fd, "tugasId"),
    url: opt(fd, "url"),
  });
}

export async function submitFileForm(fd: FormData) {
  const file = fd.get("file");
  return submitFile(str(fd, "tugasId"), file instanceof File ? file : new File([], ""));
}

export async function deleteSubmissionForm(fd: FormData) {
  return deleteSubmission(str(fd, "id"));
}

/* Pembayaran */
export async function createTarifForm(fd: FormData) {
  return createTarif({
    nama: str(fd, "nama"),
    nominal: str(fd, "nominal"),
    kelasId: opt(fd, "kelasId"),
    tahunAjaranId: opt(fd, "tahunAjaranId"),
    berlakuMulai: str(fd, "berlakuMulai"),
    berlakuSampai: opt(fd, "berlakuSampai"),
  });
}

export async function setTarifAktifForm(fd: FormData) {
  return setTarifAktif(str(fd, "id"), str(fd, "isActive") === "true");
}

export async function generateTagihanForm(fd: FormData) {
  const scope = str(fd, "scope") as "santri" | "kelas" | "semua";
  return generateTagihan({
    tahunAjaranId: str(fd, "tahunAjaranId"),
    periodeBulan: str(fd, "periodeBulan"),
    periodeTahun: str(fd, "periodeTahun"),
    scope,
    santriId: scope === "santri" ? opt(fd, "santriId") : undefined,
    kelasId: scope === "kelas" ? opt(fd, "kelasId") : undefined,
    jatuhTempo: opt(fd, "jatuhTempo"),
  });
}

export async function cancelTagihanForm(fd: FormData) {
  return cancelTagihan(str(fd, "id"));
}

export async function markPaidManualForm(fd: FormData) {
  return markPaidManual(str(fd, "id"), str(fd, "catatan"));
}

export async function bayarSekarangForm(fd: FormData) {
  return bayarSekarang(str(fd, "id"));
}
