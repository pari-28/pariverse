import express from "express";
import cors from "cors";
import path from "path";
import axios from "axios";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- Platform Fetchers ---

async function fetchGitHubStats(username: string) {
  const token = process.env.GITHUB_TOKEN;
  const headers: any = {
    'Accept': 'application/vnd.github.v3+json'
  };
  if (token) headers['Authorization'] = `token ${token}`;
  
  try {
    const [userRes, reposRes] = await Promise.all([
      axios.get(`https://api.github.com/users/${username}`, { headers }),
      axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers })
    ]);

    const userData = userRes.data;
    const reposData = reposRes.data;

    const totalStars = reposData.reduce((acc: number, repo: any) => acc + repo.stargazers_count, 0);
    const topRepos = reposData.slice(0, 5).map((r: any) => ({
      name: r.name,
      stars: r.stargazers_count,
      language: r.language,
      url: r.html_url
    }));

    // Try to get total commits (requires specific header)
    let totalCommits = 0;
    try {
      const commitRes = await axios.get(`https://api.github.com/search/commits?q=author:${username}`, {
        headers: {
          ...headers,
          'Accept': 'application/vnd.github.cloak-preview'
        }
      });
      totalCommits = commitRes.data.total_count || 0;
    } catch (e) {
      console.warn("Could not fetch total commits via search API (likely rate limited or no token)");
    }
    
    console.log(`GitHub fetch success for ${username}`);

    // Fetch activity for heatmap
    let activity: any = {};
    try {
      const activityRes = await axios.get(`https://api.github.com/users/${username}/events/public?per_page=100`, { headers });
      activityRes.data.forEach((event: any) => {
        const date = event.created_at.split('T')[0];
        activity[date] = (activity[date] || 0) + 1;
      });
    } catch (e) {
      console.warn("Could not fetch GitHub activity for heatmap");
    }

    return {
      platform: 'github',
      username,
      bio: userData.bio,
      avatar_url: userData.avatar_url,
      total_repos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      stars: totalStars,
      public_gists: userData.public_gists,
      updated_at: userData.updated_at,
      repos: topRepos,
      location: userData.location,
      blog: userData.blog,
      total_commits: totalCommits,
      contributions: totalCommits > 0 ? `${totalCommits} Contributions` : "Sync Active",
      activity // Daily counts for the last ~30 days
    };
  } catch (error: any) {
    console.error(`GitHub fetch error for ${username}: ${error.message}`);
    if (error.response?.status === 404) throw new Error('GitHub user not found');
    if (error.response?.status === 403) throw new Error('GitHub API rate limit exceeded');
    throw new Error('GitHub sync failed');
  }
}

async function fetchLeetCodeStats(username: string) {
  const query = `
    query userSessionProgress($username: String!) {
      allQuestionsCount {
        difficulty
        count
      }
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        profile {
          ranking
          reputation
          starRating
        }
      }
      userContestRanking(username: $username) {
        attendedContestsCount
        rating
        globalRanking
        totalParticipants
        topPercentage
      }
    }
  `;

  try {
    const response = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { username }
    });

    const data = response.data.data;
    if (!data.matchedUser) throw new Error('User not found');

    return {
      platform: 'leetcode',
      username,
      total_solved: data.matchedUser.submitStats.acSubmissionNum[0].count,
      easy_solved: data.matchedUser.submitStats.acSubmissionNum[1].count,
      medium_solved: data.matchedUser.submitStats.acSubmissionNum[2].count,
      hard_solved: data.matchedUser.submitStats.acSubmissionNum[3].count,
      ranking: data.matchedUser.profile.ranking,
      contest_rating: Math.round(data.userContestRanking?.rating || 0),
      global_ranking: data.userContestRanking?.globalRanking || 0,
    };
  } catch (error: any) {
    console.error(`LeetCode fetch error: ${error.message}`);
    throw new Error('LeetCode sync failed');
  }
}

async function fetchCodeforcesStats(username: string) {
  if (!username || username.trim() === "") {
    throw new Error('Codeforces handle is required');
  }
  
  const handle = encodeURIComponent(username.trim());
  
  try {
    const [infoRes, ratingRes] = await Promise.all([
      axios.get(`https://codeforces.com/api/user.info?handles=${handle}`),
      axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`).catch(e => {
        console.warn(`Codeforces rating fetch failed for ${handle} (user may have no contests): ${e.message}`);
        return { data: { status: 'FAILED', result: [] } };
      })
    ]);

    if (infoRes.data.status !== 'OK') throw new Error('User info failed');

    const userInfo = infoRes.data.result[0];
    const latestRating = ratingRes.data.status === 'OK' && ratingRes.data.result.length > 0
      ? ratingRes.data.result[ratingRes.data.result.length - 1].newRating
      : userInfo.rating || 0;

    return {
      platform: 'codeforces',
      username: handle,
      rating: latestRating,
      max_rating: userInfo.maxRating || 0,
      rank: userInfo.rank || 'unrated',
      max_rank: userInfo.maxRank || 'unrated',
      contribution: userInfo.contribution || 0,
      lastOnline: userInfo.lastOnlineTimeSeconds * 1000
    };
  } catch (error: any) {
    console.error(`Codeforces fetch error for ${username}: ${error.message}`);
    if (error.response?.status === 400) throw new Error('Codeforces handle invalid or API error 400');
    throw new Error('Codeforces sync failed');
  }
}

// --- API Routes ---

app.post("/api/sync-profiles", async (req, res) => {
  const { platforms } = req.body; // e.g. { github: 'pari-28', leetcode: 'pari-28' }
  const results: any = {};
  const errors: any = {};

  const syncTasks = Object.entries(platforms).map(async ([platform, username]) => {
    try {
      if (platform === 'github') results.github = await fetchGitHubStats(username as string);
      if (platform === 'leetcode') results.leetcode = await fetchLeetCodeStats(username as string);
      if (platform === 'codeforces') results.codeforces = await fetchCodeforcesStats(username as string);
    } catch (error: any) {
      errors[platform] = error.message;
    }
  });

  await Promise.all(syncTasks);

  res.json({
    success: Object.keys(errors).length === 0,
    results,
    errors,
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
