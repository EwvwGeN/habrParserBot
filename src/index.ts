import {Context, Markup, Telegraf} from 'telegraf';
import { Update } from 'typegram';
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
import fetch from "node-fetch";


const bot: Telegraf<Context<Update>> = new Telegraf("");



bot.start((ctx) => {
    ctx.reply('Hello ' + ctx.from.first_name + '!');
});
bot.help((ctx) => {
    ctx.reply('Send /start to receive a greeting');
});

bot.on('inline_query', async (ctx) =>{
    if (ctx.inlineQuery.query == " ")
    {
        return;
    }
    let mainurl: string = `https://habr.com`;
    let url: string = `${mainurl}/ru/search/?q=${ctx.inlineQuery.query.trim().replace(" ", "%20")}`;
    let ansRes: Array<{name: string, text: string, link: string}> = new Array<{name: string; text: string; link: string}>();
    await getContent(url).then(
        result =>
        {
            let articleBody;
            const dom = new JSDOM(result.content);
            const articlesList = dom.window.document.getElementsByTagName("article")
            for (const elem of articlesList)
            {
                const articleHeader = [...[...elem.getElementsByTagName("h2")][0].getElementsByTagName("a")];
                const articleLink = mainurl + articleHeader[0].href;
                if (articleHeader[0] === undefined)
                {
                    console.log("broken header: " + articlesList);
                    return;
                }
                const articleName = articleHeader[0].textContent;
                if ([...elem.getElementsByClassName("article-formatted-body article-formatted-body article-formatted-body_version-1")][0] === undefined)
                {
                    articleBody = [...elem.getElementsByClassName("article-formatted-body article-formatted-body article-formatted-body_version-2")][0];
                }

                else
                {
                    articleBody = [...elem.getElementsByClassName("article-formatted-body article-formatted-body article-formatted-body_version-1")][0];
                }

                if (articleBody === undefined)
                {
                    console.log("empty: " + articleLink);
                    continue;
                }
                if (articleBody.querySelector('pre') != null)
                {
                    articleBody.querySelectorAll('pre').forEach( del => {
                        del.remove();
                    });
                }

                if (articleBody.querySelector('br') != null)
                {
                    articleBody.querySelectorAll('br').forEach( del => {
                        del.remove();
                    });
                }

                let articleDescription = articleBody.textContent.replaceAll("\n", '');
                if (articleDescription.length > 500)
                {
                    articleDescription = articleDescription.slice(0, 500).trim() + '...';
                }
                ansRes.push({
                    name: articleName,
                    text: articleDescription,
                    link: articleLink,
                })
            }
        }
    );
    const output = ansRes.map((elem: any, index: number) => {
        return {
            type: 'article',
            id: String(index),
            title: elem.name,
            description: elem.text,
            input_message_content:
                {
                    message_text: `${elem.name}\n\n${elem.text}\n${elem.link}`
                },
            url: elem.link
        }
    })

    ctx.answerInlineQuery(output);
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

async function getContent(url: string)
{
    const test = await fetch(url,
        {
            method: 'GET',
            headers:
                {
                    'Content-Type': 'text/html'
                }
        });
    return { content: await test.text(), correlationId: test.headers.get('x-correlationid') };
}