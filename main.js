const {getOctokit} = require("@actions/github");
const core = require('@actions/core');
const fetch = require("node-fetch");

const token = core.getInput('token');
const repository = core.getInput('repository');

const octokit = getOctokit(token);

async function start() {
  const [owner, repo] = repository.split('/');

  console.log(repository);
  console.log(repo);
  console.log(owner);
  console.log(token.length);

  try {
    const releases = await octokit.rest.repos.listReleases({
      repo: repo,
      owner: owner,
      per_page: 100,
    });
    console.log('=====================direct assets==================')
    console.log(releases[0].assets);


    console.log('==============================URL ASSETS=============================')
    const assets = await request(releases.data[0].assets_url);
    console.log(assets);
  } catch (e) {
    console.log(e);
  }

}

async function request(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${token}`
    }
  });
  return response.json();
}

start();