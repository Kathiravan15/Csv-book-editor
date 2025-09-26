import React, { useState, useMemo } from "react";
import {
  parseCSVFile,
  generateSampleData,
  downloadCSV,
} from "./utils/csvUtils";
import TableEditor from "./components/TableEditor";
import "./App.css";

const columns = [
  { Header: "Title", accessor: "Title" },
  { Header: "Author", accessor: "Author" },
  { Header: "Genre", accessor: "Genre" },
  { Header: "Published Year", accessor: "PublishedYear" },
  { Header: "ISBN", accessor: "ISBN" },
];

export default function App() {
  const [originalData, setOriginalData] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progressRows, setProgressRows] = useState(0);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [modifiedIds, setModifiedIds] = useState(new Set());

  // CSV upload
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgressRows(0);

    try {
      const parsed = await parseCSVFile(file, (rowsProcessed) =>
        setProgressRows(rowsProcessed)
      );
      setOriginalData(parsed);
      setData(parsed.map((r) => ({ ...r })));
      setModifiedIds(new Set());
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      alert("Failed to parse CSV: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load sample data
  const loadSample = (count = 10000) => {
    const sample = generateSampleData(count);
    setOriginalData(sample);
    setData(sample.map((r) => ({ ...r })));
    setModifiedIds(new Set());
    setCurrentPage(1);
  };

  // Cell edit
  const handleCellChange = (rowId, key, value) => {
    setData((prev) => {
      const next = prev.map((r) =>
        r.id === rowId ? { ...r, [key]: value } : r
      );

      setModifiedIds((prevSet) => {
        const newSet = new Set(prevSet);
        const orig = originalData.find((o) => o.id === rowId);
        const updated = next.find((n) => n.id === rowId);

        const changed =
          orig &&
          (orig.Title !== updated.Title ||
            orig.Author !== updated.Author ||
            orig.Genre !== updated.Genre ||
            orig.PublishedYear !== updated.PublishedYear ||
            orig.ISBN !== updated.ISBN);

        changed ? newSet.add(rowId) : newSet.delete(rowId);
        return newSet;
      });

      return next;
    });
  };

  // Reset edits
  const handleReset = () => {
    setData(originalData.map((r) => ({ ...r })));
    setModifiedIds(new Set());
  };

  // Sort
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        if (prev.direction === "desc") return { key: null, direction: null };
      }
      return { key, direction: "asc" };
    });
  };

  // Filter + sort
  const processed = useMemo(() => {
    let rows = data;

    if (globalFilter.trim()) {
      const f = globalFilter.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.Title.toLowerCase().includes(f) ||
          r.Author.toLowerCase().includes(f) ||
          r.Genre.toLowerCase().includes(f) ||
          r.PublishedYear.toLowerCase().includes(f) ||
          r.ISBN.toLowerCase().includes(f)
      );
    }

    if (sortConfig.key) {
      const key = sortConfig.key;
      const dir = sortConfig.direction === "asc" ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        const av = a[key] || "";
        const bv = b[key] || "";
        return key === "PublishedYear"
          ? (parseInt(av) - parseInt(bv)) * dir
          : String(av).localeCompare(String(bv)) * dir;
      });
    }

    return rows;
  }, [data, globalFilter, sortConfig]);

  // Pagination
  const totalRows = processed.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const pagedRows = processed.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="app-container">
      <header>
        <h1>CSV Book Editor</h1>

        <div className="top-controls">
          <label className="file-input">
            Upload CSV:
            <input type="file" accept=".csv,text/csv" onChange={handleFile} />
          </label>
          <button onClick={() => loadSample(10000)}>Load Sample Data</button>
          <button onClick={handleReset} disabled={modifiedIds.size === 0}>
            Reset All Edits
          </button>
          <button
            onClick={() => downloadCSV(data, "books-edited.csv")}
            disabled={data.length === 0}
          >
            Download CSV
          </button>
        </div>

        <div className="status-row">
          <div>
            Rows loaded: <strong>{originalData.length}</strong>
          </div>
          <div>
            Filtered rows: <strong>{totalRows}</strong>
          </div>
          <div>
            Page:{" "}
            <strong>
              {currentPage}/{pageCount}
            </strong>
          </div>
          <div>
            Modified rows: <strong>{modifiedIds.size}</strong>
          </div>
        </div>

        <div className="filters-row">
          <input
            placeholder="Global filter"
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setCurrentPage(1);
            }}
          />
          <label>
            Page size:
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </label>
        </div>

        {loading && (
          <div className="loading">
            Parsing CSV... processed <strong>{progressRows}</strong> rows
          </div>
        )}
      </header>

      <main>
        <TableEditor
          columns={columns}
          rows={pagedRows}
          onCellChange={handleCellChange}
          onSort={handleSort}
          sortConfig={sortConfig}
          modifiedIds={modifiedIds}
        />
      </main>

      <footer className="pager">
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
          First
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <span>
          Page {currentPage} / {pageCount}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
          disabled={currentPage === pageCount}
        >
          Next
        </button>
        <button
          onClick={() => setCurrentPage(pageCount)}
          disabled={currentPage === pageCount}
        >
          Last
        </button>
      </footer>
    </div>
  );
}
