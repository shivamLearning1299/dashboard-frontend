import type { ApiFetch } from "@/lib/api/fetchJson";
import { fetchJson } from "@/lib/api/fetchJson";

export interface ChannelSummary {
  id: string;
  kind: "CHANNEL" | "DM";
  name: string;
  description: string | null;
  unreadCount: number;
}

export interface ChannelsResponse {
  channels: ChannelSummary[];
  directMessages: ChannelSummary[];
}

export interface MessageDto {
  id: string;
  senderType: "USER" | "AI" | "SYSTEM";
  senderEmail: string | null;
  text: string;
  aiTag: string | null;
  resultJson: { caption: string; rows: { label: string; value: string }[] } | null;
  createdAt: string;
}

export interface AskAiResponse {
  userMessage: MessageDto;
  aiMessage: MessageDto;
}

export function getChannels(apiFetch: ApiFetch) {
  return fetchJson<ChannelsResponse>(apiFetch, "/channels");
}

export function getMessages(apiFetch: ApiFetch, channelId: string) {
  return fetchJson<MessageDto[]>(apiFetch, `/channels/${channelId}/messages`);
}

export function sendMessage(apiFetch: ApiFetch, channelId: string, text: string) {
  return fetchJson<MessageDto>(apiFetch, `/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function askAi(apiFetch: ApiFetch, channelId: string, text: string) {
  return fetchJson<AskAiResponse>(apiFetch, `/channels/${channelId}/ask-ai`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
