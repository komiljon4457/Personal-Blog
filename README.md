# Personal Blog

A personal blogging platform where a single author can publish articles, organise
them by category and tag, and let readers respond through comments. 

---

## Table of Contents

- [Purpose & Benefits](#purpose--benefits)
- [Problem It Solves](#problem-it-solves)
- [Target Group](#target-group)
- [Functionalities](#functionalities)
- [Domain Model (UML)](#domain-model-uml)

---

## Purpose & Benefits

The **Personal Blog** gives an individual author a self-owned space to publish
writing on the web without depending on a third-party platform (Medium, Substack,
social networks). It is intentionally small, fast, and fully under the author's
control.

**Benefits:**

- **Ownership** — content and presentation belong to the author, not a platform.
- **Simplicity** — a clean reading experience with no ads, trackers, or clutter.
- **Structure** — posts are organised by categories and tags so readers can browse
  by topic.
- **Engagement** — readers can leave comments and reach the author via a contact form.
- **Accessibility & SEO** — a strictly semantic HTML structure improves screen-reader
  support and search-engine indexing.

## Problem It Solves

Writers who want an online presence face a trade-off:

- **Social platforms** own the audience, inject ads, and can change the rules or
  disappear at any time.
- **Full CMS systems** (e.g. WordPress) are powerful but heavy, need maintenance,
  and are overkill for one person.

This project solves that gap by offering a **lightweight, author-owned blog** that is
easy to run, easy to read, and easy to extend — while remaining standards-based
(semantic HTML, external CSS, progressive enhancement).

## Target Group

| Group | Need |
| --- | --- |
| **Primary — The Author** | A single writer (hobbyist, developer, freelancer, student) who wants to publish and manage articles. |
| **Secondary — Readers** | Visitors who read articles, browse by category/tag, and leave comments. |
| **Tertiary — Contacts** | People who want to reach the author (collaboration, feedback) via the contact form. |

## Functionalities

### Public (Readers)
- Browse a **home page** with a list of the latest posts (title, excerpt, meta).
- Read a **single post** with full content, author, publish date, categories and tags.
- Filter posts by **category** and by **tag**.
- Read and submit **comments** on a post.
- View an **About** page.
- Send a message through the **Contact** form (client-side validated).

### Author / Admin (authenticated)
- **Log in** to a private area.
- View an **admin dashboard** listing all posts with their status (published/draft).
- **Create, edit, and delete** posts (title, content, categories, tags, status).
- **Moderate comments** (approve / delete).

> Authentication and persistence are conceptual in this step — the prototype
> demonstrates the screens and flows, not a live backend.

---

## Domain Model (UML)

The full UML class diagram and an entity description live in
[`docs/domain-model.md`](docs/domain-model.md).

**Core entities:** `Author`, `Post`, `Category`, `Tag`, `Comment`.

```
Author 1 ──── * Post
Post   * ──── * Category
Post   * ──── * Tag
Post   1 ──── * Comment
```

---

## Styling & Build (Step 2)

- **Sass (whole prototype)** — modular `scss/` sources (variables, mixins, partials)
  compile to the two `prototype/css/*.css` files the pages link. Uses Sass
  **variables** (colours, spacing/breakpoint maps), **modularization** (abstracts /
  base / components / layout partials) and **mixins** (`card`, `respond-to`,
  `button-variant`, `form-control`, …).
- **BEM (admin branch)** — `login.html`, `admin.html`, `post-editor.html` are written
  with `block__element--modifier` classes (`auth`, `dashboard`, `admin-table`,
  `post-form`, …) styled in [`scss/components/_admin.scss`](scss/components/_admin.scss).
