un

# Contributor Workflow

## People and ownership

- Varun (GitHub: `varunsidr`) owns the canonical repository: `varunsidr/playwright-ai-self-healing-framework`.
- Ashish (GitHub: `ashishbarthwal`) contributes through his personal fork: `ashishbarthwal/playwright-ai-self-healing-framework`.
- Vaibhav is also a peer contributor at Ashish's level; he contributes through his own fork or branch and does not own the canonical repository.
- The fork is the only repository this local checkout should push to directly.

## Working rules

- Keep `origin` pointed at Ashish's fork.
- Keep `upstream` pointed at Varun's canonical repository for fetching and comparison only.
- Work on a feature branch, never directly on `main`.
- Commit and push feature work to Ashish's fork.
- Open a pull request from `ashishbarthwal:<branch>` to `varunsidr:main`.
- Varun reviews and merges the pull request; code is not considered part of the canonical repository until that merge.

## Before pushing

1. Confirm the current branch is the intended feature branch.
2. Confirm `origin` is Ashish's fork and `upstream` is Varun's repository.
3. Run the relevant tests and inspect the diff against `main`.
4. Push only to `origin`, then create or update the pull request.

This file is local guidance only and must remain ignored by Git.
