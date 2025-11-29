import { Client, Events, GatewayIntentBits, Message, TextBasedChannel } from 'discord.js';
import Promise from 'bluebird';

import * as util from './util';
import config from './config.json';

// Type guard for channels that have a send method
type SendableChannel = TextBasedChannel & {
  send: (options: string | { content?: string; files?: any[] }) => Promise<any>;
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// If the command line argument 'test' is given, log in to the test account
const test = process.argv[2] === 'test';
const loginToken = test ? config.test_token : config.token;

const startDelim = 'latex$';
const endDelim = '$';

client.once(Events.ClientReady, () => {
  console.log('Hello world!');
});

client.login(loginToken).then(() => {
  // Logged in
});

client.on(Events.MessageCreate, (msg: Message) => {
  if (msg.author === client.user || msg.author.bot) {
    // make sure the bot doesn't respond to its own messages and bots
    return;
  }

  // Only process messages from sendable channels
  if (!msg.channel.isTextBased()) {
    return;
  }

  // TypeScript doesn't narrow properly after isTextBased(), so we assert
  // We know it's sendable because isTextBased() returned true
  const channel = msg.channel as SendableChannel;
  const content = msg.content ?? '';

  if (content.toLowerCase().startsWith('latex ')) {
    const tex = content.slice(6);
    util
      .typeset(tex)
      .then((image) => {
        util.attachImage(channel, image);
      })
      .catch((err) => {
        channel.send(String(err));
      });
  } else {
    const texStrings = content.split(startDelim);

    if (texStrings.length !== 1) {
      texStrings.shift();

      const promises = texStrings.map((elem) => {
        const end = elem.indexOf(endDelim);
        const tex = elem.slice(0, end);
        return util.typeset(tex);
      });

      Promise.all(promises)
        .then((images) => {
          util.attachImages(channel, images, 'LaTeX detected:');
        })
        .catch((err) => {
          channel.send(String(err));
        });
    }
  }
});


