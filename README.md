# Geography in the News

A 3D globe of the day's geography stories, colour-coded by **SEEP** (Social, Economic, Environmental, Political). It updates itself every morning with no AI and no API key.

## How it works

1. Every morning (and again at lunchtime) a free **GitHub Action** runs `scripts/update.mjs`.
2. The script reads RSS feeds from BBC News, The Guardian, Al Jazeera and UN News. It:
   - throws out sport, celebrity and unsuitable stories using word lists
   - scores each story for each SEEP theme using keyword lists
   - finds where the story is happening by matching place names (countries, capitals, major cities and regions) in `data/gazetteer.json`
   - adds key terms from `data/glossary.json` and discussion questions linked to course topics
   - picks about 30 stories, balanced across the four themes, with no more than 3 per country
3. It saves the result as `data/news/YYYY-MM-DD.json`, which the website reads. Every past day is kept, so the archive builds up automatically.

Students only see the headline, the publisher's own short summary and a link to the full article.

**Limitations:** because it uses rules rather than AI, it will sometimes pin a story to the wrong country or give it the wrong SEEP tag. Use the teacher Hide button for those.

## Setup (about 15 minutes)

### 1. Put it on GitHub
1. Create a new repository, for example `geography-news`.
2. Upload everything in this folder, **including the hidden `.github` folder**. On a Mac, press Cmd+Shift+. in Finder to show hidden folders.
3. Go to **Settings → Actions → General → Workflow permissions**, choose **Read and write permissions** and save.
4. Go to the **Actions** tab, open **Daily geography news** and click **Run workflow** to get today's stories straight away.

### 2. Publish the website (choose one)
- **GitHub Pages:** go to **Settings → Pages**, set Source to **Deploy from a branch**, choose `main` and `/ (root)`, then save. The site goes live at `https://<your-username>.github.io/geography-news/`.
- **Vercel:** go to **Add New → Project** and import the repo. There's no build step, so leave the settings at their defaults. Vercel redeploys automatically after each daily update.

### 3. Turn on the teacher Hide button (optional)
1. In Supabase (you can use an existing project), open **SQL Editor** and run `supabase.sql`.
2. Go to **Authentication → Users → Add user** and create a login for each teacher.
3. Go to **Authentication → Sign In / Providers** and **turn off "Allow new users to sign up"**. This is important: otherwise anyone could create an account and hide stories.
4. Go to **Project Settings → API**, then copy the **Project URL** and the **anon / publishable key** into `config.js`.
5. Teachers use `teacher.html` (for example `…/geography-news/teacher.html`) to sign in and hide or unhide stories.

## Customising

All the rules are in `scripts/config.mjs`:

| Setting | What it changes |
|---|---|
| `FEEDS` | Add or remove news sources |
| `MAX_STORIES`, `MAX_PER_COUNTRY` | How many stories appear each day |
| `SEEP` | Keywords for each theme |
| `TOPICS` | Course topic links and discussion question templates |
| `BLOCK` | Words that stop a story being published |
| `CONFLICT` | Words that label a story as conflict (students can switch conflict stories off) |
| `NOT_GEOGRAPHY` | Words that mark a story as not geography (sport, celebrity and so on) |
| `FALSE_PLACES` | Phrases like "Paris Agreement" that shouldn't pin a story to that place |

Key terms and their definitions are in `data/glossary.json`.

To test changes on your own computer (Node 18 or newer), run `node scripts/update.mjs --verbose`. It prints every story it kept and why others were rejected.

## Files

| File | Purpose |
|---|---|
| `index.html` | The globe for students |
| `teacher.html` | Sign-in page for hiding stories |
| `config.js` | Supabase details for the Hide feature |
| `scripts/update.mjs` | The daily update |
| `scripts/lib.mjs` | Feed reading, SEEP scoring, place finding and story selection |
| `scripts/config.mjs` | All the rules and word lists |
| `data/news/` | One file per day, plus `index.json` |
| `data/gazetteer.json` | Place names with coordinates |
| `data/glossary.json` | Key terms and definitions |
| `.github/workflows/daily-news.yml` | Runs the update every morning |
