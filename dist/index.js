"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const node_fetch_1 = __importDefault(require("node-fetch"));
const bot = new telegraf_1.Telegraf("");
bot.start((ctx) => {
    ctx.reply('Hello ' + ctx.from.first_name + '!');
});
bot.help((ctx) => {
    ctx.reply('Send /start to receive a greeting');
});
bot.on('inline_query', async (ctx) => {
    if (ctx.inlineQuery.query == " ") {
        return;
    }
    let mainurl = `https://habr.com`;
    let url = `${mainurl}/ru/search/?q=${ctx.inlineQuery.query.trim().replace(" ", "%20")}`;
    let ansRes = new Array();
    await getContent(url).then(result => {
        let articleBody;
        const dom = new JSDOM(result.content);
        const articlesList = dom.window.document.getElementsByTagName("article");
        for (const elem of articlesList) {
            const articleHeader = [...[...elem.getElementsByTagName("h2")][0].getElementsByTagName("a")];
            const articleLink = mainurl + articleHeader[0].href;
            if (articleHeader[0] === undefined) {
                console.log("broken header: " + articlesList);
                return;
            }
            const articleName = articleHeader[0].textContent;
            if ([...elem.getElementsByClassName("article-formatted-body article-formatted-body article-formatted-body_version-1")][0] === undefined) {
                articleBody = [...elem.getElementsByClassName("article-formatted-body article-formatted-body article-formatted-body_version-2")][0];
            }
            else {
                articleBody = [...elem.getElementsByClassName("article-formatted-body article-formatted-body article-formatted-body_version-1")][0];
            }
            if (articleBody === undefined) {
                console.log("empty: " + articleLink);
                continue;
            }
            if (articleBody.querySelector('pre') != null) {
                articleBody.querySelectorAll('pre').forEach(del => {
                    del.remove();
                });
            }
            if (articleBody.querySelector('br') != null) {
                articleBody.querySelectorAll('br').forEach(del => {
                    del.remove();
                });
            }
            let articleDescription = articleBody.textContent.replaceAll("\n", '');
            if (articleDescription.length > 500) {
                articleDescription = articleDescription.slice(0, 500).trim() + '...';
            }
            ansRes.push({
                name: articleName,
                text: articleDescription,
                link: articleLink,
            });
        }
    });
    const output = ansRes.map((elem, index) => {
        return {
            type: 'article',
            id: String(index),
            title: elem.name,
            description: elem.text,
            input_message_content: {
                message_text: `${elem.name}\n\n${elem.text}\n${elem.link}`
            },
            url: elem.link
        };
    });
    ctx.answerInlineQuery(output);
});
bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
async function getContent(url) {
    const test = await (0, node_fetch_1.default)(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html'
        }
    });
    return { content: await test.text(), correlationId: test.headers.get('x-correlationid') };
}
//# sourceMappingURL=index.js.map