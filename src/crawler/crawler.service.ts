import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
import {Browser, Page} from 'puppeteer';
import {ProfileType} from "../types/profileType";

@Injectable()
export class CrawlerService {
    parseQuery(str: string): string {
        return encodeURIComponent(str);
    }

    async openGoogle(query: string, page: Page): Promise<string[]> {
        console.log('Opening Google...');
        await page.goto(`https://google.com/search?q=${this.parseQuery(query)}`, { waitUntil: 'networkidle2' });

        return await page.evaluate(() => {
            const listGoogleResult = document.querySelectorAll('.g');
            const linkResult: string[] = [];

            for (let i = 0; i < listGoogleResult.length; i++) {
                const aElem = listGoogleResult[i].getElementsByTagName('a');
                for (let j = 0; j < aElem.length; j++) {
                    const href = aElem[j].getAttribute('href');
                    if (href != null && href.indexOf('linkedin.com') > 1 && href.indexOf('translate.google') < 0) {
                        linkResult.push(href);
                    }
                }
            }
            return linkResult;
        });
    }

    async scrapLinkedin(link: string, browser: Browser): Promise<any> {
        try{
            const profilePage = await browser.newPage();
            await profilePage.goto(link);
            await profilePage.waitForNavigation({waitUntil: 'load'});

            const dismissBtn = await profilePage.waitForSelector('.modal__dismiss');
            await dismissBtn.click();

            await profilePage.evaluate(async (): Promise<ProfileType> => {
                await profilePage.waitForSelector('h1.top-card-layout__title');
                const userFullName = await profilePage.$eval('h1.top-card-layout__title', (name) => name.innerText)
                console.log('userFullName: ', userFullName);

                const lastJob = '';
                const userLocation = '';
                const profileHeadline = '';
                const lastEducation = '';

                return {
                    userFullName: userFullName,
                    lastJob: lastJob,
                    location: userLocation,
                    profileHeadline: profileHeadline,
                    lastEducation: lastEducation
                };
            });
        }catch (error) {
            console.error('Error occurred while scraping LinkedIn profile:', error);
            return null;
        }
    }

    async LinkedinProfile(query?: string): Promise<void> {
        const browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
            ],
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1000, height: 926 });

        try {
            if (query) {
                const googleLinks = await this.openGoogle(query, page);
                const result: any[] = [];

                for (let x = 0; x < googleLinks.length; x++) {
                    const link = googleLinks[x];

                    const objProfile = await this.scrapLinkedin(link, browser);
                    if (objProfile) {
                        objProfile.link = link;
                        result.push(objProfile);
                    }
                }

                console.log(result);
            } else {
                console.log('No query provided.');
            }
        } catch (error) {
            console.error('Error occurred:', error);
        } finally {
            await browser.close();
        }
    }
}
