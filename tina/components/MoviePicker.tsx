/**
 * Tina custom field: MoviePicker
 *
 * Drops a "search-and-autofill" UI into a Tina form. Searches TMDb on type,
 * shows matches with posters, and on selection writes the chosen movie's
 * metadata into sibling fields.
 *
 * Used in two contexts:
 *   1. As the editor for a `movie` object field (sets all of its sub-fields).
 *   2. As the editor for tier-list cards / top-10 items (sets title, posterUrl,
 *      year, plus optional description from overview).
 *
 * The "shape" prop tells the picker which sibling fields to write.
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

/**
 * The component receives the standard Tina field props. We use `form` to
 * write sibling values, and read `field.options.shape` to decide which fields
 * we should populate.
 */
function MoviePickerInner(props: any): JSX.Element {
  const { input, field, form } = props;
  const shape: "movieObject" | "tierCard" | "top10Item" =
    field?.options?.shape ?? "movieObject";

  const [query, setQuery] = React.useState<string>(input.value || "");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

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

  /**
   * Field name resolution.
   *
   * `field.name` is something like "movie.title" or "tiers.0.cards.2.title".
   * To set a sibling field we replace the trailing segment.
   */
  function siblingName(siblingKey: string): string {
    const segs = field.name.split(".");
    segs[segs.length - 1] = siblingKey;
    return segs.join(".");
  }

  async function pick(r: SearchResult) {
    setOpen(false);
    setQuery(r.title);
    input.onChange(r.title);

    if (shape === "tierCard" || shape === "top10Item") {
      // Title is already set above (input.onChange).
      if (r.posterUrl) form.change(siblingName("posterUrl"), r.posterUrl);
      if (shape === "top10Item" && r.year)
        form.change(siblingName("year"), r.year);
      // For tier cards we *don't* auto-fill description (MovieMan writes that).
      return;
    }

    // shape === "movieObject" — fetch details and fill all sibling fields
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
      // Search-result data was already written for title; details fetch
      // failures are non-fatal.
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        placeholder="Search TMDb… (e.g. 'Inception')"
        onChange={(e) => {
          setQuery(e.target.value);
          input.onChange(e.target.value);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        style={{
          width: "100%",
          padding: "8px 10px",
          border: "1px solid #ccc",
          borderRadius: 6,
          fontSize: 14,
        }}
      />
      {loading && (
        <span style={{ position: "absolute", right: 12, top: 10, fontSize: 12, opacity: 0.6 }}>
          searching…
        </span>
      )}
      {error && (
        <p style={{ color: "#b91c1c", fontSize: 12, marginTop: 4 }}>{error}</p>
      )}
      {open && results.length > 0 && (
        <ul
          style={{
            position: "absolute",
            zIndex: 10,
            top: "100%",
            left: 0,
            right: 0,
            margin: "4px 0 0 0",
            padding: 0,
            listStyle: "none",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {results.map((r) => (
            <li
              key={r.id}
              onMouseDown={(e) => {
                e.preventDefault();
                void pick(r);
              }}
              style={{
                display: "flex",
                gap: 10,
                padding: 8,
                cursor: "pointer",
                borderBottom: "1px solid #f0f0f0",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#fafafa")}
              onMouseOut={(e) => (e.currentTarget.style.background = "white")}
            >
              {r.posterUrl ? (
                <img
                  src={r.posterUrl}
                  alt=""
                  style={{ width: 36, height: 54, objectFit: "cover", borderRadius: 3 }}
                />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 54,
                    background: "#eee",
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  🎬
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {r.title}
                  {r.year && (
                    <span style={{ fontWeight: 400, color: "#666", marginLeft: 6 }}>
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
    </div>
  );
}

export const MoviePicker = wrapFieldsWithMeta(MoviePickerInner);
