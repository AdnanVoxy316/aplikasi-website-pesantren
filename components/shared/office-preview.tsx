"use client";

import { useEffect, useRef, useState } from "react";

type ResourceState<T> = {
  status: "loading" | "ready" | "error";
  value: T | null;
  error: string | null;
};

type OfficeKind = "word" | "powerpoint" | "spreadsheet";

function useArrayBuffer(src: string): ResourceState<ArrayBuffer> {
  const [state, setState] = useState<ResourceState<ArrayBuffer>>({
    status: "loading",
    value: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch(src, { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`File tidak dapat dimuat (${response.status}).`);
        return response.arrayBuffer();
      })
      .then((value) => setState({ status: "ready", value, error: null }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({
          status: "error",
          value: null,
          error: error instanceof Error ? error.message : "File tidak dapat dimuat.",
        });
      });

    return () => controller.abort();
  }, [src]);

  return state;
}

function useText(src: string): ResourceState<string> {
  const [state, setState] = useState<ResourceState<string>>({
    status: "loading",
    value: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch(src, { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`File tidak dapat dimuat (${response.status}).`);
        return response.text();
      })
      .then((value) => setState({ status: "ready", value, error: null }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({
          status: "error",
          value: null,
          error: error instanceof Error ? error.message : "File tidak dapat dimuat.",
        });
      });

    return () => controller.abort();
  }, [src]);

  return state;
}

function PreviewStatus({ state }: { state: ResourceState<unknown> }) {
  if (state.status === "loading") {
    return <div className="preview-status">Menyiapkan preview...</div>;
  }
  if (state.status === "error") {
    return (
      <div className="preview-status error" role="alert">
        {state.error ?? "Preview tidak dapat ditampilkan."}
      </div>
    );
  }
  return null;
}

export function TextPreview({ src }: { src: string }) {
  const state = useText(src);
  return (
    <div className="preview-text-wrap">
      <PreviewStatus state={state} />
      {state.status === "ready" ? <pre className="preview-text">{state.value}</pre> : null}
    </div>
  );
}

function WordPreview({ src }: { src: string }) {
  const state = useArrayBuffer(src);
  const hostRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status !== "ready" || !state.value || !hostRef.current) return;
    let active = true;
    const host = hostRef.current;
    host.replaceChildren();

    import("docx-preview")
      .then(({ renderAsync }) => {
        if (!active || !state.value) return;
        return renderAsync(state.value, host, host, {
          className: "preview-docx",
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          renderHeaders: true,
          renderFooters: true,
        });
      })
      .catch((error: unknown) => {
        if (active) {
          setRenderError(error instanceof Error ? error.message : "Dokumen Word tidak dapat dirender.");
        }
      });

    return () => {
      active = false;
      host.replaceChildren();
    };
  }, [state.status, state.value]);

  const renderState = renderError
    ? { status: "error" as const, value: null, error: renderError }
    : state;

  return (
    <div className="preview-office preview-word">
      <PreviewStatus state={renderState} />
      <div ref={hostRef} className="preview-document-host" />
    </div>
  );
}

function PowerPointPreview({ src }: { src: string }) {
  const state = useArrayBuffer(src);
  const hostRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status !== "ready" || !state.value || !hostRef.current) return;
    let active = true;
    let previewer: { preview: (data: ArrayBuffer) => Promise<unknown>; destroy: () => void } | null = null;
    const host = hostRef.current;
    host.replaceChildren();

    import("pptx-preview")
      .then(({ init }) => {
        if (!active || !state.value) return;
        const nextPreviewer = init(host, { width: 960, height: 540, mode: "list" });
        previewer = nextPreviewer;
        return nextPreviewer.preview(state.value);
      })
      .catch((error: unknown) => {
        if (active) {
          setRenderError(error instanceof Error ? error.message : "PowerPoint tidak dapat dirender.");
        }
      });

    return () => {
      active = false;
      previewer?.destroy();
      host.replaceChildren();
    };
  }, [state.status, state.value]);

  const renderState = renderError
    ? { status: "error" as const, value: null, error: renderError }
    : state;

  return (
    <div className="preview-office preview-powerpoint">
      <PreviewStatus state={renderState} />
      <div ref={hostRef} className="preview-pptx-host" />
    </div>
  );
}

type SpreadsheetSheet = {
  name: string;
  rows: string[][];
  columnCount: number;
  truncated: boolean;
};

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleString("id-ID");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function SpreadsheetPreview({ src }: { src: string }) {
  const state = useArrayBuffer(src);
  const [sheets, setSheets] = useState<SpreadsheetSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status !== "ready" || !state.value) return;
    let active = true;

    import("xlsx")
      .then((XLSX) => {
        if (!active || !state.value) return;
        setParseError(null);
        const workbook = XLSX.read(state.value, { type: "array", cellDates: true });
        const parsed = workbook.SheetNames.map((name) => {
          const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], {
            header: 1,
            raw: false,
            defval: "",
            blankrows: false,
          });
          const limitedRows = rows.slice(0, 200).map((row) => row.slice(0, 40).map(cellText));
          const columnCount = Math.max(1, ...limitedRows.map((row) => row.length));
          return {
            name,
            rows: limitedRows,
            columnCount,
            truncated: rows.length > 200 || rows.some((row) => row.length > 40),
          };
        });
        setSheets(parsed);
        setSelectedSheet(0);
      })
      .catch((error: unknown) => {
        if (active) {
          setParseError(error instanceof Error ? error.message : "Spreadsheet tidak dapat dirender.");
        }
      });

    return () => {
      active = false;
    };
  }, [state.status, state.value]);

  const renderState = parseError
    ? { status: "error" as const, value: null, error: parseError }
    : state;
  const sheet = sheets[selectedSheet];

  return (
    <div className="preview-office preview-spreadsheet">
      <PreviewStatus state={renderState} />
      {sheets.length > 0 ? (
        <>
          <div className="spreadsheet-tabs" role="tablist" aria-label="Lembar spreadsheet">
            {sheets.map((item, index) => (
              <button
                key={item.name}
                type="button"
                role="tab"
                aria-selected={selectedSheet === index}
                className={selectedSheet === index ? "active" : ""}
                onClick={() => setSelectedSheet(index)}
              >
                {item.name}
              </button>
            ))}
          </div>
          {sheet ? (
            <div className="spreadsheet-table-wrap">
              <table className="spreadsheet-table">
                <thead>
                  <tr>
                    <th aria-label="Nomor baris">#</th>
                    {Array.from({ length: sheet.columnCount }, (_, index) => (
                      <th key={index}>{columnLabel(index)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheet.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <th scope="row">{rowIndex + 1}</th>
                      {Array.from({ length: sheet.columnCount }, (_, columnIndex) => (
                        <td key={columnIndex}>{row[columnIndex] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {sheet.truncated ? (
                <p className="preview-note">Preview dibatasi sampai 200 baris dan 40 kolom. Unduh file untuk melihat data lengkap.</p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function columnLabel(index: number): string {
  let value = index + 1;
  let label = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label;
}

export function OfficePreview({ src, kind }: { src: string; kind: OfficeKind }) {
  if (kind === "word") return <WordPreview src={src} />;
  if (kind === "powerpoint") return <PowerPointPreview src={src} />;
  return <SpreadsheetPreview src={src} />;
}
