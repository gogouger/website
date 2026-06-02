# gordongouger.com

Source for my personal website. Portfolio, writing, résumé, and a contact form.

Live at <https://gordongouger.com>.

## Stack

- **HTML / CSS / vanilla JS** — no build step, no framework
- **[Caddy](https://caddyserver.com/)** serves the files in production (behind Cloudflare's proxy)
- Inline single sign-on modal hits same-origin `/__auth*` proxies (configured in [infra/Caddyfile](https://github.com/gogouger/infra)) so one login spans the site, [Meron](https://github.com/gogouger/meron), and Athenaeum
- A small self-hosted [contact form endpoint](https://github.com/gogouger/infra) handles `POST /contact` (FastAPI, multipart, attaches up to 3 files per submission via iCloud SMTP)

## Pages

- `index.html` — landing (what I do, selected work, writing, résumé)
- `about.html` — longer bio + photos
- `projects.html` — project detail
- `meron.html` — Meron's marketing page (lives here instead of meron.gordongouger.com)
- `writing.html` — notes, papers, talks
- `resume.html` — interactive résumé (plus a PDF in `resume/`)
- `contact.html` — the form

## Local development

No build step. Just serve the directory:

```sh
cd personal-site
python3 -m http.server 8000
# open http://localhost:8000
```

Caddy / inline-SSO bits won't work locally without the rest of the stack (Authelia, Meron, etc.) running — but the static pages render fine.

## Deployment

Production deploy is one bind-mount in [Caddy](https://github.com/gogouger/infra) — the directory at `/srv/site` *is* this repo, served as static files. Updates: `git pull` on the VPS, Caddy picks them up immediately. CSS / JS cache-busters are bumped in the HTML when content changes (`?v=N`).

## Résumé build

The PDF in `resume/Gordon-Gouger-Resume.pdf` is built from `resume/resume.tex` with [Tectonic](https://tectonic-typesetting.github.io/):

```sh
cd resume
tectonic resume.tex
mv resume.pdf Gordon-Gouger-Resume.pdf
```

The `resume-contact.tex` variant (which includes phone/email) is gitignored and not published.

## Author

[Gordon Gouger](https://www.linkedin.com/in/gordon-gouger/) — Senior ML Engineer, Denver, Colorado.

The portfolio content (writing, photos, project descriptions) is personal — feel free to read and learn from the source but please don't republish the content verbatim. The code itself you can borrow freely.
