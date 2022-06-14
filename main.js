const {getOctokit} = require("@actions/github");
const {pipeline} = require("stream/promises");
const {createWriteStream} = require("fs");
const {cwd} = require('node:process');
const core = require('@actions/core');
const fetch = require("node-fetch");

const token = core.getInput('token');
const repository = core.getInput('repository');
const releaseName = core.getInput('release_name');
const fileName = core.getInput('file_name');

const octokit = getOctokit(token);
const workingDir = cwd();

async function run() {
  try {
    const releases = await getRepositoryReleases(repository);
    const foundRelease = findRelease(releases, releaseName);

    await findAndDownloadReleaseAssets(foundRelease);
  } catch (e) {
    console.log(e);
  }
}

async function findAndDownloadReleaseAssets(release, fileName) {
  const foundAssets = release.assets.filter(asset => asset.name.match(fileName));
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

  return octokit.rest.repos.listReleases({
    repo: repo,
    owner: owner,
    per_page: 100,
  });
}

async function downloadAsset(asset) {
  const assetName = asset.name;
  const assetUrl = asset.url;
  return pipeline((await fetch(assetUrl)).body, createWriteStream(`${workingDir}/${assetName}`));
}

run();