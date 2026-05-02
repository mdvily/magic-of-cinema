import { defineConfig } from "tinacms";

/**
 * TinaCMS config — Magic of Cinema.
 *
 * MovieMan logs in at /admin and edits posts through this UI.
 * Saves write to GitHub directly; Vercel auto-deploys on push.
 *
 * Schema mirrors src/content.config.ts so what Astro reads at build time
 * matches what MovieMan sees in the editor.
 */

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

const CATEGORIES = [
  "Reviews",
  "Top 10 Lists",
  "Trivia",
  "Hot Takes",
  "Tier Lists",
];

export default defineConfig({
  branch,
  // From Tina Cloud project settings
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
      {
        name: "review",
        label: "Posts",
        path: "src/content/reviews",
        format: "md",
        ui: {
          // Filename is derived from title; lowercased + dashed
          filename: {
            slugify: (values) =>
              `${(values?.title || "untitled-post")
                .toLowerCase()
                .replace(/['"!?:;,.()]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")}`,
          },
          router: ({ document }) => {
            return `/reviews/${document._sys.filename}`;
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Post Title",
            required: true,
            isTitle: true,
            description:
              "Headline for the post. Make it bold — this is what people see first.",
          },
          {
            type: "datetime",
            name: "publishDate",
            label: "Publish Date",
            required: true,
            ui: {
              dateFormat: "MMMM DD, YYYY",
            },
          },
          {
            type: "string",
            name: "category",
            label: "Category",
            required: true,
            options: CATEGORIES.map((c) => ({ value: c, label: c })),
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
            ui: {
              component: "tags",
            },
            description: "Optional. Things like 'sci-fi', 'pixar', 'so-bad-its-good'.",
          },
          {
            type: "string",
            name: "excerpt",
            label: "Excerpt (one-line teaser)",
            ui: {
              component: "textarea",
            },
            description: "Short summary shown on cards. Max 280 chars.",
          },
          {
            type: "boolean",
            name: "draft",
            label: "Draft (unpublished)",
            description:
              "Check this while you're still working on it. Uncheck to publish.",
          },
          {
            type: "object",
            name: "movie",
            label: "Movie Info",
            description:
              "If this post is about a specific movie, fill these in.",
            fields: [
              { type: "string", name: "title", label: "Movie Title" },
              { type: "number", name: "year", label: "Year" },
              { type: "string", name: "director", label: "Director" },
              { type: "number", name: "runtime", label: "Runtime (min)" },
              {
                type: "string",
                name: "posterUrl",
                label: "Poster URL",
                description: "Paste from TMDb (e.g. image.tmdb.org/...)",
              },
              {
                type: "string",
                name: "backdropUrl",
                label: "Backdrop URL",
                description: "Optional. Wide image for social sharing.",
              },
              {
                type: "number",
                name: "tmdbId",
                label: "TMDb ID",
                description: "Optional. Used for future TMDb auto-fill.",
              },
              {
                type: "string",
                name: "genres",
                label: "Genres",
                list: true,
                ui: { component: "tags" },
              },
            ],
          },
          {
            type: "object",
            name: "rating",
            label: "Popcorn Ratings 🍿",
            description:
              "Each category 0–20. Whole numbers only. Overall (0–100) is the sum, computed automatically.",
            fields: [
              {
                type: "number",
                name: "story",
                label: "📖 Story (0–20)",
                ui: { validate: validateBucket },
              },
              {
                type: "number",
                name: "visuals",
                label: "🎨 Visuals (0–20)",
                ui: { validate: validateBucket },
              },
              {
                type: "number",
                name: "characters",
                label: "👥 Characters (0–20)",
                ui: { validate: validateBucket },
              },
              {
                type: "number",
                name: "acting",
                label: "🎭 Acting (0–20)",
                ui: { validate: validateBucket },
              },
              {
                type: "number",
                name: "music",
                label: "🎵 Music (0–20)",
                ui: { validate: validateBucket },
              },
            ],
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
            description: "The actual review. Write away.",
          },
        ],
      },
    ],
  },
});

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
