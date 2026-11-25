export default () => ({
  port: Number(process.env.PORT ?? 3003),
  appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3003',
  github: {
    clientId: process.env.GITHUB_CLIENT_ID ?? '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    redirectUri:
      process.env.GITHUB_REDIRECT_URI ??
      'http://localhost:3003/integrations/github/callback',
    scopes: (process.env.GITHUB_OAUTH_SCOPES ?? 'repo read:user').split(' '),
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET ?? '',
  },
  jira: {
    clientId: process.env.JIRA_CLIENT_ID ?? '',
    clientSecret: process.env.JIRA_CLIENT_SECRET ?? '',
    redirectUri:
      process.env.JIRA_REDIRECT_URI ??
      'http://localhost:3003/integrations/jira/callback',
    siteUrl:
      process.env.JIRA_SITE_URL ?? 'https://3004nguyenthanhdat.atlassian.net',
    scopes: (
      process.env.JIRA_OAUTH_SCOPES ??
      'read:jira-user read:jira-work write:jira-work manage:jira-webhook offline_access'
    ).split(' '),
    webhookSecret: process.env.JIRA_WEBHOOK_SECRET ?? '',
    writebackEnabled: process.env.JIRA_WRITEBACK_ENABLED === 'true',
  },
});
