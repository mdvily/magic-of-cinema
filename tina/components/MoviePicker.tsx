/**
 * Tina custom field: MoviePicker
 *
 * Search-as-you-type TMDb picker. Renders the dropdown via a React portal
 * directly into <body> with a solid white surface and very high z-index so
 * it can't be clipped or visually merged with Tina's surrounding form UI.
 *
 * Used in three contexts (controlled by `field.options.shape`):
 *   - "movieObject": fills movie.title/year/director/runtime/poster/backdrop/tmdbId/genres
 *   - "tierCard": fills cards[i].title + posterUrl
 *   - "top10Item": fills items[i].title + year + posterUrl
 */
import * as React from "react";
import { createPortal } from "react-dom";
import { wrapFieldsWithMeta } from "tinacms";

type SearchResult = {
  id: number;
  title: string;
  year?: number;
  posterUrl?: string;
  overview?: string;
};

type DetailResponse = {
  tmdbId?: number;
  title?: string;
  year?: number;
  runtime?: number;
  director?: string;
  posterUrl?: string;
  backdropUrl?: string;
  genres?: string[];
};

function MoviePickerInner(props: any): JSX.Element {
  const { input, field, form } = props;
  const shape: "movieObject" | "tierCard" | "top10Item" =
    field?.options?.shape ?? "movieObject";

  const [query, setQuery] = React.useState<string>(input.value || "");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [popupPos, setPopupPos] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const popupRef = React.useRef<HTMLDivElement | null>(null);

  const updatePos = React.useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPopupPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 380),
    });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    updatePos();
    const onScroll = () => updatePos();
    const onResize = () => updatePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePos]);

  // Close on outside click (since portal is outside the input's React tree,
  // a normal blur handler on the input would close while we're clicking
  // inside the portal — handle this explicitly).
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (
        t &&
        !inputRef.current?.contains(t) &&
        !popupRef.current?.contains(t)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Debounced search
  React.useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/tmdb-search?q=${encodeURIComponent(query)}`,
        );
        const data = await r.json();
        if (!cancelled) {
          if (data.error) {
            setError(data.error);
            setResults([]);
          } else {
            setResults(data.results ?? []);
            setOpen(true);
          }
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  function siblingName(siblingKey: string): string {
    const segs = field.name.split(".");
    segs[segs.length - 1] = siblingKey;
    return segs.join(".");
  }

  async function pick(r: SearchResult) {
    setOpen(false);
    setQuery(r.title);
    input.onChange(r.title);

    if (shape === "tierCard") {
      if (r.posterUrl) form.change(siblingName("posterUrl"), r.posterUrl);
      return;
    }
    if (shape === "top10Item") {
      if (r.year) form.change(siblingName("year"), r.year);
      if (r.posterUrl) form.change(siblingName("posterUrl"), r.posterUrl);
      return;
    }

    try {
      const dr = await fetch(`/api/tmdb-details?id=${r.id}`);
      const detail = (await dr.json()) as DetailResponse;
      if (detail.year) form.change(siblingName("year"), detail.year);
      if (detail.director) form.change(siblingName("director"), detail.director);
      if (detail.runtime) form.change(siblingName("runtime"), detail.runtime);
      if (detail.posterUrl) form.change(siblingName("posterUrl"), detail.posterUrl);
      if (detail.backdropUrl) form.change(siblingName("backdropUrl"), detail.backdropUrl);
      if (detail.tmdbId) form.change(siblingName("tmdbId"), detail.tmdbId);
      if (detail.genres && detail.genres.length > 0)
        form.change(siblingName("genres"), detail.genres);
    } catch {
      /* details fetch failures non-fatal */
    }
  }

  // The popup, rendered via portal into <body>
  const popupNode =
    open && results.length > 0 && popupPos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popupRef}
            style={{
              position: "fixed",
              top: popupPos.top,
              left: popupPos.left,
              width: popupPos.width,
              zIndex: 2147483647, // max int — wins any stacking
              backgroundColor: "#ffffff",
              color: "#111111",
              border: "1px solid #d4d4d4",
              borderRadius: 8,
              boxShadow:
                "0 16px 48px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.18)",
              maxHeight: 380,
              overflowY: "auto",
              fontFamily:
                "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
              fontSize: 14,
              lineHeight: 1.4,
            }}
            // Defensive: stop pointer events from leaking weird behaviors
            onMouseDown={(e) => e.preventDefault()}
          >
            <div
              style={{
                padding: "8px 12px",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#6b7280",
                borderBottom: "1px solid #f0f0f0",
                backgroundColor: "#fafafa",
              }}
            >
              {results.length} result{results.length === 1 ? "" : "s"} from TMDb
            </div>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                backgroundColor: "#ffffff",
              }}
            >
              {results.map((r, idx) => (
                <li
                  key={r.id}
                  onClick={() => void pick(r)}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: 12,
                    cursor: "pointer",
                    borderBottom:
                      idx < results.length - 1
                        ? "1px solid #f0f0f0"
                        : "none",
                    backgroundColor: "#ffffff",
                    color: "#111111",
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLLIElement).style.backgroundColor =
                      "#f4f4f5";
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLLIElement).style.backgroundColor =
                      "#ffffff";
                  }}
                >
                  {r.posterUrl ? (
                    <img
                      src={r.posterUrl}
                      alt=""
                      style={{
                        width: 44,
                        height: 66,
                        objectFit: "cover",
                        borderRadius: 4,
                        flexShrink: 0,
                        backgroundColor: "#eeeeee",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 44,
                        height: 66,
                        backgroundColor: "#eeeeee",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        flexShrink: 0,
                      }}
                    >
                      🎬
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: "#111111",
                      }}
                    >
                      {r.title}
                      {r.year && (
                        <span
                          style={{
                            fontWeight: 400,
                            color: "#6b7280",
                            marginLeft: 6,
                          }}
                        >
                          ({r.year})
                        </span>
                      )}
                    </div>
                    {r.overview && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          marginTop: 4,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {r.overview}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder="Search TMDb… (e.g. 'Inception')"
        onChange={(e) => {
          setQuery(e.target.value);
          input.onChange(e.target.value);
        }}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
          updatePos();
        }}
        style={{
          width: "100%",
          padding: "8px 10px",
          border: "1px solid #ccc",
          borderRadius: 6,
          fontSize: 14,
          backgroundColor: "#ffffff",
          color: "#111111",
        }}
      />
      {loading && (
        <span
          style={{
            position: "absolute",
            right: 12,
            top: 10,
            fontSize: 12,
            opacity: 0.6,
            pointerEvents: "none",
          }}
        >
          searching…
        </span>
      )}
      {error && (
        <p style={{ color: "#b91c1c", fontSize: 12, marginTop: 4 }}>{error}</p>
      )}
      <p style={{ fontSize: 11, color: "#666", marginTop: 6 }}>
        Type to search TMDb. Picking a movie auto-fills{" "}
        {shape === "movieObject"
          ? "title, year, director, runtime, poster, backdrop, genres"
          : shape === "top10Item"
            ? "title, year, poster"
            : "title and poster"}
        .
      </p>
      {popupNode}
    </div>
  );
}

export const MoviePicker = wrapFieldsWithMeta(MoviePickerInner);
