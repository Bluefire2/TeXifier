import { AttachmentBuilder, TextBasedChannel } from 'discord.js';

// Type for channels that have a send method
type SendableChannel = TextBasedChannel & {
  send: (options: string | { content?: string; files?: any[] }) => Promise<any>;
};

// MathJax (mathjax-full) setup (render TeX -> SVG)
import { mathjax } from 'mathjax-full/js/mathjax';
import { TeX } from 'mathjax-full/js/input/tex';
import { SVG } from 'mathjax-full/js/output/svg';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages';

// For converting SVG output from MathJax into PNG
import sharp from 'sharp';

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
 * Typesets LaTeX using MathJax, into a PNG buffer.
 *
 * @param tex The LaTeX text to typeset.
 * @return A promise that resolves with the typeset PNG buffer.
 */
export const typeset = async (tex: string): Promise<Buffer> => {
  const math = `\\color{${typesetColour}}{${tex}}`;

  // Convert TeX -> SVG using MathJax
  const node = html.convert(math, { display: true });
  // Extract just the <svg> element; sharp expects an SVG root
  const svgNode = adaptor.firstChild(node) as any;
  const svgString = adaptor.outerHTML(svgNode);

  // Convert SVG -> PNG buffer
  const image = await sharp(Buffer.from(svgString))
    .png()
    .toBuffer();

  return image;
};

/**
 * Sends one or more images, preceded by an optional message.
 *
 * @param channel The channel to send to.
 * @param images The images to send.
 * @param message The message to send, optional.
 */
export const attachImages = (
  channel: SendableChannel,
  images: Buffer[],
  message: string | false = false
): void => {
  const files = images.map(
    (elem, index) => new AttachmentBuilder(elem, { name: `file${index}.png` })
  );
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
export const attachImage = (
  channel: SendableChannel,
  image: Buffer,
  message: string | false = false
): void => {
  attachImages(channel, [image], message);
};


