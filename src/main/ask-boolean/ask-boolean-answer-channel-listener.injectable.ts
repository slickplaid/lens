/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import askBooleanAnswerChannelInjectable from "../../common/ask-boolean/ask-boolean-answer-channel.injectable";
import askBooleanPromiseInjectable from "./ask-boolean-promise.injectable";
import { getMessageChannelListenerInjectable } from "../../common/utils/channel/message-channel-listener-injection-token";

const askBooleanAnswerChannelListenerInjectable = getMessageChannelListenerInjectable(askBooleanAnswerChannelInjectable, (di) => {
  return ({ id, value }) => {
    const answerPromise = di.inject(askBooleanPromiseInjectable, id);

    answerPromise.resolve(value);
  };
});

export default askBooleanAnswerChannelListenerInjectable;
