const mjAPI = require("mathjax-node-svg2png");
mjAPI.config({
    MathJax: {
        // traditional MathJax configuration
    }
});
mjAPI.start();

const Discord = require('discord.js');
const Attachment = Discord.Attachment;
const client = new Discord.Client();
const Promise = require('bluebird');

const config = require('./config.json');

// If the command line argument 'test' is given, log in to the test account
const test = process.argv[2] === 'test';
const loginToken = test ? config.test_token : config.token;

const startDelim = 'latex$',
    endDelim = '$',
    typesetColour = 'lightgray';

const typeset = (tex) => {
    return new Promise((resolve, reject) => {
        const options = {
            math: `\\color{${typesetColour}}{${tex}}`, //add colour
            format: 'TeX',
            png: true
        };

        mjAPI.typeset(options, result => {
            if (!result.errors) {
                const pngString = result.png.replace(/^data:image\/png;base64,/, ""),
                    image = Buffer.from(pngString, 'base64');

                resolve(image);
            } else {
                reject(result.errors);
            }
        });
    });
};

const attachImage = (channel, image) => {
    channel.send({files: [new Attachment(image, 'file.png')]});
};

client.on('ready', () => {
    console.log('Hello world!');
});

client.login(loginToken).then(() => {

});

client.on('message', msg => {
    if (msg.author === client.user) {
        // make sure the bot doesn't respond to its own messages

    } else if(msg.content.startsWith('latex ')) {
        const tex = msg.content.slice(6);
        typeset(tex).then(image => {
            attachImage(msg.channel, image);
        });
    } else {
        const texStrings = msg.content.split(startDelim);

        if(texStrings.length !== 1) {
            texStrings.shift();
            let i = 0;
            const images = [],
                amt = texStrings.length;

            new Promise((resolve, reject) => {
                texStrings.map(elem => {
                    const end = elem.indexOf(endDelim),
                        tex = elem.slice(0, end);

                    typeset(tex).then(image => {
                        images.push(image);
                        if(++i === amt) {
                            resolve();
                        }
                    });
                });
            }).then(() => {
                msg.channel.send('LaTeX detected:');

                images.forEach(image => {
                    attachImage(msg.channel, image);
                });
            });
        }
    }
});