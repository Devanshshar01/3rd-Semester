import { AccessToken, TrackSource } from 'livekit-server-sdk'

export async function issueRoomToken(input: { userId: string; name: string; roomName: string; publishAudio: boolean; publishVideo: boolean; canPublishData: boolean }) {
  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) throw Object.assign(new Error('LiveKit is not configured'), { status: 503, code: 'LIVEKIT_UNAVAILABLE' })
  const ttlSeconds = 15 * 60
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity: input.userId, name: input.name, ttl: ttlSeconds })
  token.addGrant({ roomJoin: true, room: input.roomName, canPublish: input.publishAudio || input.publishVideo, canPublishSources: [ ...(input.publishAudio ? [TrackSource.MICROPHONE] : []), ...(input.publishVideo ? [TrackSource.CAMERA, TrackSource.SCREEN_SHARE] : []) ], canSubscribe: true, canPublishData: input.canPublishData })
  return { token: await token.toJwt(), url: LIVEKIT_URL, expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString() }
}
