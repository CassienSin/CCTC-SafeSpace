# SafeSpace recovery copy — 20 October 2026

This is a reconstructed project source tree, not a patch-only folder. The damaged original project has NOT been modified. This copy contains Git-tracked project files, surviving current source, and saved reporting updates. It does not include node_modules, .next, .git, .vercel, or environment secrets. Do not delete your original folder.

## Sources and limits

- Missing files were recovered from Git HEAD 6989c17.
- Surviving tracked files and current app/components/lib/public source were preserved.
- Missing handbook dashboard/report/chat files were recovered from the saved handbook package. The new-report form uses the later evidence-upload update.
- Face-login tests and SQL references were included from the saved pilot package; evidence tests were included too.
- RECOVERY-SOURCES.csv records the copy sources in order. Where a path appears more than once, the last entry is the final source.
- Unknown uncommitted edits that existed only in deleted files cannot be guaranteed recovered. Existing legacy code and any existing bugs remain; this is recovery, not a security audit.
- The root README comes from the existing project and may describe older severity/reporting behavior. Follow this recovery guide for restoration.

## Safe installation

1. Extract the ZIP into a NEW empty folder, for example C:\Users\Aljho\Documents\Capstone\cctc-safespace-recovered. Do not paste it over or delete your current project.
2. Keep your original project as a backup. Privately copy its .env.local to the recovered folder. Do not upload or share that file.
3. In the recovered .env.local, keep FACE_LOGIN_ENABLED=false while restoring/testing. Keep any existing encryption key unchanged. The face-login code is experimental, not production-ready Face ID; password and Google login remain available. A static photo received high liveness scores during earlier tests, so do not use this pilot for real sensitive accounts.
4. Open the recovered folder in your editor, then open its terminal. Run npm install. The preserved package-lock.json may need updating to match the surviving package.json.
5. Run npm run test:face-login, npm run test:face-login-db, and node --test tests/evidenceUpload.test.mjs. The database test is local and does not apply Supabase SQL.
6. Run npm run build:face-pilot. Stop on an error and send the first error block. A successful syntax/import check is not a successful production build.
7. If the build passes, run npm run dev and test password login, Google login, reports, evidence, messages, notifications and the old face-unlock routes on localhost. Stop the old development server first so the two copies do not compete for port 3000.
8. Do not deploy or replace your original project until the database compatibility below is confirmed and local tests pass. This folder has no Git history or Vercel project linkage; do not initialize or force-push a replacement repository just to test it.

## Supabase compatibility — no SQL has been run by this recovery

- The restored handbook pages require the previously prepared handbook migration. Do not roll back to old severity/anonymous submission pages if the migration is already active.
- The surviving new admin role endpoint calls safespace_set_user_role, provided by the face-login migration. Its presence in source does not mean the SQL was applied. Keep role-management testing/deployment paused until confirmed.
- SQL files under supabase are reference copies, not instructions to blindly rerun them. Confirm whether each migration was already applied and review errors before proceeding.
- Do not disable RLS, loosen grants, remove new columns, or delete database data to make recovery work.

## Verification scope

Syntax, local-import resolution, and byte-for-byte preservation checks are performed separately and reported with delivery. A full production build and live Supabase/browser login are NOT confirmed for this recovered project. Earlier builds encountered Windows EPERM directory-creation failures. No database, deployment, keys, or original application files were changed during recovery.
