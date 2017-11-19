const Discord = require('discord.js');
const Attachment = Discord.Attachment;
const mjAPI = require("mathjax-node-svg2png");

mjAPI.config({
    MathJax: {
        // traditional MathJax configuration
    }
});
mjAPI.start();

// The colour to typeset in; white looks best in Discord imo.
const typesetColour = 'white';

/**
 * Typesets LaTeX using MathJax, into a base64-encoded PNG.
 *
 * @param tex The LaTeX text to typeset.
 * @return {Promise} A promise that resolves with the typeset PNG, or rejects with an error if there is one.
 */
module.exports.typeset = (tex) => {
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

/**
 * Sends one or more images, preceded by an optional message.
 *
 * @param channel The channel to send to.
 * @param images The images to send.
 * @param message The message to send, optional.
 */
module.exports.attachImages = (channel, images, message = false) => {
    const files = images.map((elem, index) => new Attachment(elem, `file${index}.png`));
    console.log(files);
    if(!message) {
        channel.send({files: files});
    } else {
        channel.send(message, {files: files});
    }
};

/**
 * Sends an image, preceded by an optional message.
 *
 * @param channel The channel to send to.
 * @param image The image to send.
 * @param message The message to send, optional.
 */
module.exports.attachImage = (channel, image, message = false) => {
    module.exports.attachImages(channel, [image], message);
};