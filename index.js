require('dotenv').config();
const puppeteer = require("puppeteer");
const fs = require('fs');

const novelChapterUrl = process.env.NOVEL_CHAPTER_URL;

getNovelDetails(process.env.NOVEL_URL).then((novelDetails) => {
    const maxChapters = novelDetails[0];
    const novelName = novelDetails[1];
    const chaptersCompleted = fs.readFileSync(`chaptersCompleted.txt`, 'utf8');
    const numberOfProcesses = 8;
    var chaptersDone = 0;

    console.log(`Latest chapter: ${maxChapters}`)
    for (let i = 1; i <= numberOfProcesses; i++) {
        getChapter(i);
    }

    async function getChapter(chpt) {
        if (chpt > maxChapters) { return; }
        if (fs.existsSync(`chaptersCompleted.txt`)) {
            if (chaptersCompleted.includes(chpt)) {
                console.log(`Chapter ${chpt} already completed`);
                chaptersDone++;
                getChapter(chpt + numberOfProcesses);
                return;
            }
        }
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(`${novelChapterUrl}${chpt}`);
        const texts = await page.evaluate(() => {
            return Array.from(document.querySelectorAll(
                "body > div.wrap > div > div.site-content > div > div > div > div > div > div > div.c-blog-post > div.entry-content > div > div > div > div > p"
            )).map((p) => p.innerText);
        });
        await browser.close();

        Promise.all(texts).then((texts) => {
            fs.writeFile(`./textFiles/${novelName} chapter ${chpt}.txt`,
                texts.join(" "), err => {
                if (err) { console.error(err); }
            });
            fs.appendFileSync(`chaptersCompleted.txt`, `${chpt} `);
            console.log(`${++chaptersDone} / ${maxChapters}`);
            getChapter(chpt + numberOfProcesses);
        });
    }
});

async function getNovelDetails(novelUrl) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(novelUrl);
    await page.evaluate(() => { });
    await new Promise(resolve => setTimeout(resolve, 1000));
    latestChapter = await page.evaluate(() => {
        return document.querySelector(
            "body > div.wrap > div > div.site-content > div > div.c-page-content.style-1 > div > div > div > div > div > div.c-page > div"
        ).innerText;
    });
    let novelName = await page.evaluate(() => {
        return document.querySelector(
            "body > div.wrap > div > div.site-content > div > div.profile-manga.summary-layout-1 > div > div > div > div.post-title > h1"
        ).innerText;
    });
    await browser.close();
    let chapterNumber = latestChapter.substring(
        latestChapter.indexOf("Chapter") + 8
    )

    return [
        chapterNumber.substring(0, chapterNumber.indexOf(" ")),
        novelName
    ];
}