const {getOctokit} = require("@actions/github");
const {writeFileSync} = require("fs");
const core = require('@actions/core');
const fetch = require("node-fetch");

const token = core.getInput('token');
const repository = core.getInput('repository');
const releaseName = core.getInput('release_name');
const fileName = core.getInput('file_name');

const [owner, repo] = repository.split('/');
const octokit = getOctokit(token);
const workingDir = process.cwd();

async function run() {
  try {
    const releases = await getRepositoryReleases(repository);
    const foundRelease = findRelease(releaseName, releases);

    await findAndDownloadReleaseAssets(foundRelease, fileName);
  } catch (e) {
    console.log(e);
  }
}

async function findAndDownloadReleaseAssets(release, fileName) {
  const regex = new RegExp(fileName);
  const foundAssets = release.assets.filter(asset => asset.name.match(regex));

  if (!foundAssets.length) throw new Error(`No assets found using ${fileName}`)

  return Promise.all(foundAssets.map(downloadAsset));
}

function findRelease(releaseName, releases) {
  if (!releaseName) {
    return releases.find(release => release.latest);
  }
  return releases.find(release => release.name.match(releaseName));
}

async function getRepositoryReleases(repo, owner) {
  const response = await octokit.rest.repos.listReleases({
    repo,
    owner,
    per_page: 100,
  });

  return response.data;
}

async function downloadAsset(asset) {
  const assetName = asset.name;

  const response = await getOctokit(token).rest.repos.getReleaseAsset({
    owner,
    repo,
    asset_id: asset.id,
    headers: {
      Accept: 'application/octet-stream'
    }
  });

  writeFileSync(`${workingDir}/${assetName}`, new DataView(response.data));
}

run();