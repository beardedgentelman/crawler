import {Controller, Get, Query} from '@nestjs/common';
import {CrawlerService} from "./crawler.service";

@Controller('crawler')
export class CrawlerController {
    constructor(private readonly crawlerService: CrawlerService) {}

    // Query example: http://localhost:5000/crawler?name=Andrii%20Hirskyi&country=Ukraine
    @Get()
    async crawlLinkedinProfiles(
        @Query('email') email?: string,
        @Query('name') name?: string,
        @Query('country') country?: string,
    ): Promise<any> {
        let query = 'site:linkedin.com/in/'

        if (email) {
            query += ` AND "${email}"`
        }
        if (name) {
            query += ` AND "${name}"`
        }
        if (country) {
            query += ` AND "${country}"`
        }
        if (query) {
            try {
                const result = await this.crawlerService.LinkedinProfile(query);
                return { success: true, data: result };
            } catch (error) {
                return { success: false, message: 'Error occurred while crawling LinkedIn profiles.' };
            }
        } else {
            return { success: false, message: 'Please provide a valid query.' };
        }
    }
}
