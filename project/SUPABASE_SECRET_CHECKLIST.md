# Supabase Service Role Key — Pre-deployment Checklist

Purpose: ensure the `SUPABASE_SERVICE_ROLE_KEY` (service/admin key) is never exposed to the client or committed to the repository.

Before any deployment, verify the following:

- [ ] `project/.env` does NOT contain real secrets (only placeholders). If present, remove them and rotate keys.
  - Command: `git rm --cached project/.env && git commit -m "chore(secrets): remove local .env"`

- [ ] `project/.env.example` does not include actual secrets (only placeholders). Confirm by opening the file.
  - File: [project/.env.example](project/.env.example)

- [ ] Search repository for occurrences of the service key or patterns of long JWTs:
  - `git grep -n "SUPABASE_SERVICE_ROLE_KEY" || true`
  - `git grep -n "eyJ" || true` (inspect results carefully for false positives)

- [ ] Ensure no `createClient(url, serviceKey)` calls are present in `project/src/` (frontend):
  - `git grep -n "createClient(" project/src || true`
  - Manually inspect any matches; frontend client must use only `VITE_SUPABASE_ANON_KEY`.

- [ ] Ensure server-side admin usage is confined to `project/server/` or server-only modules (not imported by `src/`):
  - Example server file should do: `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` and **must not** be imported from client code.

- [ ] If a secret was accidentally committed to history, remove it from the Git history and rotate the key immediately.
  - To remove file from history (recommended):
    1) Install `git-filter-repo` (preferred) or use BFG.
    2) `git filter-repo --path project/.env --invert-paths`
    3) Force-push to remote: `git push --force --all && git push --force --tags`
  - After this, rotate the exposed key in the Supabase dashboard.

- [ ] CI / GitHub Actions: store `SUPABASE_SERVICE_ROLE_KEY` inside GitHub Secrets and reference via `${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}` in workflows. Do NOT hardcode the key in workflow YAML.
  - Example:
    ```yaml
    env:
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    ```

- [ ] Add an automated check to CI (optional but recommended): fail the build if any file in `project/` contains `SUPABASE_SERVICE_ROLE_KEY` or `eyJ` tokens that match Supabase keys.

- [ ] Rotate the service role key in Supabase if it was ever present in the repo or leaked to any third party.
  - Supabase console → Project → Settings → API → Rotate Service Role Key

- [ ] Verify runtime behaviour after rotation: update secrets in the environment, redeploy server, and confirm server-side admin operations succeed.

Notes:
- `VITE_` prefixed variables become part of the client bundle; never use this for private keys.
- The ANON key is intended for client SDK use and cannot bypass RLS when policies are set correctly.
- The service role key bypasses RLS and must be treated as a high‑privilege secret.

If you want, I can add a CI check and a pre-commit hook to enforce these rules automatically.
