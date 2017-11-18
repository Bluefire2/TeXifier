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
const test = process.argv[2] === 'test',
    loginToken = test ? config.test_token : config.token;

const startDelim = 'latex$',
    endDelim = '$',
    typesetColour = 'white';

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
    if (msg.author === client.user || msg.author.bot) {
        // make sure the bot doesn't respond to its own messages and bots

    } else if(msg.content.toLowerCase().startsWith('latex ')) {
        const tex = msg.content.slice(6);
        typeset(tex).then(image => {
            attachImage(msg.channel, image);
        }).catch(err => {
            msg.channel.send(err);
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
                    }).catch(err => {
                        msg.channel.send(err);
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