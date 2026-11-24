/** Hỏi Workspace: user có được vào channel này không (chống IDOR khi subscribe realtime) */
export abstract class MembershipPort {
  abstract canAccessChannel(userId: string, channelId: string): Promise<boolean>;
}
