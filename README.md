# RoboSnap Project Page

This directory is the static website intended for `https://robosnap.github.io/`.

## Local Preview

Run a local HTTP server from this directory:

```bash
python3 -m http.server 8892
```

Then open:

```text
http://127.0.0.1:8892/index.html
```

The interactive 3D viewers require HTTP and will not load correctly from a `file://` URL.

## Pre-Deploy Audit

Run this before publishing:

```bash
node scripts/audit-assets.js
```

The script checks:

- no symlinks under `web/`
- all local page/viewer asset references resolve inside `web/`
- no referenced local asset points outside `web/`
- files above the GitHub single-file risk threshold

As of the current local build, all referenced assets are local to `web/` and there are no symlinks. The remaining deploy blocker is the Gaussian splat PLY files, which are larger than GitHub's ordinary 100 MiB file limit.

## GitHub Pages Target

For the final URL to be:

```text
https://robosnap.github.io/
```

the GitHub account or organization must be named `robosnap`, and the repository must be named:

```text
robosnap.github.io
```

Push the contents of this `web/` directory to the repository's default branch. Keep `.nojekyll` in the root so GitHub Pages serves the static asset tree as-is.

## Gaussian PLY Hosting

Most images, PDFs, GLBs, and videos can stay in this repository. The seven Gaussian splat PLY files are each about 125 MiB:

```text
static/robosnap/gaussian/scene03_splats.ply
static/robosnap/gaussian/scene05_splats.ply
static/robosnap/gaussian/scene07_splats.ply
static/robosnap/gaussian/scene09_splats.ply
static/robosnap/gaussian/scene10_splats.ply
static/robosnap/gaussian/scene12_splats.ply
static/robosnap/gaussian/scene14_splats.ply
```

Do not commit these PLY files directly to ordinary GitHub history unless they are converted or externally hosted.

Recommended practical setup: host only these seven PLY files in a public Hugging Face Dataset repo, then let the viewer fetch them from the dataset's raw `resolve` URLs.

Create a Hugging Face Dataset repo, for example:

```text
YOUR_NAME/robosnap-assets
```

Upload the PLY files under this path in the dataset:

```text
gaussian/scene03_splats.ply
gaussian/scene05_splats.ply
gaussian/scene07_splats.ply
gaussian/scene09_splats.ply
gaussian/scene10_splats.ply
gaussian/scene12_splats.ply
gaussian/scene14_splats.ply
```

If browser upload fails, use the Hugging Face CLI instead. Install and login:

```bash
curl -LsSf https://hf.co/cli/install.sh | bash
hf auth login
```

Then upload the local Gaussian folder:

```bash
scripts/upload-gaussian-hf.sh YOUR_NAME/robosnap-assets
```

The script uploads `static/robosnap/gaussian` into the dataset path `gaussian/` and prints the base URL.

Then set the public directory URL in `static/robosnap/viewers/asset-config.js`:

```js
window.ROBOSNAP_GAUSSIAN_BASE = "https://huggingface.co/datasets/YOUR_NAME/robosnap-assets/resolve/main/gaussian";
```

The viewer will keep using local PLY files when the value is empty, which is convenient for local preview. In production it will load the same filenames from the external base URL.

There is a checksum manifest at `static/robosnap/gaussian/manifest.json`. Use it to verify the uploaded filenames, sizes, and SHA256 hashes.

After uploading, verify that the hosted files are readable by the project page:

```bash
node scripts/check-gaussian-host.js https://huggingface.co/datasets/YOUR_NAME/robosnap-assets/resolve/main/gaussian
```

The local PLY files are ignored by `.gitignore` so they are not accidentally committed to the GitHub Pages repository.
