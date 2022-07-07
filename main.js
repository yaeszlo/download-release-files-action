const {getOctokit} = require("@actions/github");
const {writeFileSync} = require("fs");
const core = require('@actions/core');

const token = core.getInput('token');
const repository = core.getInput('repository');
const releaseName = escapeRegex(core.getInput('release_name'));
const fileName = escapeRegex(core.getInput('file_name'));

const [owner, repo] = repository.split('/');
const octokit = getOctokit(token);
const workingDir = process.cwd();

async function run() {
  try {
    let foundRelease;
    if (!releaseName) {
      foundRelease = await getLatestRelease(owner, repo);
      core.info('Got latest release');
    } else {
      core.info(`Looking for matching releases ${releaseName}`);
      const releases = await getRepositoryReleases(owner, repo);
      foundRelease = findRelease(releaseName, releases);
    }

    if (!foundRelease) {
      throw new Error(`No release matches ${releaseName}`);
    } else {
      core.info(`Found release name=${foundRelease.name}`);
    }

    await findAndDownloadReleaseAssets(foundRelease, fileName);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

async function findAndDownloadReleaseAssets(release, fileName) {
  const regex = new RegExp(fileName);
  const foundAssets = release.assets.filter(asset => asset.name.match(regex));

  if (!foundAssets.length) throw new Error(`No assets found using ${fileName}`);

  return Promise.all(foundAssets.map(downloadAsset));
}

function findRelease(releaseName, releases) {
  core.info(`All found releases: ${releases.length}`)

  const regex = new RegExp(releaseName);
  return releases.find(release => release.name.match(regex));
}

async function getRepositoryReleases(owner, repo) {
  const response = await octokit.rest.repos.listReleases({
    repo: repo,
    owner: owner,
    per_page: 100,
  });

  return response.data;
}

async function getLatestRelease(owner, repo) {
  const response = await octokit.rest.repos.getLatestRelease({
    owner: owner,
    repo: repo,
  });

  return response.data;
}

async function downloadAsset(asset) {
  const assetName = asset.name;

  core.info(`Downloading asset ${assetName}...`);
  const response = await octokit.rest.repos.getReleaseAsset({
    repo: repo,
    owner: owner,
    asset_id: asset.id,
    headers: {
      Accept: 'application/octet-stream'
    }
  });

  writeFileSync(`${workingDir}/${assetName}`, new DataView(response.data));
  core.info(`Done downloading ${assetName}`);
}

function escapeRegex(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

run();