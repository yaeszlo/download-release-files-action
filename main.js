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
      core.info(`Looking for matching releases ${releaseName}`);
      const releases = await getRepositoryReleases(owner, repo);
      foundRelease = findRelease(releaseName, releases);
    }

    if (!foundRelease) {
      core.error(`No release matches ${releaseName}`);
    } else {
      core.info(`Found release name=${foundRelease.name}`);
    }

    await findAndDownloadReleaseAssets(foundRelease, fileName);
  } catch (e) {
    console.log(e);
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
  let filteredReleases = releases
  if (excludePrerelease) {
    filteredReleases = filteredReleases.filter(release => release.prerelease === false);
    core.info(`Filtered prereleases... New size: ${filteredReleases.length}`)
  }
  if (excludeDraft) {
    filteredReleases = filteredReleases.filter(release => release.draft === false);
    core.info(`Filtered drafts... New size: ${filteredReleases.length}`)
  }

  const regex = new RegExp(releaseName);
  return filteredReleases.find(release => release.name.match(regex));
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