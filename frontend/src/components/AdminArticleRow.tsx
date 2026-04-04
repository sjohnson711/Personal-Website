import { Link } from "react-router-dom"; // Link is like an <a> tag, but navigates without refreshing the page
import { useState } from "react"; // useState lets us track changing values inside the component

// Describes the shape of an article object.
// TypeScript uses this to make sure we never accidentally pass the wrong data.
interface Article {
  id: number; // unique number that identifies this article in the database
  title: string; // the article's headline
  slug: string; // URL-friendly version of the title, e.g. "my-first-post"
  published: boolean; // true = visible to readers, false = draft
  createdAt: string | Date; // when the article was created (can be a Date object or a date string)
}

// Describes the props (inputs) this component expects from its parent.
// article = the data to display, onDelete = a function to call after a successful delete
interface AdminArticleRowProps {
  article: Article;
  onDelete: (id: number) => void; // a function that takes an id and returns nothing
}

// The component — receives article data and an onDelete callback as props
export default function AdminArticleRow({
  article,
  onDelete,
}: AdminArticleRowProps) {
  // Tracks whether a delete request is currently in progress.
  // We use this to disable the button so the user can't click it twice.
  const [deleting, setDeleting] = useState(false);

  // Runs when the user clicks the Delete button
  async function handleDelete() {
    // Show a browser confirmation popup — if the user clicks Cancel, stop here
    if (!confirm(`Delete "${article.title}"? This cannot be undone.`)) return;

    // Disable the button and show "…" while we wait for the server
    setDeleting(true);

    // Send a DELETE request to the backend API for this article.
    // credentials: "include" sends the auth cookie so the server knows we're logged in.
    await fetch(`/api/articles/${article.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    // Tell the parent component to remove this article from its list
    onDelete(article.id);
  }

  // Format the date into something readable like "Jan 5, 2025"
  const dateStr = new Date(article.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    // Outer row — CSS Grid with 3 columns: [title info] [badge] [buttons]
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto", // title takes remaining space, other two shrink to fit
        gap: "1.25rem",
        alignItems: "center",
        padding: "1rem 1.75rem",
        borderBottom: "1px solid #F0EBE2", // light separator line between rows
        transition: "background 0.15s", // smooth background color change on hover
      }}
    >
      {/* Left column: article title + slug/date info */}
      <div style={{ minWidth: 0 }}>
        {" "}
        {/* minWidth: 0 allows text truncation to work inside a grid */}
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            color: "#1C1917",
            fontWeight: 600,
            fontSize: "0.93rem",
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {article.title} {/* Truncated with "..." if too long */}
        </p>
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            color: "#C4BAB0",
            fontSize: "0.73rem",
            margin: "0.2rem 0 0",
          }}
        >
          /articles/{article.slug} &middot; {dateStr}{" "}
          {/* &middot; renders as a · dot separator */}
        </p>
      </div>

      {/* Middle column: colored badge showing Published or Draft */}
      <span
        className={
          article.published ? "badge badge-published" : "badge badge-draft"
        }
      >
        {article.published ? "Published" : "Draft"}
      </span>

      {/* Right column: Edit link and Delete button */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {/* Link navigates to the edit page for this article */}
        <Link to={`/admin/articles/${article.id}/edit`} className="btn-outline">
          Edit
        </Link>

        {/* Button is disabled while a delete is in progress to prevent double-clicks */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn-danger"
        >
          {deleting ? "…" : "Delete"}{" "}
          {/* Show "…" while waiting, otherwise "Delete" */}
        </button>
      </div>
    </div>
  );
}
