#!/usr/bin/env bash
# One-time, lease-protected all-ref ZeptoMail credential history scrub.
# This does not revoke the provider key or delete GitHub's hidden PR refs.
set -Eeuo pipefail
umask 077

if [[ "${CONFIRM_HISTORY_PURGE:-}" != "I_UNDERSTAND_ALL_BRANCH_SHAS_CHANGE" || "${CONFIRM_ZEPTOMAIL_ROTATED:-}" != "YES" ]]; then
  echo 'ABORT: Writers must be paused and ZeptoMail key revoked first.' >&2
  exit 2
fi
command -v git-filter-repo >/dev/null || { echo 'Requires git-filter-repo >=2.47' >&2; exit 2; }
url='https://github.com/42Students/lms-vnext.git'
tmp="$(mktemp -d)"
trap 'rm -rf -- "$tmp"' EXIT
git clone --quiet --mirror "$url" "$tmp/repo.git"
cd "$tmp/repo.git"
git ls-remote --refs --heads --tags origin | LC_ALL=C sort -k2,2 > "$tmp/before"
grep -q $'\trefs/heads/main$' "$tmp/before" || { echo 'ABORT: main missing' >&2; exit 2; }

# Read the original key privately from the previously identified historical commit.
# Never print it, pass it as a command-line argument, or write it into a Git blob.
python3 - "$tmp" <<'PY'
import pathlib,re,subprocess,sys
dest=pathlib.Path(sys.argv[1])
rev='a39a204676f76974fad526d549faccd21b059704'
path='docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java'
data=subprocess.check_output(['git','show',f'{rev}:{path}'])
m=re.search(rb'DEFAULT_ZEPTOMAIL_TOKEN\s*=\s*"(Zoho-enczapikey [^"\r\n]+)"',data)
if not m or len(m.group(1))<80: raise SystemExit('ABORT: leaked token source changed')
token=m.group(1)
(dest/'token.bin').write_bytes(token)
(dest/'replace.txt').write_bytes(b'literal:'+token+b'==>[REDACTED]\n')
PY

# Rewrite content AND commit messages across all refs, including fetched PR refs.
git filter-repo --sensitive-data-removal --replace-text "$tmp/replace.txt" --replace-message "$tmp/replace.txt"

# Inspect every reachable Git object; do not put the secret in argv or logs.
python3 - "$tmp/token.bin" <<'PY'
import subprocess,sys,threading
token=open(sys.argv[1],'rb').read()
rows=subprocess.check_output(['git','rev-list','--objects','--all']).splitlines()
ids=[line.split(b' ',1)[0] for line in rows]
p=subprocess.Popen(['git','cat-file','--batch'],stdin=subprocess.PIPE,stdout=subprocess.PIPE)
def write():
 for sha in ids: p.stdin.write(sha+b'\n')
 p.stdin.close()
t=threading.Thread(target=write,daemon=True);t.start()
bad=False
for sha in ids:
 h=p.stdout.readline().split()
 if len(h)<3 or not h[2].isdigit(): raise SystemExit('ABORT: unexpected git object')
 sz=int(h[2]);data=p.stdout.read(sz)
 if len(data)!=sz or p.stdout.read(1)!=b'\n': raise SystemExit('ABORT: truncated object')
 bad |= token in data
t.join();p.wait()
if bad or p.returncode: raise SystemExit('ABORT: leaked token still reachable')
print('Verified that credential is absent from all reachable rewritten objects.')
PY

# Preserve changed-ref metadata in the job log for the GitHub Support request.
if [[ -f filter-repo/changed-refs ]]; then
  echo "Affected PR references: $(grep -c '^refs/pull/.*/head$' filter-repo/changed-refs || true)"
fi
git remote add origin "$url" 2>/dev/null || true
git show-ref --heads --tags | awk '{print $1 "\t" $2}' | LC_ALL=C sort -k2,2 > "$tmp/after"
cut -f2 "$tmp/before" > "$tmp/names-before"
cut -f2 "$tmp/after" > "$tmp/names-after"
cmp -s "$tmp/names-before" "$tmp/names-after" || { echo 'ABORT: ref list changed' >&2; exit 3; }
git ls-remote --refs --heads --tags origin | LC_ALL=C sort -k2,2 > "$tmp/remote-now"
cmp -s "$tmp/before" "$tmp/remote-now" || { echo 'ABORT: concurrent writer detected' >&2; exit 3; }

# A single atomic compare-and-swap push protects against lost concurrent work.
# If GitHub declines atomic pushes, fail safely with no partial rewrite.
python3 - "$tmp/before" "$tmp/after" <<'PY'
import subprocess,sys
def load(p):
 return {ref:sha for sha,ref in (s.strip().split('\t') for s in open(p))}
old=load(sys.argv[1]);new=load(sys.argv[2])
if old.keys()!=new.keys(): raise SystemExit('ABORT: refs mismatch')
changed=sorted(ref for ref in old if old[ref]!=new[ref])
if not changed: raise SystemExit('ABORT: rewrite changed no refs')
cmd=['git','push','--atomic']
cmd.extend(f'--force-with-lease={r}:{old[r]}' for r in changed)
cmd.append('origin')
cmd.extend(f'{new[r]}:{r}' for r in changed)
print(f'Attempting guarded atomic rewrite of {len(changed)} branches/tags')
subprocess.run(cmd,check=True)
PY
git ls-remote --refs --heads --tags origin | LC_ALL=C sort -k2,2 > "$tmp/remote-after"
cmp -s "$tmp/after" "$tmp/remote-after" || { echo 'ABORT: remote changed after push' >&2; exit 4; }
echo 'Updated published branches and tags; GitHub Support must purge hidden PR refs, caches, and unreachable objects.'
echo 'Collaborators must re-clone/rebase; never merge unclean branches.'
