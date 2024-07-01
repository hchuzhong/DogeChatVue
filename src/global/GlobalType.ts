/* eslint-disable no-unused-vars */
export enum messageType {
    text = 'text',
    join = 'join',
    image = 'image',
    video = 'video',
    livePhoto = 'livePhoto',
    draw = 'draw',
    track = 'track',
    voice = 'voice',
    location = 'location',
    sticker = 'sticker',
    photo = 'photo'
}
/* eslint-enable */
export const messageTypeToChinese = {
    [messageType.text]: '文本',
    [messageType.join]: '撤回',
    [messageType.image]: '图片',
    [messageType.video]: '视频',
    [messageType.livePhoto]: '图片',
    [messageType.draw]: 'Draw',
    [messageType.track]: 'Tracks',
    [messageType.voice]: '语音',
    [messageType.location]: '位置',
    [messageType.sticker]: '表情符号',
    [messageType.photo]: '图片'
};

export type FriendMessageHistoryType = {
    current: number;
    pages: number;
    records: FriendMessageType[];
    size: number;
    total: number;
    userId: string;
};

export type FriendEmojisInfoType = {
    id: number;
    path: string;
    rotate: number;
    scale: number;
    locationX: number;
    locationY: number;
    lastModifiedBy: string;
    lastModifiedUserId: string;
};

export type FriendMessageType = {
    messageId: number;
    messageContent: string;
    // 0/1 表示是否已读
    messageStatus: number;
    messageSender: string;
    messageReceiver: string;
    messageSenderId: string;
    messageReceiverId: string;
    isGroup: string;
    messageTime: string;
    timeStamp: number;
    type: messageType;
    // 唯一 id, 考虑自己生成
    uuid: string;
    referMessageUuid: string;
    avatarUrl: string;
    emojis: FriendEmojisInfoType[];
    fontSize: number;
    referMessage?: Partial<FriendMessageType>;
    notifiedParty: {string: string}[];
    drawImage?: string;
};

export type FriendInfoType = {
    userId: string;
    username: string;
    avatarUrl: string;
    online: boolean;
    // 1 为 true, 0 为 false
    isGroup: string;
    nickName: string;
    isMuted: string;
    message: FriendMessageType;
    messageHistory: FriendMessageHistoryType;
    unreadMessageHistory: FriendMessageType[];

    password?: string;
    email?: string;
    createdTime?: null;
    roles?: null;
    authorities?: null;
};

export type SelfDataType = {
    avatarUrl: string;
    createdTime: string;
    data: string;
    email: string;
    online: boolean;
    track: string;
    userId: string;
    username: string;
};

export type EmojiType = {
    content: string;
    heat: number;
    starId: string;
    starTime: string;
    starType: string;
    type: string;
    userId: string;
    username: string;
};

export type FriendStoreType = {
    friendList: FriendInfoType[];
    unreadMessage: FriendMessageType[];
    friendListObj: {[key: string]: FriendInfoType};
    publicEmojiArr: EmojiType[];
    personalEmojiArr: EmojiType[];
};

export type userInfoType = {
    username: string;
    password: string;
    confirmPassword?: string;
    email?: string;
    validateCode?: number | string;
};

export type GroupMemberType = {
    authorities?: null;
    avatarUrl: string;
    backgroundImage?: null;
    createdTime?: string;
    data?: null;
    deviceType?: number;
    email?: string;
    nickName?: string;
    online?: boolean;
    password?: null;
    roles?: null;
    status?: null;
    token?: null;
    track?: null;
    userId: string;
    username: string;
    voipToken?: null;
};

export type RemoveMessageType = {
    id: number;
    isGroup: string;
    messageSenderId: string;
    messageReceiverId: string;
};

export type FriendRequestPostType = {
    // 自己
    requesterId: string;
    requester: string;
    // 对方
    requestedId: string;
    requested: string;
};

export type FriendRequestHistoryType = {
    friendRequestId: number;
    friendRequester: string;
    friendRequested: string;
    friendRequesterId: string;
    friendRequestedId: string;
    friendRequestStatus: number;
    requestTime: string;
    friendRequestedAvatarUrl: string;
    groupSize?: null;
    isGroup: string;
    groupId?: null;
    groupName?: null;
};

export type SaveStarDataType = {
    content: string;
    starTime: string;
    starType: string;
    type: string;
    userId: string;
    username: string;
}