export interface Channel {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface ChannelMessageReceive {
  content: string;
  author: string;
}

export interface ChannelMessage extends ChannelMessageReceive {
  createdAt: string;
  id: string;
  channel_id: string;
}

export interface ChannelMember {
  username: string;
  status: string;
  createdAt: string;
  id: string;
}
