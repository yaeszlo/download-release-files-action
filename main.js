const {getOctokit} = require("@actions/github");
const core = require('@actions/core');

const token = core.getInput('token');
const repository = core.getInput('repository');

const octokit = getOctokit(token);

async function start() {
  const [owner, repo] = repository.split('/')

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
    console.log(releases);
  } catch (e) {
    console.log(e);
  }

}

start();