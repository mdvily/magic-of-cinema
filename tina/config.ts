import { defineConfig } from "tinacms";

/**
 * TinaCMS config — Magic of Cinema.
 *
 * Six collections, each with their own editor shape:
 *   - reviews     (body + popcorn ratings + movie info)
 *   - tier-lists  (body intro + editable tiers + card builder)
 *   - top-10      (body intro + ordered ranked items)
 *   - hot-takes   (body + optional movie)
 *   - trivia      (body + optional movie)
 *   - about       (singleton, body + avatar)
 */

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

/* ------------------------------- helpers ------------------------------ */

/** Each popcorn bucket field must be an integer 0–20. */
function validateBucket(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return "Whole numbers only — no half popcorn.";
  }
  if (n < 0 || n > 20) {
    return "Must be between 0 and 20.";
  }
  return undefined;
}

/** Slugify titles to filenames consistently. */
function slugifyTitle(title: string | undefined): string {
  return (title || "untitled-post")
    .toLowerCase()
    .replace(/['"!?:;,.()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Common metadata fields shared across most post types. */
const baseFields = [
  {
    type: "string",
    name: "title",
    label: "Title",
    required: true,
    isTitle: true,
  },
  {
    type: "datetime",
    name: "publishDate",
    label: "Publish Date",
    required: true,
    ui: { dateFormat: "MMMM DD, YYYY" },
  },
  {
    type: "string",
    name: "tags",
    label: "Tags",
    list: true,
    ui: { component: "tags" },
  },
  {
    type: "string",
    name: "excerpt",
    label: "Excerpt (one-line teaser)",
    ui: { component: "textarea" },
    description: "Shown on cards. Max 280 chars.",
  },
  {
    type: "boolean",
    name: "draft",
    label: "Draft (unpublished)",
    description: "Check while you're working on it. Uncheck to publish.",
  },
];

/** Movie metadata block (used by reviews, hot takes, trivia). */
const movieField = {
  type: "object" as const,
  name: "movie",
  label: "Movie Info (optional)",
  fields: [
    { type: "string" as const, name: "title", label: "Movie Title" },
    { type: "number" as const, name: "year", label: "Year" },
    { type: "string" as const, name: "director", label: "Director" },
    { type: "number" as const, name: "runtime", label: "Runtime (min)" },
    {
      type: "string" as const,
      name: "posterUrl",
      label: "Poster URL",
      description: "Paste TMDb URL or any image URL.",
    },
    { type: "string" as const, name: "backdropUrl", label: "Backdrop URL" },
    { type: "number" as const, name: "tmdbId", label: "TMDb ID" },
    {
      type: "string" as const,
      name: "genres",
      label: "Genres",
      list: true,
      ui: { component: "tags" },
    },
  ],
};

/* ----------------------------- collections ----------------------------- */

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID ?? "",
  token: process.env.TINA_TOKEN ?? "",

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },

  schema: {
    collections: [
      /* --------------------------- Reviews --------------------------- */
      {
        name: "review",
        label: "📝 Reviews",
        path: "src/content/reviews",
        format: "md",
        ui: {
          filename: { slugify: (v) => slugifyTitle(v?.title) },
          router: ({ document }) => `/reviews/${document._sys.filename}`,
        },
        fields: [
          ...baseFields,
          movieField,
          {
            type: "object",
            name: "rating",
            label: "Popcorn Ratings 🍿",
            description:
              "Each category 0–20. Whole numbers only. Overall (0–100) is the sum, computed automatically.",
            fields: [
              { type: "number", name: "story", label: "📖 Story (0–20)", ui: { validate: validateBucket } },
              { type: "number", name: "visuals", label: "🎨 Visuals (0–20)", ui: { validate: validateBucket } },
              { type: "number", name: "characters", label: "👥 Characters (0–20)", ui: { validate: validateBucket } },
              { type: "number", name: "acting", label: "🎭 Acting (0–20)", ui: { validate: validateBucket } },
              { type: "number", name: "music", label: "🎵 Music (0–20)", ui: { validate: validateBucket } },
            ],
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },

      /* -------------------------- Tier Lists ------------------------- */
      {
        name: "tierList",
        label: "🪜 Tier Lists",
        path: "src/content/tier-lists",
        format: "md",
        ui: {
          filename: { slugify: (v) => slugifyTitle(v?.title) },
          router: ({ document }) => `/tier-lists/${document._sys.filename}`,
        },
        fields: [
          ...baseFields,
          {
            type: "string",
            name: "coverImageUrl",
            label: "Cover Image URL (optional)",
          },
          {
            type: "object",
            name: "tiers",
            label: "Tiers",
            list: true,
            ui: {
              itemProps: (item) => ({
                label: item?.name ? `${item.name} (${item.cards?.length ?? 0} cards)` : "New tier",
              }),
              defaultItem: () => ({ name: "S", color: "#f6c453", cards: [] }),
            },
            fields: [
              {
                type: "string",
                name: "name",
                label: "Tier Name",
                description: "S, A, B, GOAT, Mid — whatever you want.",
              },
              {
                type: "string",
                name: "color",
                label: "Color (hex)",
                ui: { component: "color" },
                description: "Pick a color for this tier.",
              },
              {
                type: "object",
                name: "cards",
                label: "Cards",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title || "New card" }),
                  defaultItem: () => ({ title: "" }),
                },
                fields: [
                  { type: "string", name: "title", label: "Title", required: true },
                  { type: "string", name: "posterUrl", label: "Poster URL (optional)" },
                  {
                    type: "string",
                    name: "description",
                    label: "Short description (optional)",
                    ui: { component: "textarea" },
                  },
                ],
              },
            ],
          },
          {
            type: "rich-text",
            name: "body",
            label: "Intro (optional)",
            isBody: true,
            description: "Short intro shown above the tier list.",
          },
        ],
      },

      /* ---------------------------- Top 10 --------------------------- */
      {
        name: "top10",
        label: "🎯 Top 10 Lists",
        path: "src/content/top-10",
        format: "md",
        ui: {
          filename: { slugify: (v) => slugifyTitle(v?.title) },
          router: ({ document }) => `/top-10/${document._sys.filename}`,
        },
        fields: [
          ...baseFields,
          {
            type: "string",
            name: "coverImageUrl",
            label: "Cover Image URL (optional)",
          },
          {
            type: "object",
            name: "items",
            label: "Ranked items (#1 first)",
            list: true,
            description:
              "List items in rank order, #1 first. Site renders countdown (last → #1).",
            ui: {
              itemProps: (item) => ({ label: item?.title || "New item" }),
              defaultItem: () => ({ title: "" }),
            },
            fields: [
              { type: "string", name: "title", label: "Title", required: true },
              { type: "number", name: "year", label: "Year (optional)" },
              { type: "string", name: "posterUrl", label: "Poster URL (optional)" },
              {
                type: "string",
                name: "description",
                label: "Short description (optional)",
                ui: { component: "textarea" },
              },
            ],
          },
          {
            type: "rich-text",
            name: "body",
            label: "Intro (optional)",
            isBody: true,
          },
        ],
      },

      /* --------------------------- Hot Takes ------------------------- */
      {
        name: "hotTake",
        label: "🌶️ Hot Takes",
        path: "src/content/hot-takes",
        format: "md",
        ui: {
          filename: { slugify: (v) => slugifyTitle(v?.title) },
          router: ({ document }) => `/hot-takes/${document._sys.filename}`,
        },
        fields: [
          ...baseFields,
          movieField,
          { type: "rich-text", name: "body", label: "Body", isBody: true },
        ],
      },

      /* --------------------------- Trivia ---------------------------- */
      {
        name: "triviaPost",
        label: "🎓 Trivia",
        path: "src/content/trivia",
        format: "md",
        ui: {
          filename: { slugify: (v) => slugifyTitle(v?.title) },
          router: ({ document }) => `/trivia/${document._sys.filename}`,
        },
        fields: [
          ...baseFields,
          movieField,
          { type: "rich-text", name: "body", label: "Body", isBody: true },
        ],
      },

      /* --------------------------- About (singleton) ---------------- */
      {
        name: "about",
        label: "ℹ️ About Page",
        path: "src/content/about",
        format: "md",
        ui: {
          // Singleton: hide create/delete; only one document.
          allowedActions: { create: false, delete: false },
          router: () => "/about",
        },
        match: { include: "about" },
        fields: [
          { type: "string", name: "title", label: "Title", isTitle: true, required: true },
          {
            type: "string",
            name: "avatarUrl",
            label: "Avatar / Image URL (optional)",
          },
          {
            type: "datetime",
            name: "updatedDate",
            label: "Last Updated",
            ui: { dateFormat: "MMMM DD, YYYY" },
          },
          { type: "rich-text", name: "body", label: "Body", isBody: true },
        ],
      },
    ],
  },
});
