import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const URL = 'https://www.worksafe.wa.gov.au/schedule-fireworks-events';

async function scrapeFireworks() {
  try {
    console.log('Fetching fireworks schedule from WorkSafe WA...');
    const response = await fetch(URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const events = [];
    
    // Find the table with fireworks events
    $('table tbody tr').each((index, element) => {
      const $row = $(element);
      const cells = $row.find('td');
      
      if (cells.length >= 4) {
        const dateStr = $(cells[0]).text().trim();
        const timeDuration = $(cells[1]).text().trim();
        const location = $(cells[2]).text().trim();
        const purpose = $(cells[3]).text().trim();
        
        // Parse time and duration
        const timeMatch = timeDuration.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/);
        const durationMatch = timeDuration.match(/(\d+)\s*(?:minute|minutes|min)/i);
        
        const time = timeMatch ? timeMatch[1] : '';
        const duration = durationMatch ? `${durationMatch[1]} minutes` : '';
        
        // Parse date - format is like "11/12/2025Thursday"
        const dateMatch = dateStr.match(/^(\d{1,2}\/\d{1,2}\/\d{4})/);
        let date = '';
        if (dateMatch) {
          const [day, month, year] = dateMatch[1].split('/');
          date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        if (date && time && location) {
          events.push({
            date,
            time,
            duration: duration || 'Unknown',
            location,
            purpose: purpose || 'Fireworks display',
            lat: 0, // Will be filled by geocoding script
            lng: 0, // Will be filled by geocoding script
          });
        }
      }
    });
    
    console.log(`Found ${events.length} fireworks events`);
    
    // Save to JSON file
    const outputPath = join(__dirname, '../public/fireworks-data.json');
    writeFileSync(outputPath, JSON.stringify(events, null, 2));
    
    console.log(`Data saved to ${outputPath}`);
    return events;
  } catch (error) {
    console.error('Error scraping fireworks data:', error);
    throw error;
  }
}

scrapeFireworks();

