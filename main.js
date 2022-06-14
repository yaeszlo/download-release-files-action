const {getOctokit} = require("@actions/github");
const {createWriteStream} = require("fs");
const core = require('@actions/core');
const fetch = require("node-fetch");

const token = core.getInput('token');
const repository = core.getInput('repository');
const releaseName = core.getInput('release_name');
const fileName = core.getInput('file_name');

const octokit = getOctokit(token);
const workingDir = process.cwd();

async function run() {
  try {
    const releases = await getRepositoryReleases(repository);
    const foundRelease = findRelease(releases, releaseName);

    await findAndDownloadReleaseAssets(foundRelease, fileName);
  } catch (e) {
    console.log(e);
  }
}

async function findAndDownloadReleaseAssets(release, fileName) {
  const foundAssets = release.assets.filter(asset => asset.name.match(fileName));
  console.log(foundAssets);
  return Promise.all(foundAssets.map(downloadAsset));
}

function findRelease(releases, releaseName) {
  if (!releaseName) {
    return releases.find(release => release.latest);
  }
  return releases.find(release => release.name.match(releaseName));
}

async function getRepositoryReleases(repository) {
  const [owner, repo] = repository.split('/');

  const response = await octokit.rest.repos.listReleases({
    repo: repo,
    owner: owner,
    per_page: 100,
  });

  return response.data;
}

async function downloadAsset(asset) {
  const assetName = asset.name;
  const assetUrl = asset.url;
  const response = await fetch(assetUrl, {
    headers: {Authorization: `token ${token}`},
  });

  const buffer = await response.buffer();

  return new Promise(resolve => {
    createWriteStream(`${workingDir}/${assetName}`).write(buffer, resolve);
  })
}

run();