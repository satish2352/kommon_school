import { useState, useEffect, useRef, useMemo } from 'react';
import { adminEnrollmentService } from '../../services/adminEnrollmentService';
import { courseService } from '../../services/courseService';
import { internalPlansService } from '../../services/internalPlansService';
import { calculate as calculateFee } from '../../services/feeCalculationService';
import toast from 'react-hot-toast';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Select,
  Table,
  Th,
  Td,
  Tr,
} from '../../components/admin';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const DURATION_LABELS = {
  '1_MONTH':   '1 Month',
  '3_MONTHS':  '3 Months',
  '6_MONTHS':  '6 Months',
  '12_MONTHS': '12 Months',
};

const inr = (amount) =>
  `Rs.${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Export results array to a CSV and trigger a browser download. */
function exportResultsCsv(rows) {
  const header = 'Row,Status,Enrollment Code,Webhook,Error';
  const lines = rows.map((r) => {
    const rowIdx   = r.rowIndex ?? '';
    const status   = r.status ?? '';
    const code     = r.enrollmentCode ?? '';
    const webhook  = r.webhookOk === true ? 'OK' : r.webhookOk === false ? 'FAIL' : '';
    const error    = (r.error ?? r.message ?? '').replace(/"/g, '""');
    return `${rowIdx},"${status}","${code}","${webhook}","${error}"`;
  });
  const csv = [header, ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `bulk-enrollment-results-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ─── Row status badge ────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  return (
    <Badge variant={status === 'success' ? 'success' : 'danger'}>
      {status === 'success' ? 'Success' : 'Failed'}
    </Badge>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function AdminBulkEnrollment() {
  const fileRef  = useRef(null);
  const dropRef  = useRef(null);

  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [results, setResults]   = useState(null);
  const [filter, setFilter]     = useState('all');
  const [downloadingTpl, setDownloadingTpl] = useState(false);

  /* ── Plan selection (applies to all rows) ── */
  const [courseList, setCourseList]                 = useState([]);
  const [coursesLoading, setCoursesLoading]         = useState(true);
  const [selectedCourseId, setSelectedCourseId]     = useState('');
  const [plansForCourse, setPlansForCourse]         = useState([]);
  const [plansLoading, setPlansLoading]             = useState(false);
  const [selectedPlanId, setSelectedPlanId]         = useState('');
  const [feeBreakdown, setFeeBreakdown]             = useState(null);
  const [feeCalculating, setFeeCalculating]         = useState(false);

  /* ── Load courses ── */
  useEffect(() => {
    courseService.list({ limit: 100, status: 'ACTIVE' })
      .then(({ courses }) => setCourseList(courses ?? []))
      .catch(() => setCourseList([]))
      .finally(() => setCoursesLoading(false));
  }, []);

  /* ── Load plans for course ── */
  useEffect(() => {
    if (!selectedCourseId) {
      setPlansForCourse([]);
      setSelectedPlanId('');
      setFeeBreakdown(null);
      return;
    }
    setPlansLoading(true);
    internalPlansService.listByCourse(selectedCourseId)
      .then((rows) => setPlansForCourse(rows ?? []))
      .catch(() => setPlansForCourse([]))
      .finally(() => setPlansLoading(false));
  }, [selectedCourseId]);

  const selectedPlan = useMemo(
    () => plansForCourse.find((p) => String(p.id) === String(selectedPlanId)) ?? null,
    [plansForCourse, selectedPlanId],
  );
  const selectedCourse = useMemo(
    () => courseList.find((c) => String(c.id) === String(selectedCourseId)) ?? null,
    [courseList, selectedCourseId],
  );
  const coursePrice = selectedCourse?.courseFee != null ? Number(selectedCourse.courseFee) : null;
  const planReady   = Boolean(selectedCourseId && selectedPlanId);

  /* ── Recalculate fee ── */
  useEffect(() => {
    if (!selectedPlanId || coursePrice == null) {
      setFeeBreakdown(null);
      return;
    }
    let cancelled = false;
    setFeeCalculating(true);
    calculateFee({
      internalPlanId: Number(selectedPlanId),
      basePrice:      coursePrice,
    })
      .then((res) => { if (!cancelled) setFeeBreakdown(res); })
      .catch(() => { if (!cancelled) setFeeBreakdown(null); })
      .finally(() => { if (!cancelled) setFeeCalculating(false); });
    return () => { cancelled = true; };
  }, [selectedPlanId, coursePrice]);

  /* ── File selection ─────────────────────────────────────────────────────── */
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.type !== 'text/csv' && !f.name.endsWith('.csv')) {
      setUploadError('Only .csv files are accepted.');
      e.target.value = '';
      return;
    }

    setFile(f);
    setUploadError('');
    setResults(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.type === 'text/csv' || f.name.endsWith('.csv'))) {
      setFile(f);
      setUploadError('');
      setResults(null);
    } else {
      toast.error('Only .csv files are accepted.');
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  /* ── Template download ─────────────────────────────────────────────────── */
  const handleDownloadTemplate = async () => {
    setDownloadingTpl(true);
    try {
      await adminEnrollmentService.downloadCsvTemplate();
    } catch (err) {
      toast.error(err.message ?? 'Failed to download template.');
    } finally {
      setDownloadingTpl(false);
    }
  };

  /* ── Upload ─────────────────────────────────────────────────────────────── */
  const handleUpload = async () => {
    if (!file) return;
    if (!planReady) {
      setUploadError('Pick a Course and an Internal Plan before uploading — the plan applies to every row in the CSV.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File exceeds the 2 MB limit. Please reduce the file size.');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const data = await adminEnrollmentService.uploadCsv(file, {
        candidateType:      'INTERNAL',
        courseId:           Number(selectedCourseId),
        internalPlanId:     Number(selectedPlanId),
        internalPlanRefId:  selectedPlan?.refId,
        feeBreakdown:       feeBreakdown
          ? {
              basePrice:   feeBreakdown.basePrice,
              discount:    feeBreakdown.discount,
              finalAmount: feeBreakdown.finalAmount,
            }
          : undefined,
      });
      setResults(data);
    } catch (err) {
      setUploadError(err.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  /* ── Filtered rows ──────────────────────────────────────────────────────── */
  const allRows   = results?.rows ?? [];
  const filteredRows =
    filter === 'success' ? allRows.filter((r) => r.status === 'success')  :
    filter === 'failed'  ? allRows.filter((r) => r.status === 'failed')   :
    allRows;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Enrollment Upload"
        subtitle="Upload a CSV to create multiple enrollments — all rows use the plan you pick below."
      />

      {/* ── Step 1: Pick the plan that applies to every row ── */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
              planReady
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-emerald-600 text-white'
            }`}>
              {planReady ? '✓' : '1'}
            </span>
            <h2 className="text-sm font-semibold text-slate-800">
              Plan for all rows
            </h2>
            <Badge variant="info">Required</Badge>
          </div>

          <p className="text-xs text-slate-500 -mt-2 ml-8">
            Every student in the CSV will be enrolled into this course and internal plan.
          </p>

          <div className="grid lg:grid-cols-2 gap-4 ml-8">
            {/* Course */}
            <Select
              label="Course"
              required
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedPlanId('');
              }}
              disabled={coursesLoading}
            >
              <option value="">{coursesLoading ? 'Loading...' : '— Select a course —'}</option>
              {/* Each course is a (Name × Duration) offering; show both so
                  the same name doesn't appear N times as visual duplicates. */}
              {[...courseList]
                .sort((a, b) => {
                  const n = (a.nameOfCourseAsGroup ?? '').localeCompare(b.nameOfCourseAsGroup ?? '');
                  return n !== 0 ? n : (a.duration?.sortOrder ?? 0) - (b.duration?.sortOrder ?? 0);
                })
                .map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nameOfCourseAsGroup}{c.duration?.label ? ` — ${c.duration.label}` : ''}
                  </option>
                ))}
            </Select>

            {/* Internal Plan */}
            <Select
              label="Internal Plan"
              required
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              disabled={!selectedCourseId || plansLoading}
            >
              <option value="">
                {!selectedCourseId
                  ? '— Pick a course first —'
                  : plansLoading
                  ? 'Loading...'
                  : plansForCourse.length === 0
                  ? 'No plans for this course'
                  : '— Select a plan —'}
              </option>
              {plansForCourse.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name} ({DURATION_LABELS[p.duration] ?? p.duration}){coursePrice != null ? ` — ${inr(coursePrice)}` : ''}
                </option>
              ))}
            </Select>
          </div>

          {/* Fee preview strip */}
          {selectedPlan && feeBreakdown && (
            <div className="ml-8 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Per row</div>
                    <div className="text-slate-700 mt-0.5">{inr(feeBreakdown.basePrice)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">Final / row</div>
                    <div className="text-lg font-bold text-emerald-700 mt-0.5">{inr(feeBreakdown.finalAmount)}</div>
                  </div>
                </div>
                {feeCalculating && (
                  <svg className="w-4 h-4 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="4" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Step 2: CSV template ── */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">2</span>
          <h2 className="text-sm font-semibold text-slate-800">Download CSV Template</h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 ml-8">
          <div>
            <p className="text-xs text-slate-500 mb-2">
              Required columns (in this exact order):
            </p>
            <code className="text-[11px] text-slate-600 bg-slate-100 px-2 py-1 rounded block mb-3 overflow-x-auto whitespace-nowrap">
              name, email, phone, role, education, readiness, source, promoCode, notes
            </code>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
              <li>Maximum 1 000 rows per upload</li>
              <li>Maximum file size: 2 MB</li>
              <li>Header row is required</li>
              <li>Course + Internal Plan picked above apply to every row</li>
            </ul>
          </div>
          <div className="shrink-0">
            <Button
              variant="secondary"
              loading={downloadingTpl}
              onClick={handleDownloadTemplate}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Step 3: Upload ── */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
            file ? 'bg-emerald-100 text-emerald-700' : planReady ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
          }`}>
            {file ? '✓' : '3'}
          </span>
          <h2 className="text-sm font-semibold text-slate-800">Upload CSV File</h2>
          {!planReady && (
            <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
              Pick a plan first
            </span>
          )}
        </div>

        {/* Drag-and-drop zone */}
        <div
          ref={dropRef}
          onDrop={planReady ? handleDrop : (e) => e.preventDefault()}
          onDragOver={planReady ? handleDragOver : (e) => e.preventDefault()}
          onDragLeave={handleDragLeave}
          onClick={() => planReady && fileRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl py-10 transition-colors duration-200 ${
            !planReady
              ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
              : dragging
              ? 'border-emerald-400 bg-emerald-50 cursor-pointer'
              : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/40 cursor-pointer'
          }`}
        >
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {file ? (
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatBytes(file.size)}</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-slate-600 font-medium">Drag and drop a CSV file here</p>
              <p className="text-xs text-slate-400 mt-1">or click to browse</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={handleFileChange}
            disabled={!planReady}
          />
        </div>

        {/* File info strip */}
        {file && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 text-xs text-slate-600">
              <span className="font-medium">{file.name}</span>
              <span className="ml-2 text-slate-400">{formatBytes(file.size)}</span>
            </div>
            <button
              type="button"
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setResults(null);
                setUploadError('');
                if (fileRef.current) fileRef.current.value = '';
              }}
            >
              Remove
            </button>
          </div>
        )}

        {uploadError && (
          <div className="mt-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {uploadError}
          </div>
        )}

        {uploading && (
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-600">
            <svg className="w-4 h-4 animate-spin shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="4" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
            </svg>
            Processing... please do not close this tab.
          </div>
        )}

        <div className="mt-4">
          <Button
            variant="primary"
            loading={uploading}
            disabled={!file || uploading || !planReady}
            onClick={handleUpload}
          >
            Process File
          </Button>
          {!planReady && file && (
            <p className="text-xs text-amber-700 mt-2">Select a Course and Internal Plan above before processing.</p>
          )}
        </div>
      </Card>

      {/* ── Results card ── */}
      {results && (
        <Card variant="flush">
          <div className={`px-5 py-4 border-b border-slate-200 ${results.failed === 0 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <p className={`text-sm font-semibold ${results.failed === 0 ? 'text-emerald-800' : 'text-amber-800'}`}>
              {results.success} of {results.total} enrollments processed successfully
              {results.failed > 0 && ` — ${results.failed} failed`}
            </p>
          </div>

          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-1">
            {[
              { key: 'all',     label: `All (${allRows.length})` },
              { key: 'success', label: `Success (${results.success})` },
              { key: 'failed',  label: `Failed (${results.failed})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                  filter === tab.key
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <div className="ml-auto">
              <Button variant="secondary" size="sm" onClick={() => exportResultsCsv(allRows)}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Results CSV
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Row #', 'Status', 'Enrollment Code', 'Webhook', 'Error / Message'].map((h) => (
                    <Th key={h}>{h}</Th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                      No rows to display.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => (
                    <Tr key={idx} striped={idx % 2 === 1}>
                      <Td className="font-mono text-xs text-slate-500">{row.rowIndex ?? idx + 1}</Td>
                      <Td>
                        <StatusBadge status={row.status} />
                      </Td>
                      <Td className="font-mono text-xs text-slate-700">
                        {row.enrollmentCode ?? <span className="text-slate-300">—</span>}
                      </Td>
                      <Td>
                        {row.webhookOk === true && (
                          <span className="text-emerald-600 font-bold text-sm">&#10003;</span>
                        )}
                        {row.webhookOk === false && (
                          <span className="text-red-500 font-bold text-sm">&#10007;</span>
                        )}
                        {row.webhookOk == null && (
                          <span className="text-slate-300">—</span>
                        )}
                      </Td>
                      <Td className="text-xs text-slate-500 max-w-xs truncate">
                        {row.error ?? row.message ?? <span className="text-slate-300">—</span>}
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {filteredRows.length} of {allRows.length} rows
          </div>
        </Card>
      )}
    </div>
  );
}
