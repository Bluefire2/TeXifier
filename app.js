const mjAPI = require("mathjax-node-svg2png");
const Discord = require('discord.js');
const Attachment = Discord.Attachment;
const client = new Discord.Client();
const Promise = require('bluebird');

const config = require('./config.json');

const loginToken = config.token;
const startDelim = 'latex$',
    endDelim = '$',
    typesetColour = 'lightgray';

client.on('ready', () => {
    console.log('Hello world!');
});

client.login(loginToken).then(() => {

});

client.on('message', msg => {
    if (msg.author === client.user) {
        // make sure the bot doesn't respond to its own messages

    } else {
        const texStrings = msg.content.split(startDelim);

        if(texStrings.length !== 1) {
            texStrings.shift();
            let i = 0;
            const images = [];

            new Promise((resolve, reject) => {
                texStrings.map(elem => {
                    const end = elem.indexOf(endDelim),
                        rawTex = elem.slice(0, end);

                    const options = {
                        math: `\\color{${typesetColour}{${rawTex}}`, //add colour
                        format: 'TeX',
                        png: true
                    };

                    mjAPI.config({
                        MathJax: {
                            // traditional MathJax configuration
                        }
                    });
                    mjAPI.start();

                    mjAPI.typeset(options, result => {
                        console.log(result.png.indexOf('data:image/png;base64'), 0, 'PNG data-uri header');
                        console.log(result.png.length > 100, 'PNG data length');
                        console.log(result.png);

                        const pngString = result.png.replace(/^data:image\/png;base64,/, ""),
                            image = Buffer.from(pngString, 'base64');

                        images.push(image);
                        resolve()

                    });

                    i++;
                });
            }).then(() => {
                msg.channel.send('LaTeX detected:');

                images.forEach(image => {
                    msg.channel.send({files: [new Attachment(image, 'file.png')]});
                });
            });
        }
    }
});