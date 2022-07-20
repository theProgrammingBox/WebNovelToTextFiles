require('dotenv').config();
const puppeteer = require("puppeteer");
const fs = require('fs');

const novelUrl = process.env.NOVEL_URL;
const maxChapters = process.env.MAX_CHAPTERS;
const novelName = process.env.NOVEL_NAME;

const chaptersCompleted = fs.readFileSync(`chaptersCompleted.txt`, 'utf8');
const numberOfProcesses = 8;
var chaptersDone = 0;

function makeFile(file, content) {
    fs.writeFile(file, content, err => {
        if (err) { console.error(err); }
    });
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
    await page.goto(`${novelUrl}${chpt}`);
    const texts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(
            "body > div.wrap > div > div.site-content > div > div > div > div > div > div > div.c-blog-post > div.entry-content > div > div > div > div > p"
        )).map((p) => p.innerText);
    });
    await browser.close();

    Promise.all(texts).then((texts) => {
        makeFile(`./textFiles/${novelName} chapter ${chpt}.txt`, texts.join(" "));
        fs.appendFileSync(`chaptersCompleted.txt`, `${chpt} `);
        console.log(`${++chaptersDone} / ${maxChapters}`);
        getChapter(chpt + numberOfProcesses);
    });
}

console.log("Starting...");
for (let i = 0; i <= numberOfProcesses; i++) {
    getChapter(i);
}