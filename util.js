const { AttachmentBuilder } = require('discord.js');

// MathJax (mathjax-full) setup (render TeX -> SVG)
const { mathjax } = require('mathjax-full/js/mathjax.js');
const { TeX } = require('mathjax-full/js/input/tex.js');
const { SVG } = require('mathjax-full/js/output/svg.js');
const { liteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor.js');
const { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html.js');
const { AllPackages } = require('mathjax-full/js/input/tex/AllPackages.js');

// For converting SVG output from MathJax into PNG
const sharp = require('sharp');

// Set up a lite adaptor and MathJax document once at startup
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const texInput = new TeX({
    packages: AllPackages
});
const svgOutput = new SVG({ fontCache: 'none' });
const html = mathjax.document('', { InputJax: texInput, OutputJax: svgOutput });

// The colour to typeset in; gray works in both light and dark mode.
const typesetColour = 'gray';

/**
 * Typesets LaTeX using MathJax, into a base64-encoded PNG.
 *
 * @param tex The LaTeX text to typeset.
 * @return {Promise} A promise that resolves with the typeset PNG, or rejects with an error if there is one.
 */
module.exports.typeset = (tex) => {
    const math = `\\color{${typesetColour}}{${tex}}`;

    return (async () => {
        // Convert TeX -> SVG using MathJax
        const node = html.convert(math, { display: true });
        // Extract just the <svg> element; sharp expects an SVG root
        const svgNode = adaptor.firstChild(node);
        const svgString = adaptor.outerHTML(svgNode);

        // Convert SVG -> PNG buffer
        const image = await sharp(Buffer.from(svgString))
            .png()
            .toBuffer();

        return image;
    })();
};

/**
 * Sends one or more images, preceded by an optional message.
 *
 * @param channel The channel to send to.
 * @param images The images to send.
 * @param message The message to send, optional.
 */
module.exports.attachImages = (channel, images, message = false) => {
    const files = images.map((elem, index) => new AttachmentBuilder(elem, { name: `file${index}.png` }));
    if (!message) {
        channel.send({ files });
    } else {
        channel.send({ content: message, files });
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