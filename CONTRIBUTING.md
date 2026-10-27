# Contributing

## Branching strategy

We use a simplified Git Flow:

| Branch | Purpose | Who merges |
| --- | --- | --- |
| `main` | Production. Every commit here is what is (or will be) live. | Release PRs from `develop` only |
| `develop` | Integration. Finished features land here and are tested together. | Feature PRs |
| `feature/<short-name>` | One feature or change, e.g. `feature/bookings`. Branch from `develop`. | — |
| `fix/<short-name>` | Bug fix, branched from `develop`. | — |
| `hotfix/<short-name>` | Urgent production fix, branched from `main`, merged into `main` **and** `develop`. | — |

Workflow:

1. Branch from `develop`: `git checkout -b feature/bookings develop`
2. Open a pull request into `develop`. CI must pass and the PR needs a review before merging.
3. When `develop` is ready to release, open a PR from `develop` into `main` and tag the merge (`v0.1.0`, `v0.2.0`, …).

Never commit directly to `main` or `develop`.

## Recommended GitHub settings

In **Settings → Branches**, add protection rules for `main` and `develop`:

- Require a pull request before merging (at least 1 approval)
- Require status checks to pass (the `CI` workflow)
- Block force pushes and deletions

In **Settings → General**, set the default branch to `develop`.
In **Settings → Code security**, enable Dependabot alerts, secret scanning and push protection.

## Commit messages

Short imperative summary line (`Add booking form`), then a blank line and details if needed.
