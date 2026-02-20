'use strict';

function clean(value) {
  return (value || '').toString().trim();
}

function buildCodeforcesTargets({ contestId, problemIndex }) {
  const contest = clean(contestId);
  const index = clean(problemIndex).toUpperCase();
  if (!contest || !index) {
    return {
      ok: false,
      error: 'Codeforces requires both contest ID and problem index (for example: 2000, A).',
    };
  }
  return {
    ok: true,
    platform: 'codeforces',
    problemUrl: `https://codeforces.com/contest/${contest}/problem/${index}`,
    submitUrl: `https://codeforces.com/contest/${contest}/submit`,
    statusUrl: `https://codeforces.com/contest/${contest}/my`,
  };
}

function buildUsacoTargets({ cpid }) {
  const cleanCpid = clean(cpid);
  const problemUrl = cleanCpid
    ? `https://usaco.org/index.php?page=viewproblem2&cpid=${cleanCpid}`
    : 'https://usaco.org/index.php?page=contests';

  return {
    ok: true,
    platform: 'usaco',
    problemUrl,
    submitUrl: 'https://usaco.org/index.php?page=contests',
    statusUrl: 'https://usaco.org/index.php?page=history',
  };
}

function buildSubmissionTargets({ platform, contestId, problemIndex, cpid }) {
  const kind = clean(platform).toLowerCase();
  if (kind === 'codeforces') {
    return buildCodeforcesTargets({ contestId, problemIndex });
  }
  if (kind === 'usaco') {
    return buildUsacoTargets({ cpid });
  }
  return { ok: false, error: `Unsupported platform: ${platform}` };
}

module.exports = { buildSubmissionTargets };
