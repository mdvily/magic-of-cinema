/**
 * Tina custom field: MoviePicker
 *
 * Drops a "search-and-autofill" UI into a Tina form. Searches TMDb on type,
 * shows matches with posters in a fixed-position popup, and on selection
 * writes the chosen movie's metadata into sibling fields.
 *
 * Used in three contexts (controlled by `field.options.shape`):
 *   - "movieObject": fills movie.title/year/director/runtime/poster/backdrop/tmdbId/genres
 *   - "tierCard": fills cards[i].title + posterUrl
 *   - "top10Item": fills items[i].title + year + posterUrl
 *
 * The popup is rendered with `position: fixed` and computed coordinates
 * to escape any clipping/overflow from Tina's surrounding form scroll
 * containers and stacking contexts.
 */
import * as React from "react";
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

  // Recompute popup position whenever it opens, on scroll, or on resize
  const updatePos = React.useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPopupPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 360),
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

    // movieObject — fetch full details
    try {
      const dr = await fetch(`/api/tmdb-details?id=${r.id}`);
      const detail = (await dr.json()) as DetailResponse;
      if (detail.year) form.change(siblingName("year"), detail.year);
      if (detail.director)
        form.change(siblingName("director"), detail.director);
      if (detail.runtime) form.change(siblingName("runtime"), detail.runtime);
      if (detail.posterUrl)
        form.change(siblingName("posterUrl"), detail.posterUrl);
      if (detail.backdropUrl)
        form.change(siblingName("backdropUrl"), detail.backdropUrl);
      if (detail.tmdbId) form.change(siblingName("tmdbId"), detail.tmdbId);
      if (detail.genres && detail.genres.length > 0)
        form.change(siblingName("genres"), detail.genres);
    } catch {
      /* search-result data already written for title; details fetch errors are non-fatal */
    }
  }

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
        onBlur={() => {
          // Delay so a click on a list item registers before close
          setTimeout(() => setOpen(false), 200);
        }}
        style={{
          width: "100%",
          padding: "8px 10px",
          border: "1px solid #ccc",
          borderRadius: 6,
          fontSize: 14,
          background: "white",
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

      {open && results.length > 0 && popupPos && (
        <FixedDropdown pos={popupPos}>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              background: "white",
              border: "1px solid #d4d4d4",
              borderRadius: 8,
              boxShadow:
                "0 12px 32px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)",
              maxHeight: 360,
              overflowY: "auto",
              fontSize: 14,
            }}
          >
            {results.map((r, idx) => (
              <li
                key={r.id}
                onMouseDown={(e) => {
                  // Use mousedown so it fires before input.blur closes the popup
                  e.preventDefault();
                  void pick(r);
                }}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: 10,
                  cursor: "pointer",
                  borderBottom:
                    idx < results.length - 1 ? "1px solid #f0f0f0" : "none",
                  background: "white",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLLIElement).style.background =
                    "#fafafa";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLLIElement).style.background = "white";
                }}
              >
                {r.posterUrl ? (
                  <img
                    src={r.posterUrl}
                    alt=""
                    style={{
                      width: 40,
                      height: 60,
                      objectFit: "cover",
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 40,
                      height: 60,
                      background: "#eee",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    🎬
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>
                    {r.title}
                    {r.year && (
                      <span
                        style={{
                          fontWeight: 400,
                          color: "#666",
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
                        color: "#666",
                        marginTop: 2,
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
        </FixedDropdown>
      )}
    </div>
  );
}

/**
 * Renders children with `position: fixed` at exact viewport coordinates.
 * Escapes any parent overflow/stacking-context clipping in Tina's form.
 */
function FixedDropdown({
  pos,
  children,
}: {
  pos: { top: number; left: number; width: number };
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 99999,
      }}
    >
      {children}
    </div>
  );
}

export const MoviePicker = wrapFieldsWithMeta(MoviePickerInner);
