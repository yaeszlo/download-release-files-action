const github = require("@actions/github");
const {getOctokit, context} = require("@actions/github");
const core = require('@actions/core');

const token = core.getInput('token');
const repository = core.getInput('repository');
const owner = core.getInput('owner');
const resultsPerPage = +core.getInput('results_per_page');
const page = +core.getInput('page');

const octokit = getOctokit(github.token);

async function start() {
  const releases = await octokit.repos.listReleases({
    repo: repository ?? context.repo.repo,
    owner: owner ?? context.repo.owner,
    per_page: resultsPerPage,
    page: page
  });

  console.log(releases);
}

start();