const {getOctokit} = require("@actions/github");
const core = require('@actions/core');

const token = core.getInput('token');
const repository = core.getInput('repository');
const resultsPerPage = +core.getInput('results_per_page');
const page = +core.getInput('page');

const octokit = getOctokit(token);

async function start() {
  const [ repo, owner ] = repository.split('/')

  console.log(repository);
  console.log(repo);
  console.log(owner);
  console.log(token.length);

  const releases = await octokit.repos.listReleases({
    repo: repo,
    owner: owner,
    per_page: resultsPerPage,
    page: page
  });

  console.log(releases);
}

start();