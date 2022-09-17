# Retrieve reviews from Tripadvisor with Puppeteer (in Sept 2022)!

With Puppeteer it wasn't so difficult to retrieve all the reviews for a specific "Thing to do" on Tripadvisor.  


# What to do

First retrieve the Tripadvisor id from the attraction url page.  

for example g187261-d7680662
from a long Tripadvisor URL. 

## Let's run

Just edit the index.ts typescript file to your requirements, example for the id we grab before.  
```javascript
import {tripReviewHarvest,true} from  './trip-harvester'
import  fs  from  "fs/promises";

const  reviews = await  tripReviewHarvest('g187261-d7680662')

await  fs.writeFile(
`out-reviews-${'g187261-d7680662'}-${Math.floor(Date.now() / 1000)}.json`,
JSON.stringify(reviews)
);
```
After that we can run the harvester:
```bash
npm run scrap
```
After a while we get all the reviews in a json file.
```javascript
{
    "globalRating": 4.5,
    "reviews": [
        {
            "reviewId": "852911023",
            "reviewerUrl": "https://www.tripadvisor.com/Profile/kleclercq",
            "reviewerName": "klerclercq",
            "reviewDate": "Aug 2022",
            "rating": 5,
            "title": "Une superbe orga canyoning",
            "text": "ne superbe matinee avec Jeremy pour une sortie canyoning  Nous en faisons chaque année avec nos deux filles et c’est le meilleur spot, super diversifié (tyrolienne saut rappel …)  On a adoré En plus un service au top : emmenés et ramenés car nous ne souhaitons pas toucher à la",
            "exp": "",
            "url": "https://www.tripadvisor.com/ShowUserReviews-g187261-d7680662-r852911023"
        },
        {
            "reviewId": "849994274",
            "reviewerUrl": "https://www.tripadvisor.com/Profile/tedsouder",
            "reviewerName": "Ted S",
            "reviewDate": "Jul 2022",
            "rating": 5,
            "title": "Paragliding in Chamonix is not to be missed! Call the team at Evolution 2 to book your trip today!",
            "text": "Really incredible experience in Chamonix. I was there with my son and nephew and was able to schedule a last-minute, 45-minute paragliding session for all three of us. Our guides met us at the lift at the agreed-upon time, they were super nice and helpful answering all our",
            "exp": "",
            "url": "https://www.tripadvisor.com/ShowUserReviews-g187261-d7680662-r849994274"
        },
// lot of entries
  ]
}
```
## Is it legal ?

So is it legal or illegal? Web scraping and crawling aren’t illegal by themselves. After all, you could scrape or crawl your own website, without a hitch. If you scrap the reviews of your own company it is not.

## How to debug ?

Turn false the headless param

This is my vscode launch.json
```json
{
 "version": "0.2.0",
    "configurations": [
	{
            "name": "Debug Typescript",
            "type": "node",
            "request": "launch",
            "args": ["${relativeFile}"],
            "runtimeArgs": ["--loader", "ts-node/esm", "--experimental-specifier-resolution=node"],
            "cwd": "${workspaceRoot}",
            "protocol": "inspector",
            "internalConsoleOptions": "openOnSessionStart"
          }
    ]
}
```