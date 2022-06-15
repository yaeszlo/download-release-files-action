const {getOctokit} = require("@actions/github");
const {writeFileSync} = require("fs");
const core = require('@actions/core');

const token = core.getInput('token');
const repository = core.getInput('repository');
const releaseName = core.getInput('release_name');
const fileName = core.getInput('file_name');
const excludeDraft = core.getInput('exclude_draft');
const excludePrerelease = core.getInput('exclude_prerelease');

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
      const releases = await getRepositoryReleases(owner, repo);
      foundRelease = findRelease(releaseName, releases);
    }

    core.info(`Found release name=${foundRelease.name}`);

    await findAndDownloadReleaseAssets(foundRelease, fileName);
  } catch (e) {
    core.error(e);
  }
}

async function findAndDownloadReleaseAssets(release, fileName) {
  const regex = new RegExp(fileName);
  const foundAssets = release.assets.filter(asset => asset.name.match(regex));

  if (!foundAssets.length) throw new Error(`No assets found using ${fileName}`);

  return Promise.all(foundAssets.map(downloadAsset));
}

function findRelease(releaseName, releases) {
  if (excludePrerelease) releases.filter(release => release.prerelease === false);
  if (excludeDraft) releases.filter(release => release.draft === false);

  return releases.find(release => release.name.match(releaseName));
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

run();