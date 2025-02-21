const puppeteer = require('puppeteer');
const assert = require('assert');
let browser, page;

const puppeteerArgs = [
    `--disable-extensions-except=${__dirname}`,
    `--load-extension=${__dirname}`,
    '--disable-features=DialMediaRouteProvider',
];

describe('Extension', async() => {

    beforeEach(async function () {
        browser = await puppeteer.launch({
            headless: false,
            slowMo: 50,
            args: puppeteerArgs
        });
        [page] = await browser.pages();
        const targets = browser.targets();
        const extensionTarget = targets.find(target => target.type() === 'service_worker');
        const partialExtensionUrl = extensionTarget.url() || '';
        const [, , extensionId] = partialExtensionUrl.split('/');

        const extensionUrl = `chrome-extension://${extensionId}/popup.html`;

        await page.goto(extensionUrl, {waitUntil: ['domcontentloaded', "networkidle2"], timeout: 0});

        await page.waitForXPath("/html/head/title");
        
    });

    afterEach(async function() {
        await browser.close();
      });

    it('Title name', (async () => {
  
        const titleSelector = await page.$x("/html/head/title");

        const title = await page.evaluate(el => el.textContent, titleSelector[0])
        assert.equal(title, 'Youtube History Caption Search');
    }));

    it('Toggle switch class name', (async () => {
        const toggleSelector = await page.$x('/html/body/div/label/span');

        const toggleClass = await page.evaluate(el => el.getAttribute('class'), toggleSelector[0]);
        assert.equal(toggleClass, 'slider');

    }));

    it('Toggle switch', (async () => {
        
        const [toggleSelector] = await page.$x('//*[@id="toggleButton"]');
        var toggleClass = await page.evaluate(el => el.getAttribute('class'), toggleSelector);
        assert.equal(toggleClass, null);

        await toggleSelector.evaluate(b => b.click());

        toggleClass = await page.evaluate(el => el.getAttribute('class'), toggleSelector);
        assert.equal(toggleClass, 'active');

    }));

    it('Status button', (async () => {
        
        const [toggleSelector] = await page.$x('//*[@id="toggleButton"]');
        var toggleClass = await page.evaluate(el => el.getAttribute('class'), toggleSelector);
        assert.equal(toggleClass, null);

        const youtubeURL = 'https://www.youtube.com/watch?v=VULO2EL4A3Q&';

        const ytbPage = await browser.newPage();
        await ytbPage.goto(youtubeURL, { waitUntil: ['domcontentloaded', 'networkidle2'], timeout: 0 });

        await ytbPage.waitForSelector('img.ytp-button.status-btn');

        var statusBtnSelector = 'img.ytp-button.status-btn';

        // Check if it's red and has the right title at first
        var statusBtnStyle = await ytbPage.$eval(statusBtnSelector, el => el.getAttribute('style'));
        assert.equal(statusBtnStyle, 'filter: invert(12%) sepia(78%) saturate(7358%) hue-rotate(2deg) brightness(97%) contrast(116%);');

        var statusBtnTitle = await ytbPage.$eval(statusBtnSelector, el => el.getAttribute('title'));
        assert.equal(statusBtnTitle, 'Video not stored, click to store');

        await toggleSelector.evaluate(b => b.click());

        toggleClass = await page.evaluate(el => el.getAttribute('class'), toggleSelector);
        assert.equal(toggleClass, 'active');

        await ytbPage.waitForTimeout(3000); //Waiting for the video to download

        // Check if it's green and has the right title
        statusBtnStyle = await ytbPage.$eval(statusBtnSelector, el => el.getAttribute('style'));
        assert.equal(statusBtnStyle, 'filter: invert(58%) sepia(64%) saturate(2319%) hue-rotate(78deg) brightness(114%) contrast(131%);');

        statusBtnTitle = await ytbPage.$eval(statusBtnSelector, el => el.getAttribute('title'));
        assert.equal(statusBtnTitle, 'Video stored, click to delete');

    }));

});